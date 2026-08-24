import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, MarblePoint } from "../lib/marbleCourse";
import { clamp, marbleAtTime } from "../lib/marbleCourse";
import { overrideForSegment } from "../lib/courseGuide";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";

export const RHYTHMIC_COURSE_WIDTH = 720;
export const RHYTHMIC_WORLD_SCALE = 0.012;

export interface RhythmicVisualPoint extends MarblePoint {
  z: number;
  segmentIndex: number;
  phase: number;
  impactAgeMs: number;
  renderedTimeMs: number;
}

function eventIndexAtOrBefore(events: NoteEvent[], timeMs: number) {
  if (!events.length || timeMs < events[0].timeMs) return 0;
  let low = 0;
  let high = events.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (events[mid].timeMs <= timeMs) low = mid;
    else high = mid - 1;
  }
  return low;
}

function seededDirection(index: number) {
  const raw = Math.sin((index + 19) * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw) >= 0.5 ? 1 : -1;
}

function depthForSegment(index: number, phase: number, settings: StudioSettings) {
  const amplitude = settings.terrainProfile === "comet" ? 0.24
    : settings.terrainProfile === "tube-board" ? 0.07
      : settings.terrainProfile === "xylophone" ? 0.045
        : 0.075;
  const arc = Math.sin(Math.PI * clamp(phase));
  const weave = Math.sin(Math.PI * 2 * clamp(phase)) * amplitude * 0.14;
  return seededDirection(index) * arc * amplitude + weave;
}

export function visualMarbleAtTime(
  timeMs: number,
  events: NoteEvent[],
  platforms: MarblePlatform[],
  settings: StudioSettings,
  overrides: CourseItemOverride[],
  resolveSettings?: StudioSettingsResolver,
): RhythmicVisualPoint {
  if (!events.length || !platforms.length) {
    const empty = marbleAtTime(timeMs, events, platforms, settings, overrides, resolveSettings);
    return { ...empty, z: 0, segmentIndex: 0, phase: 0, impactAgeMs: Number.POSITIVE_INFINITY, renderedTimeMs: timeMs };
  }

  if (timeMs < events[0].timeMs || events.length === 1) {
    const point = marbleAtTime(timeMs, events, platforms, settings, overrides, resolveSettings);
    return {
      ...point,
      z: 0,
      segmentIndex: 0,
      phase: 0,
      impactAgeMs: timeMs - events[0].timeMs,
      renderedTimeMs: timeMs,
    };
  }

  const index = Math.min(eventIndexAtOrBefore(events, timeMs), events.length - 1);
  if (index >= events.length - 1) {
    const point = marbleAtTime(timeMs, events, platforms, settings, overrides, resolveSettings);
    return {
      ...point,
      z: 0,
      segmentIndex: index,
      phase: 1,
      impactAgeMs: timeMs - events[index].timeMs,
      renderedTimeMs: timeMs,
    };
  }

  const start = events[index].timeMs;
  const end = events[index + 1].timeMs;
  const span = Math.max(1, end - start);
  const phase = clamp((timeMs - start) / span);
  // The course planner already solves a ballistic trajectory from outgoing velocity
  // + gravity so each landing occurs exactly on the next note. Do not time-warp that
  // trajectory in the presentation layer: doing so makes acceleration feel synthetic.
  const renderedTimeMs = timeMs;
  const segmentSettings = resolveSettings?.(index) ?? settings;
  const point = marbleAtTime(renderedTimeMs, events, platforms, settings, overrides, resolveSettings);
  return {
    ...point,
    z: overrideForSegment(index, overrides) ? 0 : depthForSegment(index, phase, segmentSettings),
    segmentIndex: index,
    phase,
    impactAgeMs: timeMs - start,
    renderedTimeMs,
  };
}

export function setWorldPoint(target: THREE.Vector3, point: Pick<RhythmicVisualPoint, "x" | "y" | "z">) {
  target.set(
    (point.x - RHYTHMIC_COURSE_WIDTH / 2) * RHYTHMIC_WORLD_SCALE,
    -point.y * RHYTHMIC_WORLD_SCALE,
    point.z,
  );
  return target;
}

export function impactSquash(ageMs: number) {
  if (ageMs < 0 || ageMs > 125) return 0;
  const envelope = Math.exp(-ageMs / 44);
  return 0.072 * envelope * Math.cos((ageMs / 46) * Math.PI);
}
