import type { PlatformStyle } from "../types";

export interface InstrumentSurfaceAlignment2D {
  sourceTopY: number;
  sourceBottomY: number;
  translateY: number;
  footY: number;
}

function centeredBody(radius: number, localBottom = radius): InstrumentSurfaceAlignment2D {
  return {
    sourceTopY: -radius,
    sourceBottomY: localBottom,
    translateY: radius,
    footY: localBottom + radius,
  };
}

/** Align centered/circular drawings so y=0 is always their upper playable tangent. */
export function instrumentSurfaceAlignment2D(
  style: PlatformStyle,
  width: number,
  thickness: number,
): InstrumentSurfaceAlignment2D | null {
  if (style === "tube-cylinder" || style === "boomwhacker-tube") {
    return centeredBody(Math.max(24, thickness) * 0.5);
  }
  if (style === "gong-disc") return centeredBody(Math.max(28, width * 0.42));
  if (style === "flute-pipe") return centeredBody(Math.max(8, thickness * 0.42));
  if (style === "instrument-cymbal") {
    const radiusY = Math.max(8, thickness * 0.62);
    return centeredBody(radiusY, radiusY * 3.3 + 3);
  }
  if (style === "instrument-wire") {
    const railGap = Math.max(12, thickness * 0.9);
    // The quadratic wire reaches half of its 7px control-point bend; include
    // half the stroke so the sphere touches the visible wire, not its centerline.
    const extent = railGap * 0.5 + 3.5 + 1.1;
    return centeredBody(extent);
  }
  return null;
}
