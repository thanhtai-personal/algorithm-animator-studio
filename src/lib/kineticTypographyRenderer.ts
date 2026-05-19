import type { Frame } from "./algorithms";
import type { Lang } from "./i18n";
import type { LongContentScene } from "./longContentTimeline";
import type { LongVideoType } from "./longVideoTypes";
import type { Theme } from "./renderer";
import { roundRect } from "./renderers/shapes";

const W = 1920;
const H = 1080;

type Params = {
  frame?: Frame | null;
  previousFrame?: Frame | null;
  scene: LongContentScene;
  sceneProgress: number;
  timelineProgress: number;
  algoId: string;
  algoName: string;
  code: string;
  lang: Lang;
  theme: Theme;
  showCode: boolean;
  frameLabel: string;
  frameTransitionProgress?: number;
  longVideoType: LongVideoType;
};

type KineticCard = { top?: string; main: string; bottom?: string; accent?: string; invert?: boolean; rotate?: number };
type BubbleMode = "compare" | "swap" | "pass" | "biggest" | "lock" | "best" | "worst" | "space";

export function renderKineticTypography(ctx: CanvasRenderingContext2D, params: Params) {
  const cards = getKineticCards(params);
  const beatCount = Math.max(8, cards.length);
  const beat = Math.min(beatCount - 1, Math.floor(params.sceneProgress * beatCount));
  const local = params.sceneProgress * beatCount - beat;
  const card = cards[beat % cards.length];
  const accent = card.accent ?? "#4ade80";
  ctx.fillStyle = card.invert ? accent : "#050505";
  ctx.fillRect(0, 0, W, H);
  drawBeatGrid(ctx, params.timelineProgress, accent, card.invert);
  drawKineticIllustration(ctx, params, card, local, accent);
  drawKineticCard(ctx, card, local, accent);
  drawKineticFooter(ctx, params, accent, card.invert);
}

function getKineticCards(params: Params): KineticCard[] {
  if (params.algoId === "bubble") return getBubbleKineticCards(params.scene.id, params.lang);
  const base = [params.algoName, params.scene.kindLabel, ...params.scene.bullets].join(" ");
  return wordsFromText(base).map((word, index) => ({ main: word, accent: index % 3 === 0 ? "#4ade80" : "#38bdf8" })).slice(0, 12);
}

