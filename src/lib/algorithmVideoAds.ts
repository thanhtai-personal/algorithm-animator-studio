export type AlgorithmVideoAdId = "none" | "kata" | "thiendaochilo";

export type AlgorithmVideoAd = {
  id: AlgorithmVideoAdId;
  label: { vi: string; en: string };
  brand: string;
  url: string;
  accent: string;
  placement: "facade" | "billboard";
};

export const ALGORITHM_VIDEO_ADS: readonly AlgorithmVideoAd[] = [
  {
    id: "none",
    label: { vi: "Không quảng cáo", en: "No ad" },
    brand: "",
    url: "",
    accent: "#8f9aa3",
    placement: "billboard",
  },
  {
    id: "kata",
    label: { vi: "KATA Makeup", en: "KATA Makeup" },
    brand: "KATA.MAKEUP",
    url: "https://www.kata.makeup/",
    accent: "#d792a4",
    placement: "facade",
  },
  {
    id: "thiendaochilo",
    label: { vi: "Thiên Đạo Chi Lộ", en: "Thiên Đạo Chi Lộ" },
    brand: "THIÊN ĐẠO CHI LỘ",
    url: "https://thiendaochilo.vercel.app/",
    accent: "#c4a55f",
    placement: "billboard",
  },
] as const;

export function getAlgorithmVideoAd(id: AlgorithmVideoAdId | string | undefined) {
  return ALGORITHM_VIDEO_ADS.find((item) => item.id === id) ?? ALGORITHM_VIDEO_ADS[0];
}
