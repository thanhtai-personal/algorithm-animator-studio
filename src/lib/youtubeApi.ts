import { buildApiUrl, parseApiResponse } from "./runtimeApi";

export type YoutubeConfigStatus = {
  hasClientId: boolean;
  hasClientSecret: boolean;
  redirectUri: string;
  defaults: YoutubeUploadForm;
};

export type YoutubePlaylist = { id: string; title: string };

export type YoutubeChannelProfile = {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  uploadsPlaylistId?: string;
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

export type YoutubeUploadForm = {
  title: string;
  description: string;
  tags: string;
  categoryId: string;
  privacyStatus: string;
  publishAt?: string;
  playlistId?: string;
  madeForKids: boolean;
  notifySubscribers: boolean;
  containsSyntheticMedia: boolean;
  musicLicenseText?: string;
};

export type YoutubeUploadResult = {
  ok: boolean;
  id?: string;
  url: string;
  title?: string;
  privacyStatus?: string;
  playlistWarning?: string;
};

export async function getYoutubeConfig() {
  return parseApiResponse<YoutubeConfigStatus>(await fetch(buildApiUrl("/api/youtube/config")));
}

export async function getYoutubeAuthUrl(redirectUri: string) {
  const params = new URLSearchParams({ redirectUri });
  const data = await parseApiResponse<{ authUrl: string }>(await fetch(buildApiUrl(`/api/youtube/auth-url?${params}`)));
  return data.authUrl;
}

export async function exchangeYoutubeCode(code: string, redirectUri: string) {
  return parseApiResponse<{ hasRefreshToken: boolean; refreshToken: string }>(await fetch(buildApiUrl("/api/youtube/exchange-code"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  }));
}

export async function getYoutubeChannel(refreshToken: string) {
  return parseApiResponse<YoutubeChannelProfile>(await fetch(buildApiUrl("/api/youtube/channel"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }));
}

export async function getYoutubePlaylists(refreshToken: string) {
  const data = await parseApiResponse<{ playlists: YoutubePlaylist[] }>(await fetch(buildApiUrl("/api/youtube/playlists"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }));
  return data.playlists;
}

export async function getYoutubeUploadHistory() {
  const data = await parseApiResponse<{ history: YoutubeUploadHistoryItem[] }>(await fetch(buildApiUrl("/api/youtube/history")));
  return data.history;
}

export async function uploadYoutubeVideo(file: File, refreshToken: string, form: YoutubeUploadForm) {
  const data = new FormData();
  data.append("video", file);
  append(data, "refreshToken", refreshToken);
  append(data, "title", form.title);
  append(data, "description", form.description);
  append(data, "tags", form.tags);
  append(data, "categoryId", form.categoryId);
  append(data, "privacyStatus", form.privacyStatus);
  append(data, "publishAt", form.publishAt || "");
  append(data, "playlistId", form.playlistId || "");
  append(data, "madeForKids", String(form.madeForKids));
  append(data, "notifySubscribers", String(form.notifySubscribers));
  append(data, "containsSyntheticMedia", String(form.containsSyntheticMedia));
  append(data, "musicLicenseText", form.musicLicenseText || "");

  return parseApiResponse<YoutubeUploadResult>(await fetch(buildApiUrl("/api/youtube/upload"), {
    method: "POST",
    body: data,
  }));
}

function append(data: FormData, key: string, value: string) {
  if (value !== "") data.append(key, value);
}
