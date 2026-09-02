import type { VideoEditorAspectRatio, VideoEditorAsset, VideoEditorClip, VideoEditorLyrics } from "./videoEditorTypes";

const DB_NAME = "kai-video-editor-draft";
const STORE_NAME = "drafts";
const DRAFT_KEY = "video-create";

export type VideoEditorDraft = {
  title: string;
  aspectRatio: VideoEditorAspectRatio;
  fps: number;
  showWatermark: boolean;
  watermarkText: string;
  watermarkLogoAssetId: string;
  lyrics?: VideoEditorLyrics;
  clips: VideoEditorClip[];
  assets: Array<{
    id: string;
    type: VideoEditorAsset["type"];
    name: string;
    fileName: string;
    mimeType: string;
    lastModified: number;
    blob: Blob;
    durationSeconds?: number;
  }>;
};

export async function saveVideoEditorDraft(draft: VideoEditorDraft) {
  const db = await openDraftDb();
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(draft, DRAFT_KEY));
  db.close();
}

export async function loadVideoEditorDraft() {
  const db = await openDraftDb();
  const draft = await requestToPromise<VideoEditorDraft | undefined>(db.transaction(STORE_NAME).objectStore(STORE_NAME).get(DRAFT_KEY));
  db.close();
  return draft || null;
}

export function toDraftAsset(asset: VideoEditorAsset): VideoEditorDraft["assets"][number] {
  return {
    id: asset.id,
    type: asset.type,
    name: asset.name,
    fileName: asset.file.name,
    mimeType: asset.file.type,
    lastModified: asset.file.lastModified,
    blob: asset.file,
    durationSeconds: asset.durationSeconds,
  };
}

export function fromDraftAsset(asset: VideoEditorDraft["assets"][number]): VideoEditorAsset {
  const file = new File([asset.blob], asset.fileName || asset.name, { type: asset.mimeType, lastModified: asset.lastModified });
  return { id: asset.id, type: asset.type, name: asset.name, file, url: URL.createObjectURL(file), durationSeconds: asset.durationSeconds };
}

function openDraftDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
