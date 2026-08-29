import type { ConfigurableInstrumentFamily, InstrumentMixSegment, NoteEvent, StudioSettings } from "../types";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import {
  instrumentFamiliesForMidi,
  midiInstrumentHints,
  PHRASE_INSTRUMENT_SEQUENCE,
} from "./instrumentMixCatalog";

export type PhraseInstrumentFamily = ConfigurableInstrumentFamily;
export type { InstrumentMixSegment } from "../types";
export { PHRASE_INSTRUMENT_SEQUENCE } from "./instrumentMixCatalog";

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
export const PHRASE_HARD_REST_MS = 480;
export const PHRASE_SOFT_REST_MS = 180;
export const PHRASE_TARGET_MS = 4_200;
export const PHRASE_MIN_MS = 1_500;
export const PHRASE_MAX_MS = 7_200;
export const INSTRUMENT_MIX_TARGET_PHRASES = 3;
export const INSTRUMENT_MIX_MIN_DURATION_MS = 500;

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

  for (let index = startIndex; index < events.length - 1; index += 1) {
    const nextMs = events[index + 1].timeMs;
    const runMs = nextMs - startMs;
    const onsetGap = onsetGapAfter(events, index);
    if (onsetGap <= 0) continue; // never split a chord / simultaneous strike

    const quietGap = releaseGapAfter(events, index);

    // A real breath is the preferred end of the musical sentence.
    if (runMs >= 420 && quietGap >= PHRASE_HARD_REST_MS) return index;

    if (runMs >= PHRASE_MIN_MS && quietGap >= PHRASE_SOFT_REST_MS) {
      // For dense songs without clean rests, use the most phrase-like local gap
      // near the target duration instead of changing instruments every N notes.
      const durationPenalty = Math.abs(runMs - PHRASE_TARGET_MS) * 0.22;
      const gapReward = Math.min(900, quietGap) * 2.4 + Math.min(520, onsetGap) * 0.3;
      const score = durationPenalty - gapReward;
      if (!bestSoft || score < bestSoft.score) bestSoft = { index, score, quietGap };
    }

    if (runMs >= PHRASE_MAX_MS && bestSoft) return bestSoft.index;
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

function eventTimelineEnd(events: readonly NoteEvent[]) {
  return events.reduce(
    (endMs, event) => Math.max(endMs, event.timeMs + Math.max(0, event.durationMs || 0)),
    0,
  );
}

export function recommendedInstrumentCountForMidi(events: NoteEvent[]) {
  const phraseCount = buildPhraseInstrumentPlan(events).length;
  if (phraseCount <= 1) return phraseCount;
  const phraseBased = Math.ceil(phraseCount / INSTRUMENT_MIX_TARGET_PHRASES);
  const midiTimbres = midiInstrumentHints(events).length;
  return Math.max(1, Math.min(phraseCount, PHRASE_INSTRUMENT_SEQUENCE.length, Math.max(phraseBased, midiTimbres)));
}

function phraseCountBeforeBestRest(
  events: NoteEvent[], phrases: PhraseInstrumentSegment[], start: number, instruments: number,
) {
  const remaining = phrases.length - start;
  if (instruments <= 1) return remaining;
  const minimum = remaining >= instruments * 2 ? 2 : 1;
  const maximum = Math.min(5, remaining - (instruments - 1) * minimum);
  let best = minimum;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let count = minimum; count <= maximum; count += 1) {
    const boundary = phrases[start + count];
    const quietGap = boundary ? releaseGapAfter(events, boundary.startIndex - 1) : 0;
    const score = quietGap - Math.abs(count - INSTRUMENT_MIX_TARGET_PHRASES) * 140;
    if (score > bestScore) { best = count; bestScore = score; }
  }
  return best;
}

export function buildAutomaticInstrumentMix(
  events: NoteEvent[],
  durationMs = eventTimelineEnd(events),
): InstrumentMixSegment[] {
  const phrases = buildPhraseInstrumentPlan(events);
  if (!phrases.length) return [];
  const safeDuration = Math.max(durationMs, eventTimelineEnd(events), INSTRUMENT_MIX_MIN_DURATION_MS);
  const instrumentCount = recommendedInstrumentCountForMidi(events);
  const families = instrumentFamiliesForMidi(events, instrumentCount);
  const segments: InstrumentMixSegment[] = [];
  let phraseIndex = 0;

  for (let segmentIndex = 0; segmentIndex < instrumentCount; segmentIndex += 1) {
    const remainingInstruments = instrumentCount - segmentIndex;
    const phraseCount = phraseCountBeforeBestRest(events, phrases, phraseIndex, remainingInstruments);
    const nextPhrase = phrases[phraseIndex + phraseCount];
    const startMs = segments.at(-1)?.endMs ?? 0;
    const endMs = nextPhrase?.startMs ?? safeDuration;
    segments.push({
      id: `instrument-mix-${segments.length}-${Math.round(startMs)}`,
      startMs,
      endMs: Math.max(startMs + INSTRUMENT_MIX_MIN_DURATION_MS, endMs),
      family: families[segmentIndex],
    });
    phraseIndex += phraseCount;
  }

  segments[segments.length - 1].endMs = safeDuration;
  return segments;
}