function getBubbleKineticCards(sceneId: string, lang: Lang): KineticCard[] {
  const vi = lang === "vi";
  const shared = [
    { top: vi ? "BƯỚC 1" : "STEP 1", main: vi ? "NHÌN 2 CỘT" : "PICK A PAIR", bottom: vi ? "chỉ xét hai phần tử kề nhau" : "only adjacent values" },
    { top: vi ? "NẾU" : "IF", main: "TRÁI > PHẢI", bottom: vi ? "thì đổi chỗ ngay" : "swap immediately", accent: "#fb7185", rotate: -3 },
    { top: vi ? "NẾU KHÔNG" : "ELSE", main: vi ? "GIỮ NGUYÊN" : "KEEP ORDER", bottom: vi ? "cặp này đã đúng" : "this pair is already ordered", accent: "#4ade80" },
    { top: vi ? "QUÉT" : "SCAN", main: vi ? "SANG PHẢI" : "TO THE RIGHT", bottom: vi ? "cặp kế tiếp, rồi cặp kế tiếp" : "pair after pair", accent: "#38bdf8" },
    { top: vi ? "SAU 1 PASS" : "AFTER 1 PASS", main: vi ? "LỚN NHẤT" : "LARGEST", bottom: vi ? "nằm ở cuối mảng" : "lands at the end", accent: "#facc15", rotate: 3 },
    { main: vi ? "KHÓA ĐUÔI" : "LOCK THE TAIL", bottom: vi ? "vùng cuối đã sorted" : "the right side is sorted", accent: "#4ade80", invert: true },
  ];
  const complexity = [
    { top: vi ? "BEST CASE" : "BEST CASE", main: "O(n)", bottom: vi ? "một pass không có swap" : "one pass, no swaps", accent: "#4ade80", invert: true },
    { top: vi ? "AVERAGE" : "AVERAGE", main: "O(n²)", bottom: vi ? "nhiều pass và nhiều so sánh" : "many passes and compares", accent: "#facc15" },
    { top: vi ? "WORST CASE" : "WORST CASE", main: "O(n²)", bottom: vi ? "mảng đảo ngược: swap liên tục" : "reversed input swaps nonstop", accent: "#fb7185", rotate: -3 },
    { top: vi ? "BỘ NHỚ" : "SPACE", main: "O(1)", bottom: vi ? "đổi trực tiếp trong mảng" : "in-place swaps", accent: "#38bdf8" },
  ];
  const byScene: Record<string, KineticCard[]> = {
    "kata-intro": [
      { main: "BUBBLE SORT", bottom: vi ? "sắp xếp bằng các cặp kề nhau" : "sort by adjacent pairs", accent: "#4ade80" },
      { main: vi ? "SAI THỨ TỰ?" : "WRONG ORDER?", bottom: vi ? "đổi chỗ ngay" : "swap it now", accent: "#fb7185" },
      { main: vi ? "ĐÚNG THỨ TỰ?" : "RIGHT ORDER?", bottom: vi ? "đi tiếp" : "move on", accent: "#4ade80" },
    ],
    hook: [
      { main: vi ? "CÙNG LUẬT" : "SAME RULE", bottom: vi ? "nhưng input quyết định tốc độ" : "input decides the cost" },
      { main: vi ? "ĐÃ SORTED" : "ALREADY SORTED", bottom: vi ? "gần như chỉ kiểm tra" : "mostly just checks", accent: "#4ade80", invert: true },
      { main: vi ? "ĐẢO NGƯỢC" : "REVERSED", bottom: vi ? "swap rất nhiều" : "swaps a lot", accent: "#fb7185" },
      ...complexity,
    ],
    "core-idea": [
      { main: vi ? "MỤC TIÊU" : "GOAL", bottom: vi ? "sửa lỗi nhỏ trước" : "fix small local mistakes first", accent: "#38bdf8" },
      ...shared,
      { main: vi ? "TỪ LOCAL" : "LOCAL FIXES", bottom: vi ? "thành thứ tự toàn mảng" : "become global order", accent: "#4ade80" },
    ],
    "step-by-step": [
      { top: vi ? "INPUT" : "INPUT", main: "5 1 4 2 8", bottom: vi ? "bắt đầu từ cặp đầu tiên" : "start from the first pair", accent: "#38bdf8" },
      { top: vi ? "SO SÁNH" : "COMPARE", main: "5 > 1", bottom: vi ? "sai thứ tự -> swap" : "wrong order -> swap", accent: "#fb7185" },
      { top: vi ? "SO SÁNH" : "COMPARE", main: "5 > 4", bottom: vi ? "5 tiếp tục trượt sang phải" : "5 keeps moving right", accent: "#fb7185" },
      { top: vi ? "SO SÁNH" : "COMPARE", main: "5 > 2", bottom: vi ? "swap lần nữa" : "swap again", accent: "#fb7185" },
      { top: vi ? "SO SÁNH" : "COMPARE", main: "5 < 8", bottom: vi ? "đúng thứ tự, không swap" : "already ordered, no swap", accent: "#4ade80" },
      { main: vi ? "8 ĐÃ Ở CUỐI" : "8 REACHES THE END", bottom: vi ? "phần tử lớn nhất được khóa" : "largest value is locked", accent: "#facc15" },
    ],
    animation: [
      { main: vi ? "MÀU CYAN" : "CYAN", bottom: vi ? "cặp đang so sánh" : "current pair" },
      { main: vi ? "MÀU ĐỎ" : "RED", bottom: vi ? "hai cột đang swap" : "values are swapping", accent: "#fb7185" },
      { main: vi ? "MÀU XANH" : "GREEN", bottom: vi ? "đuôi đã sorted" : "sorted tail", accent: "#4ade80", invert: true },
      { main: vi ? "ĐẾM CHI PHÍ" : "COUNT THE COST", bottom: vi ? "compare + swap" : "compare + swap", accent: "#38bdf8" },
    ],
    "early-stop": [
      { main: vi ? "MỘT PASS" : "ONE PASS", bottom: vi ? "không có swap nào" : "with zero swaps" },
      { main: vi ? "MỌI CẶP" : "EVERY PAIR", bottom: vi ? "đã đúng thứ tự" : "is already ordered", accent: "#4ade80" },
      { main: "STOP", bottom: vi ? "không cần chạy tiếp" : "no more passes needed", accent: "#4ade80", invert: true },
      { main: "O(n)", bottom: vi ? "best case" : "best case", accent: "#4ade80" },
    ],
    complexity: [
      ...complexity,
      { top: vi ? "WORST WORK" : "WORST WORK", main: "n(n-1)/2", bottom: vi ? "số lần so sánh xấp xỉ" : "rough compare count", accent: "#fb7185" },
      { main: "STABLE", bottom: vi ? "hai giá trị bằng nhau giữ thứ tự" : "equal values keep their order", accent: "#4ade80" },
    ],
    "use-cases": [
      { main: vi ? "DÙNG ĐỂ HỌC" : "USE TO LEARN", bottom: vi ? "compare, swap, invariant" : "compare, swap, invariant", accent: "#4ade80" },
      { main: vi ? "MẢNG NHỎ" : "SMALL ARRAYS", bottom: vi ? "dễ nhìn từng bước" : "easy to trace" },
      { main: vi ? "GẦN SORTED" : "NEARLY SORTED", bottom: vi ? "early-stop có lợi" : "early stop helps", accent: "#4ade80" },
    ],
    "avoid-cases": [
      { main: vi ? "TRÁNH DỮ LIỆU LỚN" : "AVOID LARGE DATA", bottom: vi ? "O(n²) phình rất nhanh" : "O(n²) grows fast", accent: "#fb7185" },
      { main: vi ? "ĐẢO NGƯỢC" : "REVERSED INPUT", bottom: vi ? "gần như worst case" : "near worst case", accent: "#fb7185" },
      { main: vi ? "THỰC TẾ" : "IN PRACTICE", bottom: vi ? "dùng built-in sort" : "use built-in sort", accent: "#4ade80" },
    ],
    recap: [
      { main: vi ? "1. SO SÁNH CẶP" : "1. COMPARE PAIRS" },
      { main: vi ? "2. SAI THÌ SWAP" : "2. SWAP IF WRONG", accent: "#fb7185" },
      { main: vi ? "3. KHÓA ĐUÔI" : "3. LOCK THE TAIL", accent: "#4ade80", invert: true },
      ...complexity,
      { main: vi ? "NHỚ VẬY LÀ ĐỦ" : "THAT'S THE MODEL", accent: "#4ade80", invert: true },
    ],
  };
  return byScene[sceneId] ?? shared;
}

