# Task 092 - Nest Server API Migration Foundation: tách API khỏi `apps/web` + cập nhật app consumers

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Khi ghi task migrate/cutover caller, mặc định dùng URL này cho môi trường production.
- Env key chuẩn cho caller apps:
  - Server/Next runtime: `NEST_API_BASE_URL`
  - Vite mini apps: `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md` (constitution, ưu tiên cao nhất)
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Nhiều API backend còn nằm trong `apps/web/src/app/api/**` (Next Route Handlers).
- `apps/server` đã có baseline runtime nhưng chưa phủ hết domain.
- Cần chuyển source-of-truth API sang Nest mà không phá flow hiện tại.

## Mục tiêu
- Thiết lập `apps/server` thành backend API source-of-truth cho các domain ưu tiên.
- Giữ `apps/web/src/app/api/**` ở vai trò compatibility adapter tạm thời.
- Cập nhật web + mini-app consumers sang contract endpoint mới.
- Không vi phạm kiến trúc client:
  - `Component -> Hook -> Query -> Service -> API`

## Architecture Impact
- Layers affected:
  - API ownership (`apps/web/app/api` -> `apps/server`)
  - Consumer service base URL + caller cutover
  - Compatibility forwarding layer
- Domains affected:
  - auth/session
  - zalo-mini-app config/session/rental access
- `apps/server` module structure affected:
  - `presentation`, `application`, `domain`, `infrastructure` (theo doc 012)

## Current State vs Target State
- Current:
  - API business còn phân tán giữa web route handlers và server.
  - Một phần caller vẫn gọi legacy paths.
- Target (Architecture V2):
  - `apps/server` là API source-of-truth.
  - `apps/web/src/app/api/**` chỉ là compatibility forwarding tạm thời.
  - Supabase DB access chỉ tồn tại trong `apps/server`.

## Boundary Rules
- Must keep:
  - Client layering `Component -> Hook -> Query -> Service -> API`.
  - Backend layering:
    - `Controller -> Application Service -> Repository/Data-access -> Supabase`.
  - Với module backend mới/chỉnh sửa:
    - Ưu tiên tách rõ `presentation/application/domain/infrastructure`.
- Forbidden:
  - Thêm endpoint business mới trực tiếp ở web route layer cho domain đã migrate.
  - Duplicate business rule ở cả web legacy API và Nest API.
  - Đặt Supabase query ngoài infrastructure/data-access layer của module `apps/server`.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giữ route cũ theo cơ chế proxy/forward sang Nest trong khi caller chưa cutover hết.
  - Chấp nhận song song `/api/...` (legacy) và `/api/v1/...` (new contract) cho nhóm đã migrate.
- Rollback condition:
  - Nếu regression auth/session/domain critical xảy ra ở production:
    - fallback traffic qua compatibility routes đã mapping,
    - hoặc rollback caller về endpoint cũ theo bảng mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/002_nest_server_api_inventory_and_contract_lock.md`
- `docs/tasks/modules/nest-server/003_nest_server_core_infra_and_runtime_baseline.md`
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`

## Mapping màn hình/source
- Legacy source:
  - `apps/web/src/app/api/**`
  - `apps/web/src/server/services/**`
  - `apps/web/src/server/data-access/**`
- Target source:
  - `apps/server/src/**` theo domain modules
- Consumer cần cutover:
  - `apps/web/src/features/**/services/**`
  - `apps/zalo-mini-apps/**/src/features/**/services/**`
  - `apps/mobile/**` (nếu có gọi trực tiếp API)

## Quy tắc kỹ thuật bắt buộc
- Không để client gọi trực tiếp DB/Supabase cho nghiệp vụ chính.
- API auth/session đồng nhất giữa web và mini-app.
- Không đổi business rule khi migrate transport layer.
- Endpoint mới phải có:
  - DTO validation,
  - error contract nhất quán,
  - trace được bằng request-id/logging.
- Với phần `apps/server` được chỉnh sửa trong task này:
  - nếu chưa tách đủ 4 lớp trong module vì phase migration, phải ghi rõ `Known gaps` và kế hoạch chuẩn hóa.

## In-scope
- Lập inventory endpoint và mapping endpoint đích trên Nest.
- Hoàn thiện runtime baseline cần thiết cho migration:
  - global prefix/versioning,
  - validation,
  - exception filter/interceptor logging,
  - config env + CORS.
- Migrate nhóm endpoint ưu tiên:
  - auth/session,
  - zalo-mini-app config,
  - zalo-mini-app auth/session,
  - zalo-mini-app rental access.
- Cập nhật web/mini-app consumers sang contract mới.
- Giữ compatibility cho endpoint cũ trong thời gian cutover.

## Out-of-scope
- Rewrite toàn bộ business/data-access một lần.
- Thay đổi schema DB hoặc business semantics không liên quan migration API.
- Hard cut toàn bộ endpoint cũ trong cùng một PR.

## Done Criteria (Architecture)
- [ ] Có artifact mapping endpoint cũ -> mới + trạng thái migrate.
- [ ] `apps/server` phục vụ được endpoint ưu tiên với contract rõ ràng.
- [ ] Consumer chính (web + mini-app liên quan) gọi endpoint mới thành công.
- [ ] Có compatibility strategy cho endpoint cũ (ít nhất cho nhóm đã migrate).
- [ ] Không thêm Supabase query ở runtime ngoài `apps/server`.
- [ ] Với thay đổi trong `apps/server`, không có query DB nằm ngoài infrastructure/data-access layer của module.

## Done Criteria (Coding)
- [ ] `cd apps/server && npm run lint` pass.
- [ ] `cd apps/server && npm run build` pass.
- [ ] Validation cục bộ cho các file caller/compatibility đã đổi pass.

## Regression Scope
- [ ] So sánh response contract endpoint cũ/mới cho cùng use case.
- [ ] Verify login/session vẫn hoạt động trên web và mini-app sau cutover.
- [ ] Verify mini-app config không false-negative do sai quyền/env.
- [ ] Verify không có import ngược tầng từ client vào server internals.

## Endpoint mapping artifact
- `docs/features/endpoint_mapping_inventory.md`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu chưa có file module progress thì tạo:
  - `progress/modules/nest-server/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/001 |- [x] Modules/Nest-Server/001 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/001
  - Task file: docs/tasks/modules/nest-server/001_nest_server_api_migration_foundation_and_consumer_cutover.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
