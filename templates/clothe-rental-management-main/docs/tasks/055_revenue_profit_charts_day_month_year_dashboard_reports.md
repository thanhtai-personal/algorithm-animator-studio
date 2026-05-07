# Task 056 - UI chart doanh thu/lợi nhuận theo ngày/tháng/năm (Dashboard + Reports)

## Input ban đầu
- Cần hiển thị UI chart cho doanh thu/lợi nhuận theo các mức:
  - ngày
  - tháng
  - năm
- Chart phải dùng dữ liệu đã chuẩn hóa từ công thức tài chính thống nhất.

## Mục tiêu
- Thêm chart time-series cho revenue/profit ở dashboard và reports.
- Cho phép đổi nhanh granularity `day/month/year`.
- Đảm bảo số chart khớp KPI/table/export.

## Phụ thuộc
- `docs/tasks/053_revenue_debt_unified_calculation_dashboard_reports.md`
- `docs/tasks/055_financial_formulas_revenue_profit_standardization.md`
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/015_reports_module.md`

## Mapping màn hình/source
- Dashboard:
  - `apps/web/src/features/dashboard/**`
- Reports:
  - `apps/web/src/features/reports/**`
- API/data:
  - `apps/web/src/app/api/**reports*`
  - `apps/web/src/server/services/reportsService.ts`
  - `apps/web/src/server/data-access/reports.ts`

## Quy tắc nghiệp vụ bắt buộc
- Granularity:
  - `day`: nhóm theo ngày local timezone đã chốt.
  - `month`: nhóm theo tháng.
  - `year`: nhóm theo năm.
- Accounting time basis:
  - chart dùng time basis hiện hành của payment theo behavior hệ thống hiện tại.
  - mọi chart/KPI/report trong cùng màn hình phải dùng cùng time basis.
  - issue chuẩn hóa event-time chi tiết tạm thời không block task này.
- Metrics tối thiểu:
  - revenue_net
  - gross_profit
  - profit_margin (nếu đủ dữ liệu)
  - summary cọc đi kèm: `deposit_collected_total`, `deposit_refunded_total` (hiển thị cạnh khu vực doanh thu/lợi nhuận, không trộn vào revenue/profit chart series).
- UX:
  - có loading/empty/error state rõ ràng.
  - chart và summary card phải dùng cùng dataset nguồn.
  - không để mismatch giữa chart và bảng report.
  - summary card cọc đã thu/cọc đã hoàn phải đồng bộ cùng filter thời gian của chart.
- Performance:
  - query params rõ ràng cho granularity + date range.
  - tránh fetch dư thừa khi đổi filter.

## In-scope
- UI controls chọn granularity (day/month/year).
- Chart components cho revenue/profit.
- Wiring query/service/store để lấy dữ liệu time-series.
- Đồng bộ chart với summary KPI và report table.

## Out-of-scope
- Thiết kế chart nâng cao (forecast, anomaly detection).
- Realtime streaming analytics.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm chart doanh thu/lợi nhuận theo day/month/year cho dashboard và reports.

Yêu cầu:
1) Thêm control chọn granularity day/month/year.
2) Render chart revenue_net và gross_profit (margin nếu có).
3) Dùng đúng source-of-truth dữ liệu từ task 055.
4) Đồng bộ số giữa chart, KPI card, report table, và summary cọc đã thu/cọc đã hoàn.
5) Xử lý loading/empty/error state rõ ràng.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có chart doanh thu/lợi nhuận theo day/month/year.
- Đổi granularity cập nhật dữ liệu đúng.
- Số chart khớp KPI/table/report export.
- Time-basis chart khớp với time basis payment hiện hành đã chốt ở task 055.
- Summary cọc đã thu/cọc đã hoàn khớp số với dataset cùng filter thời gian.
- Có đầy đủ loading/empty/error UX.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Kiểm tra 3 chế độ day/month/year với cùng date range.
- Đối chiếu chart point tổng và KPI summary.
- Đối chiếu chart với report table/export.
- Verify chart/KPI/report dùng cùng time basis payment hiện hành, không lệch số giữa các màn hình.
- Verify summary `deposit_collected_total` và `deposit_refunded_total` thay đổi đúng theo filter day/month/year.
- Test trạng thái empty data và lỗi API.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 056 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 055 /a - [ ] 056 | Revenue/profit charts for dashboard/reports by day/month/year | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 056 |- [x] 056 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 056
  - Task file: docs/tasks/056_revenue_profit_charts_day_month_year_dashboard_reports.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
