import type { PresetVideoCompositionProps, PresetVideoDefinition, PresetVideoEditableLyricCue } from "../../types";
import { buildPreviewSections } from "./gptsMcpPromoContent";
import { GatewayControlPlaneComposition, GATEWAY_CONTROL_PLANE_BEATS, GATEWAY_CONTROL_PLANE_DURATION } from "./GatewayControlPlaneComposition";

const cue = (id: string, start: number, end: number, text: string): PresetVideoEditableLyricCue => ({ id, start, end, lines: [text] });

const VI_LYRICS: readonly PresetVideoEditableLyricCue[] = [
  cue("control-1", 0.2, 6.8, "Custom GPT không cần ôm cả execution layer. Model suy nghĩ, Gateway giữ boundary thực thi."),
  cue("control-2", 7.2, 14.7, "Tách riêng Gateway token, Open ID và provider credential để quyền truy cập không bị trộn vào chat context."),
  cue("control-3", 15.2, 24.7, "Intent đi từ ChatGPT qua GPTs MCP Gateway rồi mới tới MCP provider bằng một protocol ổn định."),
  cue("control-4", 25.2, 34.7, "Gateway discover service, tool và schema ở runtime trước khi call, nên không cần hardcode tool catalog vào Knowledge."),
  cue("control-5", 35.2, 44.7, "Integration Kit chỉ giữ phần context bền vững: Instructions, Knowledge, OpenAPI và setup guide."),
  cue("control-6", 45.2, 52.8, "GPTs MCP Gateway. Một control plane gọn hơn cho Custom GPT kết nối MCP."),
];

const EN_LYRICS: readonly PresetVideoEditableLyricCue[] = [
  cue("control-1", 0.2, 6.8, "A Custom GPT does not need to carry the execution layer. The model reasons while Gateway owns the boundary."),
  cue("control-2", 7.2, 14.7, "Gateway token, Open ID and provider credentials stay separate so authorization does not leak into chat context."),
  cue("control-3", 15.2, 24.7, "Intent moves from ChatGPT through GPTs MCP Gateway to the MCP provider using one stable protocol."),
  cue("control-4", 25.2, 34.7, "Gateway discovers services, tools and schemas at runtime before calling, so the tool catalog is not hardcoded into Knowledge."),
  cue("control-5", 35.2, 44.7, "The Integration Kit keeps only durable context: Instructions, Knowledge, OpenAPI and the setup guide."),
  cue("control-6", 45.2, 52.8, "GPTs MCP Gateway. A leaner control plane for connecting Custom GPT to MCP."),
];

function Composition(props: PresetVideoCompositionProps) {
  return <GatewayControlPlaneComposition {...props} />;
}

export const gptsMcpControlPlanePreset: PresetVideoDefinition = {
  id: "gpts-mcp-control-plane",
  name: "GPTs MCP — Control plane",
  description: "Preset 53 giây học nhịp visual của video CodeLocal nhưng bám source Gateway hiện tại: ChatGPT → Gateway → MCP provider, tách Gateway token/Open ID/provider credential, runtime discovery và Integration Kit.",
  tags: ["gpts-mcp", "control-plane", "runtime-discovery", "open-id", "custom-gpt", "vertical-promo"],
  accentColor: "#55e6d8",
  defaultDurationSeconds: GATEWAY_CONTROL_PLANE_DURATION,
  defaultFps: 30,
  defaultOutputPreset: "portrait-1080p",
  hasOriginalAudio: false,
  lyricTimingRevision: 1,
  previewSections: buildPreviewSections(GATEWAY_CONTROL_PLANE_BEATS.vi),
  editableLyrics: VI_LYRICS,
  localizations: {
    en: {
      name: "GPTs MCP — Control plane",
      description: "53-second vertical promo inspired by CodeLocal's visual pacing while staying faithful to the current Gateway architecture: ChatGPT → Gateway → MCP provider, separated authorization, runtime discovery and Integration Kit.",
      previewSections: buildPreviewSections(GATEWAY_CONTROL_PLANE_BEATS.en),
      editableLyrics: EN_LYRICS,
    },
  },
  musicRecommendation: {
    mood: "minimal dark tech pulse",
    keywords: ["minimal", "dark tech", "pulse", "clean", "futuristic"],
    rationale: "Giữ nhịp chắc và sạch như video tham chiếu, không lấn typography và protocol diagrams.",
    defaultVolume: 0.16,
  },
  socialMetadata: {
    longForm: {
      title: "Custom GPT → GPTs MCP Gateway → MCP Provider",
      description: "Một control plane tách auth, credential và runtime tool discovery khỏi GPT context.",
      hashtags: ["#MCP", "#CustomGPT", "#AIAutomation", "#DeveloperTools"],
      keywords: ["GPTs MCP Gateway", "Custom GPT MCP", "MCP control plane", "runtime tool discovery"],
    },
    shortForm: {
      title: "Đừng hardcode tool catalog vào GPT",
      description: "Intent ở GPT. Auth + discovery + execution boundary ở Gateway.",
      hashtags: ["#MCP", "#CustomGPT", "#AI", "#DevTools"],
      keywords: ["MCP Gateway", "Open ID", "runtime discovery"],
    },
  },
  component: Composition,
};
