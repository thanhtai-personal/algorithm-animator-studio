import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR } from "../config/paths";
import type {
  AgentVideoJob,
  AgentVideoJobStep,
  AgentVideoPlan,
  AgentVideoPlatform,
  CreateAgentVideoJobBody,
  CreateAgentVideoPlanBody,
} from "../models/AiVideoAgent";
import { getPiperModels } from "../config/piperModels";
import { ensureDirectoryExists, sanitizeFileBaseName } from "../utils/audioOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";
import { validateGenerateRequest, generateAudioFile } from "./TtsGenerationService";
import { generateVideoFromAudio } from "./VideoService";
import { createGradientPng } from "../utils/simplePng";

const JOBS_FILE_NAME = "ai-video-agent-jobs.json";
const MAX_JOBS = 200;

export async function createAgentVideoPlan(body: CreateAgentVideoPlanBody, envOverrides: RuntimeEnvValues = {}) {
  const input = normalizePlanInput(body);
  const aiPlan = await tryCreatePlanWithGemini(input, envOverrides);
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
    steps: createSteps(),
    plan: body.plan,
  };
  writeJobs([job, ...readJobs(envOverrides)].slice(0, MAX_JOBS), envOverrides);

  if (body.runNow) {
    return runAgentVideoJob(job.id, envOverrides);
  }

  return job;
}

