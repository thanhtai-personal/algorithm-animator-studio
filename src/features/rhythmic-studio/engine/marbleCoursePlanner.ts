import type { NoteEvent, StudioSettings } from "../types";
import { rhythmTerrainForGap } from "../lib/rhythmTerrain";
import { midiInstrumentVisualStyle } from "../lib/midiInstrumentVisuals";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { marbleEntrySpeed, marblePhysicsProfile, type MarblePhysicsProfile } from "./marblePhysicsProfiles";
import { presetObstaclePlan } from "./presetObstaclePlan";
import {
  adjacentSpacingPenalty,
  courseWorldBounds,
  nextImpactClearancePenalty,
  platformAgainstRecentTrajectoriesPenalty,
  platformClearance,
  platformOverlapPenalty,
  platformVisualClearanceRequirement,
  platformWithinWorldBounds,
  separationPenalty,
  trajectoryClearancePenalty,
  trajectoryBodyClearanceRequirement,
  trajectoryPlatformClearance,
  trajectoryWithinWorldBounds,
  wallClearancePenalty,
} from "./marbleCourseConstraints";
import {
  type ChordCluster,
  type DenseInstrumentRun,
  type RollingRouteCandidate,
  chordClusters,
  chordNodeMap,
  chordSegmentMap,
  decorateChordClusters,
  decorateDenseInstrumentRuns,
  denseInstrumentRuns,
  denseRunEndMap,
  denseRunNodeMap,
  denseRunSegmentMap,
  holdRouteCandidate,
  rollingExitCandidate,
  rollingRouteCandidate,
} from "./denseInstrumentRuns";

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
  impactStyle?: "instrument-pad";
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
  forecastPenalty: number;
  sceneRisk: number;
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

function outgoingForNormal(incoming: Vec2, normalInput: Vec2, restitution: number, tangentRetention = 0.965) {
  let normal = normalize(normalInput);
  if (dot(incoming, normal) > 0) normal = flip(normal);
  const projected = dot(incoming, normal);
  const tangent = {
    x: incoming.x - projected * normal.x,
    y: incoming.y - projected * normal.y,
  };
  return {
    normal,
    velocity: {
      x: tangent.x * tangentRetention - projected * restitution * normal.x,
      y: tangent.y * tangentRetention - projected * restitution * normal.y,
    },
  };
}

function naturalRestitution(profile: MarblePhysicsProfile, settings: StudioSettings) {
  const userBounce = clamp((settings.bounceHeight - 48) / 96, 0, 1);
  const center = profile.restitutionMin + (profile.restitutionMax - profile.restitutionMin) * (0.42 + userBounce * 0.28);
  return clamp(center, profile.restitutionMin, profile.restitutionMax);
}

function collisionAngles(profile: MarblePhysicsProfile, dt: number) {
  const result = [...profile.normalAngles];
  // Very short note gaps cannot produce a believable high arc. Add steeper
  // glancing surfaces so the same restitution redirects momentum sideways and
  // lets gravity keep pulling the ball down instead of forcing another upward
  // teleport-like bounce.
  if (dt < 0.32) result.push(0.34, -0.34, 0.44, -0.44);
  if (dt < 0.22) result.push(0.54, -0.54, 0.64, -0.64);
  if (dt < 0.15) result.push(0.72, -0.72);
  // Keep a few stronger redirect surfaces available for collision avoidance.
  // They carry an orientation/energy cost, so ordinary routes still win, but
  // near a wall or an older instrument the beam search has a real escape route.
  if (profile.terrain === "balanced" || profile.terrain === "tube-board") {
    if (dt >= 0.2) result.push(0.76, -0.76);
    if (dt >= 0.36) result.push(0.9, -0.9);
  }
  return result;
}

function orientationPenalty(index: number, normal: Vec2, settings: StudioSettings) {
  const tangent = Math.abs(axisAngle(Math.atan2(normal.x, -normal.y)) * 180 / Math.PI);
  if (settings.instrumentFamily !== "auto") {
    // The surface angle is dictated by the collision, not by a decorative layout
    // target. Only reject nearly vertical striking faces that look physically odd.
    return Math.max(0, tangent - 62) * 8 + Math.max(0, tangent - 72) * 32;
  }
  if (settings.terrainProfile === "tube-board") {
    return Math.max(0, tangent - 68) * 5;
  }
  return Math.max(0, tangent - (settings.terrainProfile === "comet" ? 58 : 64)) * 3.5;
}

function fallbackCandidate(hit: Vec2, incoming: Vec2, spanMs: number, direction: number, settings: StudioSettings, width: number): BounceCandidate {
  const profile = marblePhysicsProfile(settings);
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const sign = direction || (incoming.x >= 0 ? 1 : -1) || 1;
  const angle = dt < 0.16 ? 0.7 : dt < 0.24 ? 0.54 : dt < 0.36 ? 0.36 : (settings.instrumentFamily !== "auto" ? 0.18 : 0.24);
  const normalInput = normalForAngle(sign * angle);
  const reflected = outgoingForNormal(incoming, normalInput, naturalRestitution(profile, settings), 0.95);
  reflected.velocity.x = clamp(reflected.velocity.x, -520, 520);
  const naturalX = hit.x + reflected.velocity.x * dt;
  const wallInset = Math.max(settings.ballSize * 1.25, settings.platformThickness * 0.72, 14);
  const targetX = clamp(naturalX, bounds.min + wallInset, bounds.max - wallInset);
  // The renderer integrates outgoing velocity directly. If fallback routing clamps
  // only the destination, the marble reaches naturalX and then snaps to targetX
  // exactly on the next note. Keep the stored velocity and endpoint consistent.
  if (Math.abs(targetX - naturalX) > 1e-6) reflected.velocity.x = (targetX - hit.x) / dt;
  const minimumDrop = dt < 0.16 ? 2 : dt < 0.24 ? 4 : 8;
  const naturalY = hit.y + reflected.velocity.y * dt + 0.5 * profile.gravity * dt * dt;
  if (naturalY < hit.y + minimumDrop) {
    reflected.velocity.y = (minimumDrop - 0.5 * profile.gravity * dt * dt) / dt;
  }
  const target = {
    x: targetX,
    y: hit.y + reflected.velocity.y * dt + 0.5 * profile.gravity * dt * dt,
  };
  return { normal: reflected.normal, outgoing: reflected.velocity, target, score: 1000 };
}


