import type { Frame } from "./algorithms";
import { withTextShadow } from "./canvasText";
import type { Lang } from "./i18n";
import type { KineticCard } from "./kineticTypographyRenderer";
import { roundRect } from "./renderers/shapes";

type OddEvenMode = "phase" | "swap" | "noswap" | "parallel" | "stop" | "cost";

export function getOddEvenKineticCards(sceneId: string, lang: Lang): KineticCard[] {
  const vi = lang === "vi";
  const phaseCards: KineticCard[] = [
    { top: vi ? "PHA LẺ" : "ODD PHASE", main: "1-2  3-4", bottom: vi ? "các cặp không chồng nhau" : "non-overlapping pairs", accent: "#38bdf8", values: [6, 5, 4, 3, 2, 1], pair: 1 },
    { top: vi ? "PHA CHẴN" : "EVEN PHASE", main: "0-1  2-3", bottom: vi ? "dịch nhóm cặp sang trái một ô" : "shift the pair group by one", accent: "#facc15", values: [6, 4, 5, 2, 3, 1], pair: 0 },
    { top: vi ? "SAI THỨ TỰ" : "WRONG ORDER", main: "LEFT > RIGHT", bottom: vi ? "đổi chỗ ngay" : "swap immediately", accent: "#fb7185", rotate: -3, values: [6, 5, 4, 3, 2, 1], pair: 1 },
    { top: vi ? "ĐÚNG THỨ TỰ" : "RIGHT ORDER", main: "NO SWAP", bottom: vi ? "giữ nguyên và đi tiếp" : "keep order and continue", accent: "#4ade80", values: [1, 2, 3, 4, 5, 6], pair: 1 },
  ];
  const complexity: KineticCard[] = [
    { top: "BEST CASE", main: "O(n)", bottom: vi ? "một vòng không đổi chỗ" : "one round, no swaps", accent: "#4ade80", invert: true },
    { top: "AVERAGE", main: "O(n²)", bottom: vi ? "nhiều vòng pha lẻ + pha chẵn" : "many odd + even rounds", accent: "#facc15" },
    { top: "WORST CASE", main: "O(n²)", bottom: vi ? "đảo ngược: đổi chỗ liên tục" : "reversed input swaps nonstop", accent: "#fb7185", rotate: -3 },
    { top: vi ? "BỘ NHỚ" : "SPACE", main: "O(1)", bottom: vi ? "đổi trực tiếp trong mảng" : "in-place swaps", accent: "#38bdf8" },
  ];
  const byScene: Record<string, KineticCard[]> = {
    "odd-even-intro": [
      { main: "ODD-EVEN SORT", bottom: vi ? "Bubble Sort theo hai nhịp" : "Bubble Sort in two beats", accent: "#38bdf8" },
      { main: vi ? "HAI NHỊP" : "TWO BEATS", bottom: vi ? "một nhịp lẻ, một nhịp chẵn" : "one odd beat, one even beat", accent: "#facc15" },
      { main: vi ? "MỤC TIÊU" : "GOAL", bottom: vi ? "sửa dần mọi cặp kề nhau" : "repair adjacent pairs gradually", accent: "#4ade80", invert: true },
    ],
    "odd-even-mental-model": [
      { main: vi ? "KHÔNG CHỒNG CẶP" : "NO OVERLAP", bottom: vi ? "1-2 và 3-4 chạy độc lập" : "1-2 and 3-4 are independent", accent: "#38bdf8" },
      { main: vi ? "MẠNG SẮP XẾP" : "SORTING NETWORK", bottom: vi ? "compare-swap theo lớp" : "compare-swap in layers", accent: "#4ade80", invert: true },
      { main: vi ? "LOCAL -> GLOBAL" : "LOCAL -> GLOBAL", bottom: vi ? "lỗi nhỏ trôi dần về đúng chỗ" : "small fixes create full order", accent: "#facc15" },
    ],
    "phase-walkthrough": [
      { top: "INPUT", main: "6 5 4 3 2 1", bottom: vi ? "bắt đầu bằng pha lẻ" : "start with odd phase", accent: "#38bdf8", values: [6, 5, 4, 3, 2, 1], pair: 1 },
      { top: vi ? "PHA LẺ" : "ODD PHASE", main: "5 > 4", bottom: vi ? "đổi chỗ cặp 1-2" : "swap pair 1-2", accent: "#fb7185", values: [6, 5, 4, 3, 2, 1], pair: 1 },
      { top: vi ? "PHA LẺ" : "ODD PHASE", main: "3 > 2", bottom: vi ? "đổi chỗ cặp 3-4" : "swap pair 3-4", accent: "#fb7185", values: [6, 4, 5, 3, 2, 1], pair: 3 },
      { top: vi ? "PHA CHẴN" : "EVEN PHASE", main: "6 > 4", bottom: vi ? "nhóm cặp dịch sang trái" : "pair group shifts left", accent: "#fb7185", values: [6, 4, 5, 2, 3, 1], pair: 0 },
      { top: vi ? "PHA CHẴN" : "EVEN PHASE", main: "5 > 2", bottom: vi ? "tiếp tục đổi chỗ" : "swap again", accent: "#fb7185", values: [4, 6, 5, 2, 3, 1], pair: 2 },
      { top: vi ? "PHA CHẴN" : "EVEN PHASE", main: "3 > 1", bottom: vi ? "vòng này chưa thể dừng" : "this round cannot stop yet", accent: "#fb7185", values: [4, 6, 2, 5, 3, 1], pair: 4 },
    ],
    "odd-even-animation": [
      { top: vi ? "CỜ DỪNG" : "STOP FLAG", main: "sorted = true", bottom: vi ? "đặt lại ở đầu mỗi vòng" : "reset at the start of a round", accent: "#38bdf8", values: [4, 6, 2, 5, 1, 3], pair: 0 },
      { top: vi ? "CÓ SWAP" : "SWAP HAPPENS", main: "sorted = false", bottom: vi ? "vòng sau vẫn phải chạy" : "another round is required", accent: "#fb7185", values: [4, 6, 2, 5, 1, 3], pair: 2 },
      { top: vi ? "VÒNG SẠCH" : "CLEAN ROUND", main: "0 SWAP", bottom: vi ? "mọi cặp kề đã đúng" : "all adjacent pairs are ordered", accent: "#4ade80", invert: true, values: [1, 2, 3, 4, 5, 6], pair: 1 },
      { main: vi ? "DỪNG" : "STOP", bottom: vi ? "không cần quét thêm" : "no more scans needed", accent: "#4ade80", invert: true, values: [1, 2, 3, 4, 5, 6], pair: 3 },
    ],
    "odd-even-complexity": [
      ...complexity,
      { main: vi ? "ĐÁNG HỌC" : "WHY LEARN IT", bottom: vi ? "cấu trúc phase, không phải tốc độ" : "phase structure, not speed", accent: "#4ade80" },
    ],
    "odd-even-recap": [
      { main: vi ? "NHỚ 4 TỪ" : "FOUR WORDS", bottom: vi ? "lẻ, chẵn, swap, dừng" : "odd, even, swap, stop", accent: "#38bdf8" },
      { main: vi ? "LẺ / CHẴN" : "ODD / EVEN", bottom: vi ? "chọn nhóm cặp" : "choose the pair group", accent: "#facc15" },
      { main: vi ? "SWAP / STOP" : "SWAP / STOP", bottom: vi ? "quyết định vòng tiếp theo" : "decide the next round", accent: "#4ade80", invert: true },
    ],
  };
  return byScene[sceneId] ?? phaseCards;
}