function drawKineticCard(ctx: CanvasRenderingContext2D, card: KineticCard, local: number, accent: string) {
  const inEase = easeOutBack(clamp01(local / 0.22));
  const outEase = local > 0.74 ? easeOutCubic((local - 0.74) / 0.26) : 0;
  const scale = (0.62 + 0.42 * inEase) * (1 - 0.18 * outEase);
  const y = H / 2 + (1 - inEase) * 120 - outEase * 110;
  const x = W / 2 + (1 - inEase) * (card.rotate && card.rotate < 0 ? -180 : 180);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(((card.rotate ?? 0) * Math.PI) / 180 * inEase);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.fillStyle = card.invert ? "#050505" : "#ffffff";
  if (card.top) {
    ctx.font = "900 48px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(card.top, 0, -140);
  }
  ctx.font = "950 174px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(card.main, 0, 20);
  if (card.bottom) {
    ctx.fillStyle = card.invert ? "rgba(5,5,5,0.7)" : accent;
    ctx.font = "900 62px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(card.bottom, 0, 108);
  }
  ctx.restore();
}

function drawBeatGrid(ctx: CanvasRenderingContext2D, timelineProgress: number, accent: string, invert?: boolean) {
  const base = invert ? "rgba(5,5,5," : "rgba(255,255,255,";
  for (let i = 0; i < 64; i++) {
    const pulse = 0.5 + 0.5 * Math.sin(i * 0.9 + timelineProgress * Math.PI * 42);
    const x = (i / 63) * W;
    const h = 34 + pulse * 170;
    ctx.fillStyle = i % 8 === 0 ? accent : `${base}${0.08 + pulse * 0.1})`;
    roundRect(ctx, x - 7, H - 210 - h, 14, h, 7);
    ctx.fill();
  }
}

function drawKineticIllustration(ctx: CanvasRenderingContext2D, params: Params, card: KineticCard, local: number, accent: string) {
  if (params.algoId === "bubble") return drawBubbleKineticIllustration(ctx, params, card, local, accent);
  if (params.frame) drawKineticAlgorithmFlash(ctx, params, accent, card.invert);
}

function drawBubbleKineticIllustration(ctx: CanvasRenderingContext2D, params: Params, card: KineticCard, local: number, accent: string) {
  const mode = getBubbleMode(card);
  const arr = getBubbleModeArray(params, mode);
  const pop = easeOutBack(clamp01(local / 0.28));
  ctx.save();
  ctx.translate(0, (1 - pop) * 46);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = card.invert ? "rgba(5,5,5,0.2)" : "rgba(255,255,255,0.1)";
  roundRect(ctx, 250, 660, 1420, 220, 40);
  ctx.fill();
  drawBubbleMiniBars(ctx, arr, mode, accent, card.invert, local);
  drawBubbleMotionCue(ctx, mode, accent, card.invert, local, params.lang);
  ctx.restore();
}

