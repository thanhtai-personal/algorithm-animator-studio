import type { Frame } from "./algorithms";
import { drawBars } from "./barRenderer";
import { roundRect } from "./rendering/shapes";
import type { Theme } from "./rendering/theme";

type Options = {
  algorithmId: string;
  previousFrame?: Frame | null;
  transitionProgress?: number;
};

export function drawSortEssence(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  padding: number,
  chartTop: number,
  chartW: number,
  chartH: number,
  chartBottom: number,
  theme: Theme,
  options: Options,
) {
  const panelH = Math.min(Math.max(92, chartH * 0.24), 170);
  const barsBottom = chartBottom - panelH - Math.max(10, chartH * 0.025);
  const barsH = Math.max(120, barsBottom - chartTop);
  drawBars(ctx, frame, padding, chartTop, chartW, barsH, barsBottom, theme, options);

  const panelY = barsBottom + Math.max(10, chartH * 0.025);
  drawPanel(ctx, padding, panelY, chartW, panelH, titleFor(options.algorithmId), theme);
  const x = padding + 18;
  const y = panelY + 38;
  const w = chartW - 36;
  const h = panelH - 52;

  if (options.algorithmId === "heap") drawHeapLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "quick" || options.algorithmId === "intro") drawPartitionLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "merge" || options.algorithmId === "tim") drawMergeLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "radix") drawRadixLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "bucket") drawBucketLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "shell" || options.algorithmId === "comb") drawGapLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "cocktail") drawCocktailLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "gnome") drawGnomeLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "selection") drawSelectionLens(ctx, frame, x, y, w, h, theme);
  else if (options.algorithmId === "insertion") drawInsertionLens(ctx, frame, x, y, w, h, theme);
  else drawPassLens(ctx, frame, x, y, w, h, theme);
}

function drawHeapLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const heapSize = numberVar(frame, "n") ?? numberVar(frame, "end") ?? frame.arr.length;
  const levels = Math.ceil(Math.log2(Math.max(2, heapSize + 1)));
  const r = Math.max(10, Math.min(18, w / Math.max(10, heapSize) * 0.8));
  const pos = frame.arr.map((value, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const first = 2 ** level - 1;
    const count = 2 ** level;
    const slot = i - first + 0.5;
    return {
      value,
      x: x + (slot / count) * w,
      y: y + (level + 0.5) * (h / levels),
      active: frame.highlight.includes(i) || frame.swap.includes(i) || frame.pivot === i,
      sorted: i >= heapSize || frame.sorted.includes(i),
    };
  });
  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.32)";
  ctx.lineWidth = 2;
  for (let i = 1; i < heapSize; i++) {
    const parent = Math.floor((i - 1) / 2);
    ctx.beginPath(); ctx.moveTo(pos[parent].x, pos[parent].y); ctx.lineTo(pos[i].x, pos[i].y); ctx.stroke();
  }
  pos.slice(0, heapSize).forEach((node) => {
    ctx.fillStyle = node.active ? theme.highlight : node.sorted ? theme.sorted : theme.pivot;
    ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = `800 ${Math.max(10, r * 0.78)}px ui-monospace, monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(node.value), node.x, node.y + 1);
  });
  ctx.restore();
  drawSmallText(ctx, `heap size = ${heapSize}`, x + w - 6, y + 12, theme.highlight, "right");
}

function drawPartitionLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.3, w, h * 0.42, theme, (i) => {
    const lo = numberVar(frame, "lo"), hi = numberVar(frame, "hi");
    if (frame.pivot === i) return theme.pivot;
    if (lo != null && hi != null && i >= lo && i <= hi) return "rgba(250,204,21,0.85)";
    return "rgba(148,163,184,0.55)";
  });
  const mode = String(frame.vars.mode ?? "quick partition");
  const parts = [
    `mode=${mode}`,
    labelVar(frame, "lo"),
    labelVar(frame, "hi"),
    labelVar(frame, "j"),
    labelVar(frame, "depthLimit"),
    `pivot=${frame.pivot != null ? frame.arr[frame.pivot] : frame.vars.pivot ?? "-"}`,
  ].filter(Boolean);
  drawSmallText(ctx, parts.join("  "), x + 4, y + 16, theme.highlight, "left");
}

function drawMergeLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.35, w, h * 0.36, theme, (i) => {
    const lo = numberVar(frame, "lo") ?? numberVar(frame, "left") ?? numberVar(frame, "runStart");
    const mid = numberVar(frame, "mid");
    const hi = numberVar(frame, "hi") ?? numberVar(frame, "right") ?? numberVar(frame, "runEnd");
    if (lo != null && mid != null && i >= lo && i <= mid) return theme.highlight;
    if (mid != null && hi != null && i > mid && i <= hi) return theme.swap;
    if (lo != null && hi != null && i >= lo && i <= hi) return theme.pivot;
    return "rgba(148,163,184,0.55)";
  });
  const text = [
    labelVar(frame, "runStart"), labelVar(frame, "runEnd"), labelVar(frame, "left"),
    labelVar(frame, "mid"), labelVar(frame, "right"), labelVar(frame, "size"),
  ].filter(Boolean).join("  ");
  drawSmallText(ctx, text || "split into runs, then merge back", x + 4, y + 16, theme.highlight, "left");
}

function drawRadixLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const active = numberVar(frame, "bucket") ?? numberVar(frame, "digit");
  if (frame.buckets) drawBucketContents(ctx, frame.buckets.labels, frame.buckets.buckets, x, y + 18, w, h - 24, theme, active);
  else drawBuckets(ctx, 10, x, y + 18, w, h - 24, theme, active, (i) => String(i));
  drawSmallText(ctx, `exp=${frame.vars.exp ?? "-"}  digit=${frame.vars.digit ?? "-"}  phase=${frame.vars.phase ?? "-"}`, x + 4, y + 12, theme.highlight, "left");
}

function drawBucketLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const count = Math.max(1, Number(frame.vars.bucketCount ?? 1));
  if (frame.buckets) drawBucketContents(ctx, frame.buckets.labels, frame.buckets.buckets, x, y + 18, w, h - 24, theme, numberVar(frame, "bucketIndex"));
  else drawBuckets(ctx, count, x, y + 18, w, h - 24, theme, numberVar(frame, "bucketIndex"), (i) => `B${i}`);
  drawSmallText(ctx, `range ${frame.vars.min ?? "-"}..${frame.vars.max ?? "-"}  active=${frame.vars.bucketIndex ?? "-"}`, x + 4, y + 12, theme.highlight, "left");
}

function drawGapLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.38, w, h * 0.32, theme, (i) => frame.highlight.includes(i) ? theme.highlight : "rgba(148,163,184,0.55)");
  const [a, b] = frame.highlight.length >= 2 ? frame.highlight : [numberVar(frame, "i"), numberVar(frame, "j")].filter((n): n is number => n != null);
  if (a != null && b != null) drawIndexArc(ctx, x, y + h * 0.36, w, frame.arr.length, a, b, theme.swap);
  drawSmallText(ctx, `gap=${frame.vars.gap ?? "-"}  compare positions ${a ?? "-"} and ${b ?? "-"}`, x + 4, y + 16, theme.highlight, "left");
}

function drawCocktailLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.36, w, h * 0.34, theme, (i) => frame.highlight.includes(i) ? theme.highlight : frame.sorted.includes(i) ? theme.sorted : "rgba(148,163,184,0.55)");
  const direction = String(frame.vars.direction ?? "forward");
  const color = direction === "backward" ? theme.swap : theme.highlight;
  drawDirectionArrow(ctx, x + 12, y + h * 0.18, w - 24, direction === "backward" ? -1 : 1, color);
  drawSmallText(ctx, `start=${frame.vars.start ?? "-"}  end=${frame.vars.end ?? "-"}  direction=${direction}`, x + 4, y + 16, color, "left");
}

function drawGnomeLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.34, w, h * 0.36, theme, (i) => i === numberVar(frame, "index") ? theme.highlight : frame.highlight.includes(i) ? theme.swap : "rgba(148,163,184,0.55)");
  drawSmallText(ctx, `index=${frame.vars.index ?? "-"}  walk forward when ordered, step back after swap`, x + 4, y + 16, theme.highlight, "left");
}

function drawSelectionLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.34, w, h * 0.36, theme, (i) => i === numberVar(frame, "min") ? theme.swap : i === numberVar(frame, "i") ? theme.highlight : frame.sorted.includes(i) ? theme.sorted : "rgba(148,163,184,0.55)");
  drawSmallText(ctx, `scan unsorted region, min=${frame.vars.min ?? "-"}, place at i=${frame.vars.i ?? "-"}`, x + 4, y + 16, theme.highlight, "left");
}

function drawInsertionLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.34, w, h * 0.36, theme, (i) => i <= Number(frame.vars.i ?? -1) ? theme.sorted : frame.highlight.includes(i) ? theme.highlight : "rgba(148,163,184,0.55)");
  drawSmallText(ctx, `key=${frame.vars.key ?? "-"}  shift larger values right, insert at j+1`, x + 4, y + 16, theme.highlight, "left");
}

function drawPassLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  drawIndexStrip(ctx, frame, x, y + h * 0.34, w, h * 0.36, theme, (i) => frame.highlight.includes(i) ? theme.highlight : frame.sorted.includes(i) ? theme.sorted : "rgba(148,163,184,0.55)");
  drawSmallText(ctx, `i=${frame.vars.i ?? "-"}  j=${frame.vars.j ?? "-"}  compare adjacent values, grow sorted tail`, x + 4, y + 16, theme.highlight, "left");
}

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, theme: Theme) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 18px ui-sans-serif, system-ui";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(title, x + 18, y + 22);
  ctx.fillStyle = theme.highlight;
  ctx.beginPath(); ctx.arc(x + w - 22, y + 22, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawIndexStrip(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme, colorFor: (index: number) => string) {
  const n = frame.arr.length;
  const gap = Math.max(2, Math.min(8, w / n * 0.12));
  const cellW = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const cx = x + i * (cellW + gap);
    ctx.fillStyle = colorFor(i);
    roundRect(ctx, cx, y, cellW, h, Math.min(8, cellW / 2)); ctx.fill();
    if (n <= 32) {
      ctx.fillStyle = "#0f172a";
      ctx.font = `800 ${Math.max(9, Math.min(16, cellW * 0.36))}px ui-monospace, monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(i), cx + cellW / 2, y + h / 2);
    }
  }
  void theme;
}

