# Setup Gemini Veo cho màn hình Tạo Shorts

Page **Tạo Shorts** dùng **Google Gemini API + Veo 3.1 Fast** để tạo video Shorts 9:16 từ prompt thuật toán sort. Backend local của Kata Studio gửi prompt lên Gemini, đợi job hoàn tất, tải MP4 về `server/generated-videos/YYYY-MM-DD`, rồi trả video về giao diện để xem trước/chỉnh sửa.

Veo 3.1 Fast phù hợp với workflow này vì hỗ trợ text-to-video, video dọc `9:16`, output MP4 có âm thanh và có API chính thức qua Gemini.

## 1. Tạo Gemini API key

1. Vào Google AI Studio.
2. Mở **Get API key**.
3. Tạo API key mới cho project bạn muốn dùng.
4. Copy key và chỉ dùng cho Kata Studio.

Không commit API key vào Git. Nếu key bị lộ, hãy revoke key trong Google AI Studio rồi tạo key mới.

## 2. Biến cấu hình

Thêm vào `.env` hoặc nhập trong màn **Cài đặt → Gemini Veo**:

```env
AI_SHORTS_API_URL="https://generativelanguage.googleapis.com/v1beta"
AI_SHORTS_API_KEY="your-gemini-api-key"
AI_SHORTS_MODEL="veo-3.1-fast-generate-preview"
AI_SHORTS_PROVIDER="gemini-veo"
```

Ý nghĩa:

- `AI_SHORTS_API_URL`: Gemini API base URL. Nên giữ mặc định.
- `AI_SHORTS_API_KEY`: Gemini API key. Bắt buộc.
- `AI_SHORTS_MODEL`: model Veo dùng để tạo video. Nên giữ `veo-3.1-fast-generate-preview`.
- `AI_SHORTS_PROVIDER`: provider cố định `gemini-veo`, dùng để hiển thị/log.

## 3. Workflow

1. Vào **Tạo Shorts**.
2. Chọn thuật toán sort: Bubble, Selection, Insertion, Quick, Merge, Heap, Counting, Radix, Shell hoặc Custom.
3. Chọn số phần tử, thời lượng Veo `4`, `6` hoặc `8` giây, style và palette.
4. Bấm **Tạo short**.
5. Backend gọi Gemini Veo, poll operation cho đến khi xong, tải file MP4 về máy.
6. Xem trước MP4.
7. Dùng **Chỉnh sửa** nếu cần crop 9:16/16:9, cover/contain hoặc cắt đầu video.
8. Sang màn YouTube để upload video.

## 4. Lưu ý

- Gemini Veo hiện chỉ hỗ trợ một số duration cố định; app sẽ tự đưa duration về giá trị gần nhất trong `4`, `6`, `8` giây.
- Generated video trên server Gemini chỉ được lưu tạm trong một khoảng thời gian, vì vậy backend tải MP4 về máy ngay sau khi job xong.
- Video AI có thể bị chặn bởi safety filter nếu prompt vi phạm chính sách. Hãy dùng prompt giáo dục, tránh nhân vật/logo có bản quyền.
- Chỉnh sửa video dùng FFmpeg local, nên máy cần cài FFmpeg hoặc cấu hình `FFMPEG_EXE` đúng.
