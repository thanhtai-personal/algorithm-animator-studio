import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { GptsMcpPromoComposition } from "./GptsMcpPromoComposition";
import { buildPreviewSections, getGptsMcpPromoContent, TOKEN_FALLBACK_BEATS, TOKEN_FALLBACK_DURATION, TOKEN_FALLBACK_LYRICS } from "./gptsMcpPromoContent";

function Composition(props: PresetVideoCompositionProps) {
  const content = getGptsMcpPromoContent("token-fallback", props.language);
  return <GptsMcpPromoComposition {...props} variant="token-fallback" beats={content.beats} lyrics={content.lyrics} />;
}

const english = getGptsMcpPromoContent("token-fallback", "en");

export const gptsMcpTokenFallbackPreset: PresetVideoDefinition = {
  id: "gpts-mcp-token-fallback",
  name: "GPTs MCP — Codex hết token vẫn tiếp tục",
  description: "Promo 36 giây: khi coding session chạm token limit, chuyển sang Custom GPT + MCP Gateway để tiếp tục workflow bằng runtime tools.",
  tags: ["gpts-mcp", "codex", "fallback", "custom-gpt", "mcp", "promo"],
  accentColor: "#ffb020", defaultDurationSeconds: TOKEN_FALLBACK_DURATION, defaultFps: 30, defaultOutputPreset: "portrait-1080p", hasOriginalAudio: false, lyricTimingRevision: 2,
  previewSections: buildPreviewSections(TOKEN_FALLBACK_BEATS), editableLyrics: TOKEN_FALLBACK_LYRICS,
  localizations: {
    en: { name: "GPTs MCP — Keep coding after Codex hits the token limit", description: "36-second promo: when the coding session hits its token limit, switch to Custom GPT + MCP Gateway and continue through runtime tools.", previewSections: buildPreviewSections(english.beats), editableLyrics: english.lyrics },
  },
  musicRecommendation: { mood: "urgent tech pulse → confident release", keywords: ["tech", "pulse", "minimal", "future", "confident"], rationale: "Mở đầu tạo tension ở token limit, sau đó nhịp ổn định khi Gateway tiếp quản workflow.", defaultVolume: 0.16 },
  socialMetadata: { longForm: { title: "Codex hết token? Workflow chưa cần dừng.", description: "Một cách dùng Custom GPT + MCP Gateway như control plane dự phòng: discover service/tool/schema ở runtime rồi tiếp tục gọi provider qua Gateway.", hashtags: ["#MCP", "#CustomGPT", "#Codex", "#AIWorkflow"], keywords: ["MCP Gateway", "Codex token", "Custom GPT tools"] }, shortForm: { title: "Codex hết token? Đổi đường, đừng dừng workflow.", description: "Custom GPT + MCP Gateway có thể trở thành đường dự phòng cho workflow tool-based.", hashtags: ["#MCP", "#Codex", "#CustomGPT", "#AI"], keywords: ["Codex", "MCP", "Custom GPT"] } },
  component: Composition,
};
