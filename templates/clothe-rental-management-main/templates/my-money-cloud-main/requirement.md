# Yêu cầu ứng dụng My Money Cloud

## 1) Mục tiêu
- Quản lý thu/chi cá nhân theo ngày/tháng/năm.
- Hỗ trợ chạy ổn định khi không có mạng (offline-first).
- Hỗ trợ đa nền tảng: Web (Next.js), Mobile (Expo React Native), và PWA.

## 2) Phạm vi nền tảng
- Web: Next.js App Router (UI chính).
- Mobile: Expo React Native (Android/iOS).
- PWA: cài đặt từ trình duyệt, có app shell offline.

## 3) Chức năng người dùng & xác thực
- Đăng ký/đăng nhập bằng Email/Password (Supabase Auth).
- Xác nhận email và đặt lại mật khẩu (reset password).
- Đăng xuất.
- Chế độ khách (anonymous/guest) để dùng ngay không cần tài khoản.
- Khi chuyển từ guest sang đăng nhập:
  - Giữ dữ liệu local hiện tại và thực hiện đồng bộ lên cloud.
  - Không xóa dữ liệu local thủ công; ưu tiên đồng bộ hai chiều.
- Xóa tài khoản (có xác nhận).

## 4) Giao dịch (Transactions)
- Thêm, sửa, xóa giao dịch.
- Thuộc tính giao dịch:
  - Loại: thu (income) hoặc chi (expense).
  - Số tiền.
  - Danh mục (category).
  - Mô tả.
  - Thời gian giao dịch (ngày + giờ + phút + giây, theo local time).
- Danh sách giao dịch:
  - Hiển thị dạng thẻ.
  - Phân trang.
  - Nhấn vào thẻ để mở modal sửa giao dịch.
  - Giữ phân trang sau khi sửa.
- Lọc giao dịch:
  - Lọc theo khoảng ngày (date-range).
  - Giới hạn tối đa 3 tháng.
  - Có nút clear để bỏ lọc (trả về tất cả dữ liệu).
  - Lọc theo danh mục bằng dropdown có tìm kiếm.
- Nhập nhanh:
  - Voice input để nhận diện số tiền và mô tả (Web, dùng SpeechRecognition).
  - OCR quét hóa đơn để gợi ý số tiền/mô tả (Web, dùng tesseract.js).

## 5) Danh mục (Categories)
- Tạo/sửa/xóa danh mục.
- Mỗi danh mục có:
  - Tên, loại (thu/chi), icon, màu.
- Dropdown chọn danh mục có tìm kiếm.

## 6) Dashboard (Trang tổng quan)
- Tổng số dư, tổng thu, tổng chi.
- Thống kê nhanh (số lượng giao dịch, tổng thu/chi).
- Biểu đồ chi tiêu theo danh mục.
- Chọn tháng để xem dữ liệu theo tháng.
- Nút thêm giao dịch nhanh.

## 7) Thống kê (Stats)
- Thống kê cơ bản:
  - Biểu đồ tròn thu/chi.
  - Biểu đồ danh mục.
- Thống kê nâng cao (Pro mode):
  - Tiêu đề hiển thị là "Thống kê".
  - Bộ lọc theo date-range với nút Search và Clear.
  - Giới hạn tối đa 3 tháng.
  - Biểu đồ theo thời gian: ngày/tháng/năm.
  - Biểu đồ danh mục.
  - Cho phép scroll ngang nếu nhiều cột; tự ước lượng chiều rộng cột theo nhãn.

## 8) Wallet (Phân tích tài chính)
- Tóm tắt thu/chi và số dư.
- Thu/chi trung bình theo ngày.
- Tỷ lệ tiết kiệm.
- Danh mục top và hoạt động gần đây.

## 9) Hồ sơ & thiết lập
- Thông tin người dùng (email, ngày tạo, phương thức đăng nhập).
- Thống kê tháng hiện tại trong hồ sơ.
- Đổi mật khẩu.
- Đổi theme (light/dark).
- Đổi ngôn ngữ (đa ngôn ngữ).
- Pro mode:
  - Bật/tắt và lưu trạng thái (persist sau khi refresh).
- Khóa ứng dụng (PIN 6 số):
  - Lưu cấu hình local và đồng bộ cấu hình lên cloud.

## 10) IAP (Gỡ quảng cáo)
- Gói tháng: `no_ads_monthly` (1$ / tháng).
- Gói vĩnh viễn: `no_ads_lifetime` (10$).
- Khi mua thành công:
  - Ẩn quảng cáo banner và app open.
  - Lưu trạng thái gỡ quảng cáo local, khôi phục khi restore purchase.
- Hỗ trợ khôi phục giao dịch (restore purchases).
- Chỉ test trên build thật (không hỗ trợ Expo Go).

## 11) Offline-first & đồng bộ
- Lưu dữ liệu local trên thiết bị:
  - User info.
  - Danh mục.
  - Giao dịch.
- Khi gọi API:
  - Hiển thị dữ liệu local thay vì loading state.
  - Khi API trả về, cập nhật lại cache local.
- Khi offline:
  - Ứng dụng vẫn hiển thị dữ liệu local.
- Áp dụng tương tự cho PWA.
- Tối ưu lưu trữ:
  - Hỗ trợ nén dữ liệu local để giảm dung lượng bộ nhớ.

### Luồng thêm giao dịch (tóm tắt)
```mermaid
flowchart TD
  A[User thêm giao dịch] --> B{Local mode? (guest/chưa cấu hình)}
  B -->|Có| C[Lưu localTransactionService]
  B -->|Không| D{Có mạng?}
  D -->|Có| E[Gọi API tạo giao dịch]
  D -->|Không| F[Tạo giao dịch tạm + merge cache local + enqueue sync]
  C --> G[Cập nhật cache UI]
  E --> G
  F --> G
  G --> H{Online?}
  H -->|Có| I[Invalidate query + đồng bộ cache]
  H -->|Không| J[Chờ sync khi user bấm đồng bộ hoặc mở app lại]
```

Ghi chú:
- Web check mạng bằng `isBrowserOnline()`, mobile check bằng `expo-network`.
- Sync queue chạy khi có mạng và user bấm đồng bộ hoặc mở app lại.

## 12) PWA & cài đặt
- Có manifest và service worker để chạy offline app shell.
- Hiển thị hướng dẫn cài đặt PWA nếu không có link store.
- Hỗ trợ nút cài đặt khi trình duyệt cho phép.

## 13) Bắt buộc cập nhật (Version Gate)
- Server Next.js cung cấp API kiểm tra version:
  - `latest_version`, `min_version`, `store_url`, `message`.
- Logic bắt update:
  - Nếu `current_version < min_version` thì bắt cập nhật.
- URL store theo platform (Android/iOS) nếu có.

## 14) Dữ liệu & hạ tầng (Supabase)
- Bảng `transactions` và `categories` với RLS:
  - Người dùng chỉ truy cập dữ liệu của mình.
- API Next.js:
  - CRUD cho transactions và categories.
  - API version check `/app/version`.

## 15) Phi chức năng & UI/UX
- Responsive trên desktop và mobile.
- Định dạng tiền tệ theo locale (`VND` mặc định).
- Định dạng thời gian theo locale.
- Thông báo lỗi/validate rõ ràng (form, OCR, voice, network).
