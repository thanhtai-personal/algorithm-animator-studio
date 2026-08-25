import type { StudioSettings } from "../types";
import type { SegmentMotionMode, Vec2 } from "./marblePhysicsTypes";

export type DenseInstrumentKind = "keyboard" | "pad-strip";

export interface DenseInstrumentRun {
  id: number;
  surfaceId: number;
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
  motionMode?: SegmentMotionMode;
}

export type DenseSettingsResolver = (index: number) => StudioSettings;

// Treat sub-15 ms offsets as one physical impact. This absorbs MIDI timestamp
// quantization while keeping a 16.7 ms arpeggio as distinct marble strikes.
export const CHORD_GAP_MS = 14;
