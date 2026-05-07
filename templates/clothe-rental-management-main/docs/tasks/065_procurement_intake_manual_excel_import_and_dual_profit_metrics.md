# Task 065 - Module nhập hàng: nhập tay/form + Excel import/template + payment chi + 2 chỉ số lợi nhuận

## Input ban đầu
- Nghiệp vụ nhập hàng phải hỗ trợ:
  - nhập trực tiếp trên form,
  - nhập bằng upload file Excel,
  - có export file Excel mẫu để user tải và điền.
  - Đặt ở admin dashboard menu. (Thêm item Nhập hàng)
- Khi nhập hàng, staff/admin có thể tạo kèm payment loại chi tiền.
- Khoản trả cọc khi nhập hàng cũng là payment loại chi tiền.
- Cần hiển thị song song 2 cách tính lợi nhuận:
  - lợi nhuận bán hàng,
  - lợi nhuận thực tế theo dòng tiền thu/chi.

## Mục tiêu
- Có module nhập hàng chuẩn cho vận hành ngày thường (manual + Excel).
- Chuẩn hóa nghiệp vụ payment chi phát sinh trong luồng nhập hàng.
- Hiển thị rõ 2 chỉ số lợi nhuận với công thức tách biệt, không gộp mơ hồ.

## Phụ thuộc
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`

## Mapping màn hình/source
- Procurement module (new):
  - `apps/web/src/app/[locale]/(dashboard)/procurement/page.tsx` (new)
  - `apps/web/src/features/procurement/components/**` (new)
  - `apps/web/src/features/procurement/hooks/**` (new)
  - `apps/web/src/features/procurement/queries/**` (new)
  - `apps/web/src/features/procurement/services/**` (new)
  - `apps/web/src/features/procurement/stores/**` (new)
- API + server:
  - `apps/web/src/app/api/procurement/**` (new)
  - `apps/web/src/server/services/procurementService.ts` (new)
  - `apps/web/src/server/data-access/procurement.ts` (new)
  - `apps/web/src/server/services/paymentsService.ts`
  - `apps/web/src/server/data-access/payments.ts`
- Dashboard/Reports (hiển thị chỉ số lợi nhuận):
  - `apps/web/src/server/services/dashboardService.ts`
  - `apps/web/src/server/services/reportsService.ts`
  - `apps/web/src/features/dashboard/**`
  - `apps/web/src/features/reports/**`
- SQL:
  - `apps/web/sql/027_procurement_intake_and_expense_payments.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- Kênh nhập hàng:
  - cho phép nhập tay trực tiếp trên form (một hoặc nhiều dòng sản phẩm),
  - cho phép import bằng Excel theo đúng template hệ thống,
  - có chức năng export template Excel.
- Import Excel:
  - có bước validate dữ liệu trước khi commit,
  - hiển thị lỗi theo dòng/cột để user sửa file và import lại.
- Payment chi trong nhập hàng:
  - staff/admin có thể tạo payment loại `EXPENSE` ngay trong flow nhập hàng,
  - trả cọc nhà cung cấp cũng ghi nhận là `EXPENSE`,
  - payment phải trace được về chứng từ/lô nhập hàng.
- Hiển thị song song 2 chỉ số lợi nhuận:
  - `Lợi nhuận bán hàng`:
    - nếu sản phẩm đã bán: `giá_bán - giá_vốn + tổng_giá_thuê_của_sản_phẩm`,
    - nếu sản phẩm chưa bán: `tổng_giá_thuê_của_sản_phẩm`.
  - `Lợi nhuận thực tế`: `tổng payment thu - tổng payment chi`.
- Không thay đổi ngầm công thức hiện có ở các màn hình khác nếu chưa được map rõ trong task này.

## In-scope
- Tạo module nhập hàng (UI + API + service + data-access + store/query) theo kiến trúc chuẩn.
- Tạo dữ liệu nền cho phiếu nhập/lô nhập và dòng chi tiết nhập.
- Hỗ trợ:
  - nhập hàng qua form,
  - export template Excel,
  - upload/import Excel với validate và báo lỗi chi tiết.
- Tạo payment `EXPENSE` đi kèm nhập hàng (bao gồm trả cọc).
- Hiển thị đủ 2 chỉ số lợi nhuận trên dashboard/reports theo công thức đã chốt.

## Out-of-scope
- OCR hóa đơn/chứng từ.
- Tích hợp nhà cung cấp/vận chuyển bên thứ ba.
- Kế toán công nợ nâng cao theo nhà cung cấp (aging/AP detail).
- Tự động đồng bộ Excel từ nguồn bên ngoài (Google Sheet/ERP).

## Prompt gợi ý cho Codex
```text
Mục tiêu: triển khai module nhập hàng với 2 kênh nhập (form + Excel), có payment chi đi kèm và hiển thị 2 công thức lợi nhuận.

Yêu cầu:
1) Tạo module procurement theo flow Component -> Hook -> Query -> Service -> API/Supabase.
2) Hỗ trợ nhập tay trên form và import Excel; có export file mẫu.
3) Khi nhập hàng cho phép tạo payment loại EXPENSE; trả cọc cũng là EXPENSE.
4) Cập nhật dashboard/reports để hiển thị đồng thời:
   - Lợi nhuận bán hàng:
     - sold: sale_price - cost_price + rental_total
     - unsold: rental_total
   - Lợi nhuận thực tế: total payment inflow - total payment outflow
5) Không regression các flow orders/payments hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có migration SQL + runbook cho procurement + expense payment mapping.
- Có màn nhập hàng form tay hoạt động end-to-end.
- Có export template Excel và import Excel với validate lỗi theo dòng/cột.
- Có tạo payment `EXPENSE` từ flow nhập hàng, gồm cả case trả cọc.
- Dashboard/Reports hiển thị đủ 2 chỉ số lợi nhuận theo công thức đã nêu.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Form nhập hàng:
  - tạo phiếu nhập tay thành công,
  - verify tồn kho/cost cập nhật đúng.
- Excel:
  - tải template mẫu,
  - import file hợp lệ thành công,
  - import file lỗi hiển thị đúng dòng/cột sai.
- Payment chi:
  - tạo payment `EXPENSE` khi nhập hàng,
  - test case trả cọc cũng map `EXPENSE`.
- Profit metrics:
  - verify `lợi nhuận bán hàng` theo case sold/unsold,
  - verify `lợi nhuận thực tế = thu - chi`,
  - verify không bị cộng trùng giữa 2 chỉ số.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 065 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 064 /a - [ ] 065 | Procurement intake module: manual/form + Excel import/template + expense payments (incl. deposit) + dual profit metrics display | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 065 |- [x] 065 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 065
  - Task file: docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
