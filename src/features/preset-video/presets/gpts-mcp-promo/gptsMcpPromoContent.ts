import type { PresetVideoEditableLyricCue, PresetVideoLanguage, PresetVideoPreviewSection } from "../../types";

export type GptsMcpPromoVariant = "token-fallback" | "mobile-workflow" | "secure-gateway";
export type GptsMcpPromoBeat = { id: string; start: number; end: number; eyebrow: string; title: string; body: string; metric?: string };
export type GptsMcpPromoLocalizedContent = { beats: readonly GptsMcpPromoBeat[]; lyrics: readonly PresetVideoEditableLyricCue[] };
const makeCue = (id: string, start: number, end: number, lines: readonly string[]): PresetVideoEditableLyricCue => ({ id, start, end, lines });

export const TOKEN_FALLBACK_DURATION = 36;
const TOKEN_FALLBACK_VI: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 6, eyebrow: "CODING SESSION", title: "HẾT TOKEN?", body: "GIỜ PHẢI LÀM SAO ĐÂY?", metric: "TOKEN LIMIT" },
    { id: "switch", start: 6, end: 14, eyebrow: "PLAN B", title: "ĐỔI WORKFLOW", body: "Custom GPT + MCP Gateway", metric: "KEEP MOVING" },
    { id: "discover", start: 14, end: 24, eyebrow: "RUNTIME", title: "DISCOVER TOOL", body: "Service → Tool → Schema → Call", metric: "NO HARDCODE" },
    { id: "result", start: 24, end: 31, eyebrow: "EXECUTION", title: "CALL MCP", body: "Workflow tiếp tục qua Gateway", metric: "KEY OUTSIDE GPT" },
    { id: "cta", start: 31, end: 36, eyebrow: "GPTS MCP GATEWAY", title: "HẾT QUOTA ≠ HẾT CÁCH", body: "gpts-mcp.vercel.app", metric: "LÀM ĐƯỢC KHÔNG?" },
  ],
  lyrics: [
    makeCue("token-1", 0.2, 5.8, ["Codex hết token ngay giữa lúc đang code. Giờ phải làm sao đây?"]),
    makeCue("token-2", 6.2, 13.6, ["Mình không cố biến Codex thành vô hạn. Mình đổi workflow sang Custom GPT đã gắn MCP Gateway."]),
    makeCue("token-3", 14.2, 23.6, ["Gateway discover service, tool và schema ở runtime, rồi mới gọi MCP tool cần thiết."]),
    makeCue("token-4", 24.2, 30.6, ["Provider key vẫn nằm ở Gateway, còn GPT chỉ giữ intent và protocol tối thiểu."]),
    makeCue("token-5", 31.1, 35.8, ["Hết quota không có nghĩa là hết cách. GPTs MCP Gateway. Làm được không?"]),
  ],
};
const TOKEN_FALLBACK_EN: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 6, eyebrow: "CODING SESSION", title: "OUT OF TOKENS?", body: "WHAT DO YOU DO NOW?", metric: "TOKEN LIMIT" },
    { id: "switch", start: 6, end: 14, eyebrow: "PLAN B", title: "SWITCH THE WORKFLOW", body: "Custom GPT + MCP Gateway", metric: "KEEP MOVING" },
    { id: "discover", start: 14, end: 24, eyebrow: "RUNTIME", title: "DISCOVER TOOLS", body: "Service → Tool → Schema → Call", metric: "NO HARDCODE" },
    { id: "result", start: 24, end: 31, eyebrow: "EXECUTION", title: "CALL MCP", body: "Keep the workflow moving through Gateway", metric: "KEY OUTSIDE GPT" },
    { id: "cta", start: 31, end: 36, eyebrow: "GPTS MCP GATEWAY", title: "OUT OF QUOTA ≠ OUT OF OPTIONS", body: "gpts-mcp.vercel.app", metric: "CAN THIS WORK?" },
  ],
  lyrics: [
    makeCue("token-1", 0.2, 5.8, ["Codex runs out of tokens right in the middle of coding. What do you do now?"]),
    makeCue("token-2", 6.2, 13.6, ["I am not turning Codex into unlimited access. I switch the workflow to a Custom GPT connected to MCP Gateway."]),
    makeCue("token-3", 14.2, 23.6, ["Gateway discovers services, tools and schemas at runtime before calling the MCP tool it needs."]),
    makeCue("token-4", 24.2, 30.6, ["Provider credentials stay in Gateway while GPT keeps only the intent and a minimal protocol."]),
    makeCue("token-5", 31.1, 35.8, ["Running out of quota does not mean running out of options. GPTs MCP Gateway. Can this work?"]),
  ],
};

