import type { Lang } from "@/lib/i18n";
import type { RhythmicPresetId } from "./lib/studioPresets";

type PresetTextKey = RhythmicPresetId | "title" | "hint" | "toy-pegboard.hint" | "neon-comet.hint" | "rainbow-xylophone.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch the whole behavior and look while keeping the current song.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Galaxy Comet Run",
  "rainbow-xylophone": "Rainbow Key Run",
  "toy-pegboard.hint": "Dark board, angled cylinders and candy marble",
  "neon-comet.hint": "Black space, comet arcs and neon trail",
  "rainbow-xylophone.hint": "Perspective rainbow keys with low toy bounce",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi cả hành vi và hình ảnh nhưng giữ nguyên bài nhạc hiện tại.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Galaxy Comet Run",
  "rainbow-xylophone": "Rainbow Key Run",
  "toy-pegboard.hint": "Nền tối, ống nghiêng và viên bi kẹo",
  "neon-comet.hint": "Không gian đen, cung sao chổi và đuôi neon",
  "rainbow-xylophone.hint": "Phím cầu vồng phối cảnh với cú nảy thấp",
};

export function presetText(lang: Lang, key: keyof typeof EN) {
  return (lang === "vi" ? VI : EN)[key];
}
