import type { NoteEvent, StudioSettings } from "../types";
import type { MarblePlatform, Vec2 } from "./marblePhysicsTypes";
import { courseWorldBounds } from "./marbleCourseConstraints";

export interface DenseInstrumentRun {
  id: number;
  start: number;
  end: number;
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
const MIN_RUN_NOTES = 4;
const MAX_RUN_NOTES = 12;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function supportsDenseInstrumentRun(settings: StudioSettings) {
  return settings.instrumentFamily !== "auto" || settings.terrainProfile === "xylophone";
}

export function denseInstrumentRuns(events: NoteEvent[], settings: StudioSettings, resolveSettings?: SettingsResolver) {
  const runs: DenseInstrumentRun[] = [];
  let index = 0;
  while (index < events.length - (MIN_RUN_NOTES - 1)) {
    const frameSettings = resolveSettings?.(index) ?? settings;
    if (!supportsDenseInstrumentRun(frameSettings)) {
      index += 1;
      continue;
    }

    let end = index;
    while (end < events.length - 1 && end - index + 1 < MAX_RUN_NOTES) {
      const localSettings = resolveSettings?.(end) ?? settings;
      const nextSettings = resolveSettings?.(end + 1) ?? settings;
      const gap = events[end + 1].timeMs - events[end].timeMs;
      if (!supportsDenseInstrumentRun(localSettings) || !supportsDenseInstrumentRun(nextSettings) || gap <= CHORD_GAP_MS || gap > DENSE_GAP_MS) break;
      end += 1;
    }

    if (end - index + 1 >= MIN_RUN_NOTES) {
      runs.push({ id: runs.length, start: index, end });
      index = end + 1;
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

export function rollingRouteCandidate(
  hit: Vec2,
  spanMs: number,
  preferredDirection: number,
  settings: StudioSettings,
  width: number,
  stepsRemaining = 1,
): RollingRouteCandidate {
  const dt = Math.max(0.08, spanMs / 1000);
  const bounds = courseWorldBounds(settings, width);
  const margin = Math.max(settings.ballSize * 2.2, 28);
  const minX = bounds.min + margin;
  const maxX = bounds.max - margin;
  const speed = clamp(145 + settings.laneSpread * 0.1, 155, 195);
  let step = clamp(speed * dt, settings.ballSize * 1.08, 32);
  let direction = preferredDirection || 1;
  const forwardRoom = direction > 0 ? maxX - hit.x : hit.x - minX;
  const reverseRoom = direction > 0 ? hit.x - minX : maxX - hit.x;
  const neededRoom = step * Math.max(1, stepsRemaining);
  if (forwardRoom < neededRoom && reverseRoom > forwardRoom) direction *= -1;
  const availableRoom = direction > 0 ? maxX - hit.x : hit.x - minX;
  step = Math.min(step, Math.max(settings.ballSize * 0.9, availableRoom / Math.max(1, stepsRemaining)));
  const targetX = clamp(hit.x + direction * step, minX, maxX);
  const drop = clamp(2.2 + dt * 20, 3.2, 6.4);
  const target = { x: targetX, y: hit.y + drop };
  return {
    normal: { x: 0, y: -1 },
    outgoing: { x: (target.x - hit.x) / dt, y: (target.y - hit.y) / dt },
    target,
    score: Math.abs(step - Math.abs(target.x - hit.x)) * 0.4,
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
    const first = decorated[run.start];
    const last = decorated[Math.min(run.end, decorated.length - 1)];
    if (!first || !last) continue;
    const firstSettings = resolveSettings?.(run.start) ?? settings;
    const dx = last.hitX - first.hitX;
    const dy = last.hitY - first.hitY;
    const runDistance = Math.hypot(dx, dy);
    first.visualStyle = "piano-keyboard";
    first.visualX = (first.hitX + last.hitX) * 0.5;
    first.visualY = (first.hitY + last.hitY) * 0.5 + firstSettings.ballSize;
    first.visualWidth = clamp(runDistance + Math.max(52, firstSettings.ballSize * 3.2), 150, 430);
    first.visualTiltRad = clamp(Math.atan2(dy, dx), -0.24, 0.24);
    for (let index = run.start + 1; index <= run.end && index < decorated.length; index += 1) {
      decorated[index].visualHidden = true;
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
    first.visualWidth = Math.max(first.width * 0.82, 78);
    for (let index = cluster.start + 1; index <= cluster.end && index < decorated.length; index += 1) {
      decorated[index].visualHidden = true;
    }
  }
  return decorated;
}
