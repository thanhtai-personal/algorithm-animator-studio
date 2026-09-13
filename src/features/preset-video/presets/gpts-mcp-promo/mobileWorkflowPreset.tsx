import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { GptsMcpPromoComposition } from "./GptsMcpPromoComposition";
import { buildPreviewSections, getGptsMcpPromoContent, MOBILE_BEATS, MOBILE_DURATION, MOBILE_LYRICS } from "./gptsMcpPromoContent";

function Composition(props: PresetVideoCompositionProps) {
  const content = getGptsMcpPromoContent("mobile-workflow", props.language);
  return <GptsMcpPromoComposition {...props} variant="mobile-workflow" beats={content.beats} lyrics={content.lyrics} />;
}

const english = getGptsMcpPromoContent("mobile-workflow", "en");

export const gptsMcpMobileWorkflowPreset: PresetVideoDefinition = {
  id: "gpts-mcp-mobile-workflow", name: "GPTs MCP — Làm việc từ điện thoại", description: "Promo 38 giây: dùng Custom GPT trên điện thoại như remote control, còn MCP Gateway thực hiện discovery + tool execution phía server.", tags: ["gpts-mcp", "mobile", "remote-work", "custom-gpt", "mcp", "shorts"], accentColor: "#5eead4", defaultDurationSeconds: MOBILE_DURATION, defaultFps: 30, defaultOutputPreset: "portrait-1080p", hasOriginalAudio: false, lyricTimingRevision: 2, previewSections: buildPreviewSections(MOBILE_BEATS), editableLyrics: MOBILE_LYRICS,
  localizations: { en: { name: "GPTs MCP — Work from your phone", description: "38-second promo: use Custom GPT on your phone as a remote control while MCP Gateway handles discovery and tool execution on the server.", previewSections: buildPreviewSections(english.beats), editableLyrics: english.lyrics } },
  musicRecommendation: { mood: "clean mobile future groove", keywords: ["mobile", "minimal", "future", "groove", "ambient"], rationale: "Nhẹ, hiện đại, không cạnh tranh với voiceover và phone UI.", defaultVolume: 0.15 },
  socialMetadata: { longForm: { title: "Không cần ngồi trước máy tính để điều khiển MCP workflow", description: "Mở Custom GPT trên điện thoại, giữ intent trong cuộc chat; Gateway xử lý entitlement, runtime discovery và provider execution ở server.", hashtags: ["#MCP", "#CustomGPT", "#MobileWorkflow", "#AI"], keywords: ["MCP mobile", "Custom GPT phone", "AI remote workflow"] }, shortForm: { title: "Điện thoại = remote control cho MCP workflow 📱", description: "Custom GPT giữ hội thoại. Gateway giữ execution boundary.", hashtags: ["#MCP", "#CustomGPT", "#MobileAI", "#Shorts"], keywords: ["MCP phone", "Custom GPT mobile", "AI tools"] } }, component: Composition,
};
