import type { NoteEvent, StudioSettings } from "../types";
import type { Vec2 } from "./marblePhysicsTypes";
import { courseWorldBounds } from "./marbleCourseConstraints";
import { marblePhysicsProfile } from "./marblePhysicsProfiles";
import type { DenseInstrumentKind, DenseInstrumentRun, DenseSettingsResolver, ChordCluster, RollingRouteCandidate } from "./denseInstrumentTypes";
import { CHORD_GAP_MS } from "./denseInstrumentTypes";

export type { DenseInstrumentKind, DenseInstrumentRun, ChordCluster, RollingRouteCandidate } from "./denseInstrumentTypes";
export { CHORD_GAP_MS } from "./denseInstrumentTypes";
export { decorateChordClusters, decorateDenseInstrumentRuns } from "./denseInstrumentDecoration";
// Above this gap a real bounce remains readable. Below it a passive rolling
// surface is both smoother and more physically plausible than accelerating the
// marble between distant obstacles.
const DENSE_GAP_MS = 260;
const MIN_RUN_STRIKES = 3;
// Imported MIDIs commonly encode 16th-note ornaments around 136 ms (110 BPM).
// Keep those two-hit bursts on one playable surface; forcing a full ballistic
// bounce into that window reads as a sudden drop even though the note timing is
// correct. 160 ms still leaves ordinary eighth-note passages as real bounces.
const MICRO_BURST_GAP_MS = 160;
const MAX_RUN_STRIKES = 14;
// A shallower grade reads as a perfectly horizontal shelf in the perspective
// camera, so the marble seems to propel itself. About eight degrees remains
// compact while making gravity-driven travel visible.
const ROLL_SLOPE = 0.14;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const length = (v: Vec2) => Math.hypot(v.x, v.y);
const normalize = (v: Vec2): Vec2 => {
  const size = length(v);
  return size > 1e-6 ? { x: v.x / size, y: v.y / size } : { x: 1, y: 0 };
};

