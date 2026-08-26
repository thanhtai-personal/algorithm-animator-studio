export type TrackKind = 'start' | 'road' | 'piano' | 'tube' | 'boost' | 'final' | 'finish';

export type TrackSegment = {
  id: string;
  kind: TrackKind;
  z0: number;
  z1: number;
  y0: number;
  y1: number;
  width: number;
  color: string;
};

export type Checkpoint = {
  id: string;
  z: number;
  keep: number;
  label: string;
};

export type SegmentPose = {
  position: [number, number, number];
  rotationX: number;
  length: number;
  normal: [number, number, number];
};
