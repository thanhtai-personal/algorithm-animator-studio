import type { Frame } from "../algorithms";
import type { Lang } from "../i18n";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  top: number,
  w: number,
  h: number,
  theme: Theme,
  lang: Lang = "en",
) {
  const g = frame.graph!;
  const px = (n: { x: number; y: number }) => ({ x: padding + n.x * w, y: top + n.y * h });
  const isPathEdge = (a: number, b: number) =>
    !!g.pathEdges?.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

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
    if (isStart || isEnd) {
      ctx.fillStyle = color;
      ctx.font = "bold 14px ui-sans-serif, system-ui";
      ctx.fillText(isStart ? label(lang, "BẮT ĐẦU", "START") : label(lang, "KẾT THÚC", "END"), p.x, p.y + 50);
    }
  }
  ctx.textBaseline = "alphabetic";

  if (g.pathEdges && g.pathEdges.length) {
    drawResultBanner(ctx, frame, padding, top, w, h);
  }
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
}

function drawResultBanner(ctx: CanvasRenderingContext2D, frame: Frame, padding: number, top: number, w: number, h: number) {
  const text = String(frame.vars.label ?? "");
  if (!text) return;
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