export const MOBILE_DURATION = 38;
const MOBILE_VI: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 6, eyebrow: "AWAY FROM DESK", title: "KHÔNG CÓ LAPTOP?", body: "Vẫn muốn workflow chạy tiếp?", metric: "PHONE ONLY" },
    { id: "phone", start: 6, end: 15, eyebrow: "CUSTOM GPT", title: "NÓI VIỆC CẦN LÀM", body: "Chat như bình thường", metric: "ASK → ACT" },
    { id: "gateway", start: 15, end: 25, eyebrow: "MCP GATEWAY", title: "DISCOVER + EXECUTE", body: "Gateway xử lý tool boundary", metric: "CONTROLLED" },
    { id: "remote", start: 25, end: 33, eyebrow: "REMOTE CONTROL", title: "ĐIỆN THOẠI = CONTROL PLANE", body: "Intent ở bạn, execution ở server", metric: "NO DESK" },
    { id: "cta", start: 33, end: 38, eyebrow: "GPTS MCP GATEWAY", title: "MANG MCP VÀO CUSTOM GPT", body: "gpts-mcp.vercel.app", metric: "START FREE" },
  ],
  lyrics: [
    makeCue("mobile-1", 0.2, 5.8, ["Không ở cạnh máy tính nhưng vẫn muốn tiếp tục công việc?"]),
    makeCue("mobile-2", 6.2, 14.7, ["Mở Custom GPT trên điện thoại và nói việc bạn muốn làm như một cuộc chat bình thường."]),
    makeCue("mobile-3", 15.2, 24.6, ["MCP Gateway kiểm tra quyền, discover tool ở runtime rồi gọi provider thay cho bạn."]),
    makeCue("mobile-4", 25.2, 32.7, ["Bạn giữ intent trên điện thoại. Gateway giữ execution boundary ở phía server."]),
    makeCue("mobile-5", 33.1, 37.8, ["GPTs MCP Gateway. Mang MCP tools vào Custom GPT của bạn."]),
  ],
};
const MOBILE_EN: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 6, eyebrow: "AWAY FROM DESK", title: "NO LAPTOP?", body: "Still need the workflow to keep moving?", metric: "PHONE ONLY" },
    { id: "phone", start: 6, end: 15, eyebrow: "CUSTOM GPT", title: "SAY WHAT YOU NEED", body: "Chat normally", metric: "ASK → ACT" },
    { id: "gateway", start: 15, end: 25, eyebrow: "MCP GATEWAY", title: "DISCOVER + EXECUTE", body: "Gateway handles the tool boundary", metric: "CONTROLLED" },
    { id: "remote", start: 25, end: 33, eyebrow: "REMOTE CONTROL", title: "PHONE = CONTROL PLANE", body: "You keep intent. The server handles execution.", metric: "NO DESK" },
    { id: "cta", start: 33, end: 38, eyebrow: "GPTS MCP GATEWAY", title: "BRING MCP INTO CUSTOM GPT", body: "gpts-mcp.vercel.app", metric: "START FREE" },
  ],
  lyrics: [
    makeCue("mobile-1", 0.2, 5.8, ["Away from your computer but still need the work to continue?"]),
    makeCue("mobile-2", 6.2, 14.7, ["Open your Custom GPT on the phone and say what you need like a normal chat."]),
    makeCue("mobile-3", 15.2, 24.6, ["MCP Gateway checks access, discovers tools at runtime and calls the provider for you."]),
    makeCue("mobile-4", 25.2, 32.7, ["You keep the intent on your phone. Gateway keeps the execution boundary on the server."]),
    makeCue("mobile-5", 33.1, 37.8, ["GPTs MCP Gateway. Bring MCP tools into your Custom GPT."]),
  ],
};

