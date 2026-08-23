import type { NoteEvent } from "../types";

export interface Vec2 {
  x: number;
  y: number;
}

export type ContactMode = "cap" | "surface" | "bumper";

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
}

export interface MarblePoint {
  x: number;
  y: number;
  color: string;
  platformIndex: number;
}
