import type { NoteEvent, PlatformStyle } from "../types";

export interface Vec2 {
  x: number;
  y: number;
}

export type ContactMode = "cap" | "surface" | "bumper";
export type SegmentMotionMode = "ballistic" | "roll" | "hold";

export interface MarblePlatform {
  index: number;
  x: number;
  y: number;
  width: number;
  thickness: number;
  tiltRad: number;
  color: string;
  contactX: number;
  contactY: number;
  hitX: number;
  hitY: number;
  normalX: number;
  normalY: number;
  outVX: number;
  outVY: number;
  gravity: number;
  contactMode: ContactMode;
  event: NoteEvent;
  motionMode?: SegmentMotionMode;
  denseRunId?: number;
  denseSurfaceId?: number;
  chordClusterId?: number;
  visualStyle?: PlatformStyle;
  visualX?: number;
  visualY?: number;
  visualWidth?: number;
  visualTiltRad?: number;
  visualHidden?: boolean;
}

export interface MarblePoint {
  x: number;
  y: number;
  color: string;
  platformIndex: number;
}
