import type { StudioSettings } from "../types";
import type { Vec2 } from "./marblePhysicsTypes";
import { courseWorldBounds } from "./marbleCourseConstraints";

// Keep ordinary ~545 ms beat gaps as real bounces. Once a travel window is
// roughly 0.8 s or longer, stretching the same short arc reads as slow motion;
// route that time through a longer, constant-speed physical rail instead.
export const LONG_GAP_RAIL_MS = 760;
const MIN_LONG_RAIL_SPEED = 205;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const length = (value: Vec2) => Math.hypot(value.x, value.y);

function normalize(value: Vec2): Vec2 {
  const size = length(value);
  return size > 1e-6 ? { x: value.x / size, y: value.y / size } : { x: 0, y: -1 };
}

function playingFaceNormal(incoming: Vec2, outgoing: Vec2) {
  let normal = normalize({ x: outgoing.x - incoming.x, y: outgoing.y - incoming.y });
  if (normal.y > 0) normal = { x: -normal.x, y: -normal.y };
  if (normal.y > -0.12 || incoming.x * normal.x + incoming.y * normal.y >= -2) {
    const tangent = normalize(outgoing);
    normal = { x: tangent.y, y: -tangent.x };
    if (normal.y > 0) normal = { x: -normal.x, y: -normal.y };
  }
  return normal;
}

export function longGapRailRouteForTarget(
  hit: Vec2,
  incoming: Vec2,
  target: Vec2,
  spanMs: number,
  baseScore = 0,
) {
  if (spanMs < LONG_GAP_RAIL_MS) return null;
  const dt = Math.max(0.001, spanMs / 1000);
  const delta = { x: target.x - hit.x, y: target.y - hit.y };
  const speed = length(delta) / dt;
  if (speed < MIN_LONG_RAIL_SPEED) return null;
  const outgoing = { x: delta.x / dt, y: delta.y / dt };
  return {
    normal: playingFaceNormal(incoming, outgoing),
    outgoing,
    target: { ...target },
    // Keep the collision-safe destination chosen by the physics planner, but
    // strongly prefer constant-speed travel on a visible rail over loitering at
    // the apex of a long ballistic arc. Scene-risk penalties still override it.
    score: baseScore - 180,
    motionMode: "roll" as const,
  };
}

function railSpeed(incoming: Vec2, settings: StudioSettings) {
  const floor = clamp(218 + settings.laneSpread * 0.075, 235, 270);
  return clamp(Math.max(floor, length(incoming) * 0.72), floor, 340);
}

export function extendedLongGapRailRouteCandidate(
  hit: Vec2,
  incoming: Vec2,
  spanMs: number,
  preferredDirection: number,
  settings: StudioSettings,
  width: number,
) {
  if (spanMs < LONG_GAP_RAIL_MS || settings.terrainProfile === "comet") return null;

  const dt = Math.max(0.001, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const inset = Math.max(settings.ballSize * 1.45, settings.platformThickness * 0.72, 18);
  const minX = bounds.min + inset;
  const maxX = bounds.max - inset;
  const speed = railSpeed(incoming, settings);
  const distance = speed * dt;
  const incomingDirection = Math.abs(incoming.x) > 22 ? Math.sign(incoming.x) : 0;
  let direction = incomingDirection || Math.sign(preferredDirection) || 1;
  const room = (candidateDirection: number) => candidateDirection > 0 ? maxX - hit.x : hit.x - minX;

  const preferredHorizontal = distance * 0.68;
  if (room(direction) < Math.min(preferredHorizontal * 0.5, 92) && room(-direction) > room(direction)) direction *= -1;
  const dxMagnitude = Math.max(
    Math.min(settings.ballSize * 3.4, distance * 0.28),
    Math.min(preferredHorizontal, Math.max(0, room(direction))),
  );
  if (dxMagnitude < settings.ballSize * 1.2) return null;

  const dx = direction * dxMagnitude;
  const dy = Math.sqrt(Math.max((settings.ballSize * 2.4) ** 2, distance ** 2 - dx ** 2));
  const target = { x: clamp(hit.x + dx, minX, maxX), y: hit.y + dy };
  const actual = { x: target.x - hit.x, y: target.y - hit.y };
  const outgoing = { x: actual.x / dt, y: actual.y / dt };
  if (length(outgoing) < speed * 0.82) return null;

  return {
    normal: playingFaceNormal(incoming, outgoing),
    outgoing,
    target,
    score: -160,
    motionMode: "roll" as const,
  };
}
