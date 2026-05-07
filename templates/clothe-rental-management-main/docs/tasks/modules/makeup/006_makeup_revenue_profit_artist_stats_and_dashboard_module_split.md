# Task 071 - Thống kê makeup: chuyên viên xem riêng + admin dashboard tách nhóm module

## Input ban đầu
- Chuyên viên makeup cần xem doanh thu/lợi nhuận riêng của chính mình.
- Admin dashboard cần hiển thị 3 nhóm thống kê doanh thu/lợi nhuận/đơn hàng:
  - toàn hệ thống,
  - module bán/thuê đồ,
  - module makeup.

## Mục tiêu
- Chuẩn hóa metrics cho makeup analytics theo branch + artist scope.
- Thêm màn hình `My Makeup Stats` cho role `makeup_artist`.
- Mở rộng dashboard admin theo mô hình split metrics theo module.

## Phụ thuộc
- `docs/tasks/modules/makeup/005_makeup_packages_setup_admin_and_artist.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`

## Mapping màn hình/source
- Artist stats UI:
  - `apps/web/src/app/[locale]/makeup/my-stats/page.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupMyStatsPage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupMyStatsPage.ts` (new)
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts`
- Dashboard split metrics:
  - `apps/web/src/features/dashboard/hooks/useDashboardOverviewPage.ts`
  - `apps/web/src/features/dashboard/components/DashboardHomePage.tsx`
  - `apps/web/src/server/data-access/dashboard.ts`
  - `apps/web/src/server/services/dashboardService.ts`
  - `apps/web/src/types/dashboardOverview.ts`
- Makeup analytics backend:
  - `apps/web/src/server/data-access/makeup.ts`
  - `apps/web/src/server/services/makeupService.ts`
  - `apps/web/src/app/api/makeup/stats/my/route.ts` (new)
  - `apps/web/src/types/makeupModule.ts`

## Quy tắc nghiệp vụ bắt buộc
- `makeup_artist` chỉ xem stats của chính mình (`artistProfileId = currentUser`).
- Dashboard admin hiển thị đầy đủ 3 nhóm:
  - `ALL_MODULES`,
  - `RENTAL_SALE_MODULE`,
  - `MAKEUP_MODULE`.
- Chỉ số tối thiểu cho mỗi nhóm:
  - `revenue`, `profit`, `orderCount` (hoặc eventCount tương đương với makeup).
- Dữ liệu makeup không trộn với rental/sale khi tính nhóm module.
- Tuân thủ branch isolation + RBAC cho toàn bộ API/report.

## In-scope
- API stats cho makeup_artist (my-stats).
- Dashboard DTO/API/UI mở rộng cho split metrics theo module.
- Mapping công thức revenue/profit makeup rõ ràng và nhất quán với chuẩn tài chính hiện có.
- i18n labels cho nhóm số liệu mới.

## Out-of-scope
- BI dashboard nâng cao nhiều biểu đồ drill-down.
- Export PDF/Excel riêng cho makeup stats.
- Realtime streaming metrics.

## Prompt gợi ý cho Codex
```text
Mục tiêu: bổ sung thống kê makeup cho chuyên viên và split dashboard admin theo module.

Yêu cầu:
1) Thêm route/UI `makeup/my-stats` cho role makeup_artist (chỉ dữ liệu của chính mình).
2) Mở rộng dashboard overview thành 3 nhóm metrics: all / rental-sale / makeup.
3) Mỗi nhóm có revenue, profit, orderCount.
4) Đảm bảo không trộn nguồn dữ liệu makeup với rental-sale.
5) Cập nhật types + i18n labels + query/service/API theo đúng kiến trúc.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Makeup artist xem được stats riêng ở route my-stats.
- Dashboard admin hiển thị đủ 3 nhóm metrics theo module.
- Công thức/mapping số liệu đúng và không trộn nguồn dữ liệu.
- RBAC/branch isolation đúng cho API stats.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Login makeup_artist:
  - vào `/[locale]/makeup/my-stats` thấy số liệu riêng.
  - không xem được dữ liệu stats của artist khác.
- Login admin/manager:
  - dashboard có 3 nhóm card all / rental-sale / makeup.
- So sánh chéo nhanh:
  - `ALL_MODULES` >= `RENTAL_SALE_MODULE` + `MAKEUP_MODULE` theo tolerance business rule.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 071 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 070 /a - [ ] 071 | Makeup analytics: artist my-stats + admin dashboard revenue/profit/order split by module | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 071 |- [x] 071 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 071
  - Task file: docs/tasks/modules/makeup/006_makeup_revenue_profit_artist_stats_and_dashboard_module_split.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
