import type { Frame } from "./algorithms";
import { withTextShadow } from "./canvasText";
import type { Lang } from "./i18n";
import type { KineticCard } from "./kineticTypographyRenderer";
import { roundRect } from "./renderers/shapes";

type BitonicMode = "split" | "asc" | "desc" | "compare" | "swap" | "merge" | "cost" | "done";

export function getBitonicKineticCards(sceneId: string, lang: Lang): KineticCard[] {
  const vi = lang === "vi";
  const network: KineticCard[] = [
    { top: vi ? "BƯỚC 1" : "STEP 1", main: vi ? "CHIA HAI HƯỚNG" : "SPLIT DIRECTIONS", bottom: vi ? "trái tăng, phải giảm" : "left asc, right desc", accent: "#38bdf8", values: [10, 30, 11, 20, 4, 33, 2, 1], pair: 0 },
    { top: "ASC", main: vi ? "NHỎ TRƯỚC" : "SMALL FIRST", bottom: vi ? "nếu trái > phải thì swap" : "swap if left > right", accent: "#4ade80", values: [10, 30, 11, 20, 4, 33, 2, 1], pair: 0 },
    { top: "DESC", main: vi ? "LỚN TRƯỚC" : "BIG FIRST", bottom: vi ? "nếu trái < phải thì swap" : "swap if left < right", accent: "#facc15", values: [10, 30, 11, 20, 33, 4, 2, 1], pair: 4 },
    { top: vi ? "MERGE" : "MERGE", main: vi ? "GAP GIẢM DẦN" : "SHRINK THE GAP", bottom: vi ? "4, rồi 2, rồi 1" : "4, then 2, then 1", accent: "#38bdf8", values: [10, 11, 20, 30, 33, 4, 2, 1], pair: 0 },
    { top: vi ? "COMPARE" : "COMPARE", main: "30 > 1", bottom: vi ? "ASC cần đổi chỗ" : "ASC needs a swap", accent: "#fb7185", rotate: -3, values: [10, 11, 20, 30, 33, 4, 2, 1], pair: 3 },
    { top: vi ? "KẾT QUẢ" : "RESULT", main: "SORTED", bottom: vi ? "network chạy theo cấu trúc cố định" : "fixed compare-swap structure", accent: "#4ade80", invert: true, values: [1, 2, 4, 10, 11, 20, 30, 33], pair: 6 },
  ];
  const complexity: KineticCard[] = [
    { top: "BEST CASE", main: "O(n log² n)", bottom: vi ? "network vẫn chạy đủ lớp" : "the network still runs all layers", accent: "#facc15" },
    { top: "AVERAGE", main: "O(n log² n)", bottom: vi ? "so sánh theo gap cố định" : "fixed gap comparisons", accent: "#38bdf8" },
    { top: "WORST CASE", main: "O(n log² n)", bottom: vi ? "không phụ thuộc input như Bubble" : "not input-sensitive like Bubble", accent: "#fb7185" },
    { top: vi ? "BỘ NHỚ" : "SPACE", main: "O(log n)", bottom: vi ? "đệ quy theo mạng merge" : "recursive merge structure", accent: "#4ade80", invert: true },
  ];
  const byScene: Record<string, KineticCard[]> = {
    intro: [
      { main: "BITONIC SORT", bottom: vi ? "sorting network theo gap và hướng" : "sorting network by gap and direction", accent: "#38bdf8" },
      { main: vi ? "KHÔNG QUÉT KỀ NHAU" : "NOT ADJACENT SCAN", bottom: vi ? "so sánh các cặp cách xa" : "compare distant pairs", accent: "#facc15" },
      { main: vi ? "CỐ ĐỊNH CẤU TRÚC" : "FIXED STRUCTURE", bottom: vi ? "hợp cho tư duy song song" : "good for parallel thinking", accent: "#4ade80", invert: true },
    ],
    "mental-model": [
      { main: vi ? "DÃY BITONIC" : "BITONIC SEQUENCE", bottom: vi ? "một nửa đi lên, một nửa đi xuống" : "one side rises, one side falls", accent: "#38bdf8", values: [1, 4, 8, 9, 10, 7, 5, 2], pair: 0 },
      { main: "ASC / DESC", bottom: vi ? "hướng quyết định điều kiện swap" : "direction decides the swap rule", accent: "#facc15", values: [10, 30, 11, 20, 4, 33, 2, 1], pair: 4 },
      { main: vi ? "MERGE BẰNG GAP" : "MERGE BY GAP", bottom: vi ? "gap lớn tách nhóm, gap nhỏ tinh chỉnh" : "large gaps split, small gaps refine", accent: "#4ade80", values: [10, 11, 20, 30, 33, 4, 2, 1], pair: 0 },
    ],
    steps: network,
    animation: [
      { top: "INPUT", main: "10 30 11 20 4 33 2 1", bottom: vi ? "đưa về kích thước power-of-two" : "work best at power-of-two sizes", accent: "#38bdf8", values: [10, 30, 11, 20, 4, 33, 2, 1], pair: 0 },
      { top: vi ? "TẠO HƯỚNG" : "BUILD DIRECTIONS", main: "ASC / DESC", bottom: vi ? "hai nửa ngược chiều" : "two halves point opposite ways", accent: "#facc15", values: [10, 11, 20, 30, 33, 4, 2, 1], pair: 4 },
      { top: "GAP 4", main: "30 > 1", bottom: vi ? "cặp xa được so sánh trước" : "distant pair first", accent: "#fb7185", values: [10, 11, 20, 30, 33, 4, 2, 1], pair: 3 },
      { top: "GAP 2", main: vi ? "TINH CHỈNH" : "REFINE", bottom: vi ? "mạng thu khoảng cách lại" : "the network shrinks distance", accent: "#38bdf8", values: [4, 2, 1, 10, 11, 20, 30, 33], pair: 0 },
      { top: "GAP 1", main: "SORTED", bottom: vi ? "lớp cuối sửa cặp sát nhau" : "last layer fixes neighbors", accent: "#4ade80", invert: true, values: [1, 2, 4, 10, 11, 20, 30, 33], pair: 6 },
    ],
    complexity: [...complexity, { main: vi ? "ĐIỂM MẠNH" : "STRENGTH", bottom: vi ? "lịch compare-swap rất đều" : "regular compare-swap schedule", accent: "#4ade80" }],
    recap: [
      { main: vi ? "NHỚ 4 TỪ" : "FOUR WORDS", bottom: vi ? "bitonic, hướng, gap, swap" : "bitonic, direction, gap, swap", accent: "#38bdf8" },
      { main: "ASC / DESC", bottom: vi ? "hai luật swap khác nhau" : "two different swap rules", accent: "#facc15" },
      { main: "GAP 4 -> 2 -> 1", bottom: vi ? "merge bằng khoảng cách giảm dần" : "merge by shrinking distance", accent: "#4ade80", invert: true },
      ...complexity,
    ],
  };
  return byScene[sceneId] ?? network;
}

