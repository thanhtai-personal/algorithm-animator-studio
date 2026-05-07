# Task 013 - Dashboard Overview (KPI + Due/Overdue + Recent Activity)

## Mục tiêu
- Implement dashboard overview theo wireframe để vận hành nhìn nhanh KPI và đơn đến hạn.
- Dùng dữ liệu thật từ orders/payments/inventory sau khi các module core đã có.

## Phụ thuộc
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 4.7, 4.8, 9.1)
- `docs/001_wireframe.md` (Section 3.1)

## Prompt gợi ý cho Codex
```text
Mục tiêu: implement dashboard overview page /[locale]/dashboard theo wireframe với KPI cards + due/overdue tables + recent activities.

Yêu cầu:
1) Dùng dữ liệu thật (không mock) từ orders/payments/items:
   - Revenue today (sum payments `status=POSTED`, exclude `VOIDED`, theo ngày/branch)
   - Orders on rent (status PICKED_UP)
   - Due today
   - Items in laundry
2) Sections theo wireframe:
   - KPI cards row
   - Due today table + quick actions Open/Return
   - Overdue table
   - Recent activities (status changes / payment updates) nếu đã có audit log, nếu chưa thì placeholder rõ ràng
3) Filters/context:
   - branch context từ app shell/auth profile
   - locale-aware labels/date/currency
4) Performance:
   - query tối ưu cho dashboard aggregates
   - loading/empty/error states rõ ràng
5) Bám kiến trúc layering + store-first hydration nếu dashboard có store.

Không làm chart phức tạp nếu chưa cần; chart 7 ngày là optional phase 1.
```

## Config cần chuẩn bị trước khi chạy task
- Dashboard date cutoff theo timezone showroom
- Revenue today tính theo:
  - payment created_at local timezone
  - branch filter hiện tại
  - chỉ tính payment `status=POSTED` (loại trừ `VOIDED`)
- Overdue definition:
  - `end_date < today && status = PICKED_UP`
- Activity sources:
  - `audit_logs`/`item_status_logs`/payment updates (chọn MVP source trước)

## In-scope
- Dashboard KPI + due/overdue + recent activity MVP
- Quick actions từ bảng sang order detail/return

## Out-of-scope
- Advanced charts/BI drill-down
- Custom dashboard widgets

## Deliverables mong muốn
- Dashboard `/[locale]/dashboard` usable cho vận hành hằng ngày

## Done criteria (coding)
- KPI numbers khớp dữ liệu modules tương ứng
- KPI revenue không bị cộng payment `VOIDED`
- Due/Overdue tables hiển thị đúng và cập nhật theo branch
- Empty/loading/error states đầy đủ

## Nhắc test nhanh
- Manual đối chiếu số với Payments/Orders/Inventory
- Lint/typecheck dashboard module


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 013 |- [x] 013 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 013
  - Task file: docs/tasks/013_dashboard_overview_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
