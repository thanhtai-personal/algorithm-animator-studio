# MU News Studio

Màn hình `/mu-news` là workflow 5 bước để tạo bản tin Manchester United bán tự động:

1. **Nguồn tin tức**: cấu hình RSS/Google News RSS theo mẫu `Tên nguồn | URL | điểm tin cậy`.
2. **Preview tin tức**: tải tin, xem nguồn/độ tin cậy, chọn tin đưa vào video.
3. **Kịch bản**: AI viết kịch bản theo ngôn ngữ hệ thống, có thể sửa trước khi đọc.
4. **Voice**: tách kịch bản thành nhiều đoạn và tạo nhiều file voice Piper riêng lẻ.
5. **Video**: chọn nhiều ảnh nền, đặt thời lượng từng ảnh, chọn các file voice, upload thêm voice nếu cần, chọn nhạc nền từ thư viện và render video timeline.

## API chính

- `GET /api/mu-news/sources`
- `POST /api/mu-news/fetch`
- `POST /api/mu-news/script`
- `POST /api/mu-news/render-video`

## AI script

Nếu server có `OPENAI_API_KEY`, tool gọi OpenAI để viết kịch bản. Nếu chưa có API key, service dùng fallback local để vẫn tạo được bản nháp.

```env
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

## Video timeline

Endpoint render mới nhận:

- `backgrounds[]`: nhiều ảnh nền.
- `backgroundDurations`: JSON array số giây cho từng ảnh.
- `audioRelativePaths`: JSON array các voice đã tạo trong thư mục generated.
- `audio[]`: file voice upload thêm.
- `backgroundMusicRelativePath`: nhạc nền trong `server/data/background-music`.

Timeline nhiều nền hiện ưu tiên ảnh tĩnh để tránh lỗi bản quyền/hiệu năng. Video/GIF nền đơn vẫn có thể tiếp tục dùng endpoint video cũ của source nếu cần mở rộng sau.
