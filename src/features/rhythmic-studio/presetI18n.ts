import type { Lang } from "@/lib/i18n";
import type { RhythmicPresetId } from "./lib/studioPresets";

type PresetTextKey = RhythmicPresetId
  | "title"
  | "hint"
  | "mix"
  | "mix.on"
  | "mix.off"
  | "mix.wait"
  | "mix.hint"
  | "toy-pegboard.hint"
  | "neon-comet.hint"
  | "rainbow-xylophone.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch Marble Player behavior without changing the current song.",
  mix: "Auto preset mix",
  "mix.on": "Mix on",
  "mix.off": "Mix off",
  "mix.wait": "Finding phrase breaks",
  "mix.hint": "Runs each preset for a full phrase. It prefers real rests; dense songs use the quietest phrase boundary near the target duration. The background stays locked.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "toy-pegboard.hint": "Candy marble, guided tubes and a dark studio board",
  "neon-comet.hint": "Galaxy marble, luminous pads and controlled ribbon jumps",
  "rainbow-xylophone.hint": "Grouped keys, pads, cymbals and rails with wider camera framing",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi hành vi Marble Player nhưng giữ nguyên bài nhạc hiện tại.",
  mix: "Mix preset tự động",
  "mix.on": "Đang Mix",
  "mix.off": "Tắt Mix",
  "mix.wait": "Đang tìm điểm chuyển",
  "mix.hint": "Mỗi preset chạy trọn một quãng đủ dài. Ưu tiên khoảng nghỉ thật; với MIDI dày sẽ chọn điểm thở thưa nốt tốt nhất gần mốc chuyển. Phông nền được khóa nguyên.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "toy-pegboard.hint": "Bi kẹo, ống dẫn rõ và mặt bàn studio tối",
  "neon-comet.hint": "Bi galaxy, bệ sáng và các cú nảy ribbon được kiểm soát",
  "rainbow-xylophone.hint": "Cụm phím, pad, chũm chọe và ray với camera thoáng hơn",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
