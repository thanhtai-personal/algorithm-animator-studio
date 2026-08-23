import type { NoteEvent, StudioSettings } from "../types";
import { REST_GAP_MS, rhythmTerrainForGap } from "../lib/rhythmTerrain";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { marblePhysicsProfile, type MarblePhysicsProfile } from "./marblePhysicsProfiles";
import { presetObstaclePlan } from "./presetObstaclePlan";

// Physics-first course planner. It borrows the useful constraint-solving idea from
// the MIT-licensed AndrewB330/MusicMarbles project: note timestamps are collision
// constraints and obstacle orientation is solved from the marble motion. This
// implementation is independent TypeScript and uses a bounded beam search rather
// than the source project's C++ rewind/backtracking implementation.

export type PlatformColorResolver = (index: number, pitch: number) => string;

interface BounceCandidate {
  normal: Vec2;
  outgoing: Vec2;
  target: Vec2;
  score: number;
}

interface PlanNode {
  platform: MarblePlatform;
  parent: PlanNode | null;
}

interface SearchState {
  hit: Vec2;
  incoming: Vec2;
  preferredDirection: number;
  score: number;
  node: PlanNode | null;
  recentHits: Vec2[];
  recentPlatforms: MarblePlatform[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const length = (v: Vec2) => Math.hypot(v.x, v.y);
const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
const flip = (v: Vec2): Vec2 => ({ x: -v.x, y: -v.y });

function seeded(index: number, salt = 0) {
  const raw = Math.sin((index + salt) * 12.9898 + 78.233) * 43758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
}

function normalize(v: Vec2): Vec2 {
  const size = length(v);
  return size > 1e-6 ? { x: v.x / size, y: v.y / size } : { x: 0, y: -1 };
}

function pitchRatio(event: NoteEvent, minMidi: number, maxMidi: number) {
  return maxMidi === minMidi ? 0.5 : (event.midi - minMidi) / (maxMidi - minMidi);
}

function normalForAngle(angle: number): Vec2 {
  return { x: Math.sin(angle), y: -Math.cos(angle) };
}

function axisAngle(angle: number) {
  let value = angle;
  while (value > Math.PI / 2) value -= Math.PI;
  while (value < -Math.PI / 2) value += Math.PI;
  return value;
}

function outgoingForNormal(incoming: Vec2, normalInput: Vec2, restitution: number) {
  let normal = normalize(normalInput);
  if (dot(incoming, normal) > 0) normal = flip(normal);
  const projected = dot(incoming, normal);
  return {
    normal,
    velocity: {
      x: incoming.x - (1 + restitution) * projected * normal.x,
      y: incoming.y - (1 + restitution) * projected * normal.y,
    },
  };
}

function restitutionForDrop(incoming: Vec2, normalInput: Vec2, drop: number, dt: number, profile: MarblePhysicsProfile) {
  let normal = normalize(normalInput);
  if (dot(incoming, normal) > 0) normal = flip(normal);
  const projected = dot(incoming, normal);
  const denominator = projected * normal.y;
  const desiredVy = (drop - 0.5 * profile.gravity * dt * dt) / dt;
  if (Math.abs(denominator) < 1e-5) return profile.restitutionMin;
  return clamp((incoming.y - desiredVy) / denominator - 1, profile.restitutionMin, profile.restitutionMax);
}

function worldBounds(settings: StudioSettings, width: number) {
  if (settings.terrainProfile === "balanced") return { min: 62, max: width - 62 };
  if (settings.terrainProfile === "xylophone") return { min: -width * 0.7, max: width * 1.7 };
  return { min: -width * 1.2, max: width * 2.2 };
}

function orientationPenalty(index: number, normal: Vec2, settings: StudioSettings) {
  if (settings.terrainProfile === "tube-board") {
    const axis = Math.abs(axisAngle(Math.atan2(-normal.y, -normal.x)) * 180 / Math.PI);
    const targetAngles = [14, 28, 44, 58, 72, 82, 36, 66, 20, 52, 78, 32];
    const desired = targetAngles[index % targetAngles.length];
    return Math.abs(axis - desired) * 2.4;
  }
  const tangent = Math.abs(axisAngle(Math.atan2(normal.x, -normal.y)) * 180 / Math.PI);
  return tangent * (settings.terrainProfile === "comet" ? 0.38 : 0.22);
}

function fallbackCandidate(hit: Vec2, incoming: Vec2, spanMs: number, direction: number, settings: StudioSettings, width: number): BounceCandidate {
  const profile = marblePhysicsProfile(settings);
  const terrain = rhythmTerrainForGap(spanMs, settings);
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = worldBounds(settings, width);
  const dx = Math.min(width * 0.26, terrain.horizontalDistance * profile.horizontalScale) * (direction || 1);
  const dy = Math.max(8, terrain.verticalDrop * profile.verticalScale);
  const target = { x: clamp(hit.x + dx, bounds.min, bounds.max), y: hit.y + dy };
  const outgoing = { x: (target.x - hit.x) / dt, y: (target.y - hit.y - 0.5 * profile.gravity * dt * dt) / dt };
  let normal = normalize({ x: incoming.x - outgoing.x, y: incoming.y - outgoing.y });
  if (dot(incoming, normal) > 0) normal = flip(normal);
  return { normal, outgoing, target, score: 1000 };
}


function obstacleSpacingScale(index: number, settings: StudioSettings) {
  const style = presetObstaclePlan(index, settings)?.style;
  if (style === "instrument-key") return { vertical: 0.84, horizontal: 0.82 };
  if (style === "instrument-pad") return { vertical: 1.38, horizontal: 1.12 };
  if (style === "instrument-cymbal") return { vertical: 1.72, horizontal: 1.24 };
  if (style === "instrument-rail") return { vertical: 1.42, horizontal: 1.3 };
  if (style === "instrument-wire") return { vertical: 1.82, horizontal: 1.42 };
  return { vertical: 1, horizontal: 1 };
}

function bounceCandidates(index: number, hit: Vec2, incoming: Vec2, spanMs: number, preferredDirection: number, pitch: number, settings: StudioSettings, width: number) {
  const profile = marblePhysicsProfile(settings);
  const terrain = rhythmTerrainForGap(spanMs, settings);
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = worldBounds(settings, width);
  const spacing = obstacleSpacingScale(index, settings);
  const baseDrop = Math.max(8, terrain.verticalDrop * profile.verticalScale * spacing.vertical);
  const desiredHorizontal = Math.max(12, terrain.horizontalDistance * profile.horizontalScale * spacing.horizontal);
  const targetApex = terrain.bounceHeight * profile.apexScale;
  const pitchBias = (pitch - 0.5) * settings.laneSpread * (settings.terrainProfile === "comet" ? 0.12 : 0.05);
  const result: BounceCandidate[] = [];

  for (const dropFactor of [0.86, 1, 1.14]) {
    const desiredDrop = baseDrop * dropFactor;
    for (let order = 0; order < profile.normalAngles.length; order += 1) {
      const normalInput = normalForAngle(profile.normalAngles[order]);
      const restitution = restitutionForDrop(incoming, normalInput, desiredDrop, dt, profile);
      const reflected = outgoingForNormal(incoming, normalInput, restitution);
      const target = {
        x: hit.x + reflected.velocity.x * dt + pitchBias,
        y: hit.y + reflected.velocity.y * dt + 0.5 * profile.gravity * dt * dt,
      };
      const dx = target.x - hit.x;
      const dy = target.y - hit.y;
      if (target.x < bounds.min || target.x > bounds.max) continue;
      if (dy < Math.max(3, baseDrop * 0.2) || dy > Math.max(190, baseDrop * 1.9)) continue;
      const apex = reflected.velocity.y < 0 ? reflected.velocity.y ** 2 / (2 * profile.gravity) : 0;
      const directionPenalty = Math.sign(dx || preferredDirection) === Math.sign(preferredDirection) ? 0 : (settings.terrainProfile === "tube-board" ? 8 : 30);
      const horizontalPenalty = Math.abs(Math.abs(dx) - desiredHorizontal) * 0.16;
      const dropPenalty = Math.abs(dy - desiredDrop) * 0.24;
      const apexPenalty = Math.abs(apex - targetApex) * 0.2;
      const speedPenalty = Math.max(0, length(reflected.velocity) - 1200) * 0.08;
      const edgeDistance = Math.min(target.x - bounds.min, bounds.max - target.x);
      const edgePenalty = Math.max(0, width * 0.12 - edgeDistance) * 0.12;
      const randomTieBreak = Math.abs(seeded(index * 31 + order, Math.round(dropFactor * 100))) * 2.2;
      result.push({
        normal: reflected.normal,
        outgoing: reflected.velocity,
        target,
        score: directionPenalty + horizontalPenalty + dropPenalty + apexPenalty + speedPenalty + edgePenalty + orientationPenalty(index, reflected.normal, settings) + randomTieBreak,
      });
    }
  }

  result.sort((a, b) => a.score - b.score);
  return result.length ? result.slice(0, 9) : [fallbackCandidate(hit, incoming, spanMs, preferredDirection, settings, width)];
}

function longGapTarget(index: number, hit: Vec2, spanMs: number, direction: number, pitch: number, settings: StudioSettings, width: number) {
  const profile = marblePhysicsProfile(settings);
  const dt = spanMs / 1000;
  const bounds = worldBounds(settings, width);
  const lateralScale = settings.terrainProfile === "comet" ? 62 : settings.terrainProfile === "tube-board" ? 48 : 40;
  const lateral = lateralScale * direction + (pitch - 0.5) * settings.laneSpread * 0.08;
  return {
    x: clamp(hit.x + lateral + seeded(index, 301) * 16, bounds.min + 18, bounds.max - 18),
    y: hit.y + clamp(profile.longGapDropPerSecond * dt, 150, 430),
  };
}

function obstacleFromImpact(index: number, hit: Vec2, normal: Vec2, outgoing: Vec2, settings: StudioSettings, event: NoteEvent, color: string, platformWidth: number, gravity: number): MarblePlatform {
  const profile = marblePhysicsProfile(settings);
  const surface = { x: hit.x - normal.x * settings.ballSize, y: hit.y - normal.y * settings.ballSize };
  if (profile.contactMode === "cap") {
    const bodyDirection = flip(normal);
    const center = { x: surface.x + bodyDirection.x * platformWidth * 0.5, y: surface.y + bodyDirection.y * platformWidth * 0.5 };
    return {
      index, x: center.x, y: center.y, width: platformWidth, thickness: settings.platformThickness,
      tiltRad: axisAngle(Math.atan2(bodyDirection.y, bodyDirection.x)), color,
      contactX: surface.x, contactY: surface.y, hitX: hit.x, hitY: hit.y,
      normalX: normal.x, normalY: normal.y, outVX: outgoing.x, outVY: outgoing.y,
      gravity, contactMode: "cap", event,
    };
  }
  if (profile.contactMode === "bumper") {
    const bumperRadius = Math.min(20, Math.max(10, platformWidth * 0.26));
    const center = { x: surface.x - normal.x * bumperRadius, y: surface.y - normal.y * bumperRadius };
    return {
      index, x: center.x, y: center.y, width: platformWidth, thickness: settings.platformThickness,
      tiltRad: seeded(index, 811) * 0.08, color,
      contactX: surface.x, contactY: surface.y, hitX: hit.x, hitY: hit.y,
      normalX: normal.x, normalY: normal.y, outVX: outgoing.x, outVY: outgoing.y,
      gravity, contactMode: "bumper", event,
    };
  }
  const tangent = { x: -normal.y, y: normal.x };
  return {
    index, x: surface.x, y: surface.y, width: platformWidth, thickness: settings.platformThickness,
    tiltRad: axisAngle(Math.atan2(tangent.y, tangent.x)), color,
    contactX: surface.x, contactY: surface.y, hitX: hit.x, hitY: hit.y,
    normalX: normal.x, normalY: normal.y, outVX: outgoing.x, outVY: outgoing.y,
    gravity, contactMode: "surface", event,
  };
}

function pointSegmentDistance(point: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < 1e-6) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function platformSegment(platform: MarblePlatform) {
  const dx = Math.cos(platform.tiltRad) * platform.width * 0.5;
  const dy = Math.sin(platform.tiltRad) * platform.width * 0.5;
  return {
    a: { x: platform.x - dx, y: platform.y - dy },
    b: { x: platform.x + dx, y: platform.y + dy },
  };
}

function tubeOverlapPenalty(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  if (settings.terrainProfile !== "tube-board") return 0;
  const segment = platformSegment(platform);
  const safeDistance = Math.max(30, settings.platformThickness * 1.25);
  let penalty = 0;
  for (const other of recent) {
    const previous = platformSegment(other);
    const distance = Math.min(
      pointSegmentDistance(segment.a, previous.a, previous.b),
      pointSegmentDistance(segment.b, previous.a, previous.b),
      pointSegmentDistance(previous.a, segment.a, segment.b),
      pointSegmentDistance(previous.b, segment.a, segment.b),
    );
    if (distance < safeDistance) penalty += (safeDistance - distance) * 4.5;
  }
  return penalty;
}

function separationPenalty(target: Vec2, recentHits: Vec2[], settings: StudioSettings) {
  const threshold = settings.terrainProfile === "tube-board"
    ? Math.max(52, settings.platformThickness * 1.9)
    : Math.max(22, settings.ballSize * 2.4);
  let penalty = 0;
  for (const point of recentHits) {
    const distance = Math.hypot(target.x - point.x, target.y - point.y);
    if (distance < threshold) penalty += (threshold - distance) * 1.8;
  }
  return penalty;
}

function reconstruct(node: PlanNode | null) {
  const result: MarblePlatform[] = [];
  for (let current = node; current; current = current.parent) result.push(current.platform);
  return result.reverse();
}

export function buildPhysicsCourse(events: NoteEvent[], settings: StudioSettings, width: number, resolveColor: PlatformColorResolver): MarblePlatform[] {
  if (!events.length) return [];
  const profile = marblePhysicsProfile(settings);
  const minMidi = Math.min(...events.map((event) => event.midi));
  const maxMidi = Math.max(...events.map((event) => event.midi));
  const beamWidth = events.length > 1200 ? 2 : events.length > 500 ? 3 : 5;
  let states: SearchState[] = [{
    hit: { x: width / 2, y: 220 }, incoming: { x: 0, y: profile.initialDownSpeed },
    preferredDirection: seeded(events.length, 41) >= 0 ? 1 : -1, score: 0, node: null, recentHits: [], recentPlatforms: [],
  }];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const pitch = pitchRatio(event, minMidi, maxMidi);
    const spanMs = index < events.length - 1 ? Math.max(1, events[index + 1].timeMs - event.timeMs) : 420;
    const obstaclePlan = presetObstaclePlan(index, settings);
    const baseWidthScale = settings.terrainProfile === "tube-board" ? 0.9 : settings.terrainProfile === "xylophone" ? 1.02 : 0.92;
    const platformWidth = settings.platformWidth * baseWidthScale * (obstaclePlan?.widthScale ?? 1) * (0.9 + event.velocity * 0.14);
    const expanded: SearchState[] = [];

    for (const state of states) {
      const effectiveSpan = spanMs >= REST_GAP_MS ? Math.min(spanMs, 680) : spanMs;
      const candidates = bounceCandidates(index, state.hit, state.incoming, effectiveSpan, state.preferredDirection, pitch, settings, width);
      for (const bounce of candidates) {
        const platform = obstacleFromImpact(index, state.hit, bounce.normal, bounce.outgoing, settings, event, resolveColor(index, pitch), platformWidth, profile.gravity);
        if (index === events.length - 1) {
          expanded.push({ ...state, score: state.score + bounce.score, node: { platform, parent: state.node } });
          continue;
        }
        const nextHit = spanMs >= REST_GAP_MS
          ? longGapTarget(index, state.hit, spanMs, state.preferredDirection, pitch, settings, width)
          : bounce.target;
        const dt = Math.max(0.08, spanMs / 1000);
        const nextIncoming = spanMs >= REST_GAP_MS
          ? { x: (nextHit.x - state.hit.x) / dt * 0.24, y: Math.max(190, profile.gravity * Math.min(dt, 0.7) * 0.58) }
          : { x: bounce.outgoing.x, y: bounce.outgoing.y + profile.gravity * dt };
        let nextDirection = state.preferredDirection;
        const bounds = worldBounds(settings, width);
        const edgeInset = Math.max(90, settings.laneSpread * 0.28);
        if (nextHit.x < bounds.min + edgeInset || nextHit.x > bounds.max - edgeInset || index % Math.max(2, profile.directionHold) === profile.directionHold - 1) nextDirection *= -1;
        const recentHits = [...state.recentHits, state.hit].slice(-7);
        const recentPlatforms = [...state.recentPlatforms, platform].slice(-7);
        expanded.push({
          hit: nextHit,
          incoming: nextIncoming,
          preferredDirection: nextDirection,
          score: state.score + bounce.score + separationPenalty(nextHit, recentHits, settings)
            + tubeOverlapPenalty(platform, state.recentPlatforms, settings),
          node: { platform, parent: state.node },
          recentHits,
          recentPlatforms,
        });
      }
    }

    expanded.sort((a, b) => a.score - b.score);
    states = expanded.slice(0, beamWidth);
  }

  return reconstruct(states[0]?.node ?? null);
}
