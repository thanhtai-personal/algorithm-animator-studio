const TTS_DRAFT_DB_NAME = "piper-tts-drafts";
const TTS_DRAFT_DB_VERSION = 1;
const TTS_DRAFT_STORE_NAME = "drafts";
const TTS_DRAFT_TEXT_KEY = "ttsText";
const TTS_DRAFT_TEXT_FALLBACK_KEY = "piper.tts.draft.text.v1";

type DraftRecord = {
  key: string;
  value: string;
  updatedAt: number;
};

function hasIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function readFallbackText() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(TTS_DRAFT_TEXT_FALLBACK_KEY) || "";
  } catch {
    return "";
  }
}

function writeFallbackText(text: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (text) {
      window.localStorage.setItem(TTS_DRAFT_TEXT_FALLBACK_KEY, text);
      return;
    }

    window.localStorage.removeItem(TTS_DRAFT_TEXT_FALLBACK_KEY);
  } catch {
    // Storage can be unavailable in private mode or full quota. Keep the runtime draft only.
  }
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = window.indexedDB.open(TTS_DRAFT_DB_NAME, TTS_DRAFT_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TTS_DRAFT_STORE_NAME)) {
        db.createObjectStore(TTS_DRAFT_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Unable to open draft database"));
    request.onblocked = () => reject(new Error("Draft database is blocked"));
  });
}

function closeDb(db: IDBDatabase) {
  try {
    db.close();
  } catch {
    // Ignore close errors. The browser will clean up the connection.
  }
}

export async function readTtsDraftText() {
  if (!hasIndexedDb()) {
    return readFallbackText();
  }

  let db: IDBDatabase | null = null;

  try {
    db = await openDraftDb();

    return await new Promise<string>((resolve, reject) => {
      const transaction = db!.transaction(TTS_DRAFT_STORE_NAME, "readonly");
      const store = transaction.objectStore(TTS_DRAFT_STORE_NAME);
      const request = store.get(TTS_DRAFT_TEXT_KEY);

      request.onsuccess = () => {
        const record = request.result as DraftRecord | undefined;
        resolve(typeof record?.value === "string" ? record.value : readFallbackText());
      };
      request.onerror = () => reject(request.error || new Error("Unable to read TTS draft text"));
    });
  } catch {
    return readFallbackText();
  } finally {
    if (db) {
      closeDb(db);
    }
  }
}

export async function writeTtsDraftText(text: string) {
  if (!hasIndexedDb()) {
    writeFallbackText(text);
    return;
  }

  let db: IDBDatabase | null = null;

  try {
    db = await openDraftDb();

    await new Promise<void>((resolve, reject) => {
      const transaction = db!.transaction(TTS_DRAFT_STORE_NAME, "readwrite");
      const store = transaction.objectStore(TTS_DRAFT_STORE_NAME);

      if (text) {
        store.put({ key: TTS_DRAFT_TEXT_KEY, value: text, updatedAt: Date.now() } satisfies DraftRecord);
      } else {
        store.delete(TTS_DRAFT_TEXT_KEY);
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Unable to write TTS draft text"));
      transaction.onabort = () => reject(transaction.error || new Error("TTS draft text write was aborted"));
    });

    // Keep a small compatibility copy cleared when IndexedDB succeeds, so old large localStorage drafts stop blocking UI.
    writeFallbackText("");
  } catch {
    writeFallbackText(text);
  } finally {
    if (db) {
      closeDb(db);
    }
  }
}
