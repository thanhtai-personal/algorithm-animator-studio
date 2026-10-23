# AI Video Agent — React Flow realtime visualizer

Patch này nâng cấp màn hình `/ai-video-agent` để người dùng nhìn rõ agent đang chạy tới đâu, job upload đã tạo hay chưa và video có đang được đẩy lên nền tảng hay không.

## Cách dùng

1. Vào `/ai-video-agent`.
2. Nhập topic, chọn preset, voice và platform.
3. Nếu muốn tạo job đăng sau khi render, bật **Tạo publish job sau khi render**.
4. Chọn ít nhất một **Publish channel**. Danh sách kênh được đọc từ workspace local của `/channel`:
   - YouTube cần kênh đã OAuth và có refresh token.
   - Facebook/TikTok/Instagram cần provider account đã kết nối.
5. Nhấn **Run full agent**.
6. Theo dõi sơ đồ React Flow ở đầu màn hình:
   - Node đang chạy có icon xoay.
   - Node hoàn tất có trạng thái done.
   - Node lỗi có trạng thái failed.
   - Click vào từng node để xem log riêng của stage đó.
7. Mở tab **Queue** trong màn hình AI Agent hoặc `/channel → Queue` để xem publish job vừa tạo, tiến trình upload, kết quả và link video sau khi đăng.

## Trạng thái cần hiểu

- `queued`: job đã được đưa vào hàng đợi local.
- `scheduled`: job đã lên lịch, app phải mở tới giờ chạy.
- `running`: worker local đang upload.
- `success`: đã upload thành công và có result URL nếu nền tảng trả về.
- `manual_required`: cần thao tác tay, thường gặp với TikTok inbox upload hoặc Instagram local-only.
- `failed`: lỗi token, quyền API, file video hoặc quota.

## Lưu ý

React Flow dùng package `@xyflow/react`. Sau khi apply patch cần chạy `npm install` để cài dependency mới.
