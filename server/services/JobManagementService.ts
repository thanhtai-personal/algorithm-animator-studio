import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT, SERVER_DATA_DIR } from "../config/paths";
import type { AgentVideoJob } from "../models/AiVideoAgent";
import type { PublishJob } from "../models/PublishQueue";
import { ensureDirectoryExists } from "../utils/audioOutput";
import { notifyBackgroundJobsChanged } from "./BackgroundJobsRealtimeService";
import { readEnvValues, type RuntimeEnvValues } from "./EnvFileService";

const AGENT_JOBS_FILE_NAME = "ai-video-agent-jobs.json";
const PUBLISH_JOBS_FILE_NAME = "publish-jobs.json";
const RUNNING_STATUSES = new Set(["running"]);

export type ManagedJobKind = "agent" | "publish";

export function setManagedJobLocked(kind: ManagedJobKind, id: string, locked: boolean, envOverrides: RuntimeEnvValues = {}) {
  if (kind === "agent") return updateAgentJob(id, { locked }, envOverrides);
  return updatePublishJob(id, { locked }, envOverrides);
}

export function deleteManagedJob(kind: ManagedJobKind, id: string, envOverrides: RuntimeEnvValues = {}) {
  if (kind === "agent") return deleteJob<AgentVideoJob>(agentJobsFile(envOverrides), id);
  return deleteJob<PublishJob>(publishJobsFile(envOverrides), id);
}

export function deleteUnlockedManagedJobs(envOverrides: RuntimeEnvValues = {}) {
  const agentResult = deleteUnlockedJobs<AgentVideoJob>(agentJobsFile(envOverrides));
  const publishResult = deleteUnlockedJobs<PublishJob>(publishJobsFile(envOverrides));
  if (agentResult.deleted || publishResult.deleted) notifyBackgroundJobsChanged();
  return {
    ok: true,
    deleted: agentResult.deleted + publishResult.deleted,
    keptLocked: agentResult.keptLocked + publishResult.keptLocked,
    keptRunning: agentResult.keptRunning + publishResult.keptRunning,
  };
}

function updateAgentJob(id: string, patch: Partial<AgentVideoJob>, envOverrides: RuntimeEnvValues) {
  const updated = updateJob<AgentVideoJob>(agentJobsFile(envOverrides), id, patch);
  notifyBackgroundJobsChanged();
  return updated;
}

function updatePublishJob(id: string, patch: Partial<PublishJob>, envOverrides: RuntimeEnvValues) {
  return updateJob<PublishJob>(publishJobsFile(envOverrides), id, patch);
}

function updateJob<T extends { id: string; updatedAtMs?: number }>(filePath: string, id: string, patch: Partial<T>) {
  let updated: T | null = null;
  const jobs = readJobs<T>(filePath).map((job) => {
    if (job.id !== id) return job;
    updated = { ...job, ...patch, updatedAtMs: Date.now() } as T;
    return updated;
  });
  if (!updated) throw new Error("Không tìm thấy job.");
  writeJobs(filePath, jobs);
  return updated;
}

function deleteJob<T extends { id: string; locked?: boolean; status?: string }>(filePath: string, id: string) {
  const jobs = readJobs<T>(filePath);
  const target = jobs.find((job) => job.id === id);
  if (!target) throw new Error("Không tìm thấy job.");
  if (target.locked) throw new Error("Job đang khóa, không thể xóa.");
  if (RUNNING_STATUSES.has(String(target.status))) throw new Error("Job đang chạy, không thể xóa.");
  writeJobs(filePath, jobs.filter((job) => job.id !== id));
  notifyBackgroundJobsChanged();
  return { ok: true, deleted: 1 };
}

function deleteUnlockedJobs<T extends { locked?: boolean; status?: string }>(filePath: string) {
  const jobs = readJobs<T>(filePath);
  let deleted = 0;
  let keptLocked = 0;
  let keptRunning = 0;
  const kept = jobs.filter((job) => {
    if (job.locked) {
      keptLocked += 1;
      return true;
    }
    if (RUNNING_STATUSES.has(String(job.status))) {
      keptRunning += 1;
      return true;
    }
    deleted += 1;
    return false;
  });
  if (deleted) writeJobs(filePath, kept);
  return { deleted, keptLocked, keptRunning };
}

function readJobs<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as T[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeJobs<T>(filePath: string, jobs: T[]) {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(jobs, null, 2), "utf8");
}

function agentJobsFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), AGENT_JOBS_FILE_NAME);
}

function publishJobsFile(envOverrides: RuntimeEnvValues = {}) {
  return path.join(getServerDataDir(envOverrides), PUBLISH_JOBS_FILE_NAME);
}

function getServerDataDir(envOverrides: RuntimeEnvValues = {}) {
  const configured = readEnvValues(envOverrides).SERVER_DATA_DIR || SERVER_DATA_DIR;
  const trimmed = configured.trim();
  if (!trimmed) return SERVER_DATA_DIR;
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(PROJECT_ROOT, trimmed);
}
