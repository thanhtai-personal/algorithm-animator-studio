# Task 067 - Quy tắc làm tròn số: chỉ hiển thị ở FE, backend/database giữ giá trị chính xác

## Input ban đầu
- Trong app đang có nhiều điểm xử lý số tiền/số học ở backend.
- Cần chuẩn hóa quy tắc:
  - FE chỉ làm tròn để hiển thị UI.
  - Backend không được làm tròn trước khi lưu.
  - Database lưu giá trị chính xác theo precision/scale của cột.

## Mục tiêu
- Chặn sai lệch dữ liệu do làm tròn sớm ở backend.
- Đảm bảo mọi nghiệp vụ tính toán/lưu trữ dùng giá trị gốc, không mất precision ngoài ý muốn.
- Thống nhất contract hiển thị số ở FE và contract lưu số ở BE/DB.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`
- `docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
- `docs/tasks/066_procurement_product_input_upsert_and_excel_native_import.md`

## Mapping màn hình/source
- FE format/display:
  - `apps/web/src/utils/format/**`
  - `apps/web/src/components/forms/MoneyInput.tsx`
  - các hook/component module Orders/Payments/Procurement/Reports/Dashboard
- Backend calculation/persistence:
  - `apps/web/src/server/data-access/**`
  - `apps/web/src/server/services/**`
- DB schema precision:
  - `apps/web/sql/**` (các cột numeric liên quan tiền và đơn giá)

## Quy tắc nghiệp vụ bắt buộc
- Chỉ FE được làm tròn để hiển thị (format currency/number cho UI).
- Backend:
  - không dùng `Math.round`, `toFixed`, helper `roundMoney` để chuẩn bị dữ liệu trước khi insert/update DB.
  - không trả giá trị đã làm tròn cho mục đích lưu trữ; chỉ trả raw value theo domain contract.
- Database:
  - lưu giá trị theo đúng precision/scale của cột.
  - nếu precision hiện tại không đủ cho nghiệp vụ, xử lý bằng migration cột (không làm tròn ở code backend để “né” giới hạn).
- So sánh số thực trong rule validate phải dùng tolerance hợp lý (epsilon), không dùng round để ép bằng nhau giả tạo.

## In-scope
- Audit toàn bộ điểm làm tròn ở backend liên quan lưu trữ/tính toán nghiệp vụ.
- Loại bỏ hoặc thay thế logic làm tròn backend trái quy tắc.
- Chuẩn hóa helper FE-only cho hiển thị số.
- Bổ sung checklist/regression test cho các module tài chính chính.

## Out-of-scope
- Đổi chính sách hiển thị tiền tệ theo locale (trừ khi cần để tách FE display-only).
- Refactor UI/UX ngoài phạm vi chuẩn hóa quy tắc làm tròn.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa rounding policy trong app.

Yêu cầu:
1) Audit tất cả chỗ làm tròn số trong backend (Math.round/toFixed/roundMoney...).
2) Chỉ giữ làm tròn ở FE cho mục đích hiển thị; backend lưu raw value.
3) Đảm bảo DB nhận giá trị chính xác theo precision cột, không bị làm tròn sớm ở code.
4) Các rule so sánh số dùng tolerance phù hợp, không round để ép pass.
5) Không regression Orders/Payments/Procurement/Reports.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn logic làm tròn trước khi ghi DB trong backend scope đã audit.
- FE vẫn hiển thị số tiền/số học đúng format mong muốn.
- Không lệch dữ liệu giữa các module (orders, payments, procurement, reports, dashboard).
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo/sửa payment có số lẻ và verify DB lưu đúng giá trị đầu vào.
- Tạo đơn + phí/phạt/hoàn tiền và đối chiếu:
  - số lưu DB,
  - số trả API,
  - số hiển thị UI.
- Nhập hàng/procurement:
  - unit cost, line total, tổng phiếu nhập, payment expense.
- Dashboard/Reports:
  - đối chiếu tổng hợp thu/chi/revenue/profit với dữ liệu raw.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 067 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 066 /a - [ ] 067 | Rounding rules audit: FE display-only rounding, backend no-rounding persistence, DB precision integrity | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 067 |- [x] 067 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 067
  - Task file: docs/tasks/067_rounding_rules_frontend_only_backend_precision.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
