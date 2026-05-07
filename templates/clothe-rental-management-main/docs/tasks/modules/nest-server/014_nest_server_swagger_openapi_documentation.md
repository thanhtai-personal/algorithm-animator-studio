# Task 105 - Swagger/OpenAPI documentation cho `apps/server` (NestJS)

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/009_delivery_observability_and_quality.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- `apps/server` chưa có Swagger/OpenAPI endpoint để discover contract API.
- Team cần endpoint tài liệu API phục vụ debug/integration/testing trong phase cutover.

## Mục tiêu
- Bổ sung Swagger/OpenAPI docs trực tiếp trong bootstrap của Nest server.
- Chuẩn hóa entrypoint docs để dễ dùng trong dev/staging/production.

## Architecture Impact
- Layers affected:
  - `apps/server` runtime bootstrap (`main.ts`)
  - config runtime (`common/config`)
  - docs vận hành (`apps/server/README.md`)
- Domain affected:
  - cross-cutting API documentation cho toàn bộ module backend
- App(s) affected:
  - `apps/server`

## Current State vs Target State
- Current:
  - Chưa có endpoint docs OpenAPI cho Nest source-of-truth API.
- Target (Architecture V2):
  - `apps/server` expose Swagger/OpenAPI endpoint nhất quán, phản ánh contract API v1 hiện tại.

## Boundary Rules
- Must keep:
  - Không thêm business endpoint ở `apps/web`.
  - Không thay đổi business semantics của các controller/service hiện hữu.
  - Chỉ sửa cross-cutting runtime/documentation trong `apps/server`.
- Forbidden:
  - Không đưa Supabase/service-role logic vào Swagger setup.
  - Không bypass flow `Controller -> Service -> Data-access`.

## Compatibility & Migration Strategy
- Compatibility window:
  - Không tác động caller contract hiện tại; caller tiếp tục gọi `/api/v1/**` như cũ.
- Deprecation/removal plan:
  - Không có route cũ cần deprecate trong task này.
- Rollback condition:
  - Nếu bootstrap lỗi do Swagger setup, rollback về bootstrap cũ không có Swagger.

## Phụ thuộc
- `docs/tasks/modules/nest-server/003_nest_server_core_infra_and_runtime_baseline.md`
- `docs/tasks/modules/nest-server/013_cutover_regression_observability_and_release_gate.md`

## Mapping màn hình/source
- `apps/server/src/main.ts`
- `apps/server/src/common/config/app-config.service.ts`
- `apps/server/package.json`
- `apps/server/README.md`

## Quy tắc kỹ thuật bắt buộc
- Swagger docs phải phản ánh API prefix/version hiện tại (`/api/v1`).
- Có bearer auth scheme để test protected endpoints.
- Có toggle cấu hình runtime để bật/tắt Swagger theo môi trường.

## In-scope
- Add dependency Swagger cho Nest server.
- Setup `SwaggerModule` + `DocumentBuilder`.
- Expose UI/docs JSON endpoint.
- Update README hướng dẫn truy cập docs endpoint.

## Out-of-scope
- Viết lại decorator đầy đủ cho từng DTO/endpoint domain.
- Thay đổi auth guard hoặc business contract hiện có.
- Sinh SDK client tự động từ OpenAPI.

## Done Criteria (Architecture)
- [x] Không phá layering/import boundary của `apps/server`.
- [x] Không duplicate business logic giữa runtime cũ/mới.
- [x] Không thêm truy cập Supabase ngoài `apps/server`.
- [x] API hiện hữu vẫn giữ contract runtime, chỉ thêm documentation layer.

## Done Criteria (Coding)
- [x] `apps/server` có Swagger UI endpoint và JSON endpoint.
- [x] Có cấu hình env cho Swagger bật/tắt và path endpoint.
- [x] README server có hướng dẫn truy cập Swagger docs.
- [ ] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] Smoke test `GET /api/v1/health` vẫn hoạt động.
- [ ] Swagger UI endpoint trả về 200.
- [ ] Swagger JSON endpoint trả về 200 và có `openapi`.
- [x] CORS/validation/global filters hiện tại không bị regression do Swagger setup (đã build + lint file thay đổi).

## Nhắc test nhanh
- `cd apps/server && npm run lint`
- `cd apps/server && npm run build`
- `cd apps/server && npm run start:dev`
- Truy cập: `/api/docs` và `/api/docs-json`

## Implementation Snapshot
- Bổ sung Swagger runtime bootstrap tại `apps/server/src/main.ts`:
  - `setupSwagger()` dùng `SwaggerModule` + `DocumentBuilder`.
  - UI path: `/${SWAGGER_PATH}` (mặc định `/api/docs`).
  - JSON path: `/${SWAGGER_JSON_PATH}` (mặc định `/api/docs-json`).
  - Có `bearer` auth scheme cho endpoint cần token.
- Bổ sung config Swagger tại `AppConfigService`:
  - `swaggerEnabled` (mặc định bật ở non-production, tắt ở production).
  - `swaggerPath`, `swaggerJsonPath` (env overridable).
- Cập nhật docs/env:
  - `apps/server/.env.example`
  - `apps/server/README.md`

## Test Reminder Result
- `cd apps/server && npm run build` ✅ pass
- `cd apps/server && npx eslint src/main.ts src/common/config/app-config.service.ts` ✅ pass
- `cd apps/server && npm run lint` ❌ fail do lỗi có sẵn ngoài phạm vi task:
  - `src/common/http/request-body.util.ts`
  - `src/common/supabase/request-authenticated-client.util.ts`
