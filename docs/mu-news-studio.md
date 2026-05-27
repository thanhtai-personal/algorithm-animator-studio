# Kênh tin tức MU Studio

Màn hình mới nằm tại route `/mu-news`, dùng để tạo bản tin Manchester United bán tự động.

## Workflow

1. Vào dropdown studio trên header và chọn **Kênh tin tức MU**.
2. Kiểm tra danh sách nguồn RSS theo format:

   ```txt
   Tên nguồn | RSS URL | điểm tin cậy 1-10
   ```

3. Bấm **Load tin hôm nay** để lấy tin.
4. Tick những tin muốn đưa vào video.
5. Bấm **Tạo kịch bản**.
6. Duyệt/sửa kịch bản.
7. Bấm **Tạo voice Piper**.
8. Chọn ảnh/GIF/video nền rồi bấm **Render video nháp**.

## AI scripting

Backend mới có endpoint:

- `GET /api/mu-news/sources`
- `POST /api/mu-news/fetch`
- `POST /api/mu-news/script`

Nếu server có `OPENAI_API_KEY`, endpoint `/api/mu-news/script` sẽ gọi AI để viết kịch bản. Nếu chưa có key hoặc AI lỗi, tool tự tạo bản nháp local để bạn vẫn có thể duyệt và tạo voice.

Thêm vào `.env`:

```env
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Lưu ý nội dung

Không nên dịch nguyên văn bài báo. Kịch bản nên giữ nguồn, chấm độ tin cậy và thêm góc nhìn fan Việt để tránh thành nội dung đọc báo hàng loạt.
