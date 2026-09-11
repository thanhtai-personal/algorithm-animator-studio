import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { DesignerAiComposition } from "./DesignerAiComposition";
import {
  DESIGNER_AI_DURATION_SECONDS,
  DESIGNER_AI_PREVIEW_SECTIONS,
  DESIGNER_AI_VIDEO_SOURCES,
} from "./designerAiContent";

function DesignerAiPresetComposition(props: PresetVideoCompositionProps) {
  return <DesignerAiComposition {...props} />;
}

export const designerAiWorkflowPreset: PresetVideoDefinition = {
  id: "designer-ai-workflow",
  name: "Designer × AI — The New Workflow",
  description: "Tóm tắt screen recording thành case-study 54 giây về cách designer dùng AI để khám phá, so sánh, hệ thống hóa, tinh chỉnh và ship sản phẩm.",
  tags: ["design", "ai", "workflow", "product-design", "ui-ux", "shorts", "reels"],
  accentColor: "#8b5cf6",
  defaultDurationSeconds: DESIGNER_AI_DURATION_SECONDS,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: false,
  previewSections: DESIGNER_AI_PREVIEW_SECTIONS,
  videoSources: DESIGNER_AI_VIDEO_SOURCES,
  videoSourceStrategy: "local",
  musicRecommendation: {
    mood: "Future minimal / electronic ambient",
    keywords: ["future", "tech", "digital", "ambient", "minimal", "synth", "innovation", "electronic"],
    rationale: "nhịp hiện đại, ít vocal, giữ cảm giác công nghệ mà không lấn nội dung UI",
    defaultVolume: 0.18,
  },
  socialMetadata: {
    longForm: {
      title: "Designer thời AI: Công việc thiết kế đang thay đổi thế nào?",
      description: [
        "AI không chỉ giúp designer tạo màn hình nhanh hơn. Nó thay đổi cả cách khám phá hướng thiết kế, so sánh phương án, xây hệ thống và ra quyết định.",
        "",
        "Video này tóm tắt một workflow thực tế: nhìn toàn cảnh → thử nhiều hướng → chọn lọc → hệ thống hóa → tinh chỉnh → ship.",
        "",
        "Điểm quan trọng: lợi thế của designer không nằm ở việc generate nhiều hơn, mà ở khả năng đặt câu hỏi tốt, giữ gu thẩm mỹ và ra quyết định tốt hơn.",
      ].join("\n"),
      hashtags: ["#Designer", "#AI", "#UIDesign", "#UXDesign", "#ProductDesign", "#DesignWorkflow", "#GenerativeAI"],
      keywords: [
        "designer thời AI",
        "AI cho designer",
        "UI UX design workflow",
        "product design",
        "generative AI design",
        "AI assisted design",
        "thiết kế sản phẩm",
        "workflow designer 2026",
      ],
      pinnedComment: "Bạn đang dùng AI nhiều nhất ở bước nào: research, exploration, UI hay handoff?",
    },
    shortForm: {
      title: "Designer + AI: generate nhanh chưa đủ 👀",
      description: "AI làm option rẻ hơn. Giá trị của designer chuyển mạnh sang đặt câu hỏi, chọn hướng, xây hệ thống và tinh chỉnh quyết định. Đây là workflow 54 giây từ canvas rộng đến lúc ship.",
      hashtags: ["#Designer", "#AI", "#UIDesign", "#UX", "#Reels", "#Shorts", "#DesignTok"],
      keywords: [
        "designer AI",
        "AI design workflow",
        "UI design",
        "UX design",
        "product designer",
        "AI workflow",
        "design process",
      ],
      pinnedComment: "AI đang giúp bạn tiết kiệm thời gian ở bước nào nhất?",
    },
  },
  component: DesignerAiPresetComposition,
};
