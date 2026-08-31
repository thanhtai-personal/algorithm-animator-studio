import type { InstrumentMixSegment, NoteEvent } from "../types";
import {
  buildAutomaticInstrumentMix,
  INSTRUMENT_MIX_MIN_DURATION_MS,
  normalizeInstrumentMixSegments,
  PHRASE_INSTRUMENT_SEQUENCE,
} from "./phraseInstrumentMix";

function snapBoundary(
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
  const boundaryMs = snapBoundary(
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
