import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR } from "../config/paths";
import type { AgentWorkflowSuggestion, CreatePublishJobBody, PublishHistoryItem, PublishJob, PublishJobStatus, PublishPlatform } from "../models/PublishQueue";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { resolveGeneratedVideoPath } from "../utils/videoOutput";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const JOBS_FILE_NAME = "publish-jobs.json";
const HISTORY_FILE_NAME = "publish-history.json";
const MAX_HISTORY_ITEMS = 1000;

export function listPublishJobs(envOverrides: RuntimeEnvValues = {}): PublishJob[] {
  return readJobs(envOverrides).sort((a, b) => sortJob(b) - sortJob(a));
}

export function listPublishHistory(envOverrides: RuntimeEnvValues = {}): PublishHistoryItem[] {
  return readHistory(envOverrides);
}

export function createPublishJob(body: CreatePublishJobBody, envOverrides: RuntimeEnvValues = {}) {
  const now = Date.now();
  const platform = normalizePlatform(body.platform);
  const source = body.source || (body.videoRelativePath ? "generated-video" : "local-file");
  const resolved = resolveSourcePath(source, body.videoRelativePath, body.localFilePath);
  const scheduledAtMs = normalizeScheduledAt(body.scheduledAt);
  const status: PublishJobStatus = scheduledAtMs && scheduledAtMs > now ? "scheduled" : "queued";
  const title = String(body.title || resolved.sourceFileName || "Untitled video").trim();

  if (!title) throw new Error("Thiếu tiêu đề publish job.");

  const job: PublishJob = {
    id: crypto.randomUUID(),
    platform,
    status,
    source,
    sourceRelativePath: resolved.sourceRelativePath,
    sourceFilePath: resolved.sourceFilePath,
    sourceFileName: resolved.sourceFileName,
    title,
    description: String(body.description || ""),
    tags: body.tags || "",
    privacyStatus: body.privacyStatus || defaultPrivacy(platform),
    publishAt: body.publishAt || body.scheduledAt || "",
    scheduledAtMs,
    channelId: body.channelId || "",
    channelTitle: body.channelTitle || "",
    providerAccountId: body.providerAccountId || body.channelId || "",
    youtubeRefreshToken: body.youtubeRefreshToken || "",
    youtubePlaylistId: body.youtubePlaylistId || "",
    madeForKids: Boolean(body.madeForKids),
    notifySubscribers: Boolean(body.notifySubscribers),
    containsSyntheticMedia: body.containsSyntheticMedia !== false,
    attempts: 0,
    maxAttempts: 3,
    progress: 0,
    message: status === "scheduled" ? "Đã lên lịch, chờ tới giờ chạy local app." : "Đã đưa vào hàng đợi local.",
    createdAtMs: now,
    updatedAtMs: now,
  };

  writeJobs([job, ...readJobs(envOverrides)], envOverrides);
  return job;
}

export function updatePublishJob(jobId: string, patch: Partial<PublishJob>, envOverrides: RuntimeEnvValues = {}) {
  let updated: PublishJob | null = null;
  const jobs = readJobs(envOverrides).map((job) => {
    if (job.id !== jobId) return job;
    updated = { ...job, ...patch, updatedAtMs: Date.now() };
    return updated;
  });

  if (!updated) throw new Error("Không tìm thấy publish job.");
  writeJobs(jobs, envOverrides);
  return updated;
}

export function cancelPublishJob(jobId: string, envOverrides: RuntimeEnvValues = {}) {
  const job = readJobs(envOverrides).find((item) => item.id === jobId);
  if (!job) throw new Error("Không tìm thấy publish job.");
  if (job.status === "running") throw new Error("Job đang chạy, không thể hủy giữa chừng.");
  return updatePublishJob(jobId, { status: "cancelled", message: "Đã hủy job." }, envOverrides);
}

