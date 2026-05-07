# Task 103 - Remove API ở `apps/web` sau cutover + cleanup legacy server layer

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`
- `docs/features/endpoint_mapping_inventory.md`

## Input ban đầu
- Sau cutover callers, web API business layer trở thành duplicate và dễ gây drift.

## Mục tiêu
- Gỡ bỏ route/business server layer cũ trong web theo mapping đã migrate.
- Giữ lại tối thiểu các route ngoại lệ kiến trúc được chấp thuận.

## Architecture Impact
- Layers affected:
  - web compatibility routes
  - legacy web server services/data-access cleanup
- Domains affected:
  - toàn bộ domain đã cutover hoàn tất

## Current State vs Target State
- Current:
  - route cũ và code legacy còn tồn tại song song.
- Target (Architecture V2):
  - web chỉ giữ UI + compatibility tối thiểu cần thiết.

## Boundary Rules
- Must keep:
  - chỉ xóa endpoint đã xác nhận callers cutover.
  - tài liệu endpoint removed cập nhật đầy đủ.
  - sau cleanup, `apps/web` không còn thực hiện truy cập Supabase DB cho domain đã migrate.
- Forbidden:
  - xóa route chưa có mapping cutover hoàn tất.
  - để lại dead import/reference đến legacy layer.

## Compatibility & Migration Strategy
- Compatibility window:
  - với endpoint chưa remove được, giữ trạng thái `legacy-forward` có deadline rõ.
- Rollback condition:
  - nếu remove gây regression, restore selective routes theo mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/010_web_client_api_cutover_to_nest_server.md`
- `docs/tasks/modules/nest-server/011_zalo_mini_apps_client_api_cutover_to_nest_server.md`

## Mapping màn hình/source
- `apps/web/src/app/api/**`
- `apps/web/src/server/services/**`
- `apps/web/src/server/data-access/**`
- docs/runbooks liên quan endpoint cũ

## Quy tắc kỹ thuật bắt buộc
- Remove theo checklist endpoint-level, không remove mù.
- Với route ngoại lệ còn giữ lại, phải có lý do kiến trúc rõ.

## In-scope
- Remove API routes đã migrate/cutover.
- Remove legacy service/data-access không còn dùng.
- Cập nhật docs endpoint removed.

## Out-of-scope
- Migrate business logic mới.
- Refactor lớn ngoài phạm vi cleanup.

## Done Criteria (Architecture)
- [x] `apps/web/src/app/api/**` không còn business source-of-truth endpoint cho domain đã migrate.
- [x] Legacy web server layer cleanup không làm vi phạm flow kiến trúc.
- [x] `apps/web` không còn direct Supabase DB access cho domain đã migrate.

## Done Criteria (Coding)
- [x] search/reference xác nhận endpoint removed đúng kế hoạch.
- [x] lint/typecheck vùng code bị ảnh hưởng pass.

## Regression Scope
- [ ] smoke test web + mini-app sau remove.
- [x] verify không còn caller trỏ route cũ đã remove.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/012 |- [x] Modules/Nest-Server/012 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/012
  - Task file: docs/tasks/modules/nest-server/012_remove_web_api_routes_and_legacy_server_layer.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
