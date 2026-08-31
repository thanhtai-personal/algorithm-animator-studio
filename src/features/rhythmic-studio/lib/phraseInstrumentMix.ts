import type { ConfigurableInstrumentFamily, InstrumentMixSegment, NoteEvent } from "../types";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { createInstrumentMixSettingsResolver } from "./instrumentMixResolver";
import {
  instrumentFamiliesForMidi,
  KOROBEINIKI_INSTRUMENT_MIX_SELECTION,
  midiInstrumentHints,
  PHRASE_INSTRUMENT_SEQUENCE,
  type InstrumentMixSelection,
} from "./instrumentMixCatalog";

export type PhraseInstrumentFamily = ConfigurableInstrumentFamily;
export type { InstrumentMixSegment } from "../types";
export { PHRASE_INSTRUMENT_SEQUENCE } from "./instrumentMixCatalog";
export { createInstrumentMixSettingsResolver, instrumentMixSegmentForTime } from "./instrumentMixResolver";

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
export const PHRASE_TARGET_MS = 3_400;
export const PHRASE_MIN_MS = 1_400;
export const PHRASE_MAX_MS = 5_200;
// Two compact musical phrases per installation keeps a Shorts-style course
// visually fresh without changing instrument on every few notes.
export const INSTRUMENT_MIX_TARGET_PHRASES = 2;
// Reference Shorts change the visual installation frequently enough to keep the
// eye moving. Long songs therefore get additional sections even when the MIDI
// parser found only a handful of large musical phrases.
// The Maroon 5 reference changes each instrument installation after roughly
// 3-5 seconds. Keep that visual rhythm on long songs, while phrase snapping
// below still prevents a timbre change in the middle of a musical sentence.
export const INSTRUMENT_MIX_TARGET_SECTION_MS = 4_200;
export const INSTRUMENT_MIX_MAX_SECTION_MS = 5_500;
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
  let bestOnset: BoundaryCandidate | null = null;

  for (let index = startIndex; index < events.length - 1; index += 1) {
    const nextMs = events[index + 1].timeMs;
    const runMs = nextMs - startMs;
    const onsetGap = onsetGapAfter(events, index);
    if (onsetGap <= 0) continue; // never split a chord / simultaneous strike

    const quietGap = releaseGapAfter(events, index);

    if (runMs >= PHRASE_MIN_MS) {
      // Some imported MIDI keeps each note held almost until the next section,
      // so releaseGap can stay near zero even when the onset spacing clearly
      // marks a phrase boundary. Keep an onset-only fallback to prevent 20-30 s
      // installations that become visually repetitive.
      const durationPenalty = Math.abs(runMs - PHRASE_TARGET_MS) * 0.2;
      const onsetReward = Math.min(1_200, onsetGap) * 0.78;
      const score = durationPenalty - onsetReward;
      if (!bestOnset || score < bestOnset.score) {
        bestOnset = { index, score, quietGap: onsetGap };
      }
    }

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

    if (runMs >= PHRASE_MAX_MS) return bestSoft?.index ?? bestOnset?.index ?? index;
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
  const durationBased = Math.ceil(eventTimelineEnd(events) / INSTRUMENT_MIX_TARGET_SECTION_MS);
  const midiTimbres = midiInstrumentHints(events).length;
  const releaseBased = 1 + events.slice(0, -1).filter((_, index) => (
    releaseGapAfter(events, index) >= PHRASE_SOFT_REST_MS
  )).length;
  // The curated family order may repeat after one cycle on long songs. Capping
  // by the number of unique families made a 2-minute MIDI collapse into a few
  // 20+ second sections.
  const desired = Math.max(phraseBased, durationBased, midiTimbres);
  // When a song offers plenty of true release gaps, never create more visual
  // sections than can be separated cleanly. Sustained MIDIs with few release
  // gaps keep the onset fallback so their visuals do not stagnate.
  const cleanBoundaryLimit = releaseBased >= Math.ceil(phraseCount / 2)
    ? releaseBased
    : phraseCount;
  return Math.max(1, Math.min(phraseCount, cleanBoundaryLimit, desired));
}

