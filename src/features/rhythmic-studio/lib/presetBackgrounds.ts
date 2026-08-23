import type { StudioSettings } from "../types";

function fillRoom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wallTop: string,
  wallBottom: string,
  floorNear: string,
  floorFar: string,
) {
  const wall = ctx.createLinearGradient(0, 0, 0, height * 0.62);
  wall.addColorStop(0, wallTop);
  wall.addColorStop(1, wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, height * 0.62);

  const horizonY = height * 0.56;
  const floor = ctx.createLinearGradient(0, horizonY, 0, height);
  floor.addColorStop(0, floorFar);
  floor.addColorStop(1, floorNear);
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.lineTo(width * 0.72, horizonY);
  ctx.lineTo(width * 0.28, horizonY);
  ctx.closePath();
  ctx.fill();
  return horizonY;
}

function drawTubeBoardDark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const horizonY = fillRoom(ctx, width, height, "#7b7d89", "#515562", "#50453b", "#6c5c4d");

  const leftLight = ctx.createRadialGradient(width * 0.16, height * 0.18, 10, width * 0.18, height * 0.2, height * 0.46);
  leftLight.addColorStop(0, "rgba(112,147,240,.18)");
  leftLight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = leftLight;
  ctx.fillRect(0, 0, width, height);

  const panelX = width * 0.16;
  const panelY = height * 0.1;
  const panelW = width * 0.68;
  const panelH = height * 0.58;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.22)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "rgba(74,78,88,.95)";
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 18);
  ctx.stroke();

  for (let i = 0; i < 4; i += 1) {
    const x = panelX + 44 + i * (panelW - 88) / 3;
    const rail = ctx.createLinearGradient(x, panelY, x + 22, panelY + panelH);
    rail.addColorStop(0, "rgba(255,255,255,.22)");
    rail.addColorStop(0.18, "rgba(190,210,240,.16)");
    rail.addColorStop(0.54, "rgba(105,125,160,.08)");
    rail.addColorStop(1, "rgba(28,34,46,.55)");
    ctx.fillStyle = rail;
    ctx.beginPath();
    ctx.roundRect(x - 12, panelY + 18, 24, panelH - 36, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.stroke();
  }

  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = panelX + 42 + col * ((panelW - 84) / 6);
      const y = panelY + 44 + row * ((panelH - 88) / 3);
      ctx.fillStyle = "rgba(24,28,36,.32)";
      ctx.beginPath(); ctx.arc(x + 2, y + 2, 5.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.13)";
      ctx.beginPath(); ctx.arc(x, y, 5.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizonY);
    ctx.lineTo(width * (0.08 + i * 0.14), height);
    ctx.stroke();
  }
}

function drawCometVoid(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  ctx.fillStyle = "#010105";
  ctx.fillRect(0, 0, width, height);

  const core = ctx.createRadialGradient(width * 0.5, height * 0.38, 2, width * 0.5, height * 0.42, height * 0.65);
  core.addColorStop(0, `${settings.prismEnd}24`);
  core.addColorStop(0.3, `${settings.prismStart}12`);
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 7; i += 1) {
    const rx = 72 + i * 58;
    const ry = 46 + i * 36;
    ctx.strokeStyle = i % 2 ? `${settings.prismStart}${i < 3 ? "40" : "18"}` : `${settings.prismEnd}${i < 3 ? "32" : "14"}`;
    ctx.lineWidth = i === 0 ? 2.8 : i < 3 ? 2 : 1.2;
    ctx.beginPath();
    ctx.ellipse(width * 0.5, height * 0.42, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(255,255,255,.06)";
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.42);
    ctx.lineTo(width * (0.14 + i * 0.18), height);
    ctx.stroke();
  }
}

function drawInstrumentRoom(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, xylophone = false) {
  const horizonY = fillRoom(ctx, width, height, xylophone ? "#f4efe7" : "#efe7dc", xylophone ? "#d8dde7" : "#d4d8df", "#a0734f", "#d1b08c");

  const warm = ctx.createRadialGradient(width * 0.16, height * 0.08, 10, width * 0.22, height * 0.2, height * 0.68);
  warm.addColorStop(0, "rgba(255,232,190,.52)");
  warm.addColorStop(0.38, "rgba(255,218,160,.18)");
  warm.addColorStop(1, "rgba(255,226,175,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);

  const cool = ctx.createRadialGradient(width * 0.86, height * 0.22, 14, width * 0.74, height * 0.26, height * 0.72);
  cool.addColorStop(0, `${settings.prismStart}30`);
  cool.addColorStop(0.48, `${settings.prismEnd}10`);
  cool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizonY);
    ctx.lineTo(width * (0.06 + i * 0.145), height);
    ctx.stroke();
  }

  const shelfY = height * 0.18;
  ctx.fillStyle = "rgba(176,137,102,.86)";
  ctx.fillRect(width * 0.2, shelfY, width * 0.6, 8);
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.fillRect(width * 0.2, shelfY, width * 0.6, 2);

  for (let i = 0; i < 4; i += 1) {
    const x = width * (0.25 + i * 0.15);
    ctx.fillStyle = i % 2 ? "rgba(255,202,111,.86)" : "rgba(125,214,255,.82)";
    ctx.beginPath(); ctx.roundRect(x, shelfY - 24, 18, 24, 4); ctx.fill();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.roundRect(width * 0.24, height * 0.26, width * 0.52, height * 0.28, 22);
  ctx.fill();
  ctx.restore();

  if (xylophone) {
    const colors = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6"];
    colors.forEach((color, index) => {
      const x = width * 0.24 + index * (width * 0.09);
      const y = height * 0.48 - index * 4;
      ctx.fillStyle = "rgba(65,46,31,.32)";
      ctx.fillRect(x + 5, y + 24, width * 0.11, 8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, width * 0.11, 22, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.34)";
      ctx.fillRect(x + 6, y + 4, width * 0.07, 4);
    });
  } else {
    const instrumentX = width * 0.3;
    const instrumentY = height * 0.5;
    ctx.fillStyle = "rgba(45,52,72,.22)";
    ctx.fillRect(instrumentX + 12, instrumentY + 28, width * 0.32, 12);
    ctx.fillStyle = "#f5d890";
    ctx.beginPath();
    ctx.roundRect(instrumentX, instrumentY, width * 0.34, 26, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.46)";
    ctx.fillRect(instrumentX + 12, instrumentY + 4, width * 0.18, 5);
    ctx.strokeStyle = "rgba(120,86,50,.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(width * 0.72, height * 0.42, width * 0.09, height * 0.03, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.72, height * 0.42);
    ctx.lineTo(width * 0.72, height * 0.6);
    ctx.stroke();
  }
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
  if (settings.backgroundPreset === "instrument-room") {
    drawInstrumentRoom(ctx, width, height, settings, false);
    return true;
  }
  if (settings.backgroundPreset === "xylophone-room") {
    drawInstrumentRoom(ctx, width, height, settings, true);
    return true;
  }
  return false;
}
