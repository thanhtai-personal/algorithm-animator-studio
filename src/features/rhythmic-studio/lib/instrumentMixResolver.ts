import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { InstrumentMixSegment, NoteEvent, StudioSettings } from "../types";
import { KOROBEINIKI_INSTRUMENT_MIX_SELECTION } from "./instrumentMixCatalog";
import { KOROBEINIKI_TUBE_PROFILE } from "./korobeinikiTubeProfile";

export function instrumentMixSegmentForTime(
  segments: readonly InstrumentMixSegment[],
  timeMs: number,
) {
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

function settingsForSegment(base: StudioSettings, segment: InstrumentMixSegment): StudioSettings {
  if (segment.variant !== KOROBEINIKI_INSTRUMENT_MIX_SELECTION) {
    return { ...base, instrumentFamily: segment.family };
  }
  return {
    ...base,
    ...KOROBEINIKI_TUBE_PROFILE,
  };
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
    const key = `${segment.id}:${segment.family}:${segment.variant ?? "default"}:${base.instrumentLayout}:${base.terrainProfile}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const resolved = settingsForSegment(base, segment);
    cache.set(key, resolved);
    return resolved;
  };
}
