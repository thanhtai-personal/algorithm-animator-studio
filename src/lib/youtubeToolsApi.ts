import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import { buildRuntimeSettingsHeaders } from "./runtimeSettings";

export type YoutubeDownloadMode = "video" | "audio";

export type YoutubeToolStatus = {
  ok: boolean;
  command: string;
  version?: string;
  detail?: string;
};

export type YoutubeToolsHealth = {
  ok: boolean;
  python: YoutubeToolStatus;
  ytDlp: YoutubeToolStatus;
  whisper: YoutubeToolStatus;
  ffmpeg: YoutubeToolStatus;
  ffprobe: YoutubeToolStatus;
  cookieMode: "file" | "browser" | "none";
  cookieStatus: YoutubeToolStatus;
  jsRuntime: YoutubeToolStatus;
  remoteComponents: YoutubeToolStatus;
  outputDir: string;
  installHint: string[];
};

export type YoutubeDownloadResult = {
  ok: true;
  mode: YoutubeDownloadMode;
  fileName: string;
  relativePath: string;
  url: string;
  savedTo: string;
  sizeBytes: number;
  log: string[];
};

export type YoutubeTranscriptResult = {
  ok: true;
  sourceLabel: string;
  transcriptText: string;
  files: { txt?: string; srt?: string; vtt?: string; json?: string };
  outputDir: string;
  log: string[];
};

export async function getYoutubeToolsHealth() {
  return parseApiResponse<YoutubeToolsHealth>(await awaitFetch("/api/youtube-tools/health"));
}

export async function downloadYoutube(payload: {
  url: string;
  mode: YoutubeDownloadMode;
  maxHeight: number;
  fileName?: string;
}) {
  return parseApiResponse<YoutubeDownloadResult>(await awaitFetch("/api/youtube-tools/download", payload));
}

export async function transcribeYoutube(payload: {
  url?: string;
  sourceRelativePath?: string;
  model: string;
  language: string;
  task: "transcribe" | "translate";
}) {
  return parseApiResponse<YoutubeTranscriptResult>(await awaitFetch("/api/youtube-tools/transcript", payload));
}

function awaitFetch(path: string, payload?: unknown) {
  if (payload === undefined) {
    return fetch(buildApiUrl(path), { headers: buildRuntimeSettingsHeaders() });
  }

  return fetch(buildApiUrl(path), {
    method: "POST",
    headers: buildRuntimeSettingsHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}
