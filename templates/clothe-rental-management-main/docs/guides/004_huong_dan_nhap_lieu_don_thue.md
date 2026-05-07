# Hướng Dẫn Nhập Liệu Đơn Thuê

## 1) Mục tiêu
- Hướng dẫn tạo đơn thuê theo luồng wizard tại `/{locale}/orders/new`.
- Tài liệu này áp dụng cho cả tạo mới và chỉnh sửa đơn ở trạng thái cho phép.

## 2) Điều kiện trước khi tạo đơn
- Có quyền truy cập module `Đơn thuê`.
- Có chi nhánh hoạt động.
- Có sẵn:
  - khách hàng (hoặc tạo nhanh inline trong wizard)
  - item trạng thái `READY` để chọn thuê

## 3) Quy trình 5 bước tạo đơn

### Bước 1 - Khách hàng
- Tìm khách theo tên/số điện thoại.
- Chọn khách phù hợp.
- Nếu chưa có khách, bấm `Tạo khách hàng mới` và nhập thông tin tối thiểu.
- Lưu ý: nếu khách có cảnh báo blacklist, hệ thống cảnh báo mềm (vẫn cho tiếp tục).

### Bước 2 - Thời gian thuê
- Nhập `Ngày bắt đầu` và `Ngày kết thúc`.
- Có thể nhập thêm `Giờ nhận đồ` và `Giờ trả đồ` (tùy chọn).
- Khoảng ngày phải hợp lệ trước khi qua bước tiếp theo.

### Bước 3 - Chọn item
- Tìm và lọc item theo danh mục/size.
- Chỉ chọn item đang `READY`.
- Kiểm tra trạng thái khả dụng theo khoảng ngày đã chọn.
- Thêm item vào danh sách `Items đã chọn`.

### Bước 4 - Giá và thanh toán
- Chọn gói thuê (`1d`, `3d`, `7d`, `custom`).
- Điều chỉnh giảm giá/phụ phí nếu cần.
- Nhập payment thủ công (cọc/tiền thuê/phụ phí) nếu có.
- Manager+ mới có quyền override giá/cọc theo rule hệ thống.

### Bước 5 - Xác nhận
- Rà soát khách hàng, khoảng thuê, danh sách item, tổng tiền.
- Chọn trạng thái lưu phù hợp:
  - `Lưu nháp (DRAFT)`
  - `Giữ chỗ (RESERVED)`
  - `Xác nhận (CONFIRMED)`

## 4) Chỉnh sửa đơn
- Mở `/{locale}/orders/{orderId}/edit`.
- Wizard chỉ cho chỉnh các đơn ở trạng thái `DRAFT` hoặc `RESERVED`.

## 5) Lỗi thường gặp
- `Khoảng ngày thuê chưa hợp lệ`: kiểm tra start/end date.
- `Reserve/Confirm yêu cầu ít nhất 1 item`: chưa chọn item.
- `item đang conflict availability`: item trùng lịch thuê.
- `Giảm giá không được vượt quá tiền thuê`: điều chỉnh lại discount.
- `Mỗi payment phải có số tiền > 0`: payment nhập sai.

## 6) Checklist sau khi tạo đơn
- Đơn xuất hiện trong danh sách `/{locale}/orders`.
- Tổng tiền/cọc/phải thu khớp với dữ liệu đã nhập.
- Item đã gắn đúng vào đơn.
- Có thể mở chi tiết đơn để tiếp tục pickup/return theo vận hành.
