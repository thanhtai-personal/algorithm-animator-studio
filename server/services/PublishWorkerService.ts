import fs from "node:fs";
import path from "node:path";
import type { PublishJob } from "../models/PublishQueue";
import { completePublishJob, getPublishJobFilePath, claimNextDuePublishJob, updatePublishJob } from "./PublishQueueService";
import { uploadYoutubeVideo } from "./YoutubeUploadService";
import { getSocialProviderAccount } from "./SocialProviderAccountService";
import type { RuntimeEnvValues } from "./EnvFileService";

let workerTimer: NodeJS.Timeout | null = null;
let workerRunning = false;

export function startLocalPublishWorker() {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    void runDuePublishJobs().catch((error) => {
      console.error("[publish-worker]", error);
    });
  }, 15_000);
}

export async function runDuePublishJobs(envOverrides: RuntimeEnvValues = {}) {
  if (workerRunning) return { ok: true, processed: 0, skipped: "worker-running" };
  workerRunning = true;
  let processed = 0;

  try {
    while (processed < 3) {
      const job = claimNextDuePublishJob(envOverrides);
      if (!job) break;
      processed += 1;
      await processPublishJob(job, envOverrides);
    }

    return { ok: true, processed };
  } finally {
    workerRunning = false;
  }
}

export async function runPublishJobNow(jobId: string, envOverrides: RuntimeEnvValues = {}) {
  const job = updatePublishJob(jobId, {
    status: "queued",
    scheduledAtMs: Date.now(),
    message: "Đã yêu cầu chạy ngay.",
  }, envOverrides);
  await runDuePublishJobs(envOverrides);
  return job;
}

async function processPublishJob(job: PublishJob, envOverrides: RuntimeEnvValues = {}) {
  try {
    await assertVideoFile(job);
    if (job.platform === "youtube") return await publishYoutube(job, envOverrides);
    if (job.platform === "facebook") return await publishFacebook(job, envOverrides);
    if (job.platform === "tiktok") return await publishTikTokInbox(job, envOverrides);
    return completePublishJob(job.id, "manual_required", {
      message: "Instagram Graph API cần media_url public hoặc upload container riêng. Vì tool chạy local không host file public, hãy đăng thủ công hoặc dùng fallback sau khi có public URL.",
    }, envOverrides);
  } catch (error) {
    return completePublishJob(job.id, "failed", {
      message: error instanceof Error ? error.message : "Publish job thất bại.",
    }, envOverrides);
  }
}

async function publishYoutube(job: PublishJob, envOverrides: RuntimeEnvValues = {}) {
  if (!job.youtubeRefreshToken) throw new Error("Job YouTube thiếu refresh token. Hãy tạo job từ kênh YouTube đã kết nối.");
  const filePath = getPublishJobFilePath(job);
  updatePublishJob(job.id, { progress: 35, message: "Đang upload YouTube..." }, envOverrides);

  const result = await uploadYoutubeVideo({
    filePath,
    originalFileName: job.sourceFileName || path.basename(filePath),
    envOverrides,
    body: {
      refreshToken: job.youtubeRefreshToken,
      title: job.title,
      description: job.description,
      tags: job.tags,
      privacyStatus: job.privacyStatus,
      publishAt: job.publishAt,
      playlistId: job.youtubePlaylistId,
      madeForKids: String(Boolean(job.madeForKids)),
      notifySubscribers: String(Boolean(job.notifySubscribers)),
      containsSyntheticMedia: String(job.containsSyntheticMedia !== false),
      channelId: job.channelId,
      channelTitle: job.channelTitle,
    },
  });

  return completePublishJob(job.id, result.ok ? "success" : "failed", {
    resultId: result.id || "",
    resultUrl: result.url || "",
    progress: result.ok ? 100 : 0,
    message: result.playlistWarning || (result.ok ? "Upload YouTube thành công." : "YouTube không trả video id."),
  }, envOverrides);
}

