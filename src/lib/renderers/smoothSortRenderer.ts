import type { Frame, SmoothTree } from "../algorithms";
import { roundRect } from "./shapes";
import type { Theme } from "./theme";

export function drawSmoothSortLens(ctx: CanvasRenderingContext2D, frame: Frame, x: number, y: number, w: number, h: number, theme: Theme) {
  const state = frame.smooth;
  if (!state?.trees.length) {
    drawSmallText(ctx, "Leonardo heap forest is empty; sorted suffix is complete", x + 4, y + 14, theme.sorted, "left");
    return;
  }

  const stripY = y + h * 0.55;
  const stripH = Math.max(22, h * 0.2);
  drawTreeBands(ctx, state.trees, frame.arr.length, x, stripY, w, stripH, theme, new Set(state.activeRoots ?? []));
  drawRootRail(ctx, frame, state.trees, x, y + 28, w, h * 0.32, theme);

  const phase = state.phase ?? "grow";
  const text = phase === "merge"
    ? `merge adjacent Leonardo heaps -> L${frame.vars.newOrder ?? "-"}`
    : phase === "sift"
      ? `sift root=${frame.vars.root ?? "-"} against children; keep max at tree root`
      : phase === "trinkle"
        ? `trinkle roots so the rightmost root becomes the next maximum`
        : phase === "extract"
          ? `extract rightmost root, then split L${frame.vars.order ?? "-"} into children`
          : `grow Leonardo forest: ${frame.vars.trees ?? "-"}`;
  drawSmallText(ctx, text, x + 4, y + 14, phase === "extract" ? theme.sorted : theme.highlight, "left");
}

function drawTreeBands(
  ctx: CanvasRenderingContext2D,
  trees: SmoothTree[],
  n: number,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  activeRoots: Set<number>,
) {
  const gap = Math.max(2, Math.min(8, w / Math.max(1, n) * 0.12));
  const cellW = (w - gap * Math.max(0, n - 1)) / Math.max(1, n);
  for (const tree of trees) {
    const tx = x + tree.start * (cellW + gap);
    const tw = (tree.end - tree.start + 1) * cellW + (tree.end - tree.start) * gap;
    const active = activeRoots.has(tree.end);
    ctx.fillStyle = active ? "rgba(250,204,21,0.18)" : "rgba(30,41,59,0.72)";
    ctx.strokeStyle = active ? theme.highlight : "rgba(148,163,184,0.36)";
    ctx.lineWidth = active ? 3 : 1.5;
    roundRect(ctx, tx, y, tw, h, 8);
    ctx.fill();
    ctx.stroke();
    drawSmallText(ctx, `L${tree.order}`, tx + tw / 2, y + h / 2, active ? theme.highlight : "#cbd5e1", "center");
  }
}

function drawRootRail(ctx: CanvasRenderingContext2D, frame: Frame, trees: SmoothTree[], x: number, y: number, w: number, h: number, theme: Theme) {
  const activeRoots = new Set(frame.smooth?.activeRoots ?? []);
  const count = Math.max(1, trees.length);
  const gap = Math.max(5, Math.min(12, w / count * 0.12));
  const slotW = (w - gap * (count - 1)) / count;
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    const cx = x + i * (slotW + gap) + slotW / 2;
    const cy = y + h / 2;
    const active = activeRoots.has(tree.end);
    ctx.strokeStyle = i + 1 === trees.length ? theme.sorted : "rgba(148,163,184,0.34)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 15);
    ctx.lineTo(cx, y + h + 5);
    ctx.stroke();
    ctx.fillStyle = active ? theme.swap : i + 1 === trees.length ? theme.sorted : theme.pivot;
    ctx.beginPath();
    ctx.arc(cx, cy, active ? 16 : 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "800 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(frame.arr[tree.end]), cx, cy + 0.5);
    drawSmallText(ctx, `r${tree.end}`, cx, cy - 24, active ? theme.highlight : "rgba(226,232,240,0.72)", "center");
  }
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
