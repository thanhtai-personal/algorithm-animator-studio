# Task 086 - Makeup module isolation guard: đảm bảo tách biệt hoàn toàn với module thuê đồ

## Input ban đầu
- Khi mở rộng màn admin makeup, rủi ro cao nhất là làm lẫn domain với hệ thống thuê đồ.
- Cần checklist kỹ thuật và regression guard rõ ràng để đảm bảo tính độc lập.

## Mục tiêu
- Thiết lập guardrail kỹ thuật để module makeup đi riêng, không ảnh hưởng module thuê đồ.
- Chuẩn hóa boundary ở 4 lớp:
  - route/menu,
  - API/service,
  - schema/data,
  - metrics/reporting.
- Có bộ test/regression checklist bắt buộc trước khi release.

## Phụ thuộc
- `docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md`
- `docs/tasks/modules/makeup/009_makeup_admin_overview_kpi_revenue_chart_and_procurement_invoice_summary.md`
- `docs/tasks/modules/makeup/010_makeup_admin_inventory_catalog_with_shopee_links_package_artist.md`
- `docs/tasks/modules/makeup/011_makeup_admin_order_management_crud_makeup_orders_and_purchase_invoices.md`

## Mapping màn hình/source
- Route/auth boundary:
  - `apps/web/src/features/auth/utils/routeAccess.ts`
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts`
- API/service boundary:
  - `apps/web/src/app/api/makeup/**`
  - `apps/web/src/server/services/makeupService.ts`
  - `apps/web/src/server/data-access/makeup*.ts`
- Types/modules:
  - `apps/web/src/types/makeupModule.ts`
  - `apps/web/src/types/ordersDomain.ts` (không import chéo sai tầng)
- Docs/test:
  - `docs/test-case/makeup_module_isolation_regression.md` (new)
  - `progress/modules/makeup/tasks.md`

## Quy tắc nghiệp vụ bắt buộc
- Route separation:
  - admin makeup chỉ nằm dưới `/[locale]/makeup/**`.
  - không đổi behavior các route thuê đồ hiện có.
- API separation:
  - nghiệp vụ makeup đi qua `/api/makeup/**`.
  - không dùng nhầm endpoint `/api/orders/**` của rental khi không có contract tách module.
- Data separation:
  - bảng/domain makeup phải có namespace rõ (`makeup_*`).
  - không ghi chéo vào bảng rental trừ khi có integration contract explicit.
- Metrics separation:
  - dashboard/report makeup phải tách nguồn dữ liệu rental.
- Feature toggle:
  - khi `is_makeup_module_enabled = false`, UI/API makeup bị chặn/ẩn đúng như policy.

## In-scope
- Rà soát và chốt boundary matrix cho module makeup.
- Bổ sung regression checklist/test-case tài liệu hóa.
- Hardening các điểm coupling cao (route, query keys, shared DTO, dashboard metrics).

## Out-of-scope
- Viết full e2e automation suite cho toàn hệ thống.
- Refactor lớn toàn bộ module thuê đồ.

## Prompt gợi ý cho Codex
```text
Mục tiêu: harden tính độc lập module makeup với module thuê đồ.

Yêu cầu:
1) Audit route/API/schema/types để phát hiện coupling sai boundary.
2) Sửa các điểm coupling khiến makeup phụ thuộc nhầm rental domain.
3) Chuẩn hóa namespace data/API makeup.
4) Bổ sung tài liệu regression checklist bắt buộc trước release.
5) Verify toggle makeup ON/OFF không làm ảnh hưởng flow thuê đồ.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có tài liệu isolation regression checklist cho module makeup.
- Boundary route/API/schema/metrics được kiểm tra và chốt rõ.
- Không còn coupling sai tầng giữa makeup và rental ở phạm vi task.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Toggle makeup OFF: route/menu/API makeup bị chặn đúng policy.
- Toggle makeup ON: module makeup chạy bình thường.
- Tạo/cập nhật dữ liệu makeup không làm thay đổi số liệu/list của module thuê đồ.
- Smoke test nhanh orders/inventory thuê đồ sau khi merge các task makeup admin.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng `Modules/Makeup/012` thì thêm vào:
  - `progress/modules/makeup/tasks.md`
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/012 |- [x] Modules/Makeup/012 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/012
  - Task file: docs/tasks/modules/makeup/012_makeup_module_isolation_regression_guard_against_rental_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
