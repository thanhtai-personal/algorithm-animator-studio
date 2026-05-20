import type { Frame } from "./algorithms";
import { withTextShadow } from "./canvasText";
import type { Lang } from "./i18n";
import type { KineticCard } from "./kineticTypographyRenderer";
import { roundRect } from "./renderers/shapes";

type PancakeMode = "scan" | "max" | "flipTop" | "flipEnd" | "lock" | "cost" | "recap";

export function getPancakeKineticCards(sceneId: string, lang: Lang): KineticCard[] {
  const vi = lang === "vi";
  const steps: KineticCard[] = [
    { top: vi ? "VÒNG HIỆN TẠI" : "CURRENT ROUND", main: vi ? "XÉT PREFIX" : "UNLOCKED PREFIX", bottom: vi ? "chỉ làm việc trong đoạn chưa cố định" : "only work inside the unfixed segment", accent: "#38bdf8", values: [3, 6, 1, 5, 2, 4], pair: 5 },
    { top: vi ? "CHỌN MỤC TIÊU" : "TARGET", main: vi ? "SỐ LỚN NHẤT" : "LARGEST VALUE", bottom: vi ? "giá trị này phải về cuối đoạn" : "this value belongs at the segment end", accent: "#facc15", values: [3, 6, 1, 5, 2, 4], pair: 1 },
    { top: vi ? "NẾU CẦN" : "IF NEEDED", main: vi ? "ĐƯA LÊN MẶT TRÊN" : "MOVE TO TOP", bottom: vi ? "bỏ qua nếu mục tiêu đã ở index 0" : "skip this when target is already at index 0", accent: "#fb7185", rotate: -3, values: [3, 6, 1, 5, 2, 4], pair: 1 },
    { top: vi ? "NẾU CHƯA ĐÚNG CHỖ" : "IF NOT PLACED", main: vi ? "ĐẶT VÀO CUỐI ĐOẠN" : "PLACE AT END", bottom: vi ? "nếu đã ở cuối prefix thì không lật" : "if it is already at the prefix end, do not flip", accent: "#4ade80", invert: true, values: [6, 3, 1, 5, 2, 4], pair: 5 },
  ];
  const complexity: KineticCard[] = [
    { top: "BEST CASE", main: "O(n²)", bottom: vi ? "vẫn phải tìm max cho từng prefix" : "still scans each prefix", accent: "#facc15" },
    { top: "AVERAGE", main: "O(n²)", bottom: vi ? "mỗi vòng quét + tối đa hai lần lật" : "scan plus up to two flips per round", accent: "#facc15" },
    { top: "WORST CASE", main: "O(n²)", bottom: vi ? "nhiều lần lật prefix dài" : "many long prefix flips", accent: "#fb7185", rotate: -3 },
    { top: vi ? "BỘ NHỚ" : "SPACE", main: "O(1)", bottom: vi ? "đảo trực tiếp trong mảng" : "in-place prefix reversals", accent: "#38bdf8" },
    { top: vi ? "ỔN ĐỊNH?" : "STABLE?", main: vi ? "KHÔNG" : "NO", bottom: vi ? "lật prefix có thể đảo thứ tự bằng nhau" : "prefix flips can reorder equals", accent: "#fb7185" },
  ];
  const byScene: Record<string, KineticCard[]> = {
    intro: [
      { main: "PANCAKE SORT", bottom: vi ? "sắp xếp bằng lật prefix" : "sort by prefix flips", accent: "#facc15" },
      { main: vi ? "LUẬT DUY NHẤT" : "ONLY MOVE", bottom: vi ? "đảo prefix từ index 0" : "reverse a prefix from index 0", accent: "#fb7185" },
      { main: vi ? "XÂY TỪ CUỐI" : "BUILD FROM END", bottom: vi ? "mỗi vòng chốt thêm một vị trí" : "each round fixes one position", accent: "#4ade80", invert: true },
    ],
    "mental-model": [
      { main: vi ? "PANCAKE STACK" : "PANCAKE STACK", bottom: vi ? "muốn đổi vị trí phải flip từ đầu" : "to rearrange, flip from the top", accent: "#facc15" },
      { main: vi ? "ĐOẠN CHƯA XONG" : "UNFINISHED PART", bottom: vi ? "prefix ngắn dần sau mỗi vòng" : "the prefix becomes shorter each round", accent: "#38bdf8", values: [3, 6, 1, 5, 2, 4], pair: 5 },
      { main: vi ? "MỘT ĐIỂM ĐẾN" : "ONE DESTINATION", bottom: vi ? "cuối prefix là vị trí cần chốt" : "the prefix end is the target slot", accent: "#4ade80", invert: true, values: [3, 6, 1, 5, 2, 4], pair: 5 },
    ],
    steps,
    animation: [
      { top: "INPUT", main: "3 6 1 5 2 4", bottom: vi ? "đích của vòng này là index 5" : "this round targets index 5", accent: "#38bdf8", values: [3, 6, 1, 5, 2, 4], pair: 5 },
      { top: vi ? "QUÉT" : "SCAN", main: "6", bottom: vi ? "là giá trị lớn nhất trong prefix 0-5" : "is the largest value in prefix 0-5", accent: "#facc15", values: [3, 6, 1, 5, 2, 4], pair: 1 },
      { top: "FLIP 0-1", main: "6 3 1 5 2 4", bottom: vi ? "giá trị 6 đã ở mặt trên" : "value 6 is now on top", accent: "#fb7185", values: [3, 6, 1, 5, 2, 4], pair: 1 },
      { top: "FLIP 0-5", main: "4 2 5 1 3 6", bottom: vi ? "index 5 hoàn tất, không xét lại" : "index 5 is fixed and skipped later", accent: "#4ade80", invert: true, values: [6, 3, 1, 5, 2, 4], pair: 5 },
      { top: vi ? "THU NHỎ" : "SHRINK", main: "size = 5", bottom: vi ? "vòng kế tiếp chỉ xét 0-4" : "next round only checks 0-4", accent: "#38bdf8", values: [4, 2, 5, 1, 3, 6], pair: 4 },
    ],
    complexity: [
      ...complexity,
      { main: vi ? "HỌC ĐỂ NHỚ" : "WHY LEARN IT", bottom: vi ? "prefix reversal, invariant, in-place" : "prefix reversal, invariant, in-place", accent: "#4ade80" },
    ],
    recap: [
      { main: vi ? "MỖI VÒNG" : "EACH ROUND", bottom: vi ? "chốt đúng một vị trí cuối prefix" : "fixes one prefix-end position", accent: "#38bdf8" },
      { main: vi ? "0, 1, HOẶC 2 LẦN LẬT" : "0, 1, OR 2 FLIPS", bottom: vi ? "tùy vị trí mục tiêu" : "depends on target position", accent: "#fb7185", values: [3, 6, 1, 5, 2, 4], pair: 5 },
      { main: vi ? "PREFIX NGẮN DẦN" : "PREFIX SHRINKS", bottom: vi ? "suffix đã sorted được giữ nguyên" : "the sorted suffix remains fixed", accent: "#4ade80", invert: true },
      ...complexity.slice(0, 4),
    ],
  };
  return byScene[sceneId] ?? steps;
}