function snapInstrumentMixBoundary(
  events: readonly NoteEvent[],
  targetMs: number,
  minimumMs: number,
  maximumMs: number,
) {
  const safeTarget = Math.max(minimumMs, Math.min(maximumMs, targetMs));
  let best = safeTarget;
  let bestDistance = Number.POSITIVE_INFINITY;
  let previousTime = Number.NaN;
  for (const event of events) {
    if (event.timeMs === previousTime) continue;
    previousTime = event.timeMs;
    if (event.timeMs < minimumMs || event.timeMs > maximumMs) continue;
    const distance = Math.abs(event.timeMs - safeTarget);
    if (distance < bestDistance) {
      best = event.timeMs;
      bestDistance = distance;
    }
  }
  return best;
}

function closestPhraseBoundary(
  phrases: readonly PhraseInstrumentSegment[],
  targetMs: number,
  minimumPhraseIndex: number,
  maximumPhraseIndex: number,
) {
  let bestIndex = minimumPhraseIndex;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = minimumPhraseIndex; index <= maximumPhraseIndex; index += 1) {
    const distance = Math.abs(phrases[index].startMs - targetMs);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  }
  return bestIndex;
}

export function normalizeInstrumentMixSegments(
  segments: readonly InstrumentMixSegment[],
  events: readonly NoteEvent[],
  durationMs: number,
): InstrumentMixSegment[] {
  const safeDuration = Math.max(INSTRUMENT_MIX_MIN_DURATION_MS, durationMs, eventTimelineEnd(events));
  const phrases = buildPhraseInstrumentPlan([...events]);
  const usableLimit = phrases.length || segments.length;
  const usable = segments
    .filter((segment) => PHRASE_INSTRUMENT_SEQUENCE.includes(segment.family))
    .slice(0, usableLimit);
  if (!usable.length) return [];
  const normalized: InstrumentMixSegment[] = [];
  let cursorMs = 0;
  let phraseIndex = 0;

  usable.forEach((segment, index) => {
    const remaining = usable.length - index - 1;
    const isLast = remaining === 0;
    const rawDuration = Math.max(
      INSTRUMENT_MIX_MIN_DURATION_MS,
      Number.isFinite(segment.endMs - segment.startMs)
        ? segment.endMs - segment.startMs
        : INSTRUMENT_MIX_MIN_DURATION_MS,
    );
    const maximumEndMs = Math.max(
      cursorMs + INSTRUMENT_MIX_MIN_DURATION_MS,
      safeDuration - remaining * INSTRUMENT_MIX_MIN_DURATION_MS,
    );
    let endMs = safeDuration;
    if (!isLast && phrases.length) {
      const boundaryIndex = closestPhraseBoundary(
        phrases,
        cursorMs + rawDuration,
        phraseIndex + 1,
        phrases.length - remaining,
      );
      phraseIndex = boundaryIndex;
      endMs = phrases[boundaryIndex].startMs;
    } else if (!isLast) {
      endMs = snapInstrumentMixBoundary(
        events,
        cursorMs + rawDuration,
        cursorMs + INSTRUMENT_MIX_MIN_DURATION_MS,
        maximumEndMs,
      );
    }
    normalized.push({ ...segment, startMs: cursorMs, endMs });
    cursorMs = endMs;
  });

  return normalized.filter((segment) => segment.endMs > segment.startMs);
}

