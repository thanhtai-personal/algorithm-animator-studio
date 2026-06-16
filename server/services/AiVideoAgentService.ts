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
  AgentVoiceProvider,
  AgentWorkflowStageId,
  AgentWorkflowStageStatus,
  CreateAgentVideoJobBody,
  CreateAgentVideoPlanBody,
} from "../models/AiVideoAgent";
import { getPiperModels } from "../config/piperModels";
import { ensureDirectoryExists, sanitizeFileBaseName } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { validateGenerateRequest, generateAudioFile } from "./TtsGenerationService";
import { generateElevenLabsAudio } from "./ElevenLabsService";
import { generateSupertonicAudio } from "./SupertonicService";
import { generateVieneuAudio } from "./VieneuService";
import { generateRvcApplioSpeech } from "./RvcApplioService";
import { generateVideoFromAudio } from "./VideoService";
import { renderRemotionVideo } from "./RemotionRenderService";
import { buildAgentRemotionVideoInput, normalizeAgentRenderSettings } from "./AiVideoAgentRemotionRender";
import { getAgentFallbackDurationSec, splitDurationAcrossScenes } from "./AiVideoAgentFallbackTiming";
import { createGradientPng } from "../utils/simplePng";
import { createPublishJob } from "./PublishQueueService";
import { notifyBackgroundJobsChanged } from "./BackgroundJobsRealtimeService";
import { listGeneratedVideos, resolveGeneratedVideoPath } from "../utils/videoOutput";

const JOBS_FILE_NAME = "ai-video-agent-jobs.json";
const MAX_JOBS = 200;
const MAX_LOGS = 120;
const STALE_RUNNING_JOB_MS = 2 * 60 * 60 * 1000;
const IN_MEMORY_RUNNING_JOBS = new Set<string>();

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: "algorithm-shorts",
    title: "Short thuật toán Agent",
    description: "Agent cho màn hình Short thuật toán: hook mạnh, scene ngắn, metadata YouTube/TikTok.",
    kind: "algorithm",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts lập trình.",
    targetDurationSec: 45,
    extraInstruction: "Ưu tiên hình ảnh trực quan, code mapping ngắn, tránh nói quá học thuật.",
  },
  {
    id: "maze-pathfinding",
    title: "Tìm đường mê cung Agent",
    description: "Agent cho màn hình tìm đường mê cung: dựng nội dung đua pathfinding và giải thích thuật toán.",
    kind: "algorithm",
    platform: "youtube-short",
    language: "vi",
    tone: "Kịch tính, trực quan, nhịp nhanh, giải thích dễ hiểu như một trận đua thuật toán.",
    targetDurationSec: 55,
    extraInstruction: "Tập trung vào mê cung, đường đi, so sánh chiến thuật tìm đường và kết quả thắng/thua.",
  },
  {
    id: "algorithm-long",
    title: "Video thuật toán dài Agent",
    description: "Agent cho màn hình Video thuật toán dài: outline chapter, script dài, voice và metadata.",
    kind: "algorithm",
    platform: "youtube-long",
    language: "vi",
    tone: "Rõ ràng, có cấu trúc, phù hợp video dài YouTube.",
    targetDurationSec: 240,
    extraInstruction: "Chia scene có chapter, recap và ý tưởng cắt ra Shorts.",
  },
  {
    id: "github-trending",
    title: "Video GitHub trend Agent",
    description: "Agent cho /algorithms/github-trending: nghiên cứu repo open source trending, chọn angle, script giới thiệu và metadata.",
    kind: "algorithm",
    platform: "youtube-long",
    language: "vi",
    tone: "Hiện đại, gọn, developer-friendly, giải thích repo bằng lợi ích thực tế.",
    targetDurationSec: 120,
    extraInstruction: "Tập trung vào repo GitHub trending/open source: vấn đề giải quyết, điểm nổi bật, stars/language nếu có, ai nên thử và CTA xem link repo.",
  },
  {
    id: "story-video",
    title: "Video truyện Agent",
    description: "Agent cho màn hình Video truyện: narration, nhịp cảm xúc, cảnh nền và voice-over.",
    kind: "story",
    platform: "youtube-short",
    language: "vi",
    tone: "Kể chuyện lôi cuốn, giàu hình ảnh, có cao trào cuối.",
    targetDurationSec: 60,
    extraInstruction: "Tạo narration tự nhiên để đọc voice-over, tránh câu quá dài.",
  },
  {
    id: "story-author",
    title: "Sáng tác truyện Agent",
    description: "Agent cho màn hình Sáng tác truyện: premise, outline, chương và hướng phát triển.",
    kind: "story",
    platform: "youtube-long",
    language: "vi",
    tone: "Giàu hình ảnh, có cao trào, mạch truyện rõ và giữ được giọng kể nhất quán.",
    targetDurationSec: 300,
    extraInstruction: "Tập trung vào cấu trúc truyện, nhân vật, xung đột, outline chương và đoạn mở đầu có sức hút.",
  },
  {
    id: "story-review",
    title: "Review truyện Agent",
    description: "Agent cho màn hình Review truyện: tóm tắt, đánh giá, script review và CTA.",
    kind: "story",
    platform: "youtube-short",
    language: "vi",
    tone: "Review lôi cuốn, rõ ý, có nhận xét cá nhân nhưng tránh spoil quá đà.",
    targetDurationSec: 60,
    extraInstruction: "Tạo hook review, tóm tắt không spoil nặng, điểm đáng xem và câu hỏi kéo tương tác.",
  },
  {
    id: "mu-news",
    title: "Tin tức MU Agent",
    description: "Agent cho màn hình Tin tức MU: headline, bối cảnh, bình luận, CTA.",
    kind: "football",
    platform: "youtube-short",
    language: "vi",
    tone: "Nhiệt, gãy gọn, hơi bình luận bóng đá, không giật tít quá đà.",
    targetDurationSec: 55,
    extraInstruction: "Không bịa số liệu chuyển nhượng. Nếu thiếu nguồn thì ghi cần kiểm chứng.",
  },
];

