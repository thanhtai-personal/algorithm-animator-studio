import type { StudioSettingsResolver } from "../engine/marbleCoursePlanner";
import type { MarblePlatform, Vec2 } from "../engine/marblePhysicsTypes";
import { presetObstaclePlan } from "../engine/presetObstaclePlan";
import type { NoteEvent, StudioSettings } from "../types";
import {
  isKorobeinikiWallLayout,
  korobeinikiColorForMidi,
  wallScoreReferenceHits,
  wallScoreTwoColumnHits,
  wallScoreTubeHitPoint,
} from "./korobeinikiReferenceLayout";
import { noteColorForMidi } from "./noteColors";
import {
  type WallScoreLongRouteKind,
  wallScoreLongRouteKind,
  wallScoreLongRouteMotion,
} from "./wallScoreMotion";

const WALL_SCORE_MIN_ARC_HEIGHT = 18;
const WALL_SCORE_TERMINAL_GRAVITY = 780;
const MAX_PLAYING_FACE_TILT_RAD = 0.72;

interface WallScoreFlight {
  hit: Vec2;
  outVX: number;
  outVY: number;
  endVX: number;
  endVY: number;
  gravity: number;
  spanSeconds: number;
  longRail: boolean;
  longTube: boolean;
  longRouteKind?: WallScoreLongRouteKind;
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
  finishTowardCenter = false,
): WallScoreFlight {
  const event = events[index];
  const hit = hits[index];
  const next = hits[index + 1];
  const spanSeconds = next
    ? Math.max(0.08, (events[index + 1].timeMs - event.timeMs) / 1_000)
    : 0.42;
  const spanMs = spanSeconds * 1_000;
  const deltaY = next ? next.y - hit.y : 0;
  const longRouteKind = next
    ? wallScoreLongRouteKind(hit, next, spanMs)
    : undefined;
  if (next && longRouteKind) {
    const route = wallScoreLongRouteMotion(hit, next, spanMs, longRouteKind);
    return {
      hit,
      spanSeconds,
      outVX: route.startVelocity.x,
      outVY: route.startVelocity.y,
      endVX: route.endVelocity.x,
      endVY: route.endVelocity.y,
      // Guided segments sample their route directly. Keep an equivalent average
      // acceleration so inspection/collision code can recover end velocity.
      gravity: route.gravity,
      longRail: longRouteKind === "horizontal-rail",
      longTube: longRouteKind === "vertical-pipe",
      longRouteKind,
    };
  }
  const bounceHeight = Math.max(
    WALL_SCORE_MIN_ARC_HEIGHT,
    deltaY * 0.25 + 110 * spanSeconds * 0.25,
  );
  const previousHit = hits[index - 1];
  const stageCenter = hits.reduce((sum, point) => sum + point.x, 0) / Math.max(1, hits.length);
  const terminalDirection = finishTowardCenter
    ? Math.sign(stageCenter - hit.x) || (previousHit ? -Math.sign(hit.x - previousHit.x) || 1 : 1)
    : previousHit ? Math.sign(hit.x - previousHit.x) || 1 : 1;

  const outVX = next ? (next.x - hit.x) / spanSeconds : terminalDirection * 110;
  const outVY = next
    ? (deltaY - 4 * bounceHeight) / spanSeconds
    : -Math.max(160, settings.ballSize * 10);
  const gravity = next
    ? 8 * bounceHeight / spanSeconds ** 2
    : WALL_SCORE_TERMINAL_GRAVITY;
  return {
    hit,
    spanSeconds,
    outVX,
    outVY,
    endVX: outVX,
    endVY: outVY + gravity * spanSeconds,
    gravity,
    longRail: false,
    longTube: false,
  };
}

function incomingVelocity(index: number, flights: readonly WallScoreFlight[], settings: StudioSettings): Vec2 {
  if (index === 0) return { x: 0, y: Math.max(128, settings.ballSize * 7.5) };
  const previous = flights[index - 1];
  return {
    x: previous.endVX,
    y: previous.endVY,
  };
}

