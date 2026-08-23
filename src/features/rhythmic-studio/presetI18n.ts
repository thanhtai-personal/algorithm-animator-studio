import type { Lang } from "@/lib/i18n";
import type { RhythmicPresetId } from "./lib/studioPresets";

type PresetTextKey = RhythmicPresetId | "title" | "hint" | "toy-pegboard.hint" | "neon-comet.hint" | "rainbow-xylophone.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch the full Marble Music look without changing the current song.",
  "toy-pegboard": "Toy Pegboard",
  "neon-comet": "Neon Comet",
  "rainbow-xylophone": "Rainbow Xylophone",
  "toy-pegboard.hint": "Top-down pegs & toy tubes",
  "neon-comet.hint": "Dark void, galaxy marble & comet trail",
  "rainbow-xylophone.hint": "Bright room & rainbow music keys",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi toàn bộ phong cách Marble Music nhưng giữ nguyên bài nhạc hiện tại.",
  "toy-pegboard": "Toy Pegboard",
  "neon-comet": "Neon Comet",
  "rainbow-xylophone": "Rainbow Xylophone",
  "toy-pegboard.hint": "Top-down pegs & toy tubes",
  "neon-comet.hint": "Dark void, galaxy marble & comet trail",
  "rainbow-xylophone.hint": "Bright room & rainbow music keys",
};

export function presetText(lang: Lang, key: keyof typeof EN) {
  return (lang === "vi" ? VI : EN)[key];
}
