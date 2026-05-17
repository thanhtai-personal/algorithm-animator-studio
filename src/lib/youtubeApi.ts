import { buildApiUrl, parseApiResponse } from "./runtimeApi";

export type YoutubeConfigStatus = {
  hasClientId: boolean;
  hasClientSecret: boolean;
  redirectUri: string;
  defaults: YoutubeUploadForm;
};

export type YoutubePlaylist = { id: string; title: string };

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

export async function getYoutubePlaylists(refreshToken: string) {
  const data = await parseApiResponse<{ playlists: YoutubePlaylist[] }>(await fetch(buildApiUrl("/api/youtube/playlists"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }));
  return data.playlists;
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