function obstacleSpacingScale(index: number, spanMs: number, settings: StudioSettings) {
  const plan = presetObstaclePlan(index, settings);
  if (!plan) return { vertical: 1, horizontal: 1 };
  const base = {
    vertical: plan.verticalScale ?? 1,
    horizontal: plan.horizontalScale ?? 1,
  };
  if (settings.terrainProfile !== "xylophone" || !plan.sceneStart || index === 0) return base;
  const gapWeight = clamp((spanMs - 280) / 620, 0, 1);
  return {
    vertical: base.vertical * (1.18 + gapWeight * 0.72),
    horizontal: base.horizontal * (1.08 + gapWeight * 0.32),
  };
}

interface BounceCandidateContext {
  index: number;
  hit: Vec2;
  incoming: Vec2;
  dt: number;
  preferredDirection: number;
  pitchBias: number;
  settings: StudioSettings;
  width: number;
  profile: MarblePhysicsProfile;
  bounds: ReturnType<typeof courseWorldBounds>;
  naturalHorizontal: number;
  restitution: number;
}

function bounceWallInset(settings: StudioSettings) {
  return Math.max(settings.ballSize * 1.25, settings.platformThickness * 0.72, 14);
}

function bounceTarget(hit: Vec2, outgoing: Vec2, gravity: number, dt: number): Vec2 {
  return {
    x: hit.x + outgoing.x * dt,
    y: hit.y + outgoing.y * dt + 0.5 * gravity * dt * dt,
  };
}

function ordinaryBounceCandidate(context: BounceCandidateContext, angle: number, order: number): BounceCandidate | null {
  const { hit, incoming, dt, preferredDirection, pitchBias, settings, width, profile, bounds, naturalHorizontal, restitution, index } = context;
  const normalInput = normalForAngle(angle);
  const tangentRetention = settings.terrainProfile === "comet" ? 0.93 : settings.instrumentFamily !== "auto" ? 0.955 : 0.965;
  const reflected = outgoingForNormal(incoming, normalInput, restitution, tangentRetention);
  reflected.velocity.x = clamp(reflected.velocity.x, settings.terrainProfile === "comet" ? -560 : -520, settings.terrainProfile === "comet" ? 560 : 520);
  const target = bounceTarget(hit, reflected.velocity, profile.gravity, dt);
  const dx = target.x - hit.x;
  const dy = target.y - hit.y;
  const wallInset = bounceWallInset(settings);
  if (target.x < bounds.min + wallInset || target.x > bounds.max - wallInset) return null;

  const nextIncomingY = reflected.velocity.y + profile.gravity * dt;
  const minimumDrop = dt < 0.16 ? -1.5 : dt < 0.24 ? 0 : 4;
  if (dy < minimumDrop || dy > Math.max(260, profile.longGapDropPerSecond * dt * 1.8)) return null;
  if (nextIncomingY < (dt < 0.16 ? -2 : 8)) return null;

  const apex = reflected.velocity.y < 0 ? reflected.velocity.y ** 2 / (2 * profile.gravity) : 0;
  const apexTime = reflected.velocity.y < 0 ? -reflected.velocity.y / profile.gravity : 0;
  const latestApexRatio = dt < 0.18 ? 0.42 : dt < 0.3 ? 0.5 : 0.6;
  const flightArcPenalty = apexTime > dt * latestApexRatio ? (apexTime - dt * latestApexRatio) * 420 : 0;
  const directionPenalty = Math.sign(dx || preferredDirection) === Math.sign(preferredDirection) ? 0 : 12;
  const horizontalPenalty = Math.abs(Math.abs(dx) - naturalHorizontal) * 0.035;
  const pitchPenalty = Math.abs(dx - (preferredDirection * naturalHorizontal + pitchBias)) * 0.008;
  const excessiveApexPenalty = Math.max(0, apex - Math.max(12, settings.bounceHeight * 0.95)) * 0.3;
  const incomingSpeed = length(incoming);
  const outgoingSpeed = length(reflected.velocity);
  const energyGainPenalty = Math.max(0, outgoingSpeed - incomingSpeed * 1.03) * 1.1;
  const speedPenalty = Math.max(0, outgoingSpeed - 720) * 0.22;
  const landingSpeedPenalty = Math.max(0, nextIncomingY - 840) * 0.18;
  const edgeDistance = Math.min(target.x - bounds.min, bounds.max - target.x);
  const edgePenalty = Math.max(0, width * 0.1 - edgeDistance) * 0.16;
  const randomTieBreak = Math.abs(seeded(index * 31 + order, 97)) * 0.45;
  return {
    normal: reflected.normal,
    outgoing: reflected.velocity,
    target,
    score: directionPenalty + horizontalPenalty + pitchPenalty + flightArcPenalty + excessiveApexPenalty
      + energyGainPenalty + speedPenalty + landingSpeedPenalty + edgePenalty + orientationPenalty(index, reflected.normal, settings) + randomTieBreak,
  };
}

function edgeAbsorberCandidates(context: BounceCandidateContext) {
  const { hit, incoming, dt, settings, profile, bounds, width, index } = context;
  const edgeRoom = Math.min(hit.x - bounds.min, bounds.max - hit.x);
  if (edgeRoom >= Math.max(84, width * 0.13)) return [] as BounceCandidate[];

  const inwardAngle = hit.x > (bounds.min + bounds.max) * 0.5 ? -0.58 : 0.58;
  const absorberAngles = dt >= 0.28 ? [inwardAngle, inwardAngle * 1.28] : [inwardAngle * 1.55, inwardAngle * 1.9];
  const absorberRestitution = dt >= 0.28 ? 0.35 : 0.2;
  const absorberTangent = dt >= 0.28 ? 0.5 : 0.45;
  const wallInset = bounceWallInset(settings);
  const result: BounceCandidate[] = [];

  for (const angle of absorberAngles) {
    const reflected = outgoingForNormal(incoming, normalForAngle(angle), absorberRestitution, absorberTangent);
    const target = bounceTarget(hit, reflected.velocity, profile.gravity, dt);
    const nextIncomingY = reflected.velocity.y + profile.gravity * dt;
    const dy = target.y - hit.y;
    const minimumDrop = dt >= 0.28 ? 2 : 0.5;
    if (target.x < bounds.min + wallInset || target.x > bounds.max - wallInset || dy < minimumDrop || nextIncomingY < 5) continue;
    result.push({
      normal: reflected.normal,
      outgoing: reflected.velocity,
      target,
      score: 32 + Math.abs(target.x - hit.x) * 0.025 + orientationPenalty(index, reflected.normal, settings),
      impactStyle: "instrument-pad",
    });
  }
  return result;
}

