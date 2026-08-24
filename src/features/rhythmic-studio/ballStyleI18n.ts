import type { Lang } from "@/lib/i18n";
import type { BallStyle } from "./types";

const EN: Record<BallStyle, string> = {
  classic: "Classic",
  chrome: "Chrome",
  glass: "Glass",
  neon: "Magic Neon orb",
  striped: "Striped toy",
  prism: "Magic Prism",
  flower: "Candy Flower",
  fire: "Fire Marble",
  water: "Water Orb",
  rainbow: "Rainbow Ball",
};

const VI: typeof EN = {
  classic: "Cổ điển",
  chrome: "Mạ chrome",
  glass: "Thủy tinh",
  neon: "Bi neon ma thuật",
  striped: "Bi sọc đồ chơi",
  prism: "Lăng kính ma thuật",
  flower: "Bi hoa kẹo",
  fire: "Bi lửa",
  water: "Bi nước",
  rainbow: "Bi cầu vồng",
};

export function ballStyleText(lang: Lang, style: BallStyle) {
  return (lang === "vi" ? VI : EN)[style];
}
