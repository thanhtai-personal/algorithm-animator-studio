export type AlgorithmVideoAdId = "test" | "none" | "kata" | "thiendaochilo" | "kata_rental";
export type AlgorithmVideoAdSlotId = "left_facade" | "right_billboard";

export type AlgorithmVideoAd = {
  id: AlgorithmVideoAdId;
  label: { vi: string; en: string };
  brand: string;
  subtitle?: string;
  url?: string;
  accent: string;
};

export type AlgorithmVideoAdSlot = {
  id: AlgorithmVideoAdSlotId;
  label: { vi: string; en: string };
  placement: "facade" | "billboard";
};

export type AlgorithmVideoAdSelection = Record<AlgorithmVideoAdSlotId, AlgorithmVideoAdId>;

export const ALGORITHM_VIDEO_AD_SLOTS: readonly AlgorithmVideoAdSlot[] = [
  { id: "left_facade", label: { vi: "Vị trí 1 · Mặt tiền trái", en: "Slot 1 · Left facade" }, placement: "facade" },
  { id: "right_billboard", label: { vi: "Vị trí 2 · Biển hậu cảnh phải", en: "Slot 2 · Rear-right billboard" }, placement: "billboard" },
] as const;

export const ALGORITHM_VIDEO_ADS: readonly AlgorithmVideoAd[] = [
  {
    id: "test",
    label: { vi: "TEST quảng cáo (mặc định)", en: "TEST advertisement (default)" },
    brand: "TEST QUẢNG CÁO",
    subtitle: "ADVERTISEMENT SLOT",
    accent: "#7f929f",
  },
  {
    id: "none",
    label: { vi: "Để trống vị trí", en: "Leave slot empty" },
    brand: "",
    accent: "#57636b",
  },
  {
    id: "kata",
    label: { vi: "KATA Makeup", en: "KATA Makeup" },
    brand: "KATA.MAKEUP",
    url: "https://www.kata.makeup/",
    accent: "#d792a4",
  },
  {
    id: "thiendaochilo",
    label: { vi: "Thiên Đạo Chi Lộ", en: "Thiên Đạo Chi Lộ" },
    brand: "THIÊN ĐẠO CHI LỘ",
    url: "https://thiendaochilo.vercel.app/",
    accent: "#c4a55f",
  },
  {
    id: "kata_rental",
    label: { vi: "KATA Thuê Đồ", en: "KATA Rental" },
    brand: "KATA THUÊ ĐỒ",
    subtitle: "TIỆM THUÊ ĐỒ KATA",
    accent: "#c9986d",
  },
] as const;

export function getAlgorithmVideoAd(id: AlgorithmVideoAdId | string | undefined) {
  return ALGORITHM_VIDEO_ADS.find((item) => item.id === id) ?? ALGORITHM_VIDEO_ADS[0];
}

export function createDefaultAlgorithmVideoAds(): AlgorithmVideoAdSelection {
  return { left_facade: "test", right_billboard: "test" };
}
