import type { Frame } from "./algorithms";
import { withTextShadow } from "./canvasText";
import type { Lang } from "./i18n";
import { roundRect } from "./renderers/shapes";
import { renderShortKineticPancake } from "./shortKineticPancakeRenderer";

export type ShortKineticParams = {
  frame: Frame;
  previousFrame?: Frame | null;
  frameIndex: number;
  frameCount: number;
  transitionProgress: number;
  algorithmId: string;
  algoName: string;
  lang: Lang;
  title: string;
  subtitle: string;
};
type Params = ShortKineticParams;

type BubbleBeat = {
  kicker: string;
  main: string;
  sub: string;
  accent: string;
  mode: "intro" | "compare" | "swap" | "keep" | "lock" | "done" | "phase" | "stop";
};

export function renderShortKineticTypography(ctx: CanvasRenderingContext2D, params: Params, w: number, h: number) {
  drawBackground(ctx, w, h, params.frameIndex / Math.max(1, params.frameCount - 1));
  if (params.algorithmId === "pancake") return renderShortKineticPancake(ctx, params, w, h);
  if (params.algorithmId === "odd_even") {
    const beat = getOddEvenBeat(params);
    drawTopMeta(ctx, params, w); drawBeatText(ctx, beat, params.transitionProgress, w, h);
    drawOddEvenBars(ctx, params, beat, w, h); drawFooter(ctx, params, beat.accent, w, h);
    return;
  }
  if (params.algorithmId !== "bubble") return drawFallback(ctx, params, w, h);
  const beat = getBubbleBeat(params);
  drawTopMeta(ctx, params, w); drawBeatText(ctx, beat, params.transitionProgress, w, h);
  drawBubbleBars(ctx, params, beat, w, h); drawFooter(ctx, params, beat.accent, w, h);
}

function getBubbleBeat(params: Params): BubbleBeat {
  const vi = params.lang === "vi";
  const current = params.frame;
  const previous = params.previousFrame;
  const pair = current.swap.length >= 2 ? current.swap : current.highlight;
  const a = pair[0] ?? 0;
  const b = pair[1] ?? Math.min(a + 1, current.arr.length - 1);
  const left = previous?.arr[a] ?? current.arr[a];
  const right = previous?.arr[b] ?? current.arr[b];

  if (params.frameIndex === 0) return {
    kicker: vi ? "BUBBLE SORT" : "BUBBLE SORT",
    main: vi ? "SO SÁNH CẶP" : "COMPARE PAIRS",
    sub: vi ? "Sai thứ tự thì đổi chỗ" : "Swap when order is wrong",
    accent: "#38bdf8",
    mode: "intro",
  };
  if (params.frameIndex >= params.frameCount - 2) return {
    kicker: vi ? "KẾT QUẢ" : "RESULT",
    main: vi ? "ĐÃ SẮP XẾP" : "SORTED",
    sub: vi ? "Mỗi pass khóa dần phần đuôi" : "Each pass locks the tail",
    accent: "#4ade80",
    mode: "done",
  };
  if (current.event === "swap") return {
    kicker: vi ? "SAI THỨ TỰ" : "WRONG ORDER",
    main: `${left} > ${right}`,
    sub: vi ? "Swap ngay" : "Swap now",
    accent: "#fb7185",
    mode: "swap",
  };
  if (current.event === "compare") return {
    kicker: vi ? "SO SÁNH" : "COMPARE",
    main: `${left} ${left > right ? ">" : "<="} ${right}`,
    sub: left > right ? (vi ? "Chuẩn bị đổi chỗ" : "Swap is coming") : (vi ? "Đúng thứ tự, đi tiếp" : "Keep order, move on"),
    accent: left > right ? "#fb7185" : "#4ade80",
    mode: left > right ? "compare" : "keep",
  };
  return {
    kicker: vi ? "PASS" : "PASS",
    main: vi ? "LỚN TRÔI SANG PHẢI" : "BIG VALUES DRIFT RIGHT",
    sub: vi ? "Sau mỗi lượt quét, đuôi được khóa" : "After each scan, the tail locks",
    accent: "#facc15",
    mode: "lock",
  };
}

