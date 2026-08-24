import type { NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { courseWorldBounds } from "./marbleCourseConstraints";

export type DenseInstrumentKind = "keyboard" | "pad-strip";

export interface DenseInstrumentRun {
  id: number;
  start: number;
  end: number;
  kind: DenseInstrumentKind;
}

export interface ChordCluster {
  id: number;
  start: number;
  end: number;
}

export interface RollingRouteCandidate {
  normal: Vec2;
  outgoing: Vec2;
  target: Vec2;
  score: number;
}

type SettingsResolver = (index: number) => StudioSettings;

const CHORD_GAP_MS = 24;
const DENSE_GAP_MS = 185;
const MIN_RUN_STRIKES = 3;
const MAX_RUN_STRIKES = 14;
const ROLL_SLOPE = 0.075;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const length = (v: Vec2) => Math.hypot(v.x, v.y);
const normalize = (v: Vec2): Vec2 => {
  const size = length(v);
  return size > 1e-6 ? { x: v.x / size, y: v.y / size } : { x: 1, y: 0 };
};

function supportsDenseInstrumentRun(_settings: StudioSettings) {
  // Dense routing is a planner decision, not a preset-only decoration. In auto
  // mode this is exactly where we want to switch from isolated obstacles to a
  // continuous playable surface instead of disabling collision constraints.
  return true;
}

function denseInstrumentKind(events: NoteEvent[], start: number, end: number): DenseInstrumentKind {
  // Classify by physical strike groups, not by raw MIDI note count. A piano chord
  // may contain 8-12 notes at one timestamp while a hi-hat is only one note; raw
  // counting therefore made mixed phrases look overwhelmingly melodic/percussive
  // depending on chord voicing rather than on what the marble actually strikes.
  let strikeGroups = 0;
  let drumGroups = 0;
  let groupStart = start;
  while (groupStart <= end) {
    let groupEnd = groupStart;
    let drums = events[groupStart]?.isDrum ? 1 : 0;
    let notes = 1;
    while (groupEnd < end && events[groupEnd + 1].timeMs - events[groupEnd].timeMs <= CHORD_GAP_MS) {
      groupEnd += 1;
      notes += 1;
      if (events[groupEnd]?.isDrum) drums += 1;
    }
    strikeGroups += 1;
    if (drums >= Math.ceil(notes * 0.6)) drumGroups += 1;
    groupStart = groupEnd + 1;
  }
  return drumGroups >= Math.ceil(strikeGroups * 0.6) ? "pad-strip" : "keyboard";
}

export function denseInstrumentRuns(events: NoteEvent[], settings: StudioSettings, resolveSettings?: SettingsResolver) {
  const runs: DenseInstrumentRun[] = [];
  let index = 0;
  while (index < events.length) {
    const frameSettings = resolveSettings?.(index) ?? settings;
    if (!supportsDenseInstrumentRun(frameSettings)) {
      index += 1;
      continue;
    }

    let end = index;
    let strikePositions = 1;
    // Bound modules by physical strikes instead of raw MIDI notes. The supplied
    // production MIDI routinely has 4-14 simultaneous notes at one onset; using
    // raw-note count consumed the old 14-note limit inside a single chord and
    // prevented the following 159 ms hits from becoming one playable lane.
    while (end < events.length - 1 && strikePositions < MAX_RUN_STRIKES) {
      const localSettings = resolveSettings?.(end) ?? settings;
      const nextSettings = resolveSettings?.(end + 1) ?? settings;
      const gap = events[end + 1].timeMs - events[end].timeMs;
      if (!supportsDenseInstrumentRun(localSettings) || !supportsDenseInstrumentRun(nextSettings) || gap > DENSE_GAP_MS) break;
      if (gap > CHORD_GAP_MS) strikePositions += 1;
      end += 1;
    }

    if (strikePositions >= MIN_RUN_STRIKES) {
      runs.push({ id: runs.length, start: index, end, kind: denseInstrumentKind(events, index, end) });
      const nextGap = end < events.length - 1 ? events[end + 1].timeMs - events[end].timeMs : Infinity;
      // Long dense passages are split into manageable keyboard modules, but the
      // modules share their boundary note. That keeps the marble rolling through
      // the seam instead of inserting a one-note ballistic hop every module.
      index = nextGap > CHORD_GAP_MS && nextGap <= DENSE_GAP_MS ? end : end + 1;
    } else {
      index += 1;
    }
  }
  return runs;
}

export function chordClusters(events: NoteEvent[]) {
  const clusters: ChordCluster[] = [];
  let index = 0;
  while (index < events.length - 1) {
    let end = index;
    while (end < events.length - 1 && events[end + 1].timeMs - events[end].timeMs <= CHORD_GAP_MS) end += 1;
    if (end > index) {
      clusters.push({ id: clusters.length, start: index, end });
      index = end + 1;
    } else index += 1;
  }
  return clusters;
}

export function chordSegmentMap(clusters: ChordCluster[]) {
  const bySegment = new Map<number, ChordCluster>();
  for (const cluster of clusters) {
    for (let index = cluster.start; index < cluster.end; index += 1) bySegment.set(index, cluster);
  }
  return bySegment;
}

export function chordNodeMap(clusters: ChordCluster[]) {
  const byNode = new Map<number, ChordCluster>();
  for (const cluster of clusters) {
    for (let index = cluster.start; index <= cluster.end; index += 1) byNode.set(index, cluster);
  }
  return byNode;
}

export function holdRouteCandidate(hit: Vec2, incoming: Vec2): RollingRouteCandidate {
  return { normal: { x: 0, y: -1 }, outgoing: { ...incoming }, target: { ...hit }, score: 0 };
}

export function denseRunSegmentMap(runs: DenseInstrumentRun[]) {
  const bySegment = new Map<number, DenseInstrumentRun>();
  for (const run of runs) {
    for (let index = run.start; index < run.end; index += 1) bySegment.set(index, run);
  }
  return bySegment;
}

export function denseRunNodeMap(runs: DenseInstrumentRun[]) {
  const byNode = new Map<number, DenseInstrumentRun>();
  for (const run of runs) {
    for (let index = run.start; index <= run.end; index += 1) byNode.set(index, run);
  }
  return byNode;
}

export function denseRunEndMap(runs: DenseInstrumentRun[]) {
  const byEnd = new Map<number, DenseInstrumentRun>();
  for (const run of runs) byEnd.set(run.end, run);
  return byEnd;
}

function rollSpeed(incoming: Vec2, enteringRun: boolean, settings: StudioSettings) {
  const base = clamp(145 + settings.laneSpread * 0.1, 150, 195);
  if (enteringRun) {
    // A landing transfers part of the incoming momentum into the keyboard lane.
    // The route is then placed from that physically plausible speed rather than
    // teleporting the ball to a pre-selected key position.
    return clamp(Math.abs(incoming.x) * 0.58 + base * 0.62, 145, 205);
  }
  return clamp(length(incoming), 145, 210);
}


function runExitReserve(events: NoteEvent[], run: DenseInstrumentRun, speed: number, ballSize: number) {
  if (run.end >= events.length - 1) return 0;
  const nextGap = events[run.end + 1].timeMs - events[run.end].timeMs;
  if (nextGap <= DENSE_GAP_MS) return 0;
  // Leave enough horizontal room for the marble to roll off the last key and
  // enter a free-flight arc. Without this reserve, a perfectly good keyboard can
  // terminate at the wall and force an artificial bounce on its final key.
  return clamp(speed * Math.min(0.48, Math.max(0.08, nextGap / 1000)) * 0.72, ballSize * 2.2, 78);
}

function runHorizontalNeed(events: NoteEvent[], index: number, run: DenseInstrumentRun, speed: number, ballSize: number) {
  let total = 0;
  for (let segment = index; segment < run.end; segment += 1) {
    const gapMs = events[segment + 1].timeMs - events[segment].timeMs;
    if (gapMs <= CHORD_GAP_MS) continue;
    const dt = Math.max(0.08, gapMs / 1000);
    total += clamp(speed * dt, ballSize * 1.08, 34);
  }
  return total;
}

export function rollingRouteCandidate(
  hit: Vec2,
  incoming: Vec2,
  events: NoteEvent[],
  index: number,
  run: DenseInstrumentRun,
  preferredDirection: number,
  settings: StudioSettings,
  width: number,
  lockDirection = false,
): RollingRouteCandidate {
  const spanMs = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const margin = Math.max(settings.ballSize * 2.2, 28);
  const minX = bounds.min + margin;
  const maxX = bounds.max - margin;
  const speed = rollSpeed(incoming, index === run.start, settings);
  let step = clamp(speed * dt, settings.ballSize * 1.08, 34);
  let direction = preferredDirection || (incoming.x >= 0 ? 1 : -1) || 1;

  // Pick the lane direction once at entry using the room required by the whole
  // run. Subsequent keys inherit the outgoing velocity sign, so the strip never
  // zig-zags merely because one local key is close to a wall.
  if (index === run.start && !lockDirection) {
    const totalNeed = runHorizontalNeed(events, index, run, speed, settings.ballSize)
      + runExitReserve(events, run, speed, settings.ballSize);
    const forwardRoom = direction > 0 ? maxX - hit.x : hit.x - minX;
    const reverseRoom = direction > 0 ? hit.x - minX : maxX - hit.x;
    if (forwardRoom < totalNeed && reverseRoom > forwardRoom) direction *= -1;
  }

  const remaining = Math.max(1, run.end - index);
  const availableRoom = direction > 0 ? maxX - hit.x : hit.x - minX;
  step = Math.min(step, Math.max(settings.ballSize * 0.95, availableRoom / remaining));
  const dx = direction * step;
  const dy = Math.abs(dx) * ROLL_SLOPE;
  const target = { x: clamp(hit.x + dx, minX, maxX), y: hit.y + dy };
  const actual = { x: target.x - hit.x, y: target.y - hit.y };
  const tangent = normalize(actual);
  const normal = { x: tangent.y, y: -tangent.x };
  return {
    normal,
    outgoing: { x: actual.x / dt, y: actual.y / dt },
    target,
    score: Math.abs(step - Math.abs(actual.x)) * 0.45,
  };
}

export function rollingExitCandidate(
  hit: Vec2,
  incoming: Vec2,
  spanMs: number,
  settings: StudioSettings,
  width: number,
  gravity: number,
): RollingRouteCandidate | null {
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const target = {
    x: hit.x + incoming.x * dt,
    y: hit.y + incoming.y * dt + 0.5 * gravity * dt * dt,
  };
  const inset = Math.max(settings.ballSize * 1.8, 24);
  if (target.x < bounds.min + inset || target.x > bounds.max - inset) return null;
  const tangent = normalize(incoming);
  const axisTangent = tangent.x >= 0 ? tangent : { x: -tangent.x, y: -tangent.y };
  const normal = { x: axisTangent.y, y: -axisTangent.x };
  return {
    normal,
    // No bounce impulse here. The final key is the edge of the continuous lane;
    // the marble keeps its tangent velocity and gravity takes over after it rolls
    // off, which removes the visible velocity discontinuity at dense-run exits.
    outgoing: { ...incoming },
    target,
    score: 0,
  };
}

function runAxis(platforms: MarblePlatform[], run: DenseInstrumentRun) {
  const first = platforms[run.start];
  const last = platforms[Math.min(run.end, platforms.length - 1)];
  if (!first || !last) return null;
  const dx = last.hitX - first.hitX;
  const dy = last.hitY - first.hitY;
  const tangent = normalize({ x: dx, y: dy });
  const axisTangent = tangent.x >= 0 ? tangent : { x: -tangent.x, y: -tangent.y };
  return {
    first,
    tangent: axisTangent,
    normal: { x: axisTangent.y, y: -axisTangent.x },
    angle: Math.atan2(axisTangent.y, axisTangent.x),
  };
}

export function decorateDenseInstrumentRuns(
  platforms: MarblePlatform[],
  runs: DenseInstrumentRun[],
  settings: StudioSettings,
  resolveSettings?: SettingsResolver,
) {
  if (!platforms.length || !runs.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  for (const run of runs) {
    const axis = runAxis(decorated, run);
    if (!axis) continue;
    const count = run.end - run.start + 1;
    const scalar: number[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      const platform = decorated[run.start + offset];
      const fromStart = { x: platform.hitX - axis.first.hitX, y: platform.hitY - axis.first.hitY };
      scalar.push(fromStart.x * axis.tangent.x + fromStart.y * axis.tangent.y);
    }

    for (let offset = 0; offset < count; offset += 1) {
      const index = run.start + offset;
      const platform = decorated[index];
      if (!platform) continue;
      const localSettings = resolveSettings?.(index) ?? settings;
      const current = scalar[offset];
      const previousGap = offset > 0 ? Math.max(1, current - scalar[offset - 1]) : Math.max(1, scalar[1] - current);
      const nextGap = offset < count - 1 ? Math.max(1, scalar[offset + 1] - current) : previousGap;
      const left = offset === 0 ? current - nextGap * 0.5 : (scalar[offset - 1] + current) * 0.5;
      const right = offset === count - 1 ? current + previousGap * 0.5 : (current + scalar[offset + 1]) * 0.5;
      const center = (left + right) * 0.5;
      const seam = run.kind === "keyboard" ? 1.2 : 2.4;
      const keyWidth = Math.max(localSettings.ballSize * 1.04, right - left - seam);
      const lineHit = {
        x: axis.first.hitX + axis.tangent.x * center,
        y: axis.first.hitY + axis.tangent.y * center,
      };
      platform.visualStyle = run.kind === "keyboard" ? "piano-key" : "instrument-pad";
      platform.visualX = lineHit.x - axis.normal.x * localSettings.ballSize;
      platform.visualY = lineHit.y - axis.normal.y * localSettings.ballSize;
      platform.visualWidth = keyWidth;
      platform.visualTiltRad = axis.angle;
      platform.visualHidden = false;
    }
  }
  return decorated;
}

export function decorateChordClusters(platforms: MarblePlatform[], clusters: ChordCluster[]) {
  if (!platforms.length || !clusters.length) return platforms;
  const decorated = platforms.map((platform) => ({ ...platform }));
  for (const cluster of clusters) {
    const first = decorated[cluster.start];
    if (!first) continue;
    first.visualStyle = "instrument-pad";
    // A chord inside a rolling lane becomes a slightly wider pad in that same
    // surface, not a huge standalone plate laid across neighbouring keys. Chords
    // outside dense runs preserve the collision-fitted width chosen by the planner.
    first.visualWidth = first.denseRunId !== undefined
      ? Math.max(first.visualWidth ?? 0, Math.min(first.width * 0.27, 30))
      : first.visualWidth ?? Math.max(first.width * 0.82, 78);
    for (let index = cluster.start + 1; index <= cluster.end && index < decorated.length; index += 1) {
      decorated[index].visualHidden = true;
    }
  }
  return decorated;
}