function createBounceCandidateContext(
  index: number,
  hit: Vec2,
  incoming: Vec2,
  spanMs: number,
  preferredDirection: number,
  pitch: number,
  settings: StudioSettings,
  width: number,
): BounceCandidateContext {
  const profile = marblePhysicsProfile(settings);
  const dt = Math.max(0.08, spanMs / 1000);
  const terrain = rhythmTerrainForGap(spanMs, settings);
  const spacing = obstacleSpacingScale(index + 1, spanMs, settings);
  return {
    index,
    hit,
    incoming,
    dt,
    preferredDirection,
    pitchBias: (pitch - 0.5) * settings.laneSpread * 0.018,
    settings,
    width,
    profile,
    bounds: courseWorldBounds(settings, width),
    naturalHorizontal: Math.max(8, terrain.horizontalDistance * profile.horizontalScale * spacing.horizontal * 0.42),
    restitution: settings.instrumentLayout === "corridor"
      ? Math.max(0.88, naturalRestitution(profile, settings))
      : naturalRestitution(profile, settings),
  };
}

function bounceCandidates(index: number, hit: Vec2, incoming: Vec2, spanMs: number, preferredDirection: number, pitch: number, settings: StudioSettings, width: number) {
  const context = createBounceCandidateContext(index, hit, incoming, spanMs, preferredDirection, pitch, settings, width);
  const angles = collisionAngles(context.profile, context.dt);
  if (settings.instrumentLayout === "corridor" && context.dt < 0.16) angles.push(0.86, -0.86, 1, -1);
  const result = angles
    .map((angle, order) => ordinaryBounceCandidate(context, angle, order))
    .filter((candidate): candidate is BounceCandidate => candidate !== null);
  result.push(...edgeAbsorberCandidates(context));
  result.sort((a, b) => a.score - b.score);
  return result.length ? result.slice(0, 15) : [fallbackCandidate(hit, incoming, spanMs, preferredDirection, settings, width)];
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
  let tiltRad = axisAngle(Math.atan2(tangent.y, tangent.x));
  if (settings.instrumentFamily !== "auto") tiltRad = clamp(tiltRad, -Math.PI * 0.38, Math.PI * 0.38);
  return {
    index, x: surface.x, y: surface.y, width: platformWidth, thickness: settings.platformThickness,
    tiltRad, color,
    contactX: surface.x, contactY: surface.y, hitX: hit.x, hitY: hit.y,
    normalX: normal.x, normalY: normal.y, outVX: outgoing.x, outVY: outgoing.y,
    gravity, contactMode: "surface", event,
  };
}


function fitVisualWidthForScene(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  if (platform.visualHidden || settings.instrumentFamily !== "auto") return;
  const startingWidth = platform.visualWidth ?? platform.width;
  const minimumWidth = Math.max(settings.ballSize * (platform.chordClusterId !== undefined ? 2.4 : 2.6), 34);
  let width = startingWidth;
  platform.visualWidth = width;
  // A deterministic hold/chord route has no alternate landing point to search.
  // If its body crosses an older instrument, fit the playable face into the
  // available pocket before accepting a visibly intersecting scene. Ballistic
  // routes still keep the large overlap penalty and prefer another angle first.
  for (let attempt = 0; attempt < 7 && width > minimumWidth; attempt += 1) {
    if (platformOverlapPenalty(platform, recent, settings) < 8000) break;
    width = Math.max(minimumWidth, width * 0.82);
    platform.visualWidth = width;
  }
}

const FINAL_FIT_NEIGHBOR_WINDOW = 56;
const FINAL_ROUTE_NEIGHBOR_WINDOW = 64;

interface VisualFitCandidate {
  width: number;
  thickness: number;
  shift: number;
  cost: number;
  clean: boolean;
}

function sharesPlayableSurface(a: MarblePlatform, b: MarblePlatform) {
  return (a.denseSurfaceId !== undefined && a.denseSurfaceId === b.denseSurfaceId)
    || (a.denseRunId !== undefined && a.denseRunId === b.denseRunId)
    || (a.chordClusterId !== undefined && a.chordClusterId === b.chordClusterId);
}

function indexWindow(index: number, length: number, radius: number) {
  return { start: Math.max(0, index - radius), end: Math.min(length - 1, index + radius) };
}

function routeClearanceForPlatform(platforms: MarblePlatform[], platformIndex: number, platform: MarblePlatform) {
  const window = indexWindow(platformIndex, platforms.length - 1, FINAL_ROUTE_NEIGHBOR_WINDOW);
  let minimum = Infinity;
  for (let routeIndex = window.start; routeIndex <= window.end; routeIndex += 1) {
    if (platformIndex === routeIndex || platformIndex === routeIndex + 1 || platformIndex === routeIndex - 1) continue;
    const start = platforms[routeIndex];
    const end = platforms[routeIndex + 1];
    if (!end || start.visualHidden || sharesPlayableSurface(platform, start) || sharesPlayableSurface(platform, end)) continue;
    minimum = Math.min(minimum, trajectoryPlatformClearance(platform, start, end));
  }
  return minimum;
}

function visualGapFor(platform: MarblePlatform) {
  return platform.denseSurfaceId !== undefined || platform.denseRunId !== undefined ? 1.2 : 2;
}

