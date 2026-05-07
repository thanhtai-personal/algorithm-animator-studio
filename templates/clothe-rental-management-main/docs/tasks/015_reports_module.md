# Task 015 - Reports Module (Revenue / Utilization / Incidents)

## Mục tiêu
- Implement bộ báo cáo MVP theo PRD/wireframe: doanh thu, utilization, incidents, và top rentals.
- Dữ liệu báo cáo phải dựa trên `payments`, `orders`, `items`, `incidents` nhất quán.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Section 4.8)
- `docs/001_wireframe.md` (Section 10)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Reports module MVP gồm revenue/utilization/incidents với filter branch/date range và export CSV.

Yêu cầu:
1) Routes:
   - /[locale]/reports/revenue
   - /[locale]/reports/utilization
   - /[locale]/reports/incidents
   - top rentals có thể là route riêng `/[locale]/reports/top-rentals` hoặc section trong revenue/utilization (chốt theo config)
2) Revenue report:
   - KPIs: total revenue, total deposit collected, total refunds, net
   - chỉ tính payment hợp lệ `status=POSTED`, loại trừ `VOIDED`
   - table by day
   - chart optional
3) Utilization report:
   - % items ON_RENT
   - breakdown by category/product
4) Incidents report:
   - filters date range/type
   - table item/order/customer/type/amount
5) Top rentals report/block (theo PRD):
   - top products thuê nhiều
   - top items thuê nhiều
   - chốt metric: số lượt thuê / số ngày thuê / doanh thu
6) Profit/gross-profit handling:
   - PRD có nhắc "lợi nhuận cơ bản" nhưng chưa có cost model trong schema
   - bắt buộc chốt decision trước coding:
     - `A)` chỉ triển khai revenue (defer profit, ghi rõ trong UI/docs)
     - `B)` thêm cost model tối thiểu để tính profit (nếu scope cho phép)
7) Export CSV cho từng report (MVP)
8) RBAC/filter theo branch đúng quyền.
9) Đảm bảo công thức revenue bám payment records (không tính từ order total một cách mơ hồ).
10) Bám manual payment workflow phase 1:
   - không giả định online gateway/webhook callback
   - report phải phản ánh payment status do Admin cập nhật thủ công
```

## Config cần chuẩn bị trước khi chạy task
- Định nghĩa KPI chính xác:
  - `revenue` có bao gồm deposit không?
  - `net = revenue - refunds` theo PRD
- Payment status inclusion rule:
  - chỉ tính `POSTED`
  - loại trừ `VOIDED`
- Profit decision (bắt buộc):
  - defer profit (revenue-only MVP)
  - hoặc định nghĩa cost model để tính profit
- Time granularity mặc định: ngày/tháng
- Utilization denominator:
  - tổng item active (không tính retired)
- Top rentals metric:
  - by booking count / rental days / revenue
- Top rentals dimension:
  - product / item / variant (MVP nên chọn ít nhất product + item)
- CSV schema từng report

## In-scope
- Revenue + Utilization + Incidents + Top Rentals (block/report) + filters + export
- KPI + table (chart optional)

## Out-of-scope
- Advanced BI/dashboard drill-down
- Scheduled reports/email

## Deliverables mong muốn
- Reports routes usable cho vận hành/owner
- KPI numbers đối soát được với Payments/Orders data
- Top rentals output dùng được cho vận hành (ít nhất product + item)
- Profit handling decision được thể hiện rõ trong UI/docs (không mập mờ)

## Done criteria (coding)
- Revenue numbers khớp payments sample
- Revenue/refund/net loại trừ payment `VOIDED`
- Utilization tính đúng với item statuses
- Incidents report hiển thị đúng records + amount
- Export CSV hoạt động
- Top products/items thuê nhiều hiển thị đúng theo metric đã chốt
- Nếu chưa triển khai profit thì UI/docs ghi rõ `deferred` (không hiển thị số profit sai/ngầm hiểu)

## Nhắc test nhanh
- Manual đối chiếu mẫu data giữa reports và payments/orders
- Manual check top rentals với dataset mẫu (product/item counts)
- Lint/typecheck reports module

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 015 |- [x] 015 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 015
  - Task file: docs/tasks/015_reports_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
