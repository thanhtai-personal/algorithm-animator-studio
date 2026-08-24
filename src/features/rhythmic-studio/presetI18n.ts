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
  | "wall-orchestra.hint"
  | "toy-pegboard.hint"
  | "neon-comet.hint"
  | "rainbow-xylophone.hint"
  | "boomwhacker-wall.hint"
  | "instrument-showcase.hint"
  | "vibraphone-wall.hint"
  | "percussion-wall.hint"
  | "arcade-wall.hint";

const EN: Record<PresetTextKey, string> = {
  title: "Quick presets",
  hint: "Switch Marble Player behavior without changing the current song.",
  mix: "Auto preset mix",
  "mix.on": "Mix on",
  "mix.off": "Mix off",
  "mix.wait": "Finding phrase breaks",
  "mix.hint": "Runs each preset for a full phrase. It prefers real rests; dense songs use the quietest phrase boundary near the target duration. The first preset is randomized each time Mix starts; later changes follow phrase breaks. The background and your current marble/VFX stay locked.",
  "wall-orchestra": "Wall Orchestra",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "boomwhacker-wall": "Boomwhacker Wall",
  "instrument-showcase": "Wall Instrument Showcase",
  "vibraphone-wall": "Vibraphone Gallery",
  "percussion-wall": "Percussion Wall",
  "arcade-wall": "Arcade Instrument Wall",
  "wall-orchestra.hint": "Reference-style beige wall, one marble and rotating families of tubes, keys, bells, drums and electronic pads",
  "toy-pegboard.hint": "Candy marble, guided tubes and a dark studio board",
  "neon-comet.hint": "Galaxy marble, luminous pads and controlled ribbon jumps",
  "rainbow-xylophone.hint": "Grouped keys, pads, cymbals and rails with wider camera framing",
  "boomwhacker-wall.hint": "Open tubes, xylophone accents, wall mounts and guide rails",
  "instrument-showcase.hint": "Piano, marimba, pluck, drums and metal instruments arranged as a wall showcase",
  "vibraphone-wall.hint": "Metal vibraphone bars, rail transitions and a wide physical camera",
  "percussion-wall.hint": "Cowbells, drums and bell cones with short natural falls and metallic collision tones",
  "arcade-wall.hint": "Electronic pads, metal accents and bright synth-like instrument clusters",
};

const VI: typeof EN = {
  title: "Preset nhanh",
  hint: "Đổi hành vi Marble Player nhưng giữ nguyên bài nhạc hiện tại.",
  mix: "Mix preset tự động",
  "mix.on": "Đang Mix",
  "mix.off": "Tắt Mix",
  "mix.wait": "Đang tìm điểm chuyển",
  "mix.hint": "Mỗi preset chạy trọn một quãng đủ dài. Ưu tiên khoảng nghỉ thật; với MIDI dày sẽ chọn điểm thở thưa nốt tốt nhất gần mốc chuyển. Preset đầu được chọn ngẫu nhiên mỗi lần bật Mix; các lần đổi sau bám điểm ngắt câu nhạc. Phông nền, viên bi và VFX bạn đang chỉnh được khóa nguyên.",
  "wall-orchestra": "Wall Orchestra",
  "toy-pegboard": "Dark Tube Board",
  "neon-comet": "Neon Ribbon Bounce",
  "rainbow-xylophone": "Instrument Playground",
  "boomwhacker-wall": "Boomwhacker Wall",
  "instrument-showcase": "Wall Instrument Showcase",
  "vibraphone-wall": "Vibraphone Gallery",
  "percussion-wall": "Percussion Wall",
  "arcade-wall": "Arcade Instrument Wall",
  "wall-orchestra.hint": "Phong cách video mẫu: tường sáng, một viên bi và các cụm ống, phím, chuông, trống, pad điện tử thay đổi liên tục",
  "toy-pegboard.hint": "Bi kẹo, ống dẫn rõ và mặt bàn studio tối",
  "neon-comet.hint": "Bi galaxy, bệ sáng và các cú nảy ribbon được kiểm soát",
  "rainbow-xylophone.hint": "Cụm phím, pad, chũm chọe và ray với camera thoáng hơn",
  "boomwhacker-wall.hint": "Ống hở, điểm nhấn xylophone, chân gắn tường và rail dẫn hướng",
  "instrument-showcase.hint": "Piano, marimba, pluck, drum và nhạc cụ kim loại bố trí thành showcase gắn tường",
  "vibraphone-wall.hint": "Thanh vibraphone kim loại, rail chuyển đoạn và camera vật lý góc rộng",
  "percussion-wall.hint": "Cowbell, trống và chuông hình nón với quãng rơi ngắn và âm kim loại",
  "arcade-wall.hint": "Pad điện tử, điểm nhấn kim loại và các cụm nhạc cụ có màu sắc kiểu synth",
};

export function presetText(lang: Lang, key: PresetTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
