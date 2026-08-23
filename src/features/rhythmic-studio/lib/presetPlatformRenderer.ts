import type { PlatformStyle, RenderQuality, StudioSettings } from "../types";
import { mixHex, type MarblePlatform } from "./marbleCourse";

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

function contactLocalX(p: MarblePlatform) {
  const dx = p.contactX - p.x;
  const dy = p.contactY - p.y;
  return dx * Math.cos(p.tiltRad) + dy * Math.sin(p.tiltRad);
}

function drawTubeCylinder(
  ctx: CanvasRenderingContext2D,
  half: number,
  p: MarblePlatform,
  impact: number,
  ageMs: number,
  settings: StudioSettings,
  lowPower: boolean,
) {
  const h = Math.max(24, p.thickness);
  const radius = h * 0.5;
  const active = ageMs >= 0;
  const litColor = active ? p.color : "#80858d";
  const contactX = contactLocalX(p) < 0 ? -half : half;
  const farX = -contactX;

  ctx.save();
  if (!lowPower) {
    const underGlow = ctx.createRadialGradient(0, h * 0.55, 4, 0, h * 0.55, p.width * 0.78);
    underGlow.addColorStop(0, active ? `${litColor}${impact > 0 ? "4f" : "24"}` : "rgba(120,126,140,.08)");
    underGlow.addColorStop(1, active ? `${litColor}00` : "rgba(120,126,140,0)");
    ctx.fillStyle = underGlow;
    ctx.fillRect(-p.width, -p.width * 0.45, p.width * 2, p.width * 1.15);
  }

  ctx.shadowColor = "rgba(8,9,13,.58)";
  ctx.shadowBlur = lowPower ? 0 : 13;
  ctx.shadowOffsetX = lowPower ? 0 : -22;
  ctx.shadowOffsetY = lowPower ? 0 : 28;
  roundedRect(ctx, -half, -h / 2, p.width, h, radius);
  ctx.fillStyle = "rgba(13,14,19,.72)";
  ctx.fill();

  ctx.shadowColor = active ? litColor : "rgba(190,198,210,.18)";
  ctx.shadowBlur = lowPower ? 0 : (active ? 4 + settings.platformGlow * 10 + impact * 8 : 1.5);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const body = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  if (active) {
    body.addColorStop(0, mixHex(litColor, "#ffffff", 0.52));
    body.addColorStop(0.2, mixHex(litColor, "#ffffff", 0.2));
    body.addColorStop(0.58, litColor);
    body.addColorStop(0.82, mixHex(litColor, "#1c2028", 0.24));
    body.addColorStop(1, mixHex(litColor, "#090b10", 0.5));
  } else {
    body.addColorStop(0, "#d6d9df");
    body.addColorStop(0.18, "#aeb3bb");
    body.addColorStop(0.55, "#777d87");
    body.addColorStop(0.82, "#4b5059");
    body.addColorStop(1, "#282b31");
  }
  roundedRect(ctx, -half, -h / 2, p.width, h, radius);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(10,10,13,.94)";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.34)";
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  ctx.moveTo(-half + radius * 0.85, -h * 0.34);
  ctx.lineTo(half - radius * 0.85, -h * 0.34);
  ctx.stroke();

  const farCap = ctx.createLinearGradient(farX - radius * 0.32, 0, farX + radius * 0.32, 0);
  farCap.addColorStop(0, "#101217");
  farCap.addColorStop(0.55, active ? mixHex(litColor, "#11151c", 0.65) : "#4b5058");
  farCap.addColorStop(1, "#090a0d");
  ctx.fillStyle = farCap;
  ctx.beginPath();
  ctx.ellipse(farX, 0, radius * 0.38, radius * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#08090c";
  ctx.lineWidth = 1.8;
  ctx.stroke();

  const cap = ctx.createRadialGradient(contactX - radius * 0.25, -radius * 0.28, 1, contactX, 0, radius);
  if (active) {
    cap.addColorStop(0, mixHex(litColor, "#ffffff", 0.7));
    cap.addColorStop(0.62, litColor);
    cap.addColorStop(1, mixHex(litColor, "#07080a", 0.48));
  } else {
    cap.addColorStop(0, "#30343b");
    cap.addColorStop(0.62, "#111318");
    cap.addColorStop(1, "#050608");
  }
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.arc(contactX, 0, radius - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#08090c";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  if (active) {
    ctx.fillStyle = "rgba(255,255,255,.58)";
    ctx.beginPath();
    ctx.ellipse(contactX - radius * 0.24, -radius * 0.28, radius * 0.22, radius * 0.13, -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}


function drawCometPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, ageMs: number, settings: StudioSettings, lowPower: boolean) {
  const h = Math.max(12, p.thickness);
  const recentlyHit = ageMs >= 0 && ageMs < 1350;
  const hitFade = recentlyHit ? Math.max(0, 1 - ageMs / 1350) : 0;
  const active = impact > 0 || recentlyHit;
  const activeColor = active ? p.color : "#656476";
  ctx.save();

  if (!lowPower) {
    const haloRadius = p.width * (active ? 2.15 : 0.95);
    const glow = ctx.createRadialGradient(0, h * 0.2, 4, 0, h * 0.2, haloRadius);
    glow.addColorStop(0, active ? `${p.color}${impact > 0 ? "a8" : "70"}` : "rgba(110,110,135,.10)");
    glow.addColorStop(0.34, active ? `${p.color}${hitFade > 0.2 ? "34" : "20"}` : "rgba(90,90,115,.04)");
    glow.addColorStop(1, `${p.color}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(-haloRadius, -haloRadius, haloRadius * 2, haloRadius * 2);
  }

  ctx.shadowColor = active ? p.color : "rgba(110,110,130,.28)";
  ctx.shadowBlur = lowPower ? 0 : (active ? 16 + settings.platformGlow * 23 + impact * 28 : 4);
  const body = ctx.createLinearGradient(0, -h * 0.65, 0, h);
  body.addColorStop(0, active ? mixHex(activeColor, "#ffffff", 0.62) : "#a2a1ae");
  body.addColorStop(0.36, activeColor);
  body.addColorStop(0.72, active ? mixHex(activeColor, "#20142e", 0.3) : "#4d4c5d");
  body.addColorStop(1, active ? mixHex(activeColor, "#090710", 0.64) : "#292936");

  ctx.beginPath();
  ctx.moveTo(-half, h * 0.78);
  ctx.quadraticCurveTo(-half * 0.98, -h * 0.6, -half * 0.52, -h * 0.72);
  ctx.quadraticCurveTo(0, -h * 1.04, half * 0.52, -h * 0.72);
  ctx.quadraticCurveTo(half * 0.98, -h * 0.6, half, h * 0.78);
  ctx.lineTo(-half, h * 0.78);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = active ? mixHex(activeColor, "#ffffff", 0.7) : "rgba(160,158,176,.72)";
  ctx.lineWidth = active ? 1.8 : 1.15;
  ctx.stroke();

  ctx.globalAlpha = active ? 0.62 : 0.25;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-half * 0.55, -h * 0.68);
  ctx.quadraticCurveTo(0, -h * 0.9, half * 0.52, -h * 0.68);
  ctx.stroke();
  ctx.restore();
}

function drawInstrumentKey(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, lowPower: boolean) {
  const h = Math.max(13, p.thickness);
  const depth = Math.max(8, h * 0.55);
  ctx.save();
  ctx.shadowColor = "rgba(32,35,45,.42)";
  ctx.shadowBlur = lowPower ? 0 : 16;
  ctx.shadowOffsetX = lowPower ? 0 : -10;
  ctx.shadowOffsetY = lowPower ? 0 : 18;
  roundedRect(ctx, -half + 5, depth, p.width, h, 4);
  ctx.fillStyle = mixHex(p.color, "#222730", 0.6);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = mixHex(p.color, "#232833", 0.48);
  ctx.beginPath();
  ctx.moveTo(-half, h);
  ctx.lineTo(half, h);
  ctx.lineTo(half + 5, h + depth);
  ctx.lineTo(-half + 5, h + depth);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = mixHex(p.color, "#ffffff", 0.1);
  ctx.beginPath();
  ctx.moveTo(half, 0);
  ctx.lineTo(half + 5, depth);
  ctx.lineTo(half + 5, h + depth);
  ctx.lineTo(half, h);
  ctx.closePath();
  ctx.fill();

  roundedRect(ctx, -half, 0, p.width, h, 4);
  const top = ctx.createLinearGradient(0, 0, 0, h);
  top.addColorStop(0, mixHex(p.color, "#ffffff", 0.38));
  top.addColorStop(0.25, mixHex(p.color, "#ffffff", 0.14));
  top.addColorStop(0.78, mixHex(p.color, "#171a22", 0.08));
  top.addColorStop(1, mixHex(p.color, "#05070d", 0.24));
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = impact > 0 ? "rgba(255,255,255,.96)" : "rgba(44,47,55,.72)";
  ctx.lineWidth = impact > 0 ? 2.1 : 1.1;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,.68)";
  roundedRect(ctx, -half + 8, 3, p.width - 22, 4, 2);
  ctx.fill();
  for (const x of [-half + 13, half - 13]) {
    ctx.fillStyle = "rgba(25,28,35,.72)";
    ctx.beginPath(); ctx.arc(x, h / 2, 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.42)";
    ctx.beginPath(); ctx.arc(x - 0.7, h / 2 - 0.7, 0.8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawInstrumentCymbal(ctx: CanvasRenderingContext2D, p: MarblePlatform, impact: number, lowPower: boolean) {
  const rx = Math.max(28, p.width * 0.32);
  const ry = Math.max(8, p.thickness * 0.62);
  ctx.save();
  ctx.strokeStyle = "rgba(90,92,98,.78)";
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(2, ry * 0.35); ctx.lineTo(5, ry * 3.3); ctx.stroke();
  ctx.fillStyle = "#5b616b";
  ctx.beginPath(); ctx.arc(5, ry * 3.3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = "rgba(25,28,36,.42)";
  ctx.shadowBlur = lowPower ? 0 : 16;
  ctx.shadowOffsetX = lowPower ? 0 : -12;
  ctx.shadowOffsetY = lowPower ? 0 : 18;
  const metal = ctx.createRadialGradient(-rx * 0.24, -ry * 0.25, 2, 0, 0, rx);
  metal.addColorStop(0, "#fffbe2");
  metal.addColorStop(0.24, mixHex(p.color, "#f6d48a", 0.35));
  metal.addColorStop(0.72, mixHex(p.color, "#7c6242", 0.32));
  metal.addColorStop(1, "#352d24");
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(96,76,48,.58)";
  ctx.beginPath(); ctx.ellipse(0, ry * 0.22, rx * 0.96, ry * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = impact > 0 ? "rgba(255,255,255,.92)" : "rgba(75,62,46,.8)";
  ctx.lineWidth = 1.45;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.beginPath(); ctx.ellipse(0, -ry * 0.03, rx * 0.68, ry * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.34)";
  ctx.beginPath(); ctx.ellipse(-rx * 0.18, -ry * 0.2, rx * 0.22, ry * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(72,61,46,.78)";
  ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, ry * 0.23), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawInstrumentRail(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, lowPower: boolean) {
  const h = Math.max(8, p.thickness * 0.62);
  const depth = Math.max(5, h * 0.8);
  ctx.save();
  ctx.shadowColor = "rgba(30,34,44,.4)";
  ctx.shadowBlur = lowPower ? 0 : 11;
  ctx.shadowOffsetX = lowPower ? 0 : -8;
  ctx.shadowOffsetY = lowPower ? 0 : 14;
  roundedRect(ctx, -half + 3, depth, p.width, h, h / 2);
  ctx.fillStyle = "rgba(74,80,92,.82)";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(70,78,92,.65)";
  ctx.beginPath();
  ctx.moveTo(-half, h);
  ctx.lineTo(half, h);
  ctx.lineTo(half + 3, h + depth);
  ctx.lineTo(-half + 3, h + depth);
  ctx.closePath();
  ctx.fill();
  roundedRect(ctx, -half, 0, p.width, h, h / 2);
  const rail = ctx.createLinearGradient(0, 0, 0, h);
  rail.addColorStop(0, "#fbfcff"); rail.addColorStop(0.35, "#b8c0cd"); rail.addColorStop(1, "#495466");
  ctx.fillStyle = rail; ctx.fill();
  ctx.strokeStyle = impact > 0 ? p.color : "rgba(45,49,58,.8)";
  ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.56)";
  ctx.fillRect(-half + 10, 2, p.width - 20, 2);
  for (const x of [-half + 4, half - 4]) {
    ctx.fillStyle = "#d9dde4";
    ctx.beginPath(); ctx.arc(x, h / 2, h * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#59606b"; ctx.lineWidth = 0.9; ctx.stroke();
  }
  ctx.restore();
}

function drawInstrumentPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, lowPower: boolean) {
  const h = Math.max(14, p.thickness);
  const depth = Math.max(8, h * 0.5);
  ctx.save();
  ctx.shadowColor = "rgba(28,32,40,.4)";
  ctx.shadowBlur = lowPower ? 0 : 13;
  ctx.shadowOffsetX = lowPower ? 0 : -9;
  ctx.shadowOffsetY = lowPower ? 0 : 16;
  roundedRect(ctx, -half + 5, depth, p.width, h, 7);
  ctx.fillStyle = mixHex(p.color, "#252832", 0.58);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = mixHex(p.color, "#1f2430", 0.42);
  ctx.beginPath();
  ctx.moveTo(-half, h);
  ctx.lineTo(half, h);
  ctx.lineTo(half + 5, h + depth);
  ctx.lineTo(-half + 5, h + depth);
  ctx.closePath();
  ctx.fill();
  roundedRect(ctx, -half, 0, p.width, h, 7);
  const top = ctx.createLinearGradient(0, 0, 0, h);
  top.addColorStop(0, mixHex(p.color, "#ffffff", impact > 0 ? 0.24 : 0.08));
  top.addColorStop(1, mixHex(p.color, "#111827", 0.16));
  ctx.fillStyle = top;
  ctx.fill();
  ctx.strokeStyle = "rgba(45,48,56,.76)";
  ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.38)";
  roundedRect(ctx, -half + 6, 3, p.width - 12, 4, 2); ctx.fill();
  ctx.fillStyle = "rgba(30,32,38,.58)";
  ctx.beginPath(); ctx.arc(half - 12, h / 2, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawInstrumentWire(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, lowPower: boolean) {
  const railGap = Math.max(12, p.thickness * 0.9);
  ctx.save();
  ctx.shadowColor = "rgba(32,36,44,.34)";
  ctx.shadowBlur = lowPower ? 0 : 8;
  ctx.shadowOffsetX = lowPower ? 0 : -7;
  ctx.shadowOffsetY = lowPower ? 0 : 11;
  ctx.strokeStyle = impact > 0 ? mixHex(p.color, "#ffffff", 0.38) : "#737b88";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  for (const y of [-railGap / 2, railGap / 2]) {
    ctx.beginPath();
    ctx.moveTo(-half, y);
    ctx.quadraticCurveTo(0, y + (y < 0 ? -7 : 7), half, y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(74,80,91,.84)";
  ctx.lineWidth = 1.4;
  for (let x = -half + 18; x < half - 8; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, -railGap / 2);
    ctx.lineTo(x + 6, railGap / 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(225,232,242,.9)";
  for (const x of [-half, half]) {
    ctx.beginPath(); ctx.arc(x, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(20,24,32,.42)";
    ctx.beginPath(); ctx.arc(x + 1.5, 3.5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(225,232,242,.9)";
  }
  ctx.restore();
}

function drawXylophoneKey(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, settings: StudioSettings, lowPower: boolean) {
  const original = p.color;
  const tint = mixHex(original, "#f6c453", 0.22);
  drawInstrumentKey(ctx, half, { ...p, color: tint }, settings.platformGlow > 1 ? 0.4 : 0, lowPower);
}

export function drawPresetPlatform(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  half: number,
  platform: MarblePlatform,
  impact: number,
  ageMs: number,
  settings: StudioSettings,
  renderQuality: RenderQuality = "live",
) {
  const lowPower = renderQuality === "idle";
  if (style === "tube-cylinder") { drawTubeCylinder(ctx, half, platform, impact, ageMs, settings, lowPower); return true; }
  if (style === "comet-pad") { drawCometPad(ctx, half, platform, impact, ageMs, settings, lowPower); return true; }
  if (style === "xylophone-key") { drawXylophoneKey(ctx, half, platform, settings, lowPower); return true; }
  if (style === "instrument-key") { drawInstrumentKey(ctx, half, platform, impact, lowPower); return true; }
  if (style === "instrument-cymbal") { drawInstrumentCymbal(ctx, platform, impact, lowPower); return true; }
  if (style === "instrument-rail") { drawInstrumentRail(ctx, half, platform, impact, lowPower); return true; }
  if (style === "instrument-pad") { drawInstrumentPad(ctx, half, platform, impact, lowPower); return true; }
  if (style === "instrument-wire") { drawInstrumentWire(ctx, half, platform, impact, lowPower); return true; }
  return false;
}
