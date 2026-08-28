import type { Lang } from "@/lib/i18n";

type InstrumentMixTextKey =
  | "button"
  | "title"
  | "hint"
  | "segment"
  | "instrument"
  | "duration"
  | "add"
  | "reset"
  | "remove";

const EN: Record<InstrumentMixTextKey, string> = {
  button: "Edit instrument mix",
  title: "Mixed instruments",
  hint: "MIDI determines the instrument count and phrase breaks. Every instrument plays at least one complete phrase before changing.",
  segment: "Section",
  instrument: "Instrument",
  duration: "Duration section {index} (seconds)",
  add: "Add section",
  reset: "Automatic from MIDI",
  remove: "Remove section {index}",
};

const VI: typeof EN = {
  button: "Chỉnh phối nhạc cụ",
  title: "Nhạc cụ hỗn hợp",
  hint: "MIDI tự xác định số nhạc cụ và điểm ngắt câu. Mỗi nhạc cụ luôn chạy ít nhất một câu hoàn chỉnh trước khi đổi.",
  segment: "Đoạn",
  instrument: "Nhạc cụ",
  duration: "Thời gian đoạn {index} (giây)",
  add: "Thêm đoạn",
  reset: "Tự động theo MIDI",
  remove: "Xóa đoạn {index}",
};

export function instrumentMixText(lang: Lang, key: InstrumentMixTextKey, index?: number) {
  return (lang === "vi" ? VI : EN)[key].replace("{index}", String(index ?? ""));
}
