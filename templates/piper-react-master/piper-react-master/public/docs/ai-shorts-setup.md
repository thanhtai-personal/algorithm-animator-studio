# Setup AI Shorts cho Kata Studio

Page **Tạo Shorts** dùng backend local của Kata Studio để gọi một AI video API bên ngoài. Backend nhận prompt từ UI, gọi AI, tải file MP4 về `server/generated-videos/YYYY-MM-DD`, rồi trả video về giao diện để xem trước/chỉnh sửa.

## 1. Biến cấu hình

Thêm vào `.env` hoặc nhập trong màn **Settings**:

```env
AI_SHORTS_API_URL="https://your-ai-api.example.com/generate-video"
AI_SHORTS_API_KEY=""
AI_SHORTS_MODEL="default"
AI_SHORTS_PROVIDER="custom"
```

Ý nghĩa:

- `AI_SHORTS_API_URL`: endpoint tạo video bằng AI. Bắt buộc.
- `AI_SHORTS_API_KEY`: key nếu service yêu cầu. Có thể để trống với API nội bộ.
- `AI_SHORTS_MODEL`: tên model gửi kèm request.
- `AI_SHORTS_PROVIDER`: tên provider gửi kèm request để backend/log dễ phân biệt.

## 2. Contract API AI cần hỗ trợ

Kata Studio gửi request dạng JSON:

```json
{
  "model": "default",
  "provider": "custom",
  "prompt": "Create a vertical 9:16 YouTube Shorts video visualizing Bubble Sort...",
  "aspectRatio": "9:16",
  "durationSeconds": 18,
  "metadata": {
    "algorithm": "bubble",
    "itemCount": 20,
    "videoFileName": "sort-short"
  }
}
```

Nếu có `AI_SHORTS_API_KEY`, backend gửi header:

```http
Authorization: Bearer <AI_SHORTS_API_KEY>
```

API AI nên trả về một trong các dạng sau:

```json
{ "videoUrl": "https://cdn.example.com/output.mp4" }
```

hoặc:

```json
{ "base64": "AAAA..." }
```

Backend cũng tự đọc được một số tên field khác như `url`, `outputUrl`, `downloadUrl`, `video_url` hoặc `output.videoUrl`.

## 3. Workflow đề xuất

1. Vào **Tạo Shorts**.
2. Chọn thuật toán sort: Bubble, Selection, Insertion, Quick, Merge, Heap, Counting, Radix, Shell hoặc Custom.
3. Chọn số phần tử, thời lượng, style và palette.
4. Bấm **Tạo AI Short**.
5. Xem trước MP4.
6. Dùng **Chỉnh nhanh** nếu cần crop 9:16/16:9, cover/contain hoặc cắt đầu video.
7. Sang màn YouTube để upload video.

## 4. Lưu ý sản phẩm

- Page này không thay thế page **Tạo video** đọc truyện. Nó chuyên cho video sorting/visualization dạng Shorts.
- Nếu AI API lỗi hoặc chưa cấu hình, page sẽ báo lỗi tại chỗ. Các phần khác của app vẫn hoạt động bình thường.
- Chỉnh sửa video dùng FFmpeg local, nên máy cần cài FFmpeg hoặc cấu hình `FFMPEG_EXE` đúng.
