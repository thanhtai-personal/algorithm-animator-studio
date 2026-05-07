# Task 055 - Định nghĩa công thức tài chính chuẩn: doanh thu, giá vốn, lợi nhuận, và chỉ số tiền cọc

## Input ban đầu
- Cần định nghĩa rõ công thức tính `doanh thu` và `lợi nhuận` để tránh mỗi màn hình dùng một cách.
- Cần thống nhất giữa đơn thuê và đơn bán.
- Cần sẵn sàng cho hiển thị chart theo ngày/tháng/năm.
- Cần chốt trigger nghiệp vụ khi nhân viên:
  - xác nhận đã nhận cọc,
  - xác nhận hoàn thành đơn hoặc thu đủ nợ,
  - xác nhận số tiền hoàn cọc.

## Mục tiêu
- Chốt glossary + công thức tài chính chuẩn dùng toàn hệ thống.
- Chuẩn hóa các chỉ số tối thiểu:
  - `revenue_gross`
  - `revenue_net`
  - `cogs` (giá vốn)
  - `gross_profit`
  - `profit_margin`
  - `outstanding_debt`
  - `deposit_collected_total`
  - `deposit_refunded_total`
- Đảm bảo công thức chạy nhất quán theo `orderType=RENTAL|SALE`.
- Bổ sung UI summary hiển thị `tiền cọc đã thu` và `tiền cọc đã hoàn` cạnh `doanh thu` và `lợi nhuận`.

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/052_settlement_no_partial_and_debt_lifecycle.md`
- `docs/tasks/053_revenue_debt_unified_calculation_dashboard_reports.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`

## Mapping màn hình/source
- Server calculation source-of-truth:
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/server/data-access/reports.ts`
  - `apps/web/src/server/services/reportsService.ts`
- Domain types:
  - `apps/web/src/types/ordersDomain.ts`
  - `apps/web/src/types/domainPrimitives.ts`
- Reference UI (consumer):
  - `apps/web/src/features/orders/**`
  - `apps/web/src/features/dashboard/**`
  - `apps/web/src/features/reports/**`

## Quy tắc nghiệp vụ bắt buộc
- Trigger cập nhật số liệu theo action nhân viên:
  - xác nhận đã nhận cọc -> ghi nhận payment cọc hợp lệ vào `deposit_collected_total`.
  - xác nhận đã hoàn thành đơn hoặc thu đủ nợ -> trigger refresh/chốt hiển thị số liệu, không tự tạo thêm doanh thu nếu không có payment `POSTED` hợp lệ mới.
  - xác nhận hoàn cọc -> ghi nhận payment hoàn cọc hợp lệ vào `deposit_refunded_total`.
- Source-of-truth ghi nhận doanh thu/lợi nhuận là payment `POSTED` hợp lệ; trạng thái đơn chỉ là điều kiện nghiệp vụ/hiển thị.
- Doanh thu:
  - `revenue_gross`: tổng payment `POSTED` hợp lệ tạo doanh thu của đơn (theo orderType).
  - payment hợp lệ tạo doanh thu phải đi qua allow-list chuẩn `REVENUE_ELIGIBLE_PAYMENT_TYPES` đã chốt ở task 053.
  - `revenue_net`: `revenue_gross - refund_effective`.
  - Deposit không tính vào doanh thu trong mọi trường hợp.
  - Thu cọc (`DEPOSIT`) không làm tăng doanh thu.
  - Hoàn cọc (`DEPOSIT_REFUND`) không làm giảm doanh thu.
  - Payment `VOIDED` không tính vào doanh thu.
  - Refund semantics:
    - `RENT_REFUND` giảm doanh thu.
    - `DEPOSIT_REFUND` chỉ tác động `deposit_refunded_total`, không tác động doanh thu.
- Giá vốn:
  - SALE: lấy từ giá vốn item/variant theo snapshot tại thời điểm chốt đơn (không lấy cost hiện tại động).
  - RENTAL: chốt công thức giá vốn thuê MVP (ví dụ: cleaning + maintenance + khấu hao phân bổ); nếu thiếu dữ liệu thì định nghĩa fallback = 0 và ghi rõ.
  - Bắt buộc có cơ chế snapshot/immutability cho cost inputs để số lợi nhuận lịch sử không thay đổi khi catalog cost thay đổi về sau.
- Lợi nhuận:
  - `gross_profit = revenue_net - cogs`.
  - `profit_margin = gross_profit / revenue_net` (guard chia cho 0).
- Công nợ:
  - `outstanding_debt = receivable_valid - collected_valid`.
