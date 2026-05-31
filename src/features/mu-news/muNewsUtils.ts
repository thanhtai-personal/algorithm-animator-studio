import type { MuNewsSource } from "./types";

const REMOVED_SOURCE_URLS = new Set([
  "https://www.transfermarkt.co.uk/rss/news",
]);

const SOURCE_URL_ALIASES = new Map([
  [
    "https://www.manutd.com/en/feeds/newsrssfeed",
    "https://news.google.com/rss/search?q=%28%22Manchester%20United%22%20OR%20%22Man%20Utd%22%20OR%20MUFC%29%20site%3Amanutd.com%20when%3A7d&hl=en-GB&gl=GB&ceid=GB%3Aen",
  ],
]);

const REMOVED_SOURCE_HOSTS = new Set(["news.google.com"]);
const TONE_MARKS: Record<string, string> = {
  "`": "\u0300",
  "'": "\u0301",
  "´": "\u0301",
  "’": "\u0301",
  "‘": "\u0301",
  "?": "\u0309",
  "~": "\u0303",
};
const VIETNAMESE_VOWELS = "aăâeêioôơuưyAĂÂEÊIOÔƠUƯY";
const TONE_PATTERN = "[`'´’‘?~]";

export function sourcesToText(sources: MuNewsSource[]) {
  return sources.map((source) => `${source.name} | ${source.url} | ${source.trustScore}`).join("\n");
}

export function applyDefaultSources(text: string, defaults: MuNewsSource[]) {
  const existingUrls = new Set<string>();

  const rows = text
    .split(/\r?\n/)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const migratedUrl = SOURCE_URL_ALIASES.get(parts[1]) || parts[1] || "";
      if (!migratedUrl || shouldRemoveSourceUrl(migratedUrl)) return "";
      if (migratedUrl) existingUrls.add(migratedUrl);
      return [migrateSourceName(parts[0] || "", migratedUrl), migratedUrl, parts[2] || "6"].join(" | ");
    })
    .filter(Boolean);

  const missingDefaults = defaults.filter((source) => source.url && !existingUrls.has(source.url));
  return [...rows, sourcesToText(missingDefaults)].filter(Boolean).join("\n");
}

function migrateSourceName(name: string, url: string) {
  if (url.includes("site%3Amanutd.com")) return "Google News — Manchester United Official";
  return name;
}

function shouldRemoveSourceUrl(url: string) {
  if (REMOVED_SOURCE_URLS.has(url)) return true;
  try {
    return REMOVED_SOURCE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function parseSourcesText(text: string): MuNewsSource[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name = `Nguồn ${index + 1}`, url = "", trustScore = "6"] = line.split("|").map((part) => part.trim());
      return {
        id: slugify(`${name}-${index + 1}`),
        name,
        url,
        trustScore: Number(trustScore) || 6,
        sourceType: url.includes("news.google.com") ? "news-search" : "rss",
      } as MuNewsSource;
    })
    .filter((source) => /^https?:\/\//i.test(source.url));
}

export function createDefaultFileName(prefix = "mu-news") {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}`;
}

export function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function normalizeVietnameseText(value: string) {
  if (!value) return "";
  const vowels = escapeRegExp(VIETNAMESE_VOWELS);
  const consonants = "bcdđghklmnpqrstvxBCDĐGHKLMNPQRSTVX";
  const markerBeforeConsonant = new RegExp(`([${vowels}])(${TONE_PATTERN})\\s+(?=[${escapeRegExp(consonants)}])`, "g");
  const markerAfterVowel = new RegExp(`([${vowels}])(${TONE_PATTERN})`, "g");

  return value
    .normalize("NFKC")
    .replace(markerBeforeConsonant, "$1$2")
    .replace(markerAfterVowel, (_, vowel: string, marker: string) => applyVietnameseTone(vowel, marker))
    .normalize("NFC");
}

function applyVietnameseTone(vowel: string, marker: string) {
  const tone = TONE_MARKS[marker];
  if (!tone) return vowel;
  const decomposed = vowel.normalize("NFD");
  if (/[\u0300\u0301\u0303\u0309\u0323]/.test(decomposed)) return vowel;
  return `${decomposed}${tone}`.normalize("NFC");
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
