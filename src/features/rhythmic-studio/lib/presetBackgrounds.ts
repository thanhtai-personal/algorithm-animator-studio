import type { StudioSettings } from "../types";

function drawTubeBoardDark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#73747d");
  bg.addColorStop(0.42, "#545760");
  bg.addColorStop(1, "#343740");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  const key = ctx.createRadialGradient(width * 0.72, height * 0.18, 18, width * 0.58, height * 0.34, height * 0.72);
  key.addColorStop(0, "rgba(255,255,255,.24)");
  key.addColorStop(0.34, "rgba(184,192,220,.10)");
  key.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, width, height);
  const vignette = ctx.createRadialGradient(width * 0.5, height * 0.45, height * 0.2, width * 0.5, height * 0.45, height * 0.82);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(13,15,22,.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawCometVoid(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  ctx.fillStyle = "#010105";
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.34, 12, width * 0.5, height * 0.42, height * 0.64);
  glow.addColorStop(0, `${settings.prismEnd}13`);
  glow.addColorStop(0.42, `${settings.prismStart}0b`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawInstrumentRoom(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  const floor = ctx.createLinearGradient(0, 0, width, height);
  floor.addColorStop(0, "#e5ddd3");
  floor.addColorStop(0.42, "#d6d0c8");
  floor.addColorStop(1, "#aeb4c0");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, width, height);

  const warm = ctx.createRadialGradient(width * 0.18, height * 0.12, 15, width * 0.24, height * 0.28, height * 0.66);
  warm.addColorStop(0, "rgba(255,226,175,.42)");
  warm.addColorStop(0.48, "rgba(255,226,175,.12)");
  warm.addColorStop(1, "rgba(255,226,175,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);

  const cool = ctx.createRadialGradient(width * 0.86, height * 0.7, 16, width * 0.68, height * 0.6, height * 0.64);
  cool.addColorStop(0, `${settings.prismStart}20`);
  cool.addColorStop(0.42, `${settings.prismEnd}0e`);
  cool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width * 0.52, height * 0.44, height * 0.22, width * 0.5, height * 0.5, height * 0.9);
  vignette.addColorStop(0, "rgba(255,255,255,.04)");
  vignette.addColorStop(1, "rgba(58,62,72,.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
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
  if (settings.backgroundPreset === "instrument-room" || settings.backgroundPreset === "xylophone-room") {
    drawInstrumentRoom(ctx, width, height, settings);
    return true;
  }
  return false;
}
