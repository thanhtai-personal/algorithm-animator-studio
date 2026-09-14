import type { PresetVideoEditableLyricCue, PresetVideoPreviewSection, PresetVideoSourceClip } from "../../types";

export const DESIGNER_NGAY_NAY_DURATION_SECONDS = 42;
export const DESIGNER_NGAY_NAY_SOURCE_GROUP_ID = "designer-ngay-nay-stitch-recording";
export const DESIGNER_NGAY_NAY_SOURCE_GROUP_LABEL = "Recording · Stitch portfolio workflow";

export type DesignerNgayNayBeat = {
  sourceId: string;
  start: number;
  end: number;
  eyebrow: string;
  headline: string;
  subline: string;
  accent: string;
  focusX: number;
  focusY: number;
};

export const DESIGNER_NGAY_NAY_BEATS: readonly DesignerNgayNayBeat[] = [
  beat("designer-payoff", 0, 2.4, "DESIGNER 2026", "KHÔNG CHỈ KÉO PIXEL", "Show kết quả trước. Giải thích sau.", "#a78bfa", 53, 48),
  beat("designer-intent", 2.4, 6.2, "01 · INTENT", "BẮT ĐẦU BẰNG Ý ĐỒ", "Brief rõ > prompt dài.", "#22d3ee", 48, 48),
  beat("designer-diverge", 6.2, 10.6, "02 · DIVERGE", "AI MỞ 10 HƯỚNG", "Designer không cần yêu phương án đầu tiên.", "#f472b6", 59, 50),
  beat("designer-curate", 10.6, 15.2, "03 · CURATE", "TASTE LÀ LỢI THẾ", "Chọn, bỏ, remix, đẩy concept xa hơn.", "#fbbf24", 45, 50),
  beat("designer-system", 15.2, 20.6, "04 · SYSTEM", "ĐỪNG DESIGN 1 MÀN HÌNH", "Design cả ngôn ngữ: type · color · spacing · states.", "#34d399", 57, 48),
  beat("designer-flow", 20.6, 26.4, "05 · FLOW", "SCREEN → TRẢI NGHIỆM", "Prototype sớm để thấy chỗ đẹp nhưng không dùng được.", "#60a5fa", 53, 50),
  beat("designer-ship", 26.4, 32.4, "06 · SHIP", "CODE CŨNG LÀ MATERIAL", "Canvas và code đang tiến gần nhau.", "#818cf8", 50, 48),
  beat("designer-proof", 32.4, 37.4, "07 · JUDGEMENT", "AI TĂNG TỐC. BẠN QUYẾT ĐỊNH.", "Craft nằm ở thứ bạn giữ lại — không phải số màn hình AI tạo.", "#c084fc", 50, 48),
  beat("designer-cta", 37.4, 42, "DESIGNER NGÀY NAY", "PROMPT · CURATE · SYSTEMIZE · SHIP", "Bạn đang kẹt ở bước nào?", "#2dd4bf", 52, 52),
];

export const DESIGNER_NGAY_NAY_VOICE_CUES: readonly PresetVideoEditableLyricCue[] = [
  voiceCue("voice-hook", 0.12, 2.25, "Designer 2026: không chỉ kéo pixel."),
  voiceCue("voice-intent", 2.55, 6.0, "Bắt đầu bằng ý đồ rõ, rồi mới viết prompt."),
  voiceCue("voice-diverge", 6.35, 10.35, "AI mở mười hướng rất nhanh. Đừng yêu phương án đầu tiên."),
  voiceCue("voice-curate", 10.75, 15.0, "Lợi thế thật nằm ở taste: chọn, bỏ, remix, rồi đẩy concept xa hơn."),
  voiceCue("voice-system", 15.35, 20.35, "Đừng chỉ design một màn hình. Hãy dựng cả ngôn ngữ: type, màu, spacing và states."),
  voiceCue("voice-flow", 20.75, 26.15, "Prototype sớm để thấy chỗ nào trông đẹp nhưng dùng không ổn."),
  voiceCue("voice-ship", 26.55, 32.1, "Code giờ cũng là material. Canvas và implementation đang tiến sát nhau."),
  voiceCue("voice-judgement", 32.55, 37.15, "AI tăng tốc output. Nhưng thứ đáng ship vẫn cần judgement của bạn."),
  voiceCue("voice-cta", 37.55, 41.75, "Bạn đang kẹt ở prompt, curate, system hay ship?"),
];

export const DESIGNER_NGAY_NAY_VIDEO_SOURCES: readonly PresetVideoSourceClip[] = [
  source("designer-payoff", "Payoff · finished editorial portfolio", 145, 147.4),
  source("designer-intent", "Intent · briefing Stitch", 3, 6.8),
  source("designer-diverge", "Diverge · generated visual directions", 18, 22.4),
  source("designer-curate", "Curate · compare directions", 30, 34.6),
  source("designer-system", "System · palette and visual language", 58, 63.4),
  source("designer-flow", "Flow · screen and interaction exploration", 88, 93.8),
  source("designer-ship", "Ship · assembled portfolio direction", 118, 124),
  source("designer-proof", "Proof · final portfolio page", 148, 153),
  source("designer-cta", "CTA · implementation / code handoff", 178, 182.6),
];

export const DESIGNER_NGAY_NAY_PREVIEW_SECTIONS: readonly PresetVideoPreviewSection[] = [
  { id: "hook", label: "Hook", title: "Kết quả trước · Designer 2026 không chỉ kéo pixel", startSeconds: 0, endSeconds: 6.2 },
  { id: "loop", label: "AI loop", title: "Diverge → curate → systemize", startSeconds: 6.2, endSeconds: 20.6 },
  { id: "ship", label: "Ship", title: "Flow → code as material", startSeconds: 20.6, endSeconds: 32.4 },
  { id: "payoff", label: "Payoff", title: "Judgement + comment CTA", startSeconds: 32.4, endSeconds: 42 },
];

function beat(sourceId: string, start: number, end: number, eyebrow: string, headline: string, subline: string, accent: string, focusX: number, focusY: number): DesignerNgayNayBeat {
  return { sourceId, start, end, eyebrow, headline, subline, accent, focusX, focusY };
}

function voiceCue(id: string, start: number, end: number, text: string): PresetVideoEditableLyricCue {
  return { id, start, end, lines: [text] };
}

function source(id: string, title: string, clipStartSeconds: number, clipEndSeconds: number): PresetVideoSourceClip {
  return {
    id,
    title,
    watchUrl: "",
    thumbnailUrl: "",
    clipStartSeconds,
    clipEndSeconds,
    sourceGroupId: DESIGNER_NGAY_NAY_SOURCE_GROUP_ID,
    sourceGroupLabel: DESIGNER_NGAY_NAY_SOURCE_GROUP_LABEL,
  };
}
