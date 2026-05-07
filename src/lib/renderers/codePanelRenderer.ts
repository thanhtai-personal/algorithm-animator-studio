import landTileUrl from "@/assets/sprites/land-tile.jpg";
import { LandTileMapSprite, type LandTileMap } from "@/lib/sprites/LandTileMapSprite";
import type { Frame } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type CodePanelStyle = "default" | "grass";
const landTileMapSprite = new LandTileMapSprite({ imageUrl: landTileUrl });
const PANEL_LAND_MAP: LandTileMap = {
  tileWidth: 42,
  rows: [{ height: 54, tiles: ["stone"] }],
};

export function drawCodePanel(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  code: string,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  theme: Theme,
  canvasHeight: number,
  style: CodePanelStyle = "default",
) {
  if (style === "grass") {
    drawGrassPanel(ctx, cx, cy, cw, ch);
  } else {
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    roundRect(ctx, cx, cy, cw, ch, 24);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(148,163,184,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  drawPanelHeader(ctx, cx, cy, cw, style);
  if (style === "grass") drawCodeReadableBackdrop(ctx, cx, cy, cw, ch);
  ctx.fillStyle = style === "grass" ? "#fef08a" : theme.highlight;
  ctx.beginPath(); ctx.arc(cx + 28, cy + 28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = style === "grass" ? "#ffffff" : "#e2e8f0";
  ctx.font = `${style === "grass" ? "800" : "600"} 26px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Code (JS)", cx + 52, cy + 36);

  const varsStr = Object.entries(frame.vars).map(([k, v]) => `${k}=${v}`).join("  ");
  if (varsStr) {
    ctx.fillStyle = style === "grass" ? "#facc15" : theme.highlight;
    ctx.font = `${style === "grass" ? "800" : "500"} 22px ui-monospace, monospace`;
    ctx.textAlign = "right";
    ctx.fillText(varsStr.slice(0, 80), cx + cw - 24, cy + 36);
  }

  const lines = code.split("\n");
  const fontSize = Math.max(16, Math.round(canvasHeight * 0.013));
  const lineH = fontSize + 8;
  ctx.font = `${style === "grass" ? "700" : "400"} ${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
  ctx.textBaseline = "top";
  const codeStartY = cy + 72;
  const maxLines = Math.floor((ch - 80) / lineH);
  const current = frame.line;
  let startLine = Math.max(0, current - Math.floor(maxLines / 2));
  startLine = Math.min(startLine, Math.max(0, lines.length - maxLines));
  for (let i = 0; i < Math.min(maxLines, lines.length - startLine); i++) {
    const idx = startLine + i;
    const y = codeStartY + i * lineH;
    if (idx === current) {
      ctx.fillStyle = style === "grass" ? "rgba(250, 204, 21, 0.28)" : "rgba(250, 204, 21, 0.18)";
      ctx.fillRect(cx + 12, y - 4, cw - 24, lineH);
    }
    ctx.fillStyle = style === "grass" ? "rgba(190, 242, 100, 0.72)" : "rgba(148,163,184,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(String(idx + 1).padStart(2, " "), cx + 56, y);
    ctx.fillStyle = style === "grass" ? (idx === current ? "#fef08a" : "#f8fafc") : (idx === current ? "#fde68a" : "#cbd5e1");
    ctx.textAlign = "left";
    ctx.fillText(lines[idx] ?? "", cx + 76, y);
  }
  ctx.textBaseline = "alphabetic";
}

function drawPanelHeader(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, style: CodePanelStyle) {
  if (style === "grass") {
    ctx.fillStyle = "rgba(7, 19, 13, 0.42)";
    ctx.fillRect(cx, cy, cw, 56);
    return;
  } else {
    ctx.fillStyle = "rgba(148,163,184,0.12)";
  }
  roundRect(ctx, cx, cy, cw, 56, 24);
  ctx.fill();
}

function drawGrassPanel(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, ch: number) {
  ctx.fillStyle = "#08110d";
  roundRect(ctx, cx, cy, cw, ch, 24);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, cx, cy, cw, ch, 24);
  ctx.clip();
  drawLandTileMap(ctx, cx, cy, cw, ch, PANEL_LAND_MAP, "#08110d");
  ctx.fillStyle = "rgba(2, 6, 23, 0.42)";
  ctx.fillRect(cx, cy, cw, ch);
  ctx.restore();
}

function drawCodeReadableBackdrop(ctx: CanvasRenderingContext2D, cx: number, cy: number, cw: number, ch: number) {
  const bodyX = cx + 12;
  const bodyY = cy + 66;
  const bodyW = cw - 24;
  const bodyH = Math.max(24, ch - 78);
  ctx.fillStyle = "rgba(2, 6, 23, 0.86)";
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(132, 204, 22, 0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLandTileMap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  map: LandTileMap,
  fallback: string,
) {
  ctx.fillStyle = fallback;
  ctx.fillRect(x, y, w, h);
  landTileMapSprite.drawMap(ctx, x, y, w, h, map);
}
