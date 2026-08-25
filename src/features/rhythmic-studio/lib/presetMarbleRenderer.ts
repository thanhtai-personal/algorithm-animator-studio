import type { BallStyle, StudioSettings } from "../types";
import { mixHex, type MarblePoint } from "./marbleCourse";
import { drawMulticolorGlassMarble2D } from "./multicolorGlassMarble2D";

function groundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha = 0.3) {
  ctx.save();
  ctx.translate(x - radius * 0.48, y + radius * 1.12);
  ctx.rotate(-0.16);
  ctx.scale(1, 0.34);
  const shadow = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * 1.55);
  shadow.addColorStop(0, `rgba(5,8,14,${alpha})`);
  shadow.addColorStop(0.58, `rgba(5,8,14,${alpha * 0.48})`);
  shadow.addColorStop(1, "rgba(5,8,14,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath(); ctx.arc(0, 0, radius * 1.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

function sphereGradient(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, base: string, darkMix = 0.44) {
  const sphere = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.46, radius * 0.06, x, y, radius * 1.03);
  sphere.addColorStop(0, "#ffffff");
  sphere.addColorStop(0.16, mixHex("#ffffff", base, 0.16));
  sphere.addColorStop(0.56, base);
  sphere.addColorStop(1, mixHex(base, "#05070d", darkMix));
  return sphere;
}

function glossyHighlight(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, alpha = 0.7) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.3, y - radius * 0.36, radius * 0.24, radius * 0.14, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function rim(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color = "rgba(255,255,255,.58)", width = 1.2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  circle(ctx, x, y, radius - width * 0.45);
  ctx.stroke();
  ctx.restore();
}

function drawClassic(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string) {
  groundShadow(ctx, x, y, radius, 0.34);
  ctx.save();
  ctx.shadowColor = mixHex(base, "#ffffff", 0.2);
  ctx.shadowBlur = 4 + pulse * 5;
  ctx.fillStyle = sphereGradient(ctx, x, y, radius, base, 0.52);
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(14,18,28,.62)", 1.25);
  glossyHighlight(ctx, x, y, radius, 0.66);
}

function drawChrome(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, accent: string) {
  groundShadow(ctx, x, y, radius, 0.42);
  ctx.save();
  ctx.shadowColor = mixHex(accent, "#c8f3ff", 0.45);
  ctx.shadowBlur = 6 + pulse * 8;
  const metal = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  metal.addColorStop(0, "#111722");
  metal.addColorStop(0.16, "#eef6ff");
  metal.addColorStop(0.3, "#637083");
  metal.addColorStop(0.48, "#f8fbff");
  metal.addColorStop(0.64, "#485262");
  metal.addColorStop(0.82, "#c8d4e2");
  metal.addColorStop(1, "#0a0f18");
  ctx.fillStyle = metal;
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();
  ctx.globalAlpha = 0.56;
  ctx.fillStyle = mixHex(accent, "#ffffff", 0.52);
  ctx.fillRect(x - radius * 1.2, y - radius * 0.16, radius * 2.4, radius * 0.14);
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.fillRect(x - radius * 1.2, y + radius * 0.16, radius * 2.4, radius * 0.08);
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(255,255,255,.82)", 1.05);
  glossyHighlight(ctx, x, y, radius, 0.88);
}

function drawGlass(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, accent: string) {
  groundShadow(ctx, x, y, radius, 0.24);
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, radius * 0.55, x, y, radius * (1.8 + pulse * 0.24));
  halo.addColorStop(0, `${accent}26`);
  halo.addColorStop(1, `${accent}00`);
  ctx.fillStyle = halo;
  circle(ctx, x, y, radius * 1.8);
  ctx.fill();

  const shell = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.45, radius * 0.05, x, y, radius);
  shell.addColorStop(0, "rgba(255,255,255,.96)");
  shell.addColorStop(0.18, "rgba(220,246,255,.52)");
  shell.addColorStop(0.5, `${base}48`);
  shell.addColorStop(0.82, `${accent}5a`);
  shell.addColorStop(1, "rgba(7,14,28,.64)");
  ctx.fillStyle = shell;
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();

  const core = ctx.createRadialGradient(x + radius * 0.12, y + radius * 0.12, 0, x + radius * 0.12, y + radius * 0.12, radius * 0.58);
  core.addColorStop(0, `${accent}72`);
  core.addColorStop(0.56, `${base}2e`);
  core.addColorStop(1, `${base}00`);
  ctx.fillStyle = core;
  circle(ctx, x + radius * 0.1, y + radius * 0.12, radius * 0.58);
  ctx.fill();
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(224,248,255,.88)", 1.5);
  glossyHighlight(ctx, x, y, radius, 0.92);
}

