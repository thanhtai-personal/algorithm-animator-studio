import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { GptsMcpPromoComposition } from "./GptsMcpPromoComposition";
import { buildPreviewSections, getGptsMcpPromoContent, SECURE_BEATS, SECURE_DURATION, SECURE_LYRICS } from "./gptsMcpPromoContent";

function Composition(props: PresetVideoCompositionProps) {
  const content = getGptsMcpPromoContent("secure-gateway", props.language);
  return <GptsMcpPromoComposition {...props} variant="secure-gateway" beats={content.beats} lyrics={content.lyrics} />;
}

const english = getGptsMcpPromoContent("secure-gateway", "en");

export const gptsMcpSecureGatewayPreset: PresetVideoDefinition = {
  id: "gpts-mcp-secure-gateway", name: "GPTs MCP — Secure runtime gateway", description: "Promo 42 giây bám landing production: provider credentials ngoài GPT context, Open ID entitlement và runtime MCP tool discovery qua một Action protocol ổn định.", tags: ["gpts-mcp", "security", "open-id", "runtime-discovery", "custom-gpt", "promo"], accentColor: "#8b5cf6", defaultDurationSeconds: SECURE_DURATION, defaultFps: 30, defaultOutputPreset: "landscape-1080p", hasOriginalAudio: false, lyricTimingRevision: 2, previewSections: buildPreviewSections(SECURE_BEATS), editableLyrics: SECURE_LYRICS,
  localizations: { en: { name: "GPTs MCP — Secure runtime gateway", description: "42-second promo: keep provider credentials outside GPT context, use Open ID entitlement and discover MCP tools at runtime through one stable Action protocol.", previewSections: buildPreviewSections(english.beats), editableLyrics: english.lyrics } },
  musicRecommendation: { mood: "dark cinematic control-plane tech", keywords: ["dark", "cinematic", "tech", "pulse", "minimal"], rationale: "Tạo cảm giác control plane và security nhưng vẫn để protocol flow là nhân vật chính.", defaultVolume: 0.17 },
  socialMetadata: { longForm: { title: "Custom GPT × MCP: giữ provider key ngoài GPT context", description: "GPTs MCP Gateway tách credential, entitlement và runtime tool discovery thành một execution boundary phía server.", hashtags: ["#MCP", "#CustomGPT", "#Security", "#OpenID"], keywords: ["MCP Gateway", "Custom GPT MCP", "runtime tool discovery"] }, shortForm: { title: "Đừng nhét provider key vào GPT context", description: "Credential ở Gateway. Tool catalog ở runtime. GPT giữ protocol tối thiểu.", hashtags: ["#MCP", "#CustomGPT", "#Security", "#AI"], keywords: ["MCP security", "Custom GPT security", "runtime tools"] } }, component: Composition,
};
