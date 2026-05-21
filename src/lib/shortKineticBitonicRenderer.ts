import { withTextShadow } from "./canvasText";
import { roundRect } from "./renderers/shapes";
import type { ShortKineticParams } from "./shortKineticTypographyRenderer";

type Beat = {
  kicker: string;
  main: string;
  sub: string;
  accent: string;
  mode: "intro" | "split" | "compare" | "swap" | "merge" | "done";
};

export function renderShortKineticBitonic(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number, h: number) {
  const beat = getBeat(params);
  drawMeta(ctx, params, w);
  drawBeatText(ctx, beat, params.transitionProgress, w, h);
  drawNetwork(ctx, params, beat, w, h);
  drawFooter(ctx, params, beat.accent, w, h);
}

function getBeat(params: ShortKineticParams): Beat {
  const vi = params.lang === "vi";
  const frame = params.frame;
  const dir = String(frame.vars.dir ?? "asc");
  const pair = frame.swap.length >= 2 ? frame.swap : frame.highlight;
  const a = pair[0] ?? 0;
  const b = pair[1] ?? Math.min(a + 1, frame.arr.length - 1);
  const previous = params.previousFrame?.arr.length === frame.arr.length ? params.previousFrame : null;
  const left = previous?.arr[a] ?? frame.arr[a] ?? "-";
  const right = previous?.arr[b] ?? frame.arr[b] ?? "-";
  const wrong = dir === "desc" ? Number(left) < Number(right) : Number(left) > Number(right);
  const dirText = dir === "desc" ? "DESC" : "ASC";

  if (params.frameIndex === 0) return {
    kicker: "BITONIC SORT",
    main: vi ? "TĂNG / GIẢM" : "UP / DOWN",
    sub: vi ? "Hai hướng tạo dãy bitonic" : "Two directions build a bitonic sequence",
    accent: "#38bdf8",
    mode: "intro",
  };
  if (params.frameIndex >= params.frameCount - 2 || frame.sorted.length === frame.arr.length) return {
    kicker: vi ? "KẾT QUẢ" : "RESULT",
    main: "SORTED",
    sub: vi ? "Network compare-swap đã khép lại" : "The compare-swap network is complete",
    accent: "#4ade80",
    mode: "done",
  };
  if (frame.event === "swap") return {
    kicker: dirText,
    main: `${left} ${dir === "desc" ? "<" : ">"} ${right}`,
    sub: vi ? `Sai hướng ${dirText}, đổi chỗ` : `Wrong ${dirText} direction, swap`,
    accent: "#fb7185",
    mode: "swap",
  };
  if (frame.event === "compare") return {
    kicker: `${dirText} GAP ${frame.vars.gap ?? Math.abs(b - a)}`,
    main: `${left} ${wrong ? (dir === "desc" ? "<" : ">") : (dir === "desc" ? ">=" : "<=")} ${right}`,
    sub: wrong ? (vi ? "Cần swap để đúng hướng" : "Swap to match direction") : (vi ? "Đúng hướng, giữ nguyên" : "Correct direction, keep"),
    accent: wrong ? "#fb7185" : "#4ade80",
    mode: "compare",
  };
  if (String(frame.vars.stage ?? "") === "split") return {
    kicker: vi ? "CHIA HƯỚNG" : "SPLIT DIRECTIONS",
    main: "ASC / DESC",
    sub: vi ? "Nửa trái tăng, nửa phải giảm" : "Left rises, right falls",
    accent: "#facc15",
    mode: "split",
  };
  return {
    kicker: vi ? "MERGE BITONIC" : "BITONIC MERGE",
    main: `GAP ${frame.vars.gap ?? "-"}`,
    sub: vi ? "Gap lớn rồi nhỏ dần" : "Large gaps shrink step by step",
    accent: "#38bdf8",
    mode: "merge",
  };
}

function drawMeta(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "800 34px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 34, () => ctx.fillText(params.title || params.algoName, w / 2, 76));
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "600 23px ui-sans-serif, system-ui, sans-serif";
  const sub = params.lang === "vi" ? "Network sort: gap, hướng, compare-swap" : "Network sort: gap, direction, compare-swap";
  withTextShadow(ctx, 23, () => ctx.fillText(sub, w / 2, 112));
}

function drawBeatText(ctx: CanvasRenderingContext2D, beat: Beat, local: number, w: number, h: number) {
  const enter = easeOutBack(Math.min(1, local * 1.25));
  const shake = beat.mode === "swap" ? Math.sin(local * Math.PI * 6) * 5 : 0;
  ctx.save();
  ctx.translate(w / 2 + shake, h * 0.28 + (1 - enter) * 96);
  ctx.scale(0.78 + enter * 0.22, 0.78 + enter * 0.22);
  ctx.textAlign = "center";
  ctx.fillStyle = beat.accent;
  ctx.font = "950 44px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 44, () => ctx.fillText(beat.kicker, 0, -74));
  ctx.fillStyle = "#ffffff";
  drawFitted(ctx, beat.main, 0, 26, 96, w - 86, 950);
  ctx.fillStyle = beat.accent;
  drawFitted(ctx, beat.sub, 0, 104, 39, w - 98, 850);
  ctx.restore();
}

