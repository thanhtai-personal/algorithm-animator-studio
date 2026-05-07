# Task 101 - Cutover callers ở `apps/web` sang API của `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Web client còn gọi nhiều route local `/api/**` của Next runtime.
- Sau migrate, source-of-truth là `apps/server`.

## Mục tiêu
- Chuyển caller web sang endpoint contract Nest.
- Giữ nguyên layering client và không đổi business flow.

## Architecture Impact
- Layers affected:
  - web service/query layer
  - compatibility routes window
- Domains affected:
  - toàn bộ domain đã migrate tại thời điểm cutover

## Current State vs Target State
- Current:
  - caller web còn mixed giữa route local và route mới.
- Target (Architecture V2):
  - caller web dùng base URL/contract Nest theo env.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - token/session forwarding parity.
  - mọi truy cập Supabase DB cho nghiệp vụ domain đã migrate phải đi qua `apps/server`.
- Forbidden:
  - gọi HTTP trực tiếp từ component.
  - gọi ngược web server internals từ client code.
  - dùng Supabase client trực tiếp ở `apps/web` cho domain đã cutover.

## Compatibility & Migration Strategy
- Compatibility window:
  - duy trì route compatibility cho endpoint chưa cutover hết.
- Rollback condition:
  - rollback callers theo domain nếu regression production.

## Phụ thuộc
- `docs/tasks/modules/nest-server/004_nest_server_auth_api_migration.md`
- `docs/tasks/modules/nest-server/009_nest_server_zalo_mini_app_api_migration.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- `apps/web/src/features/**/services/**`
- `apps/web/src/lib/**` (api/http client)
- `apps/web/.env*` (`NEST_API_BASE_URL`)

## Quy tắc kỹ thuật bắt buộc
- Không đổi business semantics trong service layer.
- Cần có mapping caller chuyển đổi rõ ràng theo endpoint inventory.
- Kiểm soát CORS/cookie/header tương thích với server mới.

## In-scope
- Cập nhật base URL + endpoint path cho web callers.
- Cập nhật auth headers/cookies forwarding.
- Cập nhật tests/mocks liên quan API calls.

## Out-of-scope
- Refactor UI lớn.
- Thay đổi contract không cần thiết.

## Done Criteria (Architecture)
- [x] Web callers của domain đã migrate không phụ thuộc route source-of-truth ở web.
- [x] Layering client giữ nguyên.
- [x] Không còn direct Supabase DB access trong `apps/web` cho domain đã cutover.

## Done Criteria (Coding)
- [x] `apps/web` callers cutover thành công theo mapping.
- [x] lint/typecheck các file đã đổi pass (ít nhất mức cục bộ; full app nếu khả thi).

## Regression Scope
- [ ] login/session bootstrap.
- [ ] dashboard load + CRUD đại diện domain đã cutover.
- [ ] network verify request trỏ về Nest endpoint contract.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/010 |- [x] Modules/Nest-Server/010 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/010
  - Task file: docs/tasks/modules/nest-server/010_web_client_api_cutover_to_nest_server.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
