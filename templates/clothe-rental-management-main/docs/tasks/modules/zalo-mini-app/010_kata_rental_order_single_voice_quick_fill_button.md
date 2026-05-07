# Task 090 - Kata Rental Order: Single Voice Quick Fill button ở footer, parse theo `tên field + nội dung`

## Input ban đầu
- Form `kata-rental-order` hiện có nhiều nút mic ở từng input.
- Cần đổi sang 1 luồng nhập giọng nói nhanh tập trung:
  - chỉ còn 1 nút mic ở footer (nằm giữa `Quay lại` và `Tạo đơn`),
  - người dùng đọc theo mẫu `tên field + nội dung`,
  - app tự phân tích transcript và điền vào field tương ứng,
  - user có thể bấm mic nhiều lần để hoàn thiện form,
  - bỏ toàn bộ mic button ở các input khác.

## Mục tiêu
- Thiết kế lại UX voice cho `kata-rental-order` từ per-field mic sang single mic orchestration.
- Giữ kiến trúc `Component -> Hook -> Query -> Service -> API`.
- Đảm bảo không auto-submit, không bypass xác nhận nghiệp vụ.

## Phạm vi
- App: `apps/zalo-mini-apps/kata-rental-order/**`
- Không thay đổi contract backend tạo đơn.
- Không thay đổi flow revenue app.

## Yêu cầu chi tiết
1. Footer step 2 có 3 nút trên 1 hàng:
   - `Quay lại`
   - `Mic` (nút giữa)
   - `Tạo đơn`
2. Mic button mở phiên voice nhanh:
   - bắt đầu/dừng ghi âm rõ ràng,
   - hiển thị trạng thái đang nghe/lỗi.
3. Parse transcript theo pattern:
   - Ví dụ: `khách hàng Nguyễn Văn A`, `tiền cọc 1200000`, `ghi chú trả trước`.
   - Map field whitelist: `customerSearch`, `startDate`, `endDate`, `pickupTime`, `returnTime`, `depositAmount`, `collectedAmount`, `note`, `receiptMethod`.
4. Structured fields (`date/time/amount/payment method`) phải qua bước review trước khi commit.
5. Cho phép nhập nhiều lượt:
   - mỗi lần bấm mic cập nhật từng phần,
   - không reset form ngoài ý muốn.
6. Bỏ `FieldVoiceButton` khỏi mọi input trong form.
7. An toàn async:
   - đóng/reset form phải abort session voice,
   - chặn stale transcript update UI đã đóng/chuyển step.

## Done criteria
- Không còn mic button ở input-level trên `kata-rental-order`.
- Có 1 mic button ở giữa 2 nút footer step 2.
- Parse được tối thiểu 8 field chính bằng câu nói dạng `tên field + nội dung`.
- Amount/date/time vẫn có review trước khi áp dụng.
- User có thể bấm mic nhiều lần để fill dần form.
- `npm run lint` và `npm run typecheck` của `kata-rental-order` pass.

## Nhắc test nhanh
- Voice nhiều lượt:
  - nói 1 lần cho `ghi chú`,
  - nói lần 2 cho `tiền cọc`,
  - nói lần 3 cho `giờ nhận đồ`,
  - verify dữ liệu cộng dồn đúng field.
- Không còn icon mic ở từng input.
- Khi đang nghe mà bấm `Quay lại` hoặc đổi step: phiên voice bị dừng, không có transcript trễ.

## Cập nhật tiến độ (sau khi hoàn thành task)
- Thêm/đánh dấu checklist trong:
  - `progress/modules/zalo-mini-app/tasks.md`
- Append completion log theo format chuẩn của module.
