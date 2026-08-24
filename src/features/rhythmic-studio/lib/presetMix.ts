import type { NoteEvent, StudioSettings } from "../types";
import { RHYTHMIC_PRESET_IDS, presetById, type RhythmicPresetId } from "./studioPresets";

export const PRESET_MIX_MIN_RUN_MS = 18_000;
export const PRESET_MIX_TARGET_RUN_MS = 28_000;
export const PRESET_MIX_MAX_RUN_MS = 42_000;
export const PRESET_MIX_PREFERRED_REST_MS = 1_350;
export const PRESET_MIX_FALLBACK_REST_MS = 850;

export interface PresetMixSegment {
  presetId: RhythmicPresetId;
  startIndex: number;
  endIndex: number;
  startMs: number;
  endMs: number;
  restBeforeMs: number;
}

export interface PresetMixPlan {
  enabled: boolean;
  segments: PresetMixSegment[];
}

const MIXABLE_KEYS = [
  "minBounceDistance",
  "curveIntensity",
  "curvePathLength",
  "animationSensitivity",
  "spectralDensity",
  "prismStart",
  "prismEnd",
  "ballStyle",
  "ballBaseColor",
  "ballStripeColor",
  "colorPaletteMode",
  "terrainProfile",
  "cameraProfile",
  "trailLength",
  "ballSize",
  "particleCount",
  "platformWidth",
  "platformThickness",
  "platformGap",
  "laneSpread",
  "platformTilt",
  "bounceHeight",
  "cameraAnchor",
  "cameraSmoothing",
  "platformGlow",
  "platformPrimaryStyle",
  "platformSecondaryStyle",
  "platformAccentStyle",
  "platformMixMode",
  "platformAccentEvery",
  "platformDetail",
  "impactRipple",
] as const satisfies readonly (keyof StudioSettings)[];

function hash(seed: number) {
  const raw = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function nextPreset(current: RhythmicPresetId, seed: number) {
  const choices = RHYTHMIC_PRESET_IDS.filter((id) => id !== current);
  return choices[Math.floor(hash(seed) * choices.length) % choices.length] ?? RHYTHMIC_PRESET_IDS[0];
}

function gapAfter(events: NoteEvent[], index: number) {
  if (index < 0 || index >= events.length - 1) return 0;
  return Math.max(0, events[index + 1].timeMs - events[index].timeMs);
}

function chooseBoundary(events: NoteEvent[], segmentStartIndex: number) {
  const segmentStartMs = events[segmentStartIndex]?.timeMs ?? 0;
  let preferred: { index: number; score: number } | null = null;
  let fallback: { index: number; score: number } | null = null;

  for (let index = segmentStartIndex; index < events.length - 1; index += 1) {
    const nextMs = events[index + 1].timeMs;
    const runMs = nextMs - segmentStartMs;
    if (runMs < PRESET_MIX_MIN_RUN_MS) continue;
    const gap = gapAfter(events, index);
    const score = Math.abs(runMs - PRESET_MIX_TARGET_RUN_MS) - Math.min(1800, gap) * 0.16;
    if (gap >= PRESET_MIX_PREFERRED_REST_MS && (!preferred || score < preferred.score)) preferred = { index, score };
    if (gap >= PRESET_MIX_FALLBACK_REST_MS && (!fallback || score < fallback.score)) fallback = { index, score };
    if (runMs >= PRESET_MIX_MAX_RUN_MS) break;
  }

  if (preferred) return preferred.index;
  if (fallback) return fallback.index;

  // If a song has no clear rest inside the target window, keep the current preset
  // until the first genuine pause rather than cutting in the middle of a phrase.
  for (let index = segmentStartIndex; index < events.length - 1; index += 1) {
    const runMs = events[index + 1].timeMs - segmentStartMs;
    if (runMs < PRESET_MIX_MAX_RUN_MS) continue;
    if (gapAfter(events, index) >= PRESET_MIX_FALLBACK_REST_MS) return index;
  }
  return null;
}

export function buildPresetMixPlan(events: NoteEvent[], enabled: boolean, startPresetId: RhythmicPresetId | null): PresetMixPlan {
  if (!enabled || events.length < 2) return { enabled: false, segments: [] };
  const startPreset = startPresetId ?? RHYTHMIC_PRESET_IDS[Math.floor(hash(events.length + events[0].timeMs) * RHYTHMIC_PRESET_IDS.length) % RHYTHMIC_PRESET_IDS.length];
  const segments: PresetMixSegment[] = [];
  let startIndex = 0;
  let presetId = startPreset;
  let sequence = 0;

  while (startIndex < events.length) {
    let boundaryIndex = chooseBoundary(events, startIndex);
    if (boundaryIndex !== null) {
      const nextStartIndex = boundaryIndex + 1;
      const remainingMs = (events[events.length - 1]?.timeMs ?? 0) - (events[nextStartIndex]?.timeMs ?? 0);
      if (remainingMs < PRESET_MIX_MIN_RUN_MS * 0.72) boundaryIndex = null;
    }
    const endIndex = boundaryIndex === null ? events.length - 1 : boundaryIndex;
    const startMs = events[startIndex]?.timeMs ?? 0;
    const endMs = boundaryIndex === null ? (events[events.length - 1]?.timeMs ?? startMs) : events[boundaryIndex + 1].timeMs;
    const restBeforeMs = startIndex > 0 ? gapAfter(events, startIndex - 1) : 0;
    segments.push({ presetId, startIndex, endIndex, startMs, endMs, restBeforeMs });
    if (boundaryIndex === null || boundaryIndex >= events.length - 2) break;
    startIndex = boundaryIndex + 1;
    sequence += 1;
    presetId = nextPreset(presetId, events.length * 31 + startIndex * 17 + sequence * 101);
  }
  return { enabled: segments.length > 1, segments };
}

export function presetMixSegmentForIndex(plan: PresetMixPlan, index: number) {
  if (!plan.enabled || !plan.segments.length) return null;
  let low = 0;
  let high = plan.segments.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (plan.segments[mid].startIndex <= index) low = mid;
    else high = mid - 1;
  }
  return plan.segments[low] ?? null;
}

