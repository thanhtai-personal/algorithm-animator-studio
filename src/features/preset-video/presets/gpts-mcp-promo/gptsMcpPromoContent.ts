import type { PresetVideoEditableLyricCue, PresetVideoPreviewSection } from "../../types";

export type GptsMcpPromoVariant = "token-fallback" | "mobile-workflow" | "secure-gateway";

export type GptsMcpPromoBeat = {
  id: string;
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  body: string;
  metric?: string;
};

const makeCue = (id: string, start: number, end: number, lines: readonly string[]): PresetVideoEditableLyricCue => ({ id, start, end, lines });

export const TOKEN_FALLBACK_DURATION = 36;
export const TOKEN_FALLBACK_BEATS: readonly GptsMcpPromoBeat[] = [
  { id: "hook", start: 0, end: 6, eyebrow: "CODING FLOW INTERRUPTED", title: "Codex hết token?", body: "Đừng để workflow dừng ngay tại đó.", metric: "KEEP MOVING" },
  { id: "switch", start: 6, end: 14, eyebrow: "SWITCH THE CONTROL PLANE", title: "Mở Custom GPT", body: "Gateway cho GPT discover MCP services và tools ở runtime.", metric: "1 PROTOCOL" },
  { id: "discover", start: 14, end: 24, eyebrow: "RUNTIME DISCOVERY", title: "Không hardcode tool catalog", body: "listMcpServices → listMcpTools → getMcpToolSchema → callMcpTool", metric: "RUNTIME TRUTH" },
  { id: "result", start: 24, end: 31, eyebrow: "CONTINUE THE TASK", title: "Tiếp tục làm việc bằng tool", body: "Provider credential vẫn nằm ngoài GPT context.", metric: "CLEAN CONTEXT" },
  { id: "cta", start: 31, end: 36, eyebrow: "GPTS MCP GATEWAY", title: "Một đường dự phòng cho workflow AI", body: "Connect provider. Configure GPT. Activate access. Execute.", metric: "gpts-mcp.vercel.app" },
];
export const TOKEN_FALLBACK_LYRICS = [
  makeCue("token-1", 0.2, 5.8, ["Codex hết token giữa lúc đang làm?"]),
  makeCue("token-2", 6.2, 13.6, ["Chuyển sang Custom GPT đã gắn MCP Gateway,", "và tiếp tục workflow bằng tool."]),
  makeCue("token-3", 14.2, 23.6, ["Gateway tự discover service, tool và schema ở runtime,", "không cần hardcode cả catalog vào GPT."]),
  makeCue("token-4", 24.2, 30.6, ["Provider key vẫn ở Gateway,", "không đi vào GPT context."]),
  makeCue("token-5", 31.1, 35.8, ["GPTs MCP Gateway. Một control plane dự phòng", "để workflow AI không dừng lại."]),
] as const;

export const MOBILE_DURATION = 38;
export const MOBILE_BEATS: readonly GptsMcpPromoBeat[] = [
  { id: "hook", start: 0, end: 6, eyebrow: "DESKTOP NOT REQUIRED", title: "Không ở cạnh máy tính?", body: "Workflow vẫn có thể tiếp tục từ điện thoại.", metric: "MOBILE FIRST" },
  { id: "phone", start: 6, end: 15, eyebrow: "CUSTOM GPT", title: "Mở ChatGPT trên điện thoại", body: "Ra lệnh bằng hội thoại như bình thường.", metric: "ASK → ACT" },
  { id: "gateway", start: 15, end: 25, eyebrow: "MCP GATEWAY", title: "Gateway lo phần tool execution", body: "Resolve access, discover tool, validate schema, rồi gọi provider.", metric: "CONTROLLED" },
  { id: "remote", start: 25, end: 33, eyebrow: "ANYWHERE WORKFLOW", title: "Điện thoại trở thành remote control", body: "Bạn giữ intent. Gateway giữ execution boundary.", metric: "NO DESK" },
  { id: "cta", start: 33, end: 38, eyebrow: "GPTS MCP GATEWAY", title: "Mang MCP tools vào Custom GPT", body: "Start free. Connect provider. Configure your GPT.", metric: "7-DAY TRIAL" },
];
export const MOBILE_LYRICS = [
  makeCue("mobile-1", 0.2, 5.8, ["Không ở cạnh máy tính nhưng vẫn muốn tiếp tục công việc?"]),
  makeCue("mobile-2", 6.2, 14.7, ["Mở Custom GPT trên điện thoại,", "nói việc bạn muốn làm như một cuộc chat bình thường."]),
  makeCue("mobile-3", 15.2, 24.6, ["MCP Gateway kiểm tra quyền, discover tool ở runtime,", "rồi gọi provider thay cho bạn."]),
  makeCue("mobile-4", 25.2, 32.7, ["Bạn giữ intent trên điện thoại.", "Gateway giữ execution boundary ở phía server."]),
  makeCue("mobile-5", 33.1, 37.8, ["GPTs MCP Gateway. Mang MCP tools", "vào Custom GPT của bạn."]),
] as const;

export const SECURE_DURATION = 42;
export const SECURE_BEATS: readonly GptsMcpPromoBeat[] = [
  { id: "hook", start: 0, end: 7, eyebrow: "THE OLD WAY", title: "Đừng nhét provider key vào GPT", body: "Credential sprawl và stale tools là một kiến trúc mong manh.", metric: "LEGACY RISK" },
  { id: "boundary", start: 7, end: 16, eyebrow: "ZERO-TRUST BOUNDARY", title: "Credential ở Gateway", body: "Open ID authorizes execution. GPT chỉ giữ protocol tối thiểu.", metric: "NO KEY IN CONTEXT" },
  { id: "runtime", start: 16, end: 28, eyebrow: "LIVE PROTOCOL", title: "Discover tools ở runtime", body: "Service → Tool → Schema → Call. Runtime source of truth.", metric: "DYNAMIC MCP" },
  { id: "kit", start: 28, end: 36, eyebrow: "GPT INTEGRATION KIT", title: "Configure trước, activate sau", body: "Instructions + Knowledge + OpenAPI + setup guide.", metric: "FREE KIT" },
  { id: "cta", start: 36, end: 42, eyebrow: "GPTS MCP GATEWAY", title: "Secure control plane cho Custom GPT × MCP", body: "Google Stitch available. Trial starts when you create the trial token.", metric: "START FREE" },
];
export const SECURE_LYRICS = [
  makeCue("secure-1", 0.2, 6.7, ["Đừng nhét provider key và cả catalog tool", "vào GPT context."]),
  makeCue("secure-2", 7.2, 15.6, ["Gateway giữ credential ở server,", "Open ID authorizes mỗi lần MCP execution."]),
  makeCue("secure-3", 16.2, 27.6, ["GPT discover service, tool và schema ở runtime,", "rồi gọi provider qua một protocol ổn định."]),
  makeCue("secure-4", 28.2, 35.7, ["Integration Kit cho bạn Instructions, Knowledge, OpenAPI", "và setup guide để cấu hình Custom GPT."]),
  makeCue("secure-5", 36.2, 41.8, ["GPTs MCP Gateway. Secure control plane", "cho Custom GPT kết nối MCP."]),
] as const;

export function buildPreviewSections(beats: readonly GptsMcpPromoBeat[]): readonly PresetVideoPreviewSection[] {
  return beats.map((beat, index) => ({
    id: beat.id,
    label: String(index + 1).padStart(2, "0"),
    title: beat.title,
    startSeconds: beat.start,
    endSeconds: beat.end,
  }));
}