export function drawBitonicKineticIllustration(ctx: CanvasRenderingContext2D, frame: Frame | null | undefined, card: KineticCard, local: number, accent: string, lang: Lang) {
  const mode = getMode(card);
  const values = card.values ?? frame?.arr ?? [10, 30, 11, 20, 4, 33, 2, 1];
  const pair = Math.max(0, Math.min(values.length - 2, card.pair ?? 0));
  const pop = easeOutBack(clamp01(local / 0.24));
  ctx.save();
  ctx.translate(0, (1 - pop) * 46);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = card.invert ? "rgba(3,7,18,0.9)" : "rgba(3,7,18,0.82)";
  roundRect(ctx, 220, 690, 1480, 260, 42);
  ctx.fill();
  drawNetworkArcs(ctx, values.length, mode, pair, accent, local);
  drawBars(ctx, values, mode, pair, local, accent);
  drawCue(ctx, mode, pair, values.length, accent, lang);
  ctx.restore();
}

function getMode(card: KineticCard): BitonicMode {
  const text = `${card.top ?? ""} ${card.main} ${card.bottom ?? ""}`.toLowerCase();
  if (text.includes("o(") || text.includes("case") || text.includes("space") || text.includes("bộ nhớ")) return "cost";
  if (text.includes("sorted") || text.includes("kết quả")) return "done";
  if (text.includes(">") || text.includes("<") || text.includes("swap") || text.includes("đổi")) return "swap";
  if (text.includes("gap") || text.includes("merge")) return "merge";
  if (text.includes("desc") || text.includes("giảm")) return "desc";
  if (text.includes("asc") || text.includes("tăng")) return "asc";
  if (text.includes("split") || text.includes("chia") || text.includes("hướng")) return "split";
  return "compare";
}