function routeClearanceRequirement(platform: MarblePlatform, settings: StudioSettings) {
  return trajectoryBodyClearanceRequirement(platform, settings);
}

function hasStaticVisualConflict(platforms: MarblePlatform[], platformIndex: number, platform: MarblePlatform) {
  const window = indexWindow(platformIndex, platforms.length, FINAL_FIT_NEIGHBOR_WINDOW);
  for (let otherIndex = window.start; otherIndex <= window.end; otherIndex += 1) {
    if (otherIndex === platformIndex) continue;
    const other = platforms[otherIndex];
    if (!other || other.visualHidden || sharesPlayableSurface(platform, other)) continue;
    const required = platformVisualClearanceRequirement(platform, other, Math.max(visualGapFor(platform), visualGapFor(other)));
    if (platformClearance(platform, other) < required) return true;
  }
  return false;
}

function visualConflictCost(platforms: MarblePlatform[], platformIndex: number, platform: MarblePlatform, settings: StudioSettings) {
  const window = indexWindow(platformIndex, platforms.length, FINAL_FIT_NEIGHBOR_WINDOW);
  let cost = 0;
  for (let otherIndex = window.start; otherIndex <= window.end; otherIndex += 1) {
    if (otherIndex === platformIndex) continue;
    const other = platforms[otherIndex];
    if (!other || other.visualHidden || sharesPlayableSurface(platform, other)) continue;
    const required = platformVisualClearanceRequirement(platform, other, Math.max(visualGapFor(platform), visualGapFor(other)));
    const clearance = platformClearance(platform, other);
    if (clearance >= required) continue;
    const intrusion = required - clearance;
    cost += intrusion * intrusion + intrusion * 30 + (clearance < 0.8 ? 8000 : 0);
  }
  const routeClearance = routeClearanceForPlatform(platforms, platformIndex, platform);
  const routeRequired = routeClearanceRequirement(platform, settings);
  if (routeClearance < routeRequired) {
    const intrusion = routeRequired - routeClearance;
    cost += 6000 + intrusion * 1200 + intrusion * intrusion * 45;
  }
  return cost;
}

function candidateSizes(start: number, minimum: number, factor: number, limit: number) {
  const values: number[] = [];
  let value = Math.max(minimum, start);
  for (let attempt = 0; attempt < limit; attempt += 1) {
    values.push(value);
    if (value <= minimum + 0.01) break;
    value = Math.max(minimum, value * factor);
  }
  return values;
}

function candidateShifts(hitProjection: number, width: number, hitMargin: number) {
  const room = Math.max(0, width * 0.5 - hitMargin);
  const minimum = hitProjection - room;
  const maximum = hitProjection + room;
  const center = clamp(0, minimum, maximum);
  return [center, (center + minimum) * 0.5, (center + maximum) * 0.5, minimum, maximum]
    .filter((value, index, all) => all.findIndex((other) => Math.abs(other - value) < 0.2) === index);
}

function isVisualFitClean(
  platforms: MarblePlatform[],
  platformIndex: number,
  platform: MarblePlatform,
  settings: StudioSettings,
  width: number,
  wallInset: number,
) {
  return platformWithinWorldBounds(platform, settings, width, wallInset)
    && !hasStaticVisualConflict(platforms, platformIndex, platform)
    && routeClearanceForPlatform(platforms, platformIndex, platform) >= routeClearanceRequirement(platform, settings);
}

function applyVisualCandidate(
  platform: MarblePlatform,
  original: { x: number; y: number; tangent: Vec2 },
  width: number,
  thickness: number,
  shift: number,
) {
  platform.visualWidth = width;
  platform.visualThickness = thickness;
  platform.visualX = original.x + original.tangent.x * shift;
  platform.visualY = original.y + original.tangent.y * shift;
}

function evaluateVisualCandidate(
  platforms: MarblePlatform[],
  platformIndex: number,
  platform: MarblePlatform,
  settings: StudioSettings,
  sceneWidth: number,
  wallInset: number,
  originalWidth: number,
  original: { x: number; y: number; tangent: Vec2 },
  candidate: { width: number; thickness: number; shift: number },
): VisualFitCandidate | null {
  applyVisualCandidate(platform, original, candidate.width, candidate.thickness, candidate.shift);
  if (!platformWithinWorldBounds(platform, settings, sceneWidth, wallInset)) return null;
  const clean = isVisualFitClean(platforms, platformIndex, platform, settings, sceneWidth, wallInset);
  const cost = visualConflictCost(platforms, platformIndex, platform, settings)
    + Math.abs(candidate.shift) * 0.18
    + Math.max(0, originalWidth - candidate.width) * 0.035
    + Math.max(0, (platform.thickness - candidate.thickness)) * 0.02;
  return { ...candidate, cost, clean };
}

function preferVisualCandidate(current: VisualFitCandidate | null, candidate: VisualFitCandidate | null) {
  if (!candidate) return current;
  if (!current || (candidate.clean && !current.clean) || (candidate.clean === current.clean && candidate.cost < current.cost)) return candidate;
  return current;
}

