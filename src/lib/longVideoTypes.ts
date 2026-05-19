export const LONG_VIDEO_TYPES = [
  {
    id: "classic",
    label: "Classic lecture",
    description: "Layout hiện tại: slide thuyết trình + chart thuật toán.",
  },
  {
    id: "kinetic-typography",
    label: "Kinetic typography",
    description: "Chữ chuyển động theo nhạc hoặc lời thoại, không tập trung vào chart.",
  },
  {
    id: "animated-explainer",
    label: "Animated explainer",
    description: "Nhân vật, icon và scene chuyển động để giải thích ý tưởng.",
  },
  {
    id: "ui-kinetic-explainer",
    label: "UI kinetic explainer",
    description: "Mô phỏng giao diện app/web với animation để demo thuật toán.",
  },
] as const;

export type LongVideoType = typeof LONG_VIDEO_TYPES[number]["id"];