function getBubbleMode(card: KineticCard): BubbleMode {
  const text = `${card.top ?? ""} ${card.main} ${card.bottom ?? ""}`.toLowerCase();
  if (text.includes("best") || text.includes("o(n)") || text.includes("zero swaps")) return "best";
  if (text.includes("worst") || text.includes("reversed") || text.includes("đảo ngược") || text.includes("n(n")) return "worst";
  if (text.includes("space") || text.includes("o(1)") || text.includes("in-place")) return "space";
  if (text.includes("swap") || text.includes(">") || text.includes("đổi chỗ")) return "swap";
  if (text.includes("largest") || text.includes("lớn nhất") || text.includes("8 reaches") || text.includes("8 đã")) return "biggest";
  if (text.includes("lock") || text.includes("khóa") || text.includes("stop") || text.includes("tail") || text.includes("đuôi")) return "lock";
  if (text.includes("pass") || text.includes("scan") || text.includes("quét") || text.includes("right")) return "pass";
  return "compare";
}

function getBubbleModeArray(params: Params, mode: BubbleMode) {
  if (params.frame?.arr.length && mode !== "best" && mode !== "worst") return params.frame.arr.slice(0, 8);
  if (mode === "best") return [1, 2, 3, 4, 5, 6, 7, 8];
  if (mode === "worst") return [8, 7, 6, 5, 4, 3, 2, 1];
  if (mode === "lock") return [1, 2, 4, 5, 8];
  return [5, 1, 4, 2, 8];
}

function drawBubbleMiniBars(ctx: CanvasRenderingContext2D, values: number[], mode: BubbleMode, accent: string, invert: boolean | undefined, local: number) {
  const max = Math.max(...values, 1);
  const x = 420, y = 826, w = 860, gap = 18;
  const cell = (w - gap * (values.length - 1)) / values.length;
  const swapT = mode === "swap" ? easeInOutCubic(clamp01((local - 0.12) / 0.76)) : 0;
  values.forEach((value, index) => {
    const active = getBubbleActive(index, values.length, mode);
    const h = 44 + (value / max) * 132;
    const lift = active && mode === "swap" ? -34 * Math.sin(swapT * Math.PI) : active && mode === "biggest" ? -18 : 0;
    const swapOffset = mode === "swap" && index < 2 ? (index === 0 ? 1 : -1) * (cell + gap) * swapT : 0;
    const pulse = active && mode === "swap" ? 1 + 0.04 * Math.sin(clamp01(local) * Math.PI * 4) : 1;
    const hot = mode === "swap" || mode === "worst" ? "#fb7185" : accent;
    ctx.fillStyle = active ? hot : invert ? "rgba(5,5,5,0.35)" : "rgba(255,255,255,0.26)";
    const bx = x + index * (cell + gap) + swapOffset;
    ctx.save();
    ctx.translate(bx + cell / 2, y + lift);
    ctx.scale(pulse, pulse);
    roundRect(ctx, -cell / 2, -h, cell, h, 18);
    ctx.fill();
    ctx.fillStyle = invert ? "#050505" : "#ffffff";
    ctx.font = "900 28px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(value), 0, 42);
    ctx.restore();
  });
  if (mode === "swap") drawSwapTrack(ctx, x, y, cell, gap, swapT);
}

function getBubbleActive(index: number, length: number, mode: BubbleMode) {
  if (mode === "lock") return index >= length - 2;
  if (mode === "biggest") return index === length - 1 || index === Math.max(0, length - 2);
  if (mode === "pass") return index <= Math.floor(length * 0.7);
  if (mode === "best" || mode === "space") return index < length;
  if (mode === "worst") return index < Math.min(length, 5);
  return index < 2;
}

