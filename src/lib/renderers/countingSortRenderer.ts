import type { Frame } from "../algorithms";
import { getSprite, spriteForWeight, weightForValue, type AnimalColumnSettings } from "../animalColumns";
import type { Lang } from "../i18n";
import { drawAnimalColumns } from "./animalColumnRenderer";
import type { Theme } from "./theme";

type Bar = { x: number; y: number; w: number; h: number; cx: number; top: number; value: number };

export function drawCountingSort(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  opts: {
    animalColumns?: AnimalColumnSettings;
    previousFrame?: Frame | null;
    transitionProgress?: number;
    lang?: Lang;
  } = {},
) {
  const state = frame.counting;
  if (!state) return;
  const lang = opts.lang ?? "en";
  const isPigeonhole = frame.vars.kind === "pigeonhole";
  const animalMode = opts.animalColumns?.mode === "animal";

  const gap = Math.max(12, h * 0.04);
  const topH = h * 0.48;
  const bottomH = h - topH - gap;
  const topY = y;
  const bottomY = y + topH + gap;
  const outputValues = state.phase === "write" || state.phase === "done" ? frame.arr : state.source;

  drawSection(ctx, x, topY, w, topH, isPigeonhole && state.phase === "init" ? label(lang, "Bước 1: tìm min/max từ input", "Step 1: find min/max from input") : state.phase === "write" ? label(lang, "Biểu đồ cũ: output đã sort", "Old chart: sorted output") : label(lang, "Biểu đồ cũ: giá trị ban đầu", "Old chart: original values"));
  drawSection(ctx, x, bottomY, w, bottomH, isPigeonhole ? label(lang, "Các hole: min..max + số lượng", "Holes: min..max + counts") : state.phase === "sort" ? label(lang, "Biểu đồ mới: giá trị duy nhất đã sort", "New chart: unique values sorted") : label(lang, "Biểu đồ mới: giá trị duy nhất + số lượng", "New chart: unique values + counts"));

  const outputChart = { x: x + 18, y: topY + 42, w: w - 36, h: topH - 58 };
  const outputBars = layoutBars(outputValues, outputChart.x, outputChart.y, outputChart.w, outputChart.h - 24);
  if (animalMode && opts.animalColumns) {
    const animalFrame = {
      ...frame,
      arr: outputValues,
      highlight: (state.phase === "collect" || state.phase === "init") && state.activeSourceIndex != null ? [state.activeSourceIndex] : [],
      swap: state.phase === "write" && state.activeOutputIndex != null ? [state.activeOutputIndex] : [],
      sorted: state.phase === "write" ? frame.sorted : [],
    };
    drawAnimalColumns(ctx, animalFrame, outputChart.x, outputChart.y, outputChart.w, outputChart.h, outputChart.y + outputChart.h, theme, {
      previousFrame: opts.previousFrame,
      transitionProgress: opts.transitionProgress,
      labelMinY: outputChart.y + 2,
      settings: opts.animalColumns,
    });
  } else {
    drawValueChart(ctx, outputValues, outputChart.x, outputChart.y, outputChart.w, outputChart.h, {
      theme,
      activeIndex: state.phase === "collect" || state.phase === "init" ? state.activeSourceIndex : state.activeOutputIndex,
      sorted: frame.sorted,
      dimAfter: state.phase === "write" ? frame.sorted.length : undefined,
    });
  }
  const uniqueChart = { x: x + 18, y: bottomY + 42, w: w - 36, h: bottomH - 58 };
  const uniqueBars = animalMode && opts.animalColumns
    ? drawUniqueAnimalChart(ctx, state.uniqueValues, state.counts, uniqueChart.x, uniqueChart.y, uniqueChart.w, uniqueChart.h, {
      theme,
      activeIndex: state.activeUniqueIndex,
      compareIndex: state.phase === "sort" ? state.activeOutputIndex : undefined,
      previousValues: opts.previousFrame?.counting?.phase === "sort" ? opts.previousFrame.counting.uniqueValues : undefined,
      settings: opts.animalColumns,
      swapIndices: state.phase === "sort" ? frame.swap : [],
      transitionProgress: opts.transitionProgress,
    })
    : drawUniqueChart(ctx, state.uniqueValues, state.counts, uniqueChart.x, uniqueChart.y, uniqueChart.w, uniqueChart.h, {
      theme,
      activeIndex: state.activeUniqueIndex,
    });

  const phaseText = phaseLabel(state.phase, lang, frame);
  ctx.save();
  ctx.fillStyle = theme.highlight;
  ctx.font = "700 18px ui-monospace, monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(phaseText, x + w - 20, topY + 22);
  ctx.restore();

  if ((state.phase === "collect" || state.phase === "init") && state.activeSourceIndex != null && state.activeUniqueIndex != null) {
    if (animalMode) {
      drawCountingAnimalHop(ctx, outputBars[state.activeSourceIndex], uniqueBars[state.activeUniqueIndex], state.movingValue, opts.transitionProgress ?? 1, true);
    } else {
      drawMoveArrow(ctx, outputBars[state.activeSourceIndex], uniqueBars[state.activeUniqueIndex], theme.highlight, state.movingValue);
    }
  }
  if (state.phase === "write" && state.activeOutputIndex != null && state.activeUniqueIndex != null) {
    if (animalMode) {
      drawCountingAnimalHop(ctx, uniqueBars[state.activeUniqueIndex], outputBars[state.activeOutputIndex], state.movingValue, opts.transitionProgress ?? 1, false);
    } else {
      drawMoveArrow(ctx, uniqueBars[state.activeUniqueIndex], outputBars[state.activeOutputIndex], theme.swap, state.movingValue);
    }
  }
}