function searchVisualFit(
  platforms: MarblePlatform[],
  platformIndex: number,
  platform: MarblePlatform,
  settings: StudioSettings,
  sceneWidth: number,
  original: { x: number; y: number; width: number; thickness: number; tangent: Vec2; hitProjection: number },
  compact: boolean,
) {
  const dense = platform.denseSurfaceId !== undefined || platform.denseRunId !== undefined;
  const squareCorridorPaddle = settings.instrumentLayout === "corridor" && platform.visualStyle === "instrument-pad";
  const squareMinimum = Math.max(12, settings.ballSize * 1.05);
  const minimumWidth = squareCorridorPaddle ? squareMinimum : compact
    ? Math.max(10, settings.ballSize * 0.72)
    : dense ? Math.max(11, settings.ballSize * 0.78) : Math.max(18, settings.ballSize * 1.2);
  const minimumThickness = squareCorridorPaddle ? squareMinimum : compact
    ? Math.max(4.5, settings.ballSize * 0.3)
    : dense ? Math.max(5, settings.ballSize * 0.34) : Math.max(5.2, settings.ballSize * 0.35);
  const widths = candidateSizes(squareCorridorPaddle ? Math.max(original.width, original.thickness) : original.width, minimumWidth, 0.8, compact ? 5 : 8);
  const thicknesses = candidateSizes(original.thickness, minimumThickness, 0.76, compact ? 5 : 7);
  const sizes = squareCorridorPaddle
    ? widths.map((size) => ({ width: size, thickness: size }))
    : thicknesses.flatMap((thickness) => widths.map((width) => ({ width, thickness })));
  const hitMargin = Math.max(2.2, settings.ballSize * (compact ? 0.17 : 0.26));
  const wallInset = Math.max(3, settings.ballSize * 0.22);
  let best: VisualFitCandidate | null = null;

  for (const size of sizes) {
      for (const shift of candidateShifts(original.hitProjection, size.width, hitMargin)) {
        const candidate = evaluateVisualCandidate(
          platforms,
          platformIndex,
          platform,
          settings,
          sceneWidth,
          wallInset,
          original.width,
          original,
          { width: size.width, thickness: size.thickness, shift },
        );
        best = preferVisualCandidate(best, candidate);
        if (best?.clean) return best;
      }
  }
  return best;
}

function fitPlatformVisual(
  platforms: MarblePlatform[],
  platformIndex: number,
  settings: StudioSettings,
  sceneWidth: number,
) {
  const platform = platforms[platformIndex];
  if (!platform || platform.visualHidden) return;
  const originalX = platform.visualX ?? platform.x;
  const originalY = platform.visualY ?? platform.y;
  const originalWidth = platform.visualWidth ?? platform.width;
  const originalThickness = platform.visualThickness ?? platform.thickness;
  const angle = platform.visualTiltRad ?? platform.tiltRad;
  const tangent = { x: Math.cos(angle), y: Math.sin(angle) };
  const hitProjection = (platform.hitX - originalX) * tangent.x + (platform.hitY - originalY) * tangent.y;
  const wallInset = Math.max(3, settings.ballSize * 0.22);
  if (isVisualFitClean(platforms, platformIndex, platform, settings, sceneWidth, wallInset)) return;

  const original = { x: originalX, y: originalY, width: originalWidth, thickness: originalThickness, tangent, hitProjection };
  let best = searchVisualFit(platforms, platformIndex, platform, settings, sceneWidth, original, false);
  if (!best?.clean) {
    platform.visualStyle = platform.denseSurfaceId !== undefined || platform.denseRunId !== undefined
      ? (platform.visualStyle ?? "piano-key")
      : "instrument-pad";
    const compactBest = searchVisualFit(platforms, platformIndex, platform, settings, sceneWidth, original, true);
    best = settings.instrumentLayout === "corridor" && platform.visualStyle === "instrument-pad"
      ? compactBest ?? best
      : preferVisualCandidate(best, compactBest);
  }
  if (best) applyVisualCandidate(platform, original, best.width, best.thickness, best.shift);
}

function fitCourseToTrajectories(platforms: MarblePlatform[], settings: StudioSettings, width: number, resolveSettings?: StudioSettingsResolver) {
  if (platforms.length < 2) return platforms;
  const fitted = platforms.map((platform) => ({ ...platform }));
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < fitted.length; index += 1) {
      fitPlatformVisual(fitted, index, resolveSettings?.(fitted[index].index) ?? settings, width);
    }
  }
  return fitted;
}

function reconstruct(node: PlanNode | null) {
  const result: MarblePlatform[] = [];
  for (let current = node; current; current = current.parent) result.push(current.platform);
  return result.reverse();
}

export type StudioSettingsResolver = (index: number) => StudioSettings;

const HARD_SCENE_RISK = 9000;
const FORECAST_DEAD_END = 32000;
const FORECAST_BRANCHES = 2;
const CLEAN_FORECAST_LIMIT = FORECAST_DEAD_END * 0.5;

type RouteCandidate = BounceCandidate | RollingRouteCandidate;

interface PlannerContext {
  events: NoteEvent[];
  settings: StudioSettings;
  width: number;
  resolveColor: PlatformColorResolver;
  resolveSettings?: StudioSettingsResolver;
  minMidi: number;
  maxMidi: number;
  denseRuns: DenseInstrumentRun[];
  denseSegments: ReturnType<typeof denseRunSegmentMap>;
  denseNodes: ReturnType<typeof denseRunNodeMap>;
  denseEnds: ReturnType<typeof denseRunEndMap>;
  chords: ChordCluster[];
  chordSegments: ReturnType<typeof chordSegmentMap>;
  chordNodes: ReturnType<typeof chordNodeMap>;
  beamWidth: number;
  reserveWidth: number;
}

interface ExpansionStep {
  event: NoteEvent;
  settings: StudioSettings;
  profile: MarblePhysicsProfile;
  pitch: number;
  spanMs: number;
  platformWidth: number;
  denseRun?: DenseInstrumentRun;
  denseNode?: DenseInstrumentRun;
  chord?: ChordCluster;
  chordNode?: ChordCluster;
  candidates: RouteCandidate[];
}

function rankedScore(state: SearchState) {
  return state.score + state.forecastPenalty;
}

function plannerSettingsAt(context: PlannerContext, index: number) {
  return context.resolveSettings?.(index) ?? context.settings;
}

function createPlannerContext(
  events: NoteEvent[],
  settings: StudioSettings,
  width: number,
  resolveColor: PlatformColorResolver,
  resolveSettings?: StudioSettingsResolver,
): PlannerContext {
  const initialSettings = resolveSettings?.(0) ?? settings;
  const minMidi = Math.min(...events.map((event) => event.midi));
  const maxMidi = Math.max(...events.map((event) => event.midi));
  const denseRuns = denseInstrumentRuns(events, settings, resolveSettings);
  const chords = chordClusters(events);
  const showcaseCourse = initialSettings.instrumentFamily !== "auto";
  const beamWidth = showcaseCourse
    ? (events.length > 1800 ? 3 : events.length > 700 ? 4 : 6)
    : events.length > 1200 ? 2 : events.length > 500 ? 3 : 5;
  return {
    events,
    settings,
    width,
    resolveColor,
    resolveSettings,
    minMidi,
    maxMidi,
    denseRuns,
    denseSegments: denseRunSegmentMap(denseRuns),
    denseNodes: denseRunNodeMap(denseRuns),
    denseEnds: denseRunEndMap(denseRuns),
    chords,
    chordSegments: chordSegmentMap(chords),
    chordNodes: chordNodeMap(chords),
    beamWidth,
    reserveWidth: Math.max(beamWidth + 4, Math.min(24, beamWidth * 4)),
  };
}

