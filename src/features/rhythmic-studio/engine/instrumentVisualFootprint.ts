import type { PlatformStyle } from "../types";
import type { MarblePlatform } from "./marblePhysicsTypes";

export interface InstrumentVisualFootprint {
  width: number;
  thickness: number;
  /** Distance from the playable edge toward the body, in course pixels. */
  centerInset: number;
}

function topAnchored(width: number, thickness: number): InstrumentVisualFootprint {
  return { width, thickness, centerInset: thickness * 0.5 };
}

function keyBody(width: number, thickness: number) {
  const face = Math.max(thickness < 9 ? 5.2 : 11, thickness);
  return topAnchored(width, face + Math.max(4.5, face * 0.4));
}

function padBody(width: number, thickness: number) {
  const face = Math.max(thickness < 9 ? 5.4 : 12, thickness);
  return topAnchored(width, face + Math.max(4.5, face * 0.4));
}

function drumBody(width: number, thickness: number) {
  const faceRx = Math.max(18, width * 0.44);
  const faceRy = Math.max(7, Math.min(faceRx * 0.34, thickness * 0.72));
  return topAnchored(Math.max(width, faceRx * 2), faceRy * 2 + Math.max(faceRy * 1.7, faceRx * 0.42));
}

function styleFootprint(style: PlatformStyle | undefined, width: number, thickness: number): InstrumentVisualFootprint {
  if (style === "drum-disc") return drumBody(width, thickness);
  if (style === "gong-disc") {
    const diameter = Math.max(56, width * 0.84);
    return topAnchored(Math.max(width, diameter), diameter);
  }
  if (style === "instrument-cymbal") {
    const radiusY = Math.max(8, thickness * 0.62);
    return topAnchored(Math.max(width, Math.max(28, width * 0.32) * 2), radiusY * 4.3 + 3);
  }
  if (style === "metallophone-plate") {
    const face = Math.max(thickness < 9 ? 7 : 14, thickness);
    return topAnchored(width, face * 1.75);
  }
  if (["instrument-key", "xylophone-key", "xylophone-bar", "piano-key", "marimba-bar", "vibraphone-bar"].includes(style ?? "")) {
    return keyBody(width, thickness);
  }
  if (style === "instrument-pad" || style === "pluck-pad") return padBody(width, thickness);
  if (style === "instrument-rail") {
    const face = Math.max(8, thickness * 0.62);
    return topAnchored(width, face + Math.max(5, face * 0.8));
  }
  if (style === "metal-rail") return topAnchored(width, Math.max(3, thickness));
  if (style === "instrument-wire") {
    const extent = Math.max(12, thickness * 0.9) * 0.5 + 4.6;
    return topAnchored(width, extent * 2);
  }
  if (style === "tube-cylinder" || style === "boomwhacker-tube") {
    return topAnchored(width, Math.max(24, thickness));
  }
  if (style === "flute-pipe") return topAnchored(width, Math.max(16, thickness * 0.84));
  return { width, thickness, centerInset: 0 };
}

export function instrumentVisualFootprint(platform: MarblePlatform): InstrumentVisualFootprint {
  const width = platform.visualWidth ?? platform.width;
  const thickness = platform.visualThickness ?? platform.thickness;
  if (platform.visualCompact) {
    const shallowDepth = Math.max(3, thickness + Math.max(1.2, thickness * 0.3));
    if (platform.visualStyle === "gong-disc") return topAnchored(width, Math.max(shallowDepth, width * 0.84));
    if (platform.visualStyle === "instrument-cymbal") return topAnchored(width, Math.max(shallowDepth, Math.max(1.2, thickness * 0.5) * 2.5 + 0.8));
    if (platform.visualStyle === "drum-disc") {
      const faceRx = Math.max(3.5, width * 0.44);
      const faceRy = Math.max(1.2, Math.min(faceRx * 0.34, thickness * 0.5));
      return topAnchored(Math.max(width, faceRx * 2), faceRy * 2 + Math.max(1.2, faceRy));
    }
    return topAnchored(width, shallowDepth);
  }
  return styleFootprint(
    platform.visualStyle,
    width,
    thickness,
  );
}
