import type { MarblePlatform } from "../engine/marblePhysicsTypes";
import { mixHex } from "./marbleCourse";

function roundedPlate(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const right = x + width;
  const bottom = y + height;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(right - radius, y);
  ctx.quadraticCurveTo(right, y, right, y + radius);
  ctx.lineTo(right, bottom - radius);
  ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
  ctx.lineTo(x + radius, bottom);
  ctx.quadraticCurveTo(x, bottom, x, bottom - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** White two-bolt metallophone plate that lights with the struck MIDI note. */
export function drawMetallophonePlate2D(
  ctx: CanvasRenderingContext2D,
  half: number,
  platform: MarblePlatform,
  impact: number,
  lowPower: boolean,
) {
  const height = Math.max(platform.thickness < 9 ? 7 : 14, platform.thickness);
  const active = impact > 0.035;
  const activeColor = mixHex("#f4f3ee", platform.color, Math.min(0.94, impact * 1.08));
  const mountY = height * 1.55;

  ctx.save();
  ctx.strokeStyle = "#242831";
  ctx.lineWidth = Math.max(2.2, height * 0.15);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-half * 0.32, height * 0.45);
  ctx.lineTo(-half * 0.32, mountY);
  ctx.lineTo(half * 0.28, mountY);
  ctx.stroke();
  ctx.fillStyle = "#161920";
  ctx.beginPath();
  ctx.arc(half * 0.28, mountY, Math.max(3, height * 0.2), 0, Math.PI * 2);
  ctx.fill();

  if (active && !lowPower) {
    ctx.shadowColor = platform.color;
    ctx.shadowBlur = 18 + impact * 24;
  }
  ctx.fillStyle = active ? activeColor : "#f4f3ee";
  roundedPlate(ctx, -half, 0, platform.width, height, Math.min(4, height * 0.22));
  ctx.fill();
  ctx.shadowBlur = 0;

  const sheen = ctx.createLinearGradient(0, 0, 0, height);
  sheen.addColorStop(0, "rgba(255,255,255,.82)");
  sheen.addColorStop(0.42, active ? `${platform.color}38` : "rgba(255,255,255,.12)");
  sheen.addColorStop(1, "rgba(22,28,38,.2)");
  ctx.fillStyle = sheen;
  roundedPlate(ctx, -half, 0, platform.width, height, Math.min(4, height * 0.22));
  ctx.fill();
  ctx.strokeStyle = active ? mixHex(platform.color, "#ffffff", 0.62) : "rgba(42,46,54,.72)";
  ctx.lineWidth = active ? 1.8 : 1.05;
  ctx.stroke();

  for (const x of [-half * 0.32, half * 0.32]) {
    ctx.fillStyle = "#292d34";
    ctx.beginPath();
    ctx.arc(x, height * 0.52, Math.max(2, height * 0.13), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.beginPath();
    ctx.arc(x - 0.6, height * 0.52 - 0.6, Math.max(0.55, height * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
