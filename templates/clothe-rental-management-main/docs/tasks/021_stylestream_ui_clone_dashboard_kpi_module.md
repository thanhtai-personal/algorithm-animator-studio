# Task 021 - Stylestream UI Clone: Dashboard KPI Module

## Mục tiêu
- Clone UI dashboard overview theo style `stylestream-showcase-main` vào dashboard module hiện tại.
- Giữ nguyên data source/kpi logic/query có sẵn, chỉ đổi presentation layer.

## Phụ thuộc
- `docs/tasks/013_dashboard_overview_module.md`
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/admin/Dashboard.tsx`
- `templates/stylestream-showcase-main/src/components/DataTable.tsx`
- `templates/stylestream-showcase-main/src/components/StatusChip.tsx`

## Mapping màn hình/source
- Template dashboard: `src/pages/admin/Dashboard.tsx`
- Source target:
  - route: `apps/web/src/app/[locale]/(dashboard)/dashboard/page.tsx`
  - page component: `apps/web/src/features/dashboard/components/DashboardHomePage.tsx`
  - hook/store/query giữ nguyên: `apps/web/src/features/dashboard/hooks|queries|stores/*`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone UI dashboard overview từ stylestream template vào source dashboard page hiện tại.

Yêu cầu:
1) Clone layout cấu trúc:
   - KPI cards grid
   - due/overdue table section
   - alerts/recent activity cards
2) Clone visual details:
   - card radius/border/shadow/spacing
   - status chips/colors
   - header/section title style
3) Dữ liệu:
   - dùng nguyên data từ hooks/queries/store hiện có
   - không đổi KPI definitions/business logic
4) Empty/loading/error states:
   - giữ behavior hiện tại, chỉ đổi UI states theo style clone
5) Responsive:
   - desktop >= 3 cột cards, mobile stack hợp lý
6) Kiến trúc:
   - component chỉ render
   - hook/query/service flow giữ nguyên

Không thay API, không đổi logic tính KPI.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt mức độ giống template:
  - pixel-close (>= 85%)
  - style-close (>= 70%, cho phép khác spacing nhỏ).
- Chốt section map cho dashboard hiện tại:
  - due today, overdue, recent activities.

## In-scope
- Clone UI page dashboard overview.
- Đồng bộ table/card/status visual pattern cho dashboard.

## Out-of-scope
- Thay logic KPI hoặc business rule thống kê.
- Mở rộng module analytics mới.

## Deliverables mong muốn
- Dashboard page có visual gần template stylestream.
- Data hiển thị đúng như trước khi clone.

## Done criteria (coding)
- KPI cards + due list + alert/activity sections render đúng theo style clone.
- Không regress quick actions đang có trên dashboard.
- Loading/empty/error states không bị mất.

## Nhắc test nhanh
- Manual: dashboard với data có/không có.
- Manual: breakpoint mobile/tablet/desktop.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 021 |- [x] 021 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 021
  - Task file: docs/tasks/021_stylestream_ui_clone_dashboard_kpi_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
