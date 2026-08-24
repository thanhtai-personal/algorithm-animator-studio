import type { NoteEvent, StudioSettings } from "../types";
import { REST_GAP_MS, rhythmTerrainForGap } from "../lib/rhythmTerrain";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { marbleEntrySpeed, marblePhysicsProfile, type MarblePhysicsProfile } from "./marblePhysicsProfiles";
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

function naturalRestitution(profile: MarblePhysicsProfile, settings: StudioSettings, factor = 1) {
  const userBounce = clamp((settings.bounceHeight - 48) / 96, 0, 1);
  const center = profile.restitutionMin + (profile.restitutionMax - profile.restitutionMin) * (0.42 + userBounce * 0.28);
  return clamp(center * factor, profile.restitutionMin, profile.restitutionMax);
}

function worldBounds(settings: StudioSettings, width: number) {
  // Wall scenes need a hard safe aperture. Allowing the planner to route outside
  // the visible wall made marbles and instruments pass through the side panels.
  if (settings.instrumentFamily !== "auto") return { min: width * 0.14, max: width * 0.86 };
  if (settings.terrainProfile === "balanced") return { min: 62, max: width - 62 };
  if (settings.terrainProfile === "xylophone") return { min: 72, max: width - 72 };
  if (settings.terrainProfile === "tube-board") return { min: 64, max: width - 64 };
  return { min: -width * 0.55, max: width * 1.55 };
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
  const bounds = worldBounds(settings, width);
  const sign = direction || (incoming.x >= 0 ? 1 : -1) || 1;
  const normalInput = normalForAngle(sign * (settings.instrumentFamily !== "auto" ? 0.18 : 0.24));
  const reflected = outgoingForNormal(incoming, normalInput, naturalRestitution(profile, settings), 0.95);
  reflected.velocity.x = clamp(reflected.velocity.x, -520, 520);
  const target = {
    x: clamp(hit.x + reflected.velocity.x * dt, bounds.min, bounds.max),
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
  const bounds = worldBounds(settings, width);
  const terrain = rhythmTerrainForGap(spanMs, settings);
  const spacing = obstacleSpacingScale(index + 1, spanMs, settings);
  const naturalHorizontal = Math.max(8, terrain.horizontalDistance * profile.horizontalScale * spacing.horizontal * 0.42);
  const pitchBias = (pitch - 0.5) * settings.laneSpread * 0.018;
  const result: BounceCandidate[] = [];

  // Do not solve restitution backwards to force the marble to an arbitrary
  // destination. A collision keeps a stable material restitution; the next
  // instrument is placed where that real ballistic arc naturally arrives at the
  // next note timestamp.
  for (const restitutionFactor of [0.92, 1, 1.08]) {
    for (let order = 0; order < profile.normalAngles.length; order += 1) {
      const normalInput = normalForAngle(profile.normalAngles[order]);
      const restitution = naturalRestitution(profile, settings, restitutionFactor);
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
      const minimumDrop = dt < 0.18 ? -4 : dt < 0.28 ? 0 : 4;
      if (dy < minimumDrop || dy > Math.max(260, profile.longGapDropPerSecond * dt * 1.8)) continue;
      if (dt >= 0.2 && nextIncomingY < 18) continue;
      const apex = reflected.velocity.y < 0 ? reflected.velocity.y ** 2 / (2 * profile.gravity) : 0;
      const apexTime = reflected.velocity.y < 0 ? -reflected.velocity.y / profile.gravity : 0;
      const flightArcPenalty = apexTime > dt * 0.72 ? (apexTime - dt * 0.72) * 180 : 0;
      const directionPenalty = Math.sign(dx || preferredDirection) === Math.sign(preferredDirection) ? 0 : 5;
      const horizontalPenalty = Math.abs(Math.abs(dx) - naturalHorizontal) * 0.035;
      const pitchPenalty = Math.abs(dx - (preferredDirection * naturalHorizontal + pitchBias)) * 0.008;
      const excessiveApexPenalty = Math.max(0, apex - Math.max(12, settings.bounceHeight * 0.95)) * 0.3;
      const speedPenalty = Math.max(0, length(reflected.velocity) - 760) * 0.18;
      const landingSpeedPenalty = Math.max(0, nextIncomingY - 900) * 0.14;
      const edgeDistance = Math.min(target.x - bounds.min, bounds.max - target.x);
      const edgePenalty = Math.max(0, width * 0.1 - edgeDistance) * 0.16;
      const randomTieBreak = Math.abs(seeded(index * 31 + order, Math.round(restitutionFactor * 100))) * 0.8;
      result.push({
        normal: reflected.normal,
        outgoing: reflected.velocity,
        target,
        score: directionPenalty + horizontalPenalty + pitchPenalty + flightArcPenalty + excessiveApexPenalty
          + speedPenalty + landingSpeedPenalty + edgePenalty + orientationPenalty(index, reflected.normal, settings) + randomTieBreak,
      });
    }
  }

  result.sort((a, b) => a.score - b.score);
  return result.length ? result.slice(0, 9) : [fallbackCandidate(hit, incoming, spanMs, preferredDirection, settings, width)];
}

function denseKeyboardRuns(events: NoteEvent[], settings: StudioSettings, resolveSettings?: StudioSettingsResolver) {
  const runs: Array<{ start: number; end: number }> = [];
  let index = 0;
  while (index < events.length - 3) {
    const frameSettings = resolveSettings?.(index) ?? settings;
    if (frameSettings.instrumentFamily === "auto") { index += 1; continue; }
    let end = index;
    while (end < events.length - 1) {
      const localSettings = resolveSettings?.(end) ?? settings;
      const gap = events[end + 1].timeMs - events[end].timeMs;
      if (localSettings.instrumentFamily === "auto" || gap > 185 || end - index >= 13) break;
      end += 1;
    }
    if (end - index >= 3) {
      runs.push({ start: index, end });
      index = end + 1;
    } else index += 1;
  }
  return runs;
}

function decorateDenseKeyboardRuns(platforms: MarblePlatform[], events: NoteEvent[], settings: StudioSettings, resolveSettings?: StudioSettingsResolver) {
  if (!platforms.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  for (const run of denseKeyboardRuns(events, settings, resolveSettings)) {
    const first = decorated[run.start];
    const last = decorated[Math.min(run.end, decorated.length - 1)];
    if (!first || !last) continue;
    const dx = last.hitX - first.hitX;
    const dy = last.hitY - first.hitY;
    const runDistance = Math.hypot(dx, dy);
    first.visualStyle = "piano-keyboard";
    first.visualX = (first.hitX + last.hitX) * 0.5;
    first.visualY = (first.hitY + last.hitY) * 0.5 + 5;
    first.visualWidth = clamp(runDistance + 72, 220, 360);
    first.visualTiltRad = clamp(Math.atan2(dy, dx), -0.22, 0.22);
    for (let index = run.start + 1; index <= run.end && index < decorated.length; index += 1) decorated[index].visualHidden = true;
  }
  return decorated;
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

function pointSegmentDistance(point: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq < 1e-6) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
}

function cross(a: Vec2, b: Vec2, c: Vec2) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentIntersects(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
  const abC = cross(a, b, c);
  const abD = cross(a, b, d);
  const cdA = cross(c, d, a);
  const cdB = cross(c, d, b);
  return ((abC <= 0 && abD >= 0) || (abC >= 0 && abD <= 0))
    && ((cdA <= 0 && cdB >= 0) || (cdA >= 0 && cdB <= 0));
}

function segmentDistance(a: Vec2, b: Vec2, c: Vec2, d: Vec2) {
  if (segmentIntersects(a, b, c, d)) return 0;
  return Math.min(
    pointSegmentDistance(a, c, d),
    pointSegmentDistance(b, c, d),
    pointSegmentDistance(c, a, b),
    pointSegmentDistance(d, a, b),
  );
}

function platformSegment(platform: MarblePlatform) {
  const dx = Math.cos(platform.tiltRad) * platform.width * 0.5;
  const dy = Math.sin(platform.tiltRad) * platform.width * 0.5;
  return {
    a: { x: platform.x - dx, y: platform.y - dy },
    b: { x: platform.x + dx, y: platform.y + dy },
  };
}

function platformOverlapPenalty(platform: MarblePlatform, recent: MarblePlatform[], settings: StudioSettings) {
  const collisionCritical = settings.terrainProfile === "tube-board"
    || settings.terrainProfile === "xylophone"
    || settings.instrumentFamily !== "auto";
  if (!collisionCritical) return 0;
  const segment = platformSegment(platform);
  let penalty = 0;
  for (const other of recent) {
    const previous = platformSegment(other);
    const distance = segmentDistance(segment.a, segment.b, previous.a, previous.b);
    const safeDistance = Math.max(
      settings.instrumentFamily !== "auto" ? 22 : 18,
      settings.ballSize * (settings.instrumentFamily !== "auto" ? 1.45 : 0.95),
      (platform.thickness + other.thickness) * 0.62,
    );
    if (distance < safeDistance) {
      const overlap = safeDistance - distance;
      const crossingBoost = distance < 0.5 ? 9000 : 0;
      penalty += crossingBoost + overlap * 22 + overlap * overlap * 0.8;
    }
  }
  return penalty;
}

function wallClearancePenalty(platform: MarblePlatform, settings: StudioSettings, width: number) {
  if (settings.instrumentFamily === "auto") return 0;
  const bounds = worldBounds(settings, width);
  const segment = platformSegment(platform);
  const overhang = Math.max(
    0,
    bounds.min - Math.min(segment.a.x, segment.b.x),
    Math.max(segment.a.x, segment.b.x) - bounds.max,
  );
  if (overhang <= 0) return 0;
  return 3000 + overhang * 52 + overhang * overhang * 2.1;
}

function adjacentSpacingPenalty(target: Vec2, current: Vec2, settings: StudioSettings) {
  const profileScale = settings.instrumentFamily !== "auto" ? 0.68
    : settings.terrainProfile === "xylophone" ? 0.58
    : settings.terrainProfile === "tube-board" ? 0.54
      : settings.terrainProfile === "comet" ? 0.5
        : 0.48;
  const preferred = Math.max(settings.ballSize * 3.4, settings.platformGap * profileScale, settings.minBounceDistance);
  const distance = Math.hypot(target.x - current.x, target.y - current.y);
  if (distance >= preferred) return 0;
  const shortfall = preferred - distance;
  return shortfall * 7.5 + shortfall * shortfall * 0.11;
}

function separationPenalty(target: Vec2, recentHits: Vec2[], settings: StudioSettings) {
  // platformGap used to barely affect the actual minimum distance, so dense note
  // clusters collapsed into a stack of almost-touching bars. Keep collisions on
  // the exact note timestamps, but strongly prefer a larger spatial route.
  const profileScale = settings.instrumentFamily !== "auto" ? 0.6
    : settings.terrainProfile === "tube-board" ? 0.5
    : settings.terrainProfile === "xylophone" ? 0.46
      : settings.terrainProfile === "comet" ? 0.4
        : 0.42;
  const threshold = Math.max(
    settings.ballSize * 3.1,
    settings.platformThickness * 2.15,
    settings.platformGap * profileScale,
    settings.minBounceDistance * 0.85,
  );
  let penalty = 0;
  for (const point of recentHits) {
    const distance = Math.hypot(target.x - point.x, target.y - point.y);
    if (distance < threshold) {
      const overlap = threshold - distance;
      penalty += overlap * 3.8 + overlap * overlap * 0.045;
    }
  }
  return penalty;
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
      const useGuideTube = spanMs >= REST_GAP_MS && (stepSettings.terrainProfile === "tube-board" || stepSettings.terrainProfile === "balanced");
      const effectiveSpan = useGuideTube ? Math.min(spanMs, 680) : spanMs;
      const candidates = bounceCandidates(index, state.hit, state.incoming, effectiveSpan, state.preferredDirection, pitch, stepSettings, width);
      for (const bounce of candidates) {
        const platform = obstacleFromImpact(index, state.hit, bounce.normal, bounce.outgoing, stepSettings, event, resolveColor(index, pitch), platformWidth, profile.gravity);
        if (index === events.length - 1) {
          expanded.push({ ...state, score: state.score + bounce.score, node: { platform, parent: state.node } });
          continue;
        }
        const nextHit = useGuideTube
          ? longGapTarget(index, state.hit, spanMs, state.preferredDirection, pitch, stepSettings, width)
          : bounce.target;
        const dt = Math.max(0.08, spanMs / 1000);
        const nextIncoming = useGuideTube
          ? { x: (nextHit.x - state.hit.x) / dt * 0.24, y: Math.max(190, profile.gravity * Math.min(dt, 0.7) * 0.58) }
          : { x: bounce.outgoing.x, y: bounce.outgoing.y + profile.gravity * dt };
        let nextDirection = Math.abs(nextIncoming.x) > 18 ? Math.sign(nextIncoming.x) : state.preferredDirection;
        const bounds = worldBounds(stepSettings, width);
        const edgeInset = Math.max(72, stepSettings.laneSpread * 0.24);
        const denseTransition = stepSettings.instrumentFamily !== "auto" && spanMs <= 185;
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
          score: state.score + bounce.score + (denseTransition ? 0 : adjacentSpacingPenalty(nextHit, state.hit, stepSettings))
            + (denseTransition ? 0 : separationPenalty(nextHit, recentHits, stepSettings))
            + (denseTransition ? 0 : platformOverlapPenalty(platform, state.recentPlatforms, stepSettings))
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

  return decorateDenseKeyboardRuns(reconstruct(states[0]?.node ?? null), events, settings, resolveSettings);
}