function previewDepthFor(events: NoteEvent[], nextIndex: number) {
  const remaining = events.length - nextIndex;
  if (remaining <= 0) return 0;
  if (remaining === 1) return 1;
  return events[nextIndex + 1].timeMs - events[nextIndex].timeMs <= 260 ? 2 : 1;
}

function platformWidthForStep(index: number, event: NoteEvent, settings: StudioSettings) {
  const obstaclePlan = presetObstaclePlan(index, settings);
  const baseWidthScale = settings.terrainProfile === "tube-board" ? 0.9 : settings.terrainProfile === "xylophone" ? 1.02 : 0.92;
  return settings.platformWidth * baseWidthScale * (obstaclePlan?.widthScale ?? 1) * (0.9 + event.velocity * 0.14);
}

function denseRouteCandidates(context: PlannerContext, index: number, state: SearchState, run: DenseInstrumentRun) {
  const settings = plannerSettingsAt(context, index);
  const previousDense = context.denseNodes.get(index - 1);
  const surfaceEntry = !previousDense || previousDense.surfaceId !== run.surfaceId;
  const candidates = [
    rollingRouteCandidate(state.hit, state.incoming, context.events, index, run, state.preferredDirection, settings, context.width, surfaceEntry),
    ...(surfaceEntry
      ? [
          rollingRouteCandidate(state.hit, state.incoming, context.events, index, run, state.preferredDirection, settings, context.width, surfaceEntry, true),
          rollingRouteCandidate(state.hit, state.incoming, context.events, index, run, -state.preferredDirection, settings, context.width, surfaceEntry, true),
        ]
      : []),
  ];
  return candidates.filter((candidate, candidateIndex, all) =>
    all.findIndex((other) => Math.hypot(other.target.x - candidate.target.x, other.target.y - candidate.target.y) < 0.5) === candidateIndex,
  );
}

function routeCandidatesForStep(
  context: PlannerContext,
  index: number,
  state: SearchState,
  pitch: number,
  spanMs: number,
  profile: MarblePhysicsProfile,
) {
  const settings = plannerSettingsAt(context, index);
  const denseRun = context.denseSegments.get(index);
  const chord = context.chordSegments.get(index);
  if (chord) return [holdRouteCandidate(state.hit, state.incoming)];
  if (denseRun) return denseRouteCandidates(context, index, state, denseRun);
  const denseEnd = context.denseEnds.get(index);
  const smoothExit = denseEnd && index < context.events.length - 1
    ? rollingExitCandidate(state.hit, state.incoming, spanMs, settings, context.width, profile.gravity)
    : null;
  return smoothExit
    ? [smoothExit]
    : bounceCandidates(index, state.hit, state.incoming, spanMs, state.preferredDirection, pitch, settings, context.width);
}

function createExpansionStep(context: PlannerContext, index: number, state: SearchState): ExpansionStep | null {
  const event = context.events[index];
  if (!event) return null;
  const settings = plannerSettingsAt(context, index);
  const profile = marblePhysicsProfile(settings);
  const pitch = pitchRatio(event, context.minMidi, context.maxMidi);
  const spanMs = index < context.events.length - 1 ? Math.max(1, context.events[index + 1].timeMs - event.timeMs) : 420;
  return {
    event,
    settings,
    profile,
    pitch,
    spanMs,
    platformWidth: platformWidthForStep(index, event, settings),
    denseRun: context.denseSegments.get(index),
    denseNode: context.denseNodes.get(index),
    chord: context.chordSegments.get(index),
    chordNode: context.chordNodes.get(index),
    candidates: routeCandidatesForStep(context, index, state, pitch, spanMs, profile),
  };
}

function applyPlannerVisualHints(
  context: PlannerContext,
  index: number,
  state: SearchState,
  step: ExpansionStep,
  route: RouteCandidate,
  platform: MarblePlatform,
) {
  const { denseNode, denseRun, chordNode, settings, event, spanMs } = step;
  if (settings.instrumentLayout === "corridor" && !denseNode) {
    platform.visualStyle = presetObstaclePlan(index, settings)?.style ?? "instrument-pad";
    platform.visualWidth = Math.max(settings.ballSize * 2.45, Math.min(platform.width * 0.45, 48));
    platform.visualThickness = platform.visualStyle === "instrument-pad"
      ? platform.visualWidth
      : Math.max(settings.ballSize * 0.72, settings.platformThickness * 0.5);
  }
  if (denseNode) {
    if (settings.instrumentLayout === "corridor") {
      platform.visualStyle = presetObstaclePlan(index, settings)?.style ?? "instrument-pad";
      platform.visualWidth = Math.max(settings.ballSize * 2.45, Math.min(platform.width * 0.45, 48));
      platform.visualThickness = platform.visualStyle === "instrument-pad"
        ? platform.visualWidth
        : Math.max(settings.ballSize * 0.72, settings.platformThickness * 0.5);
    } else {
      platform.visualStyle = denseNode.kind === "keyboard" ? "piano-key" : "instrument-pad";
      const routeDistance = Math.hypot(route.target.x - state.hit.x, route.target.y - state.hit.y);
      const seam = denseNode.kind === "keyboard" ? 1.2 : 2.4;
      const previousDense = [...state.recentPlatforms].reverse().find((item) => item.denseRunId === denseNode.id);
      platform.visualWidth = denseRun
        ? Math.max(settings.ballSize * 1.04, routeDistance - seam)
        : previousDense?.visualWidth ?? Math.max(settings.ballSize * 1.04, 24);
    }
    platform.visualTiltRad = axisAngle(Math.atan2(-route.normal.x, route.normal.y));
  }
  if (chordNode) {
    platform.visualStyle = "instrument-pad";
    platform.visualWidth = Math.max(settings.ballSize * 3.4, Math.min(platform.width * 0.72, 68));
    if (settings.instrumentLayout === "corridor") platform.visualThickness = platform.visualWidth;
    if (index > chordNode.start) platform.visualHidden = true;
    return;
  }
  if (denseNode || settings.instrumentFamily !== "auto") return;
  const previousGapMs = index > 0 ? Math.max(1, event.timeMs - context.events[index - 1].timeMs) : spanMs;
  const localGapMs = Math.min(spanMs, previousGapMs);
  if (localGapMs <= 230) {
    platform.visualStyle = event.isDrum ? "instrument-pad" : "instrument-key";
    platform.visualWidth = Math.max(settings.ballSize * 2.7, Math.min(platform.width * 0.5, 58));
  } else if (localGapMs <= 360) {
    platform.visualStyle = event.isDrum ? "instrument-pad" : "instrument-key";
    platform.visualWidth = Math.max(settings.ballSize * 3, Math.min(platform.width * 0.64, 72));
  } else if (localGapMs <= 520) {
    platform.visualWidth = Math.max(settings.ballSize * 3.2, platform.width * 0.78);
  }
}

