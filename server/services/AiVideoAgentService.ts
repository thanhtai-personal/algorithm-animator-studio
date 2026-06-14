import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR, getGeneratedDir } from "../config/paths";
import type {
  AgentPreset,
  AgentVideoJob,
  AgentVideoJobLog,
  AgentVideoJobStep,
  AgentVideoPlan,
  AgentVideoPlatform,
  AgentVideoPublishChannel,
  AgentVideoPublishTarget,
  AgentWorkflowStageId,
  AgentWorkflowStageStatus,
  CreateAgentVideoJobBody,
  CreateAgentVideoPlanBody,
} from "../models/AiVideoAgent";
import { getPiperModels } from "../config/piperModels";
import { ensureDirectoryExists, sanitizeFileBaseName } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { validateGenerateRequest, generateAudioFile } from "./TtsGenerationService";
import { generateVideoFromAudio } from "./VideoService";
import { createGradientPng } from "../utils/simplePng";
import { createPublishJob } from "./PublishQueueService";

const JOBS_FILE_NAME = "ai-video-agent-jobs.json";
const MAX_JOBS = 200;
const MAX_LOGS = 120;

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: "algorithm-shorts",
    title: "Algorithm Shorts Agent",
    description: "Tạo Shorts giải thích thuật toán: hook mạnh, scene ngắn, metadata YouTube/TikTok.",
    kind: "algorithm",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts lập trình.",
    targetDurationSec: 45,
    extraInstruction: "Ưu tiên hình ảnh trực quan, code mapping ngắn, tránh nói quá học thuật.",
  },
  {
    id: "mu-news-shorts",
    title: "MU News Agent",
    description: "Tạo video tin Manchester United ngắn: headline, bối cảnh, bình luận, CTA.",
    kind: "football",
    platform: "youtube-short",
    language: "vi",
    tone: "Nhiệt, gãy gọn, hơi bình luận bóng đá, không giật tít quá đà.",
    targetDurationSec: 55,
    extraInstruction: "Không bịa số liệu chuyển nhượng. Nếu thiếu nguồn thì ghi cần kiểm chứng.",
  },
  {
    id: "story-recap",
    title: "Story Video Agent",
    description: "Tạo video kể chuyện/truyện audio ngắn có hook, nhịp cảm xúc và cảnh nền.",
    kind: "story",
    platform: "youtube-short",
    language: "vi",
    tone: "Kể chuyện lôi cuốn, giàu hình ảnh, có cao trào cuối.",
    targetDurationSec: 60,
    extraInstruction: "Tạo narration tự nhiên để đọc voice-over, tránh câu quá dài.",
  },
  {
    id: "long-explainer",
    title: "Long Explainer Agent",
    description: "Tạo outline video dài 16:9: research, script, voice, metadata, repurpose Shorts.",
    kind: "algorithm",
    platform: "youtube-long",
    language: "vi",
    tone: "Rõ ràng, có cấu trúc, phù hợp video dài YouTube.",
    targetDurationSec: 240,
    extraInstruction: "Chia scene có chapter, recap và ý tưởng cắt ra Shorts.",
  },
];

export function listAgentPresets() {
  return AGENT_PRESETS;
}

export async function createAgentVideoPlan(body: CreateAgentVideoPlanBody, envOverrides: RuntimeEnvValues = {}) {
  const input = normalizePlanInput(body);
  const aiPlan = await tryCreatePlanWithConfiguredProvider(input, envOverrides);
  return aiPlan || createLocalFallbackPlan(input, "Chưa cấu hình AI hoặc AI trả kết quả không hợp lệ, đã dùng plan local.");
}

export function listAgentVideoJobs(envOverrides: RuntimeEnvValues = {}) {
  return readJobs(envOverrides);
}

export function getAgentVideoJob(id: string, envOverrides: RuntimeEnvValues = {}) {
  return readJobs(envOverrides).find((job) => job.id === id) || null;
}