export function retryPublishJob(jobId: string, envOverrides: RuntimeEnvValues = {}) {
  const job = readJobs(envOverrides).find((item) => item.id === jobId);
  if (!job) throw new Error("Không tìm thấy publish job.");
  return updatePublishJob(jobId, {
    status: "queued",
    progress: 0,
    message: "Đã đưa job vào hàng đợi chạy lại.",
    completedAtMs: undefined,
    startedAtMs: undefined,
  }, envOverrides);
}

export function claimNextDuePublishJob(envOverrides: RuntimeEnvValues = {}) {
  const now = Date.now();
  const jobs = readJobs(envOverrides);
  const index = jobs.findIndex((job) => {
    if (job.status !== "queued" && job.status !== "scheduled") return false;
    return !job.scheduledAtMs || job.scheduledAtMs <= now;
  });

  if (index < 0) return null;

  const job = jobs[index];
  const claimed: PublishJob = {
    ...job,
    status: "running",
    progress: 5,
    attempts: job.attempts + 1,
    startedAtMs: now,
    updatedAtMs: now,
    message: "Đang chạy publish job trên máy local.",
  };
  jobs[index] = claimed;
  writeJobs(jobs, envOverrides);
  return claimed;
}

export function completePublishJob(
  jobId: string,
  status: Extract<PublishJobStatus, "success" | "failed" | "manual_required">,
  patch: Partial<PublishJob>,
  envOverrides: RuntimeEnvValues = {}
) {
  const completed = updatePublishJob(jobId, {
    ...patch,
    status,
    progress: status === "success" ? 100 : 0,
    completedAtMs: Date.now(),
  }, envOverrides);

  recordPublishHistory({
    jobId: completed.id,
    platform: completed.platform,
    status: status === "success" ? "success" : status === "manual_required" ? "manual_required" : "failure",
    sourceFileName: completed.sourceFileName,
    sourceRelativePath: completed.sourceRelativePath,
    title: completed.title,
    channelId: completed.channelId,
    channelTitle: completed.channelTitle,
    resultId: completed.resultId,
    resultUrl: completed.resultUrl,
    message: completed.message,
  }, envOverrides);

  return completed;
}

export function recordPublishHistory(
  item: Omit<PublishHistoryItem, "id" | "attemptedAtMs">,
  envOverrides: RuntimeEnvValues = {}
) {
  const nextItem: PublishHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    attemptedAtMs: Date.now(),
  };
  const next = [nextItem, ...readHistory(envOverrides)].slice(0, MAX_HISTORY_ITEMS);
  writeHistory(next, envOverrides);
  return nextItem;
}

export function getPublishAgentSuggestions(envOverrides: RuntimeEnvValues = {}): AgentWorkflowSuggestion[] {
  const jobs = readJobs(envOverrides);
  const history = readHistory(envOverrides);
  const suggestions: AgentWorkflowSuggestion[] = [];
  const failedCount = jobs.filter((job) => job.status === "failed").length;
  const dueCount = jobs.filter((job) => (job.status === "queued" || job.status === "scheduled") && (!job.scheduledAtMs || job.scheduledAtMs <= Date.now())).length;
  const manualCount = jobs.filter((job) => job.status === "manual_required").length;

  if (dueCount) suggestions.push({
    id: "run-due-jobs",
    title: "Chạy các job đã tới giờ",
    description: `${dueCount} job đang chờ xử lý. Local app phải mở thì scheduler mới chạy được.`,
    actionLabel: "Run due jobs",
    severity: "warning",
  });

  if (failedCount) suggestions.push({
    id: "retry-failed-jobs",
    title: "Kiểm tra job lỗi",
    description: `${failedCount} job lỗi. Thường do token hết hạn, quyền API thiếu hoặc file video bị xóa.`,
    actionLabel: "Review failed jobs",
    severity: "warning",
  });

  if (manualCount) suggestions.push({
    id: "finish-manual-jobs",
    title: "Hoàn tất các job cần thao tác tay",
    description: `${manualCount} job cần mở nền tảng để xác nhận/post thủ công, nhất là Instagram hoặc TikTok inbox upload.`,
    actionLabel: "Open manual jobs",
    severity: "info",
  });

  if (!history.length) suggestions.push({
    id: "create-first-publish-job",
    title: "Tạo publish job đầu tiên",
    description: "Chọn video trong thư mục generated, chọn kênh, đặt lịch rồi để queue xử lý trên máy local.",
    actionLabel: "Create job",
    severity: "info",
  });

  if (!suggestions.length) suggestions.push({
    id: "workflow-healthy",
    title: "Publishing workflow đang sạch",
    description: "Không có job lỗi hoặc job quá hạn. Có thể tiếp tục tạo batch video mới.",
    actionLabel: "Keep producing",
    severity: "success",
  });

  return suggestions;
}

