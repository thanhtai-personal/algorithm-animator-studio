import { buildApiUrl, withRuntimeSettingsHeaders } from "../utils/appSettingsStorage";
import { addBrowserResource, deleteBrowserResource, getBrowserResourceOverview } from "../utils/browserResourceStore";
import { PUBLIC_WEB_BUILD } from "../utils/publicRuntime";

export type GeneratedResourceKind = "audio" | "video" | "music";

export type GeneratedResource = {
  kind: GeneratedResourceKind;
  fileName: string;
  relativePath: string;
  url: string;
  sizeBytes: number;
  createdAtMs: number;
};

export type YoutubeUploadHistoryItem = {
  id: string;
  status: "success" | "failure";
  attemptedAtMs: number;
  source: "browser-upload" | "generated-video";
  sourceRelativePath?: string;
  sourceFileName?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  title?: string;
  privacyStatus?: string;
  playlistId?: string;
  message?: string;
};

export type ResourceOverview = {
  audio: GeneratedResource[];
  video: GeneratedResource[];
  music: GeneratedResource[];
  uploads: YoutubeUploadHistoryItem[];
};

export async function getResourceOverview(): Promise<ResourceOverview> {
  if (PUBLIC_WEB_BUILD) {
    return getBrowserResourceOverview();
  }

  const response = await fetch(buildApiUrl("/api/resources"), {
    headers: withRuntimeSettingsHeaders(),
  });
  const data = (await response.json()) as ResourceOverview & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Không tải được tài nguyên.");
  }

  return data;
}

export async function uploadBackgroundMusicResource(file: File): Promise<GeneratedResource> {
  if (PUBLIC_WEB_BUILD) {
    return addBrowserResource({ blob: file, fileName: file.name, kind: "music" });
  }

  const formData = new FormData();
  formData.append("music", file);

  const response = await fetch(buildApiUrl("/api/resources/background-music"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders(),
    body: formData,
  });
  const data = (await response.json()) as { ok?: boolean; resource?: GeneratedResource; error?: string };

  if (!response.ok || !data.resource) {
    throw new Error(data.error || "Không lưu được nhạc nền.");
  }

  return data.resource;
}

export async function openResourceFolder(payload: {
  kind: GeneratedResourceKind;
  relativePath: string;
}): Promise<void> {
  if (PUBLIC_WEB_BUILD) {
    throw new Error("Bản public web lưu tài nguyên trong trình duyệt nên không thể mở thư mục máy tính.");
  }

  const response = await fetch(buildApiUrl("/api/resources/open-folder"), {
    method: "POST",
    headers: withRuntimeSettingsHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  await parseActionResponse(response);
}

export async function deleteResource(payload: {
  kind: GeneratedResourceKind;
  relativePath: string;
}): Promise<void> {
  if (PUBLIC_WEB_BUILD) {
    await deleteBrowserResource(payload.relativePath);
    return;
  }

  const response = await fetch(buildApiUrl("/api/resources"), {
    method: "DELETE",
    headers: withRuntimeSettingsHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  await parseActionResponse(response);
}

async function parseActionResponse(response: Response): Promise<void> {
  const data = (await response.json()) as { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Yêu cầu tài nguyên thất bại.");
  }
}
