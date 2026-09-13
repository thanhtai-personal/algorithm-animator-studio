import type { PresetVideoLanguage } from "../../types";

export type GatewayBeat = {
  id: "hook" | "switch" | "gateway" | "action" | "runtime" | "continue" | "cta";
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  body: string;
  tags: readonly string[];
  mediaLabel?: string;
  mediaCaption?: string;
};

export const GATEWAY_CONTROL_PLANE_DURATION = 53;
export const GATEWAY_MEDIA_ROOT = "preset-assets/gpts-mcp-control-plane";

const VI_BEATS: readonly GatewayBeat[] = [
  { id: "hook", start: 0, end: 5, eyebrow: "ĐANG CODE DỞ", title: "CODEX HẾT TOKEN?", body: "Task chưa xong. Phiên Codex đã chạm giới hạn.", tags: ["USAGE LIMIT", "CHƯA XONG VIỆC"], mediaLabel: "01 / ĐIỂM NGHẼN THẬT", mediaCaption: "Ảnh chụp phiên Codex khi hết lượt dùng" },
  { id: "switch", start: 5, end: 12, eyebrow: "CHUYỂN WORKFLOW", title: "ĐỪNG DỪNG Ở ĐÓ.", body: "Mở Custom GPT đã kết nối GPTs MCP Gateway.", tags: ["CUSTOM GPT", "MCP GATEWAY"] },
  { id: "gateway", start: 12, end: 20, eyebrow: "GIẢI PHÁP", title: "GPTS MCP GATEWAY", body: "Một lớp truy cập MCP cho Custom GPT: từ ý định trong chat tới công cụ phía server.", tags: ["GPT → GATEWAY → MCP"], mediaLabel: "02 / GATEWAY THẬT", mediaCaption: "Giao diện GPTs MCP Gateway trong bản quay màn hình" },
  { id: "action", start: 20, end: 30, eyebrow: "THIẾT LẬP GPT", title: "NẠP KIT. GẮN ACTION.", body: "Instructions, Knowledge và OpenAPI giữ GPT gọn; Action gọi Gateway khi cần.", tags: ["INTEGRATION KIT", "ACTION SCHEMA"], mediaLabel: "03 / CUSTOM GPT", mediaCaption: "Custom GPT với Gateway Knowledge và Action schema" },
  { id: "runtime", start: 30, end: 39, eyebrow: "RUNTIME TRUTH", title: "DISCOVER RỒI CALL.", body: "Gateway tìm service, tool và schema lúc chạy; Open ID kiểm tra quyền, provider key ở server.", tags: ["OPEN ID", "KEY NGOÀI GPT"], mediaLabel: "04 / MCP SERVICES", mediaCaption: "Provider và skill đang được quản lý tại Gateway" },
  { id: "continue", start: 39, end: 46, eyebrow: "CÔNG VIỆC TIẾP DIỄN", title: "GPT TIẾP TỤC XỬ LÝ.", body: "Yêu cầu vẫn đi qua GPT, Gateway và MCP tools, kể cả khi Codex tạm dừng.", tags: ["GOAL → TOOL → RESPONSE"], mediaLabel: "05 / HỘI THOẠI THẬT", mediaCaption: "Phiên GPT tiếp tục phân tích workflow qua Gateway" },
  { id: "cta", start: 46, end: 53, eyebrow: "BẮT ĐẦU TẠI ĐÂY", title: "GPTS × MCP.", body: "Tải Integration Kit miễn phí. Kết nối GPT của bạn với Gateway.", tags: ["GPTS-MCP.VERCEL.APP", "7-DAY TRIAL"] },
];

const EN_BEATS: readonly GatewayBeat[] = [
  { id: "hook", start: 0, end: 5, eyebrow: "MID-WORKFLOW", title: "CODEX OUT OF TOKENS?", body: "The task is unfinished. The Codex session hit its limit.", tags: ["USAGE LIMIT", "WORK UNFINISHED"], mediaLabel: "01 / THE REAL BLOCKER", mediaCaption: "Screenshot of the Codex usage limit" },
  { id: "switch", start: 5, end: 12, eyebrow: "SWITCH WORKFLOWS", title: "KEEP THE WORK MOVING.", body: "Open a Custom GPT connected to GPTs MCP Gateway.", tags: ["CUSTOM GPT", "MCP GATEWAY"] },
  { id: "gateway", start: 12, end: 20, eyebrow: "THE SOLUTION", title: "GPTS MCP GATEWAY", body: "One MCP access layer for Custom GPTs, from chat intent to server-side tools.", tags: ["GPT → GATEWAY → MCP"], mediaLabel: "02 / REAL GATEWAY", mediaCaption: "GPTs MCP Gateway from the supplied screen recording" },
  { id: "action", start: 20, end: 30, eyebrow: "CONFIGURE THE GPT", title: "LOAD KIT. ADD ACTION.", body: "Instructions, Knowledge and OpenAPI keep GPT context lean; the Action calls Gateway.", tags: ["INTEGRATION KIT", "ACTION SCHEMA"], mediaLabel: "03 / CUSTOM GPT", mediaCaption: "Custom GPT with Gateway Knowledge and Action schema" },
  { id: "runtime", start: 30, end: 39, eyebrow: "RUNTIME TRUTH", title: "DISCOVER. THEN CALL.", body: "Gateway discovers services, tools and schemas at runtime; Open ID checks access, keys stay server-side.", tags: ["OPEN ID", "KEYS OUTSIDE GPT"], mediaLabel: "04 / MCP SERVICES", mediaCaption: "Providers and skills managed in Gateway" },
  { id: "continue", start: 39, end: 46, eyebrow: "WORK CONTINUES", title: "GPT KEEPS WORKING.", body: "Requests can still flow through GPT, Gateway and MCP tools while Codex is paused.", tags: ["GOAL → TOOL → RESPONSE"], mediaLabel: "05 / REAL CONVERSATION", mediaCaption: "GPT conversation continues through the Gateway workflow" },
  { id: "cta", start: 46, end: 53, eyebrow: "START HERE", title: "GPTS × MCP.", body: "Download the free Integration Kit. Connect your GPT to Gateway.", tags: ["GPTS-MCP.VERCEL.APP", "7-DAY TRIAL"] },
];

export const GATEWAY_CONTROL_PLANE_BEATS: Record<PresetVideoLanguage, readonly GatewayBeat[]> = { vi: VI_BEATS, en: EN_BEATS };
