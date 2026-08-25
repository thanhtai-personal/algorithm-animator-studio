import { getSprite } from "@/lib/animalColumns";
import type { StudioSettings } from "../types";
import type { MarblePoint } from "./marbleCourse";
import { marbleAvatarEntry } from "./marbleAvatars";
import type { MarbleAvatarMotion2D } from "./marbleAvatarMotion2D";

export function drawMarbleAvatar2D(
  ctx: CanvasRenderingContext2D,
  point: MarblePoint,
  cameraY: number,
  pulse: number,
  settings: StudioSettings,
  motion: MarbleAvatarMotion2D,
) {
  const entry = marbleAvatarEntry(settings.marbleAvatar);
  if (!entry) return false;
  const sprite = getSprite(entry);
  if (!sprite) return false;

  // The pose is selected from the current physical flight rather than global
  // song time, so seeking and export use the same takeoff/apex/landing frame.
  sprite.resetAction(motion.action);
  sprite.update(motion.frameIndex * 90);
  const scale = 1 + Math.max(0, pulse) * 0.08;
  const height = settings.ballSize * 2.9 * scale;
  const width = height * 0.92;
  const groundOffset = settings.ballSize * 0.84;

  ctx.save();
  ctx.translate(point.x, point.y - cameraY + groundOffset);
  ctx.rotate(motion.angleRad);
  ctx.scale(motion.facing * motion.scaleX, motion.scaleY);
  ctx.shadowColor = "rgba(5, 10, 20, 0.3)";
  ctx.shadowBlur = settings.ballSize * 0.42;
  ctx.shadowOffsetY = settings.ballSize * 0.16;
  const drawn = sprite.draw(ctx, -width / 2, -height, { width, height });
  ctx.restore();
  return drawn;
}
