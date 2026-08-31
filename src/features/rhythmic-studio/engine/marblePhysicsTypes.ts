import type { NoteEvent, PlatformStyle } from "../types";

export interface Vec2 {
  x: number;
  y: number;
}

export type ContactMode = "cap" | "surface" | "bumper";
export type SegmentMotionMode = "ballistic" | "roll" | "hold";
export type DenseSurfaceLayout = "parallel-rails" | "connected-keys" | "button-strip";

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
  /** Physical support used to keep long note gaps moving at a natural speed. */
  longRail?: boolean;
  denseRunId?: number;
  denseSurfaceId?: number;
  denseLayout?: DenseSurfaceLayout;
  chordClusterId?: number;
  visualStyle?: PlatformStyle;
  visualX?: number;
  visualY?: number;
  visualWidth?: number;
  visualThickness?: number;
  visualTiltRad?: number;
  /** Keeps the instrument identity while using its shallow crowded-row body. */
  visualCompact?: boolean;
  visualHidden?: boolean;
}

export interface MarblePoint {
  x: number;
  y: number;
  color: string;
  platformIndex: number;
}