export function drawOddEvenKineticIllustration(ctx: CanvasRenderingContext2D, frame: Frame | null | undefined, card: KineticCard, local: number, accent: string, lang: Lang) {
  const mode = getMode(card);
  const values = card.values ?? frame?.arr ?? (mode === "stop" ? [1, 2, 3, 4, 5, 6] : [6, 5, 4, 3, 2, 1]);
  const pair = Math.max(0, Math.min(values.length - 2, card.pair ?? (mode === "phase" ? 1 : 0)));
  const pop = easeOutBack(clamp01(local / 0.28));
  ctx.save();
  ctx.translate(0, (1 - pop) * 46);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = card.invert ? "rgba(5,5,5,0.18)" : "rgba(255,255,255,0.1)";
  roundRect(ctx, 230, 698, 1460, 238, 38);
  ctx.fill();
  drawPhaseRails(ctx, values.length, mode, pair, accent, local);
  drawBars(ctx, values, mode, pair, local, accent);
  drawCue(ctx, mode, pair, values.length, local, accent, lang);
  ctx.restore();
}

function getMode(card: KineticCard): OddEvenMode {
  const text = `${card.top ?? ""} ${card.main} ${card.bottom ?? ""}`.toLowerCase();
  if (text.includes("o(") || text.includes("case") || text.includes("bộ nhớ") || text.includes("space")) return "cost";
  if (text.includes("parallel") || text.includes("song song") || text.includes("overlap") || text.includes("chồng")) return "parallel";
  if (text.includes("no swap") || text.includes("không còn") || text.includes("sạch") || text.includes("stop") || text.includes("dừng")) return "stop";
  if (text.includes(">") || text.includes("swap") || text.includes("đổi")) return "swap";
  if (text.includes("right order") || text.includes("đúng thứ tự")) return "noswap";
  return "phase";
}

