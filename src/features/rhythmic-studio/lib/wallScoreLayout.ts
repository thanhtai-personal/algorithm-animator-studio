import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform, Vec2 } from "../engine/marblePhysicsTypes";
import { presetObstaclePlan } from "../engine/presetObstaclePlan";
import type { NoteEvent, StudioSettings } from "../types";
import { wallScoreReferenceHits } from "./korobeinikiReferenceLayout";
import { noteColorForMidi } from "./noteColors";

const WALL_SCORE_MIN_ARC_HEIGHT = 18;
const WALL_SCORE_TERMINAL_GRAVITY = 780;
const MAX_PLAYING_FACE_TILT_RAD = 0.72;

interface WallScoreFlight {
  hit: Vec2;
  outVX: number;
  outVY: number;
  gravity: number;
  spanSeconds: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function usesSharedWallScore(settings: StudioSettings) {
  return settings.instrumentFamily !== "auto"
    || settings.instrumentLayout === "wall-score"
    || settings.platformPrimaryStyle === "toy-peg"
    || settings.platformPrimaryStyle === "comet-pad";
}

function wallScoreFlight(
  index: number,
  events: readonly NoteEvent[],
  hits: readonly Vec2[],
  settings: StudioSettings,
): WallScoreFlight {
  const event = events[index];
  const hit = hits[index];
  const next = hits[index + 1];
  const spanSeconds = next
    ? Math.max(0.08, (events[index + 1].timeMs - event.timeMs) / 1_000)
    : 0.42;
  const deltaY = next ? next.y - hit.y : 0;
  const bounceHeight = Math.max(
    WALL_SCORE_MIN_ARC_HEIGHT,
    deltaY * 0.25 + settings.ballSize * 0.45,
  );
  const previous = hits[index - 1];
  const terminalDirection = previous ? Math.sign(hit.x - previous.x) || 1 : 1;

  return {
    hit,
    spanSeconds,
    outVX: next ? (next.x - hit.x) / spanSeconds : terminalDirection * 110,
    outVY: next
      ? (deltaY - 4 * bounceHeight) / spanSeconds
      : -Math.max(160, settings.ballSize * 10),
    gravity: next
      ? 8 * bounceHeight / spanSeconds ** 2
      : WALL_SCORE_TERMINAL_GRAVITY,
  };
}

function incomingVelocity(index: number, flights: readonly WallScoreFlight[], settings: StudioSettings): Vec2 {
  if (index === 0) return { x: 0, y: Math.max(128, settings.ballSize * 7.5) };
  const previous = flights[index - 1];
  return {
    x: previous.outVX,
    y: previous.outVY + previous.gravity * previous.spanSeconds,
  };
}

function collisionSurface(incoming: Vec2, outgoing: Vec2) {
  const impulse = {
    x: outgoing.x - incoming.x,
    y: outgoing.y - incoming.y,
  };
  const length = Math.hypot(impulse.x, impulse.y);
  const solvedNormal = length > 1e-6
    ? { x: impulse.x / length, y: impulse.y / length }
    : { x: 0, y: -1 };
  const upwardNormal = solvedNormal.y < 0
    ? solvedNormal
    : { x: -solvedNormal.x, y: -solvedNormal.y };
  const solvedAngle = Math.atan2(upwardNormal.x, -upwardNormal.y);
  const angle = clamp(solvedAngle, -MAX_PLAYING_FACE_TILT_RAD, MAX_PLAYING_FACE_TILT_RAD);
  return {
    angle,
    normal: { x: Math.sin(angle), y: -Math.cos(angle) },
  };
}

function visualPlan(index: number, settings: StudioSettings) {
  // The legacy selector no longer controls concrete-instrument geometry. Use it
  // only to ask the existing family resolver for that instrument's real mesh.
  return presetObstaclePlan(index, { ...settings, instrumentLayout: "gallery" });
}

export function buildSharedWallScoreCourse(
  events: readonly NoteEvent[],
  settings: StudioSettings,
  width: number,
  resolveSettings: StudioSettingsResolver,
  onProgress?: (progress: number) => void,
): MarblePlatform[] {
  const hits = wallScoreReferenceHits(events, width);
  const flights = events.map((_, index) => wallScoreFlight(index, events, hits, resolveSettings(index)));

  return events.map((event, index) => {
    const localSettings = resolveSettings(index);
    const flight = flights[index];
    const incoming = incomingVelocity(index, flights, localSettings);
    const surface = collisionSurface(incoming, { x: flight.outVX, y: flight.outVY });
    const plan = visualPlan(index, localSettings);
    const platformWidth = localSettings.platformWidth * 0.58 * (plan?.widthScale ?? 1);
    const visualX = flight.hit.x - surface.normal.x * localSettings.ballSize;
    const visualY = flight.hit.y - surface.normal.y * localSettings.ballSize;

    const platform: MarblePlatform = {
      index,
      x: flight.hit.x,
      y: flight.hit.y,
      visualX,
      visualY,
      width: platformWidth,
      visualWidth: platformWidth,
      thickness: localSettings.platformThickness,
      visualThickness: localSettings.platformThickness,
      tiltRad: surface.angle,
      visualTiltRad: surface.angle,
      color: noteColorForMidi(event.midi),
      contactX: flight.hit.x,
      contactY: flight.hit.y,
      hitX: flight.hit.x,
      hitY: flight.hit.y,
      normalX: surface.normal.x,
      normalY: surface.normal.y,
      outVX: flight.outVX,
      outVY: flight.outVY,
      gravity: flight.gravity,
      contactMode: "surface",
      motionMode: "ballistic",
      event,
      visualStyle: plan?.style,
    };
    onProgress?.(Math.min(1, (index + 1) / Math.max(1, events.length)));
    return platform;
  });
}
