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
  hint: "The default schedule follows MIDI phrase breaks. Adjust each instrument and its duration in seconds; transitions stay snapped to note onsets.",
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
  hint: "Lịch mặc định bám theo điểm ngắt câu của MIDI. Bạn có thể chọn nhạc cụ và số giây cho từng đoạn; điểm đổi vẫn khớp với nốt nhạc.",
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
