import crypto from "node:crypto";
import type {
  YoutubeDownloadRequest,
  YoutubeToolsJob,
  YoutubeToolsJobKind,
  YoutubeTranscriptRequest,
} from "../models/YoutubeTools";
import type { RuntimeEnvValues } from "./EnvFileService";
import { downloadYoutubeVideo, transcribeYoutubeVideo } from "./YoutubeToolsService";

const MAX_JOBS = 80;
const MAX_LOGS = 120;
const jobs = new Map<string, YoutubeToolsJob>();

type JobRequest = YoutubeDownloadRequest | YoutubeTranscriptRequest;

export function listYoutubeToolsJobs() {
  return [...jobs.values()].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function getYoutubeToolsJob(id: string) {
  return jobs.get(id) || null;
}

export function startYoutubeDownloadJob(request: YoutubeDownloadRequest, envOverrides: RuntimeEnvValues = {}) {
  return startYoutubeToolsJob("download", request, envOverrides);
}

export function startYoutubeTranscriptJob(request: YoutubeTranscriptRequest, envOverrides: RuntimeEnvValues = {}) {
  return startYoutubeToolsJob("transcript", request, envOverrides);
}

function startYoutubeToolsJob(kind: YoutubeToolsJobKind, request: JobRequest, envOverrides: RuntimeEnvValues) {
  const now = Date.now();
  const job: YoutubeToolsJob = {
    id: crypto.randomUUID(),
    kind,
    status: "queued",
    title: buildTitle(kind, request),
    progress: 0,
    routePath: "/youtube-tools",
    createdAtMs: now,
    updatedAtMs: now,
    logs: [],
    request,
  };
  jobs.set(job.id, job);
  pruneJobs();

  void runJob(job.id, envOverrides);
  return getRequiredJob(job.id);
}

async function runJob(id: string, envOverrides: RuntimeEnvValues) {
  updateJob(id, { status: "running", startedAtMs: Date.now(), progress: 3 });
  appendLog(id, commandLine(getRequiredJob(id)));

  try {
    const job = getRequiredJob(id);
    const onLog = (line: string) => {
      appendLog(id, line);
      const progress = inferProgress(job.kind, line, getRequiredJob(id).progress);
      if (progress !== null) updateJob(id, { progress });
    };
    const result = job.kind === "download"
      ? await downloadYoutubeVideo(job.request as YoutubeDownloadRequest, envOverrides, { onLog })
      : await transcribeYoutubeVideo(job.request as YoutubeTranscriptRequest, envOverrides, { onLog });

    updateJob(id, {
      status: "success",
      progress: 100,
      result,
      finishedAtMs: Date.now(),
      updatedAtMs: Date.now(),
    });
    appendLog(id, "success: Hoàn tất job YouTube tools.");
  } catch (error) {
    updateJob(id, {
      status: "failed",
      error: toErrorMessage(error),
      finishedAtMs: Date.now(),
      updatedAtMs: Date.now(),
    });
    appendLog(id, `error: ${toErrorMessage(error)}`);
  }
}

function updateJob(id: string, patch: Partial<YoutubeToolsJob>) {
  const current = getRequiredJob(id);
  jobs.set(id, { ...current, ...patch, updatedAtMs: Date.now() });
}

function appendLog(id: string, line: string) {
  const current = getRequiredJob(id);
  jobs.set(id, {
    ...current,
    logs: [...current.logs, line].slice(-MAX_LOGS),
    updatedAtMs: Date.now(),
  });
}

function inferProgress(kind: YoutubeToolsJobKind, line: string, current: number) {
  const downloadMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
  if (downloadMatch) {
    const raw = Math.max(0, Math.min(100, Number(downloadMatch[1])));
    return kind === "download" ? Math.max(current, raw * 0.92) : Math.max(current, 5 + raw * 0.35);
  }
  if (kind === "transcript" && /whisper|transcrib|detect/i.test(line)) return Math.max(current, 55);
  return null;
}

function commandLine(job: YoutubeToolsJob) {
  if (job.kind === "download") {
    const request = job.request as YoutubeDownloadRequest;
    return `$ kai-youtube download --mode ${request.mode || "video"} ${request.url}`;
  }
  const request = job.request as YoutubeTranscriptRequest;
  return request.sourceRelativePath
    ? `$ kai-youtube transcript --file ${request.sourceRelativePath}`
    : `$ kai-youtube transcript ${request.url || ""}`;
}

function buildTitle(kind: YoutubeToolsJobKind, request: JobRequest) {
  if (kind === "download") return `YouTube download: ${(request as YoutubeDownloadRequest).url}`;
  const transcript = request as YoutubeTranscriptRequest;
  return `YouTube transcript: ${transcript.sourceRelativePath || transcript.url || "source"}`;
}

function pruneJobs() {
  const sorted = listYoutubeToolsJobs();
  for (const job of sorted.slice(MAX_JOBS)) jobs.delete(job.id);
}

function getRequiredJob(id: string) {
  const job = jobs.get(id);
  if (!job) throw new Error("Không tìm thấy YouTube tools job.");
  return job;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "YouTube tools job thất bại.";
}
