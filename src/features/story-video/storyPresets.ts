import type { StoryTopicPreset } from "./types";

export const STORY_TOPIC_PRESETS: StoryTopicPreset[] = [
  {
    id: "tien-hiep",
    title: "Tiên hiệp / tu luyện",
    description: "Đọc truyện dài tập, nhịp chậm, hợp nền huyền huyễn 16:9.",
    filePrefix: "tien-hiep-tap-1",
    defaultTitle: "Trường sinh từ luyện đan tông sư bắt đầu",
    defaultSelector: ".chapter-content, article, main, body",
    prompt: "Giữ giọng kể chậm, rõ, có khoảng nghỉ sau mỗi câu. Hạn chế nhạc nền quá lớn.",
  },
  {
    id: "trong-sinh",
    title: "Trọng sinh / cổ trang",
    description: "Nội dung cảm xúc, cung đấu, nữ cường, hợp voice kể chuyện kịch tính.",
    filePrefix: "trong-sinh-tap-1",
    defaultTitle: "Trọng sinh nữ cường báo thù",
    defaultSelector: ".chapter-content, .content, article, main",
    prompt: "Ưu tiên nhịp đọc có cảm xúc, câu thoại rõ nhân vật, phần cao trào chậm lại một chút.",
  },
  {
    id: "audio-book",
    title: "Audio book nhiều tập",
    description: "Luồng tạo audio dài rồi ghép nền tĩnh/video để đăng YouTube.",
    filePrefix: "audio-book-tap-1",
    defaultTitle: "Audio book tập 1",
    defaultSelector: "article, main, body",
    prompt: "Chuẩn hoá text trước khi đọc, chia tập theo đoạn ngắn để dễ retry khi lỗi.",
  },
  {
    id: "review-truyen",
    title: "Review / tóm tắt truyện",
    description: "Dùng cho video kể tóm tắt, recap truyện hoặc giới thiệu series.",
    filePrefix: "review-truyen",
    defaultTitle: "Review truyện hay đáng nghe",
    defaultSelector: "article, main, body",
    prompt: "Có thể tự biên tập lại text thành kịch bản review trước khi tạo voice.",
  },
];

export function getStoryTopicPreset(id: string) {
  return STORY_TOPIC_PRESETS.find((preset) => preset.id === id) || STORY_TOPIC_PRESETS[0];
}
