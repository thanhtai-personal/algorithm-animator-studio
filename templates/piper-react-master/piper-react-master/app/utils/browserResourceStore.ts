import type { GeneratedResource, ResourceOverview } from "../api/resourceApi";

const DB_NAME = "kata-public-resources-v1";
const DB_VERSION = 1;
const STORE_NAME = "resources";
const objectUrls = new Map<string, string>();

export type BrowserStoredResource = Omit<GeneratedResource, "url"> & {
  blob: Blob;
};

export async function getBrowserResourceOverview(): Promise<ResourceOverview> {
  const resources = await listBrowserResources();

  return {
    audio: resources.filter((item) => item.kind === "audio"),
    video: resources.filter((item) => item.kind === "video"),
    music: resources.filter((item) => item.kind === "music"),
    uploads: [],
  };
}

export async function addBrowserResource(params: {
  blob: Blob;
  fileName: string;
  kind: GeneratedResource["kind"];
  relativePath?: string;
}): Promise<GeneratedResource> {
  const now = Date.now();
  const safeFileName = toSafeFileName(params.fileName, params.kind);
  const relativePath = params.relativePath || `${params.kind}/${new Date(now).toISOString().slice(0, 10)}/${now}-${safeFileName}`;
  const stored: BrowserStoredResource = {
    kind: params.kind,
    fileName: safeFileName,
    relativePath,
    sizeBytes: params.blob.size,
    createdAtMs: now,
    blob: params.blob,
  };
  const db = await openBrowserResourceDb();

  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(stored));

  return toGeneratedResource(stored);
}

export async function listBrowserResources(): Promise<GeneratedResource[]> {
  const db = await openBrowserResourceDb();
  const items = await requestToPromise<BrowserStoredResource[]>(db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll());

  return items
    .map(toGeneratedResource)
    .sort((first, second) => second.createdAtMs - first.createdAtMs);
}

export async function deleteBrowserResource(relativePath: string): Promise<void> {
  const db = await openBrowserResourceDb();
  const objectUrl = objectUrls.get(relativePath);

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrls.delete(relativePath);
  }

  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(relativePath));
}

function openBrowserResourceDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "relativePath" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Không mở được kho tài nguyên của trình duyệt."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Thao tác IndexedDB thất bại."));
  });
}

function toGeneratedResource(resource: BrowserStoredResource): GeneratedResource {
  let url = objectUrls.get(resource.relativePath);

  if (!url) {
    url = URL.createObjectURL(resource.blob);
    objectUrls.set(resource.relativePath, url);
  }

  return {
    kind: resource.kind,
    fileName: resource.fileName,
    relativePath: resource.relativePath,
    url,
    sizeBytes: resource.sizeBytes,
    createdAtMs: resource.createdAtMs,
  };
}

function toSafeFileName(fileName: string, kind: GeneratedResource["kind"]) {
  const fallback = kind === "video" ? "browser-video.webm" : kind === "music" ? "background-music.mp3" : "browser-audio.webm";
  const normalized = (fileName || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || fallback;
}
