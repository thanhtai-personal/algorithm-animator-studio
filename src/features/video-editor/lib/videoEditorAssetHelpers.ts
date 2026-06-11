import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import type { VideoEditorAsset, VideoEditorClip } from "./videoEditorTypes";

const SILENT_ASSET_ID = "silent-audio";

export function createAsset(file: File): VideoEditorAsset | null {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : null;
  if (!type) return null;
  return createAssetFromFile(file);
}

export function createAssetFromFile(file: File, label?: string): VideoEditorAsset {
  const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("audio/") ? "audio" : "video";
  return { id: makeId(), type, file, name: label || file.name, url: URL.createObjectURL(file) };
}

export async function createAssetFromLibraryTrack(track: MusicLibraryTrack): Promise<VideoEditorAsset | null> {
  const response = await fetch(track.audioUrl);
  if (!response.ok) return null;
  const blob = await response.blob();
  const file = new File([blob], track.fileName || `${track.title}.mp3`, { type: blob.type || "audio/mpeg" });
  return { id: `system-music:${track.id}`, type: "audio", file, name: track.title, url: URL.createObjectURL(file), source: "system-music", libraryTrackId: track.id };
}

export function createSilentAsset(): VideoEditorAsset {
  const file = new File([createSilentWavBlob()], "silent.wav", { type: "audio/wav" });
  return { id: SILENT_ASSET_ID, type: "audio", file, name: "Silent / Im lặng", url: URL.createObjectURL(file), source: "silent" };
}

export function mergeLibraryAssets(current: VideoEditorAsset[], libraryAssets: VideoEditorAsset[]) {
  const currentIds = new Set(current.map((asset) => asset.id));
  const silentAsset = current.find((asset) => asset.id === SILENT_ASSET_ID) || createSilentAsset();
  const withoutDuplicateSilent = current.filter((asset) => asset.id !== SILENT_ASSET_ID);
  return [silentAsset, ...withoutDuplicateSilent, ...libraryAssets.filter((asset) => !currentIds.has(asset.id))];
}

export function createClipFromAsset(asset: VideoEditorAsset): VideoEditorClip {
  return { id: makeId(), assetId: asset.id, type: asset.type, label: asset.name, durationSeconds: getDefaultClipDuration(asset), fitMode: "contain", transition: asset.type === "audio" ? "none" : "blurry", transitionSeconds: 1.5, keepOriginalAudio: false, volume: 1 };
}

export function readVideoDurationSeconds(url: string) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(Number.isFinite(video.duration) ? video.duration : 0);
    video.onerror = () => reject(new Error("Không đọc được duration của video."));
    video.src = url;
  });
}

function getDefaultClipDuration(asset: VideoEditorAsset) {
  if (asset.type === "image") return 4;
  if (asset.type === "video") return Math.max(1, Math.min(7200, asset.durationSeconds || 6));
  return 12;
}

function createSilentWavBlob() {
  const sampleRate = 8000;
  const seconds = 1;
  const dataSize = sampleRate * seconds * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