export function updateInstrumentMixSegmentDuration(segments: readonly InstrumentMixSegment[], id: string, durationSeconds: number, events: readonly NoteEvent[], durationMs: number) {
  const requestedMs = Math.max(
    INSTRUMENT_MIX_MIN_DURATION_MS,
    Number.isFinite(durationSeconds) ? durationSeconds * 1_000 : INSTRUMENT_MIX_MIN_DURATION_MS,
  );
  const segmentIndex = segments.findIndex((segment) => segment.id === id);
  const lastIndex = segments.length - 1;
  const safeDuration = Math.max(INSTRUMENT_MIX_MIN_DURATION_MS, durationMs, eventTimelineEnd(events));
  const updated = segmentIndex === lastIndex && segmentIndex > 0
    ? segments.map((segment, index) => index === segmentIndex - 1
      ? { ...segment, endMs: safeDuration - requestedMs }
      : segment)
    : segments.map((segment) => segment.id === id
      ? { ...segment, endMs: segment.startMs + requestedMs }
      : segment);
  return normalizeInstrumentMixSegments(
    updated,
    events,
    durationMs,
  );
}

export function updateInstrumentMixSegmentFamily(
  segments: readonly InstrumentMixSegment[],
  id: string,
  family: PhraseInstrumentFamily,
) {
  if (!PHRASE_INSTRUMENT_SEQUENCE.includes(family)) return [...segments];
  return segments.map((segment) => segment.id === id ? { ...segment, family } : segment);
}

export function addInstrumentMixSegment(
  segments: readonly InstrumentMixSegment[],
  events: readonly NoteEvent[],
  durationMs: number,
) {
  if (!segments.length) return buildAutomaticInstrumentMix([...events], durationMs);
  let splitIndex = -1;
  let longestDuration = 0;
  segments.forEach((segment, index) => {
    const segmentDuration = segment.endMs - segment.startMs;
    if (segmentDuration >= INSTRUMENT_MIX_MIN_DURATION_MS * 2 && segmentDuration > longestDuration) {
      longestDuration = segmentDuration;
      splitIndex = index;
    }
  });
  if (splitIndex < 0) return [...segments];

  const segment = segments[splitIndex];
  const boundaryMs = snapInstrumentMixBoundary(
    events,
    segment.startMs + longestDuration * 0.5,
    segment.startMs + INSTRUMENT_MIX_MIN_DURATION_MS,
    segment.endMs - INSTRUMENT_MIX_MIN_DURATION_MS,
  );
  const familyIndex = Math.max(0, PHRASE_INSTRUMENT_SEQUENCE.indexOf(segment.family));
  const nextFamily = PHRASE_INSTRUMENT_SEQUENCE[(familyIndex + 1) % PHRASE_INSTRUMENT_SEQUENCE.length];
  const split = [
    { ...segment, endMs: boundaryMs },
    {
      id: `instrument-mix-custom-${segments.length}-${Math.round(boundaryMs)}`,
      startMs: boundaryMs,
      endMs: segment.endMs,
      family: nextFamily,
    },
  ];
  return normalizeInstrumentMixSegments(
    [...segments.slice(0, splitIndex), ...split, ...segments.slice(splitIndex + 1)],
    events,
    durationMs,
  );
}

export function removeInstrumentMixSegment(
  segments: readonly InstrumentMixSegment[],
  id: string,
  events: readonly NoteEvent[],
  durationMs: number,
) {
  if (segments.length <= 1) return [...segments];
  return normalizeInstrumentMixSegments(
    segments.filter((segment) => segment.id !== id),
    events,
    durationMs,
  );
}

export function instrumentMixSegmentForTime(segments: readonly InstrumentMixSegment[], timeMs: number) {
  if (!segments.length) return null;
  let low = 0;
  let high = segments.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (segments[mid].startMs <= timeMs) low = mid;
    else high = mid - 1;
  }
  return segments[low] ?? null;
}

export function createInstrumentMixSettingsResolver(
  events: readonly NoteEvent[],
  segments: readonly InstrumentMixSegment[],
  resolveBaseSettings: StudioSettingsResolver,
): StudioSettingsResolver {
  const cache = new Map<string, StudioSettings>();
  return (index: number) => {
    const base = resolveBaseSettings(index);
    if (base.instrumentFamily !== "mixed") return base;
    const event = events[index];
    const segment = event ? instrumentMixSegmentForTime(segments, event.timeMs) : null;
    if (!segment) return base;
    const key = `${segment.id}:${segment.family}:${base.instrumentLayout}:${base.terrainProfile}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const resolved = { ...base, instrumentFamily: segment.family };
    cache.set(key, resolved);
    return resolved;
  };
}

export function createPhraseInstrumentSettingsResolver(
  events: NoteEvent[],
  resolveBaseSettings: StudioSettingsResolver,
): StudioSettingsResolver {
  return createInstrumentMixSettingsResolver(
    events,
    buildAutomaticInstrumentMix(events),
    resolveBaseSettings,
  );
}
