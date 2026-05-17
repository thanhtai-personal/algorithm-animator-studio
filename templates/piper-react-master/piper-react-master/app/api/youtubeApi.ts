import { buildAppServerUrl } from "./appServerSettingsApi";
import { getEffectiveAppSettings } from "../utils/appSettingsStorage";

export type YoutubeConfigStatus = {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  redirectUri: string;
  defaults: {
    title: string;
    description: string;
    tags: string;
    categoryId: string;
    privacyStatus: string;
    madeForKids: boolean;
    notifySubscribers: boolean;
    containsSyntheticMedia: boolean;
  };
};

export type YoutubeUploadResult = {
  ok: boolean;
  id?: string;
  url: string;
  title?: string;
  privacyStatus?: string;
  playlistId?: string;
  playlistWarning?: string;
};

export type YoutubeVideoUpdatePayload = {
  refreshToken: string;
  title: string;
  description: string;
  tags: string;
  categoryId: string;
  privacyStatus: string;
  publishAt: string;
  madeForKids: boolean;
  notifySubscribers: boolean;
  containsSyntheticMedia: boolean;
};

export type YoutubePlaylist = {
  id: string;
  title: string;
};

async function parseYoutubeResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(data.message || data.error || "Yêu cầu YouTube thất bại.");
  }

  return data;
}

export async function getYoutubeConfig(): Promise<YoutubeConfigStatus> {
  const response = await fetch(buildAppServerUrl("/api/youtube/config"));
  const status = await parseYoutubeResponse<YoutubeConfigStatus>(response);

  return {
    ...status,
    defaults: readYoutubeDefaultsFromLocalSettings(status.defaults),
  };
}

export async function getYoutubeAuthUrl(redirectUri: string): Promise<string> {
  const params = new URLSearchParams({ redirectUri });
  const response = await fetch(buildAppServerUrl(`/api/youtube/auth-url?${params}`));
  const data = await parseYoutubeResponse<{ authUrl: string }>(response);
  return data.authUrl;
}

export async function exchangeYoutubeCode(
  code: string,
  redirectUri: string
): Promise<{ hasRefreshToken: boolean; refreshToken: string }> {
  const response = await fetch(buildAppServerUrl("/api/youtube/exchange-code"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, redirectUri }),
  });

  return parseYoutubeResponse<{ hasRefreshToken: boolean; refreshToken: string }>(response);
}

export async function getYoutubePlaylists(refreshToken: string): Promise<YoutubePlaylist[]> {
  const response = await fetch(buildAppServerUrl("/api/youtube/playlists"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseYoutubeResponse<{ playlists: YoutubePlaylist[] }>(response);
  return data.playlists;
}

export async function uploadYoutubeVideo(formData: FormData): Promise<YoutubeUploadResult> {
  const response = await fetch(buildAppServerUrl("/api/youtube/upload"), {
    method: "POST",
    body: formData,
  });

  return parseYoutubeResponse<YoutubeUploadResult>(response);
}

export async function uploadGeneratedYoutubeVideo(payload: {
  videoUrl: string;
  fileName: string;
  refreshToken: string;
  title: string;
  description: string;
  tags: string;
  categoryId: string;
  privacyStatus: string;
  publishAt: string;
  playlistId: string;
  madeForKids: boolean;
  notifySubscribers: boolean;
  containsSyntheticMedia: boolean;
}): Promise<YoutubeUploadResult> {
  const videoFile = await fetchGeneratedVideoFile(payload.videoUrl, payload.fileName || "generated-video.mp4");
  const formData = new FormData();

  formData.append("video", videoFile);
  appendField(formData, "title", payload.title);
  appendField(formData, "description", payload.description);
  appendField(formData, "tags", payload.tags);
  appendField(formData, "categoryId", payload.categoryId);
  appendField(formData, "privacyStatus", payload.privacyStatus);
  appendField(formData, "publishAt", payload.publishAt);
  appendField(formData, "playlistId", payload.playlistId);
  appendField(formData, "madeForKids", String(payload.madeForKids));
  appendField(formData, "notifySubscribers", String(payload.notifySubscribers));
  appendField(formData, "containsSyntheticMedia", String(payload.containsSyntheticMedia));
  appendField(formData, "refreshToken", payload.refreshToken);

  return uploadYoutubeVideo(formData);
}

export async function updateYoutubeScheduledVideo(
  videoId: string,
  payload: YoutubeVideoUpdatePayload
): Promise<YoutubeUploadResult> {
  const response = await fetch(buildAppServerUrl(`/api/youtube/videos/${encodeURIComponent(videoId)}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseYoutubeResponse<YoutubeUploadResult>(response);
}

async function fetchGeneratedVideoFile(videoUrl: string, fileName: string): Promise<File> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error("Không tải được video đã tạo để đăng YouTube.");
  }

  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "video/mp4" });
}

function appendField(formData: FormData, name: string, value: string) {
  if (value) {
    formData.append(name, value);
  }
}

function readYoutubeDefaultsFromLocalSettings(fallback: YoutubeConfigStatus["defaults"]): YoutubeConfigStatus["defaults"] {
  const settings = getEffectiveAppSettings();

  return {
    title: settings.YOUTUBE_TITLE || fallback.title,
    description: settings.YOUTUBE_DESCRIPTION || fallback.description,
    tags: settings.YOUTUBE_TAGS || fallback.tags,
    categoryId: settings.YOUTUBE_CATEGORY_ID || fallback.categoryId,
    privacyStatus: settings.YOUTUBE_PRIVACY_STATUS || fallback.privacyStatus,
    madeForKids: readBooleanSetting(settings.YOUTUBE_MADE_FOR_KIDS, fallback.madeForKids),
    notifySubscribers: readBooleanSetting(settings.YOUTUBE_NOTIFY_SUBSCRIBERS, fallback.notifySubscribers),
    containsSyntheticMedia: readBooleanSetting(
      settings.YOUTUBE_CONTAINS_SYNTHETIC_MEDIA,
      fallback.containsSyntheticMedia
    ),
  };
}

function readBooleanSetting(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "y"].includes(value.toLowerCase());
}