function getOddEvenBeat(params: Params): BubbleBeat {
  const vi = params.lang === "vi";
  const frame = params.frame;
  const phase = String(frame.vars.phase ?? "");
  const pair = frame.swap.length >= 2 ? frame.swap : frame.highlight;
  const a = pair[0] ?? Number(frame.vars.i ?? 0);
  const b = pair[1] ?? Math.min(a + 1, frame.arr.length - 1);
  const previous = params.previousFrame?.arr.length === frame.arr.length ? params.previousFrame : null;
  const left = previous?.arr[a] ?? frame.arr[a];
  const right = previous?.arr[b] ?? frame.arr[b];
  const phaseName = phase === "even" ? (vi ? "PHA CHẴN" : "EVEN PHASE") : (vi ? "PHA LẺ" : "ODD PHASE");

  if (params.frameIndex === 0) return {
    kicker: "ODD-EVEN SORT",
    main: vi ? "LẺ / CHẴN" : "ODD / EVEN",
    sub: vi ? "Hai nhóm cặp thay phiên nhau" : "Two pair groups take turns",
    accent: "#38bdf8",
    mode: "intro",
  };
  if (params.frameIndex >= params.frameCount - 2 || frame.sorted.length === frame.arr.length) return {
    kicker: vi ? "KẾT QUẢ" : "RESULT",
    main: vi ? "SORTED" : "SORTED",
    sub: vi ? "Một vòng sạch thì dừng" : "A clean round stops",
    accent: "#4ade80",
    mode: "done",
  };
  if (frame.event === "swap") return {
    kicker: phaseName,
    main: `${left} > ${right}`,
    sub: vi ? `Đổi chỗ cặp ${a}-${b}` : `Swap pair ${a}-${b}`,
    accent: "#fb7185",
    mode: "swap",
  };
  if (frame.event === "compare") {
    const wrong = left > right;
    return {
      kicker: phaseName,
      main: `${left} ${wrong ? ">" : "<="} ${right}`,
      sub: wrong ? (vi ? "Sai thứ tự, swap sắp tới" : "Wrong order, swap next") : (vi ? "Đúng thứ tự, bỏ qua" : "Correct order, skip"),
      accent: wrong ? "#fb7185" : "#4ade80",
      mode: wrong ? "compare" : "keep",
    };
  }
  return {
    kicker: vi ? "CỜ SORTED" : "SORTED FLAG",
    main: frame.vars.sorted === "false" ? "false" : "true",
    sub: vi ? "false nghĩa là còn vòng tiếp theo" : "false means another round",
    accent: frame.vars.sorted === "false" ? "#fb7185" : "#4ade80",
    mode: frame.vars.sorted === "false" ? "phase" : "stop",
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#020617");
  bg.addColorStop(0.54, "#050505");
  bg.addColorStop(1, "#06151f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 42; i++) {
    const y = (i / 41) * h;
    const pulse = 0.5 + Math.sin(i * 0.8 + progress * Math.PI * 18) * 0.5;
    ctx.fillStyle = `rgba(56,189,248,${0.03 + pulse * 0.08})`;
    roundRect(ctx, w - 34 - pulse * 48, y, 6 + pulse * 8, 4, 3);
    ctx.fill();
  }
}

function drawTopMeta(ctx: CanvasRenderingContext2D, params: Params, w: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = "800 34px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 34, () => ctx.fillText(params.title || params.algoName, w / 2, 76));
  const text = params.subtitle || (params.lang === "vi" ? "Giải thích nhanh bằng chữ chuyển động" : "Kinetic short explanation");
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.font = "600 23px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 23, () => ctx.fillText(shorten(text, 40), w / 2, 112));
}

function drawBeatText(ctx: CanvasRenderingContext2D, beat: BubbleBeat, local: number, w: number, h: number) {
  const enter = easeOutBack(Math.min(1, local * 1.35));
  const scale = 0.78 + enter * 0.22;
  ctx.save();
  ctx.translate(w / 2, h * 0.28 + (1 - enter) * 90);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.fillStyle = beat.accent;
  ctx.font = "950 44px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 44, () => ctx.fillText(beat.kicker, 0, -74));
  ctx.fillStyle = "#ffffff";
  drawFittedCenter(ctx, beat.main, 0, 26, 102, w - 84, 950);
  ctx.fillStyle = beat.accent;
  drawFittedCenter(ctx, beat.sub, 0, 104, 43, w - 96, 850);
  ctx.restore();
}

function drawBubbleBars(ctx: CanvasRenderingContext2D, params: Params, beat: BubbleBeat, w: number, h: number) {
  const values = params.previousFrame?.arr.length === params.frame.arr.length ? params.previousFrame.arr : params.frame.arr;
  const max = Math.max(...values, 1);
  const chartW = w - 86;
  const gap = Math.max(8, Math.min(16, chartW / Math.max(1, values.length) * 0.14));
  const cell = (chartW - gap * (values.length - 1)) / values.length;
  const baseY = h * 0.76;
  const chartH = h * 0.27;
  const pair = params.frame.swap.length >= 2 ? params.frame.swap : params.frame.highlight;
  const swapT = beat.mode === "swap" ? easeInOutCubic(params.transitionProgress) : 0;
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 32, baseY - chartH - 36, w - 64, chartH + 96, 34);
  ctx.fill();
  values.forEach((value, index) => {
    const active = pair.includes(index);
    const sorted = params.frame.sorted.includes(index);
    const barH = 34 + (value / max) * chartH;
    const direction = index === pair[0] ? 1 : index === pair[1] ? -1 : 0;
    const offset = direction * (cell + gap) * swapT;
    const lift = active && beat.mode === "swap" ? -32 * Math.sin(swapT * Math.PI) : 0;
    const x = 43 + index * (cell + gap) + offset;
    ctx.fillStyle = sorted ? "#4ade80" : active ? beat.accent : "rgba(255,255,255,0.24)";
    roundRect(ctx, x, baseY - barH + lift, cell, barH, Math.min(18, cell / 2));
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 25, () => ctx.fillText(String(value), x + cell / 2, baseY + 38));
  });
  if (pair.length >= 2) drawColumnEnergyCue(ctx, pair, cell, gap, baseY, beat, params.transitionProgress, params.lang);
  ctx.restore();
}

