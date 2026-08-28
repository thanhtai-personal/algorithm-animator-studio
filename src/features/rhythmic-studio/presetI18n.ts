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
  "boomwhacker-wall": "Reference · Rainbow Tubes",
  "vibraphone-wall": "Reference · Mallet Gallery",
  "reference-cyan-piano": "Reference · Cyan Piano",
  "reference-era-corridor": "Reference · Era Corridor",
  "reference-korobeiniki-tubes": "Reference · Korobeiniki Tubes",
  "toy-pegboard.hint": "Matches clip 013b: sparse colorful pegs and a candy-flower marble",
  "neon-comet.hint": "Consolidates the dark neon references, including clip ad97: luminous rails, prisms, pads and controlled jumps",
  "boomwhacker-wall.hint": "Combines clips 0e70 and 4fd7: rainbow tubes, drums, rails and a fire marble",
  "vibraphone-wall.hint": "Consolidates clips 3949, 4739, 54ce and 57c8 into one mallet/percussion gallery instead of near-duplicate presets",
  "reference-cyan-piano.hint": "Matches clip a154: white piano surfaces in a cyan-blue light field",
  "reference-era-corridor.hint": "Matches clip hB8lCZ8xGZo_005: cymbals, square paddles, piano blocks and staggered fast-note corridors",
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
  "boomwhacker-wall": "Mẫu · Ống cầu vồng",
  "vibraphone-wall": "Mẫu · Cụm nhạc cụ gõ",
  "reference-cyan-piano": "Mẫu · Piano cyan",
  "reference-era-corridor": "Mẫu · Hành lang thời đại",
  "reference-korobeiniki-tubes": "Mẫu · Ống Korobeiniki",
  "toy-pegboard.hint": "Theo clip 013b: chốt màu thưa thoáng và bi hoa kẹo",
  "neon-comet.hint": "Gộp nhóm neon tối, gồm clip ad97: ray sáng, lăng kính, bệ phát sáng và cú nảy có kiểm soát",
  "boomwhacker-wall.hint": "Gộp clip 0e70 và 4fd7: ống cầu vồng, trống, ray và bi lửa",
  "vibraphone-wall.hint": "Gộp clip 3949, 4739, 54ce và 57c8 thành một preset nhạc cụ gõ/mallet để tránh các kết quả gần giống nhau",
  "reference-cyan-piano.hint": "Theo clip a154: bề mặt piano trắng trong trường sáng xanh cyan",
  "reference-era-corridor.hint": "Theo clip hB8lCZ8xGZo_005: cymbal, paddle vuông, phím hộp và hành lang so le cho đoạn nhanh",
  "reference-korobeiniki-tubes.hint": "Theo clip tXxHSu15xU8_002: tự tải bản Korobeiniki 39 nốt, ống tường pastel, cầu dây ngắn và bi tím sọc",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
