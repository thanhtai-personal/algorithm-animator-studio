import type { StudioSettings } from "../types";

function drawTubeBoardDark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#777984");
  bg.addColorStop(0.45, "#555861");
  bg.addColorStop(1, "#3f424b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const light = ctx.createRadialGradient(width * 0.72, height * 0.22, 20, width * 0.58, height * 0.38, height * 0.78);
  light.addColorStop(0, "rgba(255,255,255,.20)");
  light.addColorStop(0.46, "rgba(155,168,203,.08)");
  light.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
}


function drawCometVoid(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  ctx.fillStyle = "#020208";
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.48, height * 0.34, 10, width * 0.5, height * 0.42, height * 0.58);
  glow.addColorStop(0, `${settings.prismEnd}18`);
  glow.addColorStop(0.48, `${settings.prismStart}0c`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawXylophoneRoom(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  const wall = ctx.createLinearGradient(0, 0, width, height);
  wall.addColorStop(0, "#d9d1c4");
  wall.addColorStop(0.4, "#d8d5d0");
  wall.addColorStop(1, "#aeb5ca");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.42, height * 0.48, 20, width * 0.5, height * 0.55, height * 0.52);
  glow.addColorStop(0, `${settings.prismEnd}20`);
  glow.addColorStop(0.5, `${settings.prismStart}12`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const horizon = height * 0.34;
  ctx.save();
  ctx.shadowColor = "rgba(25,32,50,.24)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(236,229,218,.94)";
  ctx.beginPath();
  ctx.moveTo(width * 0.28, horizon);
  ctx.lineTo(width * 0.76, horizon);
  ctx.lineTo(width * 0.96, height);
  ctx.lineTo(width * 0.02, height);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(55,66,91,.62)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

export function drawPresetBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: StudioSettings,
) {
  if (settings.backgroundPreset === "tube-board-dark") {
    drawTubeBoardDark(ctx, width, height);
    return true;
  }
  if (settings.backgroundPreset === "comet-void") {
    drawCometVoid(ctx, width, height, settings);
    return true;
  }
  if (settings.backgroundPreset === "xylophone-room") {
    drawXylophoneRoom(ctx, width, height, settings);
    return true;
  }
  return false;
}