function createPlatformForRoute(
  context: PlannerContext,
  index: number,
  state: SearchState,
  step: ExpansionStep,
  route: RouteCandidate,
) {
  const platform = obstacleFromImpact(
    index,
    state.hit,
    route.normal,
    route.outgoing,
    step.settings,
    step.event,
    context.resolveColor(index, step.pitch),
    step.platformWidth,
    step.profile.gravity,
  );
  platform.motionMode = step.chord
    ? "hold"
    : step.denseRun
      ? ("motionMode" in route ? route.motionMode : undefined) ?? "roll"
      : "ballistic";
  platform.denseRunId = step.denseNode?.id;
  platform.denseSurfaceId = step.denseNode?.surfaceId;
  platform.chordClusterId = step.chordNode?.id;
  applyPlannerVisualHints(context, index, state, step, route, platform);
  const impactStyle = "impactStyle" in route ? route.impactStyle : undefined;
  if (impactStyle === "instrument-pad" && !step.denseNode && !step.chordNode) platform.visualStyle = impactStyle;
  const midiVisualStyle = midiInstrumentVisualStyle(step.event, step.settings);
  if (midiVisualStyle) platform.visualStyle = midiVisualStyle;
  fitVisualWidthForScene(platform, state.recentPlatforms, step.settings);
  return platform;
}

function preferredDirectionForTarget(target: Vec2, incoming: Vec2, current: number, settings: StudioSettings, width: number) {
  let direction = Math.abs(incoming.x) > 18 ? Math.sign(incoming.x) : current;
  const bounds = courseWorldBounds(settings, width);
  const edgeInset = Math.max(72, settings.laneSpread * 0.24);
  if (target.x < bounds.min + edgeInset) direction = 1;
  else if (target.x > bounds.max - edgeInset) direction = -1;
  return direction;
}

function recentHistory<T>(items: T[], next: T, size: number) {
  return [...items, next].slice(-size);
}

function buildNextSearchState(
  context: PlannerContext,
  index: number,
  state: SearchState,
  step: ExpansionStep,
  route: RouteCandidate,
  platform: MarblePlatform,
  preview: boolean,
  baseSceneRisk: number,
): SearchState | null {
  const nextHit = route.target;
  const dt = Math.max(0.001, step.spanMs / 1000);
  const constrainedMotion = step.chord !== undefined || platform.motionMode === "roll";
  const nextIncoming = constrainedMotion
    ? { ...route.outgoing }
    : { x: route.outgoing.x, y: route.outgoing.y + step.profile.gravity * dt };
  const historySize = step.settings.instrumentFamily !== "auto" ? 28 : 22;
  const recentHits = recentHistory(state.recentHits, state.hit, historySize);
  const recentPlatforms = recentHistory(state.recentPlatforms, platform, historySize);
  const marbleWallInset = Math.max(step.settings.ballSize * 1.08, 10);
  if (!trajectoryWithinWorldBounds(state.hit, route.outgoing, step.spanMs, platform.motionMode, step.settings, context.width, marbleWallInset)) return null;

  const trajectoryRisk = trajectoryClearancePenalty(
    state.hit,
    route.outgoing,
    step.spanMs,
    step.profile.gravity,
    platform.motionMode,
    platform,
    state.recentPlatforms,
    step.settings,
  );
  const nextImpactRisk = nextImpactClearancePenalty(nextHit, platform, state.recentPlatforms, step.settings);
  const sceneRisk = baseSceneRisk + trajectoryRisk + nextImpactRisk;
  const spacingRisk = constrainedMotion ? 0 : adjacentSpacingPenalty(nextHit, state.hit, step.settings);
  const separationRisk = constrainedMotion ? 0 : separationPenalty(nextHit, recentHits, step.settings);
  return {
    hit: nextHit,
    incoming: nextIncoming,
    preferredDirection: preferredDirectionForTarget(nextHit, nextIncoming, state.preferredDirection, step.settings, context.width),
    score: state.score + route.score + spacingRisk + separationRisk + sceneRisk,
    forecastPenalty: 0,
    sceneRisk,
    node: preview ? state.node : { platform, parent: state.node },
    recentHits,
    recentPlatforms,
  };
}

