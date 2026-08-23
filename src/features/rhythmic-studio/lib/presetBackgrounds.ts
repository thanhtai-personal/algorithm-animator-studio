import type { StudioSettings } from "../types";

function drawTubeBoardDark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#777986");
  bg.addColorStop(0.34, "#626573");
  bg.addColorStop(0.68, "#50535e");
  bg.addColorStop(1, "#3e414a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const cool = ctx.createRadialGradient(width * 0.18, height * 0.3, 12, width * 0.22, height * 0.38, height * 0.58);
  cool.addColorStop(0, "rgba(87,111,190,.22)");
  cool.addColorStop(0.48, "rgba(79,75,142,.09)");
  cool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  const key = ctx.createRadialGradient(width * 0.84, height * 0.12, 20, width * 0.72, height * 0.26, height * 0.7);
  key.addColorStop(0, "rgba(255,246,230,.28)");
  key.addColorStop(0.36, "rgba(224,222,225,.11)");
  key.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, width, height);

  const lowerShade = ctx.createLinearGradient(0, height * 0.48, 0, height);
  lowerShade.addColorStop(0, "rgba(0,0,0,0)");
  lowerShade.addColorStop(1, "rgba(18,20,28,.28)");
  ctx.fillStyle = lowerShade;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width * 0.54, height * 0.42, height * 0.22, width * 0.5, height * 0.48, height * 0.88);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(13,15,22,.24)");
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
  floor.addColorStop(0, "#ebe5dd");
  floor.addColorStop(0.38, "#ddd7cf");
  floor.addColorStop(0.72, "#cfd1d5");
  floor.addColorStop(1, "#b7bdc8");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, width, height);

  const warm = ctx.createRadialGradient(width * 0.1, height * 0.02, 10, width * 0.2, height * 0.26, height * 0.82);
  warm.addColorStop(0, "rgba(255,231,188,.56)");
  warm.addColorStop(0.42, "rgba(255,220,166,.18)");
  warm.addColorStop(1, "rgba(255,226,175,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);

  const cool = ctx.createRadialGradient(width * 0.94, height * 0.72, 16, width * 0.72, height * 0.62, height * 0.72);
  cool.addColorStop(0, `${settings.prismStart}26`);
  cool.addColorStop(0.44, `${settings.prismEnd}10`);
  cool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  const horizon = ctx.createLinearGradient(0, height * 0.1, 0, height);
  horizon.addColorStop(0, "rgba(255,255,255,.08)");
  horizon.addColorStop(0.58, "rgba(255,255,255,0)");
  horizon.addColorStop(1, "rgba(65,72,88,.11)");
  ctx.fillStyle = horizon;
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
