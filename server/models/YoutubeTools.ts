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

export type YoutubeDownloadMode = "video" | "audio";

export type YoutubeDownloadRequest = {
  url: string;
  mode?: YoutubeDownloadMode;
  maxHeight?: number;
  fileName?: string;
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

export type YoutubeTranscriptRequest = {
  url?: string;
  sourceRelativePath?: string;
  model?: string;
  language?: string;
  task?: "transcribe" | "translate";
};

export type YoutubeTranscriptResult = {
  ok: true;
  sourceLabel: string;
  transcriptText: string;
  files: {
    txt?: string;
    srt?: string;
    vtt?: string;
    json?: string;
  };
  outputDir: string;
  log: string[];
};

export type YoutubeToolsJobKind = "download" | "transcript";
export type YoutubeToolsJobStatus = "queued" | "running" | "success" | "failed";

export type YoutubeToolsJob = {
  id: string;
  kind: YoutubeToolsJobKind;
  status: YoutubeToolsJobStatus;
  title: string;
  progress: number;
  routePath: "/youtube-tools";
  createdAtMs: number;
  updatedAtMs: number;
  startedAtMs?: number;
  finishedAtMs?: number;
  logs: string[];
  error?: string;
  request: YoutubeDownloadRequest | YoutubeTranscriptRequest;
  result?: YoutubeDownloadResult | YoutubeTranscriptResult;
};