function drawBubbleMotionCue(ctx: CanvasRenderingContext2D, mode: BubbleMode, accent: string, invert: boolean | undefined, local: number, lang: Lang) {
  ctx.strokeStyle = mode === "swap" || mode === "worst" ? "#fb7185" : accent;
  ctx.fillStyle = invert ? "#050505" : "#ffffff";
  ctx.lineWidth = 8;
  ctx.font = "950 54px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(getBubbleCueLabel(mode, lang), 1320, 760);
  if (mode === "swap") {
    const shift = easeInOutCubic(clamp01((local - 0.12) / 0.76)) * 150;
    ctx.beginPath(); ctx.moveTo(450, 618); ctx.bezierCurveTo(500, 570, 610, 570, 660, 618); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(660, 650); ctx.bezierCurveTo(610, 700, 500, 700, 450, 650); ctx.stroke();
    ctx.fillStyle = "#fb7185";
    ctx.beginPath(); ctx.arc(450 + shift, 618 - Math.sin(shift / 150 * Math.PI) * 42, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(660 - shift, 650 + Math.sin(shift / 150 * Math.PI) * 42, 12, 0, Math.PI * 2); ctx.fill();
  } else if (mode === "biggest" || mode === "pass") {
    const sweep = 420 + easeOutCubic(local) * 680;
    ctx.beginPath(); ctx.moveTo(420, 630); ctx.lineTo(sweep, 630); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sweep - 28, 606); ctx.lineTo(sweep, 630); ctx.lineTo(sweep - 28, 654); ctx.stroke();
  } else if (mode === "worst") {
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(420 + i * 120, 630 + i * 12); ctx.lineTo(500 + i * 120, 630 + i * 12); ctx.stroke();
    }
  } else {
    roundRect(ctx, 410, 626, 218, 236, 24);
    ctx.stroke();
  }
}

function drawSwapTrack(ctx: CanvasRenderingContext2D, x: number, y: number, cell: number, gap: number, progress: number) {
  const left = x + cell / 2;
  const right = x + cell + gap + cell / 2;
  const top = y - 204;
  const bottom = y + 66;
  ctx.save();
  ctx.strokeStyle = "rgba(251,113,133,0.82)";
  ctx.lineWidth = 6;
  ctx.setLineDash([18, 16]);
  ctx.lineDashOffset = -progress * 80;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.bezierCurveTo(left + 70, top - 70, right - 70, top - 70, right, top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(right, bottom);
  ctx.bezierCurveTo(right - 70, bottom + 52, left + 70, bottom + 52, left, bottom);
  ctx.stroke();
  ctx.restore();
}

function getBubbleCueLabel(mode: BubbleMode, lang: Lang) {
  const vi = lang === "vi";
  if (mode === "swap") return vi ? "đổi chỗ hai cột" : "swap columns";
  if (mode === "lock") return vi ? "khóa đuôi sorted" : "sorted tail locks";
  if (mode === "biggest") return vi ? "lớn nhất chạy phải" : "biggest slides right";
  if (mode === "pass") return vi ? "một lượt quét" : "one full pass";
  if (mode === "best") return vi ? "best case: một pass" : "best case: one pass";
  if (mode === "worst") return vi ? "worst case: nhiều swap" : "worst case: many swaps";
  if (mode === "space") return vi ? "cùng mảng: O(1)" : "same array: O(1)";
  return vi ? "khung so sánh" : "compare window";
}

function drawKineticAlgorithmFlash(ctx: CanvasRenderingContext2D, params: Params, accent: string, invert?: boolean) {
  const arr = params.frame?.arr ?? [];
  if (!arr.length) return;
  const max = Math.max(...arr, 1);
  const startX = 220;
  const y = 810;
  const w = 720;
  const cell = w / arr.length;
  arr.forEach((value, index) => {
    const h = 34 + (value / max) * 150;
    ctx.fillStyle = params.frame?.highlight.includes(index)
      ? accent
      : params.frame?.swap.includes(index)
        ? "#fb7185"
        : invert ? "rgba(5,5,5,0.45)" : "rgba(255,255,255,0.22)";
    roundRect(ctx, startX + index * cell + 5, y - h, cell - 10, h, 12);
    ctx.fill();
  });
}

function drawKineticFooter(ctx: CanvasRenderingContext2D, params: Params, accent: string, invert?: boolean) {
  ctx.fillStyle = invert ? "rgba(5,5,5,0.65)" : "rgba(255,255,255,0.65)";
  ctx.font = "700 26px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${params.algoName} · ${params.lang === "vi" ? "chữ theo nhịp" : "beat text"}`, 74, 78);
  drawProgress(ctx, 74, H - 78, W - 148, 12, params.timelineProgress, accent);
}

function drawProgress(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, fill: string) {
  ctx.fillStyle = "rgba(15,23,42,0.16)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, Math.max(h, w * clamp01(value)), h, h / 2);
  ctx.fill();
}

function wordsFromText(value: string) {
  return value.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((word) => word.length > 1);
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3);
}

function easeInOutCubic(value: number) {
  const safe = clamp01(value);
  return safe < 0.5 ? 4 * safe * safe * safe : 1 - Math.pow(-2 * safe + 2, 3) / 2;
}

function easeOutBack(value: number) {
  const c1 = 1.70158, c3 = c1 + 1;
  const safe = clamp01(value);
  return 1 + c3 * Math.pow(safe - 1, 3) + c1 * Math.pow(safe - 1, 2);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
