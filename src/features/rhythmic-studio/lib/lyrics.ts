import type { LyricCue } from "../types";

export type LyricFormat = "lrc" | "srt" | "plain";

function parseClock(value: string) {
  const parts = value.trim().replace(",", ".").split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  return null;
}

function finalizeCues(cues: Array<Omit<LyricCue, "id" | "endMs"> & { endMs?: number }>, durationMs: number) {
  const sorted = cues
    .filter((cue) => cue.text.trim() && Number.isFinite(cue.startMs))
    .sort((a, b) => a.startMs - b.startMs);
  return sorted.map((cue, index): LyricCue => {
    const nextStart = sorted[index + 1]?.startMs;
    const fallbackEnd = nextStart != null ? nextStart : cue.startMs + 4500;
    const endMs = Math.max(cue.startMs + 240, Math.min(durationMs || fallbackEnd, cue.endMs ?? fallbackEnd));
    return { id: `lyric-${index}-${Math.round(cue.startMs)}`, startMs: cue.startMs, endMs, text: cue.text.trim() };
  });
}

function parseLrc(text: string, durationMs: number) {
  const cues: Array<{ startMs: number; text: string }> = [];
  const stamp = /\[(\d{1,3}:\d{2}(?:[.:]\d{1,3})?)\]/g;
  for (const line of text.split(/\r?\n/)) {
    const timestamps = [...line.matchAll(stamp)];
    if (!timestamps.length) continue;
    const lyric = line.replace(stamp, "").trim();
    if (!lyric) continue;
    for (const match of timestamps) {
      const startMs = parseClock(match[1]);
      if (startMs != null) cues.push({ startMs, text: lyric });
    }
  }
  return finalizeCues(cues, durationMs);
}

function parseSrt(text: string, durationMs: number) {
  const cues: Array<{ startMs: number; endMs: number; text: string }> = [];
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex < 0) continue;
    const [startRaw, endRaw] = lines[timingIndex].split("-->").map((part) => part.trim().split(/\s+/)[0]);
    const startMs = parseClock(startRaw);
    const endMs = parseClock(endRaw);
    const lyric = lines.slice(timingIndex + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (startMs != null && endMs != null && lyric) cues.push({ startMs, endMs, text: lyric });
  }
  return finalizeCues(cues, durationMs);
}

function parsePlain(text: string, durationMs: number) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const usableDuration = Math.max(1000, durationMs || lines.length * 3200);
  const slot = usableDuration / Math.max(1, lines.length);
  return finalizeCues(lines.map((line, index) => ({ startMs: index * slot, endMs: (index + 1) * slot, text: line })), usableDuration);
}

export function parseLyrics(text: string, durationMs: number): { cues: LyricCue[]; format: LyricFormat } {
  const normalized = text.trim();
  if (!normalized) return { cues: [], format: "plain" };
  if (/\[\d{1,3}:\d{2}(?:[.:]\d{1,3})?\]/.test(normalized)) return { cues: parseLrc(normalized, durationMs), format: "lrc" };
  if (/\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->/.test(normalized)) return { cues: parseSrt(normalized, durationMs), format: "srt" };
  return { cues: parsePlain(normalized, durationMs), format: "plain" };
}

export function activeLyricAt(cues: LyricCue[], timeMs: number) {
  let low = 0;
  let high = cues.length - 1;
  let candidate = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cues[mid].startMs <= timeMs) { candidate = mid; low = mid + 1; }
    else high = mid - 1;
  }
  if (candidate < 0) return { current: null, next: cues[0] ?? null, index: -1 };
  const current = timeMs <= cues[candidate].endMs ? cues[candidate] : null;
  return { current, next: cues[candidate + 1] ?? null, index: candidate };
}