- Chỉ số cọc:
  - `deposit_collected_total`: tổng payment `POSTED` loại thu cọc hợp lệ.
  - `deposit_refunded_total`: tổng payment `POSTED` loại hoàn cọc hợp lệ.
  - Không trộn chỉ số cọc vào revenue/profit.
- Tính theo thời gian:
  - Chuẩn hóa timezone và mốc cắt ngày cho daily/monthly/yearly aggregation.
  - Tạm thời dùng timestamp hiện hành của payment tại thời điểm nhận/trả tiền theo behavior hệ thống hiện tại.
  - Chuẩn hóa event-time chi tiết (nếu cần) sẽ tách phase sau, không block task này.
- Bắt buộc có tài liệu công thức ngắn trong code/docs để team vận hành hiểu cùng một nghĩa.

## In-scope
- Chốt và implement công thức ở tầng server.
- Bổ sung/chuẩn hóa DTO chỉ số tài chính dùng cho dashboard/reports/orders detail.
- Bổ sung UI summary hiển thị:
  - tiền cọc đã thu,
  - tiền cọc đã hoàn,
  - đặt cạnh doanh thu/lợi nhuận để đối soát.
- Bổ sung kiểm tra tính nhất quán số liệu theo mẫu dữ liệu test.

## Out-of-scope
- Vẽ chart UI (task 056).
- Tích hợp data warehouse/BI bên ngoài.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa công thức doanh thu/lợi nhuận dùng chung toàn hệ thống.

Yêu cầu:
1) Định nghĩa metrics và công thức cụ thể (revenue, cogs, profit, margin, debt, deposit collected/refunded).
2) Áp dụng theo orderType RENTAL/SALE.
3) Doanh thu/lợi nhuận tính theo payment hợp lệ; không tính tiền cọc vào revenue dù là thu cọc hay hoàn cọc.
4) Bổ sung UI summary hiển thị tiền cọc đã thu/hoàn cạnh doanh thu/lợi nhuận.
5) Chuẩn hóa timezone + aggregation boundary.
6) Expose DTO/API để dashboard/reports/orders detail reuse.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có bộ công thức tài chính chuẩn được định nghĩa rõ.
- Server trả ra chỉ số revenue/profit/debt nhất quán.
- Revenue dùng đúng allow-list `REVENUE_ELIGIBLE_PAYMENT_TYPES` đã chốt ở task 053.
- Server trả ra đầy đủ `deposit_collected_total` và `deposit_refunded_total`.
- RENTAL và SALE đều có rule tính riêng rõ ràng.
- Có xử lý snapshot/fallback khi thiếu dữ liệu giá vốn.
- Revenue/profit aggregation dùng cùng time basis hiện hành của payment trong toàn bộ màn hình liên quan.
- Không phát sinh doanh thu/lợi nhuận nếu chỉ đổi trạng thái đơn mà không có payment `POSTED` hợp lệ.
- Thu cọc/hoàn cọc không làm lệch doanh thu/lợi nhuận.
- UI hiển thị được tiền cọc đã thu/hoàn cạnh doanh thu/lợi nhuận.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Dựng dataset mẫu gồm:
  - đơn thuê có refund/deposit/debt,
  - đơn bán có cost.
- Chạy theo luồng nghiệp vụ nhân viên:
  - xác nhận đã nhận cọc,
  - xác nhận hoàn thành đơn hoặc thu đủ nợ,
  - xác nhận hoàn cọc.
- Chỉnh cost catalog sau khi đã tạo đơn sale:
  - verify lợi nhuận lịch sử của đơn cũ không thay đổi.
- Đối chiếu bằng tay:
  - revenue_gross, revenue_net, cogs, gross_profit, margin, debt.
  - deposit_collected_total, deposit_refunded_total.
- Verify:
  - thu cọc không tăng doanh thu,
  - hoàn cọc không giảm doanh thu,
  - chỉ payment hợp lệ mới tác động revenue/profit.
- Verify đổi trạng thái đơn (không có payment `POSTED` mới) không làm đổi số doanh thu/lợi nhuận.
- Verify payment type ngoài allow-list revenue-eligible không làm thay đổi revenue/profit.
- Verify UI summary hiển thị đúng số cọc đã thu/hoàn bên cạnh doanh thu/lợi nhuận.
- Verify các endpoint dashboard/reports trả cùng số.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 055 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 054 /a - [ ] 055 | Define standardized financial formulas (revenue/cogs/profit/debt) for RENTAL and SALE | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 055 |- [x] 055 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 055
  - Task file: docs/tasks/055_financial_formulas_revenue_profit_standardization.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