export function presetMixSegmentForTime(plan: PresetMixPlan, events: NoteEvent[], timeMs: number) {
  if (!plan.enabled || !plan.segments.length) return null;
  let eventIndex = 0;
  let low = 0;
  let high = Math.max(0, events.length - 1);
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (events[mid].timeMs <= timeMs) low = mid;
    else high = mid - 1;
  }
  eventIndex = low;
  return presetMixSegmentForIndex(plan, eventIndex);
}

export function mixedPresetSettings(base: StudioSettings, presetId: RhythmicPresetId): StudioSettings {
  const preset = presetById(presetId).settings;
  const mixed = { ...base };
  for (const key of MIXABLE_KEYS) {
    const value = preset[key];
    if (value !== undefined) (mixed as Record<string, unknown>)[key] = value;
  }
  return mixed;
}

export function presetMixSettingsForIndex(base: StudioSettings, plan: PresetMixPlan, index: number) {
  const segment = presetMixSegmentForIndex(plan, index);
  return segment ? mixedPresetSettings(base, segment.presetId) : base;
}

export function presetMixSettingsForTime(base: StudioSettings, plan: PresetMixPlan, events: NoteEvent[], timeMs: number) {
  const segment = presetMixSegmentForTime(plan, events, timeMs);
  return segment ? mixedPresetSettings(base, segment.presetId) : base;
}

export function createPresetMixSettingsResolver(base: StudioSettings, plan: PresetMixPlan) {
  const cache = new Map<RhythmicPresetId, StudioSettings>();
  return (index: number) => {
    const segment = presetMixSegmentForIndex(plan, index);
    if (!segment) return base;
    const cached = cache.get(segment.presetId);
    if (cached) return cached;
    const resolved = mixedPresetSettings(base, segment.presetId);
    cache.set(segment.presetId, resolved);
    return resolved;
  };
}
