import type { NoteEvent } from "@/features/rhythmic-studio/types";

export type TowerTrackSectionName =
  | "START"
  | "NEON DROP"
  | "PIANO RUN"
  | "TWIN SPINNER"
  | "GLASS TUBE"
  | "SKY JUMP"
  | "BEAT GATE"
  | "TURBO LANE"
  | "FINAL CHAOS"
  | "FINISH";

export type TowerTrackPiece = {
  name: TowerTrackSectionName;
  startZ: number;
  endZ: number;
  startY: number;
  endY: number;
  piano?: boolean;
};

export const TOWER_ROAD_WIDTH = 12;
export const TOWER_BALL_RADIUS = 0.46;
export const TOWER_BASE_FINISH_Z = 166;

export const TOWER_TRACK: TowerTrackPiece[] = [
  { name: "START", startZ: 0, endZ: 12, startY: 8, endY: 7.4 },
  { name: "NEON DROP", startZ: 12, endZ: 22, startY: 7.4, endY: 5.9 },
  { name: "PIANO RUN", startZ: 22, endZ: 42, startY: 5.9, endY: 4.9, piano: true },
  { name: "TWIN SPINNER", startZ: 42, endZ: 57, startY: 4.9, endY: 4 },
  { name: "GLASS TUBE", startZ: 57, endZ: 70, startY: 4, endY: 3.4 },
  { name: "SKY JUMP", startZ: 70, endZ: 91, startY: 3.4, endY: 2.4 },
  { name: "BEAT GATE", startZ: 91, endZ: 115, startY: 2.4, endY: 1.2 },
  { name: "TURBO LANE", startZ: 115, endZ: 136, startY: 1.2, endY: 0.15 },
  { name: "FINAL CHAOS", startZ: 136, endZ: 157, startY: 0.15, endY: -0.95 },
  { name: "FINISH", startZ: 157, endZ: 170, startY: -0.95, endY: -1.6 },
];

const SPAWN_LANES = [-4.1, -2.9, -1.75, -0.55, 0.55, 1.75, 2.9, 4.1] as const;

export type TowerCourseMetrics = {
  zScale: number;
  yScale: number;
  finishZ: number;
};

export type TowerRacerPose = {
  x: number;
  y: number;
  z: number;
  roll: number;
  progress: number;
  speed: number;
};

export function towerCourseMetrics(durationMs: number, drive: number): TowerCourseMetrics {
  const seconds = Math.max(1, durationMs / 1000);
  const targetUnitsPerSecond = 7.4 * Math.max(0.75, drive);
  const finishZ = Math.max(TOWER_BASE_FINISH_Z, seconds * targetUnitsPerSecond);
  const zScale = finishZ / TOWER_BASE_FINISH_Z;
  return { zScale, yScale: Math.min(2.55, 0.72 + zScale * 0.58), finishZ };
}

export function towerTrackY(baseZ: number) {
  const z = Math.max(0, Math.min(TOWER_BASE_FINISH_Z, baseZ));
  const piece = TOWER_TRACK.find((item) => z >= item.startZ && z < item.endZ) ?? TOWER_TRACK[TOWER_TRACK.length - 1];
  const t = Math.max(0, Math.min(1, (z - piece.startZ) / Math.max(0.001, piece.endZ - piece.startZ)));
  return piece.startY + (piece.endY - piece.startY) * t;
}

export function towerSectionAt(progress: number) {
  const z = Math.max(0, Math.min(TOWER_BASE_FINISH_Z, progress * TOWER_BASE_FINISH_Z));
  return TOWER_TRACK.find((piece) => z >= piece.startZ && z < piece.endZ)?.name ?? "FINISH";
}

function racerProgress(raw: number, racerIndex: number) {
  const safe = Math.max(0, Math.min(1, raw));
  const phase = racerIndex * 1.73 + 0.35;
  const middleEnvelope = Math.sin(Math.PI * safe);
  const rankingBias = Math.sin(phase * 1.31) * 0.018 * middleEnvelope;
  const surge = Math.sin(safe * Math.PI * (4.2 + racerIndex * 0.13) + phase) * 0.012 * middleEnvelope;
  const turbo = safe > 0.67 && safe < 0.84 ? Math.sin(((safe - 0.67) / 0.17) * Math.PI) * (0.018 + racerIndex * 0.0015) : 0;
  return Math.max(0, Math.min(1, safe + rankingBias + surge + turbo));
}

function jumpLift(baseZ: number) {
  const jumpStart = 77;
  const jumpEnd = 91;
  if (baseZ <= jumpStart || baseZ >= jumpEnd) return 0;
  return Math.sin(((baseZ - jumpStart) / (jumpEnd - jumpStart)) * Math.PI) * 2.65;
}

export function towerRacerPose(
  timeMs: number,
  durationMs: number,
  racerIndex: number,
  drive: number,
): TowerRacerPose {
  const metrics = towerCourseMetrics(durationMs, drive);
  const raw = Math.max(0, Math.min(1, timeMs / Math.max(1, durationMs)));
  const progress = racerProgress(raw, racerIndex);
  const baseZ = progress * TOWER_BASE_FINISH_Z;
  const z = baseZ * metrics.zScale;
  const lane = SPAWN_LANES[racerIndex % SPAWN_LANES.length];
  const lateral = Math.sin(progress * 29 + racerIndex * 1.9) * 0.6 + Math.sin(progress * 11 + racerIndex) * 0.24;
  const x = Math.max(-5.15, Math.min(5.15, lane * 0.68 + lateral));
  const y = towerTrackY(baseZ) * metrics.yScale + jumpLift(baseZ) + TOWER_BALL_RADIUS + 0.12;
  const speed = metrics.finishZ / Math.max(1, durationMs / 1000) * (0.92 + Math.cos(progress * 15 + racerIndex) * 0.08);
  return { x, y, z, roll: -z / TOWER_BALL_RADIUS, progress, speed };
}

export function towerRankings(timeMs: number, durationMs: number, drive: number) {
  return Array.from({ length: 8 }, (_, index) => ({ index, pose: towerRacerPose(timeMs, durationMs, index, drive) }))
    .sort((a, b) => b.pose.progress - a.pose.progress);
}

export function firstTowerEventAtOrAfter(events: NoteEvent[], timeMs: number) {
  const index = events.findIndex((event) => event.timeMs >= timeMs - 1);
  return index < 0 ? events.length : index;
}
