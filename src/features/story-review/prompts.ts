import type { StoryReviewDraft, StoryReviewScene } from "./types";

export function buildReviewScriptPrompt(draft: StoryReviewDraft) {
  return [
    "Bạn là biên kịch video review truyện tiếng Việt cho YouTube/TikTok.",
    "",
    `Tên truyện: ${draft.storyTitle || "Chưa nhập"}`,
    `Nguồn: ${draft.sourceName || "Chưa nhập"}${draft.sourceUrl ? ` - ${draft.sourceUrl}` : ""}`,
    `Thể loại: ${draft.genre || "Chưa rõ"}`,
    `Khán giả mục tiêu: ${draft.targetAudience || "người thích nghe review truyện"}`,
    `Góc review: ${draft.angle || "tóm tắt hấp dẫn, có nhận xét điểm mạnh/yếu"}`,
    "",
    "Yêu cầu:",
    "- Viết lời thoại review có hook mạnh 5 giây đầu.",
    "- Không đọc nguyên văn truyện; hãy tóm tắt, nhận xét, giữ nhịp kể lôi cuốn.",
    "- Chia thành intro, bối cảnh, cao trào, điểm đáng xem, kết luận/kêu gọi theo dõi.",
    "- Văn phong tự nhiên, tiếng Việt chuẩn, không lỗi dấu.",
    "- Nếu thiếu dữ kiện, hãy ghi rõ phần nào cần kiểm chứng thay vì bịa chi tiết.",
    "",
    "Thông tin nguồn/tóm tắt truyện:",
    draft.sourceNotes || "(Dán tóm tắt, chương, tuyến nhân vật hoặc ghi chú nguồn tại đây.)",
  ].join("\n");
}

export function buildVeoScenePrompts(script: string, title: string) {
  const chunks = splitScript(script);
  return chunks.map((chunk, index) => {
    const sceneNo = index + 1;
    return {
      id: crypto.randomUUID(),
      title: `Cảnh ${sceneNo}`,
      durationSeconds: 6,
      file: null,
      prompt: [
        `Create a cinematic Vietnamese story-review scene for "${title || "truyện"}".`,
        `Scene ${sceneNo}: ${chunk}`,
        "Style: high quality fantasy drama, expressive lighting, rich environment, no subtitles, no text overlay, 16:9 safe composition.",
        "Camera: slow cinematic movement, clear subject, visually readable action.",
      ].join("\n"),
    };
  });
}

function splitScript(script: string) {
  const paragraphs = script
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);
  const source = paragraphs.length >= 3 ? paragraphs : script.split(/[.!?]\s+/).map((item) => item.trim()).filter(Boolean);
  const chunks = source.slice(0, 10).map((item) => item.length > 360 ? `${item.slice(0, 357)}...` : item);
  return chunks.length ? chunks : ["Mở đầu bằng hình ảnh nhân vật chính và thế giới truyện."];
}

export function serializeScenes(scenes: StoryReviewScene[]) {
  return scenes.map(({ file: _file, ...scene }) => scene);
}
