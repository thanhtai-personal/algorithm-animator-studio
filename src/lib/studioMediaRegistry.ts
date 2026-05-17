export type ExportedVideoAsset = {
  file: File;
  url: string;
  fileName: string;
  createdAt: string;
  youtubeDescriptionAppend?: string;
};

let lastVideo: ExportedVideoAsset | null = null;

export function setLastExportedVideo(file: File, url: string, metadata: Pick<ExportedVideoAsset, "youtubeDescriptionAppend"> = {}): ExportedVideoAsset {
  if (lastVideo?.url) URL.revokeObjectURL(lastVideo.url);
  lastVideo = { file, url, fileName: file.name, createdAt: new Date().toISOString(), ...metadata };
  return lastVideo;
}

export function getLastExportedVideo() {
  return lastVideo;
}
