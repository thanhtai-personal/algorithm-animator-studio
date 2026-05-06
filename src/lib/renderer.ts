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
  complexity?: { time: string; best?: string; worst?: string; space: string };
};

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  opts: RenderOpts,
  width: number,
  height: number,
) {
  const { theme, title, subtitle, code, showCode, complexity } = opts;

  // Background gradient
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

  // Header
  ctx.fillStyle = "#ffffff";
  const titlePx = Math.round(height * (isPortrait ? 0.045 : 0.06));
  const subPx = Math.round(titlePx * 0.55);
  ctx.font = `bold ${titlePx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(title, width / 2, headerH * 0.5);
  ctx.fillStyle = theme.highlight;
  ctx.font = `500 ${subPx}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(subtitle, width / 2, headerH * 0.5 + titlePx * 0.7);

  // Complexity badges (top-right)
  if (complexity) {
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

  if (frame.graph) {
    drawGraph(ctx, frame, padding, chartTop, chartW, chartH, theme);
  } else if (frame.arr && frame.arr.length) {
    drawBars(ctx, frame, padding, chartTop, chartW, chartH, chartBottom, theme);
  }

  if (typeof frame.target !== "undefined" && frame.target !== null) {
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    const px = Math.round(height * 0.022);
    ctx.font = `600 ${px}px ui-monospace, monospace`;
    ctx.fillText(`target = ${frame.target}` + (frame.found != null ? `  →  ${frame.found >= 0 ? "found@" + frame.found : "not found"}` : ""), padding + 8, chartTop + 6 + px);
  }

  if (showCode) {
    drawCodePanel(ctx, frame, code, padding, chartBottom + Math.round(padding * 0.5) , width - padding * 2, codeH - Math.round(padding * 0.5) - padding / 2, theme, height);
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  chartTop: number,
  chartW: number,
  chartH: number,
  chartBottom: number,
  theme: Theme,
) {
  const arr = frame.arr;
  const max = Math.max(...arr, 1);
  const gap = Math.max(2, Math.floor(chartW / arr.length * 0.15));
  const barW = (chartW - gap * (arr.length - 1)) / arr.length;
  // First pass: draw bars (lift swap bars upward for visibility)
  const swapLift = Math.min(40, chartH * 0.08);
  const positions: { x: number; y: number; w: number; h: number; v: number; isSwap: boolean }[] = [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    const h = (v / max) * (chartH - 60);
    const x = padding + i * (barW + gap);
    const isSwap = frame.swap.includes(i);
    const y = chartBottom - h - (isSwap ? swapLift : 0);
    positions.push({ x, y, w: barW, h, v, isSwap });

    let color = theme.bar;
    if (frame.sorted.includes(i)) color = theme.sorted;
    if (frame.highlight.includes(i)) color = theme.highlight;
    if (isSwap) color = theme.swap;
    if (frame.pivot === i) color = theme.pivot;
    const r = Math.min(10, barW / 2);

    if (isSwap) {
      ctx.save();
      ctx.shadowColor = theme.swap;
      ctx.shadowBlur = 30;
      ctx.fillStyle = color;
      roundRect(ctx, x, y, barW, h, r);
      ctx.fill();
      // bright outline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, barW * 0.06);
      roundRect(ctx, x, y, barW, h, r);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      roundRect(ctx, x, y, barW, h, r);
      ctx.fill();
    }

    if (arr.length <= 30) {
      ctx.fillStyle = isSwap ? "#ffffff" : "rgba(255,255,255,0.85)";
      ctx.font = `${isSwap ? "800" : "600"} ${Math.min(28, Math.floor(barW * 0.6))}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(String(v), x + barW / 2, y - 10);
    }
  }

  // Draw swap arrows between the two swap bars
  const swapped = positions.filter((p) => p.isSwap);
  if (swapped.length === 2) {
    const [a, b] = swapped[0].x < swapped[1].x ? [swapped[0], swapped[1]] : [swapped[1], swapped[0]];
    const ax = a.x + a.w / 2;
    const bx = b.x + b.w / 2;
    const topY = Math.min(a.y, b.y) - 20;
    drawSwapArrow(ctx, ax, bx, topY, theme.swap);
  }
  void chartTop;
}

function drawSwapArrow(ctx: CanvasRenderingContext2D, ax: number, bx: number, baseY: number, color: string) {
  const mid = (ax + bx) / 2;
  const arc = Math.max(24, Math.abs(bx - ax) * 0.35);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  // top arc a -> b
  ctx.beginPath();
  ctx.moveTo(ax, baseY);
  ctx.quadraticCurveTo(mid, baseY - arc, bx, baseY);
  ctx.stroke();
  // bottom arc b -> a (slightly lower)
  ctx.beginPath();
  ctx.moveTo(bx, baseY + 14);
  ctx.quadraticCurveTo(mid, baseY + 14 + arc * 0.6, ax, baseY + 14);
  ctx.stroke();
  ctx.shadowBlur = 0;
  // arrowheads
  const head = (x: number, y: number, dir: 1 | -1) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10 * dir, y - 8);
    ctx.lineTo(x - 10 * dir, y + 8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  head(bx, baseY, 1);
  head(ax, baseY + 14, -1);
  ctx.restore();
}

function drawGraph(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  top: number,
  w: number,
  h: number,
  theme: Theme,
) {
  const g = frame.graph!;
  const px = (n: { x: number; y: number }) => ({ x: padding + n.x * w, y: top + n.y * h });
  const isPathEdge = (a: number, b: number) =>
    !!g.pathEdges?.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

  // Task header (what the algorithm is solving)
  const taskText = String(frame.vars.task ?? "");
  if (taskText) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "600 22px ui-sans-serif, system-ui";
    const tw = ctx.measureText(taskText).width + 28;
    const bx = padding + w / 2 - tw / 2;
    const by = top + 4;
    ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.7)";
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, tw, 36, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#a5f3fc";
    ctx.textBaseline = "middle";
    ctx.fillText(taskText, padding + w / 2, by + 18);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  // edges
  ctx.lineWidth = 3;
  for (const e of g.edges) {
    const a = px(g.nodes[e.a]);
    const b = px(g.nodes[e.b]);
    const active = g.activeEdge && ((g.activeEdge[0] === e.a && g.activeEdge[1] === e.b) || (g.activeEdge[0] === e.b && g.activeEdge[1] === e.a));
    const onPath = isPathEdge(e.a, e.b);
    if (onPath) {
      ctx.save();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 9;
      ctx.shadowColor = "#fde047";
      ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = active ? theme.highlight : "rgba(148,163,184,0.5)";
      ctx.lineWidth = active ? 6 : 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (typeof e.w === "number") {
      // Position weight pill offset perpendicular to edge so it doesn't overlap the line/node
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len, ny = dx / len;
      const mx = (a.x + b.x) / 2 + nx * 14;
      const my = (a.y + b.y) / 2 + ny * 14;
      const label = String(e.w);
      ctx.font = "bold 20px ui-monospace, monospace";
      const tw = ctx.measureText(label).width;
      const pillW = tw + 22, pillH = 28;
      ctx.save();
      ctx.fillStyle = onPath ? "#fde047" : "#0f172a";
      ctx.strokeStyle = onPath ? "#0f172a" : "#fbbf24";
      ctx.lineWidth = 2;
      roundRect(ctx, mx - pillW / 2, my - pillH / 2, pillW, pillH, 14);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = onPath ? "#0f172a" : "#fde047";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my + 1);
      ctx.restore();
    }
  }
  // nodes
  for (const n of g.nodes) {
    const p = px(n);
    const visited = g.visited?.includes(n.id);
    const current = g.current === n.id;
    const isStart = g.start === n.id;
    const isEnd = g.end === n.id;
    let color = theme.bar;
    if (visited) color = theme.sorted;
    if (current) color = theme.highlight;
    if (isStart) color = "#22d3ee";
    if (isEnd) color = "#f43f5e";

    // outer ring for start/end
    if (isStart || isEnd) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(p.x, p.y, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(15,23,42,0.6)"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px ui-sans-serif, system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(n.label ?? String(n.id), p.x, p.y);
    if (g.dist && g.dist[n.id] !== undefined) {
      ctx.fillStyle = theme.highlight;
      ctx.font = "600 18px ui-monospace, monospace";
      ctx.fillText(String(g.dist[n.id]), p.x, p.y - 44);
    }
    // start/end badge
    if (isStart || isEnd) {
      ctx.fillStyle = color;
      ctx.font = "bold 14px ui-sans-serif, system-ui";
      ctx.fillText(isStart ? "START" : "END", p.x, p.y + 50);
    }
  }
  ctx.textBaseline = "alphabetic";

  // Result banner if pathEdges present
  if (g.pathEdges && g.pathEdges.length) {
    const text = String(frame.vars.label ?? "");
    if (text) {
      ctx.save();
      ctx.textAlign = "center";
      const fontSize = Math.max(18, Math.min(30, Math.floor(w / Math.max(28, text.length * 0.55))));
      ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui`;
      const lines = wrapText(ctx, text, w - 60);
      const lineH = fontSize + 6;
      const boxH = lines.length * lineH + 16;
      const tw = Math.min(w - 20, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 40);
      const bx = padding + w / 2 - tw / 2;
      const by = top + h - boxH - 8;
      ctx.fillStyle = "rgba(253, 224, 71, 0.95)";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      roundRect(ctx, bx, by, tw, boxH, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.textBaseline = "middle";
      lines.forEach((ln, i) => {
        ctx.fillText(ln, padding + w / 2, by + 8 + i * lineH + lineH / 2);
      });
      ctx.restore();
      ctx.textBaseline = "alphabetic";
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (ctx.measureText(trial).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = trial;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawCodePanel(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  code: string,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  theme: Theme,
  H: number,
) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  roundRect(ctx, cx, cy, cw, ch, 24);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.12)";
  roundRect(ctx, cx, cy, cw, 56, 24);
  ctx.fill();
  ctx.fillStyle = theme.highlight;
  ctx.beginPath(); ctx.arc(cx + 28, cy + 28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Code (JS)", cx + 52, cy + 36);

  const varsStr = Object.entries(frame.vars).map(([k, v]) => `${k}=${v}`).join("  ");
  if (varsStr) {
    ctx.fillStyle = theme.highlight;
    ctx.font = "500 22px ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.fillText(varsStr.slice(0, 80), cx + cw - 24, cy + 36);
  }

  const lines = code.split("\n");
  const fontSize = Math.max(16, Math.round(H * 0.013));
  const lineH = fontSize + 8;
  ctx.font = `${fontSize}px ui-monospace, "JetBrains Mono", monospace`;
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
      ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
      ctx.fillRect(cx + 12, y - 4, cw - 24, lineH);
    }
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.textAlign = "right";
    ctx.fillText(String(idx + 1).padStart(2, " "), cx + 56, y);
    ctx.fillStyle = idx === current ? "#fde68a" : "#cbd5e1";
    ctx.textAlign = "left";
    ctx.fillText(lines[idx] ?? "", cx + 76, y);
  }
  ctx.textBaseline = "alphabetic";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
