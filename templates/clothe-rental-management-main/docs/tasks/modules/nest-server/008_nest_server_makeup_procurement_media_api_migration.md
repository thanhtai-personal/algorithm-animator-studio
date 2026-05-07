# Task 099 - Migrate Makeup/Procurement/Media APIs sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Makeup/procurement/media APIs đang ở web legacy layer.
- Các domain này có rule riêng và cần giữ isolation với rental core.

## Mục tiêu
- Migrate APIs makeup/procurement/media sang Nest với parity behavior.
- Giữ module isolation + RBAC/branch scope parity.

## Architecture Impact
- Layers affected:
  - modules: makeup/procurement/media trên server
  - callers admin và mini-app liên quan
- Domains affected:
  - makeup booking/inventory/order
  - procurement intake/payment-expense
  - media upload/quota/delete
- `apps/server` module layers touched:
  - `presentation`, `application`, `domain`, `infrastructure`

## Current State vs Target State
- Current:
  - API source-of-truth cho 3 domain còn nằm web.
- Target (Architecture V2):
  - source-of-truth chuyển sang Nest theo từng module domain.

## Boundary Rules
- Must keep:
  - makeup module isolation khỏi rental domain khi không có contract rõ.
  - media quota policy parity.
  - procurement immutable constraints parity.
- Forbidden:
  - trộn logic domain giữa makeup và rental trong cùng endpoint/service.
  - query Supabase ngoài infrastructure/data-access.

## Compatibility & Migration Strategy
- Compatibility window:
  - route cũ giữ forwarding cho endpoint đã migrate.
- Rollback condition:
  - regression domain-specific -> rollback endpoint group theo mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/007_nest_server_orders_returns_payments_reports_api_migration.md`
- `docs/tasks/modules/makeup/012_makeup_module_isolation_regression_guard_against_rental_module.md`
- `docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
- `docs/tasks/043_media_management_dashboard_and_product_picker.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/makeup/**`
  - `apps/web/src/app/api/procurement/**`
  - `apps/web/src/app/api/media/**`
  - `apps/web/src/server/services/{makeupService,procurementService,mediaService}.ts`
- Đích:
  - `apps/server/src/modules/makeup/**`
  - `apps/server/src/modules/procurement/**`
  - `apps/server/src/modules/media/**`

## Quy tắc kỹ thuật bắt buộc
- Giữ role/branch scope parity.
- Giữ behavior upload/delete/quota parity cho media.
- Giữ behavior intake/payment-expense parity cho procurement.

## In-scope
- Migrate endpoint + dto + orchestration cho 3 module.
- Test flow trọng yếu mỗi module.
- Chuẩn hóa error/status contract.

## Out-of-scope
- Rework UI admin pages.
- Đổi schema domain.

## Done Criteria (Architecture)
- [x] 3 module source-of-truth ở `apps/server`.
- [x] Layering module tuân thủ doc 012.
- [x] Không query DB ngoài infrastructure/data-access.

## Done Criteria (Coding)
- [x] APIs 3 module chạy parity behavior.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] tạo booking makeup + role scope.
- [ ] nhập hàng procurement + expense payment.
- [ ] upload/delete media + quota behavior.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/008 |- [x] Modules/Nest-Server/008 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/008
  - Task file: docs/tasks/modules/nest-server/008_nest_server_makeup_procurement_media_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