function drawSection(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.68)";
  ctx.strokeStyle = "rgba(148, 163, 184, 0.24)";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 18px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, x + 18, y + 22);
  ctx.restore();
}

function drawValueChart(
  ctx: CanvasRenderingContext2D,
  values: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { theme: Theme; activeIndex?: number; sorted?: number[]; dimAfter?: number },
) {
  const bars = layoutBars(values, x, y, w, h - 24);
  bars.forEach((bar, i) => {
    const active = opts.activeIndex === i;
    const sorted = opts.sorted?.includes(i);
    const dim = opts.dimAfter != null && i >= opts.dimAfter;
    drawBar(ctx, bar, active ? opts.theme.highlight : sorted ? opts.theme.sorted : opts.theme.bar, active, dim);
    drawLabel(ctx, String(bar.value), bar.cx, y + h - 6, active ? opts.theme.highlight : "#cbd5e1");
  });
  return bars;
}

function drawUniqueChart(
  ctx: CanvasRenderingContext2D,
  values: number[],
  counts: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { theme: Theme; activeIndex?: number },
) {
  const items = values.map((value, i) => ({ value, count: counts[i] ?? 0, originalIndex: i }));
  const bars = layoutBars(items.map((item) => item.value), x, y, w, h - 38);
  const byOriginalIndex: Bar[] = [];
  items.forEach((item, index) => {
    const bar = bars[index];
    byOriginalIndex[item.originalIndex] = bar;
    if (item.count < 0) return;
    const active = opts.activeIndex === item.originalIndex;
    const empty = item.count <= 0;
    drawBar(ctx, bar, empty ? "rgba(148,163,184,0.5)" : active ? opts.theme.swap : opts.theme.pivot, active && !empty, empty);
    drawLabel(ctx, String(item.value), bar.cx, y + h - 24, empty ? "rgba(221,214,254,0.45)" : active ? opts.theme.swap : "#ddd6fe");
    drawCountBadge(ctx, bar.cx, y + h - 7, item.count, empty ? "rgba(148,163,184,0.5)" : active ? opts.theme.highlight : opts.theme.sorted, empty);
  });
  return byOriginalIndex;
}

function drawUniqueAnimalChart(
  ctx: CanvasRenderingContext2D,
  values: number[],
  counts: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  opts: {
    theme: Theme;
    activeIndex?: number;
    compareIndex?: number;
    previousValues?: number[];
    settings: AnimalColumnSettings;
    swapIndices?: number[];
    transitionProgress?: number;
  },
) {
  const bars = layoutAnimalSlots(values, x, y, w, h);
  const animalFrame: Frame = {
    arr: values,
    highlight: [opts.activeIndex, opts.compareIndex].filter((index): index is number => index != null),
    swap: opts.swapIndices ?? [],
    sorted: counts.map((count, index) => count <= 0 ? index : -1).filter((index) => index >= 0),
    pivot: null,
    line: 0,
    vars: {},
    event: opts.swapIndices?.length === 2 ? "swap" : null,
  };
  const previousFrame = opts.previousValues ? { ...animalFrame, arr: opts.previousValues } : undefined;
  drawAnimalColumns(ctx, animalFrame, x, y, w, h, y + h, opts.theme, {
    previousFrame,
    settings: opts.settings,
    transitionProgress: opts.transitionProgress,
    labelMinY: y + 2,
  });
  bars.forEach((bar, index) => {
    const active = opts.activeIndex === index;
    const empty = (counts[index] ?? 0) <= 0;
    drawCountBadge(ctx, bar.cx, y + h - 9, counts[index] ?? 0, empty ? "rgba(148,163,184,0.5)" : active ? opts.theme.highlight : opts.theme.sorted, empty);
  });
  return bars;
}

function layoutBars(values: number[], x: number, y: number, w: number, h: number): Bar[] {
  if (!values.length) return [];
  const maxAbs = Math.max(...values.map((n) => Math.abs(n)), 1);
  const gap = Math.max(3, Math.min(10, w / values.length * 0.12));
  const barW = Math.max(6, (w - gap * (values.length - 1)) / values.length);
  return values.map((value, i) => {
    const bh = Math.max(8, Math.abs(value) / maxAbs * (h - 10));
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    return { x: bx, y: by, w: barW, h: bh, cx: bx + barW / 2, top: by, value };
  });
}

