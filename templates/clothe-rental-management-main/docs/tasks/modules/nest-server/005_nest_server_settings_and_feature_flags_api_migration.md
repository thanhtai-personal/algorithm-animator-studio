# Task 096 - Migrate Settings/System/Feature-Flags APIs sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Settings/system APIs còn ở web legacy routes.
- Feature flags (đặc biệt mini-app) phụ thuộc `system_settings`.

## Mục tiêu
- Chuyển settings/system/feature flags endpoints sang Nest.
- Giữ RBAC và error semantics tương thích.

## Architecture Impact
- Layers affected:
  - settings + platform-config modules ở server
  - callers đọc config ở web/mini-app
- Domains affected:
  - settings/general/users/branches/... và config feature flags
- `apps/server` module layers touched:
  - `presentation`, `application`, `infrastructure`

## Current State vs Target State
- Current:
  - endpoint settings/config phụ thuộc web route + web server layer.
- Target (Architecture V2):
  - endpoint settings/config source-of-truth ở `apps/server`.

## Boundary Rules
- Must keep:
  - RBAC branch scope parity.
  - DB access chỉ trong infrastructure/data-access.
  - chỉ `apps/server` được phép truy cập Supabase DB cho settings/feature flags.
- Forbidden:
  - nuốt lỗi permission thành disabled giả.
  - đặt logic flags ở client thay vì backend authoritative source.

## Compatibility & Migration Strategy
- Compatibility window:
  - giữ route settings/config cũ ở web dưới dạng forwarding trong phase cutover.
- Rollback condition:
  - regression quyền/feature flags -> rollback endpoint group theo mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/004_nest_server_auth_api_migration.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/settings/**`
  - `apps/web/src/app/api/zalo-mini-app/config/route.ts`
  - `apps/web/src/server/services/settingsService.ts`
  - `apps/web/src/server/data-access/settings.ts`
- Đích:
  - `apps/server/src/modules/settings/**`
  - `apps/server/src/modules/platform-config/**` (hoặc module tương đương)

## Quy tắc kỹ thuật bắt buộc
- Giữ nguyên RBAC cho settings update.
- Feature flags có fallback rõ nhưng không che lấp lỗi quyền.
- Log lỗi env/quyền DB đầy đủ để debug.

## In-scope
- Migrate endpoints settings/system.
- Migrate endpoint mini-app config.
- Test read/write settings + config flag.

## Out-of-scope
- Redesign settings UI.
- Đổi schema settings.

## Done Criteria (Architecture)
- [x] Settings/config source-of-truth ở `apps/server`.
- [x] Không có query DB ngoài infrastructure/data-access.
- [x] Web route liên quan chỉ còn compatibility forwarding.

## Done Criteria (Coding)
- [x] Endpoint mini-app config đọc đúng DB flag.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [x] bật/tắt feature flag rồi gọi config endpoint.
- [x] test quyền update settings theo role/branch.
- [x] verify lỗi permission không bị fallback sai ngữ nghĩa.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/005 |- [x] Modules/Nest-Server/005 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/005
  - Task file: docs/tasks/modules/nest-server/005_nest_server_settings_and_feature_flags_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
