import type { StudioSettings } from "../types";
import { mixHex } from "./marbleCourse";

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number, fit: StudioSettings["backgroundImageFit"]) {
  const scale = fit === "contain" ? Math.min(width / image.width, height / image.height) : Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawNeonGrid(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, pulse: number, timeMs: number) {
  const centerX = width / 2 + Math.sin(timeMs / 2800) * 46 * settings.backgroundMotion;
  const glow = ctx.createRadialGradient(centerX, height * 0.38, 20, width / 2, height * 0.48, height * 0.78);
  glow.addColorStop(0, mixHex(settings.backgroundColor, settings.prismStart, 0.12 + pulse * 0.08));
  glow.addColorStop(0.52, mixHex(settings.backgroundColor, settings.prismEnd, 0.035));
  glow.addColorStop(1, settings.backgroundColor);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = settings.shellColor;
  const drift = (timeMs * 0.012 * settings.backgroundMotion) % 54;
  for (let x = -54; x < width + 54; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = -54 + drift; y < height + 54; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.restore();
}

function drawAurora(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, pulse: number, timeMs: number) {
  ctx.fillStyle = mixHex(settings.backgroundColor, "#030715", 0.42);
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let band = 0; band < 4; band += 1) {
    const x = width * (0.15 + band * 0.24) + Math.sin(timeMs / (1700 + band * 320) + band) * 90 * settings.backgroundMotion;
    const y = height * (0.18 + band * 0.16);
    const radius = height * (0.34 + band * 0.04);
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
    gradient.addColorStop(0, `${band % 2 ? settings.prismEnd : settings.prismStart}${Math.round((0.18 + pulse * 0.05) * 255).toString(16).padStart(2, "0")}`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawStarfield(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, timeMs: number, deep = false) {
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, deep ? "#02020b" : mixHex(settings.backgroundColor, "#101336", 0.35));
  background.addColorStop(1, "#020308");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  const drift = timeMs * 0.018 * settings.backgroundMotion;
  for (let i = 0; i < 92; i += 1) {
    const seedX = (i * 173.3 + 41) % width;
    const speed = 0.16 + (i % 7) * 0.045;
    const y = ((i * 97.1 + drift * speed) % (height + 40)) - 20;
    const twinkle = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(timeMs / 620 + i * 1.7));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 5 === 0 ? settings.prismEnd : "#ffffff";
    ctx.beginPath(); ctx.arc(seedX, y, 0.7 + (i % 4) * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSunset(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, timeMs: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#120a32"); sky.addColorStop(0.46, "#5b1a62"); sky.addColorStop(0.72, "#d55a70"); sky.addColorStop(1, "#101026");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  const sunY = height * 0.35 + Math.sin(timeMs / 3200) * 8 * settings.backgroundMotion;
  const sun = ctx.createRadialGradient(width / 2, sunY, 5, width / 2, sunY, 180);
  sun.addColorStop(0, "rgba(255,224,150,.78)"); sun.addColorStop(1, "rgba(255,110,130,0)");
  ctx.fillStyle = sun; ctx.fillRect(0, 0, width, height);
}

function drawSpotlight(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, pulse: number, timeMs: number) {
  ctx.fillStyle = "#040407"; ctx.fillRect(0, 0, width, height);
  const x = width / 2 + Math.sin(timeMs / 2400) * 120 * settings.backgroundMotion;
  const light = ctx.createRadialGradient(x, height * 0.22, 12, x, height * 0.38, height * 0.78);
  light.addColorStop(0, `${settings.prismStart}${Math.round((0.28 + pulse * 0.08) * 255).toString(16).padStart(2, "0")}`);
  light.addColorStop(0.5, `${settings.prismEnd}18`); light.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = light; ctx.fillRect(0, 0, width, height);
}

export function drawRhythmicBackground(ctx: CanvasRenderingContext2D, width: number, height: number, settings: StudioSettings, pulse: number, timeMs: number, image?: HTMLImageElement | null) {
  if (image?.complete && image.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = settings.backgroundImageOpacity;
    ctx.filter = settings.backgroundImageBlur > 0 ? `blur(${settings.backgroundImageBlur}px)` : "none";
    drawImageCover(ctx, image, width, height, settings.backgroundImageFit);
    ctx.restore();
    const tint = ctx.createLinearGradient(0, 0, 0, height);
    tint.addColorStop(0, "rgba(3,4,12,.14)"); tint.addColorStop(1, "rgba(2,3,8,.58)");
    ctx.fillStyle = tint; ctx.fillRect(0, 0, width, height);
  } else if (settings.backgroundPreset === "aurora") drawAurora(ctx, width, height, settings, pulse, timeMs);
  else if (settings.backgroundPreset === "starfield") drawStarfield(ctx, width, height, settings, timeMs);
  else if (settings.backgroundPreset === "deep-space") drawStarfield(ctx, width, height, settings, timeMs, true);
  else if (settings.backgroundPreset === "sunset") drawSunset(ctx, width, height, settings, timeMs);
  else if (settings.backgroundPreset === "spotlight") drawSpotlight(ctx, width, height, settings, pulse, timeMs);
  else drawNeonGrid(ctx, width, height, settings, pulse, timeMs);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)"); vignette.addColorStop(1, "rgba(0,0,0,.56)");
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
}
