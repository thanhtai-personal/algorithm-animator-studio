import type { PlatformStyle } from "../types";
import { drumGeometry2D } from "./drumRenderer2D";
import { instrumentSurfaceAlignment2D } from "./instrumentPlayingGeometry2D";

type Point2D = { x: number; y: number };
type Point3D = Point2D & { z: number };

interface InstrumentShadowInput {
  width: number;
  thickness: number;
  tiltRad: number;
  style: PlatformStyle;
  compact?: boolean;
}

export interface InstrumentShadowGeometry2D {
  contactY: number;
  nearLeft: Point2D;
  nearRight: Point2D;
  farLeft: Point2D;
  farRight: Point2D;
  nearWidth: number;
  farWidth: number;
}

export function projectPointToShadowPlane(point: Point3D, receiverZ: number, lightOffset: Point3D): Point3D {
  const receiverDepth = Math.max(0, point.z - receiverZ);
  if (receiverDepth === 0) return { ...point };
  const depthScale = receiverDepth / Math.max(0.001, Math.abs(lightOffset.z));
  return {
    x: point.x - lightOffset.x * depthScale,
    y: point.y - lightOffset.y * depthScale,
    z: receiverZ,
  };
}

function instrumentFoot(style: PlatformStyle, width: number, thickness: number, compact = false) {
  if (style === "gong-disc") {
    const radius = compact ? width * 0.42 : Math.max(28, width * 0.42);
    return { contactY: instrumentSurfaceAlignment2D(style, width, thickness, compact)!.footY, nearWidth: radius * 0.22, flared: true };
  }
  if (style === "drum-disc") {
    const drum = drumGeometry2D(width, thickness, compact);
    return {
      contactY: drum.shellDepth + drum.faceRy * 2,
      nearWidth: drum.faceRx * 1.3,
      flared: false,
    };
  }
  if (style === "instrument-cymbal") {
    return { contactY: instrumentSurfaceAlignment2D(style, width, thickness, compact)!.footY, nearWidth: compact ? 1.6 : 7, flared: true };
  }
  if (style === "flute-pipe") {
    return { contactY: instrumentSurfaceAlignment2D(style, width, thickness, compact)!.footY, nearWidth: width * 0.76, flared: false };
  }
  if (style === "tube-cylinder" || style === "boomwhacker-tube") {
    return { contactY: instrumentSurfaceAlignment2D(style, width, thickness, compact)!.footY, nearWidth: width * 0.8, flared: false };
  }
  if (style === "comet-pad") {
    const height = Math.max(12, thickness);
    return { contactY: height * 0.78, nearWidth: width * 0.76, flared: false };
  }
  if (style === "instrument-wire") {
    return { contactY: instrumentSurfaceAlignment2D(style, width, thickness, compact)!.footY, nearWidth: width * 0.7, flared: false };
  }
  if (["instrument-key", "xylophone-key", "xylophone-bar", "piano-key", "marimba-bar", "vibraphone-bar", "metallophone-plate"].includes(style)) {
    const height = compact ? Math.max(2.4, thickness) : Math.max(thickness < 9 ? 6 : 13, thickness);
    return { contactY: height + (compact ? Math.max(1.2, height * 0.3) : Math.max(8, height * 0.55)), nearWidth: width * 0.74, flared: false };
  }
  if (style === "instrument-pad" || style === "pluck-pad") {
    const height = compact ? Math.max(2.4, thickness) : Math.max(thickness < 9 ? 6.5 : 14, thickness);
    return { contactY: height + (compact ? Math.max(1.2, height * 0.3) : Math.max(8, height * 0.5)), nearWidth: width * 0.72, flared: false };
  }
  if (style === "instrument-rail") {
    const height = compact ? Math.max(2.4, thickness) : Math.max(8, thickness * 0.62);
    return { contactY: height + (compact ? Math.max(1.2, height * 0.3) : Math.max(5, height * 0.8)), nearWidth: width * 0.76, flared: false };
  }
  return { contactY: Math.max(6, thickness), nearWidth: width * 0.78, flared: false };
}

export function instrumentShadowGeometry2D(input: InstrumentShadowInput): InstrumentShadowGeometry2D {
  const foot = instrumentFoot(input.style, input.width, input.thickness, input.compact);
  const screenDirection = { x: 0.62, y: 1 };
  const directionLength = Math.hypot(screenDirection.x, screenDirection.y);
  const screenX = screenDirection.x / directionLength;
  const screenY = screenDirection.y / directionLength;
  const cos = Math.cos(input.tiltRad);
  const sin = Math.sin(input.tiltRad);
  const localX = cos * screenX + sin * screenY;
  const localY = -sin * screenX + cos * screenY;
  const shadowLength = Math.min(74, Math.max(24, input.width * 0.3 + input.thickness * 0.48));
  const nearWidth = Math.max(5, foot.nearWidth);
  const farWidth = foot.flared
    ? Math.max(nearWidth + input.thickness * 0.7, input.width * 0.28)
    : Math.max(8, nearWidth * 0.68);
  const farCenter = {
    x: localX * shadowLength,
    y: foot.contactY + localY * shadowLength,
  };
  const perpendicular = { x: -localY, y: localX };
  return {
    contactY: foot.contactY,
    nearLeft: { x: -nearWidth * 0.5, y: foot.contactY },
    nearRight: { x: nearWidth * 0.5, y: foot.contactY },
    farLeft: {
      x: farCenter.x + perpendicular.x * farWidth * 0.5,
      y: farCenter.y + perpendicular.y * farWidth * 0.5,
    },
    farRight: {
      x: farCenter.x - perpendicular.x * farWidth * 0.5,
      y: farCenter.y - perpendicular.y * farWidth * 0.5,
    },
    nearWidth,
    farWidth,
  };
}

export function drawInstrumentShadow2D(
  ctx: CanvasRenderingContext2D,
  input: InstrumentShadowInput,
  lowPower: boolean,
) {
  const shadow = instrumentShadowGeometry2D(input);
  const nearX = (shadow.nearLeft.x + shadow.nearRight.x) * 0.5;
  const farX = (shadow.farLeft.x + shadow.farRight.x) * 0.5;
  const farY = (shadow.farLeft.y + shadow.farRight.y) * 0.5;
  const gradient = ctx.createLinearGradient(nearX, shadow.contactY, farX, farY);
  gradient.addColorStop(0, lowPower ? "rgba(3,7,12,.3)" : "rgba(3,7,12,.42)");
  gradient.addColorStop(0.58, lowPower ? "rgba(3,7,12,.14)" : "rgba(3,7,12,.23)");
  gradient.addColorStop(1, "rgba(3,7,12,0)");

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(shadow.nearLeft.x, shadow.nearLeft.y);
  ctx.lineTo(shadow.nearRight.x, shadow.nearRight.y);
  ctx.quadraticCurveTo(shadow.farRight.x, shadow.nearRight.y, shadow.farRight.x, shadow.farRight.y);
  ctx.lineTo(shadow.farLeft.x, shadow.farLeft.y);
  ctx.quadraticCurveTo(shadow.nearLeft.x, shadow.farLeft.y, shadow.nearLeft.x, shadow.nearLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