function drawNeon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, accent: string) {
  ctx.save();
  const glowRadius = radius * (2.5 + pulse * 0.55);
  const glow = ctx.createRadialGradient(x, y, radius * 0.2, x, y, glowRadius);
  glow.addColorStop(0, `${accent}a8`);
  glow.addColorStop(0.32, `${base}52`);
  glow.addColorStop(1, `${accent}00`);
  ctx.fillStyle = glow;
  circle(ctx, x, y, glowRadius);
  ctx.fill();

  const core = ctx.createRadialGradient(x - radius * 0.18, y - radius * 0.22, radius * 0.05, x, y, radius);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.18, mixHex(accent, "#ffffff", 0.42));
  core.addColorStop(0.48, base);
  core.addColorStop(1, "#080916");
  ctx.fillStyle = core;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12 + pulse * 14;
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = mixHex(accent, "#ffffff", 0.32);
  ctx.lineWidth = Math.max(1.6, radius * 0.11);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 8 + pulse * 12;
  circle(ctx, x, y, radius * 0.86);
  ctx.stroke();
  ctx.restore();
  glossyHighlight(ctx, x, y, radius, 0.7);
}

function drawStriped(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, stripe: string, spin: number) {
  groundShadow(ctx, x, y, radius, 0.36);
  ctx.save();
  ctx.shadowColor = base;
  ctx.shadowBlur = 5 + pulse * 7;
  ctx.fillStyle = sphereGradient(ctx, x, y, radius, base, 0.5);
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = stripe;
  ctx.fillRect(-radius * 1.45, -radius * 0.29, radius * 2.9, radius * 0.3);
  ctx.globalAlpha = 0.58;
  ctx.fillRect(-radius * 1.45, radius * 0.1, radius * 2.9, radius * 0.14);
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(20,14,18,.65)", 1.15);
  glossyHighlight(ctx, x, y, radius, 0.7);
}

function drawPrism(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, accent: string, spin: number) {
  groundShadow(ctx, x, y, radius, 0.27);
  ctx.save();
  const aura = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * (2.2 + pulse * 0.35));
  aura.addColorStop(0, `${accent}52`);
  aura.addColorStop(0.5, `${base}26`);
  aura.addColorStop(1, `${accent}00`);
  ctx.fillStyle = aura;
  circle(ctx, x, y, radius * 2.2);
  ctx.fill();

  const prism = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  prism.addColorStop(0, mixHex(base, "#50e7ff", 0.58));
  prism.addColorStop(0.22, "#7c74ff");
  prism.addColorStop(0.46, mixHex(accent, "#ff54cf", 0.56));
  prism.addColorStop(0.68, "#ffd56a");
  prism.addColorStop(0.86, "#63f0bc");
  prism.addColorStop(1, mixHex(base, "#17214b", 0.5));
  ctx.fillStyle = prism;
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(spin * 0.42);
  for (let i = 0; i < 5; i += 1) {
    ctx.globalAlpha = 0.18 + i * 0.045;
    ctx.strokeStyle = i % 2 ? "#ffffff" : "#9ff8ff";
    ctx.lineWidth = Math.max(1, radius * 0.055);
    ctx.beginPath();
    ctx.moveTo(-radius * 1.1, -radius * 0.72 + i * radius * 0.36);
    ctx.lineTo(radius * 1.1, -radius * 0.3 + i * radius * 0.24);
    ctx.stroke();
  }
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(245,251,255,.82)", 1.25);
  glossyHighlight(ctx, x, y, radius, 0.84);
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, accent: string, spin: number) {
  drawClassic(ctx, x, y, radius, pulse, base);
  ctx.save();
  circle(ctx, x, y, radius * 0.94); ctx.clip();
  ctx.translate(x, y); ctx.rotate(spin * 0.35);
  for (let flower = 0; flower < 4; flower += 1) {
    const cx = (flower % 2 ? 0.34 : -0.34) * radius;
    const cy = (flower < 2 ? -0.31 : 0.32) * radius;
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = petal * Math.PI * 0.4;
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(angle) * radius * 0.12, cy + Math.sin(angle) * radius * 0.12, radius * 0.09, radius * 0.055, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = accent; circle(ctx, cx, cy, radius * 0.07); ctx.fill();
  }
  ctx.restore();
  glossyHighlight(ctx, x, y, radius, 0.78);
}