export async function createAgentVideoJob(body: CreateAgentVideoJobBody, envOverrides: RuntimeEnvValues = {}) {
  const input = normalizeJobInput(body, envOverrides);
  const job: AgentVideoJob = {
    id: crypto.randomUUID(),
    status: body.scheduledAt ? "queued" : "draft",
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    scheduledAtMs: parseScheduledAt(body.scheduledAt),
    input,
    progress: 0,
    steps: createWorkflowSteps(),
    logs: [],
    plan: body.plan,
  };
  const initialized = addLog(job, "info", "Đã tạo AI Agent job local.");
  writeJobs([initialized, ...readJobs(envOverrides)].slice(0, MAX_JOBS), envOverrides);

  if (body.runNow) return runAgentVideoJob(initialized.id, envOverrides);
  return initialized;
}

export async function runAgentVideoJob(id: string, envOverrides: RuntimeEnvValues = {}) {
  let job = getRequiredJob(id, envOverrides);
  if (job.status === "cancelled") return job;
  job = updateJob(job.id, envOverrides, { status: "running", progress: 3, error: "", currentStep: "Research", logs: job.logs || [] });
  job = addAndPersistLog(job, envOverrides, "info", "Bắt đầu chạy local AI Agent pipeline.");

  try {
    if (!job.plan) {
      job = await runStage(job, "research", envOverrides, 8, "Đang nghiên cứu chủ đề, audience và góc nội dung...", async (current) => {
        const plan = await createAgentVideoPlan(current.input, envOverrides);
        return updateJob(current.id, envOverrides, { plan, progress: 18 });
      });
    } else {
      job = markStage(job, "research", "done", envOverrides, 100, "Dùng plan đã duyệt từ màn hình.");
      job = updateJob(job.id, envOverrides, { progress: 18 });
    }

    job = await runStage(job, "strategy", envOverrides, 24, "Đang chốt format, hook, angle và publish notes...", async (current) => current);
    job = await runStage(job, "script", envOverrides, 32, "Đang khóa narration theo scene để tạo voice-over...", async (current) => current);
    job = await runStage(job, "visuals", envOverrides, 40, "Đang dựng visual prompt và background local...", async (current) => current);

    const narration = buildNarration(job.plan);
    job = await runStage(job, "voice", envOverrides, 55, "Đang tạo voice-over local bằng Piper...", async (current) => {
      const audio = await createPiperNarrationAudio(current, narration, envOverrides);
      return updateJob(current.id, envOverrides, {
        artifacts: { ...current.artifacts, audioRelativePath: audio.relativePath, audioUrl: audio.audioUrl },
      });
    });

    const backgroundPath = await createAgentBackground(job);
    job = await runStage(job, "render", envOverrides, 78, "Đang render MP4 bằng FFmpeg local...", async (current) => {
      if (!current.artifacts?.audioRelativePath) throw new Error("Thiếu audio để render video.");
      const audioPath = path.resolve(getGeneratedAudioPath(current.artifacts.audioRelativePath, envOverrides));
      const video = await generateVideoFromAudio({
        audioPath,
        imagePath: backgroundPath,
        options: {
          aspectRatio: current.input.platform === "youtube-long" ? "16:9" : "9:16",
          backgroundType: "image",
          fitMode: "cover",
          videoFileName: sanitizeFileBaseName(current.plan?.title || current.input.topic),
          backgroundMusicVolume: 0,
          backgroundMusicLoop: false,
          backgroundMusicFadeIn: 0,
          backgroundMusicFadeOut: 0,
        },
        envOverrides,
      });
      fs.rm(backgroundPath, { force: true }, () => undefined);
      return updateJob(current.id, envOverrides, {
        artifacts: { ...current.artifacts, videoRelativePath: video.relativePath, videoUrl: video.videoUrl },
      });
    });

    job = await runStage(job, "metadata", envOverrides, 88, "Đang đóng gói title, description, tags và checklist...", async (current) => updateJob(current.id, envOverrides, {
      artifacts: {
        ...current.artifacts,
        metadata: {
          title: current.plan?.title || current.input.topic,
          description: buildFinalDescription(current.plan),
          tags: current.plan?.tags?.join(", ") || "",
        },
      },
    }));

    job = await runStage(job, "publish", envOverrides, 94, "Đang nối output vào Publish Queue local...", async (current) => createPublishJobsForAgent(current, envOverrides));
    job = await runStage(job, "engage", envOverrides, 97, "Đã tạo prompt gợi ý bình luận/tương tác sau khi đăng.", async (current) => current);
    job = await runStage(job, "monetize", envOverrides, 100, "Đã tạo ý tưởng CTA/monetize/repurpose cho video.", async (current) => current);

    job = updateJob(job.id, envOverrides, { status: "success", progress: 100, currentStep: "Hoàn tất" });
    return addAndPersistLog(job, envOverrides, "success", "AI Agent pipeline đã hoàn tất trên máy local.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent tạo video thất bại.";
    const failedStage = findRunningStage(job)?.id;
    if (failedStage) job = markStage(job, failedStage, "failed", envOverrides, job.progress, message);
    job = updateJob(job.id, envOverrides, { status: "failed", error: message, currentStep: "Lỗi", progress: Math.max(job.progress, 1) });
    return addAndPersistLog(job, envOverrides, "error", message, failedStage);
  }
}

export async function runDueAgentVideoJobs(envOverrides: RuntimeEnvValues = {}) {
  const now = Date.now();
  const due = readJobs(envOverrides).filter((job) => job.status === "queued" && (job.scheduledAtMs || 0) <= now);
  const results: AgentVideoJob[] = [];
  for (const job of due) results.push(await runAgentVideoJob(job.id, envOverrides));
  return { ok: true, ran: results.length, jobs: results };
}

export function cancelAgentVideoJob(id: string, envOverrides: RuntimeEnvValues = {}) {
  let job = updateJob(id, envOverrides, { status: "cancelled", currentStep: "Đã hủy" });
  job = addAndPersistLog(job, envOverrides, "warning", "Người dùng đã hủy agent job.");
  return job;
}

async function runStage(job: AgentVideoJob, id: AgentWorkflowStageId, envOverrides: RuntimeEnvValues, progress: number, message: string, action: (job: AgentVideoJob) => Promise<AgentVideoJob>) {
  job = markStage(job, id, "running", envOverrides, progress, message);
  job = addAndPersistLog(job, envOverrides, "info", message, id);
  const result = await action(job);
  const stage = result.steps?.find((step) => step.id === id);
  if (stage?.status === "skipped" || stage?.status === "failed") return result;
  const done = markStage(result, id, "done", envOverrides, progress, "Hoàn tất.");
  return addAndPersistLog(done, envOverrides, "success", `${stage?.label || id} hoàn tất.`, id);
}

function normalizePlanInput(body: CreateAgentVideoPlanBody) {
  const preset = AGENT_PRESETS.find((item) => item.id === body.agentPreset);
  const merged = { ...preset, ...body };
  const language = merged.language === "en" ? "en" : "vi";
  const platform = normalizePlatform(merged.platform);
  return {
    topic: String(merged.topic || "").trim() || "Một video giải thích trực quan bằng KAI STUDIO",
    kind: merged.kind === "football" || merged.kind === "story" || merged.kind === "generic" ? merged.kind : "algorithm",
    platform,
    language,
    tone: String(merged.tone || "Dễ hiểu, nhịp nhanh, tự nhiên").trim(),
    targetDurationSec: clampNumber(Number(merged.targetDurationSec), platform === "youtube-long" ? 180 : 45, 15, 600),
    extraInstruction: String(merged.extraInstruction || "").trim(),
    agentPreset: String(merged.agentPreset || preset?.id || "custom"),
  };
}

function normalizeJobInput(body: CreateAgentVideoJobBody, envOverrides: RuntimeEnvValues) {
  const input = normalizePlanInput(body);
  const env = readEnvValues(envOverrides);
  const modelKey = body.piperModelKey || (input.language === "vi" ? "vi_vais1000" : "en_lessac");
  const models = getPiperModels(env.MODEL_DIR);
  return {
    ...input,
    piperModelKey: models[modelKey] ? modelKey : input.language === "vi" ? "vi_vais1000" : "en_lessac",
    speechRate: clampNumber(Number(body.speechRate), 0.9, 0.5, 1.4),
    sentenceSilence: clampNumber(Number(body.sentenceSilence), 0.25, 0, 2),
    autoCreatePublishJobs: Boolean(body.autoCreatePublishJobs),
    publishTargets: normalizePublishTargets(body.publishTargets),
    publishChannels: normalizePublishChannels(body.publishChannels),
    publishScheduledAt: String(body.publishScheduledAt || body.scheduledAt || ""),
    publishPrivacyStatus: String(body.publishPrivacyStatus || env.YOUTUBE_PRIVACY_STATUS || "private"),
  };
}

async function tryCreatePlanWithConfiguredProvider(input: ReturnType<typeof normalizePlanInput>, envOverrides: RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
  const provider = (env.AI_AGENT_PROVIDER || "gemini").toLowerCase();
  if (provider === "openai" || provider === "openai-compatible") return tryCreatePlanWithOpenAiCompatible(input, env);
  return tryCreatePlanWithGemini(input, env);
}

async function tryCreatePlanWithGemini(input: ReturnType<typeof normalizePlanInput>, env: RuntimeEnvValues) {
  const apiKey = env.AI_SHORTS_API_KEY;
  if (!apiKey) return null;
  const model = env.AI_AGENT_TEXT_MODEL || "gemini-2.0-flash";
  const baseUrl = (env.AI_SHORTS_API_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
  try {
    const response = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPlanPrompt(input) }] }],
        generationConfig: { temperature: 0.72, responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
    return normalizePlan(parseJsonPlan(raw), input);
  } catch {
    return null;
  }
}