function drawBuckets(ctx: CanvasRenderingContext2D, count: number, x: number, y: number, w: number, h: number, theme: Theme, active: number | undefined, label: (index: number) => string) {
  const gap = Math.max(4, Math.min(10, w / count * 0.1));
  const bw = (w - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const bx = x + i * (bw + gap);
    const on = active === i;
    ctx.fillStyle = on ? "rgba(250,204,21,0.24)" : "rgba(30,41,59,0.75)";
    ctx.strokeStyle = on ? theme.highlight : "rgba(148,163,184,0.35)";
    ctx.lineWidth = on ? 3 : 1.5;
    roundRect(ctx, bx, y, bw, h, 10); ctx.fill(); ctx.stroke();
    drawSmallText(ctx, label(i), bx + bw / 2, y + h / 2, on ? theme.highlight : "#cbd5e1", "center");
  }
}

function drawBucketContents(ctx: CanvasRenderingContext2D, labels: string[], buckets: number[][], x: number, y: number, w: number, h: number, theme: Theme, active?: number) {
  const count = Math.max(1, labels.length);
  const gap = Math.max(4, Math.min(10, w / count * 0.1));
  const bw = (w - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const bx = x + i * (bw + gap);
    const on = active === i;
    ctx.fillStyle = on ? "rgba(250,204,21,0.22)" : "rgba(30,41,59,0.74)";
    ctx.strokeStyle = on ? theme.highlight : "rgba(148,163,184,0.34)";
    ctx.lineWidth = on ? 3 : 1.5;
    roundRect(ctx, bx, y, bw, h, 10); ctx.fill(); ctx.stroke();
    drawSmallText(ctx, labels[i] ?? String(i), bx + bw / 2, y + 14, on ? theme.highlight : "#cbd5e1", "center");
    const items = buckets[i] ?? [];
    const maxRows = Math.max(1, Math.floor((h - 30) / 16));
    items.slice(-maxRows).forEach((value, row) => {
      drawSmallText(ctx, String(value), bx + bw / 2, y + 34 + row * 16, on ? "#fff" : "#c4b5fd", "center");
    });
  }
}

function drawIndexArc(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, a: number, b: number, color: string) {
  const cellW = w / Math.max(1, n);
  const ax = x + (a + 0.5) * cellW;
  const bx = x + (b + 0.5) * cellW;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(ax, y); ctx.quadraticCurveTo((ax + bx) / 2, y - Math.abs(bx - ax) * 0.18 - 18, bx, y); ctx.stroke();
  ctx.restore();
}

function drawDirectionArrow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, dir: 1 | -1, color: string) {
  const from = dir === 1 ? x : x + w;
  const to = dir === 1 ? x + w : x;
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(from, y); ctx.lineTo(to, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(to, y); ctx.lineTo(to - 12 * dir, y - 8); ctx.lineTo(to - 12 * dir, y + 8); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawSmallText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "700 15px ui-monospace, monospace";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function numberVar(frame: Frame, key: string) {
  const value = frame.vars[key];
  return typeof value === "number" ? value : undefined;
}

function labelVar(frame: Frame, key: string) {
  return frame.vars[key] == null ? "" : `${key}=${frame.vars[key]}`;
}

function titleFor(id: string) {
  const titles: Record<string, string> = {
    bubble: "Bubble pass: adjacent comparisons grow a sorted tail",
    selection: "Selection scan: find min, place into sorted prefix",
    insertion: "Insertion window: shift values, insert key",
    quick: "Quick partition: pivot splits left/right regions",
    merge: "Merge ranges: compare two sorted halves",
    heap: "Heap view: parent dominates children, max moves to tail",
    radix: "Radix buckets: route values by current digit",
    bucket: "Bucket ranges: distribute, sort each bucket, concatenate",
    shell: "Shell gaps: gapped insertion sort",
    cocktail: "Cocktail shaker: bubble both directions",
    comb: "Comb gap: shrink long-distance comparisons",
    gnome: "Gnome walk: step back when local order breaks",
    tim: "TimSort runs: insertion-sorted runs then merges",
    intro: "IntroSort hybrid: quick, insertion, heap fallback",
  };
  return titles[id] ?? "Sorting lens";
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
