import { Frame } from "../algorithms";
import { drawBars } from "./barRenderer";
import { drawCodePanel } from "./codePanelRenderer";
import { drawCountingSort } from "./countingSortRenderer";
import { drawGraph } from "./graphRenderer";
import { roundRect, shade } from "./shapes";
import { drawSortEssence } from "./sortEssenceRenderer";
import { THEMES, type Theme } from "./theme";

export { THEMES };
export type { Theme };

export type RenderOpts = {
  title: string;
  subtitle: string;
  theme: Theme;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  previousFrame?: Frame | null;
  transitionProgress?: number;
  algorithmId?: string;
};

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  opts: RenderOpts,
  width: number,
  height: number,
) {
  const { theme, title, subtitle, code, showCode, complexity } = opts;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bg);
  bgGrad.addColorStop(1, shade(theme.bg, -10));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const isPortrait = height >= width;
  const padding = Math.round(Math.min(width, height) * 0.04);
  const headerH = Math.round(height * (isPortrait ? 0.11 : 0.14));
  const codeH = showCode ? Math.floor(height * (isPortrait ? 0.4 : 0.45)) : 0;
  const chartTop = headerH;
  const chartBottom = height - codeH - padding;
  const chartH = chartBottom - chartTop;
  const chartW = width - padding * 2;

  drawHeader(ctx, title, subtitle, width, height, headerH, isPortrait, theme);
  if (complexity) drawComplexityBadges(ctx, complexity, width, height, padding);

  if (frame.graph) {
    drawGraph(ctx, frame, padding, chartTop, chartW, chartH, theme);
  } else if (frame.counting) {
    drawCountingSort(ctx, frame, padding, chartTop, chartW, chartH, theme);
  } else if (frame.arr && frame.arr.length) {
    if (opts.algorithmId && opts.algorithmId !== "custom") {
      drawSortEssence(ctx, frame, padding, chartTop, chartW, chartH, chartBottom, theme, {
        algorithmId: opts.algorithmId,
        previousFrame: opts.previousFrame,
        transitionProgress: opts.transitionProgress,
      });
    } else {
      drawBars(ctx, frame, padding, chartTop, chartW, chartH, chartBottom, theme, {
        previousFrame: opts.previousFrame,
        transitionProgress: opts.transitionProgress,
      });
    }
  }

  drawTarget(ctx, frame, padding, chartTop, height);

  if (showCode) {
    drawCodePanel(
      ctx,
      frame,
      code,
      padding,
      chartBottom + Math.round(padding * 0.5),
      width - padding * 2,
      codeH - Math.round(padding * 0.5) - padding / 2,
      theme,
      height,
    );
  }
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  subtitle: string,
  width: number,
  height: number,
  headerH: number,
  isPortrait: boolean,
  theme: Theme,
) {
  ctx.fillStyle = "#ffffff";
  const titlePx = Math.round(height * (isPortrait ? 0.045 : 0.06));
  const subPx = Math.round(titlePx * 0.55);
  ctx.font = `bold ${titlePx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, headerH * 0.5);
  ctx.fillStyle = theme.highlight;
  ctx.font = `500 ${subPx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(subtitle, width / 2, headerH * 0.5 + titlePx * 0.7);
}

function drawComplexityBadges(
  ctx: CanvasRenderingContext2D,
  complexity: NonNullable<RenderOpts["complexity"]>,
  width: number,
  height: number,
  padding: number,
) {
  const cPx = Math.max(14, Math.round(height * 0.018));
  ctx.font = `600 ${cPx}px ui-monospace, monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const parts: { label: string; value: string; color: string }[] = [
    { label: "Time", value: complexity.time, color: "#fde047" },
  ];
  if (complexity.worst && complexity.worst !== complexity.time)
    parts.push({ label: "Worst", value: complexity.worst, color: "#fb7185" });
  if (complexity.best && complexity.best !== complexity.time)
    parts.push({ label: "Best", value: complexity.best, color: "#86efac" });
  parts.push({ label: "Space", value: complexity.space, color: "#a5f3fc" });

  let x = width - padding;
  const y = padding + cPx + 75;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    const text = `${p.label}: ${p.value}`;
    const tw = ctx.measureText(text).width + 16;
    ctx.fillStyle = "rgba(15,23,42,0.7)";
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - tw, y - cPx * 0.85, tw, cPx * 1.7, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.fillText(text, x - 8, y);
    x -= tw + 8;
  }
  ctx.textBaseline = "alphabetic";
}

function drawTarget(ctx: CanvasRenderingContext2D, frame: Frame, padding: number, chartTop: number, height: number) {
  if (typeof frame.target === "undefined" || frame.target === null) return;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  const px = Math.round(height * 0.022);
  ctx.font = `600 ${px}px ui-monospace, monospace`;
  const result = frame.found != null ? `  →  ${frame.found >= 0 ? "found@" + frame.found : "not found"}` : "";
  ctx.fillText(`target = ${frame.target}${result}`, padding + 8, chartTop + 6 + px);
}
