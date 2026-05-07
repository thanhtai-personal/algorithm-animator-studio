# Task 023 - Stylestream UI Clone: Orders + Payments + Reports

## Mục tiêu
- Clone UI nhóm vận hành chính: Orders, Order detail, Payments, Reports.
- Giữ nguyên workflow nghiệp vụ đã triển khai ở tasks 010/011/012/015.

## Phụ thuộc
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/admin/Orders.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/OrderDetail.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Payments.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Reports.tsx`

## Mapping màn hình/source
- Orders list: `apps/web/src/features/orders/components/OrdersListPage.tsx`
- Order detail: `apps/web/src/features/orders/components/OrderDetailPage.tsx`
- Payments list: `apps/web/src/features/payments/components/PaymentsListPage.tsx`
- Reports pages:
  - `apps/web/src/features/reports/components/RevenueReportPage.tsx`
  - `apps/web/src/features/reports/components/UtilizationReportPage.tsx`
  - `apps/web/src/features/reports/components/IncidentsReportPage.tsx`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone UI Stylestream cho orders/payments/reports, không làm thay đổi nghiệp vụ.

Yêu cầu:
1) Orders list:
   - clone table visual, status chips, header/summary style
2) Order detail:
   - clone stepper style, summary cards, action buttons, section hierarchy
   - giữ nguyên actions pickup/return/cancel/payment/incident hiện có
3) Payments:
   - clone layout header + export action + amount styling + type pills
4) Reports:
   - clone chart/cards style theo template
   - map vào 3 report pages đang có (revenue/utilization/incidents) hoặc tab container tương đương
5) Không đổi logic:
   - không đổi status machine, refund policy, reconciliation rules
   - không đổi API payload
6) UX:
   - loading/empty/error states đồng bộ style clone
   - mobile readability cho tables/charts

Không chỉnh SQL hay business policy ở task này.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt chiến lược reports UI:
  - hợp nhất style như template trong page `/reports`
  - hoặc giữ 3 sub-routes và clone style nhất quán.
- Chốt chart library usage hiện tại (nếu đang khác template).

## In-scope
- Clone UI list/detail/reporting cho orders/payments/reports.
- Đồng bộ visual status/action areas theo template.

## Out-of-scope
- Thay đổi workflow nghiệp vụ thanh toán/đơn hàng.
- Thêm loại báo cáo mới ngoài scope hiện có.

## Deliverables mong muốn
- Các màn hình vận hành chính có UI gần template.
- Action nghiệp vụ quan trọng vẫn chạy đúng.

## Done criteria (coding)
- Orders list/detail clone đạt style-close rõ ràng.
- Payments list clone header/table/pill styles.
- Reports pages clone được chart/card language theo template.
- Không regression với các nút action nghiệp vụ chính.

## Nhắc test nhanh
- Manual: orders flow chính (open detail -> pickup/return/cancel mock path theo permission).
- Manual: payments filter/export/status display.
- Manual: reports 3 tabs/routes với range filter.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 023 |- [x] 023 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 023
  - Task file: docs/tasks/023_stylestream_ui_clone_orders_payments_reports.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
