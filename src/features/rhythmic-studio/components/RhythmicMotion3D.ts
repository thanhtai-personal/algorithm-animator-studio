import * as THREE from "three";
import type { CourseItemOverride, NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, MarblePoint } from "../lib/marbleCourse";
import { clamp, marbleAtTime } from "../lib/marbleCourse";
import { overrideForSegment } from "../lib/courseGuide";
import { isPlatformCourseItem, overrideForNode } from "../lib/courseItems";
import { resolvePlatformStyle } from "../lib/platformStyles";
import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import { settingsForChaseOwner } from "../engine/chaseCoursePlanner";
import type { ChaseOwner } from "../engine/chaseStrikeOwnership";
import type { ChaseCoursePlan } from "../lib/chaseCourse";
import { instrumentMarbleContactDepth3D } from "./instrumentPlayingSurface3D";
import {
  isKorobeinikiWallLayout,
  wallScoreTubeContactDepth3D,
} from "../lib/korobeinikiReferenceLayout";

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
  // Wall-mounted instruments are designed around a single physical collision
  // plane. A signed decorative Z weave made the marble periodically move behind
  // the instrument face and read as penetration. Keep those courses planar.
  if (settings.instrumentFamily !== "auto" || settings.terrainProfile === "tube-board" || settings.terrainProfile === "xylophone") return 0;
  const amplitude = settings.terrainProfile === "comet" ? 0.14 : 0.025;
  const curveScale = 1 + THREE.MathUtils.clamp(settings.curveIntensity, 0, 1.2) * 0.25;
  const pathScale = 1 + THREE.MathUtils.clamp(settings.curvePathLength, 0, 1.2) * 0.18;
  const arc = Math.sin(Math.PI * clamp(phase));
  const weave = Math.sin(Math.PI * 2 * clamp(phase)) * amplitude * 0.06 * pathScale;
  // Always bias toward the camera; never send the marble behind the platform face.
  return Math.max(0, arc * amplitude * curveScale + weave);
}

function contactDepthForPlatform(
  platform: MarblePlatform | undefined,
  settings: StudioSettings,
  overrides: CourseItemOverride[],
) {
  if (!platform) return 0;
  const override = overrideForNode(platform.index, overrides);
  if (override && !isPlatformCourseItem(override.style)) return 0;
  const style = platform.visualStyle
    ?? (override && isPlatformCourseItem(override.style) ? override.style : resolvePlatformStyle(platform.index, settings));
  if (style === "wall-boomwhacker-tube" && isKorobeinikiWallLayout(settings)) {
    return wallScoreTubeContactDepth3D(platform.index, settings);
  }
  return instrumentMarbleContactDepth3D(style, settings.ballSize * RHYTHMIC_WORLD_SCALE);
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
    const firstSettings = resolveSettings?.(0) ?? settings;
    return {
      ...point,
      z: contactDepthForPlatform(platforms[0], firstSettings, overrides),
      segmentIndex: 0,
      phase: 0,
      impactAgeMs: timeMs - events[0].timeMs,
      renderedTimeMs: timeMs,
    };
  }

  const index = Math.min(eventIndexAtOrBefore(events, timeMs), events.length - 1);
  if (index >= events.length - 1) {
    const point = marbleAtTime(timeMs, events, platforms, settings, overrides, resolveSettings);
    const finalSettings = resolveSettings?.(index) ?? settings;
    return {
      ...point,
      z: contactDepthForPlatform(platforms[index], finalSettings, overrides),
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
  const nextSettings = resolveSettings?.(index + 1) ?? settings;
  const point = marbleAtTime(renderedTimeMs, events, platforms, settings, overrides, resolveSettings);
  const contactStartZ = contactDepthForPlatform(platforms[index], segmentSettings, overrides);
  const contactEndZ = contactDepthForPlatform(platforms[index + 1], nextSettings, overrides);
  const contactZ = THREE.MathUtils.lerp(contactStartZ, contactEndZ, phase);
  return {
    ...point,
    z: contactZ + (overrideForSegment(index, overrides) ? 0 : depthForSegment(index, phase, segmentSettings)),
    segmentIndex: index,
    phase,
    impactAgeMs: timeMs - start,
    renderedTimeMs,
  };
}

export function visualChaseMarbleAtTime(
  owner: ChaseOwner,
  timeMs: number,
  plan: ChaseCoursePlan,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
): RhythmicVisualPoint {
  const track = plan.tracks[owner];
  if (!track.events.length) {
    return {
      x: track.lane.centerX,
      y: 180,
      z: 0,
      color: settings.prismStart,
      platformIndex: 0,
      segmentIndex: 0,
      phase: 0,
      impactAgeMs: Number.POSITIVE_INFINITY,
      renderedTimeMs: timeMs,
    };
  }
  const ownerSettings = settingsForChaseOwner(settings, owner);
  const resolveTrackSettings = resolveSettings
    ? (localIndex: number) => settingsForChaseOwner(resolveSettings(track.eventIndices[localIndex] ?? 0), owner)
    : undefined;
  const local = visualMarbleAtTime(
    timeMs,
    track.events,
    track.platforms,
    ownerSettings,
    [],
    resolveTrackSettings,
  );
  const platformLocalIndex = Math.max(0, Math.min(track.eventIndices.length - 1, local.platformIndex));
  const segmentLocalIndex = Math.max(0, Math.min(track.eventIndices.length - 1, local.segmentIndex));
  return {
    ...local,
    platformIndex: track.eventIndices[platformLocalIndex],
    segmentIndex: track.eventIndices[segmentLocalIndex],
  };
}

export function visualChaseFocusAtTime(
  timeMs: number,
  plan: ChaseCoursePlan,
  settings: StudioSettings,
  resolveSettings?: StudioSettingsResolver,
): RhythmicVisualPoint {
  const a = visualChaseMarbleAtTime("A", timeMs, plan, settings, resolveSettings);
  const b = visualChaseMarbleAtTime("B", timeMs, plan, settings, resolveSettings);
  const eventIndex = eventIndexAtOrBefore(plan.events, timeMs);
  const event = plan.events[eventIndex];
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
    z: (a.z + b.z) * 0.5,
    color: a.color,
    platformIndex: eventIndex,
    segmentIndex: eventIndex,
    phase: (a.phase + b.phase) * 0.5,
    impactAgeMs: event ? timeMs - event.timeMs : Number.POSITIVE_INFINITY,
    renderedTimeMs: timeMs,
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
  const envelope = Math.exp(-ageMs / 34);
  // A hard 7% squash made glass/chrome marbles look rubbery. Keep just enough
  // deformation to communicate contact without overriding the ballistic motion.
  return 0.032 * envelope * Math.cos((ageMs / 40) * Math.PI);
}
