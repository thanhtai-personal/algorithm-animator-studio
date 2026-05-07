# Task 083 - Admin Makeup Overview: KPI tổng quan + chart doanh thu + tổng hợp hóa đơn nhập hàng

## Input ban đầu
- Cần màn hình tổng quan cho admin makeup.
- Màn tổng quan phải có:
  - tổng số đơn makeup,
  - tổng số hóa đơn nhập hàng makeup,
  - chart doanh thu makeup,
  - các số liệu tóm tắt quan trọng để vận hành.

## Mục tiêu
- Xây tab `Overview` cho admin makeup với dữ liệu tổng hợp theo branch.
- Chuẩn hóa API/DTO riêng cho overview makeup.
- Đảm bảo số liệu module makeup tách biệt với module thuê đồ.

## Phụ thuộc
- `docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md`
- `docs/tasks/modules/makeup/011_makeup_admin_order_management_crud_makeup_orders_and_purchase_invoices.md`

## Mapping màn hình/source
- UI:
  - `apps/web/src/app/[locale]/(dashboard)/makeup/overview/page.tsx`
  - `apps/web/src/features/makeup/components/MakeupAdminOverviewPage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupAdminOverviewPage.ts` (new)
- Query/Service:
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts` (extend)
  - `apps/web/src/features/makeup/services/makeupClientService.ts` (extend)
- API:
  - `apps/web/src/app/api/makeup/admin/overview/route.ts` (new)
  - `apps/web/src/server/services/makeupService.ts` (extend)
  - `apps/web/src/server/data-access/makeupStats.ts` hoặc file tương đương (extend/new)
- Types:
  - `apps/web/src/types/makeupModule.ts` (extend overview DTO)

## Quy tắc nghiệp vụ bắt buộc
- Dữ liệu overview chỉ lấy từ domain makeup:
  - đơn makeup,
  - đơn nhập hàng makeup,
  - doanh thu/cost/profit makeup.
- Không cộng/trộn dữ liệu từ rental/sales module.
- Filter tối thiểu:
  - theo khoảng ngày (day/month/custom range),
  - theo branch hiện tại.
- KPI tối thiểu:
  - `makeupOrderCount`,
  - `makeupPurchaseInvoiceCount`,
  - `revenue`,
  - `cost`,
  - `profit`.
- Chart:
  - line/bar theo thời gian cho doanh thu makeup.

## In-scope
- API tổng hợp số liệu overview makeup.
- Màn hình overview và chart doanh thu.
- Filter date range + branch scope.
- i18n vi/en cho labels overview.

## Out-of-scope
- BI nâng cao (drill-down đa chiều, cohort, forecasting).
- Export file báo cáo (excel/pdf) trong task này.

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây tab Overview cho admin makeup với KPI và chart doanh thu.

Yêu cầu:
1) Tạo API `/api/makeup/admin/overview` trả DTO tổng hợp KPI.
2) KPI gồm: số đơn makeup, số hóa đơn nhập hàng makeup, revenue/cost/profit.
3) Có chart doanh thu theo thời gian.
4) Filter theo date range + branch scope.
5) Dữ liệu chỉ thuộc module makeup, không trộn module thuê đồ.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có tab overview hiển thị KPI + chart doanh thu makeup.
- Số liệu hóa đơn nhập hàng makeup hiển thị đúng contract.
- API overview hoạt động đúng branch/date scope.
- Không trộn dữ liệu rental vào makeup overview.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Đổi date range -> KPI/chart cập nhật đúng.
- Đổi branch -> số liệu đổi theo branch.
- Đối soát nhanh với danh sách đơn makeup và hóa đơn nhập hàng cùng kỳ.
- Verify số liệu overview không thay đổi khi tạo đơn thuê đồ ngoài module makeup.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng `Modules/Makeup/009` thì thêm vào:
  - `progress/modules/makeup/tasks.md`
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/009 |- [x] Modules/Makeup/009 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/009
  - Task file: docs/tasks/modules/makeup/009_makeup_admin_overview_kpi_revenue_chart_and_procurement_invoice_summary.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
