import type { YoutubeDownloadMode } from "../models/YoutubeTools";

export function buildYoutubeDownloadSectionArgs(
  mode: YoutubeDownloadMode,
  startValue?: number,
  endValue?: number,
) {
  const start = Number(startValue);
  const end = Number(endValue);
  if (mode !== "video" || !Number.isFinite(start) || !Number.isFinite(end)) return [];

  const normalizedStart = Math.max(0, start);
  const normalizedEnd = Math.max(normalizedStart, end);
  if (normalizedEnd - normalizedStart < 0.5 || normalizedEnd - normalizedStart > 20) {
    throw new Error("Trích đoạn YouTube phải dài từ 0.5 đến 20 giây.");
  }

  return ["--download-sections", `*${normalizedStart}-${normalizedEnd}`, "--force-keyframes-at-cuts"];
}