function drawOddEvenBars(ctx: CanvasRenderingContext2D, params: Params, beat: BubbleBeat, w: number, h: number) {
  const values = params.previousFrame?.arr.length === params.frame.arr.length ? params.previousFrame.arr : params.frame.arr;
  const max = Math.max(...values, 1);
  const chartW = w - 86;
  const gap = Math.max(8, Math.min(16, chartW / Math.max(1, values.length) * 0.14));
  const cell = (chartW - gap * (values.length - 1)) / values.length;
  const baseY = h * 0.76;
  const chartH = h * 0.27;
  const pair = params.frame.swap.length >= 2 ? params.frame.swap : params.frame.highlight;
  const phase = String(params.frame.vars.phase ?? "odd");
  const phaseParity = phase === "even" ? 0 : 1;
  const swapT = beat.mode === "swap" ? easeInOutCubic(params.transitionProgress) : 0;

  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(ctx, 32, baseY - chartH - 36, w - 64, chartH + 96, 34);
  ctx.fill();
  if (beat.mode !== "swap") drawOddEvenPhaseRails(ctx, values.length, phaseParity, cell, gap, baseY, beat.accent, params.transitionProgress);
  values.forEach((value, index) => {
    const active = pair.includes(index);
    const phaseActive = index % 2 === phaseParity && index < values.length - 1;
    const sorted = params.frame.sorted.includes(index);
    const barH = 34 + (value / max) * chartH;
    const direction = index === pair[0] ? 1 : index === pair[1] ? -1 : 0;
    const offset = direction * (cell + gap) * swapT;
    const lift = active && beat.mode === "swap" ? -32 * Math.sin(swapT * Math.PI) : 0;
    const x = 43 + index * (cell + gap) + offset;
    ctx.fillStyle = sorted ? "#4ade80" : active ? beat.accent : phaseActive ? "rgba(250,204,21,0.22)" : "rgba(255,255,255,0.22)";
    roundRect(ctx, x, baseY - barH + lift, cell, barH, Math.min(18, cell / 2));
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 25, () => ctx.fillText(String(value), x + cell / 2, baseY + 38));
  });
  if (pair.length >= 2) drawColumnEnergyCue(ctx, pair, cell, gap, baseY, beat, params.transitionProgress, params.lang);
  else drawOddEvenStopCue(ctx, baseY, w, beat, params.lang);
  ctx.restore();
}

function drawOddEvenPhaseRails(ctx: CanvasRenderingContext2D, length: number, parity: number, cell: number, gap: number, baseY: number, accent: string, progress: number) {
  ctx.save();
  ctx.strokeStyle = `${accent}88`;
  ctx.lineWidth = 3;
  ctx.setLineDash([15, 12]);
  ctx.lineDashOffset = -progress * 70;
  for (let i = parity; i < length - 1; i += 2) {
    const left = 43 + i * (cell + gap) + cell / 2;
    const right = left + cell + gap;
    ctx.beginPath();
    ctx.moveTo(left, baseY - 238);
    ctx.bezierCurveTo(left + 28, baseY - 268, right - 28, baseY - 268, right, baseY - 238);
    ctx.stroke();
  }
  ctx.restore();
}

