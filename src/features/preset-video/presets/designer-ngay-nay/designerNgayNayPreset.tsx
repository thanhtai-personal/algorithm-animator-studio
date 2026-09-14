import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { DesignerNgayNayComposition } from "./DesignerNgayNayComposition";
import {
  DESIGNER_NGAY_NAY_DURATION_SECONDS,
  DESIGNER_NGAY_NAY_PREVIEW_SECTIONS,
  DESIGNER_NGAY_NAY_VIDEO_SOURCES,
  DESIGNER_NGAY_NAY_VOICE_CUES,
} from "./designerNgayNayContent";

function DesignerNgayNayPresetComposition(props: PresetVideoCompositionProps) {
  return <DesignerNgayNayComposition {...props} />;
}

export const designerNgayNayPreset: PresetVideoDefinition = {
  id: "designer-ngay-nay",
  name: "Designer ngày nay — Prompt → Taste → Ship",
  description: "Reel 42 giây dựng trực tiếp từ screen recording Stitch: mở bằng payoff để chặn cú swipe, sau đó cắt nhanh qua intent → diverge → curate → system → flow → ship. Thông điệp trung tâm: AI tăng tốc output, còn judgement/taste của designer quyết định thứ đáng ship.",
  tags: ["designer", "ai", "vibe-design", "stitch", "ui-ux", "product-design", "design-system", "design-to-code", "reels", "shorts"],
  accentColor: "#a78bfa",
  defaultDurationSeconds: DESIGNER_NGAY_NAY_DURATION_SECONDS,
  defaultFps: 30,
  defaultOutputPreset: "portrait-1080p",
  hasOriginalAudio: false,
  settingsRevision: 1,
  lyricTimingRevision: 1,
  previewSections: DESIGNER_NGAY_NAY_PREVIEW_SECTIONS,
  editableLyrics: DESIGNER_NGAY_NAY_VOICE_CUES,
  videoSources: DESIGNER_NGAY_NAY_VIDEO_SOURCES,
  videoSourceStrategy: "local",
  musicRecommendation: {
    mood: "editorial future pulse / confident design-tech",
    keywords: ["editorial", "future", "pulse", "design", "tech", "minimal", "percussive", "clean", "bass"],
    rationale: "Hook cần transient rõ trong 1–2 giây đầu, sau đó giữ nhịp đều để cut screen recording liên tục mà không lấn text. Recording gốc gần như im lặng nên preset ưu tiên music bed.",
    defaultVolume: 0.2,
  },
  socialMetadata: {
    longForm: {
      title: "Designer ngày nay làm gì khi AI generate UI trong vài giây?",
      description: "AI làm việc tạo phương án rẻ hơn rất nhiều. Giá trị của designer dịch chuyển sang đặt intent, mở rộng hướng, curate bằng taste, tạo system, kiểm tra flow và đưa quyết định vào thứ thực sự ship. Video này dùng một workflow Stitch thật để kể đúng vòng lặp đó.",
      hashtags: ["#Designer", "#AI", "#UIDesign", "#UXDesign", "#ProductDesign", "#DesignSystem", "#DesignToCode"],
      keywords: ["designer 2026", "designer ngày nay", "AI design workflow", "vibe design", "Google Stitch", "product designer AI", "design to code"],
      pinnedComment: "AI đang giúp bạn tiết kiệm nhiều nhất ở bước generate, iterate hay handoff?",
    },
    shortForm: {
      title: "Designer 2026 ≠ kéo pixel 👀",
      description: "Prompt nhanh hơn chỉ là phần nổi. Designer ngày nay phải curate bằng taste, biến direction thành system và kéo nó tới thứ có thể ship.",
      hashtags: ["#Designer", "#AI", "#VibeDesign", "#Stitch", "#UIDesign", "#Reels", "#Shorts"],
      keywords: ["designer today", "designer 2026", "AI designer", "vibe design", "Stitch AI", "design workflow", "design to code"],
      pinnedComment: "Bạn đang dùng AI để generate nhiều hơn, hay để ra quyết định tốt hơn?",
    },
  },
  component: DesignerNgayNayPresetComposition,
};
