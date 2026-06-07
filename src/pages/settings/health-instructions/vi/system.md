Kai Studio cần chạy được backend local và ghi được file generated sau khi cài app desktop.

### Cách khắc phục

1. Đóng Kai Studio rồi mở lại từ shortcut desktop để backend đi kèm khởi động sạch.
2. Nếu Windows Firewall hỏi quyền, cho phép app truy cập localhost/private network.
3. Mở Settings -> Data và chọn thư mục có quyền ghi. Tránh `Program Files` hoặc thư mục bị bảo vệ.
4. Kiểm tra thư mục generated hiện tại: `{{GENERATED_DIR}}`.
5. Lưu settings, restart app, rồi bấm Kiểm tra lại.
