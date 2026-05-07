# Task 088 - Chuẩn hóa tương tác `kata-calendar`: click ngày mở lịch ngày, click booking trong modal mới mở detail

## Input ban đầu
- Tại `apps/zalo-mini-apps/kata-calendar`, khi click vào booking chip ngay trên lịch tháng thì đang mở thẳng detail booking.
- Yêu cầu UX chuẩn hóa:
  - click vào ngày => mở modal "Lịch trong ngày",
  - chỉ khi vào modal "Lịch trong ngày" và click booking thì mới mở "Chi tiết booking",
  - không cho mở detail booking trực tiếp từ booking chip trên lịch tháng.

## Mục tiêu
- Chuẩn hóa 1 luồng tương tác nhất quán cho lịch:
  - `Calendar day` -> `Day events modal` -> `Booking detail modal`.
- Giảm nhảy context đột ngột khi user thao tác trực tiếp trên cell lịch tháng.
- Giữ nguyên contract data hiện có (query/service/API không đổi).

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/006_zalo_mini_app_makeup_booking_clone_from_web_product_page.md`
- `docs/tasks/modules/zalo-mini-app/007_zalo_mini_apps_ios_view_overflow_and_modal_close_safe_area.md`

## Mapping màn hình/source
- `apps/zalo-mini-apps/kata-calendar/src/features/calendar/components/ZaloCalendarSection.tsx`
- `apps/zalo-mini-apps/kata-calendar/src/features/calendar/hooks/useZaloMiniAppCalendar.ts`
- `apps/zalo-mini-apps/kata-calendar/src/styles.css`

## Quy tắc kỹ thuật bắt buộc
- Giữ chuẩn kiến trúc:
  - `Component -> Hook -> Query -> Service -> API`.
- Không sửa API payload/response hoặc policy quyền truy cập calendar.
- Click booking chip ở cell tháng chỉ được phép:
  - mở modal lịch ngày (có thể auto focus/highlight booking), hoặc
  - tương đương hành vi click vào ngày.
- Không được mở `activeEvent` trực tiếp từ lịch tháng.

## In-scope
- Chặn đường mở detail trực tiếp từ booking chip ở calendar grid.
- Đảm bảo click ngày và click booking chip trong ngày đều mở modal "Lịch trong ngày".
- Giữ hành vi mở detail khi click booking card trong modal "Lịch trong ngày".
- Chuẩn hóa state transition modal:
  - đóng detail trở về ngữ cảnh danh sách lịch trong ngày.

## Out-of-scope
- Thay đổi dữ liệu booking hoặc business rule conflict warning.
- Refactor lớn toàn bộ component calendar ngoài phạm vi interaction flow.
- Bổ sung tính năng mới ngoài luồng điều hướng modal nêu trên.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa flow click trong kata-calendar.

Yêu cầu:
1) Click vào ngày trên month calendar phải mở modal lịch trong ngày.
2) Click booking chip trong month calendar không được mở detail trực tiếp; chỉ mở modal lịch trong ngày.
3) Từ modal lịch trong ngày, click booking card mới mở modal detail booking.
4) Đóng detail quay về danh sách lịch trong ngày (không mất ngữ cảnh ngày đã chọn).
5) Không thay đổi query/service/API contract.

Validation commands:
- cd apps/zalo-mini-apps/kata-calendar && npm run lint
- cd apps/zalo-mini-apps/kata-calendar && npm run typecheck
- cd apps/zalo-mini-apps/kata-calendar && npm run build
```

## Done criteria (coding)
- Không còn trường hợp mở detail booking trực tiếp từ booking chip trong lịch tháng.
- Click ngày luôn mở đúng modal danh sách lịch trong ngày.
- Từ modal danh sách lịch ngày, click booking mở đúng detail booking.
- Đóng detail vẫn giữ được ngữ cảnh ngày đã chọn.
- `cd apps/zalo-mini-apps/kata-calendar && npm run lint` pass.
- `cd apps/zalo-mini-apps/kata-calendar && npm run typecheck` pass.

## Nhắc test nhanh
- Click vào ngày có nhiều booking -> modal lịch ngày mở và hiển thị đủ danh sách.
- Click vào booking chip ngay trên cell tháng -> chỉ mở modal lịch ngày, không mở detail.
- Trong modal lịch ngày click từng booking -> detail hiển thị đúng booking tương ứng.
- Đóng detail -> quay lại modal lịch ngày với danh sách không bị reset sai ngày.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/008` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/008 |- [x] Modules/Zalo-Mini-App/008 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/008
  - Task file: docs/tasks/modules/zalo-mini-app/008_zalo_mini_app_kata_calendar_day_modal_detail_flow_standardization.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
