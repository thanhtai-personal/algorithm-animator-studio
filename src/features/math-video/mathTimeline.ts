export const MATH_FPS = 25;
export const MATH_WIDTH = 1280;
export const MATH_HEIGHT = 720;
export const MATH_FRAMES = 15217;
export const MATH_SECONDS = MATH_FRAMES / MATH_FPS;
export type MathChapter = { id: string; title: string; start: number; end: number; mode: "intro" | "circle" | "identity" | "wave" | "complement" | "tangent" | "history" | "sound" | "astronomy" | "height" | "electric" | "final" };
/** Draft chapter boundaries from sampled reference; NOT shot-by-shot verified. */
export const MATH_CHAPTERS: readonly MathChapter[] = [
  { id: "intro", title: "Tam giác vuông và sin/cos", start: 0, end: 1000, mode: "intro" },
  { id: "circle", title: "Đường tròn lượng giác", start: 1000, end: 2750, mode: "circle" },
  { id: "identity", title: "sin² α + cos² α = 1", start: 2750, end: 4250, mode: "identity" },
  { id: "wave", title: "Từ đường tròn tới sóng", start: 4250, end: 5500, mode: "wave" },
  { id: "complement", title: "Các góc phụ nhau", start: 5500, end: 6000, mode: "complement" },
  { id: "tangent", title: "Tangent: tan = sin / cos", start: 6000, end: 7375, mode: "tangent" },
  { id: "history", title: "Cung, dây cung và lịch sử sin", start: 7375, end: 8750, mode: "history" },
  { id: "sound", title: "Sóng và âm thanh", start: 8750, end: 9375, mode: "sound" },
  { id: "astronomy", title: "Thiên văn và phép đo", start: 9375, end: 10625, mode: "astronomy" },
  { id: "height", title: "Tính chiều cao bằng lượng giác", start: 10625, end: 12625, mode: "height" },
  { id: "electric", title: "Sóng điện xoay chiều", start: 12625, end: 14000, mode: "electric" },
  { id: "final", title: "Trở lại câu hỏi sin 120°", start: 14000, end: 15217, mode: "final" },
];
export function chapterAt(frame: number): MathChapter {
  return MATH_CHAPTERS.find(c => frame >= c.start && frame < c.end) ?? MATH_CHAPTERS[MATH_CHAPTERS.length - 1];
}
export function formatMathTime(frames: number) {
  const seconds = Math.floor(frames / MATH_FPS);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
