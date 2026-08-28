import type { Lang } from "@/lib/i18n";

export type ShowcaseTextKey =
  | "title"
  | "hint"
  | "family"
  | "layout"
  | "rails"
  | "railDensity"
  | "duet"
  | "secondBall"
  | "family.auto"
  | "family.boomwhacker"
  | "family.xylophone"
  | "family.piano"
  | "family.marimba"
  | "family.pluck"
  | "family.vibraphone"
  | "family.metallophone"
  | "family.gong"
  | "family.flute"
  | "family.trumpet"
  | "family.drum"
  | "family.guitar"
  | "family.bronze-drum"
  | "family.mixed"
  | "layout.cascade"
  | "layout.fan"
  | "layout.gallery"
  | "layout.split"
  | "layout.corridor"
  | "layout.wall-score";

const EN: Record<ShowcaseTextKey, string> = {
  title: "3D instrument showcase",
  hint: "Build wall-mounted instrument scenes with physical rails and optional duet marbles.",
  family: "Instrument family",
  layout: "Wall layout",
  rails: "Guide rails",
  railDensity: "Rail density",
  duet: "Two-marble duet",
  secondBall: "Second marble color",
  "family.auto": "Preset / automatic",
  "family.boomwhacker": "Boomwhacker tubes",
  "family.xylophone": "Xylophone bars",
  "family.piano": "Electric piano keys",
  "family.marimba": "Marimba wood bars",
  "family.pluck": "Pluck organ pads",
  "family.vibraphone": "Vibraphone metal bars",
  "family.metallophone": "Mounted metallophone plates",
  "family.gong": "Note-lit gongs",
  "family.flute": "Note-lit flute pipes",
  "family.trumpet": "Trumpet horns",
  "family.drum": "Acoustic drums",
  "family.guitar": "Guitars",
  "family.bronze-drum": "Vietnamese bronze drums",
  "family.mixed": "Mixed instrument sections",
  "layout.cascade": "Natural cascade",
  "layout.fan": "Fan / radial wall",
  "layout.gallery": "Instrument gallery",
  "layout.split": "Split duet lanes",
  "layout.corridor": "Fast staggered corridor",
  "layout.wall-score": "Wall-facing tube score",
};

const VI: typeof EN = {
  title: "Showcase nhạc cụ 3D",
  hint: "Tạo cảnh nhạc cụ gắn tường, có rail vật lý và tùy chọn hai viên bi chạy song song.",
  family: "Họ nhạc cụ",
  layout: "Cách bố trí trên tường",
  rails: "Rail dẫn hướng",
  railDensity: "Mật độ rail",
  duet: "Hai viên bi / duet",
  secondBall: "Màu viên bi thứ hai",
  "family.auto": "Theo preset / tự động",
  "family.boomwhacker": "Ống Boomwhacker",
  "family.xylophone": "Thanh Xylophone",
  "family.piano": "Phím Electric Piano",
  "family.marimba": "Thanh gỗ Marimba",
  "family.pluck": "Pad Pluck Organ",
  "family.vibraphone": "Thanh kim loại Vibraphone",
  "family.metallophone": "Tấm Metallophone gắn khung",
  "family.gong": "Chiêng sáng theo màu nốt",
  "family.flute": "Ống sáo sáng theo màu nốt",
  "family.trumpet": "Kèn trumpet",
  "family.drum": "Trống",
  "family.guitar": "Ghita",
  "family.bronze-drum": "Trống đồng Việt Nam",
  "family.mixed": "Phối nhiều nhạc cụ theo đoạn",
  "layout.cascade": "Dòng chảy tự nhiên",
  "layout.fan": "Quạt / tỏa tròn trên tường",
  "layout.gallery": "Gallery nhạc cụ",
  "layout.split": "Hai lane cho duet",
  "layout.corridor": "Hành lang so le cho đoạn nhanh",
  "layout.wall-score": "Dàn ống hướng ra khỏi tường",
};

export function showcaseText(lang: Lang, key: ShowcaseTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
