import type { MuNewsItem, MuNewsItemValidation } from "./types";

type PromptParams = {
  items: MuNewsItem[];
  channelName: string;
  angle: string;
  durationMinutes: number;
  voiceStyle: string;
  scriptLanguage: string;
  validationById: Record<string, MuNewsItemValidation>;
};

export function buildMuNewsScriptPrompt(params: PromptParams) {
  const items = [...params.items].sort((a, b) => b.trustScore - a.trustScore);
  const sourceLines = items.map((item, index) => [
    `Tin ${index + 1}: ${item.title}`,
    `Nguồn: ${item.sourceName}`,
    `URL: ${item.link}`,
    `Thời gian: ${item.publishedAt}`,
    `Trust: ${item.trustScore}/10`,
    `Tóm tắt: ${item.summary || "Không có mô tả ngắn."}`,
    `Nội dung đã tải: ${params.validationById[item.id]?.articleContent || "Không có nội dung."}`,
  ].join("\n"));

  return [
    "Bạn là biên tập viên kênh tin tức Manchester United cho fan Việt Nam.",
    "",
    "Nhiệm vụ: viết kịch bản voice-over hoàn chỉnh cho video bản tin MU dựa trên các tin bên dưới.",
    `Tên kênh/series: ${params.channelName || "Bản Tin Quỷ Đỏ"}`,
    `Ngôn ngữ: ${params.scriptLanguage || "Tiếng Việt"}`,
    `Độ dài mục tiêu: khoảng ${params.durationMinutes || 6} phút`,
    `Góc biên tập: ${params.angle || "Tin thật, tin đồn và góc nhìn fan MU Việt."}`,
    `Phong cách giọng đọc: ${params.voiceStyle || "Gần gũi, tỉnh táo, không giật tít sai sự thật."}`,
    "",
    "Yêu cầu bắt buộc:",
    "- Chỉ dựa trên nguồn được cung cấp, không bịa thêm số liệu, phát biểu hoặc xác nhận chính thức.",
    "- Không dịch nguyên văn bài báo; hãy tổng hợp lại bằng lời mới.",
    "- Tin chưa chính thức phải gọi là tin đồn hoặc tin đáng theo dõi.",
    "- Luôn nhắc nguồn theo cách tự nhiên trong lời dẫn.",
    "- Viết thành kịch bản đọc liền mạch, có mở đầu, từng cụm tin, chuyển đoạn và kết.",
    "- Chỉ trả về kịch bản hoàn chỉnh, không trả JSON, không giải thích quy trình.",
    "",
    "Danh sách tin đã lọc:",
    sourceLines.join("\n\n---\n\n"),
  ].join("\n");
}
