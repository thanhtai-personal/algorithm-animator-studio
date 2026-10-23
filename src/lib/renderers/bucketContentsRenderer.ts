import { roundRect } from "./shapes";
import type { Theme } from "./theme";

type Motion = {
  value: number;
  fromBucket: number;
  fromRow: number;
  toBucket: number;
  toRow: number;
};

export function drawBucketContents(
  ctx: CanvasRenderingContext2D,
  labels: string[],
  buckets: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  theme: Theme,
  active?: number,
  previousBuckets?: number[][],
  transitionProgress = 1,
) {
  const count = Math.max(1, labels.length);
  const gap = Math.max(4, Math.min(10, w / count * 0.1));
  const bw = (w - gap * (count - 1)) / count;
  const maxRows = Math.max(1, Math.floor((h - 30) / 16));
  const motions = transitionProgress < 1 ? findMotions(previousBuckets, buckets).slice(0, 10) : [];
  const hiddenTargets = buildHiddenTargetCounts(motions);
  const displayBuckets = buckets.map((bucket, bucketIndex) => hideMotionTargets(bucket, bucketIndex, hiddenTargets));

  for (let i = 0; i < count; i++) {
    const bx = x + i * (bw + gap);
    const on = active === i;
    ctx.fillStyle = on ? "rgba(250,204,21,0.22)" : "rgba(30,41,59,0.74)";
    ctx.strokeStyle = on ? theme.highlight : "rgba(148,163,184,0.34)";
    ctx.lineWidth = on ? 3 : 1.5;
    roundRect(ctx, bx, y, bw, h, 10);
    ctx.fill();
    ctx.stroke();
    drawSmallText(ctx, labels[i] ?? String(i), bx + bw / 2, y + 14, on ? theme.highlight : "#cbd5e1", "center");
    const items = displayBuckets[i] ?? [];
    items.slice(-maxRows).forEach((value, row) => {
      drawSmallText(ctx, String(value), bx + bw / 2, y + 34 + row * 16, on ? "#fff" : "#c4b5fd", "center");
    });
  }

  motions.forEach((motion) => {
    const from = itemPosition(motion.fromBucket, motion.fromRow, x, y, bw, gap, maxRows);
    const to = itemPosition(motion.toBucket, motion.toRow, x, y, bw, gap, maxRows);
    const t = easeInOut(transitionProgress);
    drawMovingItem(
      ctx,
      String(motion.value),
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 18,
      theme.swap,
    );
  });
}

function findMotions(previousBuckets: number[][] | undefined, buckets: number[][]) {
  if (!previousBuckets) return [];
  const motions: Motion[] = [];
  const bucketCount = Math.max(previousBuckets.length, buckets.length);
  const values = new Set<number>();
  for (const bucket of previousBuckets) for (const value of bucket) values.add(value);
  for (const bucket of buckets) for (const value of bucket) values.add(value);

  values.forEach((value) => {
    const removed: Array<{ bucket: number; row: number }> = [];
    const added: Array<{ bucket: number; row: number }> = [];
    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex++) {
      const prev = previousBuckets[bucketIndex] ?? [];
      const next = buckets[bucketIndex] ?? [];
      const prevCount = prev.filter((item) => item === value).length;
      const nextCount = next.filter((item) => item === value).length;
      for (let n = 0; n < prevCount - nextCount; n++) removed.push({ bucket: bucketIndex, row: lastIndexOfOccurrence(prev, value, n) });
      for (let n = 0; n < nextCount - prevCount; n++) added.push({ bucket: bucketIndex, row: lastIndexOfOccurrence(next, value, n) });
    }
    while (removed.length && added.length) {
      const from = removed.shift()!;
      const to = added.shift()!;
      if (from.bucket !== to.bucket) motions.push({ value, fromBucket: from.bucket, fromRow: from.row, toBucket: to.bucket, toRow: to.row });
    }
  });
  return motions;
}

function buildHiddenTargetCounts(motions: Motion[]) {
  const hidden = new Map<string, number>();
  motions.forEach((motion) => {
    const key = `${motion.toBucket}:${motion.value}`;
    hidden.set(key, (hidden.get(key) ?? 0) + 1);
  });
  return hidden;
}

function hideMotionTargets(bucket: number[], bucketIndex: number, hidden: Map<string, number>) {
  const remaining = new Map(hidden);
  return bucket.filter((value) => {
    const key = `${bucketIndex}:${value}`;
    const count = remaining.get(key) ?? 0;
    if (count <= 0) return true;
    remaining.set(key, count - 1);
    return false;
  });
}

function lastIndexOfOccurrence(values: number[], value: number, occurrenceFromEnd: number) {
  let seen = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== value) continue;
    if (seen === occurrenceFromEnd) return i;
    seen++;
  }
  return Math.max(0, values.length - 1);
}

function itemPosition(bucketIndex: number, row: number, x: number, y: number, bw: number, gap: number, maxRows: number) {
  const visibleRow = Math.max(0, Math.min(maxRows - 1, row));
  return {
    x: x + bucketIndex * (bw + gap) + bw / 2,
    y: y + 34 + visibleRow * 16,
  };
}

function drawMovingItem(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.font = "900 16px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
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

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
