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
  mix: "Auto preset mix",
  "mix.on": "Mix on",
  "mix.off": "Mix off",
  "mix.wait": "Finding phrase breaks",
  "mix.hint": "Runs each preset for a full phrase. It prefers real rests; dense songs use the quietest phrase boundary near the target duration. The first preset is randomized each time Mix starts; later changes follow phrase breaks. The background and your current marble/VFX stay locked.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "boomwhacker-wall": "Boomwhacker Wall",
  "instrument-showcase": "Wall Instrument Showcase",
  "vibraphone-wall": "Vibraphone Gallery",
  "reference-color-pegs": "Reference · Color Pegs",
  "reference-rainbow-boomwhackers": "Reference · Rainbow Tubes",
  "reference-midnight-vibraphone": "Reference · Midnight Metal",
  "reference-pastel-percussion": "Reference · Pastel Percussion",
  "reference-candy-drumline": "Reference · Candy Drumline",
  "reference-wooden-marimba": "Reference · Wooden Marimba",
  "reference-cyan-piano": "Reference · Cyan Piano",
  "reference-checker-rails": "Reference · Checker Rails",
  "toy-pegboard.hint": "Candy marble, guided tubes and a dark studio board",
  "neon-comet.hint": "Galaxy marble, luminous pads and controlled ribbon jumps",
  "rainbow-xylophone.hint": "Grouped keys, pads, cymbals and rails with wider camera framing",
  "boomwhacker-wall.hint": "Open tubes, xylophone accents, wall mounts and guide rails",
  "instrument-showcase.hint": "Piano, marimba, pluck, drums and metal instruments arranged as a wall showcase",
  "vibraphone-wall.hint": "Metal vibraphone bars, rail transitions and a wide physical camera",
  "reference-color-pegs.hint": "Matches clip 013b: sparse colorful pegs on a warm neutral wall",
  "reference-rainbow-boomwhackers.hint": "Matches clip 0e70: saturated open tubes, rails and energetic impact particles",
  "reference-midnight-vibraphone.hint": "Matches clip 3949: restrained metal bars and rails under dark spotlights",
  "reference-pastel-percussion.hint": "Matches clip 4739: silver cylinders, cyan percussion and a lavender wall",
  "reference-candy-drumline.hint": "Matches clip 4fd7: bright drum and tube clusters with candy-color impacts",
  "reference-wooden-marimba.hint": "Matches clip 54ce: wooden mallet instruments, brass mounts and guide rails",
  "reference-cyan-piano.hint": "Matches clip a154: white piano surfaces in a cyan-blue light field",
  "reference-checker-rails.hint": "Matches clip ad97: dark neon rails, prisms and cyan-violet geometry",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi hành vi Marble Player nhưng giữ nguyên bài nhạc hiện tại.",
  mix: "Mix preset tự động",
  "mix.on": "Đang Mix",
  "mix.off": "Tắt Mix",
  "mix.wait": "Đang tìm điểm chuyển",
  "mix.hint": "Mỗi preset chạy trọn một quãng đủ dài. Ưu tiên khoảng nghỉ thật; với MIDI dày sẽ chọn điểm thở thưa nốt tốt nhất gần mốc chuyển. Preset đầu được chọn ngẫu nhiên mỗi lần bật Mix; các lần đổi sau bám điểm ngắt câu nhạc. Phông nền, viên bi và VFX bạn đang chỉnh được khóa nguyên.",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "boomwhacker-wall": "Boomwhacker Wall",
  "instrument-showcase": "Wall Instrument Showcase",
  "vibraphone-wall": "Vibraphone Gallery",
  "reference-color-pegs": "Mẫu · Chốt đa sắc",
  "reference-rainbow-boomwhackers": "Mẫu · Ống cầu vồng",
  "reference-midnight-vibraphone": "Mẫu · Kim loại đêm",
  "reference-pastel-percussion": "Mẫu · Gõ pastel",
  "reference-candy-drumline": "Mẫu · Trống kẹo màu",
  "reference-wooden-marimba": "Mẫu · Marimba gỗ",
  "reference-cyan-piano": "Mẫu · Piano cyan",
  "reference-checker-rails": "Mẫu · Ray caro neon",
  "toy-pegboard.hint": "Bi kẹo, ống dẫn rõ và mặt bàn studio tối",
  "neon-comet.hint": "Bi galaxy, bệ sáng và các cú nảy ribbon được kiểm soát",
  "rainbow-xylophone.hint": "Cụm phím, pad, chũm chọe và ray với camera thoáng hơn",
  "boomwhacker-wall.hint": "Ống hở, điểm nhấn xylophone, chân gắn tường và rail dẫn hướng",
  "instrument-showcase.hint": "Piano, marimba, pluck, drum và nhạc cụ kim loại bố trí thành showcase gắn tường",
  "vibraphone-wall.hint": "Thanh vibraphone kim loại, rail chuyển đoạn và camera vật lý góc rộng",
  "reference-color-pegs.hint": "Theo clip 013b: chốt nhiều màu thưa thoáng trên tường trung tính ấm",
  "reference-rainbow-boomwhackers.hint": "Theo clip 0e70: ống hở rực màu, rail và hạt sáng va chạm giàu năng lượng",
  "reference-midnight-vibraphone.hint": "Theo clip 3949: thanh kim loại tiết chế và ray dưới đèn rọi nền tối",
  "reference-pastel-percussion.hint": "Theo clip 4739: ống bạc, bộ gõ cyan và tường tím lavender",
  "reference-candy-drumline.hint": "Theo clip 4fd7: cụm trống, ống màu kẹo và hiệu ứng va chạm tươi sáng",
  "reference-wooden-marimba.hint": "Theo clip 54ce: nhạc cụ gõ gỗ, chân đồng và ray dẫn hướng",
  "reference-cyan-piano.hint": "Theo clip a154: bề mặt piano trắng trong trường sáng xanh cyan",
  "reference-checker-rails.hint": "Theo clip ad97: ray neon tối, lăng kính và hình học cyan-tím",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
