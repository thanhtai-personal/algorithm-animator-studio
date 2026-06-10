# Video Create — ProShow-style editor

## Mục tiêu

Màn `/video-create` là màn tạo video chung, không còn là nơi chọn template Remotion theo từng loại nội dung.

Workflow chung:

1. Upload ảnh, âm thanh, video.
2. Tự thêm vào timeline.
3. Chỉnh duration từng ảnh/video.
4. Chọn fit mode: `cover` hoặc `contain`.
5. Chọn transition đơn giản: `none`, `fade`, `zoom`.
6. Preview timeline trong browser.
7. Export MP4 bằng backend FFmpeg và lưu vào `generated-videos`.

## Route đúng theo menu

- Short thuật toán: `/algorithms/short`
- Tìm đường mê cung: `/algorithms/maze`
- Video thuật toán dài: `/algorithms/video-long`
- Video truyện: `/stories/video`
- Sáng tác truyện: `/stories/create`
- Review truyện: `/stories/review`
- Tin tức MU: `/football/mu-news`

Các route cũ vẫn redirect về route mới để tránh vỡ bookmark/link cũ.

## Remotion đặt đúng màn hình nội dung

Remotion không còn đặt ở màn tạo video chung. Các template Remotion được gắn đúng nơi:

- `/algorithms/video-long`: `algorithm-explainer`
- `/stories/video`: `story-card`
- `/football/mu-news`: `news-card`

Mục đích: mỗi workflow chuyên biệt có template riêng; còn `/video-create` chỉ làm editor ghép media chung kiểu ProShow Gold cơ bản.

## API mới

```txt
POST /api/video/render-timeline
```

Request dùng `multipart/form-data`:

- `project`: JSON timeline.
- `asset:<assetId>`: file media tương ứng.

Output là MP4 trong thư viện `generated-videos`.

## Giới hạn MVP

- Audio export hiện dùng audio đầu tiên trong timeline làm nhạc/voice nền.
- Video clip upload vào timeline hiện mặc định mute khi export để tránh mixer quá phức tạp.
- Transition `zoom` trong MVP render gần như fade/soft transition; có thể nâng cấp bằng Ken Burns/xfade sau.
