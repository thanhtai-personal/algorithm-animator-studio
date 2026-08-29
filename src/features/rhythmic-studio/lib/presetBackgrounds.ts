import type { StudioSettings } from "../types";
import { drawBrickWallBackground2D } from "./brickWallBackground2D";

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
  const horizonY = fillRoom(
    ctx,
    width,
    height,
    xylophone ? "#f5f0e7" : "#efe6d9",
    xylophone ? "#d9dfe7" : "#d6dbe1",
    xylophone ? "#9f724e" : "#9a6d49",
    xylophone ? "#d9bc98" : "#ceb18f",
  );

  const warm = ctx.createRadialGradient(width * 0.18, height * 0.1, 8, width * 0.22, height * 0.18, height * 0.62);
  warm.addColorStop(0, "rgba(255,235,198,.52)");
  warm.addColorStop(0.42, "rgba(255,220,168,.18)");
  warm.addColorStop(1, "rgba(255,228,175,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, width, height);

  const cool = ctx.createRadialGradient(width * 0.82, height * 0.2, 14, width * 0.72, height * 0.26, height * 0.64);
  cool.addColorStop(0, `${settings.prismStart}28`);
  cool.addColorStop(0.45, `${settings.prismEnd}10`);
  cool.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, width, height);

  const wallPanelY = height * 0.16;
  const wallPanelH = height * 0.34;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.12)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.roundRect(width * 0.2, wallPanelY, width * 0.6, wallPanelH, 22);
  ctx.fill();
  ctx.restore();

  [0.24, 0.76].forEach((ratio, index) => {
    const x = width * ratio;
    const panel = ctx.createLinearGradient(x, 0, x + width * 0.08, 0);
    panel.addColorStop(0, "rgba(255,255,255,.12)");
    panel.addColorStop(0.5, index === 0 ? "rgba(255,211,160,.18)" : "rgba(155,215,255,.14)");
    panel.addColorStop(1, "rgba(60,48,38,.08)");
    ctx.fillStyle = panel;
    ctx.beginPath();
    ctx.roundRect(x - width * 0.04, height * 0.18, width * 0.08, height * 0.27, 12);
    ctx.fill();
  });

  const shelfY = height * 0.2;
  ctx.fillStyle = "rgba(170,132,96,.92)";
  ctx.fillRect(width * 0.26, shelfY, width * 0.48, 6);
  ctx.fillStyle = "rgba(255,255,255,.3)";
  ctx.fillRect(width * 0.26, shelfY, width * 0.48, 2);
  for (let i = 0; i < 5; i += 1) {
    const x = width * (0.3 + i * 0.09);
    ctx.fillStyle = i % 2 ? "rgba(255,197,102,.84)" : "rgba(122,204,255,.8)";
    ctx.beginPath();
    ctx.roundRect(x, shelfY - 18 - (i % 2 ? 0 : 2), 12, 18 + (i % 3) * 4, 4);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizonY);
    ctx.lineTo(width * (0.12 + i * 0.15), height);
    ctx.stroke();
  }

  const deckY = height * 0.74;
  ctx.fillStyle = "rgba(83,59,39,.22)";
  ctx.beginPath();
  ctx.moveTo(width * 0.2 + 8, deckY + 12);
  ctx.lineTo(width * 0.8 + 8, deckY + 12);
  ctx.lineTo(width * 0.68 + 8, horizonY + 28);
  ctx.lineTo(width * 0.32 + 8, horizonY + 28);
  ctx.closePath();
  ctx.fill();

  const floor = ctx.createLinearGradient(0, horizonY, 0, deckY);
  floor.addColorStop(0, xylophone ? "#d4b08b" : "#ceb18e");
  floor.addColorStop(1, xylophone ? "#a27149" : "#96633d");
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.moveTo(width * 0.18, deckY);
  ctx.lineTo(width * 0.82, deckY);
  ctx.lineTo(width * 0.68, horizonY + 22);
  ctx.lineTo(width * 0.32, horizonY + 22);
  ctx.closePath();
  ctx.fill();

  if (xylophone) {
    const colors = ["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6"];
    ctx.strokeStyle = "rgba(161,122,82,.78)";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(width * 0.26, height * 0.66);
    ctx.lineTo(width * 0.62, height * 0.58);
    ctx.moveTo(width * 0.3, height * 0.7);
    ctx.lineTo(width * 0.66, height * 0.62);
    ctx.stroke();
    colors.forEach((color, index) => {
      const keyWidth = width * 0.114 - index * 2.4;
      const x = width * 0.2 + index * (width * 0.084);
      const y = height * 0.54 - index * 5;
      ctx.fillStyle = "rgba(72,50,34,.24)";
      ctx.fillRect(x + 7, y + 21, keyWidth - 10, 6);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, keyWidth, 20, 8);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.28)";
      ctx.fillRect(x + 8, y + 4, keyWidth * 0.58, 4);
    });
    ctx.strokeStyle = "rgba(131,144,160,.72)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(width * 0.73, height * 0.44, width * 0.072, height * 0.02, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.73, height * 0.445);
    ctx.lineTo(width * 0.73, height * 0.62);
    ctx.stroke();
  } else {
    const instrumentX = width * 0.26;
    const instrumentY = height * 0.53;
    ctx.fillStyle = "rgba(55,60,72,.18)";
    ctx.fillRect(instrumentX + 12, instrumentY + 28, width * 0.36, 12);
    ctx.fillStyle = "#f3d484";
    ctx.beginPath();
    ctx.roundRect(instrumentX, instrumentY, width * 0.38, 24, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.fillRect(instrumentX + 12, instrumentY + 4, width * 0.19, 4);
    ctx.strokeStyle = "rgba(127,91,52,.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(width * 0.7, height * 0.44, width * 0.085, height * 0.025, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 0.7, height * 0.44);
    ctx.lineTo(width * 0.7, height * 0.62);
    ctx.stroke();
    ctx.fillStyle = "#3b414a";
    ctx.beginPath();
    ctx.roundRect(width * 0.58, height * 0.56, width * 0.09, 0.03 * height, 8);
    ctx.fill();
  }
}

