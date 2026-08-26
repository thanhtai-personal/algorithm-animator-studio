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
  compact = false,
): InstrumentSurfaceAlignment2D | null {
  if (style === "tube-cylinder" || style === "boomwhacker-tube") {
    return centeredBody((compact ? thickness : Math.max(24, thickness)) * 0.5);
  }
  if (style === "gong-disc") return centeredBody(compact ? width * 0.42 : Math.max(28, width * 0.42));
  if (style === "flute-pipe") return centeredBody(compact ? thickness * 0.42 : Math.max(8, thickness * 0.42));
  if (style === "instrument-cymbal") {
    const radiusY = compact ? Math.max(1.2, thickness * 0.5) : Math.max(8, thickness * 0.62);
    return centeredBody(radiusY, compact ? radiusY * 1.5 : radiusY * 3.3 + 3);
  }
  if (style === "instrument-wire") {
    const railGap = compact ? thickness * 0.6 : Math.max(12, thickness * 0.9);
    // The quadratic wire reaches half of its 7px control-point bend; include
    // half the stroke so the sphere touches the visible wire, not its centerline.
    const extent = railGap * 0.5 + (compact ? 0.5 : 3.5) + (compact ? 0.6 : 1.1);
    return centeredBody(extent);
  }
  return null;
}
