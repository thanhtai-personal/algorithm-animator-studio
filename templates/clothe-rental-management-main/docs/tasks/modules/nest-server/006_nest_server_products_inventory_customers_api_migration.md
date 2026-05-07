# Task 097 - Migrate Products/Inventory/Customers APIs sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Catalog + inventory + customers đang phục vụ qua web API legacy.
- Dashboard/POS và mini-app flows phụ thuộc route cũ.

## Mục tiêu
- Chuyển APIs products/inventory/customers sang Nest với parity behavior.
- Chuẩn hóa module boundaries cho 3 domain này trong `apps/server`.

## Architecture Impact
- Layers affected:
  - products/inventory/customers modules server
  - caller services ở web/mini-app
- Domains affected:
  - product catalog, item lifecycle, customer crm/typeahead
- `apps/server` module layers touched:
  - `presentation`, `application`, `domain`, `infrastructure`

## Current State vs Target State
- Current:
  - API source-of-truth còn ở web layer.
- Target (Architecture V2):
  - source-of-truth chuyển sang Nest theo domain modules.

## Boundary Rules
- Must keep:
  - status transition item parity.
  - search/typeahead/filter contract parity.
  - DB query chỉ ở infrastructure/data-access.
- Forbidden:
  - controller gọi trực tiếp Supabase.
  - duplicate business rule giữa web và server.

## Compatibility & Migration Strategy
- Compatibility window:
  - giữ web legacy routes trong trạng thái forwarding cho endpoint đã migrate.
- Rollback condition:
  - regression ở mutation trọng yếu -> rollback theo domain endpoint mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/005_nest_server_settings_and_feature_flags_api_migration.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/008_customers_crm_module.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/products/**`
  - `apps/web/src/app/api/inventory/**`
  - `apps/web/src/app/api/customers/**`
  - `apps/web/src/server/services/{productsService,inventoryService,customersService}.ts`
- Đích:
  - `apps/server/src/modules/products/**`
  - `apps/server/src/modules/inventory/**`
  - `apps/server/src/modules/customers/**`

## Quy tắc kỹ thuật bắt buộc
- Không đổi rule lifecycle/status items.
- Không đổi behavior filter/search mà UI đang phụ thuộc.
- Giữ audit/status logs parity nếu endpoint cũ có side-effects tương ứng.

## In-scope
- Migrate controllers/services/dto/repositories cho 3 domain.
- Test CRUD + list/search cốt lõi.
- Chuẩn hóa pagination/filter query params.

## Out-of-scope
- Redesign UI products/inventory/customers.
- Thay đổi schema DB.

## Done Criteria (Architecture)
- [x] 3 domain source-of-truth ở `apps/server`.
- [x] Layering trong module tuân thủ `presentation/application/domain/infrastructure`.
- [x] Không còn DB query ngoài infrastructure/data-access.

## Done Criteria (Coding)
- [x] APIs 3 domain chạy parity behavior.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [x] tạo/sửa product.
- [x] tạo/sửa inventory item + status transition.
- [x] tạo/sửa customer + typeahead/search.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/006 |- [x] Modules/Nest-Server/006 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/006
  - Task file: docs/tasks/modules/nest-server/006_nest_server_products_inventory_customers_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