async function tryCreatePlanWithOpenAiCompatible(input: ReturnType<typeof normalizePlanInput>, env: RuntimeEnvValues) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = env.OPENAI_CHAT_MODEL || env.AI_AGENT_TEXT_MODEL || "gpt-4o-mini";
  const baseUrl = (env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.72,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: buildPlanPrompt(input) }],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return normalizePlan(parseJsonPlan(data.choices?.[0]?.message?.content || ""), input);
  } catch {
    return null;
  }
}

function buildPlanPrompt(input: ReturnType<typeof normalizePlanInput>) {
  const langName = input.language === "vi" ? "Vietnamese" : "English";
  return [
    `You are the local AI Agent pipeline inside KAI STUDIO, inspired by AiToEarn's Create-Publish-Engage-Monetize workflow but adapted for an offline-first desktop app.`,
    `Create a production plan in ${langName}.`,
    `Topic: ${input.topic}`,
    `Agent preset: ${input.agentPreset}`,
    `Content kind: ${input.kind}`,
    `Platform: ${input.platform}`,
    `Target duration: ${input.targetDurationSec} seconds`,
    `Tone: ${input.tone}`,
    input.extraInstruction ? `Extra instruction: ${input.extraInstruction}` : "",
    `Return JSON only with this shape: {"title":"","description":"","tags":[""],"hook":"","researchSummary":"","contentAngles":[""],"audiencePersona":"","thumbnailPrompt":"","scenes":[{"title":"","narration":"","onScreenText":"","visualPrompt":"","brollPrompt":"","editInstruction":"","durationSec":10}],"publishNotes":[""],"engagementPrompts":[""],"monetizationIdeas":[""],"repurposeIdeas":[""]}.`,
    `Use 3-7 scenes. Narration must be ready for TTS. No markdown fences. Do not invent unverifiable news facts; add verification notes when needed.`,
  ].filter(Boolean).join("\n");
}