function layoutAnimalSlots(values: number[], x: number, y: number, w: number, h: number): Bar[] {
  if (!values.length) return [];
  const landH = 100;
  const baseline = y + h - landH;
  const gap = Math.max(8, Math.floor((w / values.length) * 0.28));
  const slotW = (w - gap * (values.length - 1)) / values.length;
  const labelReserve = values.length <= 30 ? Math.min(76, Math.max(46, h * 0.22)) : 0;
  const animalAreaH = Math.max(30, h - landH - labelReserve);
  const maxAnimalH = Math.max(30, Math.min(animalAreaH, slotW * 4.4));
  const minAnimalH = Math.max(24, Math.min(maxAnimalH * 0.32, slotW * 1.5));
  return values.map((value, index) => {
    const weight = weightForValue(value);
    const animalH = minAnimalH + ((weight - 1) / 19) * (maxAnimalH - minAnimalH);
    const bx = x + index * (slotW + gap);
    const by = baseline - animalH;
    return { x: bx, y: by, w: slotW, h: animalH, cx: bx + slotW / 2, top: by, value };
  });
}

function drawBar(ctx: CanvasRenderingContext2D, bar: Bar | undefined, color: string, active: boolean, dim: boolean) {
  if (!bar) return;
  ctx.save();
  ctx.globalAlpha = dim ? 0.35 : 1;
  ctx.fillStyle = color;
  if (active) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, bar.x, bar.y, bar.w, bar.h, Math.min(10, bar.w / 2));
  ctx.fill();
  if (active) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    roundRect(ctx, bar.x, bar.y, bar.w, bar.h, Math.min(10, bar.w / 2));
    ctx.stroke();
  }
  ctx.restore();
}

function drawMoveArrow(ctx: CanvasRenderingContext2D, from: Bar | undefined, to: Bar | undefined, color: string, value?: number) {
  if (!from || !to) return;
  const midY = (from.top + to.top) / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(from.cx, from.top);
  ctx.bezierCurveTo(from.cx, midY, to.cx, midY, to.cx, to.top);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc((from.cx + to.cx) / 2, midY, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "800 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value ?? ""), (from.cx + to.cx) / 2, midY + 1);
  ctx.restore();
}

function drawCountingAnimalHop(
  ctx: CanvasRenderingContext2D,
  from: Bar | undefined,
  to: Bar | undefined,
  value: number | undefined,
  progress: number,
  roundTrip: boolean,
) {
  if (!from || !to || value == null) return;
  const clamped = Math.max(0, Math.min(1, progress));
  const t = roundTrip ? (clamped <= 0.5 ? clamped * 2 : (1 - clamped) * 2) : clamped;
  const arc = Math.sin(t * Math.PI) * Math.min(90, Math.abs(to.top - from.top) * 0.28);
  const x = from.cx + (to.cx - from.cx) * t;
  const y = from.top + (to.top - from.top) * t - arc;
  const weight = weightForValue(value);
  const entry = spriteForWeight(weight);
  const sprite = entry ? getSprite(entry) : null;
  const size = Math.max(42, Math.min(78, Math.max(from.w, to.w) * 2.1));

  if (sprite) {
    sprite.setAction("jump");
    sprite.update(1000 / 30);
  }

  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#020617";
  ctx.beginPath();
  ctx.ellipse(x, Math.max(from.top, to.top) + 8, size * 0.32, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const drawn = sprite?.draw(ctx, x - size / 2, y - size, { width: size, height: size });
  if (!drawn) {
    ctx.save();
    ctx.fillStyle = "#f97316";
    ctx.strokeStyle = "#fff7ed";
    ctx.lineWidth = 2;
    roundRect(ctx, x - size / 2, y - size, size, size, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111827";
    ctx.font = "900 18px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value), x, y - size / 2);
    ctx.restore();
  }
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "800 15px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCountBadge(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, color: string, empty = false) {
  ctx.save();
  ctx.globalAlpha = empty ? 0.42 : 1;
  ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x - 15, y - 11, 30, 22, 11);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "800 14px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), x, y + 1);
  ctx.restore();
}

function phaseLabel(phase: NonNullable<Frame["counting"]>["phase"], lang: Lang, frame: Frame) {
  if (frame.vars.kind === "pigeonhole" && phase === "init") return `${label(lang, "tạo hole", "create hole")} ${frame.vars.formula ?? ""}`.trim();
  if (frame.vars.kind === "pigeonhole" && phase === "collect") return `${label(lang, "xác định hole", "locate hole")} ${frame.vars.formula ?? ""}`.trim();
  if (frame.vars.kind === "pigeonhole" && phase === "write") return label(lang, "đọc hole theo thứ tự", "read holes in order");
  if (phase === "collect") return label(lang, "gom giá trị duy nhất", "collect unique values");
  if (phase === "sort") return label(lang, "sort biểu đồ duy nhất", "sort unique chart");
  if (phase === "write") return label(lang, "ghi ngược + giảm count", "move back + decrement count");
  return label(lang, "xong", "done");
}

function label(lang: Lang, vi: string, en: string) {
  return lang === "vi" ? vi : en;
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
