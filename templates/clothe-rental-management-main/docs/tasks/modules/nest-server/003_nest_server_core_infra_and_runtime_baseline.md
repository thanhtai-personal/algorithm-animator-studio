# Task 094 - Nền tảng Nest production-ready: config, validation, error contract, auth baseline

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn cho callers:
  - `NEST_API_BASE_URL`
  - `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- `apps/server` cần baseline runtime đủ chuẩn để nhận batch migrate domain.
- Chưa có tiêu chuẩn đồng nhất cho validation/error/logging/cors/readiness.

## Mục tiêu
- Hoàn thiện runtime baseline cho API Nest (`/api/v1`).
- Chuẩn hóa contract lỗi + validation + request tracing.

## Architecture Impact
- Layers affected:
  - core runtime (`main.ts`, global pipes/filters/interceptors)
  - cross-cutting infra của `apps/server`
- Domains affected:
  - toàn bộ domain API do đây là baseline global

## Current State vs Target State
- Current:
  - runtime thiếu chuẩn chung hoặc chưa đồng nhất toàn server.
- Target (Architecture V2):
  - baseline production-ready, làm nền cho migrate endpoint theo domain.

## Boundary Rules
- Must keep:
  - chỉ `apps/server` chạm Supabase DB.
  - controllers không chứa business logic.
- Forbidden:
  - thêm logic domain vào file bootstrap/global middleware.

## Compatibility & Migration Strategy
- Compatibility window:
  - giữ behavior route hiện có, thay đổi ở layer global phải backward compatible cho endpoint đã migrate.
- Rollback condition:
  - nếu baseline gây regression toàn cục, rollback theo từng thay đổi global (pipe/filter/interceptor/cors).

## Phụ thuộc
- `docs/tasks/modules/nest-server/002_nest_server_api_inventory_and_contract_lock.md`

## Mapping màn hình/source
- `apps/server/src/main.ts`
- `apps/server/src/common/**` hoặc `apps/server/src/core/**`
- `apps/server/src/modules/health/**`

## Quy tắc kỹ thuật bắt buộc
- Có `ValidationPipe` global.
- Có exception filter chuẩn hóa lỗi.
- Có interceptor logging/request-id.
- Có config env bắt buộc cho Supabase + API base.
- Có health/readiness endpoint.

## In-scope
- Prefix/versioning chuẩn (`/api/v1`).
- Validation + error envelope + request logging.
- CORS policy cho web + mini app.
- Healthcheck endpoint.

## Out-of-scope
- Migrate business endpoints cụ thể.
- Tối ưu observability sâu (được làm ở task 013).

## Done Criteria (Architecture)
- [ ] Baseline runtime áp dụng nhất quán toàn server.
- [ ] Cross-cutting không vi phạm layering domain.
- [ ] Có health endpoint phục vụ deploy/readiness.

## Done Criteria (Coding)
- [ ] `cd apps/server && npm run lint` pass.
- [ ] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] Gọi thử health endpoint.
- [ ] Smoke test endpoint đại diện để kiểm tra error envelope + validation hoạt động đúng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/003 |- [x] Modules/Nest-Server/003 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/003
  - Task file: docs/tasks/modules/nest-server/003_nest_server_core_infra_and_runtime_baseline.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