async function publishFacebook(job: PublishJob, envOverrides: RuntimeEnvValues = {}) {
  const account = getSocialProviderAccount(job.providerAccountId || job.channelId, envOverrides);
  if (!account || account.platform !== "facebook" || !account.accessToken) {
    return completePublishJob(job.id, "manual_required", {
      message: "Facebook Page chưa có page access token trong local data. Hãy kết nối lại Facebook với quyền pages_manage_posts/pages_read_engagement hoặc đăng thủ công.",
    }, envOverrides);
  }

  const filePath = getPublishJobFilePath(job);
  updatePublishJob(job.id, { progress: 35, message: "Đang upload Facebook Page video..." }, envOverrides);

  const buffer = await fs.promises.readFile(filePath);
  const blob = new Blob([buffer], { type: guessMimeType(filePath) });
  const form = new FormData();
  form.set("access_token", account.accessToken);
  form.set("title", job.title);
  form.set("description", [job.description, job.tags].filter(Boolean).join("\n\n"));
  form.set("published", job.scheduledAtMs && job.scheduledAtMs > Date.now() ? "false" : "true");
  form.set("source", blob, path.basename(filePath));

  const response = await fetch(`https://graph.facebook.com/v19.0/${account.remoteId}/videos`, {
    method: "POST",
    body: form,
  });
  const payload = await response.json() as { id?: string; error?: { message?: string } };
  if (!response.ok || payload.error) throw new Error(payload.error?.message || "Facebook upload video thất bại.");

  return completePublishJob(job.id, "success", {
    resultId: payload.id || "",
    resultUrl: payload.id ? `https://www.facebook.com/${payload.id}` : account.url,
    message: "Upload Facebook Page video thành công.",
  }, envOverrides);
}

async function publishTikTokInbox(job: PublishJob, envOverrides: RuntimeEnvValues = {}) {
  const account = getSocialProviderAccount(job.providerAccountId || job.channelId, envOverrides);
  if (!account || account.platform !== "tiktok" || !account.accessToken) {
    return completePublishJob(job.id, "manual_required", {
      message: "TikTok chưa có access token trong local data. Hãy kết nối lại TikTok với scope video.upload hoặc đăng thủ công.",
    }, envOverrides);
  }

  const filePath = getPublishJobFilePath(job);
  const stat = await fs.promises.stat(filePath);
  updatePublishJob(job.id, { progress: 25, message: "Đang khởi tạo TikTok inbox upload..." }, envOverrides);

  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: stat.size,
        chunk_size: stat.size,
        total_chunk_count: 1,
      },
    }),
  });
  const initPayload = await initResponse.json() as { data?: { publish_id?: string; upload_url?: string }; error?: { code?: string; message?: string } };
  if (!initResponse.ok || initPayload.error?.code && initPayload.error.code !== "ok") {
    throw new Error(initPayload.error?.message || "TikTok init upload thất bại.");
  }
  const uploadUrl = initPayload.data?.upload_url;
  if (!uploadUrl) throw new Error("TikTok không trả upload_url.");

  updatePublishJob(job.id, { progress: 65, message: "Đang gửi video lên TikTok upload endpoint..." }, envOverrides);
  const buffer = await fs.promises.readFile(filePath);
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": guessMimeType(filePath),
      "Content-Length": String(stat.size),
      "Content-Range": `bytes 0-${stat.size - 1}/${stat.size}`,
    },
    body: buffer,
  });
  if (!uploadResponse.ok && uploadResponse.status !== 201 && uploadResponse.status !== 206) {
    throw new Error(`TikTok upload thất bại: HTTP ${uploadResponse.status}`);
  }

  return completePublishJob(job.id, "manual_required", {
    resultId: initPayload.data?.publish_id || "",
    resultUrl: account.url,
    message: "Đã gửi video vào TikTok Inbox. Hãy mở app TikTok, bấm notification để chỉnh sửa và post. Đây là giới hạn của video.upload flow.",
  }, envOverrides);
}

async function assertVideoFile(job: PublishJob) {
  const filePath = getPublishJobFilePath(job);
  const stat = await fs.promises.stat(filePath);
  if (!stat.isFile()) throw new Error("Đường dẫn publish không phải file video.");
  if (stat.size <= 0) throw new Error("File video rỗng.");
}

function guessMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  return "video/mp4";
}
