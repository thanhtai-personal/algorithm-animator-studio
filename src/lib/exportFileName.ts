import type { Lang } from "./i18n";

const MAX_BASE_LENGTH = 120;

export function buildVideoExportFileName(params: {
  youtubeTitle?: string;
  fallbackTitle: string;
  lang: Lang;
  extension: string;
}) {
  const title = stripHashtags(params.youtubeTitle || params.fallbackTitle);
  const base = sanitizeFileName(title) || sanitizeFileName(params.fallbackTitle) || "algorithm-video";
  const langSuffix = ` - ${params.lang}`;
  const withoutDuplicateLang = base.replace(/\s+-\s+(en|vi)$/i, "").trim();
  const safeBase = trimFileNameBase(`${withoutDuplicateLang}${langSuffix}`, MAX_BASE_LENGTH);
  const extension = params.extension.replace(/^\.+/, "") || "webm";
  return `${safeBase}.${extension}`;
}

export function stripHashtags(value: string) {
  return value
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim();
}

function trimFileNameBase(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).replace(/\s+\S*$/, "").replace(/[. ]+$/g, "").trim() || value.slice(0, maxLength).trim();
}
