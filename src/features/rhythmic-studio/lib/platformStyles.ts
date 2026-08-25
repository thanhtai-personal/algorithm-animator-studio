import type { PlatformMixMode, PlatformStyle, RenderQuality, StudioSettings } from "../types";
import { clamp, hexToRgb, mixHex, type MarblePlatform } from "./marbleCourse";
import { drawPresetPlatform } from "./presetPlatformRenderer";
import { presetObstaclePlan } from "../engine/presetObstaclePlan";
import { instrumentLightAtTime } from "./instrumentLight";
import { instrumentImpactResponseAtTime, instrumentKeyPressAtTime } from "./instrumentResponse";
import { drawInstrumentNoteLeds2D, drawWindMetalPlatform2D } from "./windMetalPlatform2D";
import { isNoteLitInstrumentStyle } from "./instrumentLightsModel";
import { drawInstrumentShadow2D } from "./instrumentShadow";

function hash(index: number, salt = 0) {
  const raw = Math.sin((index + salt) * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

export function resolvePlatformStyle(index: number, settings: StudioSettings): PlatformStyle {
  const planned = presetObstaclePlan(index, settings);
  if (planned) return planned.style;
  const mode: PlatformMixMode = settings.platformMixMode;
  if (mode === "single") return settings.platformPrimaryStyle;
  if (mode === "alternate") return index % 2 ? settings.platformSecondaryStyle : settings.platformPrimaryStyle;
  if (mode === "accent") {
    return index > 0 && index % Math.max(2, settings.platformAccentEvery) === 0
      ? settings.platformAccentStyle
      : (index % 3 === 2 ? settings.platformSecondaryStyle : settings.platformPrimaryStyle);
  }
  const roll = hash(index, 23);
  if (roll > 0.82) return settings.platformAccentStyle;
  return roll > 0.48 ? settings.platformSecondaryStyle : settings.platformPrimaryStyle;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function neonLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width: number, glow: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.lineCap = "round";
  ctx.lineWidth = width * 2.6;
  ctx.globalAlpha = 0.18;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = 0.96;
  ctx.strokeStyle = mixHex(color, "#ffffff", 0.58);
  ctx.lineWidth = Math.max(1, width * 0.26);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

function drawNeonTube(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const y = p.thickness * 0.52;
  const glow = 18 + settings.platformGlow * 34 + impact * 24;
  neonLine(ctx, -half + 18, y, half - 18, y, p.color, Math.max(5, p.thickness * 0.42), glow);
  ctx.save();
  ctx.fillStyle = "rgba(10,14,28,.92)";
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 1;
  for (const x of [-half + 11, half - 11]) {
    roundedRect(ctx, x - 7, y - 10, 14, 20, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10 + impact * 18;
    ctx.beginPath(); ctx.arc(x, y, 2.8 + impact * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(10,14,28,.92)";
  }
  ctx.restore();
}

function drawNeonBar(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const rgb = hexToRgb(p.color);
  const body = ctx.createLinearGradient(0, 0, 0, p.thickness);
  body.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},.68)`);
  body.addColorStop(0.38, "rgba(20,27,48,.94)");
  body.addColorStop(1, "rgba(4,8,18,.98)");
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 16 + settings.platformGlow * 28 + impact * 22;
  roundedRect(ctx, -half, 0, p.width, p.thickness, Math.max(5, p.thickness * 0.28));
  ctx.fillStyle = body; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mixHex(p.color, "#ffffff", 0.28);
  ctx.globalAlpha = 0.72 + impact * 0.28;
  ctx.lineWidth = 2.4 + impact * 1.8;
  ctx.beginPath(); ctx.moveTo(-half + 9, 2); ctx.lineTo(half - 9, 2); ctx.stroke();
  ctx.restore();
}

function drawGlass(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const rgb = hexToRgb(p.color);
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 12 + settings.platformGlow * 20;
  const gradient = ctx.createLinearGradient(0, -4, 0, p.thickness + 8);
  gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.34 + impact * 0.18})`);
  gradient.addColorStop(0.45, "rgba(225,242,255,.10)");
  gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},.12)`);
  roundedRect(ctx, -half, -2, p.width, p.thickness + 4, 8);
  ctx.fillStyle = gradient; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mixHex(p.color, "#ffffff", 0.44);
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.78;
  ctx.stroke();
  ctx.globalAlpha = 0.36;
  for (let x = -half + 24; x < half - 18; x += 34) {
    ctx.beginPath(); ctx.moveTo(x, p.thickness - 1); ctx.lineTo(x + 16, 1); ctx.stroke();
  }
  ctx.restore();
}

function drawMetalRail(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  ctx.save();
  const body = ctx.createLinearGradient(0, 0, 0, p.thickness);
  body.addColorStop(0, "#6f788d"); body.addColorStop(0.18, "#222b3b"); body.addColorStop(0.7, "#0a0f1b"); body.addColorStop(1, "#3e4658");
  roundedRect(ctx, -half, 0, p.width, p.thickness, 5);
  ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.stroke();
  neonLine(ctx, -half + 18, 4, half - 18, 4, p.color, 3.2, 12 + settings.platformGlow * 24 + impact * 16);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  for (const x of [-half + 12, half - 12]) { ctx.beginPath(); ctx.arc(x, p.thickness / 2, 2.2, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

function drawDualRail(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const gap = Math.max(7, p.thickness * 0.58);
  const glow = 14 + settings.platformGlow * 30 + impact * 20;
  neonLine(ctx, -half + 12, -gap / 2 + p.thickness / 2, half - 12, -gap / 2 + p.thickness / 2, p.color, 4.2, glow);
  neonLine(ctx, -half + 12, gap / 2 + p.thickness / 2, half - 12, gap / 2 + p.thickness / 2, mixHex(p.color, "#ffffff", 0.18), 3.4, glow * 0.8);
  ctx.save();
  ctx.strokeStyle = "rgba(210,225,255,.24)"; ctx.lineWidth = 2;
  for (let x = -half + 28; x < half - 20; x += 48) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, p.thickness + 5); ctx.stroke(); }
  ctx.restore();
}

function drawLightPods(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const count = Math.max(4, Math.round(p.width / 42));
  const step = p.width / count;
  for (let i = 0; i < count; i += 1) {
    const x = -half + step * (i + 0.5);
    const radius = Math.min(13, step * 0.28);
    ctx.save();
    ctx.shadowColor = p.color; ctx.shadowBlur = 14 + settings.platformGlow * 28 + impact * 18;
    const g = ctx.createRadialGradient(x - 2, p.thickness / 2 - 2, 1, x, p.thickness / 2, radius);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.28, mixHex(p.color, "#ffffff", 0.3)); g.addColorStop(1, mixHex(p.color, "#02040b", 0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.thickness / 2, radius, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawTechPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  ctx.save();
  ctx.shadowColor = p.color; ctx.shadowBlur = 12 + settings.platformGlow * 22;
  const bevel = Math.min(18, p.width * 0.08);
  ctx.beginPath();
  ctx.moveTo(-half + bevel, 0); ctx.lineTo(half - bevel, 0); ctx.lineTo(half, p.thickness / 2);
  ctx.lineTo(half - bevel, p.thickness); ctx.lineTo(-half + bevel, p.thickness); ctx.lineTo(-half, p.thickness / 2); ctx.closePath();
  ctx.fillStyle = "rgba(9,14,27,.95)"; ctx.fill();
  ctx.strokeStyle = p.color; ctx.lineWidth = 1.8 + impact * 1.4; ctx.stroke();
  ctx.shadowBlur = 0;
  neonLine(ctx, -half * 0.58, p.thickness / 2, half * 0.58, p.thickness / 2, p.color, 3.2, 10 + settings.platformGlow * 18);
  ctx.restore();
}


function drawPipeRail(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  ctx.save();
  ctx.strokeStyle = 'rgba(225,245,255,.22)';
  ctx.fillStyle = 'rgba(120,170,255,.08)';
  ctx.lineWidth = 1.4;
  roundedRect(ctx, -half, -2, p.width, p.thickness + 6, p.thickness * 0.55);
  ctx.fill();
  ctx.stroke();
  neonLine(ctx, -half + 16, p.thickness * 0.5, half - 16, p.thickness * 0.5, p.color, 3.4, 15 + settings.platformGlow * 24 + impact * 16);
  ctx.restore();
}

function drawStairStep(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const body = ctx.createLinearGradient(0, 0, 0, p.thickness + 8);
  body.addColorStop(0, 'rgba(10,14,28,.98)');
  body.addColorStop(1, 'rgba(36,44,62,.95)');
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10 + settings.platformGlow * 18 + impact * 12;
  roundedRect(ctx, -half, 0, p.width, p.thickness + 6, 7);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = mixHex(p.color, '#ffffff', 0.22);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let x = -half + 12; x < half - 10; x += 24) {
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.beginPath();
    ctx.moveTo(x, p.thickness + 4);
    ctx.lineTo(x + 14, 2);
    ctx.stroke();
  }
  ctx.restore();
}



function drawToyPeg(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const height = Math.max(p.thickness * 1.05, 24);
  const radius = height * 0.48;
  const glow = 10 + settings.platformGlow * 14 + impact * 10;
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = glow;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, 'rgba(255,255,255,.96)');
  g.addColorStop(0.42, 'rgba(251,246,238,.94)');
  g.addColorStop(1, mixHex(p.color, '#775844', 0.16));
  roundedRect(ctx, -half, 0, p.width, height, radius);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(38,24,12,.88)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = p.color;
  ctx.fillRect(-half + 4, height - 9, p.width - 8, 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(-half * 0.1, 7, Math.max(12, p.width * 0.18), 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawToyTube(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const height = Math.max(p.thickness * 1.08, 24);
  const radius = height * 0.5;
  const glow = 12 + settings.platformGlow * 18 + impact * 12;
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = mixHex(p.color, '#f4efe8', 0.08);
  roundedRect(ctx, -half, 0, p.width, height, radius);
  ctx.fill();
  ctx.shadowBlur = 0;
  const body = ctx.createLinearGradient(0, 0, 0, height);
  body.addColorStop(0, 'rgba(255,255,255,.95)');
  body.addColorStop(0.38, 'rgba(246,238,229,.95)');
  body.addColorStop(1, mixHex(p.color, '#8c6b53', 0.14));
  roundedRect(ctx, -half + 3, 2, p.width - 6, height - 4, radius - 2);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = 'rgba(34,22,14,.9)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(0, height - 5, Math.max(14, p.width * 0.32), 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath();
  ctx.ellipse(-half * 0.12, 7, Math.max(12, p.width * 0.2), 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRealGlass(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings, kind: PlatformStyle) {
  const frosted = kind === "glass-frosted";
  const acrylic = kind === "glass-acrylic";
  const optic = kind === "glass-optic";
  const tempered = kind === "glass-tempered";
  const height = p.thickness + (acrylic ? 9 : 5);
  const radius = acrylic ? height * 0.48 : 7;
  const alpha = frosted ? 0.24 : acrylic ? 0.16 : 0.09;
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = (optic ? 22 : 8) + settings.platformGlow * (optic ? 28 : 14) + impact * 10;
  const glass = ctx.createLinearGradient(0, -3, 0, height + 3);
  glass.addColorStop(0, `rgba(255,255,255,${frosted ? 0.34 : 0.52})`);
  glass.addColorStop(0.18, `rgba(210,238,255,${alpha})`);
  glass.addColorStop(0.56, `${p.color}${frosted ? "30" : "18"}`);
  glass.addColorStop(1, `rgba(120,170,210,${frosted ? 0.18 : 0.07})`);
  roundedRect(ctx, -half, -2, p.width, height, radius);
  ctx.fillStyle = glass; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = tempered ? "rgba(230,248,255,.58)" : acrylic ? "rgba(220,245,255,.34)" : "rgba(245,252,255,.48)";
  ctx.lineWidth = tempered ? 2.1 : acrylic ? 1.8 : 1.25;
  ctx.stroke();
  ctx.globalAlpha = frosted ? 0.36 : 0.62;
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = frosted ? 1.2 : 1.8;
  ctx.beginPath(); ctx.moveTo(-half + 16, 2); ctx.lineTo(half - 26, 2); ctx.stroke();
  ctx.globalAlpha = 1;
  if (tempered) {
    ctx.fillStyle = "rgba(255,255,255,.24)";
    for (const x of [-half + 14, half - 14]) { ctx.beginPath(); ctx.arc(x, height / 2 - 2, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (optic) neonLine(ctx, -half + 18, height - 3, half - 18, height - 3, p.color, 2.5 + impact, 18 + settings.platformGlow * 24);
  if (frosted) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffffff";
    for (let x = -half + 12; x < half - 8; x += 17) { ctx.fillRect(x, 4 + ((x + half) % 9), 6, 1); }
  }
  ctx.restore();
}

function drawPrism(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const segments = Math.max(5, Math.round(5 + settings.platformDetail * 5));
  const segment = p.width / segments;
  for (let i = 0; i < segments; i += 1) {
    const color = mixHex(p.color, i % 2 ? "#ffffff" : "#000014", i % 2 ? 0.16 : 0.12);
    ctx.save();
    ctx.shadowColor = p.color; ctx.shadowBlur = 8 + settings.platformGlow * 16 + impact * 10;
    ctx.beginPath();
    const x = -half + i * segment;
    ctx.moveTo(x + 2, p.thickness); ctx.lineTo(x + segment * 0.5, 0); ctx.lineTo(x + segment - 2, p.thickness); ctx.closePath();
    ctx.fillStyle = `${color}b8`; ctx.fill();
    ctx.restore();
  }
}

export function drawStyledPlatform(ctx: CanvasRenderingContext2D, platform: MarblePlatform, screenY: number, timeMs: number, settings: StudioSettings, forcedStyle?: PlatformStyle, renderQuality: RenderQuality = "live", noteLightColors = [platform.color]) {
  const age = timeMs - platform.event.timeMs;
  const impact = age >= 0 && age < 320 ? 1 - age / 320 : 0;
  const noteLight = instrumentLightAtTime(platform.event.timeMs, timeMs, platform.color).intensity;
  const lightImpact = settings.impactPlatformLight
    ? noteLight
    : impact;
  const half = platform.width / 2;
  const style = forcedStyle ?? resolvePlatformStyle(platform.index, settings);
  const keyPress = style === "piano-key" || style === "piano-keyboard"
    ? instrumentKeyPressAtTime(platform.event.timeMs, timeMs) * Math.max(2.4, platform.thickness * 0.24)
    : 0;
  const response = instrumentImpactResponseAtTime(style, platform.event.timeMs, timeMs, platform.index);
  const resonanceTravel = response.normalRecoil * Math.max(5, platform.thickness * 0.36);
  ctx.save();
  ctx.translate(platform.x, screenY);
  ctx.rotate(platform.tiltRad);
  if (settings.instrumentShadowsEnabled) {
    drawInstrumentShadow2D(ctx, {
      width: platform.width,
      thickness: platform.thickness,
      tiltRad: platform.tiltRad,
      style,
    }, renderQuality === "idle");
  }
  if (keyPress + resonanceTravel > 0) ctx.translate(0, keyPress + resonanceTravel);
  if (response.tiltRad || response.twistRad) ctx.rotate(response.tiltRad + response.twistRad * 0.65);
  if (drawWindMetalPlatform2D(ctx, style, platform, lightImpact, settings, renderQuality === "idle")) {
    // dedicated 2D gong/flute renderer already drew the item
  } else if (drawPresetPlatform(ctx, style, half, platform, lightImpact, age, settings, renderQuality)) {
    // preset renderer already drew the item
  } else if (style === "neon-tube") drawNeonTube(ctx, half, platform, lightImpact, settings);
  else if (style === "neon-bar") drawNeonBar(ctx, half, platform, lightImpact, settings);
  else if (style === "glass") drawGlass(ctx, half, platform, lightImpact, settings);
  else if (style === "metal-rail") drawMetalRail(ctx, half, platform, lightImpact, settings);
  else if (style === "dual-rail") drawDualRail(ctx, half, platform, lightImpact, settings);
  else if (style === "light-pods") drawLightPods(ctx, half, platform, lightImpact, settings);
  else if (style === "tech-pad") drawTechPad(ctx, half, platform, lightImpact, settings);
  else if (style === "pipe-rail") drawPipeRail(ctx, half, platform, lightImpact, settings);
  else if (style === "stair-step") drawStairStep(ctx, half, platform, lightImpact, settings);
  else if (style === "toy-peg") drawToyPeg(ctx, half, platform, lightImpact, settings);
  else if (style === "toy-tube") drawToyTube(ctx, half, platform, lightImpact, settings);
  else if (style.startsWith("glass-")) drawRealGlass(ctx, half, platform, lightImpact, settings, style);
  else drawPrism(ctx, half, platform, lightImpact, settings);
  if (isNoteLitInstrumentStyle(style)) {
    drawInstrumentNoteLeds2D(ctx, platform, noteLightColors, settings.impactPlatformLight ? lightImpact : 0, renderQuality === "idle");
  }
  ctx.restore();

  if (settings.impactRipple && impact > 0) {
    ctx.save();
    ctx.globalAlpha = impact * (0.28 + settings.platformDetail * 0.18);
    ctx.strokeStyle = platform.color;
    ctx.lineWidth = 1.5 + settings.platformGlow;
    ctx.beginPath();
    ctx.ellipse(platform.x, screenY + 4, platform.width * (0.2 + (1 - impact) * 0.34), 8 + (1 - impact) * 26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
