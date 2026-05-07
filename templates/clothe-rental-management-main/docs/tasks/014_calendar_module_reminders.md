# Task 014 - Calendar Module & In-App Reminders

## Mục tiêu
- Implement lịch pickups/returns/bookings/overdue theo wireframe.
- Hỗ trợ quick view order và chuẩn bị nền reminder in-app.

## Phụ thuộc
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.7)
- `docs/001_wireframe.md` (Section 9)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Calendar module MVP cho showroom (month/week/day) với events từ orders và overdue highlights.

Yêu cầu:
1) Route /[locale]/calendar
2) Calendar view:
   - month/week/day toggle (MVP có thể month + week trước)
   - side filters: pickups, returns, bookings, overdue
   - click event mở order quick view (drawer/modal) hoặc navigate detail
3) Event mapping:
   - pickup = start_date
   - return = end_date
   - booking = status RESERVED
   - overdue highlight = end_date < today && status PICKED_UP
4) In-app reminders foundation:
   - danh sách overdue / stuck laundry (nếu dữ liệu có)
   - có thể là panel/placeholder trong calendar hoặc dashboard hook dùng lại
5) Timezone/date locale đúng với `vi/en`.
```

## Config cần chuẩn bị trước khi chạy task
- Calendar library strategy (reuse existing deps / custom)
- Timezone chuẩn hệ thống (local showroom timezone)
- Overdue calculation theo ngày hay datetime
- Quick view UX: drawer vs direct navigate

## In-scope
- Calendar events MVP + filters + quick view
- Overdue highlight

## Out-of-scope
- Push/email/Zalo reminders
- Advanced scheduling/appointments beyond orders

## Deliverables mong muốn
- Calendar route usable cho vận hành xem pickups/returns

## Done criteria (coding)
- Events hiển thị đúng theo order status/date
- Overdue được highlight đúng
- Filter side panel hoạt động

## Nhắc test nhanh
- Manual dataset test (reserved/picked_up/overdue)
- Lint/typecheck calendar module

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 014 |- [x] 014 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 014
  - Task file: docs/tasks/014_calendar_module_reminders.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
