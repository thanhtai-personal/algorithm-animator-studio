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
  | "family.percussion"
  | "family.arcade"
  | "family.mixed"
  | "layout.cascade"
  | "layout.fan"
  | "layout.gallery"
  | "layout.split";

const EN: Record<ShowcaseTextKey, string> = {
  title: "3D instrument showcase",
  hint: "Build a single-marble wall performance from real instrument families and natural falling motion.",
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
  "family.percussion": "Bells, drums & cowbells",
  "family.arcade": "Arcade / electronic pads",
  "family.mixed": "Mixed instrument sections",
  "layout.cascade": "Natural cascade",
  "layout.fan": "Fan / radial wall",
  "layout.gallery": "Instrument gallery",
  "layout.split": "Split duet lanes",
};

const VI: typeof EN = {
  title: "Showcase nhạc cụ 3D",
  hint: "Tạo màn trình diễn một viên bi với nhiều họ nhạc cụ gắn tường và chuyển động rơi tự nhiên.",
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
  "family.percussion": "Chuông, trống & cowbell",
  "family.arcade": "Pad điện tử / arcade",
  "family.mixed": "Phối nhiều nhạc cụ theo đoạn",
  "layout.cascade": "Dòng chảy tự nhiên",
  "layout.fan": "Quạt / tỏa tròn trên tường",
  "layout.gallery": "Gallery nhạc cụ",
  "layout.split": "Hai lane cho duet",
};

export function showcaseText(lang: Lang, key: ShowcaseTextKey) {
  return (lang === "vi" ? VI : EN)[key];
}
