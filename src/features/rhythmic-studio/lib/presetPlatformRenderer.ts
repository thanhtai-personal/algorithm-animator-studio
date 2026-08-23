import type { PlatformStyle, StudioSettings } from "../types";
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

function drawTubeCylinder(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const h = Math.max(20, p.thickness);
  const radius = h * 0.5;
  const contactX = contactLocalX(p) < 0 ? -half : half;
  const farX = -contactX;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.56)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = -12;
  ctx.shadowOffsetY = 18;
  roundedRect(ctx, -half, -h / 2, p.width, h, radius);
  ctx.fillStyle = "rgba(8,9,12,.72)";
  ctx.fill();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 5 + settings.platformGlow * 11 + impact * 7;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  const body = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  body.addColorStop(0, mixHex(p.color, "#ffffff", 0.38));
  body.addColorStop(0.25, mixHex(p.color, "#ffffff", 0.12));
  body.addColorStop(0.7, mixHex(p.color, "#161821", 0.28));
  body.addColorStop(1, mixHex(p.color, "#050608", 0.54));
  roundedRect(ctx, -half, -h / 2, p.width, h, radius);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(10,10,12,.96)";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  for (const capX of [farX, contactX]) {
    const isContact = capX === contactX;
    const cap = ctx.createRadialGradient(capX - radius * 0.24, -radius * 0.24, 1, capX, 0, radius);
    cap.addColorStop(0, isContact ? mixHex(p.color, "#ffffff", 0.56) : "#4f535a");
    cap.addColorStop(0.66, isContact ? p.color : "#26282d");
    cap.addColorStop(1, isContact ? mixHex(p.color, "#08090b", 0.46) : "#08090b");
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.arc(capX, 0, radius - 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0a0a0c";
    ctx.lineWidth = 2.1;
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,.38)";
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.23, Math.max(7, p.width * 0.18), 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCometPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number, settings: StudioSettings) {
  const h = Math.max(10, p.thickness);
  const activeColor = impact > 0 ? p.color : mixHex(p.color, "#4b4a59", 0.72);
  ctx.save();
  const glow = ctx.createRadialGradient(0, h * 0.55, 3, 0, h * 0.55, p.width * 0.82);
  glow.addColorStop(0, `${p.color}${impact > 0 ? "78" : "18"}`);
  glow.addColorStop(1, `${p.color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(-p.width, -p.width * 0.55, p.width * 2, p.width * 1.2);
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 10 + settings.platformGlow * 20 + impact * 26;
  const body = ctx.createLinearGradient(0, -h * 0.25, 0, h);
  body.addColorStop(0, mixHex(activeColor, "#ffffff", impact > 0 ? 0.38 : 0.18));
  body.addColorStop(0.5, activeColor);
  body.addColorStop(1, mixHex(activeColor, "#120d1f", 0.56));
  ctx.beginPath();
  ctx.moveTo(-half, h * 0.82);
  ctx.quadraticCurveTo(-half * 0.9, -h * 0.42, 0, -h * 0.48);
  ctx.quadraticCurveTo(half * 0.9, -h * 0.42, half, h * 0.82);
  ctx.lineTo(-half, h * 0.82);
  ctx.closePath();
  ctx.fillStyle = body;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = mixHex(activeColor, "#ffffff", impact > 0 ? 0.52 : 0.24);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.restore();
}

function drawInstrumentKey(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number) {
  const h = Math.max(13, p.thickness);
  ctx.save();
  ctx.shadowColor = "rgba(32,35,45,.40)";
  ctx.shadowBlur = 11;
  ctx.shadowOffsetX = -8;
  ctx.shadowOffsetY = 13;
  roundedRect(ctx, -half, 0, p.width, h, 4);
  ctx.fillStyle = p.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  const shine = ctx.createLinearGradient(0, 0, 0, h);
  shine.addColorStop(0, "rgba(255,255,255,.58)");
  shine.addColorStop(0.34, "rgba(255,255,255,.13)");
  shine.addColorStop(1, "rgba(0,0,0,.16)");
  roundedRect(ctx, -half, 0, p.width, h, 4);
  ctx.fillStyle = shine;
  ctx.fill();
  ctx.strokeStyle = impact > 0 ? "rgba(255,255,255,.92)" : "rgba(46,49,58,.66)";
  ctx.lineWidth = impact > 0 ? 2.1 : 1.2;
  ctx.stroke();
  for (const x of [-half + 13, half - 13]) {
    ctx.fillStyle = "rgba(25,28,35,.66)";
    ctx.beginPath(); ctx.arc(x, h / 2, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawInstrumentCymbal(ctx: CanvasRenderingContext2D, p: MarblePlatform, impact: number) {
  const rx = Math.max(28, p.width * 0.32);
  const ry = Math.max(8, p.thickness * 0.62);
  ctx.save();
  ctx.shadowColor = "rgba(25,28,36,.42)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = -10;
  ctx.shadowOffsetY = 15;
  const metal = ctx.createRadialGradient(-rx * 0.25, -ry * 0.2, 2, 0, 0, rx);
  metal.addColorStop(0, "#fff8dc");
  metal.addColorStop(0.28, mixHex(p.color, "#f6d48a", 0.35));
  metal.addColorStop(0.75, mixHex(p.color, "#6f5b3f", 0.34));
  metal.addColorStop(1, "#3b342c");
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = impact > 0 ? "rgba(255,255,255,.88)" : "rgba(75,62,46,.78)";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.32)";
  ctx.beginPath(); ctx.ellipse(-rx * 0.18, -ry * 0.18, rx * 0.22, ry * 0.18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawInstrumentRail(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number) {
  const h = Math.max(8, p.thickness * 0.62);
  ctx.save();
  ctx.shadowColor = "rgba(30,34,44,.38)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 10;
  roundedRect(ctx, -half, 0, p.width, h, h / 2);
  const rail = ctx.createLinearGradient(0, 0, 0, h);
  rail.addColorStop(0, "#f7f8fb"); rail.addColorStop(0.35, "#a9afba"); rail.addColorStop(1, "#424955");
  ctx.fillStyle = rail; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = impact > 0 ? p.color : "rgba(45,49,58,.78)";
  ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

function drawInstrumentPad(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number) {
  const h = Math.max(14, p.thickness);
  ctx.save();
  ctx.shadowColor = "rgba(28,32,40,.38)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 12;
  roundedRect(ctx, -half, 0, p.width, h, 7);
  ctx.fillStyle = mixHex(p.color, "#ffffff", impact > 0 ? 0.16 : 0.04);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(45,48,56,.74)";
  ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.28)";
  roundedRect(ctx, -half + 5, 3, p.width - 10, 4, 2); ctx.fill();
  ctx.restore();
}


function drawInstrumentWire(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, impact: number) {
  const railGap = Math.max(12, p.thickness * 0.9);
  ctx.save();
  ctx.shadowColor = "rgba(32,36,44,.34)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = -7;
  ctx.shadowOffsetY = 11;
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
    ctx.lineTo(x + 5, railGap / 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(225,232,242,.9)";
  for (const x of [-half, half]) {
    ctx.beginPath(); ctx.arc(x, 0, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawXylophoneKey(ctx: CanvasRenderingContext2D, half: number, p: MarblePlatform, settings: StudioSettings) {
  drawInstrumentKey(ctx, half, p, settings.platformGlow > 1 ? 0.4 : 0);
}

export function drawPresetPlatform(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  half: number,
  platform: MarblePlatform,
  impact: number,
  settings: StudioSettings,
) {
  if (style === "tube-cylinder") { drawTubeCylinder(ctx, half, platform, impact, settings); return true; }
  if (style === "comet-pad") { drawCometPad(ctx, half, platform, impact, settings); return true; }
  if (style === "xylophone-key") { drawXylophoneKey(ctx, half, platform, settings); return true; }
  if (style === "instrument-key") { drawInstrumentKey(ctx, half, platform, impact); return true; }
  if (style === "instrument-cymbal") { drawInstrumentCymbal(ctx, platform, impact); return true; }
  if (style === "instrument-rail") { drawInstrumentRail(ctx, half, platform, impact); return true; }
  if (style === "instrument-pad") { drawInstrumentPad(ctx, half, platform, impact); return true; }
  if (style === "instrument-wire") { drawInstrumentWire(ctx, half, platform, impact); return true; }
  return false;
}
