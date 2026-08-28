import type { Lang } from "@/lib/i18n";
import type { RhythmicPresetId } from "./lib/studioPresets";

type PresetTextKey = RhythmicPresetId
  | `${RhythmicPresetId}.hint`
  | "title"
  | "hint"
  | "mix"
  | "mix.on"
  | "mix.off"
  | "mix.wait"
  | "mix.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch Marble Player behavior. A matched performance preset also loads its reference melody.",
  mix: "Mix",
  "mix.on": "Mix on",
  "mix.off": "Mix off",
  "mix.wait": "Finding phrase breaks",
  "mix.hint": "Runs each preset for a full phrase. It prefers real rests; dense songs use the quietest phrase boundary near the target duration. The first preset is randomized each time Mix starts; later changes follow phrase breaks. The background and your current marble/VFX stay locked.",
  "toy-pegboard": "Reference · Color Pegs",
  "neon-comet": "Reference · Neon Course",
  "vibraphone-wall": "Reference · Instrument Gallery",
  "mixed-instruments": "Mixed instruments",
  "reference-korobeiniki-tubes": "Reference · Korobeiniki Tubes",
  "toy-pegboard.hint": "Colorful pegs arranged as a Korobeiniki wall score, with compressed spacing for fast notes",
  "neon-comet.hint": "Neon pads arranged on the Korobeiniki wall-score path with stable, planar collisions",
  "vibraphone-wall.hint": "Consolidates the near-identical showcase references (0e70, 3949, 4739, 4fd7, 54ce, 57c8, a154 and hB8lCZ8xGZo_005) into one instrument-gallery preset",
  "mixed-instruments.hint": "Changes instrument after several MIDI phrases; open the editor to choose each instrument and duration",
  "reference-korobeiniki-tubes.hint": "Matches tXxHSu15xU8_002: loads the 39-note Korobeiniki performance, pastel wall tubes, compact wire bridges and a purple striped marble",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi hành vi Marble Player. Preset trình diễn có bài mẫu sẽ tải luôn đúng giai điệu tham chiếu.",
  mix: "Mix",
  "mix.on": "Đang Mix",
  "mix.off": "Tắt Mix",
  "mix.wait": "Đang tìm điểm chuyển",
  "mix.hint": "Mỗi preset chạy trọn một quãng đủ dài. Ưu tiên khoảng nghỉ thật; với MIDI dày sẽ chọn điểm thở thưa nốt tốt nhất gần mốc chuyển. Preset đầu được chọn ngẫu nhiên mỗi lần bật Mix; các lần đổi sau bám điểm ngắt câu nhạc. Phông nền, viên bi và VFX bạn đang chỉnh được khóa nguyên.",
  "toy-pegboard": "Mẫu · Chốt đa sắc",
  "neon-comet": "Mẫu · Đường neon",
  "vibraphone-wall": "Mẫu · Cụm nhạc cụ",
  "mixed-instruments": "Nhạc cụ hỗn hợp",
  "reference-korobeiniki-tubes": "Mẫu · Ống Korobeiniki",
  "toy-pegboard.hint": "Chốt màu xếp theo wall-score Korobeiniki; nốt nhanh được đặt sát nhau",
  "neon-comet.hint": "Bệ neon xếp theo đường wall-score Korobeiniki với va chạm ổn định trên mặt tường",
  "vibraphone-wall.hint": "Gộp 8 clip có kết quả gần như cùng kiểu trình diễn vào một preset Cụm nhạc cụ để tránh loãng danh sách",
  "mixed-instruments.hint": "Đổi nhạc cụ sau vài câu MIDI; mở form để chọn từng nhạc cụ và thời gian chạy",
  "reference-korobeiniki-tubes.hint": "Theo clip tXxHSu15xU8_002: tự tải bản Korobeiniki 39 nốt, ống tường pastel, cầu dây ngắn và bi tím sọc",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