function parseJsonPlan(raw: string) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)) as Partial<AgentVideoPlan>; } catch { return null; }
}

function normalizePlan(plan: Partial<AgentVideoPlan> | null, input: ReturnType<typeof normalizePlanInput>): AgentVideoPlan | null {
  if (!plan?.title || !Array.isArray(plan.scenes) || !plan.scenes.length) return null;
  return {
    title: String(plan.title).slice(0, 100),
    description: String(plan.description || "").slice(0, 5000),
    tags: Array.isArray(plan.tags) ? plan.tags.map(String).slice(0, 20) : defaultTags(input),
    hook: String(plan.hook || ""),
    thumbnailPrompt: String(plan.thumbnailPrompt || `Clean thumbnail for ${input.topic}`),
    researchSummary: String(plan.researchSummary || "").slice(0, 1200),
    contentAngles: toStringArray(plan.contentAngles).slice(0, 6),
    audiencePersona: String(plan.audiencePersona || "").slice(0, 500),
    scenes: plan.scenes.slice(0, 8).map((scene, index) => ({
      id: `scene-${index + 1}`,
      title: String(scene.title || `Scene ${index + 1}`),
      narration: String(scene.narration || input.topic),
      onScreenText: String(scene.onScreenText || scene.title || input.topic).slice(0, 90),
      visualPrompt: String(scene.visualPrompt || "Simple animated visual"),
      brollPrompt: String(scene.brollPrompt || scene.visualPrompt || "").slice(0, 500),
      editInstruction: String(scene.editInstruction || "").slice(0, 500),
      durationSec: clampNumber(Number(scene.durationSec), Math.round(input.targetDurationSec / plan.scenes!.length), 5, 120),
    })),
    publishNotes: toStringArray(plan.publishNotes).slice(0, 8),
    engagementPrompts: toStringArray(plan.engagementPrompts).slice(0, 6),
    monetizationIdeas: toStringArray(plan.monetizationIdeas).slice(0, 6),
    repurposeIdeas: toStringArray(plan.repurposeIdeas).slice(0, 8),
  };
}

