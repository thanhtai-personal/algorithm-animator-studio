import { Frame } from "./algorithms";

export type Theme = {
  bg: string;
  bar: string;
  highlight: string;
  swap: string;
  sorted: string;
  pivot: string;
};

export const THEMES: Record<string, Theme> = {
  neon: { bg: "#0f0d1f", bar: "#94a3b8", highlight: "#facc15", swap: "#ec4899", sorted: "#22c55e", pivot: "#a855f7" },
  ocean: { bg: "#06121f", bar: "#5eead4", highlight: "#fbbf24", swap: "#f472b6", sorted: "#34d399", pivot: "#818cf8" },
  sunset: { bg: "#1a0d1f", bar: "#fda4af", highlight: "#fcd34d", swap: "#fb7185", sorted: "#86efac", pivot: "#c084fc" },
  mono: { bg: "#0a0a0a", bar: "#a3a3a3", highlight: "#fafafa", swap: "#ef4444", sorted: "#22c55e", pivot: "#3b82f6" },
};

export type RenderOpts = {
  title: string;
  subtitle: string;
  theme: Theme;
  code: string;
  showCode: boolean;
};

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  opts: RenderOpts,
  width: number,
  height: number,
) {
  const { theme, title, subtitle, code, showCode } = opts;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bg);
  bgGrad.addColorStop(1, shade(theme.bg, -10));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Layout: chart on top, code on bottom
  const padding = 48;
  const headerH = 220;
  const codeH = showCode ? Math.floor(height * 0.4) : 0;
  const chartTop = headerH;
  const chartBottom = height - codeH - padding;
  const chartH = chartBottom - chartTop;
  const chartW = width - padding * 2;

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 84px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, 110);
  ctx.fillStyle = theme.highlight;
  ctx.font = "500 44px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(subtitle, width / 2, 170);

  // Bars
  const arr = frame.arr;
  const max = Math.max(...arr, 1);
  const gap = Math.max(4, Math.floor(chartW / arr.length * 0.15));
  const barW = (chartW - gap * (arr.length - 1)) / arr.length;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    const h = (v / max) * (chartH - 60);
    const x = padding + i * (barW + gap);
    const y = chartBottom - h;
    let color = theme.bar;
    if (frame.sorted.includes(i)) color = theme.sorted;
    if (frame.highlight.includes(i)) color = theme.highlight;
    if (frame.swap.includes(i)) color = theme.swap;
    if (frame.pivot === i) color = theme.pivot;

    // rounded bar
    const r = Math.min(10, barW / 2);
    ctx.fillStyle = color;
    roundRect(ctx, x, y, barW, h, r);
    ctx.fill();

    // value label
    if (arr.length <= 30) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `600 ${Math.min(28, Math.floor(barW * 0.6))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + barW / 2, y - 10);
    }
  }

  // Code panel
  if (showCode) {
    const cx = padding;
    const cy = chartBottom + 24;
    const cw = width - padding * 2;
    const ch = codeH - 24 - padding / 2;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    roundRect(ctx, cx, cy, cw, ch, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Header bar
    ctx.fillStyle = "rgba(148,163,184,0.12)";
    roundRect(ctx, cx, cy, cw, 56, 24);
    ctx.fill();
    ctx.fillStyle = theme.highlight;
    ctx.beginPath();
    ctx.arc(cx + 28, cy + 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Code thuật toán (JS)", cx + 52, cy + 36);

    // Vars line (right side of header)
    const varsStr = Object.entries(frame.vars)
      .map(([k, v]) => `${k}=${v}`)
      .join("  ");
    if (varsStr) {
      ctx.fillStyle = theme.highlight;
      ctx.font = "500 24px ui-monospace, monospace";
      ctx.textAlign = "right";
      ctx.fillText(varsStr, cx + cw - 24, cy + 36);
    }

    // Code lines
    const lines = code.split("\n");
    const lineH = 30;
    const fontSize = 22;
    ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";
    const codeStartY = cy + 72;
    const maxLines = Math.floor((ch - 80) / lineH);

    // Center current line in viewport
    const current = frame.line;
    let startLine = Math.max(0, current - Math.floor(maxLines / 2));
    startLine = Math.min(startLine, Math.max(0, lines.length - maxLines));

    for (let i = 0; i < Math.min(maxLines, lines.length - startLine); i++) {
      const idx = startLine + i;
      const y = codeStartY + i * lineH;
      if (idx === current) {
        ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
        ctx.fillRect(cx + 12, y - 4, cw - 24, lineH);
      }
      // line number
      ctx.fillStyle = "rgba(148,163,184,0.5)";
      ctx.textAlign = "right";
      ctx.fillText(String(idx + 1).padStart(2, " "), cx + 56, y);
      // code
      ctx.fillStyle = idx === current ? "#fde68a" : "#cbd5e1";
      ctx.textAlign = "left";
      const text = lines[idx] ?? "";
      ctx.fillText(text, cx + 76, y);
    }
    ctx.textBaseline = "alphabetic";
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function shade(hex: string, percent: number) {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
