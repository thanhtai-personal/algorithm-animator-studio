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
  name: "Designer × AI — From Stitch to Code",
  description: "Visual-first reel 78 giây nối workflow designer × AI từ Stitch sang Codex: screen recording là nhân vật chính, text chỉ làm impact cue, chuyển động theo kiểu editorial camera glide; zoom/crop được tăng có chủ đích khi export Short/Reel 9:16.",
  tags: ["design", "ai", "workflow", "product-design", "ui-ux", "stitch", "codex", "design-to-code", "shorts", "reels"],
  accentColor: "#8b5cf6",
  defaultDurationSeconds: DESIGNER_AI_DURATION_SECONDS,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: false,
  settingsRevision: 1,
  previewSections: DESIGNER_AI_PREVIEW_SECTIONS,
  videoSources: DESIGNER_AI_VIDEO_SOURCES,
  videoSourceStrategy: "local",
  musicRecommendation: {
    mood: "Minimal future groove / design-tech electronica",
    keywords: ["minimal", "future", "groove", "electronic", "downtempo", "deep", "tech", "synth", "ambient", "pulse"],
    rationale: "nhịp đều, hiện đại và ít vocal; đủ giữ flow cho screen recording nhưng không có glitch/drop gắt cạnh tranh với UI",
    defaultVolume: 0.18,
  },
  socialMetadata: {
    longForm: {
      title: "Designer thời AI: Từ Stitch đến Codex, design đi vào code thế nào?",
      description: [
        "AI không chỉ giúp designer tạo màn hình nhanh hơn. Nó thay đổi cả cách khám phá hướng thiết kế, so sánh phương án, xây hệ thống và ra quyết định.",
        "",
        "Video này nối trọn một workflow thực tế: nhìn toàn cảnh → thử nhiều hướng → chọn lọc → hệ thống hóa → tinh chỉnh → handoff từ Stitch → Codex đọc source → implement trong repo → validate.",
        "",
        "Điểm quan trọng: AI không thay thế judgement. Stitch đưa visual direction; source hiện tại giữ behavior/data làm source of truth; Codex triển khai và phải qua review, typecheck, build, responsive checks trước khi coi là xong.",
      ].join("\n"),
      hashtags: ["#Designer", "#AI", "#UIDesign", "#UXDesign", "#ProductDesign", "#DesignToCode", "#Codex"],
      keywords: [
        "designer thời AI",
        "AI cho designer",
        "UI UX design workflow",
        "product design",
        "generative AI design",
        "AI assisted design",
        "thiết kế sản phẩm",
        "workflow designer 2026",
        "Stitch to Codex",
        "design to code AI",
        "AI coding UI",
      ],
      pinnedComment: "Bạn muốn AI dừng ở mockup, hay nối luôn từ visual direction sang code + validation như workflow này?",
    },
    shortForm: {
      title: "Stitch → Codex: AI design đi thẳng vào code 👀",
      description: "AI không chỉ generate UI. Workflow 78 giây này đi từ Stitch để chốt visual direction sang Codex đọc source, implement trực tiếp trong repo và validate bằng typecheck/build/responsive checks.",
      hashtags: ["#Designer", "#AI", "#UIDesign", "#Codex", "#DesignToCode", "#Reels", "#Shorts"],
      keywords: [
        "designer AI",
        "AI design workflow",
        "UI design",
        "UX design",
        "product designer",
        "AI workflow",
        "design process",
        "Stitch Codex",
        "design to code",
        "AI coding workflow",
      ],
      pinnedComment: "Bạn có để AI implement thẳng từ design vào repo không, hay vẫn handoff thủ công?",
    },
  },
  component: DesignerAiPresetComposition,
};
