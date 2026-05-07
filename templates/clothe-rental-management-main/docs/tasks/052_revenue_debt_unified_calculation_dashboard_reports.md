# Task 053 - Chuẩn hóa tính doanh thu/công nợ theo đơn cho Order Detail + Dashboard + Reports (phase 1)

## Input ban đầu
- Cần xử lý phần tài chính liên quan đơn: doanh thu, cọc, refund, công nợ.
- Tránh mỗi màn hình tự tính một kiểu gây lệch số.

## Mục tiêu
- Định nghĩa một source-of-truth server-side cho tính toán revenue/debt theo đơn.
- Đồng bộ số liệu giữa:
  - order detail summary,
  - dashboard KPI,
  - reports/export.
- Expose dữ liệu chỉ số cọc (`đã thu`, `đã hoàn`) cho các màn hình downstream.
- Làm nền cho phase 2 về công thức lợi nhuận và chart time-series (task 055/056).

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/052_settlement_no_partial_and_debt_lifecycle.md`
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/015_reports_module.md`

## Mapping màn hình/source
- Orders:
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/features/orders/**`
- Dashboard:
  - `apps/web/src/features/dashboard/**`
  - `apps/web/src/server/services/**dashboard*`
  - `apps/web/src/server/data-access/dashboard.ts`
- Reports:
  - `apps/web/src/features/reports/**`
  - `apps/web/src/server/services/reportsService.ts`
  - `apps/web/src/server/data-access/reports.ts`

## Quy tắc nghiệp vụ bắt buộc
- Công thức chuẩn:
  - Doanh thu/lợi nhuận chỉ tính theo payment `POSTED` hợp lệ.
  - Payment `VOIDED` không tính doanh thu.
  - `revenue_gross` = tổng payment `POSTED` thuộc nhóm revenue-eligible.
  - nhóm revenue-eligible phải được định nghĩa bằng allow-list tường minh (ví dụ hằng số `REVENUE_ELIGIBLE_PAYMENT_TYPES`) theo enum payment type hiện hành; không suy diễn theo label/text.
  - `revenue_net` = `revenue_gross - refund_effective`.
  - `DEPOSIT` không thuộc nhóm revenue-eligible.
  - `DEPOSIT_REFUND` không làm giảm doanh thu (chỉ tính vào chỉ số cọc hoàn).
  - Refund làm giảm doanh thu theo loại hoàn:
    - `RENT_REFUND` giảm doanh thu.
    - `DEPOSIT_REFUND` không giảm doanh thu (vì cọc không được ghi nhận là doanh thu).
  - Chỉ số cọc:
    - `deposit_collected_total` = tổng payment `POSTED` loại thu cọc hợp lệ.
    - `deposit_refunded_total` = tổng payment `POSTED` loại hoàn cọc hợp lệ.
  - Công nợ = số phải thu hợp lệ - số đã thu hợp lệ.
- Mốc thời gian ghi nhận để gom số liệu:
  - tạm thời dùng timestamp hiện hành của payment tại thời điểm nhận/trả tiền (theo behavior hệ thống hiện tại).
  - issue chuẩn hóa event-time chi tiết theo ngày/tháng/năm tạm thời không block trong phase này.
- Trạng thái:
  - `COMPLETED => công nợ = 0`.
  - Khi đơn đã đi tới pha settlement mà công nợ > 0 thì đơn phải ở `DEBT`.
  - Không tự suy ngược `công nợ = 0` thành `COMPLETED` cho các trạng thái sớm (DRAFT/RESERVED/CONFIRMED...).
- Không được duplicate logic tính ở client; client chỉ render số đã chuẩn hóa hoặc reuse cùng util chuẩn.

## In-scope
- Implement/refactor server calculation layer cho revenue/debt.
- Đồng bộ endpoints/stores/UI đọc chung kết quả chuẩn.
- Đảm bảo reports export và dashboard KPI khớp với order detail.
- Expose output `deposit_collected_total` và `deposit_refunded_total` cho các màn hình sử dụng.

## Out-of-scope
- Thay đổi policy accounting bên ngoài scope đơn hàng.
- Tích hợp BI system bên thứ ba.
- Định nghĩa công thức lợi nhuận chi tiết (task 055).
- Triển khai UI hiển thị summary cọc (task 055/056).
- UI chart doanh thu/lợi nhuận theo ngày/tháng/năm (task 056).

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa source-of-truth revenue/debt theo đơn và đồng bộ dashboard/reports.

Yêu cầu:
1) Định nghĩa hàm tính chuẩn ở server cho revenue/debt.
2) Revenue/profit chỉ tính theo payment POSTED hợp lệ; deposit thu/hoàn không đi vào revenue.
3) Expose thêm metrics cọc đã thu/cọc đã hoàn cho order detail/dashboard/reports.
4) Áp dụng cùng logic cho order detail, dashboard KPI, reports/export.
5) Viết test hoặc checklist đối chiếu số liệu giữa các màn hình.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có source-of-truth chung cho revenue/debt.
- Revenue/profit được tính từ payment `POSTED` hợp lệ.
- Có allow-list `revenue-eligible` tường minh và dùng nhất quán trong toàn bộ tầng tính toán.
- Deposit không tăng doanh thu.
- VOIDs không tính doanh thu.
- `RENT_REFUND` giảm doanh thu đúng; `DEPOSIT_REFUND` không làm giảm doanh thu.
- Có output `deposit_collected_total` và `deposit_refunded_total`.
- Không còn rule suy ngược sai `debt=0 => COMPLETED` cho trạng thái sớm.
- Số liệu khớp giữa order detail, dashboard, reports/export.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Chọn 1 đơn có đủ case: deposit, payment, void, refund.
- So sánh số:
  - order detail summary,
  - dashboard KPI,
  - reports table/export.
- Verify riêng:
  - `RENT_REFUND` làm giảm doanh thu.
  - `DEPOSIT_REFUND` không làm giảm doanh thu.
- Verify riêng chỉ số cọc:
  - `deposit_collected_total` đúng theo payment thu cọc `POSTED`.
  - `deposit_refunded_total` đúng theo payment hoàn cọc `POSTED`.
- Verify payment type không nằm trong allow-list revenue-eligible không làm tăng doanh thu.
- Verify case đơn ở trạng thái sớm có debt=0:
  - không bị tự động gán `COMPLETED`.
- Verify tất cả khớp cùng công thức.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 053 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 052 /a - [ ] 053 | Unified revenue/debt calculations across orders + dashboard + reports | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 053 |- [x] 053 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 053
  - Task file: docs/tasks/053_revenue_debt_unified_calculation_dashboard_reports.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