function createLocalFallbackPlan(input: ReturnType<typeof normalizePlanInput>, warning?: string): AgentVideoPlan {
  const vi = input.language === "vi";
  const topic = input.topic;
  const scenes = [
    [vi ? "Mở đầu" : "Hook", vi ? `Bạn từng thắc mắc ${topic} thực sự hoạt động thế nào chưa? Trong video này, mình sẽ biến nó thành hình ảnh thật dễ hiểu.` : `Ever wondered how ${topic} really works? In this video, we turn it into a simple visual story.`],
    [vi ? "Vấn đề" : "Problem", vi ? `Trước khi đi vào chi tiết, hãy nhìn vấn đề cốt lõi: dữ liệu đi vào, từng bước biến đổi, rồi tạo ra kết quả cuối cùng.` : `Before the details, look at the core problem: data comes in, changes step by step, then becomes the final result.`],
    [vi ? "Giải thích trực quan" : "Visual explanation", vi ? `Hãy theo dõi từng chuyển động. Mỗi lần highlight là một quyết định, mỗi lần đổi vị trí là một bước tiến gần hơn đến lời giải.` : `Watch each movement. Every highlight is a decision, and every change moves us closer to the solution.`],
    [vi ? "Tóm tắt" : "Recap", vi ? `Tóm lại, điểm quan trọng nhất của ${topic} là hiểu được luồng xử lý, không chỉ nhớ công thức. Lưu video này nếu bạn muốn xem lại nhanh.` : `In short, the key to ${topic} is understanding the flow, not memorizing formulas. Save this video for a quick review.`],
  ];
  return {
    title: vi ? `${topic} giải thích bằng hình ảnh` : `${topic} explained visually`,
    description: vi ? `Video được tạo bằng AI Video Agent local của KAI STUDIO. Chủ đề: ${topic}.` : `Generated by KAI STUDIO local AI Video Agent. Topic: ${topic}.`,
    tags: defaultTags(input),
    hook: scenes[0][1],
    researchSummary: vi ? `Plan fallback local cho chủ đề ${topic}. Nên kiểm tra lại dữ kiện nếu đây là tin tức.` : `Local fallback plan for ${topic}. Verify facts if this is news content.`,
    contentAngles: [vi ? "Giải thích bằng hình ảnh" : "Visual explanation", vi ? "Dễ hiểu cho người mới" : "Beginner-friendly"],
    audiencePersona: vi ? "Người xem muốn hiểu nhanh bằng hình ảnh." : "Viewers who want a quick visual explanation.",
    thumbnailPrompt: vi ? `Thumbnail rõ ràng, tương phản cao, chủ đề ${topic}` : `Clean high contrast thumbnail about ${topic}`,
    scenes: scenes.map(([title, narration], index) => ({
      id: `scene-${index + 1}`,
      title,
      narration,
      onScreenText: title,
      visualPrompt: vi ? `Nền công nghệ tối, chữ lớn, nhấn mạnh ${topic}` : `Dark tech background, large text, focus on ${topic}`,
      brollPrompt: vi ? "Animation đơn giản, chữ nổi bật, chuyển cảnh nhanh." : "Simple animation, strong text, fast cuts.",
      editInstruction: vi ? "Giữ nhịp nhanh, subtitle rõ." : "Keep pacing fast and subtitles clear.",
      durationSec: Math.max(8, Math.round(input.targetDurationSec / scenes.length)),
    })),
    publishNotes: [vi ? "Plan local fallback: nên duyệt lại script trước khi đăng." : "Local fallback plan: review script before publishing."],
    engagementPrompts: [vi ? "Bạn muốn mình giải thích thuật toán nào tiếp theo?" : "Which concept should I explain next?"],
    monetizationIdeas: [vi ? "Gắn CTA xem video dài hoặc playlist liên quan." : "Add CTA to the long video or related playlist."],
    repurposeIdeas: [vi ? "Cắt riêng cảnh hook làm Shorts phụ." : "Cut the hook as a separate Short."],
    warning,
  };
}

