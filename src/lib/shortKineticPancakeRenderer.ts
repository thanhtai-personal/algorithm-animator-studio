import { withTextShadow } from "./canvasText";
import { roundRect } from "./renderers/shapes";
import type { ShortKineticParams } from "./shortKineticTypographyRenderer";

type PancakeBeat = {
  kicker: string;
  main: string;
  sub: string;
  accent: string;
  mode: "intro" | "scan" | "newmax" | "flipTop" | "flipEnd" | "lock" | "done";
};

export function renderShortKineticPancake(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number, h: number) {
  const beat = getPancakeBeat(params);
  drawMeta(ctx, params, w);
  drawText(ctx, beat, params.transitionProgress, w, h);
  drawPancakeStack(ctx, params, beat, w, h);
  drawFooter(ctx, params, beat.accent, w, h);
}

function getPancakeBeat(params: ShortKineticParams): PancakeBeat {
  const vi = params.lang === "vi";
  const frame = params.frame;
  const phase = String(frame.vars.phase ?? "");
  const max = Number(frame.vars.max ?? 0);
  const i = Number(frame.vars.i ?? 0);
  const size = Number(frame.vars.size ?? frame.arr.length);
  const previous = params.previousFrame?.arr.length === frame.arr.length ? params.previousFrame : null;
  const candidate = previous?.arr[i] ?? frame.arr[i] ?? "-";
  const maxValue = previous?.arr[max] ?? frame.arr[max] ?? "-";

  if (params.frameIndex === 0) return {
    kicker: "PANCAKE SORT",
    main: vi ? "TÌM MAX" : "FIND MAX",
    sub: vi ? "Rồi lật prefix để đưa nó về cuối" : "Then flip prefixes to move it to the end",
    accent: "#facc15",
    mode: "intro",
  };
  if (params.frameIndex >= params.frameCount - 2 || frame.sorted.length === frame.arr.length) return {
    kicker: vi ? "KẾT QUẢ" : "RESULT",
    main: "SORTED",
    sub: vi ? "Mỗi vòng khóa thêm một vị trí ở cuối" : "Each round locks one pancake at the bottom",
    accent: "#4ade80",
    mode: "done",
  };
  if (frame.event === "swap" && phase.includes("top")) return {
    kicker: vi ? "LẬT LẦN 1" : "FLIP 1",
    main: vi ? "MAX LÊN ĐỈNH" : "MAX TO TOP",
    sub: vi ? `Lật prefix 0-${frame.vars.to ?? max}` : `Flip prefix 0-${frame.vars.to ?? max}`,
    accent: "#fb7185",
    mode: "flipTop",
  };
  if (frame.event === "swap" && phase.includes("sorted end")) return {
    kicker: vi ? "LẬT LẦN 2" : "FLIP 2",
    main: vi ? "MAX VỀ ĐÁY" : "MAX TO BOTTOM",
    sub: vi ? `Khóa vị trí ${size - 1}` : `Lock position ${size - 1}`,
    accent: "#fb7185",
    mode: "flipEnd",
  };
  if (frame.sorted.length) return {
    kicker: vi ? "KHÓA ĐÁY" : "LOCK BOTTOM",
    main: String(frame.arr[size] ?? frame.arr[size - 1] ?? ""),
    sub: vi ? "Vùng sorted lớn dần từ dưới lên" : "The sorted suffix grows upward",
    accent: "#4ade80",
    mode: "lock",
  };
  if (frame.event === "compare") {
    const isNewMax = Number(candidate) > Number(maxValue);
    return {
      kicker: vi ? "QUÉT PREFIX" : "SCAN PREFIX",
      main: `${candidate} ${isNewMax ? ">" : "<="} ${maxValue}`,
      sub: isNewMax ? (vi ? "Ứng viên max mới" : "New max candidate") : (vi ? "Max giữ nguyên" : "Keep current max"),
      accent: isNewMax ? "#fb7185" : "#38bdf8",
      mode: "scan",
    };
  }
  return {
    kicker: vi ? "MAX MỚI" : "NEW MAX",
    main: String(frame.arr[max] ?? ""),
    sub: vi ? `index ${max} đang lớn nhất trong prefix` : `index ${max} is largest in the prefix`,
    accent: "#facc15",
    mode: "newmax",
  };
}

function drawMeta(ctx: CanvasRenderingContext2D, params: ShortKineticParams, w: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "800 34px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 34, () => ctx.fillText(params.title || params.algoName, w / 2, 76));
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "600 23px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 23, () => ctx.fillText(params.lang === "vi" ? "Tìm max, lật lên, lật xuống" : "Find max, flip up, flip down", w / 2, 112));
}