export async function runAgentVideoJob(id: string, envOverrides: RuntimeEnvValues = {}) {
  let job = getRequiredJob(id, envOverrides);
  if (job.status === "cancelled") return job;
  job = updateJob(job.id, envOverrides, { status: "running", progress: 5, error: "", currentStep: "Lập kế hoạch" });

  try {
    if (!job.plan) {
      job = markStep(job, "plan", "running", envOverrides, "Đang tạo plan bằng AI/local fallback...");
      const plan = await createAgentVideoPlan(job.input, envOverrides);
      job = updateJob(job.id, envOverrides, { plan, progress: 20 });
      job = markStep(job, "plan", "done", envOverrides, plan.warning || "Đã có kịch bản.");
    } else {
      job = markStep(job, "plan", "done", envOverrides, "Dùng plan đã duyệt trên màn hình.");
    }

    const narration = buildNarration(job.plan);
    job = markStep(job, "voice", "running", envOverrides, "Đang tạo voice-over local bằng Piper...");
    const audio = await createPiperNarrationAudio(job, narration, envOverrides);
    job = updateJob(job.id, envOverrides, {
      progress: 45,
      artifacts: { ...job.artifacts, audioRelativePath: audio.relativePath, audioUrl: audio.audioUrl },
    });
    job = markStep(job, "voice", "done", envOverrides, audio.warning || "Đã tạo audio.");

    job = markStep(job, "background", "running", envOverrides, "Đang dựng nền video local...");
    const backgroundPath = await createAgentBackground(job);
    job = markStep(job, "background", "done", envOverrides, "Đã tạo nền video.");

    job = markStep(job, "render", "running", envOverrides, "Đang render MP4 bằng FFmpeg...");
    const video = await generateVideoFromAudio({
      audioPath: audio.audioPath,
      imagePath: backgroundPath,
      options: {
        aspectRatio: job.input.platform === "youtube-long" ? "16:9" : "9:16",
        backgroundType: "image",
        fitMode: "cover",
        videoFileName: sanitizeFileBaseName(job.plan?.title || job.input.topic),
        backgroundMusicVolume: 0,
        backgroundMusicLoop: false,
        backgroundMusicFadeIn: 0,
        backgroundMusicFadeOut: 0,
      },
      envOverrides,
    });
    fs.rm(backgroundPath, { force: true }, () => undefined);
    job = updateJob(job.id, envOverrides, {
      progress: 90,
      artifacts: { ...job.artifacts, videoRelativePath: video.relativePath, videoUrl: video.videoUrl },
    });
    job = markStep(job, "render", "done", envOverrides, "Đã render video.");

    job = markStep(job, "metadata", "running", envOverrides, "Đang lưu metadata đăng bài...");
    job = updateJob(job.id, envOverrides, {
      status: "success",
      progress: 100,
      currentStep: "Hoàn tất",
      artifacts: {
        ...job.artifacts,
        videoRelativePath: video.relativePath,
        videoUrl: video.videoUrl,
        metadata: {
          title: job.plan?.title || job.input.topic,
          description: job.plan?.description || "",
          tags: job.plan?.tags?.join(", ") || "",
        },
      },
    });
    return markStep(job, "metadata", "done", envOverrides, "Video đã nằm trong thư viện generated-videos.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent tạo video thất bại.";
    return updateJob(job.id, envOverrides, { status: "failed", error: message, currentStep: "Lỗi", progress: Math.max(job.progress, 1) });
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
  return updateJob(id, envOverrides, { status: "cancelled", currentStep: "Đã hủy" });
}

function normalizePlanInput(body: CreateAgentVideoPlanBody) {
  const language = body.language === "en" ? "en" : "vi";
  const platform = normalizePlatform(body.platform);
  return {
    topic: String(body.topic || "").trim() || "Một video giải thích trực quan bằng KAI STUDIO",
    kind: body.kind === "football" || body.kind === "story" || body.kind === "generic" ? body.kind : "algorithm",
    platform,
    language,
    tone: String(body.tone || "Dễ hiểu, nhịp nhanh, tự nhiên").trim(),
    targetDurationSec: clampNumber(Number(body.targetDurationSec), platform === "youtube-long" ? 180 : 45, 15, 600),
    extraInstruction: String(body.extraInstruction || "").trim(),
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
  };
}

async function tryCreatePlanWithGemini(input: ReturnType<typeof normalizePlanInput>, envOverrides: RuntimeEnvValues) {
  const env = readEnvValues(envOverrides);
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
        generationConfig: { temperature: 0.75, responseMimeType: "application/json" },
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

function buildPlanPrompt(input: ReturnType<typeof normalizePlanInput>) {
  const langName = input.language === "vi" ? "Vietnamese" : "English";
  return [
    `You are the AI Video Agent inside a local desktop app called KAI STUDIO.`,
    `Create a concise video production plan in ${langName}.`,
    `Topic: ${input.topic}`,
    `Content kind: ${input.kind}`,
    `Platform: ${input.platform}`,
    `Target duration: ${input.targetDurationSec} seconds`,
    `Tone: ${input.tone}`,
    input.extraInstruction ? `Extra instruction: ${input.extraInstruction}` : "",
    `Return JSON only with this shape: {"title":"","description":"","tags":[""],"hook":"","thumbnailPrompt":"","scenes":[{"title":"","narration":"","onScreenText":"","visualPrompt":"","durationSec":10}],"publishNotes":[""]}.`,
    `Use 3-6 scenes. Narration must be ready for text-to-speech. Avoid markdown fences.`,
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
    scenes: plan.scenes.slice(0, 8).map((scene, index) => ({
      id: `scene-${index + 1}`,
      title: String(scene.title || `Scene ${index + 1}`),
      narration: String(scene.narration || input.topic),
      onScreenText: String(scene.onScreenText || scene.title || input.topic).slice(0, 90),
      visualPrompt: String(scene.visualPrompt || "Simple animated visual"),
      durationSec: clampNumber(Number(scene.durationSec), Math.round(input.targetDurationSec / plan.scenes!.length), 5, 120),
    })),
    publishNotes: Array.isArray(plan.publishNotes) ? plan.publishNotes.map(String).slice(0, 8) : [],
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
    thumbnailPrompt: vi ? `Thumbnail rõ ràng, tương phản cao, chủ đề ${topic}` : `Clean high contrast thumbnail about ${topic}`,
    scenes: scenes.map(([title, narration], index) => ({
      id: `scene-${index + 1}`,
      title,
      narration,
      onScreenText: title,
      visualPrompt: vi ? `Nền công nghệ tối, chữ lớn, nhấn mạnh ${topic}` : `Dark tech background, large text, focus on ${topic}`,
      durationSec: Math.max(8, Math.round(input.targetDurationSec / scenes.length)),
    })),
    publishNotes: [vi ? "Plan local fallback: nên duyệt lại script trước khi đăng." : "Local fallback plan: review script before publishing."],
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

function createSteps(): AgentVideoJobStep[] {
  return [
    { id: "plan", label: "AI plan/script", status: "pending" },
    { id: "voice", label: "Voice-over", status: "pending" },
    { id: "background", label: "Visual background", status: "pending" },
    { id: "render", label: "Render MP4", status: "pending" },
    { id: "metadata", label: "Metadata", status: "pending" },
  ];
}

function markStep(job: AgentVideoJob, id: AgentVideoJobStep["id"], status: AgentVideoJobStep["status"], envOverrides: RuntimeEnvValues, message?: string) {
  const steps = job.steps.map((step) => step.id === id ? { ...step, status, message, updatedAtMs: Date.now() } : step);
  return updateJob(job.id, envOverrides, { steps, currentStep: steps.find((step) => step.id === id)?.label });
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
  return job;
}

function readJobs(envOverrides: RuntimeEnvValues = {}): AgentVideoJob[] {
  const filePath = getJobsFile(envOverrides);
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as AgentVideoJob[];
    return Array.isArray(data) ? data : [];
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

function parseScheduledAt(value?: string) {
  if (!value?.trim()) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

function normalizePlatform(value?: AgentVideoPlatform) {
  return value === "youtube-long" || value === "tiktok" || value === "facebook-reel" ? value : "youtube-short";
}

function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}
