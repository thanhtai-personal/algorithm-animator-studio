import type { MuNewsSource } from "./types";

export function sourcesToText(sources: MuNewsSource[]) {
  return sources.map((source) => [source.name, source.url, source.trustScore, source.contentSelector || ""].join(" | ").replace(/\s+\|\s+$/, "")).join("\n");
}

export function applyDefaultSourceSelectors(text: string, defaults: MuNewsSource[]) {
  const selectorByUrl = new Map(defaults.filter((source) => source.contentSelector).map((source) => [source.url, source.contentSelector || ""]));

  return text
    .split(/\r?\n/)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const selector = parts[3] || selectorByUrl.get(parts[1]) || "";
      return [parts[0] || "", parts[1] || "", parts[2] || "6", selector].filter((part, index) => index < 3 || part).join(" | ");
    })
    .join("\n");
}

export function parseSourcesText(text: string): MuNewsSource[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name = `Nguồn ${index + 1}`, url = "", trustScore = "6", contentSelector = ""] = line.split("|").map((part) => part.trim());
      return {
        id: slugify(`${name}-${index + 1}`),
        name,
        url,
        trustScore: Number(trustScore) || 6,
        contentSelector,
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

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