function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number) {
  ctx.save();
  const aura = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * (2.4 + pulse * 0.45));
  aura.addColorStop(0, "rgba(255,210,40,.72)"); aura.addColorStop(0.35, "rgba(255,72,12,.38)"); aura.addColorStop(1, "rgba(120,8,0,0)");
  ctx.fillStyle = aura; circle(ctx, x, y, radius * 2.5); ctx.fill();
  const core = ctx.createRadialGradient(x - radius * 0.28, y - radius * 0.34, radius * 0.03, x, y, radius);
  core.addColorStop(0, "#ffffff"); core.addColorStop(0.16, "#fff39a"); core.addColorStop(0.44, "#ffad13"); core.addColorStop(0.74, "#ed3612"); core.addColorStop(1, "#5c0703");
  ctx.fillStyle = core; ctx.shadowColor = "#ff4b12"; ctx.shadowBlur = 13 + pulse * 16; circle(ctx, x, y, radius); ctx.fill();
  ctx.clip();
  ctx.strokeStyle = "rgba(255,244,164,.7)"; ctx.lineWidth = Math.max(1.4, radius * 0.1);
  for (let band = 0; band < 3; band += 1) {
    ctx.beginPath(); ctx.arc(x - radius * 0.25, y + radius * (0.16 - band * 0.22), radius * (0.58 + band * 0.12), -1.1, 1.05); ctx.stroke();
  }
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(255,226,135,.78)", 1.2); glossyHighlight(ctx, x, y, radius, 0.8);
}

function drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, base: string, accent: string, spin: number) {
  drawGlass(ctx, x, y, radius, pulse, base, accent);
  ctx.save(); circle(ctx, x, y, radius * 0.9); ctx.clip(); ctx.translate(x, y); ctx.rotate(spin * 0.18);
  ctx.strokeStyle = "rgba(220,252,255,.72)"; ctx.lineWidth = Math.max(1.2, radius * 0.08);
  for (let band = -1; band <= 1; band += 1) {
    ctx.beginPath(); ctx.arc(0, band * radius * 0.28, radius * (0.58 + band * 0.04), 0.2, Math.PI * 1.2); ctx.stroke();
  }
  ctx.restore();
}

function drawRainbow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, spin: number) {
  groundShadow(ctx, x, y, radius, 0.3);
  const colors = ["#ff3b30", "#ffcc00", "#34c759", "#22d3ee", "#3478f6", "#af52de"];
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin * 0.25); ctx.shadowColor = "#7c74ff"; ctx.shadowBlur = 6 + pulse * 8;
  for (let index = 0; index < colors.length; index += 1) {
    ctx.fillStyle = colors[index]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, radius, index * Math.PI * 2 / colors.length, (index + 1) * Math.PI * 2 / colors.length); ctx.closePath(); ctx.fill();
  }
  ctx.restore(); rim(ctx, x, y, radius, "rgba(255,255,255,.74)", 1.3); glossyHighlight(ctx, x, y, radius, 0.82);
}