function collisionSurface(
  incoming: Vec2,
  outgoing: Vec2,
  gravity: number,
  spanSeconds: number,
) {
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
  const solvedAngle = clamp(
    Math.atan2(upwardNormal.x, -upwardNormal.y),
    -MAX_PLAYING_FACE_TILT_RAD,
    MAX_PLAYING_FACE_TILT_RAD,
  );
  const candidates = Array.from({ length: 73 }, (_, index) => (
    -MAX_PLAYING_FACE_TILT_RAD + index * MAX_PLAYING_FACE_TILT_RAD * 2 / 72
  ));
  const departureSeconds = Math.min(1 / 60, spanSeconds * 0.2);
  const angle = candidates
    .map((candidate) => {
      const normal = { x: Math.sin(candidate), y: -Math.cos(candidate) };
      const incomingSpeed = incoming.x * normal.x + incoming.y * normal.y;
      const outgoingSpeed = outgoing.x * normal.x + outgoing.y * normal.y;
      const firstFrameSeparation = outgoingSpeed * departureSeconds
        + 0.5 * gravity * normal.y * departureSeconds ** 2;
      return {
        angle: candidate,
        valid: incomingSpeed < -2 && firstFrameSeparation > 0.24,
        score: Math.abs(candidate - solvedAngle),
      };
    })
    .filter((candidate) => candidate.valid)
    .sort((a, b) => a.score - b.score)[0]?.angle ?? solvedAngle;
  return {
    angle,
    normal: { x: Math.sin(angle), y: -Math.cos(angle) },
  };
}

function visualPlan(index: number, settings: StudioSettings) {
  if (isKorobeinikiWallLayout(settings)) return presetObstaclePlan(index, settings);
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
  const settingsByIndex = events.map((_, index) => resolveSettings(index));
  const usesConcreteInstrumentLanes = settingsByIndex.some((localSettings) => (
    localSettings.instrumentFamily !== "auto" && !isKorobeinikiWallLayout(localSettings)
  ));
  const visualHits = usesConcreteInstrumentLanes
    ? wallScoreTwoColumnHits(events, width)
    : wallScoreReferenceHits(events, width);
  const hits = visualHits.map((hit, index) => {
    const localSettings = settingsByIndex[index];
    return isKorobeinikiWallLayout(localSettings)
      ? wallScoreTubeHitPoint(hit, localSettings)
      : hit;
  });
  const flights: WallScoreFlight[] = [];
  events.forEach((_, index) => {
    flights.push(wallScoreFlight(
      index,
      events,
      hits,
      settingsByIndex[index],
      settings.instrumentFamily === "mixed" && index === events.length - 1,
    ));
  });

  return events.map((event, index) => {
    const localSettings = settingsByIndex[index];
    const korobeinikiTube = isKorobeinikiWallLayout(localSettings);
    const flight = flights[index];
    const incoming = incomingVelocity(index, flights, localSettings);
    const surface = korobeinikiTube
      ? { angle: 0, normal: { x: 0, y: -1 } }
      : collisionSurface(
        incoming,
        { x: flight.outVX, y: flight.outVY },
        flight.gravity,
        flight.spanSeconds,
      );
    const plan = visualPlan(index, localSettings);
    const platformWidth = localSettings.platformWidth * 0.58
      * (korobeinikiTube ? 1 : plan?.widthScale ?? 1);
    const visualX = korobeinikiTube
      ? visualHits[index].x
      : flight.hit.x - surface.normal.x * localSettings.ballSize;
    const visualY = korobeinikiTube
      ? visualHits[index].y
      : flight.hit.y - surface.normal.y * localSettings.ballSize;

    const platform: MarblePlatform = {
      index,
      x: flight.hit.x,
      y: flight.hit.y,
      visualX,
      visualY,
      width: platformWidth,
      visualWidth: platformWidth,
      thickness: localSettings.platformThickness,
      visualThickness: korobeinikiTube
        ? Math.max(40, localSettings.platformThickness)
        : localSettings.platformThickness,
      tiltRad: surface.angle,
      visualTiltRad: surface.angle,
      color: korobeinikiTube
        ? korobeinikiColorForMidi(event.midi)
        : noteColorForMidi(event.midi),
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
      motionMode: flight.longRouteKind ? "roll" : "ballistic",
      longRail: flight.longRail || undefined,
      longTube: flight.longTube || undefined,
      longRouteKind: flight.longRouteKind,
      terminalGoal: settings.instrumentFamily === "mixed" && index === events.length - 1,
      event,
      visualStyle: plan?.style,
    };
    onProgress?.(Math.min(1, (index + 1) / Math.max(1, events.length)));
    return platform;
  });
}
