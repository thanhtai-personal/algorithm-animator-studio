import type { MarblePlatform, MarblePoint } from "../engine/marblePhysicsTypes";
import type { NoteEvent } from "../types";

export interface MarbleAvatarMotion2D {
  action: "idle" | "jump";
  frameIndex: number;
  facing: -1 | 1;
  angleRad: number;
  scaleX: number;
  scaleY: number;
}

export const IDLE_MARBLE_AVATAR_MOTION: MarbleAvatarMotion2D = {
  action: "idle",
  frameIndex: 0,
  facing: 1,
  angleRad: 0,
  scaleX: 1,
  scaleY: 1,
};

function jumpFrame(phase: number) {
  if (phase <= 0.08) return 0;
  if (phase <= 0.28) return 1;
  if (phase <= 0.45) return 2;
  if (phase <= 0.62) return 3;
  if (phase <= 0.88) return 4;
  return 5;
}

function facingAndLean(before: MarblePoint, after: MarblePoint) {
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const facing: -1 | 1 = dx < -0.05 ? -1 : 1;
  const speed = Math.max(1, Math.hypot(dx, dy));
  return {
    facing,
    // The sheets show upright characters. A restrained lean communicates travel
    // direction without incorrectly rotating their feet along the flight tangent.
    angleRad: Math.max(-0.16, Math.min(0.16, (dx / speed) * 0.16)),
  };
}

export function marbleAvatarMotion2D(
  timeMs: number,
  events: NoteEvent[],
  platforms: MarblePlatform[],
  point: MarblePoint,
  before: MarblePoint,
  after: MarblePoint,
): MarbleAvatarMotion2D {
  if (!events.length || !platforms.length) return IDLE_MARBLE_AVATAR_MOTION;
  const direction = facingAndLean(before, after);
  const index = Math.max(0, Math.min(events.length - 1, point.platformIndex));
  const platform = platforms[index];

  if (timeMs < events[0].timeMs) {
    return { action: "jump", frameIndex: 4, ...direction, scaleX: 1, scaleY: 1 };
  }
  if (index >= events.length - 1) {
    const landingAge = timeMs - events[events.length - 1].timeMs;
    return landingAge <= 150
      ? { action: "jump", frameIndex: 5, ...direction, scaleX: 1.08, scaleY: 0.92 }
      : { ...IDLE_MARBLE_AVATAR_MOTION, facing: direction.facing };
  }
  if (platform?.motionMode === "roll" || platform?.motionMode === "hold") {
    return { ...IDLE_MARBLE_AVATAR_MOTION, facing: direction.facing, angleRad: direction.angleRad * 0.35 };
  }

  const span = Math.max(1, events[index + 1].timeMs - events[index].timeMs);
  const phase = Math.max(0, Math.min(1, (timeMs - events[index].timeMs) / span));
  const frameIndex = jumpFrame(phase);
  const compressed = frameIndex === 0 || frameIndex === 5;
  return {
    action: "jump",
    frameIndex,
    ...direction,
    scaleX: compressed ? 1.08 : 1,
    scaleY: compressed ? 0.92 : 1,
  };
}
