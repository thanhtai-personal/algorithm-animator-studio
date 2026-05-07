# Task 030 - Stylestream UI Clone: Motion + Charts + Shared Component Parity

## Mục tiêu
- Clone toàn bộ motion language, chart presentation, và shared UI primitives từ Stylestream để đồng bộ cảm giác giao diện trên mọi module.
- Chuẩn hóa loading/empty/error/skeleton states theo template thay vì style rời rạc.
- Giữ nguyên data/query/business logic hiện có.

## Phụ thuộc
- `docs/tasks/021_stylestream_ui_clone_dashboard_kpi_module.md`
- `docs/tasks/023_stylestream_ui_clone_orders_payments_reports.md`
- `docs/tasks/026_stylestream_ui_clone_visual_hardening_and_qa.md`
- `docs/tasks/029_stylestream_ui_clone_multitheme_dark_light_palette.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/index.css`
- `templates/stylestream-showcase-main/src/components/ui/chart.tsx`
- `templates/stylestream-showcase-main/src/components/DataTable.tsx`
- `templates/stylestream-showcase-main/src/components/DateRangePicker.tsx`
- `templates/stylestream-showcase-main/src/components/LoadingSkeleton.tsx`
- `templates/stylestream-showcase-main/src/components/EmptyState.tsx`
- `templates/stylestream-showcase-main/src/components/StatusChip.tsx`
- `templates/stylestream-showcase-main/src/components/Stepper.tsx`

## Mapping màn hình/source
- Shared components:
  - `apps/web/src/components/data-display/DataTableShell.tsx`
  - `apps/web/src/components/filters/FilterBarShell.tsx`
  - `apps/web/src/components/*` (các primitive status/chip/empty/loading/stepper tương đương)
- Chart surfaces:
  - `apps/web/src/features/dashboard/components/DashboardHomePage.tsx`
  - `apps/web/src/features/reports/components/RevenueReportPage.tsx`
  - `apps/web/src/features/reports/components/UtilizationReportPage.tsx`
  - `apps/web/src/features/reports/components/IncidentsReportPage.tsx`
- Motion/tokens:
  - `apps/web/src/app/globals.css`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone motion + chart + shared components style từ Stylestream.

Yêu cầu:
1) Motion parity:
   - clone animation utilities (fade/slide/scale/stagger) theo template
   - apply nhất quán cho page transitions, cards, menus, modals, table rows
2) Chart parity:
   - clone chart container/legend/tooltip/grid style từ template
   - map vào dashboard/reports charts hiện có
   - giữ nguyên data source/query logic
3) Shared primitive parity:
   - DataTable, filter bar, status chips, steppers, date range picker, empty/loading skeleton
   - state visuals (loading/empty/error/offline) đồng bộ trên mọi module chính
4) Accessibility/performance:
   - respect `prefers-reduced-motion`
   - animation duration/easing hợp lý, không gây jank trên mobile
5) Constraints:
   - không thay API, không thay business rules
   - không đổi kiến trúc Component -> Hook -> Query -> Service

Kết quả: UI transitions/charts/components giống template rõ rệt và đồng nhất toàn app.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt chart library baseline:
  - giữ lib hiện tại và chỉ clone style
  - hoặc migrate nhẹ nếu cần để đạt parity (không đổi data contract).
- Chốt mức độ animation:
  - full motion
  - hoặc reduced motion default cho môi trường low-power.

## In-scope
- Motion utilities và chart style.
- Shared components visual parity.
- State UX parity: loading/empty/error/offline.

## Out-of-scope
- Thêm loại báo cáo mới.
- Thay đổi nghiệp vụ dashboard/reports/orders/payments.

## Deliverables mong muốn
- Charts nhìn giống template ở card/legend/tooltip/axis language.
- Animation đồng bộ và không rời rạc giữa các route.
- Shared components thống nhất trên toàn bộ module.

## Done criteria (coding)
- Dashboard + 3 report pages đạt chart parity rõ ràng.
- Loading/empty/error visuals đồng bộ ở các route chính.
- Motion utilities áp dụng rộng, có fallback giảm chuyển động.
- Không regression data accuracy hoặc actions nghiệp vụ.

## Nhắc test nhanh
- Manual: dashboard/reports charts trên desktop + mobile.
- Manual: loading/empty/error path của products/orders/payments/reports/showroom.
- Manual: `prefers-reduced-motion` behavior (nếu môi trường hỗ trợ).
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 030 |- [x] 030 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 030
  - Task file: docs/tasks/030_stylestream_ui_clone_motion_charts_and_component_parity.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
