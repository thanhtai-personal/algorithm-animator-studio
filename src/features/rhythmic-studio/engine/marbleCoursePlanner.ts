import type { NoteEvent, StudioSettings } from "../types";
import { rhythmTerrainForGap } from "../lib/rhythmTerrain";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { marbleEntrySpeed, marblePhysicsProfile, type MarblePhysicsProfile } from "./marblePhysicsProfiles";
import { presetObstaclePlan } from "./presetObstaclePlan";
import {
  adjacentSpacingPenalty,
  courseWorldBounds,
  platformOverlapPenalty,
  separationPenalty,
  wallClearancePenalty,
} from "./marbleCourseConstraints";
import {
  chordClusters,
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
  const targetX = clamp(naturalX, bounds.min, bounds.max);
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

function bounceCandidates(index: number, hit: Vec2, incoming: Vec2, spanMs: number, preferredDirection: number, pitch: number, settings: StudioSettings, width: number) {
  const profile = marblePhysicsProfile(settings);
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const terrain = rhythmTerrainForGap(spanMs, settings);
  const spacing = obstacleSpacingScale(index + 1, spanMs, settings);
  const naturalHorizontal = Math.max(8, terrain.horizontalDistance * profile.horizontalScale * spacing.horizontal * 0.42);
  const pitchBias = (pitch - 0.5) * settings.laneSpread * 0.018;
  const result: BounceCandidate[] = [];

  // Do not solve restitution backwards to force the marble to an arbitrary
  // destination. A collision keeps a stable material restitution; the next
  // instrument is placed where that real ballistic arc naturally arrives at the
  // next note timestamp.
  const restitution = naturalRestitution(profile, settings);
  const angles = collisionAngles(profile, dt);
  for (let order = 0; order < angles.length; order += 1) {
      const normalInput = normalForAngle(angles[order]);
      const tangentRetention = settings.terrainProfile === "comet" ? 0.93 : settings.instrumentFamily !== "auto" ? 0.955 : 0.965;
      const reflected = outgoingForNormal(incoming, normalInput, restitution, tangentRetention);
      if (settings.terrainProfile === "comet") {
        reflected.velocity.x = clamp(reflected.velocity.x, -560, 560);
      } else {
        reflected.velocity.x = clamp(reflected.velocity.x, -520, 520);
      }
      const target = {
        x: hit.x + reflected.velocity.x * dt,
        y: hit.y + reflected.velocity.y * dt + 0.5 * profile.gravity * dt * dt,
      };
      const dx = target.x - hit.x;
      const dy = target.y - hit.y;
      if (target.x < bounds.min || target.x > bounds.max) continue;
      // In normal play the next collision should happen while the marble is
      // descending. Very dense note runs may be almost level, but never require
      // the ball to teleport upward to make the timestamp.
      const nextIncomingY = reflected.velocity.y + profile.gravity * dt;
      const minimumDrop = dt < 0.16 ? -1.5 : dt < 0.24 ? 0 : 4;
      if (dy < minimumDrop || dy > Math.max(260, profile.longGapDropPerSecond * dt * 1.8)) continue;
      // Every ordinary strike should happen on the descending half of the arc.
      // Dense passages may be almost tangent to the surface, but still must not
      // hit the next instrument while the ball is visibly climbing.
      if (nextIncomingY < (dt < 0.16 ? -2 : 8)) continue;
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
      result.push({
        normal: reflected.normal,
        outgoing: reflected.velocity,
        target,
        score: directionPenalty + horizontalPenalty + pitchPenalty + flightArcPenalty + excessiveApexPenalty
          + energyGainPenalty + speedPenalty + landingSpeedPenalty + edgePenalty + orientationPenalty(index, reflected.normal, settings) + randomTieBreak,
      });
  }

  result.sort((a, b) => a.score - b.score);
  return result.length ? result.slice(0, 9) : [fallbackCandidate(hit, incoming, spanMs, preferredDirection, settings, width)];
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

function reconstruct(node: PlanNode | null) {
  const result: MarblePlatform[] = [];
  for (let current = node; current; current = current.parent) result.push(current.platform);
  return result.reverse();
}

export type StudioSettingsResolver = (index: number) => StudioSettings;

export function buildPhysicsCourse(events: NoteEvent[], settings: StudioSettings, width: number, resolveColor: PlatformColorResolver, resolveSettings?: StudioSettingsResolver): MarblePlatform[] {
  if (!events.length) return [];
  const initialSettings = resolveSettings?.(0) ?? settings;
  const initialProfile = marblePhysicsProfile(initialSettings);
  const minMidi = Math.min(...events.map((event) => event.midi));
  const maxMidi = Math.max(...events.map((event) => event.midi));
  const showcaseCourse = initialSettings.instrumentFamily !== "auto";
  const denseRuns = denseInstrumentRuns(events, settings, resolveSettings);
  const denseSegments = denseRunSegmentMap(denseRuns);
  const denseNodes = denseRunNodeMap(denseRuns);
  const denseEnds = denseRunEndMap(denseRuns);
  const chords = chordClusters(events);
  const chordSegments = chordSegmentMap(chords);
  const beamWidth = showcaseCourse
    ? (events.length > 1800 ? 3 : events.length > 700 ? 4 : 6)
    : events.length > 1200 ? 2 : events.length > 500 ? 3 : 5;
  let states: SearchState[] = [{
    hit: { x: width / 2, y: 220 }, incoming: { x: 0, y: marbleEntrySpeed(initialSettings) },
    preferredDirection: seeded(events.length, 41) >= 0 ? 1 : -1, score: 0, node: null, recentHits: [], recentPlatforms: [],
  }];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const stepSettings = resolveSettings?.(index) ?? settings;
    const profile = marblePhysicsProfile(stepSettings);
    const pitch = pitchRatio(event, minMidi, maxMidi);
    const spanMs = index < events.length - 1 ? Math.max(1, events[index + 1].timeMs - event.timeMs) : 420;
    const obstaclePlan = presetObstaclePlan(index, stepSettings);
    const baseWidthScale = stepSettings.terrainProfile === "tube-board" ? 0.9 : stepSettings.terrainProfile === "xylophone" ? 1.02 : 0.92;
    const platformWidth = stepSettings.platformWidth * baseWidthScale * (obstaclePlan?.widthScale ?? 1) * (0.9 + event.velocity * 0.14);
    const expanded: SearchState[] = [];

    for (const state of states) {
      const denseRun = denseSegments.get(index);
      const denseNode = denseNodes.get(index);
      const denseEnd = denseEnds.get(index);
      const chord = chordSegments.get(index);
      const smoothExit = denseEnd && index < events.length - 1
        ? rollingExitCandidate(state.hit, state.incoming, spanMs, stepSettings, width, profile.gravity)
        : null;
      const candidates = chord
        ? [holdRouteCandidate(state.hit, state.incoming)]
        : denseRun
          ? [rollingRouteCandidate(state.hit, state.incoming, events, index, denseRun, state.preferredDirection, stepSettings, width)]
          : smoothExit
            ? [smoothExit]
            : bounceCandidates(index, state.hit, state.incoming, spanMs, state.preferredDirection, pitch, stepSettings, width);
      for (const bounce of candidates) {
        const platform = obstacleFromImpact(index, state.hit, bounce.normal, bounce.outgoing, stepSettings, event, resolveColor(index, pitch), platformWidth, profile.gravity);
        platform.motionMode = chord ? "hold" : denseRun ? "roll" : "ballistic";
        platform.denseRunId = denseNode?.id;
        platform.chordClusterId = chord?.id;
        if (index === events.length - 1) {
          expanded.push({ ...state, score: state.score + bounce.score, node: { platform, parent: state.node } });
          continue;
        }
        const nextHit = bounce.target;
        const dt = Math.max(0.08, spanMs / 1000);
        const constrainedMotion = Boolean(chord || denseRun);
        const nextIncoming = constrainedMotion
          ? { ...bounce.outgoing }
          : { x: bounce.outgoing.x, y: bounce.outgoing.y + profile.gravity * dt };
        let nextDirection = Math.abs(nextIncoming.x) > 18 ? Math.sign(nextIncoming.x) : state.preferredDirection;
        const bounds = courseWorldBounds(stepSettings, width);
        const edgeInset = Math.max(72, stepSettings.laneSpread * 0.24);
        // Do not flip direction on a decorative cadence. The marble keeps its
        // horizontal momentum until the physical route approaches a wall.
        if (nextHit.x < bounds.min + edgeInset) nextDirection = 1;
        else if (nextHit.x > bounds.max - edgeInset) nextDirection = -1;
        const historySize = stepSettings.instrumentFamily !== "auto" ? 12 : 7;
        const recentHits = [...state.recentHits, state.hit].slice(-historySize);
        const recentPlatforms = [...state.recentPlatforms, platform].slice(-historySize);
        expanded.push({
          hit: nextHit,
          incoming: nextIncoming,
          preferredDirection: nextDirection,
          score: state.score + bounce.score
            + (constrainedMotion ? 0 : adjacentSpacingPenalty(nextHit, state.hit, stepSettings))
            + (constrainedMotion ? 0 : separationPenalty(nextHit, recentHits, stepSettings))
            + (constrainedMotion ? 0 : platformOverlapPenalty(platform, state.recentPlatforms, stepSettings))
            + wallClearancePenalty(platform, stepSettings, width),
          node: { platform, parent: state.node },
          recentHits,
          recentPlatforms,
        });
      }
    }

    expanded.sort((a, b) => a.score - b.score);
    states = expanded.slice(0, beamWidth);
  }

  const denseDecorated = decorateDenseInstrumentRuns(reconstruct(states[0]?.node ?? null), denseRuns, settings, resolveSettings);
  return decorateChordClusters(denseDecorated, chords);
}