function phraseCountBeforeBestRest(
  events: NoteEvent[],
  phrases: PhraseInstrumentSegment[],
  start: number,
  instruments: number,
  segmentStartMs: number,
) {
  const remaining = phrases.length - start;
  if (instruments <= 1) return remaining;
  const minimum = remaining >= instruments * 2 ? 2 : 1;
  const maximum = Math.min(
    INSTRUMENT_MIX_TARGET_PHRASES,
    remaining - (instruments - 1) * minimum,
  );
  let best = minimum;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let count = minimum; count <= maximum; count += 1) {
    const boundary = phrases[start + count];
    const quietGap = boundary ? releaseGapAfter(events, boundary.startIndex - 1) : 0;
    const sectionEndMs = boundary?.startMs ?? eventTimelineEnd(events);
    const sectionMs = Math.max(0, sectionEndMs - segmentStartMs);
    // Prefer a clean musical rest, but never keep two phrases together when
    // that would create a visually stale 10-20 second installation.
    if (count > minimum && sectionMs > INSTRUMENT_MIX_MAX_SECTION_MS) continue;
    const score = quietGap
      - Math.abs(count - INSTRUMENT_MIX_TARGET_PHRASES) * 140
      - Math.abs(sectionMs - INSTRUMENT_MIX_TARGET_SECTION_MS) * 0.08;
    if (score > bestScore) { best = count; bestScore = score; }
  }
  return best;
}

export function buildAutomaticInstrumentMix(
  events: NoteEvent[],
  durationMs = eventTimelineEnd(events),
): InstrumentMixSegment[] {
  const detectedPhrases = buildPhraseInstrumentPlan(events);
  if (!detectedPhrases.length) return [];
  const releasePhrases = detectedPhrases.filter((phrase, index) => (
    index === 0 || releaseGapAfter(events, phrase.startIndex - 1) >= PHRASE_SOFT_REST_MS
  ));
  const phrases = releasePhrases.length >= Math.ceil(detectedPhrases.length / 2)
    ? releasePhrases
    : detectedPhrases;
  const safeDuration = Math.max(durationMs, eventTimelineEnd(events), INSTRUMENT_MIX_MIN_DURATION_MS);
  const instrumentCount = Math.min(phrases.length, recommendedInstrumentCountForMidi(events));
  const families = instrumentFamiliesForMidi(events, instrumentCount);
  const segments: InstrumentMixSegment[] = [];
  let phraseIndex = 0;

  for (let segmentIndex = 0; segmentIndex < instrumentCount; segmentIndex += 1) {
    const remainingInstruments = instrumentCount - segmentIndex;
    const startMs = segments.at(-1)?.endMs ?? 0;
    const phraseCount = phraseCountBeforeBestRest(
      events,
      phrases,
      phraseIndex,
      remainingInstruments,
      startMs,
    );
    const nextPhrase = phrases[phraseIndex + phraseCount];
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
  const usableLimit = Math.max(1, Math.floor(safeDuration / INSTRUMENT_MIX_MIN_DURATION_MS));
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
    const minimumPhraseIndex = phraseIndex + 1;
    const maximumPhraseIndex = phrases.length - remaining;
    if (!isLast && minimumPhraseIndex <= maximumPhraseIndex) {
      const boundaryIndex = closestPhraseBoundary(
        phrases,
        cursorMs + rawDuration,
        minimumPhraseIndex,
        maximumPhraseIndex,
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
  family: InstrumentMixSelection,
) {
  if (family === KOROBEINIKI_INSTRUMENT_MIX_SELECTION) {
    return segments.map((segment) => segment.id === id
      ? { ...segment, family: "boomwhacker" as const, variant: family }
      : segment);
  }
  if (!PHRASE_INSTRUMENT_SEQUENCE.includes(family)) return [...segments];
  return segments.map((segment) => segment.id === id
    ? { ...segment, family, variant: undefined }
    : segment);
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