function defaultTags(input: ReturnType<typeof normalizePlanInput>) {
  if (input.kind === "football") return ["football", "manchester united", "mu news", "shorts"];
  if (input.kind === "story") return ["story", "audiobook", "ai video", "shorts"];
  return ["algorithm", "programming", "visualization", "kai studio"];
}

function buildNarration(plan?: AgentVideoPlan) {
  return (plan?.scenes || []).map((scene) => scene.narration.trim()).filter(Boolean).join("\n\n");
}

function buildFinalDescription(plan?: AgentVideoPlan) {
  const notes = [plan?.description || "", ...(plan?.publishNotes || [])].filter(Boolean);
  return notes.join("\n\n").slice(0, 5000);
}

async function createPiperNarrationAudio(job: AgentVideoJob, text: string, envOverrides: RuntimeEnvValues) {
  const request = validateGenerateRequest({
    text,
    modelKey: job.input.piperModelKey,
    fileName: sanitizeFileBaseName(`agent-${job.plan?.title || job.input.topic}`),
    sentenceSilence: job.input.sentenceSilence,
    speechRate: job.input.speechRate,
  }, envOverrides);
  if ("status" in request) throw new Error(String(request.body.error || "Không tạo được voice."));
  return generateAudioFile(request, envOverrides);
}

async function createAgentBackground(job: AgentVideoJob) {
  const portrait = job.input.platform !== "youtube-long";
  const width = portrait ? 1080 : 1920;
  const height = portrait ? 1920 : 1080;
  const outputPath = path.join(os.tmpdir(), `kai-agent-bg-${job.id}.png`);
  const png = createGradientPng(width, height, job.input.topic);
  await fs.promises.writeFile(outputPath, png);
  return outputPath;
}