function drawNetworkArcs(ctx: CanvasRenderingContext2D, length: number, mode: BitonicMode, pair: number, accent: string, local: number) {
  const cell = (900 - 18 * (length - 1)) / length;
  ctx.save();
  ctx.lineWidth = mode === "swap" ? 10 : 7;
  ctx.strokeStyle = mode === "swap" ? "#fb7185" : accent;
  ctx.setLineDash(mode === "merge" || mode === "split" ? [22, 16] : []);
  ctx.lineDashOffset = -local * 100;
  if (mode === "split" || mode === "merge" || mode === "cost") {
    const gap = mode === "split" ? 1 : Math.max(1, Math.floor(length / 2));
    for (let i = 0; i + gap < length; i += gap * 2) drawArc(ctx, i, i + gap, cell, accent);
  } else {
    drawArc(ctx, pair, Math.min(length - 1, pair + Math.max(1, Math.floor(length / 2))), cell, accent);
  }
  ctx.restore();
}

function drawArc(ctx: CanvasRenderingContext2D, a: number, b: number, cell: number, accent: string) {
  const x = 390, y = 884, step = cell + 18;
  const left = x + a * step + cell / 2;
  const right = x + b * step + cell / 2;
  const height = Math.min(180, 62 + Math.abs(b - a) * 18);
  ctx.strokeStyle = `${accent}dd`;
  ctx.beginPath();
  ctx.moveTo(left, y - 222);
  ctx.bezierCurveTo(left, y - 222 - height, right, y - 222 - height, right, y - 222);
  ctx.stroke();
}

function drawBars(ctx: CanvasRenderingContext2D, values: number[], mode: BitonicMode, pair: number, local: number, accent: string) {
  const max = Math.max(...values, 1);
  const x = 390, y = 884, w = 900, gap = 18;
  const cell = (w - gap * (values.length - 1)) / values.length;
  const compareGap = mode === "swap" || mode === "compare" ? Math.max(1, Math.floor(values.length / 2)) : 1;
  const mate = Math.min(values.length - 1, pair + compareGap);
  const swapT = mode === "swap" ? easeInOutCubic(clamp01((local - 0.1) / 0.76)) : 0;
  values.forEach((value, index) => {
    const active = index === pair || index === mate || mode === "split" && (index === 0 || index === values.length / 2);
    const h = 44 + (value / max) * 138;
    const dir = index === pair ? 1 : index === mate ? -1 : 0;
    const offset = dir * (cell + gap) * compareGap * swapT;
    const lift = active && mode === "swap" ? -38 * Math.sin(swapT * Math.PI) : 0;
    ctx.fillStyle = mode === "done" ? "#4ade80" : active ? (mode === "swap" ? "#fb7185" : accent) : index < values.length / 2 ? "rgba(56,189,248,0.32)" : "rgba(250,204,21,0.28)";
    roundRect(ctx, x + index * (cell + gap) + offset, y - h + lift, cell, h, 18);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 26px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 26, () => ctx.fillText(String(value), x + index * (cell + gap) + offset + cell / 2, y + 42));
  });
}

function drawCue(ctx: CanvasRenderingContext2D, mode: BitonicMode, pair: number, length: number, accent: string, lang: Lang) {
  const vi = lang === "vi";
  const label = mode === "swap" ? (vi ? "swap theo hướng" : "direction swap")
    : mode === "merge" ? (vi ? "gap giảm dần" : "shrinking gap")
      : mode === "split" ? "asc / desc"
        : mode === "done" ? "sorted"
          : mode === "cost" ? "O(n log² n)"
            : (vi ? "compare theo network" : "network compare");
  ctx.fillStyle = "#ffffff";
  ctx.font = "950 52px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  withTextShadow(ctx, 52, () => ctx.fillText(label, 1320, 800));
  ctx.fillStyle = accent;
  ctx.font = "900 34px ui-sans-serif, system-ui, sans-serif";
  withTextShadow(ctx, 34, () => ctx.fillText(`pair ${pair}-${Math.min(length - 1, pair + Math.max(1, Math.floor(length / 2)))}`, 1322, 850));
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