export function drawPancakeKineticIllustration(ctx: CanvasRenderingContext2D, frame: Frame | null | undefined, card: KineticCard, local: number, accent: string, lang: Lang) {
  const mode = getMode(card);
  const values = card.values ?? frame?.arr ?? [3, 6, 1, 5, 2, 4];
  const prefixEnd = Math.max(0, Math.min(values.length - 1, card.pair ?? Number(frame?.vars.to ?? 1)));
  const pop = easeOutBack(clamp01(local / 0.18));
  ctx.save();
  ctx.translate(0, (1 - pop) * 46);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = card.invert ? "rgba(3,7,18,0.9)" : "rgba(3,7,18,0.82)";
  roundRect(ctx, 235, 688, 1450, 262, 42);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  roundRect(ctx, 300, 720, 1018, 202, 34);
  ctx.fill();
  drawSpatula(ctx, mode, prefixEnd, values.length, local, accent);
  drawStack(ctx, values, mode, prefixEnd, local, accent);
  drawCue(ctx, mode, prefixEnd, values, accent, lang);
  ctx.restore();
}

function getMode(card: KineticCard): PancakeMode {
  const text = `${card.top ?? ""} ${card.main} ${card.bottom ?? ""}`.toLowerCase();
  if (text.includes("o(") || text.includes("case") || text.includes("bộ nhớ") || text.includes("space") || text.includes("stable")) return "cost";
  if (text.includes("flip a") || text.includes("flip to top") || text.includes("lật a") || text.includes("mặt trên") || text.includes("0-1")) return "flipTop";
  if (text.includes("flip b") || text.includes("flip to bottom") || text.includes("đặt vào cuối") || text.includes("về đáy") || text.includes("0-5")) return "flipEnd";
  if (text.includes("lock") || text.includes("khóa") || text.includes("suffix") || text.includes("đáy")) return "lock";
  if (text.includes("largest") || text.includes("lớn nhất") || text.includes("max")) return "max";
  if (text.includes("prefix") || text.includes("quét") || text.includes("xét")) return "scan";
  return "recap";
}

