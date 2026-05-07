# Hướng Dẫn Nhập Liệu Đơn Mua Bán Tại Quầy

## 1) Phạm vi
- Tài liệu này hướng dẫn luồng giao dịch tại khu vực Sales:
  - `/{locale}/sales/pos` (tạo đơn nhanh)
  - `/{locale}/sales/invoices` (ghi nhận thanh toán, in hóa đơn)
  - `/{locale}/sales/returns` (xử lý trả hàng/sự cố)
- Lưu ý: phiên bản hiện tại vận hành chủ yếu theo luồng đơn thuê tại quầy + hóa đơn thanh toán. Chưa có module mua hàng nhà cung cấp riêng.

## 2) Điều kiện trước khi thao tác
- Đăng nhập role được phép dùng Sales.
- Chọn đúng chi nhánh trên thanh header Sales.
- Nên mở ca trước khi thao tác (`Mở ca`).

## 3) Bước A - Tạo đơn tại quầy (POS)
- Vào `/{locale}/sales/pos`.
- Tìm sản phẩm ở panel trái.
- Bấm vào sản phẩm để thêm item sẵn (`READY`) vào giỏ.
- Chọn khách hàng:
  - tìm theo tên/số điện thoại
  - chọn khách phù hợp
- Chỉnh số ngày thuê.
- Nhập tiền cọc hoặc bấm `Gợi ý cọc`.
- Bấm `Tạo đơn thuê`.

## 4) Bước B - Ghi nhận thanh toán và in hóa đơn
- Vào `/{locale}/sales/invoices`.
- Tìm và chọn đơn vừa tạo.
- Trong phần thanh toán:
  - chọn loại (`RENT` / `DEPOSIT` / `FEE` / `REFUND`)
  - chọn phương thức (`CASH` / `BANK` / `MOMO`)
  - nhập số tiền và ghi chú
- Bấm `Ghi nhận thanh toán`.
- Bấm `In` hoặc `PDF` để xuất hóa đơn.

## 5) Bước C - Xử lý trả hàng/sự cố
- Vào `/{locale}/sales/returns`.
- Chọn đơn cần trả.
- Với từng item, chọn tình trạng:
  - `OK`, `NEED_CLEAN`, `DAMAGE`, `LOST`
- Nếu có sự cố, nhập thêm:
  - phí sự cố
  - ghi chú tình trạng
- Bấm `Xác nhận trả hàng`.

## 6) Bước D - Kiểm tra tồn kho sau giao dịch
- Vào `/{locale}/sales/stock`.
- Kiểm tra item đã chuyển trạng thái đúng sau các thao tác tạo đơn/trả hàng.

## 7) Lỗi thường gặp
- Không tạo được đơn tại POS:
  - chưa chọn khách hàng
  - giỏ chưa có item
  - chi nhánh chưa được chọn
- Không ghi nhận được payment:
  - số tiền <= 0
  - đơn chưa được chọn ở màn hóa đơn
- Không xử lý được trả hàng:
  - đơn không còn ở trạng thái hợp lệ để return
  - dữ liệu sự cố nhập sai định dạng

## 8) Checklist cuối ca
- Tất cả đơn đã tạo có mã đơn và trạng thái rõ ràng.
- Payment đã ghi nhận đầy đủ ở màn hóa đơn.
- Các đơn trả hàng đã cập nhật tình trạng item.
- Đóng ca (`Kết ca`) sau khi hoàn tất nghiệp vụ.