export function listAgentPresets() {
  return AGENT_PRESETS;
}

export async function createAgentVideoPlan(body: CreateAgentVideoPlanBody, envOverrides: RuntimeEnvValues = {}) {
  const input = normalizePlanInput(body);
  const aiPlan = await tryCreatePlanWithConfiguredProvider(input, envOverrides);
  if (!aiPlan && input.agentPreset === "custom") {
    throw new Error("Custom agent cần AI API key hợp lệ. Custom không dùng fallback local.");
  }
  return aiPlan || createLocalFallbackPlan(input, createFallbackWarning(input, envOverrides));
}

export function listAgentVideoJobs(envOverrides: RuntimeEnvValues = {}) {
  return reconcilePersistedJobs(readJobs(envOverrides), envOverrides);
}

export function getAgentVideoJob(id: string, envOverrides: RuntimeEnvValues = {}) {
  return listAgentVideoJobs(envOverrides).find((job) => job.id === id) || null;
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
  IN_MEMORY_RUNNING_JOBS.add(job.id);
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
    job = await runStage(job, "voice", envOverrides, 55, `Đang tạo voice-over bằng ${voiceProviderLabel(job.input.voiceProvider)}...`, async (current) => {
      const audio = await createNarrationAudio(current, narration, envOverrides);
      return updateJob(current.id, envOverrides, {
        artifacts: { ...current.artifacts, audioRelativePath: audio.relativePath, audioUrl: audio.audioUrl },
      });
    });

    job = await runStage(job, "render", envOverrides, 78, "Đang render MP4 bằng Remotion module template...", async (current) => {
      if (!current.artifacts?.audioRelativePath) throw new Error("Thiếu audio để render video.");
      const video = await renderAgentVideo(current, narration, envOverrides);
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
    IN_MEMORY_RUNNING_JOBS.delete(job.id);
    return addAndPersistLog(job, envOverrides, "success", "AI Agent pipeline đã hoàn tất trên máy local.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent tạo video thất bại.";
    const failedStage = findRunningStage(job)?.id;
    if (failedStage) job = markStage(job, failedStage, "failed", envOverrides, job.progress, message);
    job = updateJob(job.id, envOverrides, { status: "failed", error: message, currentStep: "Lỗi", progress: Math.max(job.progress, 1) });
    IN_MEMORY_RUNNING_JOBS.delete(job.id);
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
  const fallbackWarning = id === "research" ? result.plan?.warning : "";
  const done = markStage(result, id, "done", envOverrides, progress, fallbackWarning || "Hoàn tất.");
  if (fallbackWarning) return addAndPersistLog(done, envOverrides, "warning", fallbackWarning, id);
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
    voiceProvider: normalizeVoiceProvider(body.voiceProvider),
    piperModelKey: models[modelKey] ? modelKey : input.language === "vi" ? "vi_vais1000" : "en_lessac",
    elevenModelId: String(body.elevenModelId || "eleven_flash_v2_5"),
    elevenVoiceId: String(body.elevenVoiceId || ""),
    supertonicVoice: String(body.supertonicVoice || "M1"),
    supertonicTotalSteps: clampNumber(Number(body.supertonicTotalSteps), 8, 5, 12),
    vieneuVoiceId: String(body.vieneuVoiceId || ""),
    vieneuMode: String(body.vieneuMode || "turbo"),
    vieneuEmotion: String(body.vieneuEmotion || "natural"),
    applioTtsTemplateId: String(body.applioTtsTemplateId || ""),
    speechRate: clampNumber(Number(body.speechRate), 0.9, 0.5, 1.4),
    sentenceSilence: clampNumber(Number(body.sentenceSilence), 0.25, 0, 2),
    ...normalizeAgentRenderSettings({ ...body, ...input }),
    autoCreatePublishJobs: Boolean(body.autoCreatePublishJobs),
    publishTargets: normalizePublishTargets(body.publishTargets),
    publishChannels: normalizePublishChannels(body.publishChannels),
    publishScheduledAt: String(body.publishScheduledAt || body.scheduledAt || ""),
    publishPrivacyStatus: String(body.publishPrivacyStatus || env.YOUTUBE_PRIVACY_STATUS || "private"),
  };
}

async function tryCreatePlanWithConfiguredProvider(input: ReturnType<typeof normalizePlanInput>, envOverrides: RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
  const provider = getAgentAiProvider(env);
  if (provider === "openai" || provider === "openai-compatible") return tryCreatePlanWithOpenAiCompatible(input, env);
  return tryCreatePlanWithGemini(input, env);
}

function getAgentAiProvider(env: RuntimeEnvValues) {
  return (env.AI_AGENT_PROVIDER || "gemini").toLowerCase();
}

function hasConfiguredAgentApiKey(env: RuntimeEnvValues) {
  const provider = getAgentAiProvider(env);
  if (provider === "openai" || provider === "openai-compatible") return Boolean(env.OPENAI_API_KEY);
  return Boolean(env.AI_SHORTS_API_KEY);
}

function createFallbackWarning(input: ReturnType<typeof normalizePlanInput>, envOverrides: RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
  const presetTitle = AGENT_PRESETS.find((item) => item.id === input.agentPreset)?.title || input.agentPreset || "agent";
  if (!hasConfiguredAgentApiKey(env)) return `Không có API key, đang dùng fallback dữ liệu của ${presetTitle}.`;
  return `AI không tạo được plan hợp lệ, đang dùng fallback dữ liệu của ${presetTitle}.`;
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
  const context = fallbackContext(input.agentPreset, vi);
  const scenes = [
    [context.hookTitle, context.hook(topic)],
    [context.problemTitle, context.problem(topic)],
    [context.bodyTitle, context.body(topic)],
    [context.recapTitle, context.recap(topic)],
  ];
  const sceneDurations = splitDurationAcrossScenes(getAgentFallbackDurationSec(input), scenes.length);
  return {
    title: context.title(topic),
    description: context.description(topic),
    tags: defaultTags(input),
    hook: scenes[0][1],
    researchSummary: context.research(topic),
    contentAngles: context.angles,
    audiencePersona: context.audience,
    thumbnailPrompt: vi ? `Thumbnail rõ ràng, tương phản cao, chủ đề ${topic}` : `Clean high contrast thumbnail about ${topic}`,
    scenes: scenes.map(([title, narration], index) => ({
      id: `scene-${index + 1}`,
      title,
      narration,
      onScreenText: title,
      visualPrompt: context.visual(topic),
      brollPrompt: context.broll,
      editInstruction: context.edit,
      durationSec: sceneDurations[index] || 8,
    })),
    publishNotes: [vi ? "Plan local fallback: nên duyệt lại script trước khi đăng." : "Local fallback plan: review script before publishing."],
    engagementPrompts: [vi ? "Bạn muốn mình giải thích thuật toán nào tiếp theo?" : "Which concept should I explain next?"],
    monetizationIdeas: [vi ? "Gắn CTA xem video dài hoặc playlist liên quan." : "Add CTA to the long video or related playlist."],
    repurposeIdeas: [vi ? "Cắt riêng cảnh hook làm Shorts phụ." : "Cut the hook as a separate Short."],
    warning,
  };
}

function fallbackContext(agentPreset: string, vi: boolean) {
  const generic = {
    title: (topic: string) => vi ? `${topic} giải thích bằng hình ảnh` : `${topic} explained visually`,
    description: (topic: string) => vi ? `Video được tạo bằng AI Video Agent local của KAI STUDIO. Chủ đề: ${topic}.` : `Generated by KAI STUDIO local AI Video Agent. Topic: ${topic}.`,
    research: (topic: string) => vi ? `Plan fallback local cho chủ đề ${topic}. Nên kiểm tra lại dữ kiện nếu đây là tin tức.` : `Local fallback plan for ${topic}. Verify facts if this is news content.`,
    hookTitle: vi ? "Mở đầu" : "Hook",
    problemTitle: vi ? "Vấn đề" : "Problem",
    bodyTitle: vi ? "Giải thích trực quan" : "Visual explanation",
    recapTitle: vi ? "Tóm tắt" : "Recap",
    hook: (topic: string) => vi ? `Bạn từng thắc mắc ${topic} thực sự hoạt động thế nào chưa? Trong video này, mình sẽ biến nó thành hình ảnh thật dễ hiểu.` : `Ever wondered how ${topic} really works? In this video, we turn it into a simple visual story.`,
    problem: () => vi ? "Trước khi đi vào chi tiết, hãy nhìn vấn đề cốt lõi: dữ liệu đi vào, từng bước biến đổi, rồi tạo ra kết quả cuối cùng." : "Before the details, look at the core problem: data comes in, changes step by step, then becomes the final result.",
    body: () => vi ? "Hãy theo dõi từng chuyển động. Mỗi lần highlight là một quyết định, mỗi lần đổi vị trí là một bước tiến gần hơn đến lời giải." : "Watch each movement. Every highlight is a decision, and every change moves us closer to the solution.",
    recap: (topic: string) => vi ? `Tóm lại, điểm quan trọng nhất của ${topic} là hiểu được luồng xử lý, không chỉ nhớ công thức. Lưu video này nếu bạn muốn xem lại nhanh.` : `In short, the key to ${topic} is understanding the flow, not memorizing formulas. Save this video for a quick review.`,
    angles: [vi ? "Giải thích bằng hình ảnh" : "Visual explanation", vi ? "Dễ hiểu cho người mới" : "Beginner-friendly"],
    audience: vi ? "Người xem muốn hiểu nhanh bằng hình ảnh." : "Viewers who want a quick visual explanation.",
    visual: (topic: string) => vi ? `Nền công nghệ tối, chữ lớn, nhấn mạnh ${topic}` : `Dark tech background, large text, focus on ${topic}`,
    broll: vi ? "Animation đơn giản, chữ nổi bật, chuyển cảnh nhanh." : "Simple animation, strong text, fast cuts.",
    edit: vi ? "Giữ nhịp nhanh, subtitle rõ." : "Keep pacing fast and subtitles clear.",
  };
  if (agentPreset === "maze-pathfinding") return { ...generic, title: (topic: string) => vi ? `${topic} - cuộc đua tìm đường mê cung` : `${topic} maze pathfinding race`, angles: [vi ? "Đua thuật toán" : "Algorithm race", vi ? "So sánh đường đi" : "Path comparison"] };
  if (agentPreset === "story-author") return { ...generic, title: (topic: string) => vi ? `Khung truyện: ${topic}` : `Story outline: ${topic}`, bodyTitle: vi ? "Khung chương" : "Chapter outline", angles: [vi ? "Xây dựng nhân vật" : "Character building", vi ? "Xung đột và cao trào" : "Conflict and climax"] };
  if (agentPreset === "story-review") return { ...generic, title: (topic: string) => vi ? `Review truyện: ${topic}` : `Story review: ${topic}`, angles: [vi ? "Tóm tắt không spoil nặng" : "Low-spoiler recap", vi ? "Điểm đáng xem" : "Why it is worth watching"] };
  if (agentPreset === "mu-news") return { ...generic, title: (topic: string) => vi ? `Tin MU: ${topic}` : `MU news: ${topic}`, angles: [vi ? "Headline bóng đá" : "Football headline", vi ? "Bối cảnh cần kiểm chứng" : "Context to verify"] };
  if (agentPreset === "story-video") return { ...generic, angles: [vi ? "Kể chuyện cảm xúc" : "Emotional narration", vi ? "Cảnh nền điện ảnh" : "Cinematic background"] };
  if (agentPreset === "algorithm-long") return { ...generic, title: (topic: string) => vi ? `${topic} - video dài có chapter` : `${topic} long-form chaptered explainer`, angles: [vi ? "Chapter rõ ràng" : "Clear chapters", vi ? "Có recap và ví dụ" : "Recap and examples"] };
  if (agentPreset === "github-trending") return {
    ...generic,
    title: (topic: string) => vi ? `GitHub trend: ${topic}` : `GitHub trending: ${topic}`,
    description: (topic: string) => vi ? `Video giới thiệu open source trending được tạo bằng KAI STUDIO. Chủ đề/repo: ${topic}.` : `Open source trending video generated by KAI STUDIO. Topic/repo: ${topic}.`,
    research: (topic: string) => vi ? `Plan fallback cho GitHub trending: ${topic}. Nên kiểm tra stars, license và activity repo trước khi đăng.` : `Fallback plan for GitHub trending: ${topic}. Verify stars, license and repo activity before publishing.`,
    hookTitle: vi ? "Repo đáng chú ý" : "Trending repo hook",
    problemTitle: vi ? "Vấn đề repo giải quyết" : "Problem solved",
    bodyTitle: vi ? "Điểm nổi bật open source" : "Open source highlights",
    recapTitle: vi ? "Ai nên thử" : "Who should try it",
    hook: (topic: string) => vi ? `Có một repo GitHub đang nổi lên quanh ${topic}, và lý do nó đáng xem không chỉ nằm ở số sao.` : `A GitHub project around ${topic} is trending, and the reason to watch it is not just the star count.`,
    problem: (topic: string) => vi ? `Repo này nên được giới thiệu theo vấn đề nó giải quyết: ${topic}, workflow developer, khả năng áp dụng thật và mức độ dễ thử.` : `Frame this repo by the problem it solves: ${topic}, developer workflow, practical use cases, and how easy it is to try.`,
    body: () => vi ? "Video nên đi qua 3 ý: repo làm gì, vì sao cộng đồng chú ý, và điểm nào đáng thử ngay trong project thật." : "The video should cover three beats: what it does, why the community cares, and what is worth trying in a real project.",
    recap: () => vi ? "Tóm lại, đừng chỉ nhìn stars. Hãy xem repo còn active không, giải quyết đúng pain point không, và có phù hợp stack của bạn không." : "In short, do not only look at stars. Check whether it is active, whether it solves your pain point, and whether it fits your stack.",
    angles: [vi ? "Open source trending" : "Trending open source", vi ? "Developer tools" : "Developer tools", vi ? "Repo đáng thử" : "Repo worth trying"],
    audience: vi ? "Developer muốn cập nhật công cụ GitHub mới và repo đáng thử." : "Developers tracking useful GitHub projects and open source tools.",
    visual: (topic: string) => vi ? `GitHub card, terminal, stars, language tags, repo ${topic}` : `GitHub card, terminal, stars, language tags, repo ${topic}`,
    broll: vi ? "Card repo, biểu đồ stars, terminal demo, chuyển cảnh công nghệ." : "Repo cards, star chart, terminal demo, tech transitions.",
    edit: vi ? "Nhịp nhanh nhưng rõ, hiện rõ tên repo và lợi ích." : "Fast but clear pacing, keep repo name and benefits readable.",
  };
  return generic;
}

function defaultTags(input: ReturnType<typeof normalizePlanInput>) {
  if (input.kind === "football") return ["football", "manchester united", "mu news", "shorts"];
  if (input.kind === "story") return ["story", "audiobook", "ai video", "shorts"];
  if (input.agentPreset === "github-trending") return ["github", "open source", "developer tools", "kai studio"];
  return ["algorithm", "programming", "visualization", "kai studio"];
}

function buildNarration(plan?: AgentVideoPlan) {
  return (plan?.scenes || []).map((scene) => scene.narration.trim()).filter(Boolean).join("\n\n");
}

function buildFinalDescription(plan?: AgentVideoPlan) {
  const notes = [plan?.description || "", ...(plan?.publishNotes || [])].filter(Boolean);
  return notes.join("\n\n").slice(0, 5000);
}

async function createNarrationAudio(job: AgentVideoJob, text: string, envOverrides: RuntimeEnvValues) {
  const fileName = sanitizeFileBaseName(`agent-${job.plan?.title || job.input.topic}`);
  const segments = job.plan?.scenes?.map((scene) => scene.narration.trim()).filter(Boolean);
  if (job.input.voiceProvider === "elevenlabs") return generateElevenLabsAudio({
    text,
    modelId: job.input.elevenModelId,
    voiceId: job.input.elevenVoiceId,
    fileName,
  }, envOverrides);
  if (job.input.voiceProvider === "supertonic") return generateSupertonicAudio({
    text,
    segments,
    voice: job.input.supertonicVoice,
    lang: job.input.language,
    speed: job.input.speechRate,
    totalSteps: job.input.supertonicTotalSteps,
    fileName,
    responseFormat: "wav",
  }, envOverrides);
  if (job.input.voiceProvider === "vieneu") return generateVieneuAudio({
    text,
    segments,
    fileName,
    mode: job.input.vieneuMode,
    emotion: job.input.vieneuEmotion,
    voiceId: job.input.vieneuVoiceId,
  }, envOverrides);
  if (job.input.voiceProvider === "applio") return generateRvcApplioSpeech({
    text,
    segments,
    fileName,
    templateId: job.input.applioTtsTemplateId,
  }, envOverrides);
  const request = validateGenerateRequest({
    text,
    modelKey: job.input.piperModelKey,
    fileName,
    sentenceSilence: job.input.sentenceSilence,
    speechRate: job.input.speechRate,
  }, envOverrides);
  if ("status" in request) throw new Error(String(request.body.error || "Không tạo được voice."));
  return generateAudioFile(request, envOverrides);
}

async function renderAgentVideo(job: AgentVideoJob, narration: string, envOverrides: RuntimeEnvValues) {
  try {
    return await renderRemotionVideo({
      input: buildAgentRemotionVideoInput({ job, narration }),
      envOverrides,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Remotion render thất bại.";
    const warned = addAndPersistLog(job, envOverrides, "warning", `${message} Đang fallback sang FFmpeg local.`, "render");
    const background = await createAgentBackground(warned, envOverrides);
    const audioPath = path.resolve(getGeneratedAudioPath(warned.artifacts?.audioRelativePath || "", envOverrides));
    const video = await generateVideoFromAudio({
      audioPath,
      imagePath: background.path,
      options: {
        aspectRatio: warned.input.renderAspectRatio === "16:9" || (warned.input.renderAspectRatio === "auto" && warned.input.platform === "youtube-long") ? "16:9" : "9:16",
        backgroundType: background.type,
        fitMode: "cover",
        videoFileName: sanitizeFileBaseName(warned.plan?.title || warned.input.topic),
        backgroundMusicVolume: warned.input.renderBackgroundMusicVolume,
        backgroundMusicLoop: Boolean(warned.input.renderBackgroundMusicUrl),
        backgroundMusicFadeIn: 0,
        backgroundMusicFadeOut: 0,
      },
      envOverrides,
    });
    if (background.temporary) fs.rm(background.path, { force: true }, () => undefined);
    return video;
  }
}

async function createAgentBackground(job: AgentVideoJob, envOverrides: RuntimeEnvValues) {
  const fallbackVideo = findFallbackBackgroundVideo(job, envOverrides);
  if (fallbackVideo) return fallbackVideo;

  const portrait = job.input.platform !== "youtube-long";
  const width = portrait ? 1080 : 1920;
  const height = portrait ? 1920 : 1080;
  const outputPath = path.join(os.tmpdir(), `kai-agent-bg-${job.id}.png`);
  const png = createGradientPng(width, height, job.input.topic);
  await fs.promises.writeFile(outputPath, png);
  return { path: outputPath, type: "image" as const, temporary: true };
}

function findFallbackBackgroundVideo(job: AgentVideoJob, envOverrides: RuntimeEnvValues) {
  const videos = listGeneratedVideos(envOverrides)
    .filter((video) => !video.relativePath.includes(job.id))
    .map((video) => ({ video, score: scoreFallbackVideo(video.fileName, job) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.video.createdAtMs - a.video.createdAtMs);
  const selected = videos[0]?.video;
  if (!selected) return null;
  const resolved = resolveGeneratedVideoPath(selected.relativePath, envOverrides);
  if (!fs.existsSync(resolved.absolutePath)) return null;
  return { path: resolved.absolutePath, type: "video" as const, temporary: false };
}

function scoreFallbackVideo(fileName: string, job: AgentVideoJob) {
  const haystack = `${fileName} ${job.input.agentPreset} ${job.input.kind} ${job.input.topic}`.toLowerCase();
  const keywords = fallbackVideoKeywords(job);
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}

function fallbackVideoKeywords(job: AgentVideoJob) {
  if (job.input.agentPreset === "maze-pathfinding") return ["maze", "path", "pathfinding", "me-cung", "mê-cung"];
  if (job.input.agentPreset === "github-trending") return ["github", "open-source", "opensource", "repo", "developer", "tool"];
  if (job.input.agentPreset === "mu-news" || job.input.kind === "football") return ["mu", "manchester", "football", "bong-da", "bóng-đá", "news"];
  if (job.input.kind === "story") return ["story", "truyen", "truyện", "review", "chapter"];
  if (job.input.kind === "algorithm") return ["algorithm", "sort", "bubble", "maze", "pathfinding", "thuat-toan", "thuật-toán"];
  return ["agent", "video", "remotion"];
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

function reconcilePersistedJobs(jobs: AgentVideoJob[], envOverrides: RuntimeEnvValues) {
  const now = Date.now();
  let changed = false;
  const next = jobs.map((job) => {
    if (job.status !== "running" || IN_MEMORY_RUNNING_JOBS.has(job.id) || now - (job.updatedAtMs || job.createdAtMs || 0) < STALE_RUNNING_JOB_MS) return job;
    changed = true;
    const runningStage = findRunningStage(job)?.id;
    const message = "Job đang chạy bị gián đoạn hoặc stale sau khi app/server restart. Hãy chạy lại job nếu cần.";
    return {
      ...job,
      status: "failed",
      error: message,
      currentStep: "Lỗi",
      updatedAtMs: now,
      steps: (job.steps?.length ? job.steps : createWorkflowSteps()).map((step) => step.status === "running" ? {
        ...step,
        status: "failed",
        message,
        updatedAtMs: now,
        completedAtMs: now,
      } : step),
      logs: [{ id: crypto.randomUUID(), atMs: now, stageId: runningStage, level: "error", message }, ...(job.logs || [])].slice(0, MAX_LOGS),
    } as AgentVideoJob;
  });
  if (changed) writeJobs(next, envOverrides);
  return next;
}

function writeJobs(jobs: AgentVideoJob[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(path.join(dataDir, JOBS_FILE_NAME), JSON.stringify(jobs, null, 2), "utf8");
  notifyBackgroundJobsChanged();
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

function normalizeVoiceProvider(value: unknown): AgentVoiceProvider {
  return value === "elevenlabs" || value === "supertonic" || value === "vieneu" || value === "applio" ? value : "piper";
}

function voiceProviderLabel(provider: AgentVoiceProvider) {
  if (provider === "elevenlabs") return "ElevenLabs";
  if (provider === "supertonic") return "Supertonic";
  if (provider === "vieneu") return "VieNeu";
  if (provider === "applio") return "Applio TTS";
  return "Piper local";
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