function drawVelvetStage(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, pulse = 0) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#1b0711");
  gradient.addColorStop(0.48, settings.backgroundColor);
  gradient.addColorStop(1, "#090205");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  const stripeWidth = Math.max(28, width * 0.08);
  for (let x = -stripeWidth / 2; x < width + stripeWidth; x += stripeWidth * 1.4) {
    ctx.fillRect(x, 0, stripeWidth * 0.2, height * 0.82);
  }
  const spotlight = ctx.createRadialGradient(width * 0.5, height * 0.06, 8, width * 0.5, height * 0.3, height * 0.66);
  spotlight.addColorStop(0, `rgba(255,236,175,${0.5 + pulse * 0.08})`);
  spotlight.addColorStop(0.28, "rgba(255,197,93,.18)");
  spotlight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,186,71,.2)";
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height);
  ctx.lineTo(width * 0.2, height * 0.76);
  ctx.lineTo(width * 0.8, height * 0.76);
  ctx.lineTo(width * 0.9, height);
  ctx.closePath();
  ctx.fill();
}

function drawSunrisePanels(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#f8e2c8");
  gradient.addColorStop(0.58, settings.backgroundColor);
  gradient.addColorStop(1, "#67455b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,.2)";
  const panelInset = width * 0.16;
  const panelWidth = width - panelInset * 2;
  ctx.fillRect(panelInset, height * 0.14, panelWidth, height * 0.52);
  ctx.strokeStyle = "rgba(96,58,47,.22)";
  ctx.lineWidth = Math.max(1, width * 0.0025);
  for (let i = 1; i < 5; i += 1) {
    const x = panelInset + panelWidth * (i / 5);
    ctx.beginPath();
    ctx.moveTo(x, height * 0.14);
    ctx.lineTo(x, height * 0.66);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.1, 10, width * 0.5, height * 0.28, width * 0.42);
  glow.addColorStop(0, "rgba(255,246,220,.55)");
  glow.addColorStop(0.45, "rgba(255,212,142,.22)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#875c43";
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width * 0.25, height * 0.72);
  ctx.lineTo(width * 0.75, height * 0.72);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
}

export function drawPresetBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  settings: StudioSettings,
  pulse = 0,
  timeMs = 0,
) {
  if (settings.backgroundPreset === "brick-wall") {
    drawBrickWallBackground2D(ctx, width, height, pulse, timeMs);
    return true;
  }
  if (settings.backgroundPreset === "velvet-stage") {
    drawVelvetStage(ctx, width, height, settings, pulse);
    return true;
  }
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
  if (settings.backgroundPreset === "sunrise-panels") {
    drawSunrisePanels(ctx, width, height, settings);
    return true;
  }
  if (settings.backgroundPreset === "xylophone-room") {
    drawInstrumentRoom(ctx, width, height, settings, true);
    return true;
  }
  return false;
}
