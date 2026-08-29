import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";

export type Algorithm3DStoryState = {
  kicker: string;
  headline: string;
  detail: string;
  progress: number;
  remaining: number;
  completed: number;
  complete: boolean;
  comparePair: [number, number] | null;
};

export function getAlgorithm3DStoryState(params: {
  frame: Frame;
  frameIndex: number;
  frameCount: number;
  title: string;
  lang: Lang;
  hook?: boolean;
  transitionProgress?: number;
}): Algorithm3DStoryState {
  const { frame, frameIndex, frameCount, title, lang, hook = false, transitionProgress = 1 } = params;
  const total = Math.max(1, frame.arr.length);
  const sortedCount = new Set(frame.sorted.filter((index) => index >= 0 && index < total)).size;
  const complete = frameCount > 0 && frameIndex >= frameCount - 1;
  const timelineProgress = frameCount <= 1 ? 1 : frameIndex / Math.max(1, frameCount - 1);
  const progress = complete ? 1 : sortedCount > 0 ? Math.min(0.98, sortedCount / total) : Math.min(0.94, timelineProgress * 0.86);
  const remaining = Math.max(0, total - sortedCount);
  const comparePair = getComparePair(frame);

  if (hook) {
    return {
      kicker: lang === "vi" ? "THÀNH PHỐ ĐANG SAI THỨ TỰ" : "THE CITY IS OUT OF ORDER",
      headline: lang === "vi" ? `${total} TÒA NHÀ. SAI VỊ TRÍ.` : `${total} BUILDINGS. WRONG ORDER.`,
      detail: lang === "vi" ? `${title} có sửa được toàn bộ thành phố?` : `Can ${title} fix the whole city?`,
      progress: 0,
      remaining: total,
      completed: 0,
      complete: false,
      comparePair,
    };
  }

  if (complete) {
    return {
      kicker: lang === "vi" ? "HOÀN THÀNH" : "COMPLETE",
      headline: lang === "vi" ? "THÀNH PHỐ ĐÃ ĐƯỢC SẮP XẾP ✓" : "CITY SORTED ✓",
      detail: lang === "vi" ? `${total} tòa nhà đã khóa đúng vị trí` : `${total} buildings locked in place`,
      progress: 1,
      remaining: 0,
      completed: total,
      complete: true,
      comparePair,
    };
  }

  if (frame.event === "swap") {
    const detail = transitionProgress < 0.24
      ? (lang === "vi" ? "Hai xe cẩu đang chạy tới vị trí nguồn" : "Crane teams are approaching the source buildings")
      : transitionProgress < 0.38
        ? (lang === "vi" ? "Móc cẩu đã khóa · bắt đầu nâng" : "Hooks locked · lifting begins")
        : transitionProgress < 0.70
          ? (lang === "vi" ? "Hai tòa nhà đang đi qua hai lane riêng" : "Buildings are crossing on separate lanes")
          : transitionProgress < 0.86
            ? (lang === "vi" ? "Đang hạ tải vào vị trí mới" : "Lowering into the new positions")
            : (lang === "vi" ? "Khóa vị trí · chuẩn bị bước tiếp theo" : "Locking positions · preparing the next step");
    return {
      kicker: lang === "vi" ? "QUYẾT ĐỊNH" : "DECISION",
      headline: lang === "vi" ? "CẦN HOÁN ĐỔI" : "SWAP REQUIRED",
      detail,
      progress,
      remaining,
      completed: sortedCount,
      complete,
      comparePair,
    };
  }

  if (frame.event === "compare" && comparePair) {
    const [left, right] = comparePair;
    return {
      kicker: lang === "vi" ? "DỰ ĐOÁN" : "PREDICT",
      headline: `${left}  >  ${right} ?`,
      detail: lang === "vi" ? "Hai tòa nhà này có cần đổi chỗ?" : "Should these buildings change places?",
      progress,
      remaining,
      completed: sortedCount,
      complete,
      comparePair,
    };
  }

  if (frame.event === "found") {
    return {
      kicker: lang === "vi" ? "ĐÃ TÌM THẤY" : "FOUND",
      headline: lang === "vi" ? "MỤC TIÊU ĐÃ KHÓA ✓" : "TARGET LOCKED ✓",
      detail: lang === "vi" ? "Đã xác nhận vị trí mục tiêu" : "Target position confirmed",
      progress,
      remaining,
      completed: sortedCount,
      complete,
      comparePair,
    };
  }

  const finalMove = remaining === 1 && sortedCount > 0;
  const closeToFinish = remaining > 1 && remaining <= 3 && sortedCount > 0;
  return {
    kicker: finalMove ? (lang === "vi" ? "NƯỚC ĐI CUỐI" : "FINAL MOVE") : closeToFinish ? (lang === "vi" ? "SẮP HOÀN THÀNH" : "ALMOST THERE") : (lang === "vi" ? "ĐANG KHÔI PHỤC THÀNH PHỐ" : "RESTORING THE CITY"),
    headline: finalMove ? (lang === "vi" ? "CHỈ CÒN 1 TÒA" : "1 BUILDING LEFT") : closeToFinish ? (lang === "vi" ? `CÒN ${remaining} TÒA` : `${remaining} BUILDINGS LEFT`) : `${Math.round(progress * 100)}%`,
    detail: lang === "vi" ? "Mỗi vị trí đúng sẽ được khóa và bật sáng" : "Every correct position locks and lights up",
    progress,
    remaining,
    completed: sortedCount,
    complete,
    comparePair,
  };
}

function getComparePair(frame: Frame): [number, number] | null {
  const indices = frame.highlight.filter((index) => index >= 0 && index < frame.arr.length);
  if (indices.length < 2) return null;
  return [frame.arr[indices[0]], frame.arr[indices[1]]];
}
