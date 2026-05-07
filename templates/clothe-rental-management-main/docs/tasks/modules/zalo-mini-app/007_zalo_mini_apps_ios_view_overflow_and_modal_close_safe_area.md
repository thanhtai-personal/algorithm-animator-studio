# Task 087 - Zalo Mini Apps iOS viewport hardening: chống tràn view iPhone 13 + vùng đóng modal an toàn

## Input ban đầu
- `apps/zalo-mini-apps` đang có lỗi tràn view trên iPhone 13.
- Ở màn hình modal, nút đóng modal bị đè bởi nút đóng app mặc định của Zalo Mini App, dẫn tới không đóng modal đúng như kỳ vọng.
- Cần chuẩn hóa cách xử lý safe area và vùng thao tác để không bị conflict với system UI của Zalo.

## Mục tiêu
- Chuẩn hóa layout mini app cho thiết bị iOS có notch (đặc biệt iPhone 13: 390x844).
- Loại bỏ hiện tượng tràn view ngang/đè lớp hiển thị khi chạy trong Zalo Mini App container.
- Đảm bảo thao tác đóng modal luôn hoạt động, không bị đụng vùng nút đóng app mặc định của Zalo.

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/006_zalo_mini_app_makeup_booking_clone_from_web_product_page.md`

## Mapping màn hình/source
- `apps/zalo-mini-apps/kata-calendar/src/App.tsx`
- `apps/zalo-mini-apps/kata-calendar/src/styles.css`
- `apps/zalo-mini-apps/kata-calendar/src/features/calendar/components/ZaloCalendarSection.tsx`
- `apps/zalo-mini-apps/kata-booking/src/App.tsx`
- `apps/zalo-mini-apps/kata-booking/src/styles.css`

## Quy tắc kỹ thuật bắt buộc
- Chỉ xử lý ở tầng UI/platform boundary; không thay đổi business rules của booking/calendar.
- Nếu cần thêm state cho modal thì vẫn giữ flow:
  - `Component -> Hook -> Query -> Service -> API`.
- Không hardcode riêng iPhone 13 theo user-agent; ưu tiên safe-area + responsive contract.
- Nút đóng modal phải nằm ngoài vùng có khả năng bị system button của Zalo chồng lên (unsafe top-right zone).

## In-scope
- Chuẩn hóa safe-area token trong CSS (`env(safe-area-inset-top|right|bottom|left)`).
- Ràng buộc layout để không phát sinh horizontal overflow trên viewport iPhone 13.
- Điều chỉnh vị trí/kiểu hiển thị action đóng modal trong `kata-calendar` để tránh conflict với nút đóng app mặc định của Zalo.
- Bảo đảm vẫn có tối thiểu 2 cơ chế đóng modal:
  - bấm nút đóng trong modal,
  - bấm ra nền overlay.

## Out-of-scope
- Refactor kiến trúc feature calendar/makeup.
- Thay đổi API contract hoặc dữ liệu booking.
- Redesign toàn bộ UI theme.

## Prompt gợi ý cho Codex
```text
Mục tiêu: fix lỗi tràn view iPhone 13 và lỗi đóng modal bị nút đóng app mặc định Zalo đè lên trong apps/zalo-mini-apps.

Yêu cầu:
1) Chuẩn hóa safe-area CSS cho mini app shell (ưu tiên env(safe-area-inset-*)).
2) Chặn horizontal overflow ở viewport 390x844 (iPhone 13) cho kata-calendar và kata-booking.
3) Với modal kata-calendar, đặt action đóng ở vùng an toàn, không conflict với top-right close mặc định của Zalo Mini App.
4) Giữ nguyên business flow, chỉ xử lý UI/platform behavior.

Validation commands:
- cd apps/zalo-mini-apps/kata-calendar && npm run lint
- cd apps/zalo-mini-apps/kata-calendar && npm run typecheck
- cd apps/zalo-mini-apps/kata-booking && npm run lint
- cd apps/zalo-mini-apps/kata-booking && npm run typecheck
```

## Done criteria (coding)
- Trên iPhone 13 (390x844), không còn tràn view ngang ở shell chính.
- Modal của `kata-calendar` đóng được ổn định, không bị chồng bởi nút đóng app mặc định của Zalo.
- Không có regression ở thao tác đóng modal bằng click nền overlay.
- `cd apps/zalo-mini-apps/kata-calendar && npm run lint` pass.
- `cd apps/zalo-mini-apps/kata-booking && npm run lint` pass.

## Nhắc test nhanh
- Test trên Zalo Mini App runtime iOS (ưu tiên iPhone 13 thật hoặc simulator đúng container).
- Mở modal danh sách lịch và modal chi tiết lịch:
  - bấm nút đóng modal,
  - bấm nền overlay,
  - xác nhận không bị trigger nhầm đóng app.
- Vuốt dọc trong modal dài vẫn ổn định, không rung/nhảy viewport bất thường.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/007` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/007 |- [x] Modules/Zalo-Mini-App/007 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/007
  - Task file: docs/tasks/modules/zalo-mini-app/007_zalo_mini_apps_ios_view_overflow_and_modal_close_safe_area.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