function drawPatchwork(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, pulse: number, spin: number) {
  groundShadow(ctx, x, y, radius, 0.32);
  const cells = [
    { color: "#22c8e8", points: [[-0.42, -0.2], [-0.12, -0.48], [0.26, -0.35], [0.38, 0.04], [0.08, 0.31], [-0.34, 0.2]] },
    { color: "#ff3cad", points: [[-0.98, -0.18], [-0.42, -0.2], [-0.34, 0.2], [-0.68, 0.56], [-1.04, 0.32]] },
    { color: "#ffb11b", points: [[-0.52, -0.92], [-0.12, -0.48], [-0.42, -0.2], [-0.84, -0.35]] },
    { color: "#2c70ed", points: [[-0.12, -0.48], [0.22, -0.91], [0.65, -0.62], [0.26, -0.35]] },
    { color: "#ef3340", points: [[0.26, -0.35], [0.65, -0.62], [1.02, -0.18], [0.83, 0.3], [0.38, 0.04]] },
    { color: "#21c56b", points: [[0.38, 0.04], [0.83, 0.3], [0.53, 0.83], [0.08, 0.31]] },
    { color: "#6346d8", points: [[0.08, 0.31], [0.53, 0.83], [0.02, 1.02], [-0.4, 0.71], [-0.68, 0.56], [-0.34, 0.2]] },
  ] as const;
  ctx.save();
  ctx.shadowColor = "#40d9f0";
  ctx.shadowBlur = 5 + pulse * 8;
  ctx.fillStyle = sphereGradient(ctx, x, y, radius, "#24c7e8", 0.38);
  circle(ctx, x, y, radius);
  ctx.fill();
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(spin * 0.22);
  for (const cell of cells) {
    ctx.beginPath();
    ctx.moveTo(cell.points[0][0] * radius, cell.points[0][1] * radius);
    for (let index = 1; index < cell.points.length; index += 1) {
      ctx.lineTo(cell.points[index][0] * radius, cell.points[index][1] * radius);
    }
    ctx.closePath();
    ctx.fillStyle = cell.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(18,35,68,.42)";
    ctx.lineWidth = Math.max(0.8, radius * 0.045);
    ctx.stroke();
  }
  const shade = ctx.createLinearGradient(-radius, -radius, radius, radius);
  shade.addColorStop(0, "rgba(255,255,255,.42)");
  shade.addColorStop(0.48, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(4,11,30,.5)");
  ctx.fillStyle = shade;
  circle(ctx, 0, 0, radius);
  ctx.fill();
  ctx.restore();
  rim(ctx, x, y, radius, "rgba(255,255,255,.68)", 1.15);
  glossyHighlight(ctx, x, y, radius, 0.7);
}

function paletteFor(style: BallStyle, point: MarblePoint, settings: StudioSettings) {
  const pointColor = point.color || settings.prismEnd;
  if (style === "chrome") return { base: "#a9b7c8", accent: pointColor };
  if (style === "glass") return { base: mixHex(settings.ballBaseColor, "#bcecff", 0.62), accent: mixHex(pointColor, "#6de6ff", 0.48) };
  if (style === "neon") return { base: mixHex(settings.ballBaseColor, pointColor, 0.5), accent: pointColor };
  if (style === "fire") return { base: "#ff5418", accent: "#ffd84a" };
  if (style === "water") return { base: "#36dff2", accent: "#d8fcff" };
  if (style === "flower") return { base: settings.ballBaseColor, accent: settings.ballStripeColor };
  if (style === "prism") return { base: mixHex(settings.prismStart, pointColor, 0.45), accent: mixHex(settings.prismEnd, pointColor, 0.38) };
  return { base: settings.ballBaseColor, accent: pointColor };
}

export function drawPresetMarble(
  ctx: CanvasRenderingContext2D,
  point: MarblePoint,
  cameraY: number,
  pulse: number,
  settings: StudioSettings,
) {
  const x = point.x;
  const y = point.y - cameraY;
  const radius = settings.ballSize * (1 + pulse * 0.055);
  const spin = point.x * 0.028 + point.y * 0.019;
  const style = settings.ballStyle;
  const { base, accent } = paletteFor(style, point, settings);
  const impact = Math.min(1, Math.max(0, pulse));

  // A tiny impact squash gives the collision some weight. It is intentionally
  // material-agnostic so every marble still reads as the selected style.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + impact * 0.075, 1 - impact * 0.065);
  ctx.translate(-x, -y);
  if (style === "classic") drawClassic(ctx, x, y, radius, pulse, base);
  else if (style === "chrome") drawChrome(ctx, x, y, radius, pulse, accent);
  else if (style === "glass") drawGlass(ctx, x, y, radius, pulse, base, accent);
  else if (style === "neon") drawNeon(ctx, x, y, radius, pulse, base, accent);
  else if (style === "prism") drawPrism(ctx, x, y, radius, pulse, base, accent, spin);
  else if (style === "flower") drawFlower(ctx, x, y, radius, pulse, base, accent, spin);
  else if (style === "fire") drawFire(ctx, x, y, radius, pulse);
  else if (style === "water") drawWater(ctx, x, y, radius, pulse, base, accent, spin);
  else if (style === "rainbow") drawRainbow(ctx, x, y, radius, pulse, spin);
  else if (style === "patchwork") drawPatchwork(ctx, x, y, radius, pulse, spin);
  else if (style === "multicolor-glass") drawMulticolorGlassMarble2D(ctx, x, y, radius, pulse, spin);
  else drawStriped(ctx, x, y, radius, pulse, base, settings.ballStripeColor, spin);
  ctx.restore();
  return true;
}