export const SECURE_DURATION = 42;
const SECURE_VI: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 7, eyebrow: "WAIT", title: "NHÉT API KEY VÀO GPT?", body: "Đừng làm vậy.", metric: "RISK" },
    { id: "boundary", start: 7, end: 16, eyebrow: "BOUNDARY", title: "KEY Ở GATEWAY", body: "GPT không giữ provider credential", metric: "CLEAN CONTEXT" },
    { id: "runtime", start: 16, end: 28, eyebrow: "LIVE PROTOCOL", title: "DISCOVER TOOL", body: "Service → Tool → Schema → Call", metric: "RUNTIME TRUTH" },
    { id: "kit", start: 28, end: 36, eyebrow: "INTEGRATION KIT", title: "CONFIGURE → ACTIVATE", body: "Instructions + Knowledge + OpenAPI", metric: "FREE KIT" },
    { id: "cta", start: 36, end: 42, eyebrow: "GPTS MCP GATEWAY", title: "SECURE CONTROL PLANE", body: "Custom GPT × MCP", metric: "START FREE" },
  ],
  lyrics: [
    makeCue("secure-1", 0.2, 6.7, ["Bạn đang nhét provider key và cả catalog tool vào GPT context? Dừng lại một chút."]),
    makeCue("secure-2", 7.2, 15.6, ["Gateway giữ credential ở server và Open ID authorize mỗi lần MCP execution."]),
    makeCue("secure-3", 16.2, 27.6, ["GPT discover service, tool và schema ở runtime rồi gọi provider qua một protocol ổn định."]),
    makeCue("secure-4", 28.2, 35.7, ["Integration Kit cung cấp Instructions, Knowledge, OpenAPI và setup guide để cấu hình Custom GPT."]),
    makeCue("secure-5", 36.2, 41.8, ["GPTs MCP Gateway. Secure control plane cho Custom GPT kết nối MCP."]),
  ],
};
const SECURE_EN: GptsMcpPromoLocalizedContent = {
  beats: [
    { id: "hook", start: 0, end: 7, eyebrow: "WAIT", title: "PUT API KEYS IN GPT?", body: "Do not do that.", metric: "RISK" },
    { id: "boundary", start: 7, end: 16, eyebrow: "BOUNDARY", title: "KEYS STAY IN GATEWAY", body: "GPT does not hold provider credentials", metric: "CLEAN CONTEXT" },
    { id: "runtime", start: 16, end: 28, eyebrow: "LIVE PROTOCOL", title: "DISCOVER TOOLS", body: "Service → Tool → Schema → Call", metric: "RUNTIME TRUTH" },
    { id: "kit", start: 28, end: 36, eyebrow: "INTEGRATION KIT", title: "CONFIGURE → ACTIVATE", body: "Instructions + Knowledge + OpenAPI", metric: "FREE KIT" },
    { id: "cta", start: 36, end: 42, eyebrow: "GPTS MCP GATEWAY", title: "SECURE CONTROL PLANE", body: "Custom GPT × MCP", metric: "START FREE" },
  ],
  lyrics: [
    makeCue("secure-1", 0.2, 6.7, ["Are you putting provider keys and the whole tool catalog inside GPT context? Stop for a second."]),
    makeCue("secure-2", 7.2, 15.6, ["Gateway keeps credentials on the server and Open ID authorizes each MCP execution."]),
    makeCue("secure-3", 16.2, 27.6, ["GPT discovers services, tools and schemas at runtime, then calls providers through one stable protocol."]),
    makeCue("secure-4", 28.2, 35.7, ["The Integration Kit gives you Instructions, Knowledge, OpenAPI and a setup guide for Custom GPT."]),
    makeCue("secure-5", 36.2, 41.8, ["GPTs MCP Gateway. A secure control plane for connecting Custom GPT to MCP."]),
  ],
};

const CONTENT: Record<GptsMcpPromoVariant, Record<PresetVideoLanguage, GptsMcpPromoLocalizedContent>> = {
  "token-fallback": { vi: TOKEN_FALLBACK_VI, en: TOKEN_FALLBACK_EN },
  "mobile-workflow": { vi: MOBILE_VI, en: MOBILE_EN },
  "secure-gateway": { vi: SECURE_VI, en: SECURE_EN },
};

export function getGptsMcpPromoContent(variant: GptsMcpPromoVariant, language: PresetVideoLanguage) { return CONTENT[variant][language] ?? CONTENT[variant].en; }
export const TOKEN_FALLBACK_BEATS = TOKEN_FALLBACK_VI.beats;
export const TOKEN_FALLBACK_LYRICS = TOKEN_FALLBACK_VI.lyrics;
export const MOBILE_BEATS = MOBILE_VI.beats;
export const MOBILE_LYRICS = MOBILE_VI.lyrics;
export const SECURE_BEATS = SECURE_VI.beats;
export const SECURE_LYRICS = SECURE_VI.lyrics;
export function buildPreviewSections(beats: readonly GptsMcpPromoBeat[]): readonly PresetVideoPreviewSection[] { return beats.map((beat, index) => ({ id: beat.id, label: String(index + 1).padStart(2, "0"), title: beat.title, startSeconds: beat.start, endSeconds: beat.end })); }