export function getPublishJobFilePath(job: PublishJob) {
  if (job.source === "generated-video" && job.sourceRelativePath) {
    return resolveGeneratedVideoPath(job.sourceRelativePath).absolutePath;
  }
  if (job.source === "local-file" && job.sourceFilePath) {
    return job.sourceFilePath;
  }
  throw new Error("Job chưa có đường dẫn video hợp lệ.");
}

function readJobs(envOverrides: RuntimeEnvValues = {}): PublishJob[] {
  const file = getJobsFile(envOverrides);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as PublishJob[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: PublishJob[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(getJobsFile(envOverrides), JSON.stringify(jobs, null, 2), "utf8");
}

function readHistory(envOverrides: RuntimeEnvValues = {}): PublishHistoryItem[] {
  const file = getHistoryFile(envOverrides);
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as PublishHistoryItem[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeHistory(items: PublishHistoryItem[], envOverrides: RuntimeEnvValues = {}) {
  const dataDir = getServerDataDir(envOverrides);
  ensureDirectoryExists(dataDir);
  fs.writeFileSync(getHistoryFile(envOverrides), JSON.stringify(items, null, 2), "utf8");
}

function resolveSourcePath(source: string, relativePath?: string, localFilePath?: string) {
  if (source === "generated-video") {
    const resolved = resolveGeneratedVideoPath(String(relativePath || ""));
    if (!fs.existsSync(resolved.absolutePath)) throw new Error("Không tìm thấy video generated để đưa vào hàng đợi.");
    return {
      sourceRelativePath: resolved.relativePath,
      sourceFilePath: resolved.absolutePath,
      sourceFileName: path.basename(resolved.relativePath),
    };
  }

  const filePath = String(localFilePath || "").trim();
  if (!filePath) throw new Error("Thiếu đường dẫn file video local.");
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) throw new Error("Không tìm thấy file video local.");
  return { sourceFilePath: absolutePath, sourceFileName: path.basename(absolutePath) };
}

function normalizePlatform(value: unknown): PublishPlatform {
  if (value === "youtube" || value === "facebook" || value === "tiktok" || value === "instagram") return value;
  throw new Error("Nền tảng publish không hợp lệ.");
}

function normalizeScheduledAt(value: string | undefined) {
  const raw = value?.trim();
  if (!raw) return undefined;
  const timestamp = Date.parse(raw);
  if (!Number.isFinite(timestamp)) throw new Error("Lịch publish không hợp lệ.");
  return timestamp;
}

function defaultPrivacy(platform: PublishPlatform) {
  if (platform === "youtube") return "private";
  if (platform === "tiktok") return "SELF_ONLY";
  return "published";
}

function getJobsFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), JOBS_FILE_NAME);
}

function getHistoryFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), HISTORY_FILE_NAME);
}

function getServerDataDir(envOverrides: RuntimeEnvValues = {}) {
  const configuredPath = readEnvValues(envOverrides).SERVER_DATA_DIR || SERVER_DATA_DIR;
  const trimmed = configuredPath.trim();
  if (!trimmed) return SERVER_DATA_DIR;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}

function sortJob(job: PublishJob) {
  return job.scheduledAtMs || job.createdAtMs;
}