function createPublishJobsForAgent(job: AgentVideoJob, envOverrides: RuntimeEnvValues) {
  if (!job.input.autoCreatePublishJobs) {
    return markStage(job, "publish", "skipped", envOverrides, job.progress, "Tắt auto publish queue; video chỉ lưu local.");
  }
  const relativePath = job.artifacts?.videoRelativePath;
  if (!relativePath) throw new Error("Không có video để tạo publish job.");

  const selectedChannels = job.input.publishChannels || [];
  if (!selectedChannels.length) {
    throw new Error("Chưa chọn kênh để tạo publish job. Hãy chọn ít nhất một kênh trong bước Publish channels.");
  }

  const created = selectedChannels.map((channel) => createPublishJob({
    platform: channel.platform,
    source: "generated-video",
    videoRelativePath: relativePath,
    title: job.artifacts?.metadata?.title || job.plan?.title || job.input.topic,
    description: job.artifacts?.metadata?.description || job.plan?.description || "",
    tags: job.artifacts?.metadata?.tags || job.plan?.tags?.join(", ") || "",
    privacyStatus: channel.platform === "youtube" ? job.input.publishPrivacyStatus : undefined,
    scheduledAt: job.input.publishScheduledAt,
    publishAt: job.input.publishScheduledAt,
    channelId: channel.platform === "youtube" ? channel.id : channel.providerAccountId || channel.id,
    channelTitle: channel.title,
    providerAccountId: channel.providerAccountId || channel.id,
    youtubeRefreshToken: channel.youtubeRefreshToken,
    youtubePlaylistId: channel.youtubePlaylistId,
    containsSyntheticMedia: true,
  }, envOverrides));
  const next = updateJob(job.id, envOverrides, { artifacts: { ...job.artifacts, publishJobIds: created.map((item) => item.id) } });
  return created.reduce(
    (current, item) => addAndPersistLog(current, envOverrides, "success", `Đã tạo publish job ${item.id.slice(0, 8)} cho ${item.platform} · ${item.channelTitle || item.channelId || "chưa rõ kênh"}.`, "publish"),
    next
  );
}

function createWorkflowSteps(): AgentVideoJobStep[] {
  return [
    { id: "research", label: "Research", status: "pending", progress: 0 },
    { id: "strategy", label: "Strategy", status: "pending", progress: 0 },
    { id: "script", label: "Script", status: "pending", progress: 0 },
    { id: "visuals", label: "Visual plan", status: "pending", progress: 0 },
    { id: "voice", label: "Voice-over", status: "pending", progress: 0 },
    { id: "render", label: "Render", status: "pending", progress: 0 },
    { id: "metadata", label: "Metadata", status: "pending", progress: 0 },
    { id: "publish", label: "Publish queue", status: "pending", progress: 0 },
    { id: "engage", label: "Engage", status: "pending", progress: 0 },
    { id: "monetize", label: "Monetize", status: "pending", progress: 0 },
  ];
}

function markStage(job: AgentVideoJob, id: AgentWorkflowStageId, status: AgentWorkflowStageStatus, envOverrides: RuntimeEnvValues, progress: number, message?: string) {
  const now = Date.now();
  const steps = (job.steps?.length ? job.steps : createWorkflowSteps()).map((step) => {
    if (step.id !== id) return step;
    return {
      ...step,
      status,
      progress: status === "done" ? 100 : Math.max(step.progress || 0, progress),
      message,
      startedAtMs: step.startedAtMs || (status === "running" ? now : undefined),
      updatedAtMs: now,
      completedAtMs: status === "done" || status === "failed" || status === "skipped" ? now : step.completedAtMs,
    };
  });
  const currentStep = steps.find((step) => step.id === id)?.label;
  return updateJob(job.id, envOverrides, { steps, currentStep, progress: Math.max(job.progress, progress) });
}

