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
  { id: "hook", start: 0, end: 6, eyebrow: "CODING SESSION", title: "HẾT TOKEN?", body: "GIỜ PHẢI LÀM SAO ĐÂY?", metric: "TOKEN LIMIT" },
  { id: "switch", start: 6, end: 14, eyebrow: "PLAN B", title: "ĐỔI WORKFLOW", body: "Custom GPT + MCP Gateway", metric: "KEEP MOVING" },
  { id: "discover", start: 14, end: 24, eyebrow: "RUNTIME", title: "DISCOVER TOOL", body: "Service → Tool → Schema → Call", metric: "NO HARDCODE" },
  { id: "result", start: 24, end: 31, eyebrow: "EXECUTION", title: "CALL MCP", body: "Workflow tiếp tục qua Gateway", metric: "KEY OUTSIDE GPT" },
  { id: "cta", start: 31, end: 36, eyebrow: "GPTS MCP GATEWAY", title: "HẾT QUOTA ≠ HẾT CÁCH", body: "gpts-mcp.vercel.app", metric: "LÀM ĐƯỢC KHÔNG?" },
];
export const TOKEN_FALLBACK_LYRICS = [
  makeCue("token-1", 0.2, 5.8, ["Codex hết token ngay giữa lúc đang code. Giờ phải làm sao đây?"]),
  makeCue("token-2", 6.2, 13.6, ["Mình không cố biến Codex thành vô hạn. Mình đổi workflow sang Custom GPT đã gắn MCP Gateway."]),
  makeCue("token-3", 14.2, 23.6, ["Gateway discover service, tool và schema ở runtime, rồi mới gọi MCP tool cần thiết."]),
  makeCue("token-4", 24.2, 30.6, ["Provider key vẫn nằm ở Gateway, còn GPT chỉ giữ intent và protocol tối thiểu."]),
  makeCue("token-5", 31.1, 35.8, ["Hết quota không có nghĩa là hết cách. GPTs MCP Gateway. Làm được không?"]),
] as const;

export const MOBILE_DURATION = 38;
export const MOBILE_BEATS: readonly GptsMcpPromoBeat[] = [
  { id: "hook", start: 0, end: 6, eyebrow: "AWAY FROM DESK", title: "KHÔNG CÓ LAPTOP?", body: "Vẫn muốn workflow chạy tiếp?", metric: "PHONE ONLY" },
  { id: "phone", start: 6, end: 15, eyebrow: "CUSTOM GPT", title: "NÓI VIỆC CẦN LÀM", body: "Chat như bình thường", metric: "ASK → ACT" },
  { id: "gateway", start: 15, end: 25, eyebrow: "MCP GATEWAY", title: "DISCOVER + EXECUTE", body: "Gateway xử lý tool boundary", metric: "CONTROLLED" },
  { id: "remote", start: 25, end: 33, eyebrow: "REMOTE CONTROL", title: "ĐIỆN THOẠI = CONTROL PLANE", body: "Intent ở bạn, execution ở server", metric: "NO DESK" },
  { id: "cta", start: 33, end: 38, eyebrow: "GPTS MCP GATEWAY", title: "MANG MCP VÀO CUSTOM GPT", body: "gpts-mcp.vercel.app", metric: "START FREE" },
];
export const MOBILE_LYRICS = [
  makeCue("mobile-1", 0.2, 5.8, ["Không ở cạnh máy tính nhưng vẫn muốn tiếp tục công việc?"]),
  makeCue("mobile-2", 6.2, 14.7, ["Mở Custom GPT trên điện thoại và nói việc bạn muốn làm như một cuộc chat bình thường."]),
  makeCue("mobile-3", 15.2, 24.6, ["MCP Gateway kiểm tra quyền, discover tool ở runtime rồi gọi provider thay cho bạn."]),
  makeCue("mobile-4", 25.2, 32.7, ["Bạn giữ intent trên điện thoại. Gateway giữ execution boundary ở phía server."]),
  makeCue("mobile-5", 33.1, 37.8, ["GPTs MCP Gateway. Mang MCP tools vào Custom GPT của bạn."]),
] as const;

export const SECURE_DURATION = 42;
export const SECURE_BEATS: readonly GptsMcpPromoBeat[] = [
  { id: "hook", start: 0, end: 7, eyebrow: "WAIT", title: "NHÉT API KEY VÀO GPT?", body: "Đừng làm vậy.", metric: "RISK" },
  { id: "boundary", start: 7, end: 16, eyebrow: "BOUNDARY", title: "KEY Ở GATEWAY", body: "GPT không giữ provider credential", metric: "CLEAN CONTEXT" },
  { id: "runtime", start: 16, end: 28, eyebrow: "LIVE PROTOCOL", title: "DISCOVER TOOL", body: "Service → Tool → Schema → Call", metric: "RUNTIME TRUTH" },
  { id: "kit", start: 28, end: 36, eyebrow: "INTEGRATION KIT", title: "CONFIGURE → ACTIVATE", body: "Instructions + Knowledge + OpenAPI", metric: "FREE KIT" },
  { id: "cta", start: 36, end: 42, eyebrow: "GPTS MCP GATEWAY", title: "SECURE CONTROL PLANE", body: "Custom GPT × MCP", metric: "START FREE" },
];
export const SECURE_LYRICS = [
  makeCue("secure-1", 0.2, 6.7, ["Bạn đang nhét provider key và cả catalog tool vào GPT context? Dừng lại một chút."]),
  makeCue("secure-2", 7.2, 15.6, ["Gateway giữ credential ở server và Open ID authorize mỗi lần MCP execution."]),
  makeCue("secure-3", 16.2, 27.6, ["GPT discover service, tool và schema ở runtime rồi gọi provider qua một protocol ổn định."]),
  makeCue("secure-4", 28.2, 35.7, ["Integration Kit cung cấp Instructions, Knowledge, OpenAPI và setup guide để cấu hình Custom GPT."]),
  makeCue("secure-5", 36.2, 41.8, ["GPTs MCP Gateway. Secure control plane cho Custom GPT kết nối MCP."]),
] as const;

export function buildPreviewSections(beats: readonly GptsMcpPromoBeat[]): readonly PresetVideoPreviewSection[] {
  return beats.map((beat, index) => ({ id: beat.id, label: String(index + 1).padStart(2, "0"), title: beat.title, startSeconds: beat.start, endSeconds: beat.end }));
}
