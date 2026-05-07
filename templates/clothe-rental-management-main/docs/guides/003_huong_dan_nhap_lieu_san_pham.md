# Hướng Dẫn Nhập Liệu Sản Phẩm

## 1) Mục tiêu
- Hướng dẫn nhập liệu sản phẩm theo luồng hiện có trên hệ thống web admin.
- Bao gồm:
  - tạo sản phẩm mới ở trang `/{locale}/products`
  - bổ sung item trong chi tiết sản phẩm
  - nhập nhanh sản phẩm ở màn hình sales `/{locale}/sales/product-entry`

## 2) Điều kiện trước khi nhập liệu
- Tài khoản đã đăng nhập và có quyền truy cập module sản phẩm.
- Đã chọn đúng chi nhánh làm việc.
- Chuẩn bị trước dữ liệu cơ bản:
  - mã sản phẩm, tên sản phẩm
  - danh mục, giá thuê/giá bán
  - danh sách mã item (nếu tạo item ngay)

## 3) Luồng A - Tạo sản phẩm mới (Admin)
- Vào `/{locale}/products`.
- Bấm `Tạo sản phẩm`.
- Nhập nhóm thông tin cốt lõi:
  - `Mã sản phẩm`
  - `Tên sản phẩm`
  - `Danh mục`, `Giới tính`, `Chất liệu`, `Mô tả`
- Nhập nhóm giá và vận hành:
  - `Giá thuê/ngày`, `Giá bán`
  - `Giá nhập` (chỉ hiện nếu role có quyền chỉnh pricing)
  - bật/tắt `Cho thuê`, `Cho bán`, `Đang hoạt động`
- Nhập nhóm media:
  - `Ảnh đại diện`, `Ảnh bổ sung`, `Video` (mỗi dòng một URL/path)
- Nhập nhóm item khởi tạo (nếu có):
  - `Danh sách mã item` (mỗi dòng một mã)
  - `Trạng thái ban đầu`
  - `Size item`
- Bấm `Lưu sản phẩm`.

## 4) Luồng B - Thêm item trong chi tiết sản phẩm
- Vào `/{locale}/products/{productId}`.
- Mở tab `Items`.
- Nhập:
  - danh sách mã item (mỗi dòng 1 mã)
  - trạng thái ban đầu
  - size item
- Bấm `Thêm item`.
- Kiểm tra bảng item bên dưới để xác nhận item mới đã tạo đúng `Mã item / Size / Trạng thái`.

## 5) Luồng C - Nhập nhanh sản phẩm tại quầy (Sales)
- Vào `/{locale}/sales/product-entry`.
- Nhập thông tin sản phẩm + pricing cơ bản.
- Nhập lô item ban đầu:
  - danh sách mã item
  - trạng thái ban đầu
  - size item
- Bấm `Lưu sản phẩm`.

## 6) Các lỗi thường gặp
- `DUPLICATE_PRODUCT_CODE`: trùng mã sản phẩm.
- `DUPLICATE_ITEM_CODE`: trùng mã item trong chi nhánh.
- `Duplicate item codes found in the batch list`: trùng mã trong danh sách nhập cùng lúc.
- `... không hợp lệ hoặc nhỏ hơn 0`: trường giá tiền nhập sai định dạng/âm.
- `FORBIDDEN_MANAGER_ONLY_ITEM_STATUS`: role không đủ quyền để tạo item trạng thái nhạy cảm (ví dụ `SOLD`).

## 7) Checklist sau khi nhập liệu
- Sản phẩm hiển thị trong danh sách sản phẩm.
- Giá thuê/giá bán hiển thị đúng.
- Số lượng item và trạng thái READY tăng đúng theo dữ liệu vừa nhập.
- Ảnh đại diện/video hiển thị được nếu đã gắn URL/path hợp lệ.