function drawPhaseRails(ctx: CanvasRenderingContext2D, length: number, mode: OddEvenMode, pair: number, accent: string, local: number) {
  const x = 390, y = 884, w = 880, gap = 18;
  const cell = (w - gap * (length - 1)) / length;
  const phaseStart = mode === "phase" || mode === "parallel" ? pair % 2 : pair;
  ctx.save();
  ctx.lineWidth = 8;
  ctx.strokeStyle = mode === "swap" ? "#fb7185" : accent;
  ctx.setLineDash(mode === "parallel" ? [22, 16] : []);
  ctx.lineDashOffset = -local * 90;
  for (let i = phaseStart; i < length - 1; i += 2) {
    const left = x + i * (cell + gap) + cell / 2;
    const right = left + cell + gap;
    ctx.beginPath();
    ctx.moveTo(left, y - 210);
    ctx.bezierCurveTo(left + 54, y - 254, right - 54, y - 254, right, y - 210);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBars(ctx: CanvasRenderingContext2D, values: number[], mode: OddEvenMode, pair: number, local: number, accent: string) {
  const max = Math.max(...values, 1);
  const x = 390, y = 884, w = 880, gap = 18;
  const cell = (w - gap * (values.length - 1)) / values.length;
  const swapT = mode === "swap" ? easeInOutCubic(clamp01((local - 0.1) / 0.76)) : 0;
  values.forEach((value, index) => {
    const active = index === pair || index === pair + 1 || (mode === "parallel" && index % 2 === pair % 2);
    const h = 44 + (value / max) * 136;
    const lift = mode === "swap" && (index === pair || index === pair + 1) ? -36 * Math.sin(swapT * Math.PI) : 0;
    const swapOffset = mode === "swap" && (index === pair || index === pair + 1) ? (index === pair ? 1 : -1) * (cell + gap) * swapT : 0;
    ctx.fillStyle = mode === "swap" && active ? "#fb7185" : active ? accent : "rgba(255,255,255,0.24)";
    roundRect(ctx, x + index * (cell + gap) + swapOffset, y - h + lift, cell, h, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 28px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 28, () => ctx.fillText(String(value), x + index * (cell + gap) + swapOffset + cell / 2, y + 42));
  });
}

function drawCue(ctx: CanvasRenderingContext2D, mode: OddEvenMode, pair: number, length: number, local: number, accent: string, lang: Lang) {
  const cell = (880 - 18 * (length - 1)) / length;
  const left = 390 + pair * (cell + 18) + cell / 2;
  const right = left + cell + 18;
  ctx.strokeStyle = mode === "swap" ? "#fb7185" : accent;
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.font = "950 54px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  withTextShadow(ctx, 54, () => ctx.fillText(labelFor(mode, lang), 1320, 804));
  if (mode === "swap") {
    const t = easeInOutCubic(clamp01((local - 0.1) / 0.76));
    ctx.beginPath(); ctx.moveTo(left, 714); ctx.bezierCurveTo(left + 54, 654, right - 54, 654, right, 714); ctx.stroke();
    ctx.fillStyle = "#fb7185"; ctx.beginPath(); ctx.arc(left + (right - left) * t, 700 - Math.sin(t * Math.PI) * 36, 14, 0, Math.PI * 2); ctx.fill();
  } else if (mode === "stop") {
    ctx.strokeStyle = "#4ade80";
    roundRect(ctx, 388, 674, 890, 266, 34);
    ctx.stroke();
  }
}

function labelFor(mode: OddEvenMode, lang: Lang) {
  const vi = lang === "vi";
  if (mode === "swap") return vi ? "đổi chỗ" : "swap";
  if (mode === "parallel") return vi ? "cặp độc lập" : "independent pairs";
  if (mode === "stop") return vi ? "không đổi chỗ" : "no swaps";
  if (mode === "cost") return vi ? "chi phí theo vòng" : "round cost";
  if (mode === "noswap") return vi ? "giữ nguyên" : "keep order";
  return vi ? "nhóm cặp" : "pair group";
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
