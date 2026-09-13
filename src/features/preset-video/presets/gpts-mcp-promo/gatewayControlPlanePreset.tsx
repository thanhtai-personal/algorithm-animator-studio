import type { PresetVideoCompositionProps, PresetVideoDefinition, PresetVideoEditableLyricCue, PresetVideoSocialMetadata } from "../../types";
import { buildPreviewSections } from "./gptsMcpPromoContent";
import { GatewayControlPlaneComposition } from "./GatewayControlPlaneComposition";
import { GATEWAY_CONTROL_PLANE_BEATS, GATEWAY_CONTROL_PLANE_DURATION } from "./gatewayControlPlaneContent";

const cue = (id: string, start: number, end: number, text: string): PresetVideoEditableLyricCue => ({ id, start, end, lines: [text] });

const VI_LYRICS: readonly PresetVideoEditableLyricCue[] = [
  cue("control-1", 0.2, 4.8, "Đang code thì Codex báo hết token. Việc vẫn chưa xong. Bạn làm gì?"),
  cue("control-2", 5.2, 11.8, "Mở Custom GPT đã kết nối GPTs MCP Gateway, rồi tiếp tục yêu cầu ngay trong chat."),
  cue("control-3", 12.2, 19.8, "Gateway là lớp trung gian giữa GPT và MCP: giữ quyền truy cập, rồi route yêu cầu tới provider."),
  cue("control-4", 20.2, 29.8, "Nạp Integration Kit và Action schema vào GPT. GPT giữ mục tiêu, Gateway mở công cụ phù hợp."),
  cue("control-5", 30.2, 38.8, "Gateway tìm service, tool và schema ở runtime trước khi gọi. Open ID kiểm tra quyền; provider key ở server."),
  cue("control-6", 39.2, 45.8, "Codex tạm dừng, nhưng phiên GPT vẫn có thể tiếp tục workflow qua MCP tools."),
  cue("control-7", 46.2, 52.8, "Thử GPTs MCP Gateway tại gpts-mcp.vercel.app. Tải Integration Kit miễn phí và kết nối GPT của bạn."),
];

const EN_LYRICS: readonly PresetVideoEditableLyricCue[] = [
  cue("control-1", 0.2, 4.8, "Codex runs out of tokens in the middle of coding. The task is unfinished. What now?"),
  cue("control-2", 5.2, 11.8, "Open a Custom GPT connected to GPTs MCP Gateway and continue the request in chat."),
  cue("control-3", 12.2, 19.8, "Gateway sits between GPT and MCP. It checks access and routes the request to the provider."),
  cue("control-4", 20.2, 29.8, "Load the Integration Kit and Action schema into GPT. GPT keeps the goal; Gateway finds the right tool."),
  cue("control-5", 30.2, 38.8, "Gateway discovers services, tools and schemas at runtime before calling. Open ID checks access; provider keys stay server-side."),
  cue("control-6", 39.2, 45.8, "Codex may be paused, but the GPT session can keep the workflow moving through MCP tools."),
  cue("control-7", 46.2, 52.8, "Try GPTs MCP Gateway at gpts-mcp.vercel.app. Download the free Integration Kit and connect your GPT."),
];

const VI_SOCIAL: PresetVideoSocialMetadata = {
  longForm: {
    title: "Codex hết token? Tiếp tục với Custom GPT + MCP Gateway",
    description: "Codex chạm giới hạn giữa lúc đang code? Dùng Custom GPT kết nối GPTs MCP Gateway để tiếp tục yêu cầu qua MCP tools. Video cho thấy Integration Kit, Action schema, runtime discovery và quyền Open ID. Tải kit miễn phí tại gpts-mcp.vercel.app.",
    hashtags: ["#Codex", "#MCP", "#CustomGPT", "#DeveloperTools"],
    keywords: ["Codex hết token", "GPTs MCP Gateway", "Custom GPT với MCP", "MCP Gateway", "Integration Kit"],
  },
  shortForm: {
    title: "Codex hết token giữa task? Thử GPTs + MCP Gateway",
    description: "Codex tạm dừng, workflow vẫn có thể tiếp tục qua Custom GPT, Gateway và MCP tools. Tải Integration Kit miễn phí tại gpts-mcp.vercel.app.",
    hashtags: ["#Codex", "#MCP", "#CustomGPT", "#DevTools"],
    keywords: ["Codex hết token", "MCP Gateway", "Custom GPT MCP", "GPTs MCP"],
  },
};