function drawStack(ctx: CanvasRenderingContext2D, values: number[], mode: PancakeMode, prefixEnd: number, local: number, accent: string) {
  const maxValue = Math.max(...values, 1);
  const cx = 810;
  const baseY = 898;
  const layerH = 34;
  const maxW = 930;
  const minW = 300;
  const flip = mode === "flipTop" || mode === "flipEnd";
  const t = flip ? easeInOutCubic(clamp01(local / 0.76)) : 0;
  values.forEach((value, index) => {
    const inPrefix = index <= prefixEnd;
    const targetIndex = flip && inPrefix ? prefixEnd - index : index;
    const y0 = baseY - (values.length - index) * layerH;
    const y1 = baseY - (values.length - targetIndex) * layerH;
    const y = flip && inPrefix ? lerp(y0, y1, t) - Math.sin(t * Math.PI) * 92 : y0;
    const width = minW + (value / maxValue) * (maxW - minW);
    const active = inPrefix && (mode === "scan" || mode === "max" || mode === "flipTop" || mode === "flipEnd");
    const locked = mode === "lock" && index >= Math.max(0, values.length - 1);
    ctx.save();
    ctx.translate(cx, y + layerH / 2);
    if (flip && inPrefix) ctx.rotate((index % 2 ? -1 : 1) * Math.sin(t * Math.PI) * 0.11);
    ctx.fillStyle = locked ? "#4ade80" : active ? (mode === "scan" ? accent : "#fb7185") : "rgba(148,163,184,0.86)";
    roundRect(ctx, -width / 2, -layerH / 2, width, layerH - 6, 22);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    withTextShadow(ctx, 25, () => ctx.fillText(String(value), 0, 9));
    ctx.restore();
  });
}

function drawSpatula(ctx: CanvasRenderingContext2D, mode: PancakeMode, prefixEnd: number, length: number, local: number, accent: string) {
  if (mode !== "flipTop" && mode !== "flipEnd") return;
  const layerH = 34;
  const y = 898 - (length - prefixEnd) * layerH - 24;
  const width = 930;
  const t = easeInOutCubic(clamp01(local / 0.76));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = `${accent}dd`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(810 - width * 0.42, y);
  ctx.lineTo(810 + width * 0.42, y);
  ctx.stroke();
  ctx.fillStyle = accent;
  roundRect(ctx, 810 + width * 0.34 + Math.sin(t * Math.PI) * 18, y - 13, 150, 26, 13);
  ctx.fill();
  ctx.restore();
}

function drawCue(ctx: CanvasRenderingContext2D, mode: PancakeMode, prefixEnd: number, values: number[], accent: string, lang: Lang) {
  const vi = lang === "vi";
  const label = mode === "flipTop"
    ? (vi ? "đoạn ngắn 0-1" : "short prefix 0-1")
    : mode === "flipEnd"
      ? (vi ? "đoạn dài tới đích" : "long prefix to target")
      : mode === "lock"
        ? (vi ? "suffix tăng thêm 1" : "suffix grows by 1")
        : mode === "cost"
          ? (vi ? "chi phí nằm ở bước quét" : "cost comes from scanning")
          : mode === "max"
            ? (vi ? "mục tiêu của vòng" : "round target")
          : mode === "scan"
            ? (vi ? "vùng đang xử lý" : "active working range")
            : (vi ? "mẫu lặp chính" : "core loop pattern");
  ctx.fillStyle = "#ffffff";
  ctx.font = "950 52px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  withTextShadow(ctx, 52, () => ctx.fillText(label, 1288, 790));
  ctx.fillStyle = accent;
  ctx.font = "900 34px ui-sans-serif, system-ui, sans-serif";
  const prefix = mode === "lock" ? values.length - 1 : prefixEnd;
  withTextShadow(ctx, 34, () => ctx.fillText(`prefix 0-${prefix}`, 1290, 840));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
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