function drawNetwork(ctx: CanvasRenderingContext2D, params: ShortKineticParams, beat: Beat, w: number, h: number) {
  const values = params.previousFrame?.arr.length === params.frame.arr.length ? params.previousFrame.arr : params.frame.arr;
  const max = Math.max(...values, 1);
  const chartW = w - 86;
  const gap = Math.max(8, Math.min(16, chartW / Math.max(1, values.length) * 0.14));
  const cell = (chartW - gap * (values.length - 1)) / values.length;
  const baseY = h * 0.77;
  const chartH = h * 0.27;
  const pair = params.frame.swap.length >= 2 ? params.frame.swap : params.frame.highlight;
  const swapT = beat.mode === "swap" ? easeInOutCubic(params.transitionProgress) : 0;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 32, baseY - chartH - 48, w - 64, chartH + 110, 34);
  ctx.fill();
  drawGapArcs(ctx, values.length, pair, cell, gap, baseY, beat, params.transitionProgress);
  values.forEach((value, index) => {
    const active = pair.includes(index);
    const sorted = params.frame.sorted.includes(index);
    const direction = index === pair[0] ? 1 : index === pair[1] ? -1 : 0;
    const barH = 34 + (value / max) * chartH;
    const x = 43 + index * (cell + gap) + direction * (cell + gap) * swapT;
    const lift = active && beat.mode === "swap" ? -30 * Math.sin(swapT * Math.PI) : 0;
    ctx.fillStyle = sorted ? "#4ade80" : active ? beat.accent : index < values.length / 2 ? "rgba(56,189,248,0.30)" : "rgba(250,204,21,0.28)";
    roundRect(ctx, x, baseY - barH + lift, cell, barH, Math.min(18, cell / 2));
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 25, () => ctx.fillText(String(value), x + cell / 2, baseY + 38));
  });
  drawCue(ctx, beat, pair, cell, gap, baseY, w, params.lang);
  ctx.restore();
}

function drawGapArcs(ctx: CanvasRenderingContext2D, length: number, pair: number[], cell: number, gap: number, baseY: number, beat: Beat, progress: number) {
  ctx.save();
  ctx.strokeStyle = `${beat.accent}aa`;
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = -progress * 80;
  if (pair.length >= 2 && (beat.mode === "compare" || beat.mode === "swap")) {
    drawArc(ctx, pair[0], pair[1], cell, gap, baseY, beat.accent);
  } else {
    const half = Math.floor(length / 2);
    for (let i = 0; i < half; i++) drawArc(ctx, i, i + half, cell, gap, baseY, beat.accent);
  }
  ctx.restore();
}

function drawArc(ctx: CanvasRenderingContext2D, a: number, b: number, cell: number, gap: number, baseY: number, accent: string) {
  const left = 43 + a * (cell + gap) + cell / 2;
  const right = 43 + b * (cell + gap) + cell / 2;
  const height = Math.min(180, 54 + Math.abs(b - a) * 18);
  ctx.strokeStyle = `${accent}cc`;
  ctx.beginPath();
  ctx.moveTo(left, baseY - 238);
  ctx.bezierCurveTo(left, baseY - 238 - height, right, baseY - 238 - height, right, baseY - 238);
  ctx.stroke();
}

function drawCue(ctx: CanvasRenderingContext2D, beat: Beat, pair: number[], cell: number, gap: number, baseY: number, w: number, lang: string) {
  const label = beat.mode === "swap" ? (lang === "vi" ? "SWAP THEO HƯỚNG" : "DIRECTION SWAP")
    : beat.mode === "split" ? (lang === "vi" ? "TẠO BITONIC" : "BUILD BITONIC")
      : beat.mode === "done" ? "SORTED"
        : (lang === "vi" ? "COMPARE THEO GAP" : "GAP COMPARE");
  const cx = pair.length >= 2
    ? (43 + pair[0] * (cell + gap) + cell / 2 + 43 + pair[1] * (cell + gap) + cell / 2) / 2
    : w / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 30, () => ctx.fillText(label, cx, baseY - 268));
}

function drawFooter(ctx: CanvasRenderingContext2D, params: ShortKineticParams, accent: string, w: number, h: number) {
  const p = params.frameIndex / Math.max(1, params.frameCount - 1);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, 50, h - 66, w - 100, 10, 5);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, 50, h - 66, (w - 100) * p, 10, 5);
  ctx.fill();
}

function drawFitted(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, weight: number) {
  let fitted = size;
  while (fitted > 24) {
    ctx.font = `${weight} ${fitted}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fitted -= 3;
  }
  withTextShadow(ctx, fitted, () => ctx.fillText(text, x, y));
}

function easeInOutCubic(value: number) {
  const safe = Math.max(0, Math.min(1, value));
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}

function easeOutBack(value: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  const safe = Math.max(0, Math.min(1, value));
  return 1 + c3 * Math.pow(safe - 1, 3) + c1 * Math.pow(safe - 1, 2);
}
