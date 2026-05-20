export type ShortVideoType = "classic" | "kinetic-typography" | "algorithm-world";

export const SHORT_VIDEO_TYPES: { id: ShortVideoType; label: { en: string; vi: string } }[] = [
  { id: "classic", label: { en: "Classic animation", vi: "Animation classic" } },
  { id: "kinetic-typography", label: { en: "Kinetic Typography", vi: "Kinetic Typography" } },
  { id: "algorithm-world", label: { en: "Algorithm World", vi: "Algorithm World" } },
];
