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
  hint: "Switch Marble Player behavior without changing the current song.",
  mix: "Mix",
  "mix.on": "Mix on",
  "mix.off": "Mix off",
  "mix.wait": "Finding phrase breaks",
  "mix.hint": "Runs each preset for a full phrase. It prefers real rests; dense songs use the quietest phrase boundary near the target duration. The first preset is randomized each time Mix starts; later changes follow phrase breaks. The background and your current marble/VFX stay locked.",
  "toy-pegboard": "Reference · Color Pegs",
  "neon-comet": "Neon Ribbon Bounce",
  "boomwhacker-wall": "Reference · Rainbow Tubes",
  "vibraphone-wall": "Reference · Metal Percussion",
  "reference-wooden-marimba": "Reference · Wooden Marimba",
  "reference-cyan-piano": "Reference · Cyan Piano",
  "reference-checker-rails": "Reference · Checker Rails",
  "reference-era-corridor": "Reference · Era Corridor",
  "reference-faceted-metallophone": "Reference · Faceted Metallophone",
  "toy-pegboard.hint": "Matches clip 013b: sparse colorful pegs and a candy-flower marble",
  "neon-comet.hint": "Galaxy marble, luminous pads and controlled ribbon jumps",
  "boomwhacker-wall.hint": "Combines clips 0e70 and 4fd7: rainbow tubes, drums, rails and a fire marble",
  "vibraphone-wall.hint": "Combines clips 3949 and 4739: metal percussion, cyan accents and a rainbow ball",
  "reference-wooden-marimba.hint": "Matches clip 54ce: wooden mallet instruments, brass mounts and guide rails",
  "reference-cyan-piano.hint": "Matches clip a154: white piano surfaces in a cyan-blue light field",
  "reference-checker-rails.hint": "Matches clip ad97: dark neon rails, prisms and cyan-violet geometry",
  "reference-era-corridor.hint": "Matches clip hB8lCZ8xGZo_005: cymbals, square paddles, piano blocks and staggered fast-note corridors",
  "reference-faceted-metallophone.hint": "Matches clip 57c8: a faceted patchwork ball, two-bolt metallophone plates and cyan dual rails",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi hành vi Marble Player nhưng giữ nguyên bài nhạc hiện tại.",
  mix: "Mix",
  "mix.on": "Đang Mix",
  "mix.off": "Tắt Mix",
  "mix.wait": "Đang tìm điểm chuyển",
  "mix.hint": "Mỗi preset chạy trọn một quãng đủ dài. Ưu tiên khoảng nghỉ thật; với MIDI dày sẽ chọn điểm thở thưa nốt tốt nhất gần mốc chuyển. Preset đầu được chọn ngẫu nhiên mỗi lần bật Mix; các lần đổi sau bám điểm ngắt câu nhạc. Phông nền, viên bi và VFX bạn đang chỉnh được khóa nguyên.",
  "toy-pegboard": "Mẫu · Chốt đa sắc",
  "neon-comet": "Neon Ribbon Bounce",
  "boomwhacker-wall": "Mẫu · Ống cầu vồng",
  "vibraphone-wall": "Mẫu · Bộ gõ kim loại",
  "reference-wooden-marimba": "Mẫu · Marimba gỗ",
  "reference-cyan-piano": "Mẫu · Piano cyan",
  "reference-checker-rails": "Mẫu · Ray caro neon",
  "reference-era-corridor": "Mẫu · Hành lang thời đại",
  "reference-faceted-metallophone": "Mẫu · Metallophone đa diện",
  "toy-pegboard.hint": "Theo clip 013b: chốt màu thưa thoáng và bi hoa kẹo",
  "neon-comet.hint": "Bi galaxy, bệ sáng và các cú nảy ribbon được kiểm soát",
  "boomwhacker-wall.hint": "Gộp clip 0e70 và 4fd7: ống cầu vồng, trống, ray và bi lửa",
  "vibraphone-wall.hint": "Gộp clip 3949 và 4739: bộ gõ kim loại, điểm nhấn cyan và bi cầu vồng",
  "reference-wooden-marimba.hint": "Theo clip 54ce: nhạc cụ gõ gỗ, chân đồng và ray dẫn hướng",
  "reference-cyan-piano.hint": "Theo clip a154: bề mặt piano trắng trong trường sáng xanh cyan",
  "reference-checker-rails.hint": "Theo clip ad97: ray neon tối, lăng kính và hình học cyan-tím",
  "reference-era-corridor.hint": "Theo clip hB8lCZ8xGZo_005: cymbal, paddle vuông, phím hộp và hành lang so le cho đoạn nhanh",
  "reference-faceted-metallophone.hint": "Theo clip 57c8: bóng đa diện ghép màu, tấm Metallophone hai chốt và ray kép cyan",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
