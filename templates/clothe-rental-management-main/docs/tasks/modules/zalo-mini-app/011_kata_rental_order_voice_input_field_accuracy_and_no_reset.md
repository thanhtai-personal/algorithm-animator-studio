# Task 091 - Kata Rental Order: Hoàn thiện voice input (nhận đúng field + không reset dữ liệu khi cập nhật ngày/giờ)

## Input ban đầu
- Voice quick-fill hiện mới hoạt động ổn với:
  - `ghi chú`
  - `tiền cọc`
  - `phương thức thu tiền`
- Các field còn lại (đặc biệt `startDate`, `endDate`, `pickupTime`, `returnTime`) nhận dạng chưa ổn định.
- Khi đọc lệnh cho ngày/giờ, form có hiện tượng "reset data" sau khi transcript được áp dụng.

## Vấn đề cần chỉ ra (root-cause cần xác minh khi implement)
1. Parser nhận dạng field chưa đủ robust:
   - alias ngắn dễ match sai ngữ cảnh,
   - câu nói có tiền tố/hậu tố tự nhiên làm tách value không chính xác,
   - thứ tự `tên field + nội dung` chưa được nhận diện ổn định trong câu dài.
2. Parser ngày/giờ còn hạn chế:
   - chưa xử lý đủ biến thể nói tự nhiên (`10 giờ`, `10h30`, `6 giờ chiều`, `25/03/2026`, `hôm nay`, `ngày mai`...).
3. Áp giá trị trực tiếp nhưng thiếu guard dữ liệu:
   - khi parse sai hoặc parse ra giá trị không hợp lệ thì vẫn set vào field,
   - setter ngày bắt đầu/kết thúc gây side-effect làm mất dữ liệu liên quan (cart/deposit) => người dùng thấy "reset".

## Mục tiêu
- Tăng độ chính xác nhận dạng field voice quick-fill cho toàn bộ whitelist field.
- Chuẩn hóa parser ngày/giờ/số tiền để nhận tốt nhiều pattern nói tự nhiên.
- Chặn triệt để việc reset dữ liệu không mong muốn khi cập nhật field bằng voice.
- Giữ flow local-only (không gọi AI/backend parser), dùng pattern matching và normalize text.

## Phạm vi
- App: `apps/zalo-mini-apps/kata-rental-order/**`
- Trọng tâm:
  - parser trong hook `useRentalOrderPage`
  - setter/update strategy trong store để tránh destructive reset khi update từ voice
  - UI feedback voice state/transcript nếu cần bổ sung cảnh báo parse fail

## Yêu cầu chi tiết
1. Củng cố thuật toán nhận dạng field:
   - ưu tiên match alias dài nhất,
   - match theo token boundary, không match substring gây nhiễu,
   - hỗ trợ nhận dạng alias ở đầu/giữa câu.
2. Củng cố trích xuất value:
   - loại từ đệm (`là`, `bằng`, dấu `:`/`-`...),
   - fallback thông minh nếu value nằm trước alias.
3. Parse amount tốt hơn:
   - hỗ trợ `k`, `nghìn/ngàn`, `tr`, `triệu`, `tỷ`.
4. Parse date tốt hơn:
   - hỗ trợ `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`,
   - hỗ trợ từ khóa tương đối: `hôm nay`, `ngày mai`, `ngày mốt` (theo timezone app).
5. Parse time tốt hơn:
   - hỗ trợ `10 giờ`, `10h`, `10h30`, `10 giờ 30`,
   - hỗ trợ ngữ nghĩa `sáng/chiều/tối` để map 24h.
6. Guard khi apply:
   - chỉ update khi parse ra giá trị hợp lệ,
   - parse fail thì giữ nguyên field cũ + có feedback ngắn.
7. Không reset dữ liệu ngoài ý muốn:
   - voice update `startDate/endDate/pickupTime/returnTime` không được làm mất customer/cart/deposit đã nhập nếu không có yêu cầu nghiệp vụ bắt buộc.
   - nếu nghiệp vụ bắt buộc recalc, phải recalc có kiểm soát thay vì clear toàn bộ.
8. Regression:
   - `customerSearch`, `depositAmount`, `receiptMethod`, `note` vẫn hoạt động đúng.

## Done criteria
- Nhận đúng tối thiểu 9 field whitelist trong bộ test voice quick-fill.
- Không còn hiện tượng reset form ngoài ý muốn khi nói field ngày/giờ.
- Parse date/time pass các câu mẫu tiếng Việt phổ biến.
- Khi parse fail, không ghi đè giá trị rác vào field.
- `npm run lint` + `npm run typecheck` pass cho `kata-rental-order`.

## Nhắc test nhanh
- `khách hàng Nguyễn Văn A`
- `ngày bắt đầu 25/03/2026`
- `ngày kết thúc 31-03-2026`
- `giờ nhận đồ 10 giờ 30`
- `giờ trả đồ 6 giờ chiều`
- `tiền cọc 1 triệu 200 nghìn`
- `thu ngay 500k`
- `phương thức thu tiền chuyển khoản`
- `ghi chú khách trả đồ tại quầy`
- Lặp nhiều lượt đọc liên tiếp, verify dữ liệu cộng dồn đúng và không reset.

## Cập nhật tiến độ (sau khi hoàn thành task)
- Thêm/đánh dấu checklist trong:
  - `progress/modules/zalo-mini-app/tasks.md`
- Append completion log theo format chuẩn của module.