function drawOddEvenStopCue(ctx: CanvasRenderingContext2D, baseY: number, w: number, beat: BubbleBeat, lang: Lang) {
  ctx.save();
  ctx.strokeStyle = beat.accent;
  ctx.lineWidth = 6;
  roundRect(ctx, 60, baseY - 252, w - 120, 298, 28);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 30, () => ctx.fillText(lang === "vi" ? "KHÔNG CÒN SWAP" : "NO MORE SWAPS", w / 2, baseY - 270));
  ctx.restore();
}

function drawColumnEnergyCue(ctx: CanvasRenderingContext2D, pair: number[], cell: number, gap: number, baseY: number, beat: BubbleBeat, progress: number, lang: Lang) {
  const left = 43 + pair[0] * (cell + gap) + cell / 2;
  const right = 43 + pair[1] * (cell + gap) + cell / 2;
  const center = (left + right) / 2;
  const pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  drawFootGlow(ctx, left, baseY + 6, cell * (1.1 + pulse * 0.3), beat.accent);
  drawFootGlow(ctx, right, baseY + 6, cell * (1.1 + (1 - pulse) * 0.3), beat.accent);
  if (beat.mode === "swap") drawSwapPortal(ctx, center, baseY + 8, right - left, beat.accent, progress);
  else drawComparePulse(ctx, left, right, baseY + 12, beat.accent, progress);
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 30px ui-sans-serif, system-ui, sans-serif";
  const label = beat.mode === "swap"
    ? (lang === "vi" ? "ĐỔI CHỖ" : "SWAP")
    : (lang === "vi" ? "SO SÁNH" : "COMPARE");
  withTextShadow(ctx, 30, () => ctx.fillText(label, center, baseY - 264));
}

function drawFootGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, accent: string) {
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  glow.addColorStop(0, accent);
  glow.addColorStop(0.45, `${accent}88`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawComparePulse(ctx: CanvasRenderingContext2D, left: number, right: number, y: number, accent: string, progress: number) {
  const t = easeInOutCubic(progress);
  ctx.strokeStyle = `${accent}cc`;
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 12]);
  ctx.lineDashOffset = -progress * 80;
  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.bezierCurveTo(left + 34, y + 28, right - 34, y + 28, right, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(left + (right - left) * t, y + Math.sin(t * Math.PI) * 22, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawSwapPortal(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, accent: string, progress: number) {
  const spin = progress * Math.PI * 2;
  ctx.translate(cx, cy);
  ctx.rotate(spin * 0.25);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 0 ? accent : "rgba(255,255,255,0.55)";
    ctx.lineWidth = 5 - i;
    ctx.beginPath();
    ctx.ellipse(0, 0, width * (0.38 + i * 0.1), 12 + i * 6, spin + i * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.72)";
  ctx.beginPath();
  ctx.ellipse(0, 0, width * 0.28, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawFooter(ctx: CanvasRenderingContext2D, params: Params, accent: string, w: number, h: number) {
  const p = params.frameIndex / Math.max(1, params.frameCount - 1);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(ctx, 50, h - 66, w - 100, 10, 5);
  ctx.fill();
  ctx.fillStyle = accent;
  roundRect(ctx, 50, h - 66, (w - 100) * p, 10, 5);
  ctx.fill();
}

function drawFallback(ctx: CanvasRenderingContext2D, params: Params, w: number, h: number) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "950 72px ui-sans-serif, system-ui, sans-serif";
  drawFittedCenter(ctx, params.algoName, w / 2, h * 0.34, 72, w - 90, 950);
  ctx.fillStyle = "#4ade80";
  drawFittedCenter(ctx, params.lang === "vi" ? "Chữ chuyển động" : "Kinetic Typography", w / 2, h * 0.43, 48, w - 90, 900);
}

function drawFittedCenter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, weight: number) {
  let fitted = size;
  while (fitted > 24) {
    ctx.font = `${weight} ${fitted}px ui-sans-serif, system-ui, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fitted -= 3;
  }
  withTextShadow(ctx, fitted, () => ctx.fillText(text, x, y));
}

function shorten(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1).trim()}...`;
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
