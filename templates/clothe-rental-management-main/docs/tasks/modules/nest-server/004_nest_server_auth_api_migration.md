# Task 095 - Migrate Auth APIs từ `apps/web` sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Auth endpoints hiện nằm ở `apps/web/src/app/api/auth/**`.
- Nhiều callers đang phụ thuộc trực tiếp route auth của web.

## Mục tiêu
- Migrate auth endpoints sang `apps/server` với parity behavior.
- Cung cấp compatibility/forwarding an toàn trong giai đoạn cutover.

## Architecture Impact
- Layers affected:
  - backend auth module
  - caller auth service ở web/mini-app
- Domains affected:
  - sign-in / refresh / sign-out / user context
- `apps/server` module layers touched:
  - `presentation`, `application`, `infrastructure` (và `domain` nếu mở rộng rule)

## Current State vs Target State
- Current:
  - auth source-of-truth còn ở web layer.
- Target (Architecture V2):
  - auth source-of-truth ở `apps/server`.

## Boundary Rules
- Must keep:
  - controller chỉ routing/validation/response mapping.
  - logic auth orchestration ở application service.
  - query Supabase nằm trong infrastructure/data-access.
- Forbidden:
  - đổi semantics auth trong cùng batch migration transport.
  - thêm DB logic mới ở `apps/web/src/server/**`.

## Compatibility & Migration Strategy
- Compatibility window:
  - giữ web route auth ở dạng forward/proxy sang Nest cho đến khi caller cutover xong.
- Rollback condition:
  - regression auth production -> rollback theo endpoint mapping auth.

## Phụ thuộc
- `docs/tasks/modules/nest-server/003_nest_server_core_infra_and_runtime_baseline.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/auth/**`
  - `apps/web/src/server/services/authService.ts`
  - `apps/web/src/server/data-access/auth.ts`
- Đích:
  - `apps/server/src/modules/auth/**`

## Quy tắc kỹ thuật bắt buộc
- Không đổi semantics của sign-in/refresh/sign-out/me.
- Giữ profile/bootstrap behavior tương thích callers.
- Map lỗi auth đúng status code và error contract.

## In-scope
- Migrate auth controllers/services/dto.
- Mapping cookie/header/token tương thích.
- Test cơ bản cho flow auth.

## Out-of-scope
- Redesign auth model.
- Thay đổi UX auth phía client.

## Done Criteria (Architecture)
- [x] Auth source-of-truth chuyển sang `apps/server`.
- [x] Không có Supabase query ngoài infrastructure/data-access.
- [x] Compatibility routes auth còn lại chỉ là forwarding.

## Done Criteria (Coding)
- [x] Auth endpoints trên Nest hoạt động parity với endpoint cũ.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [x] sign-in sai/mật khẩu đúng-sai.
- [x] refresh token.
- [x] sign-out token invalid.
- [x] auth context (`/user`) khi profile thiếu/đủ.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/004 |- [x] Modules/Nest-Server/004 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/004
  - Task file: docs/tasks/modules/nest-server/004_nest_server_auth_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
