import type { Lang } from "@/lib/i18n";

const TEXT = {
  en: {
    title: "Trim clip for posting",
    hint: "Choose only the best section to preview or export. Music, marble and collision SFX stay synced to the original timeline.",
    start: "Start",
    end: "End",
    duration: "Clip length",
    fromHere15: "15s from playhead",
    fromHere30: "30s from playhead",
    fromHere60: "60s from playhead",
    setStart: "Set start here",
    setEnd: "Set end here",
    preview: "Preview clip",
    previewing: "Previewing clip",
    exportWebm: "Export clip WebM",
    exportMp4: "Export clip MP4",
    minimum: "Clip must be at least 1 second long",
  },
  vi: {
    title: "Cắt đoạn video để đăng",
    hint: "Chọn đúng đoạn hay nhất để xem thử hoặc xuất. Nhạc, marble và SFX va chạm vẫn giữ đồng bộ theo timeline gốc.",
    start: "Bắt đầu",
    end: "Kết thúc",
    duration: "Độ dài đoạn",
    fromHere15: "15 giây từ vị trí này",
    fromHere30: "30 giây từ vị trí này",
    fromHere60: "60 giây từ vị trí này",
    setStart: "Đặt đầu tại đây",
    setEnd: "Đặt cuối tại đây",
    preview: "Xem thử đoạn cắt",
    previewing: "Đang xem đoạn cắt",
    exportWebm: "Xuất đoạn WebM",
    exportMp4: "Xuất đoạn MP4",
    minimum: "Đoạn cắt phải dài ít nhất 1 giây",
  },
} as const;

export type TrimTextKey = keyof typeof TEXT.en;

export function trimText(lang: Lang, key: TrimTextKey) {
  return TEXT[lang === "vi" ? "vi" : "en"][key];
}

export function formatClipTime(ms: number) {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const seconds = total - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}