function drawText(ctx: CanvasRenderingContext2D, beat: PancakeBeat, local: number, w: number, h: number) {
  const enter = easeOutBack(Math.min(1, local * 1.25));
  ctx.save();
  ctx.translate(w / 2, h * 0.28 + (1 - enter) * 96);
  ctx.scale(0.78 + enter * 0.22, 0.78 + enter * 0.22);
  ctx.textAlign = "center";
  ctx.fillStyle = beat.accent;
  ctx.font = "950 44px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 44, () => ctx.fillText(beat.kicker, 0, -74));
  ctx.fillStyle = "#ffffff";
  drawFitted(ctx, beat.main, 0, 26, 96, w - 86, 950);
  ctx.fillStyle = beat.accent;
  drawFitted(ctx, beat.sub, 0, 104, 41, w - 98, 850);
  ctx.restore();
}

function drawPancakeStack(ctx: CanvasRenderingContext2D, params: ShortKineticParams, beat: PancakeBeat, w: number, h: number) {
  const values = params.previousFrame?.arr.length === params.frame.arr.length ? params.previousFrame.arr : params.frame.arr;
  const maxValue = Math.max(...values, 1);
  const cx = w / 2;
  const baseY = h * 0.8;
  const layerH = Math.min(54, Math.max(34, h * 0.035));
  const maxPancakeW = w - 150;
  const minPancakeW = w * 0.28;
  const flipRange = params.frame.event === "swap" ? params.frame.swap : [];
  const flipT = beat.mode === "flipTop" || beat.mode === "flipEnd" ? easeInOutCubic(params.transitionProgress) : 0;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 50, baseY - values.length * layerH - 92, w - 100, values.length * layerH + 142, 34);
  ctx.fill();
  drawSpatula(ctx, cx, baseY - flipRange.length * layerH - 22, maxPancakeW, beat, flipT);
  values.forEach((value, index) => {
    const active = isActive(params, index);
    const sorted = params.frame.sorted.includes(index);
    const flipping = flipRange.includes(index);
    const targetIndex = flipping ? Number(params.frame.vars.to ?? flipRange.length - 1) - index : index;
    const stackY = baseY - (values.length - index) * layerH;
    const targetY = baseY - (values.length - targetIndex) * layerH;
    const y = flipping ? lerp(stackY, targetY, flipT) - Math.sin(flipT * Math.PI) * 78 : stackY;
    const width = minPancakeW + (value / maxValue) * (maxPancakeW - minPancakeW);
    const wobble = flipping ? Math.sin(flipT * Math.PI) * 0.08 : 0;
    ctx.save();
    ctx.translate(cx, y + layerH / 2);
    ctx.rotate((flipping ? (index % 2 ? -1 : 1) : 0) * wobble);
    ctx.fillStyle = sorted ? "#4ade80" : flipping ? "#fb7185" : active ? beat.accent : "rgba(255,255,255,0.28)";
    roundRect(ctx, -width / 2, -layerH / 2, width, layerH - 6, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 24px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 24, () => ctx.fillText(String(value), 0, 8));
    ctx.restore();
  });
  drawCue(ctx, params, beat, cx, baseY, layerH, w);
  ctx.restore();
}

function isActive(params: ShortKineticParams, index: number) {
  return params.frame.highlight.includes(index) || Number(params.frame.vars.max ?? -1) === index;
}

function drawSpatula(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number, beat: PancakeBeat, t: number) {
  if (beat.mode !== "flipTop" && beat.mode !== "flipEnd") return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `${beat.accent}dd`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx - width * 0.42, y);
  ctx.lineTo(cx + width * 0.42, y);
  ctx.stroke();
  ctx.fillStyle = beat.accent;
  roundRect(ctx, cx + width * 0.34 + Math.sin(t * Math.PI) * 18, y - 13, 150, 26, 13);
  ctx.fill();
  ctx.restore();
}

function drawCue(ctx: CanvasRenderingContext2D, params: ShortKineticParams, beat: PancakeBeat, cx: number, baseY: number, layerH: number, w: number) {
  const vi = params.lang === "vi";
  const label = beat.mode === "scan" ? (vi ? "CHỌN MAX" : "SELECT MAX")
    : beat.mode === "flipTop" || beat.mode === "flipEnd" ? (vi ? "LẬT PREFIX" : "FLIP PREFIX")
      : beat.mode === "lock" || beat.mode === "done" ? (vi ? "KHÓA ĐÁY" : "LOCK BOTTOM")
        : (vi ? "STACK" : "STACK");
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 30, () => ctx.fillText(label, cx, baseY - layerH * params.frame.arr.length - 118));
  if (beat.mode === "scan" || beat.mode === "newmax") {
    const max = Number(params.frame.vars.max ?? 0);
    const x = 90 + (max / Math.max(1, params.frame.arr.length - 1)) * (w - 180);
    ctx.strokeStyle = beat.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, baseY + 18);
    ctx.lineTo(cx, baseY - layerH * params.frame.arr.length - 70);
    ctx.stroke();
  }
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
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