function expandSearchState(context: PlannerContext, index: number, state: SearchState, preview = false) {
  const step = createExpansionStep(context, index, state);
  if (!step) return [];
  const expanded: SearchState[] = [];
  for (const route of step.candidates) {
    const platform = createPlatformForRoute(context, index, state, step, route);
    const overlapRisk = platformOverlapPenalty(platform, state.recentPlatforms, step.settings);
    const priorTrajectoryRisk = platformAgainstRecentTrajectoriesPenalty(platform, state.recentPlatforms, step.settings);
    const wallRisk = wallClearancePenalty(platform, step.settings, context.width);
    const baseSceneRisk = overlapRisk + priorTrajectoryRisk + wallRisk;
    if (index === context.events.length - 1) {
      expanded.push({
        ...state,
        score: state.score + route.score + baseSceneRisk,
        forecastPenalty: 0,
        sceneRisk: baseSceneRisk,
        node: preview ? state.node : { platform, parent: state.node },
      });
      continue;
    }
    const next = buildNextSearchState(context, index, state, step, route, platform, preview, baseSceneRisk);
    if (next) expanded.push(next);
  }
  return expanded;
}

function previewFuturePenalty(context: PlannerContext, nextIndex: number, state: SearchState, depth: number): number {
  if (depth <= 0 || nextIndex >= context.events.length) return 0;
  const children = expandSearchState(context, nextIndex, state, true);
  if (!children.length) return FORECAST_DEAD_END;
  children.sort((a, b) => {
    const aStep = a.score - state.score;
    const bStep = b.score - state.score;
    return (a.sceneRisk + Math.min(400, Math.max(0, aStep - a.sceneRisk)) * 0.12)
      - (b.sceneRisk + Math.min(400, Math.max(0, bStep - b.sceneRisk)) * 0.12);
  });
  let best = Infinity;
  for (const child of children.slice(0, FORECAST_BRANCHES)) {
    const localMotionCost = Math.min(400, Math.max(0, child.score - state.score - child.sceneRisk)) * 0.12;
    const hardPenalty = child.sceneRisk >= HARD_SCENE_RISK ? FORECAST_DEAD_END + child.sceneRisk : child.sceneRisk;
    const future = previewFuturePenalty(context, nextIndex + 1, child, depth - 1);
    best = Math.min(best, hardPenalty + localMotionCost + future * 0.72);
  }
  return Number.isFinite(best) ? best : FORECAST_DEAD_END;
}

function addForecasts(context: PlannerContext, index: number, expanded: SearchState[]) {
  if (!expanded.length) return expanded;
  expanded.sort((a, b) => a.score - b.score);
  if (index >= context.events.length - 1) return expanded;
  const forecastPool = expanded.slice(0, Math.min(expanded.length, context.beamWidth * 2));
  const depth = previewDepthFor(context.events, index + 1);
  for (const state of forecastPool) state.forecastPenalty = previewFuturePenalty(context, index + 1, state, depth);
  for (let poolIndex = forecastPool.length; poolIndex < expanded.length; poolIndex += 1) {
    expanded[poolIndex].forecastPenalty = FORECAST_DEAD_END * 0.55;
  }
  expanded.sort((a, b) => rankedScore(a) - rankedScore(b));
  return expanded;
}

function initialSearchState(events: NoteEvent[], settings: StudioSettings, width: number): SearchState {
  return {
    hit: { x: width / 2, y: 220 },
    incoming: { x: 0, y: marbleEntrySpeed(settings) },
    preferredDirection: seeded(events.length, 41) >= 0 ? 1 : -1,
    score: 0,
    forecastPenalty: 0,
    sceneRisk: 0,
    node: null,
    recentHits: [],
    recentPlatforms: [],
  };
}

function expandWithRollback(context: PlannerContext, index: number, states: SearchState[], reserveFrontier: SearchState[]) {
  let expanded = addForecasts(context, index, states.flatMap((state) => expandSearchState(context, index, state)));
  const hasCleanBranch = expanded.some((state) => state.sceneRisk < HARD_SCENE_RISK && state.forecastPenalty < CLEAN_FORECAST_LIMIT);
  if (hasCleanBranch || index <= 0 || reserveFrontier.length <= states.length) return expanded;
  const rollbackSources = reserveFrontier.slice(states.length, context.reserveWidth);
  if (!rollbackSources.length) return expanded;
  const rollbackExpanded = rollbackSources.flatMap((state) => expandSearchState(context, index, state));
  return addForecasts(context, index, [...expanded, ...rollbackExpanded]);
}

function reportPlannerProgress(onProgress: ((progress: number) => void) | undefined, index: number, total: number) {
  if (!onProgress || total <= 0) return;
  const interval = Math.max(8, Math.floor(total / 80));
  if (index % interval === 0 || index === total - 1) onProgress(Math.min(0.92, ((index + 1) / total) * 0.92));
}

export function buildPhysicsCourse(
  events: NoteEvent[],
  settings: StudioSettings,
  width: number,
  resolveColor: PlatformColorResolver,
  resolveSettings?: StudioSettingsResolver,
  onProgress?: (progress: number) => void,
): MarblePlatform[] {
  if (!events.length) return [];
  const context = createPlannerContext(events, settings, width, resolveColor, resolveSettings);
  const initialSettings = plannerSettingsAt(context, 0);
  let states: SearchState[] = [initialSearchState(events, initialSettings, width)];
  let reserveFrontier = states;

  for (let index = 0; index < events.length; index += 1) {
    const expanded = expandWithRollback(context, index, states, reserveFrontier);
    if (!expanded.length) break;
    reserveFrontier = expanded.slice(0, context.reserveWidth);
    states = reserveFrontier.slice(0, context.beamWidth);
    reportPlannerProgress(onProgress, index, events.length);
  }

  onProgress?.(0.94);
  const solved = reconstruct(states[0]?.node ?? null);
  const denseDecorated = decorateDenseInstrumentRuns(solved, context.denseRuns, settings, resolveSettings);
  onProgress?.(0.97);
  const chordDecorated = decorateChordClusters(denseDecorated, context.chords);
  const fitted = fitCourseToTrajectories(chordDecorated, settings, width, resolveSettings);
  const instrumentAligned = fitted.map((platform, index) => {
    if (platform.denseRunId !== undefined || platform.denseSurfaceId !== undefined || platform.chordClusterId !== undefined) return platform;
    const frameSettings = resolveSettings?.(index) ?? settings;
    const visualStyle = midiInstrumentVisualStyle(platform.event, frameSettings);
    return visualStyle ? { ...platform, visualStyle } : platform;
  });
  onProgress?.(1);
  return instrumentAligned;
}
