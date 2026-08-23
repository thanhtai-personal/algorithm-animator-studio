import type { Lang } from "@/lib/i18n";
import type { RhythmicPresetId } from "./lib/studioPresets";

type PresetTextKey = RhythmicPresetId | "title" | "hint" | "toy-pegboard.hint" | "neon-comet.hint" | "rainbow-xylophone.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch the complete Marble Player behavior without changing the current song.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "toy-pegboard.hint": "Candy marble, tilted cylinders and dark studio board",
  "neon-comet.hint": "Galaxy marble, luminous bumpers and long ribbon trails",
  "rainbow-xylophone.hint": "Grouped keys, pads, cymbals, rails and wire instruments",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi toàn bộ hành vi Marble Player nhưng giữ nguyên bài nhạc hiện tại.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "toy-pegboard.hint": "Bi kẹo, ống trụ nghiêng và mặt bàn studio tối",
  "neon-comet.hint": "Bi galaxy, bệ sáng và dải đuôi neon dài",
  "rainbow-xylophone.hint": "Cụm phím, pad, chũm chọe, ray và nhạc cụ dây",
};

export function presetText(lang: Lang, key: keyof typeof EN) {
  return (lang === "vi" ? VI : EN)[key];
}
