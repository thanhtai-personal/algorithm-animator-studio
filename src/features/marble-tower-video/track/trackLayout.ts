import type { Checkpoint, SegmentPose, TrackSegment } from './trackTypes';

export const TRACK_WIDTH = 9;
export const TRACK_THICKNESS = 0.42;
export const MARBLE_RADIUS = 0.43;

export const TRACK_SEGMENTS: TrackSegment[] = [
  { id: 'start-drop', kind: 'start', z0: -2, z1: 18, y0: 18.2, y1: 16.0, width: TRACK_WIDTH, color: '#23384d' },
  { id: 'neon-slope', kind: 'road', z0: 18, z1: 36, y0: 16.0, y1: 12.0, width: TRACK_WIDTH, color: '#183149' },
  { id: 'piano-base', kind: 'piano', z0: 36, z1: 55, y0: 12.0, y1: 12.0, width: TRACK_WIDTH, color: '#121922' },
  { id: 'spinner-run', kind: 'road', z0: 55, z1: 73, y0: 12.0, y1: 11.8, width: TRACK_WIDTH, color: '#1a3446' },
  { id: 'glass-tube', kind: 'tube', z0: 73, z1: 94, y0: 11.8, y1: 11.1, width: TRACK_WIDTH, color: '#162c3f' },
  { id: 'sky-ramp', kind: 'road', z0: 94, z1: 112, y0: 11.1, y1: 13.2, width: TRACK_WIDTH, color: '#243951' },
  { id: 'landing', kind: 'road', z0: 112, z1: 140, y0: 13.2, y1: 9.9, width: TRACK_WIDTH, color: '#1c3347' },
  { id: 'turbo', kind: 'boost', z0: 140, z1: 160, y0: 9.9, y1: 9.2, width: TRACK_WIDTH, color: '#173a48' },
  { id: 'final-chaos', kind: 'final', z0: 160, z1: 191, y0: 9.2, y1: 8.9, width: TRACK_WIDTH, color: '#2b203d' },
  { id: 'finish', kind: 'finish', z0: 191, z1: 206, y0: 8.9, y1: 8.9, width: TRACK_WIDTH, color: '#213343' }
];

export const CHECKPOINTS: Checkpoint[] = [
  { id: 'cut-6', z: 91, keep: 6, label: 'CUT TO 6' },
  { id: 'cut-4', z: 138, keep: 4, label: 'CUT TO 4' },
  { id: 'cut-2', z: 169, keep: 2, label: 'FINAL 2' }
];

export const FINISH_Z = 199;
export const START_GATE_Z = 7;
export const JUMP_PAD_Z = 104;
export const TURBO_PAD_Z = 148;

export function segmentPose(segment: TrackSegment, thickness = TRACK_THICKNESS): SegmentPose {
  const dz = segment.z1 - segment.z0;
  const dy = segment.y1 - segment.y0;
  const length = Math.hypot(dz, dy);
  const rotationX = -Math.atan2(dy, dz);
  const normal: [number, number, number] = [0, Math.cos(rotationX), Math.sin(rotationX)];
  const surfaceY = (segment.y0 + segment.y1) / 2;
  const surfaceZ = (segment.z0 + segment.z1) / 2;
  return {
    length,
    rotationX,
    normal,
    position: [
      0,
      surfaceY - normal[1] * thickness / 2,
      surfaceZ - normal[2] * thickness / 2
    ]
  };
}

export function surfaceYAt(z: number) {
  const segment = TRACK_SEGMENTS.find((item) => z >= item.z0 && z <= item.z1)
    ?? (z < TRACK_SEGMENTS[0].z0 ? TRACK_SEGMENTS[0] : TRACK_SEGMENTS[TRACK_SEGMENTS.length - 1]);
  const t = Math.max(0, Math.min(1, (z - segment.z0) / Math.max(0.001, segment.z1 - segment.z0)));
  return segment.y0 + (segment.y1 - segment.y0) * t;
}
