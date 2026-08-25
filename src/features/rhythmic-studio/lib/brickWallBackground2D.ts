import { buildBrickPattern } from "./brickWallPattern";

const wallLayers = new Map<string, HTMLCanvasElement>();

function createWallLayer(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, "#090a0c");
  base.addColorStop(0.52, "#111315");
  base.addColorStop(1, "#070809");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const brickWidth = Math.max(72, width * 0.24);
  const brickHeight = brickWidth * 0.39;
  const mortar = Math.max(2, Math.round(brickHeight * 0.085));
  for (const brick of buildBrickPattern(width, height, brickWidth, brickHeight)) {
    const level = 19 + brick.tone;
    const x = brick.x + mortar;
    const y = brick.y + mortar;
    const w = brick.width - mortar * 1.7;
    const h = brick.height - mortar * 1.65;
    const face = ctx.createLinearGradient(x, y, x, y + h);
    face.addColorStop(0, `rgb(${level + 9},${level + 9},${level + 10})`);
    face.addColorStop(0.42, `rgb(${level + 2},${level + 3},${level + 4})`);
    face.addColorStop(1, `rgb(${Math.max(8, level - 7)},${Math.max(9, level - 6)},${Math.max(10, level - 5)})`);
    ctx.fillStyle = face;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,.045)";
    ctx.fillRect(x + 1, y + 1, Math.max(0, w - 2), 1);
    if (brick.wear > 0.66) {
      ctx.fillStyle = `rgba(0,0,0,${0.035 + brick.wear * 0.05})`;
      ctx.fillRect(x + w * brick.wear * 0.56, y + h * 0.24, w * 0.22, Math.max(1, h * 0.1));
    }
  }
  return canvas;
}

function wallLayer(width: number, height: number) {
  const key = `${width}x${height}`;
  const cached = wallLayers.get(key);
  if (cached) return cached;
  const layer = createWallLayer(width, height);
  wallLayers.set(key, layer);
  if (wallLayers.size > 3) wallLayers.delete(wallLayers.keys().next().value as string);
  return layer;
}

export function drawBrickWallBackground2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pulse: number,
  timeMs: number,
) {
  ctx.drawImage(wallLayer(width, height), 0, 0);
  const drift = Math.sin(timeMs / 2_800) * width * 0.025;
  const haloOpacity = 0.07 + Math.min(1, pulse) * 0.13;
  const halos = [
    { x: width * 0.28 + drift, y: height * 0.24, radius: height * 0.3 },
    { x: width * 0.72 - drift, y: height * 0.63, radius: height * 0.34 },
  ];
  for (const halo of halos) {
    const glow = ctx.createRadialGradient(halo.x, halo.y, 0, halo.x, halo.y, halo.radius);
    glow.addColorStop(0, `rgba(255,32,24,${haloOpacity})`);
    glow.addColorStop(0.34, `rgba(180,8,10,${haloOpacity * 0.42})`);
    glow.addColorStop(1, "rgba(80,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
}
