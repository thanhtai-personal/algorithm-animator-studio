export type ExportedVideoAsset = {
  file: File;
  url: string;
  fileName: string;
  createdAt: string;
};

let lastVideo: ExportedVideoAsset | null = null;

export function setLastExportedVideo(file: File, url: string): ExportedVideoAsset {
  if (lastVideo?.url) URL.revokeObjectURL(lastVideo.url);
  lastVideo = { file, url, fileName: file.name, createdAt: new Date().toISOString() };
  return lastVideo;
}

export function getLastExportedVideo() {
  return lastVideo;
}