const EN_SOCIAL: PresetVideoSocialMetadata = {
  longForm: {
    title: "Codex out of tokens? Continue with Custom GPT + MCP Gateway",
    description: "When Codex reaches its limit mid-task, a Custom GPT connected to GPTs MCP Gateway can continue requests through MCP tools. See the Integration Kit, Action schema, runtime discovery and Open ID access. Download the free kit at gpts-mcp.vercel.app.",
    hashtags: ["#Codex", "#MCP", "#CustomGPT", "#DeveloperTools"],
    keywords: ["Codex token limit", "GPTs MCP Gateway", "Custom GPT MCP", "MCP Gateway", "Integration Kit"],
  },
  shortForm: {
    title: "Codex out of tokens mid-task? Try GPTs + MCP Gateway",
    description: "Codex may pause, but a Custom GPT can keep the workflow moving through Gateway and MCP tools. Get the free Integration Kit at gpts-mcp.vercel.app.",
    hashtags: ["#Codex", "#MCP", "#CustomGPT", "#DevTools"],
    keywords: ["Codex token limit", "MCP Gateway", "Custom GPT MCP", "GPTs MCP"],
  },
};

function Composition(props: PresetVideoCompositionProps) {
  return <GatewayControlPlaneComposition {...props} />;
}

export const gptsMcpControlPlanePreset: PresetVideoDefinition = {
  id: "gpts-mcp-control-plane",
  name: "GPTs MCP — Codex hết token, việc vẫn chạy",
  description: "Reel 53 giây mở bằng Codex hết token, rồi chuyển sang Custom GPT + GPTs MCP Gateway. Dùng ảnh và clip thật về Gateway, GPT Action, MCP services và hội thoại.",
  tags: ["gpts-mcp", "codex", "token-limit", "custom-gpt", "mcp-gateway", "vertical-promo"],
  accentColor: "#55e6d8",
  defaultDurationSeconds: GATEWAY_CONTROL_PLANE_DURATION,
  defaultFps: 30,
  defaultOutputPreset: "portrait-1080p",
  hasOriginalAudio: false,
  lyricTimingRevision: 2,
  previewSections: buildPreviewSections(GATEWAY_CONTROL_PLANE_BEATS.vi),
  editableLyrics: VI_LYRICS,
  musicRecommendation: {
    mood: "minimal dark tech pulse",
    keywords: ["minimal", "dark tech", "pulse", "clean", "futuristic"],
    rationale: "Giữ nhịp chắc và sạch như video tham chiếu, không lấn lời đọc và các đoạn quay màn hình.",
    defaultVolume: 0.16,
  },
  socialMetadata: VI_SOCIAL,
  localizations: {
    en: {
      name: "GPTs MCP — Codex out of tokens, work continues",
      description: "53-second vertical reel: Codex hits its token limit, then a Custom GPT and GPTs MCP Gateway keep the workflow moving. Uses real Gateway, GPT Action, MCP services and chat footage.",
      previewSections: buildPreviewSections(GATEWAY_CONTROL_PLANE_BEATS.en),
      editableLyrics: EN_LYRICS,
      musicRecommendation: {
        mood: "minimal dark tech pulse",
        keywords: ["minimal", "dark tech", "pulse", "clean", "futuristic"],
        rationale: "Keeps the reference video's firm, clean pacing without competing with narration and screen recordings.",
        defaultVolume: 0.16,
      },
      socialMetadata: EN_SOCIAL,
    },
  },
  component: Composition,
};
