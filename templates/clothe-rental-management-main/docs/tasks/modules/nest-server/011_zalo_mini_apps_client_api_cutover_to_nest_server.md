# Task 102 - Cutover callers ở `apps/zalo-mini-apps` sang API của `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Mini apps còn gọi route cũ hoặc dùng base URL chưa chuẩn hóa.
- Cần đồng bộ auth/session headers và endpoint contract mới.

## Mục tiêu
- Chuyển toàn bộ callers mini-app sang Nest API.
- Đảm bảo flows login/config/order/payment không regression.

## Architecture Impact
- Layers affected:
  - mini-app http client + feature service layer
- Domains affected:
  - config/auth/order/payment/report trong các mini-app

## Current State vs Target State
- Current:
  - caller mini-app còn mixed calls.
- Target (Architecture V2):
  - caller mini-app dùng endpoint contract Nest thống nhất theo env.

## Boundary Rules
- Must keep:
  - header auth/session parity.
  - service-layer ownership (UI không gọi trực tiếp endpoint).
  - mọi truy cập Supabase DB của mini-app domain phải đi qua `apps/server`.
- Forbidden:
  - hardcode production url trong component/feature code.
  - đổi flow UI/business ngoài phạm vi API transport.
  - gọi Supabase trực tiếp từ mini-app cho domain đã cutover.

## Compatibility & Migration Strategy
- Compatibility window:
  - dùng compatibility routes cho endpoint chưa cutover hoàn toàn.
- Rollback condition:
  - rollback từng mini-app theo module nếu có regression.

## Phụ thuộc
- `docs/tasks/modules/nest-server/009_nest_server_zalo_mini_app_api_migration.md`
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- `apps/zalo-mini-apps/**/src/features/**/services/**`
- `apps/zalo-mini-apps/**/src/lib/httpClient.ts`
- `apps/zalo-mini-apps/**/.env*` (`VITE_NEST_API_BASE_URL`)

## Quy tắc kỹ thuật bắt buộc
- Giữ nguyên xử lý token/session headers.
- Giữ backward fallback env hợp lý trong phase chuyển đổi.
- Không đổi contract handling trong UI/state ngoài API transport.

## In-scope
- Cập nhật base URL + endpoint paths.
- Cập nhật config bootstrap/env docs cho mini-apps.
- Cập nhật tests/mocks API layer.

## Out-of-scope
- Refactor business logic mini-app.
- Thay đổi flow voice/form UI.

## Done Criteria (Architecture)
- [ ] Mini-app callers dùng endpoint contract Nest cho domain đã migrate.
- [ ] Không còn dependency source-of-truth vào web API cũ.
- [ ] Không còn direct Supabase DB access trong mini-app cho domain đã cutover.

## Done Criteria (Coding)
- [ ] callers mini-app cutover thành công.
- [ ] lint các file đã đổi pass (ít nhất mức cục bộ; full app nếu khả thi).

## Regression Scope
- [ ] load config.
- [ ] login/session.
- [ ] create order/payment/report flow chính theo từng app.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/011 |- [x] Modules/Nest-Server/011 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/011
  - Task file: docs/tasks/modules/nest-server/011_zalo_mini_apps_client_api_cutover_to_nest_server.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
