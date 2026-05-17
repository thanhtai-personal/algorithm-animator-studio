export const PERSISTED_DRAFTS_STORAGE_KEY = "kata.studio.persistedDrafts.v1";

export type PersistedDrafts = {
  tts?: Record<string, unknown>;
  videoStudio?: Record<string, unknown>;
  webExtract?: Record<string, unknown>;
  youtubeUpload?: Record<string, unknown>;
};

const PER_DRAFT_STORAGE_PREFIX = `${PERSISTED_DRAFTS_STORAGE_KEY}.`;
const MAX_LEGACY_DRAFT_PARSE_CHARS = 250_000;

function getPerDraftStorageKey(key: keyof PersistedDrafts) {
  return `${PER_DRAFT_STORAGE_PREFIX}${String(key)}`;
}

function readJsonObject(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function readPersistedDrafts(): PersistedDrafts {
  if (typeof window === "undefined") {
    return {};
  }

  const drafts: PersistedDrafts = {};
  const keys: (keyof PersistedDrafts)[] = ["tts", "videoStudio", "webExtract", "youtubeUpload"];

  for (const key of keys) {
    const value = readPersistedDraft(key);
    if (Object.keys(value).length) {
      drafts[key] = value;
    }
  }

  return drafts;
}

export function readPersistedDraft<T extends Record<string, unknown>>(key: keyof PersistedDrafts): Partial<T> {
  if (typeof window === "undefined") {
    return {};
  }

  const perDraftRaw = window.localStorage.getItem(getPerDraftStorageKey(key));
  if (perDraftRaw) {
    return readJsonObject(perDraftRaw) as Partial<T>;
  }

  const legacyRaw = window.localStorage.getItem(PERSISTED_DRAFTS_STORAGE_KEY);
  if (!legacyRaw || legacyRaw.length > MAX_LEGACY_DRAFT_PARSE_CHARS) {
    return {};
  }

  const legacyDrafts = readJsonObject(legacyRaw) as PersistedDrafts;
  const draft = (legacyDrafts[key] || {}) as Record<string, unknown>;

  if (Object.keys(draft).length) {
    try {
      window.localStorage.setItem(getPerDraftStorageKey(key), JSON.stringify(draft));
    } catch {
      // Ignore migration failures and keep runtime state only.
    }
  }

  return draft as Partial<T>;
}

export function savePersistedDraft(key: keyof PersistedDrafts, value: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getPerDraftStorageKey(key), JSON.stringify(value));
  } catch {
    // Browser storage can be full or disabled. Ignore so typing/navigation stays responsive.
  }
}

export function readStringDraft(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

export function readNumberDraft(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function readBooleanDraft(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}
