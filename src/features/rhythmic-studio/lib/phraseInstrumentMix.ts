import type { InstrumentFamily, NoteEvent, StudioSettings } from "../types";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

export type PhraseInstrumentFamily = Exclude<InstrumentFamily, "auto" | "mixed">;

export interface PhraseInstrumentSegment {
  id: number;
  startIndex: number;
  endIndex: number;
  startMs: number;
  endMs: number;
  family: PhraseInstrumentFamily;
}

// The reference videos read as instrument "sentences": a complete musical phrase
// lives on one instrument installation, then the next phrase moves to another.
// Keep the sequence curated and deterministic so Mixed never looks shuffled.
export const PHRASE_INSTRUMENT_SEQUENCE: readonly PhraseInstrumentFamily[] = [
  "piano",
  "xylophone",
  "marimba",
  "vibraphone",
  "boomwhacker",
  "pluck",
  "metallophone",
  "gong",
  "flute",
] as const;

export const PHRASE_HARD_REST_MS = 560;
export const PHRASE_TARGET_MS = 4_200;
export const PHRASE_MIN_MS = 1_500;
export const PHRASE_MAX_MS = 7_200;

function onsetGapAfter(events: NoteEvent[], index: number) {
  if (index < 0 || index >= events.length - 1) return 0;
  return Math.max(0, events[index + 1].timeMs - events[index].timeMs);
}

function releaseGapAfter(events: NoteEvent[], index: number) {
  if (index < 0 || index >= events.length - 1) return 0;
  const nextMs = events[index + 1].timeMs;
  const scanStart = Math.max(0, index - 48);
  let activeUntil = events[index].timeMs;
  for (let cursor = scanStart; cursor <= index; cursor += 1) {
    const event = events[cursor];
    activeUntil = Math.max(activeUntil, event.timeMs + Math.max(0, event.durationMs || 0));
  }
  return Math.max(0, nextMs - activeUntil);
}

interface BoundaryCandidate {
  index: number;
  score: number;
  quietGap: number;
}

function choosePhraseBoundary(events: NoteEvent[], startIndex: number) {
  const startMs = events[startIndex]?.timeMs ?? 0;
  let bestSoft: BoundaryCandidate | null = null;
  let lastSafeIndex: number | null = null;

  for (let index = startIndex; index < events.length - 1; index += 1) {
    const nextMs = events[index + 1].timeMs;
    const runMs = nextMs - startMs;
    const onsetGap = onsetGapAfter(events, index);
    if (onsetGap <= 0) continue; // never split a chord / simultaneous strike

    lastSafeIndex = index;
    const quietGap = Math.max(onsetGap, releaseGapAfter(events, index));

    // A real breath is the preferred end of the musical sentence.
    if (runMs >= 420 && quietGap >= PHRASE_HARD_REST_MS) return index;

    if (runMs >= PHRASE_MIN_MS) {
      // For dense songs without clean rests, use the most phrase-like local gap
      // near the target duration instead of changing instruments every N notes.
      const durationPenalty = Math.abs(runMs - PHRASE_TARGET_MS) * 0.22;
      const gapReward = Math.min(900, quietGap) * 1.8 + Math.min(520, onsetGap) * 0.8;
      const score = durationPenalty - gapReward;
      if (!bestSoft || score < bestSoft.score) bestSoft = { index, score, quietGap };
    }

    if (runMs >= PHRASE_MAX_MS) {
      return bestSoft?.index ?? lastSafeIndex ?? index;
    }
  }

  return null;
}

export function buildPhraseInstrumentPlan(events: NoteEvent[]): PhraseInstrumentSegment[] {
  if (!events.length) return [];
  const segments: PhraseInstrumentSegment[] = [];
  let startIndex = 0;
  let phraseId = 0;

  while (startIndex < events.length) {
    const boundary = choosePhraseBoundary(events, startIndex);
    const endIndex = boundary ?? events.length - 1;
    segments.push({
      id: phraseId,
      startIndex,
      endIndex,
      startMs: events[startIndex]?.timeMs ?? 0,
      endMs: events[endIndex]?.timeMs ?? events[startIndex]?.timeMs ?? 0,
      family: PHRASE_INSTRUMENT_SEQUENCE[phraseId % PHRASE_INSTRUMENT_SEQUENCE.length],
    });
    if (boundary === null || endIndex >= events.length - 1) break;
    startIndex = endIndex + 1;
    phraseId += 1;
  }

  return segments;
}

function phraseForIndex(plan: PhraseInstrumentSegment[], index: number) {
  if (!plan.length) return null;
  let low = 0;
  let high = plan.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (plan[mid].startIndex <= index) low = mid;
    else high = mid - 1;
  }
  const segment = plan[low];
  return segment && index <= segment.endIndex ? segment : null;
}

export function createPhraseInstrumentSettingsResolver(
  events: NoteEvent[],
  resolveBaseSettings: StudioSettingsResolver,
): StudioSettingsResolver {
  const plan = buildPhraseInstrumentPlan(events);
  const cache = new Map<string, StudioSettings>();

  return (index: number) => {
    const base = resolveBaseSettings(index);
    if (base.instrumentFamily !== "mixed") return base;
    const segment = phraseForIndex(plan, index);
    if (!segment) return base;
    const key = `${segment.id}:${segment.family}:${base.instrumentLayout}:${base.terrainProfile}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const resolved = { ...base, instrumentFamily: segment.family };
    cache.set(key, resolved);
    return resolved;
  };
}