function addLog(job: AgentVideoJob, level: AgentVideoJobLog["level"], message: string, stageId?: AgentWorkflowStageId): AgentVideoJob {
  const log: AgentVideoJobLog = { id: crypto.randomUUID(), atMs: Date.now(), stageId, level, message };
  return { ...job, logs: [log, ...(job.logs || [])].slice(0, MAX_LOGS) };
}

function addAndPersistLog(job: AgentVideoJob, envOverrides: RuntimeEnvValues, level: AgentVideoJobLog["level"], message: string, stageId?: AgentWorkflowStageId) {
  return updateJob(job.id, envOverrides, addLog(job, level, message, stageId));
}

function updateJob(id: string, envOverrides: RuntimeEnvValues, patch: Partial<AgentVideoJob>) {
  const jobs = readJobs(envOverrides);
  const index = jobs.findIndex((job) => job.id === id);
  if (index < 0) throw new Error("Không tìm thấy agent job.");
  const nextJob = { ...jobs[index], ...patch, updatedAtMs: Date.now() } as AgentVideoJob;
  jobs[index] = nextJob;
  writeJobs(jobs, envOverrides);
  return nextJob;
}

function getRequiredJob(id: string, envOverrides: RuntimeEnvValues) {
  const job = getAgentVideoJob(id, envOverrides);
  if (!job) throw new Error("Không tìm thấy agent job.");
  return { ...job, steps: job.steps?.length ? job.steps : createWorkflowSteps(), logs: job.logs || [] };
}

function readJobs(envOverrides: RuntimeEnvValues = {}): AgentVideoJob[] {
  const filePath = getJobsFile(envOverrides);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as AgentVideoJob[];
    return Array.isArray(data) ? data.map((job) => ({ ...job, steps: job.steps?.length ? job.steps : createWorkflowSteps(), logs: job.logs || [] })) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: AgentVideoJob[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(path.join(dataDir, JOBS_FILE_NAME), JSON.stringify(jobs, null, 2), "utf8");
}

function getJobsFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), JOBS_FILE_NAME);
}

function getServerDataDir(envOverrides: RuntimeEnvValues = {}) {
  const configured = readEnvValues(envOverrides).SERVER_DATA_DIR || SERVER_DATA_DIR;
  return path.isAbsolute(configured) ? configured : path.resolve(PROJECT_ROOT, configured);
}

function getGeneratedAudioPath(relativePath: string, envOverrides: RuntimeEnvValues) {
  return path.join(getGeneratedDir(readEnvValues(envOverrides).SERVER_DATA_DIR), relativePath.replace(/^generated\//, ""));
}

function parseScheduledAt(value?: string) {
  if (!value?.trim()) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function normalizePlatform(value?: AgentVideoPlatform) {
  return value === "youtube-long" || value === "tiktok" || value === "facebook-reel" ? value : "youtube-short";
}

function normalizePublishChannels(value: unknown): AgentVideoPublishChannel[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => item as Partial<AgentVideoPublishChannel>)
    .filter((item) => item && isPublishTarget(item.platform) && String(item.id || item.providerAccountId || "").trim())
    .map((item) => ({
      id: String(item.id || item.providerAccountId || "").trim(),
      platform: item.platform as AgentVideoPublishTarget,
      title: String(item.title || item.id || item.providerAccountId || "Kênh chưa đặt tên").trim(),
      providerAccountId: String(item.providerAccountId || item.id || "").trim(),
      youtubeRefreshToken: String(item.youtubeRefreshToken || ""),
      youtubePlaylistId: String(item.youtubePlaylistId || ""),
    }));
}

function normalizePublishTargets(values?: AgentVideoPublishTarget[]) {
  return (values || []).filter(isPublishTarget);
}

function isPublishTarget(value: unknown): value is AgentVideoPublishTarget {
  return value === "youtube" || value === "facebook" || value === "tiktok" || value === "instagram";
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function findRunningStage(job: AgentVideoJob) {
  return job.steps?.find((step) => step.status === "running");
}

function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