function supportsDenseInstrumentRun(settings: StudioSettings) {
  // Dense routing is a planner decision, not a preset-only decoration. In auto
  // mode this is exactly where we want to switch from isolated obstacles to a
  // continuous playable surface instead of disabling collision constraints.
  // The Korobeiniki reference is the exception: even its 115 ms notes strike
  // separate tube mouths, never a continuous keyboard/rail surface.
  return settings.instrumentLayout !== "wall-score";
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
    const groupAnchorMs = events[groupStart]?.timeMs ?? 0;
    let drums = events[groupStart]?.isDrum ? 1 : 0;
    let notes = 1;
    while (groupEnd < end && events[groupEnd + 1].timeMs - groupAnchorMs <= CHORD_GAP_MS) {
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

export function denseInstrumentRuns(events: NoteEvent[], settings: StudioSettings, resolveSettings?: DenseSettingsResolver) {
  const runs: DenseInstrumentRun[] = [];
  let nextSurfaceId = 0;
  let index = 0;
  while (index < events.length) {
    const frameSettings = resolveSettings?.(index) ?? settings;
    if (!supportsDenseInstrumentRun(frameSettings)) {
      index += 1;
      continue;
    }

    let end = index;
    let strikePositions = 1;
    let strikeAnchorMs = events[index].timeMs;
    let tightestStrikeGap = Number.POSITIVE_INFINITY;
    // Count physical strikes from an onset anchor, never by chaining adjacent raw
    // events. A 16.7 ms arpeggio such as 0 -> 16.7 -> 33.3 -> 50 ms is four
    // strikes, not one 50 ms chord just because every neighbouring gap is small.
    // This invariant is shared with chordClusters() below so the planner cannot
    // freeze the marble while the dense detector thinks it is still one strike.
    while (end < events.length - 1) {
      const localSettings = resolveSettings?.(end) ?? settings;
      const nextSettings = resolveSettings?.(end + 1) ?? settings;
      const nextTimeMs = events[end + 1].timeMs;
      if (!supportsDenseInstrumentRun(localSettings) || !supportsDenseInstrumentRun(nextSettings)) break;
      const fromStrikeAnchor = nextTimeMs - strikeAnchorMs;
      // Always finish the current physical strike before splitting a planner
      // module. CK7 could hit MAX_RUN_STRIKES between two notes of the same chord,
      // creating two different denseSurfaceIds at one location; their keys then
      // occupied the same space even though musically they were one strike.
      if (fromStrikeAnchor <= CHORD_GAP_MS) {
        end += 1;
        continue;
      }
      if (strikePositions >= MAX_RUN_STRIKES || fromStrikeAnchor > DENSE_GAP_MS) break;
      strikePositions += 1;
      tightestStrikeGap = Math.min(tightestStrikeGap, fromStrikeAnchor);
      strikeAnchorMs = nextTimeMs;
      end += 1;
    }

    const microBurst = strikePositions === 2 && tightestStrikeGap <= MICRO_BURST_GAP_MS;
    if (strikePositions >= MIN_RUN_STRIKES || microBurst) {
      const kind = denseInstrumentKind(events, index, end);
      const previous = runs[runs.length - 1];
      const continuesPreviousSurface = Boolean(previous && previous.end === index && previous.kind === kind);
      const surfaceId = continuesPreviousSurface ? previous.surfaceId : nextSurfaceId++;
      runs.push({ id: runs.length, surfaceId, start: index, end, kind });
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
    const anchorMs = events[index].timeMs;
    while (end < events.length - 1 && events[end + 1].timeMs - anchorMs <= CHORD_GAP_MS) end += 1;
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

function rollSpeed(incoming: Vec2, surfaceEntry: boolean, settings: StudioSettings) {
  const base = clamp(145 + settings.laneSpread * 0.1, 150, 195);
  if (surfaceEntry) {
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
    const dt = Math.max(0.001, gapMs / 1000);
    total += clamp(speed * dt, Math.max(2.2, ballSize * 0.16), 34);
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
  surfaceEntry = true,
  lockDirection = false,
): RollingRouteCandidate {
  const spanMs = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const dt = Math.max(0.001, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  // Use the same center clearance as ballistic routes. A larger lane-only inset
  // can put a valid incoming hit outside the rolling bounds; clamping the next
  // key then moves backward and creates an impulse that no instrument explains.
  const margin = Math.max(settings.ballSize * 1.25, settings.platformThickness * 0.72, 14);
  const minX = bounds.min + margin;
  const maxX = bounds.max - margin;
  const speed = rollSpeed(incoming, surfaceEntry, settings);
  const minimumStep = Math.max(2.2, settings.ballSize * 0.16);
  let step = clamp(speed * dt, minimumStep, 34);
  const incomingDirection = Math.abs(incoming.x) > 1 ? Math.sign(incoming.x) : 0;
  let direction = lockDirection
    ? Math.sign(preferredDirection || incomingDirection || 1)
    : incomingDirection || Math.sign(preferredDirection) || 1;

  const roomFor = (candidateDirection: number) => (
    candidateDirection > 0 ? maxX - hit.x : hit.x - minX
  );

  // The entry collision may redirect the marble onto either side of the new
  // lane. Never keep a direction with no travel room: clamping X while still
  // advancing Y made the sphere spin and descend at one fixed screen position.
  const totalNeed = runHorizontalNeed(events, index, run, speed, settings.ballSize)
    + runExitReserve(events, run, speed, settings.ballSize);
  const forwardRoom = roomFor(direction);
  const reverseRoom = roomFor(-direction);
  const needsTurnaround = forwardRoom < minimumStep
    || (forwardRoom < totalNeed && reverseRoom > forwardRoom && reverseRoom >= minimumStep);
  if (needsTurnaround && roomFor(-direction) > roomFor(direction)) {
    direction *= -1;
  }

  // A passive lane cannot reverse the tangential component of the incoming
  // velocity. Preserve its direction and compress the run when the forward side
  // is short; an actual change of direction must be produced by a visible bounce.
  if (surfaceEntry && !lockDirection) {
    const forwardRoom = roomFor(direction);
    if (forwardRoom < totalNeed) step *= clamp(forwardRoom / Math.max(totalNeed, 1), 0, 1);
  }

  const remaining = Math.max(1, run.end - index);
  const availableRoom = Math.max(0, roomFor(direction));
  step = Math.min(step, availableRoom / remaining);
  const dx = direction * step;
  const dy = Math.abs(dx) * ROLL_SLOPE;
  const target = { x: clamp(hit.x + dx, minX, maxX), y: hit.y + dy };
  const actual = { x: target.x - hit.x, y: target.y - hit.y };
  const redirected = incomingDirection !== 0 && Math.sign(actual.x) !== incomingDirection;
  const tangent = normalize(actual);
  let normal = { x: tangent.y, y: -tangent.x };
  // A rolling lane has one playable face: the face above the course. Reversing
  // travel direction reverses the tangent, but must not turn that face toward
  // the floor or the marble will appear to cling to the underside of the keys.
  if (normal.y > 0) normal = { x: -normal.x, y: -normal.y };
  let outgoing = { x: actual.x / dt, y: actual.y / dt };
  if (redirected) {
    const gravity = marblePhysicsProfile(settings).gravity;
    outgoing = {
      x: actual.x / dt,
      y: (actual.y - 0.5 * gravity * dt * dt) / dt,
    };
    normal = normalize({ x: incoming.x - outgoing.x, y: incoming.y - outgoing.y });
    if (incoming.x * normal.x + incoming.y * normal.y > 0) normal = { x: -normal.x, y: -normal.y };
    if (normal.y > 0) normal = { x: -normal.x, y: -normal.y };
  }
  return {
    normal,
    outgoing,
    target,
    score: Math.abs(step - Math.abs(actual.x)) * 0.45 + (redirected ? 28 : 0),
    motionMode: redirected ? "ballistic" : "roll",
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
  const dt = Math.max(0.001, spanMs / 1000);
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
