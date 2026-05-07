# apps/server (NestJS API)

## 1) Vai trò
`apps/server` là backend NestJS mục tiêu để tách API khỏi `apps/web`.

Trạng thái task 001:
- Đã có API nền tảng với global prefix/versioning.
- Đã migrate nhóm endpoint ưu tiên từ web:
  - `auth/session`
  - `zalo-mini-app config/session/rental access`
- Web legacy routes tương ứng đang chạy ở chế độ compatibility proxy sang Nest.

## 2) Lệnh chính
```bash
npm install
npm run start:dev
npm run lint
npm run lint:architecture
npm run build
npm run test
npm run release:gate
```

## 3) Port runtime
- `PORT` env var
- fallback mặc định trong `src/main.ts`: `3056`

## 4) Env tối thiểu
- File mẫu: `apps/server/.env.example`
- File local đã ignore git: `apps/server/.env`

Bắt buộc:
- `SUPABASE_URL` (hoặc `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (hoặc `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEST_API_BASE_URL` (khuyến nghị set theo môi trường; production dùng domain API chính thức)

Khuyến nghị:
- `CORS_ALLOWED_ORIGINS` (bắt buộc khi chạy production mode)
- `API_LOG_WARN_LATENCY_MS` (default `1200`)
- `SWAGGER_ENABLED` (`1/0`, mặc định: bật ở non-production, tắt ở production)
- `SWAGGER_PATH` (default: `api/docs`)
- `SWAGGER_JSON_PATH` (default: `api/docs-json`)

Mini-app related (tuỳ môi trường):
- `ZALO_MINI_APP_APP_ID`
- `ZALO_MINI_APP_APP_SECRET`
- `ZALO_MINI_APP_OA_ID`
- `ZALO_MINI_APP_RELEASE_CHANNEL`
- `ZALO_MINI_APP_ALLOWED_DOMAINS`
- `ZALO_MINI_APP_WEBHOOK_SECRET`
- `ZALO_MINI_APP_DEBUG`
- `ZALO_MINI_APP_DEV_PROFILE_ID`

Voice transcription (tuỳ môi trường):
- `VOICE_TRANSCRIPTION_API_KEY` hoặc `OPENAI_API_KEY`
- `VOICE_TRANSCRIPTION_API_BASE_URL`
- `VOICE_TRANSCRIPTION_MODEL`
- `VOICE_TRANSCRIPTION_PROMPT`

## 4.1) Source structure rules (server)
- Giới hạn tối đa `400` dòng/file (có danh sách waiver tạm thời cho file legacy lớn).
- Type files bắt buộc đặt trong `types/`.
- Quy ước tên:
  - `type` dùng `<TypeAliasName>.type.ts`
  - `interface` dùng `<InterfaceName>.interface.ts`
- Mỗi file types chỉ được chứa 1 export `type/interface` (legacy có waiver tạm thời).
- Mapper files bắt buộc đặt trong `mappers/` và dùng suffix `.mapper.ts`.
- Mapper class bắt buộc có `map()` và `maps()` cho chuyển đổi giữa các data type tương tự.
- Mỗi file chỉ export tối đa 1 class (`*.constants.ts`, `*.utils.ts` là ngoại lệ).
- Data-access:
  - file entrypoint `*.data-access.ts` trong `infrastructure/` phải là file mỏng (ưu tiên chỉ export/điều phối), không nhồi logic query lớn.
  - implementation chi tiết phải tách vào `infrastructure/data-access/*.data-access.ts`.
- Tên file phải khớp export chính:
  - class theo suffix chuẩn dùng kebab-case + suffix tương ứng (`auth.service.ts`, `orders.controller.ts`, `create-mini-app-session.dto.ts`).
  - mapper dùng tên class mapper bỏ hậu tố `Mapper`, rồi thêm `.mapper.ts` (ví dụ class `RequestBodyToCreateCustomerPayloadMapper` -> `RequestBodyToCreateCustomerPayload.mapper.ts`).
- Tối ưu decorator trong controller:
  - module controllers bắt buộc dùng `@V1Controller('<path>')` thay vì `@Controller({ path, version: '1' })`.
  - dùng `@ApiRequest()` thay cho `@Req()` để chuẩn hóa request extraction.
  - query/body optional cần normalize nên ưu tiên decorator (`@NullableQuery`, `@NullableBodyField`) thay vì lặp xử lý thủ công trong method.
- Decorator files:
  - đặt trong `decorators/` và dùng suffix `.decorator.ts`.
- Lệnh kiểm tra:
  - `npm run lint:architecture`
  - script: `apps/server/scripts/architecture/enforce-server-source-rules.mjs`

## 5) Endpoint base
- Prefix/version: `/api/v1`
- Health check: `GET /api/v1/health`
- Swagger UI: `GET /api/docs` (khi `SWAGGER_ENABLED=1`)
- Swagger JSON: `GET /api/docs-json` (khi `SWAGGER_ENABLED=1`)

## 6) Production API URL policy
- Production base URL chuẩn: `https://kata-center-api.vercel.app`
- Caller apps nên dùng env key chuẩn:
  - Server/Next runtime: `NEST_API_BASE_URL`
  - Vite mini apps: `VITE_NEST_API_BASE_URL`

## 7) Migration roadmap
Theo dõi trong:
- `docs/tasks/modules/nest-server/001_nest_server_api_migration_foundation_and_consumer_cutover.md`
- ... đến task `013_cutover_regression_observability_and_release_gate.md`

Release gate cutover:
- `docs/release/nest_api_cutover_release_gate.md`

## 8) Kiến trúc target
Sau khi migration hoàn tất:
- Web/Mobile/Zalo callers sẽ gọi API của Nest.
- Web route handlers legacy tại `apps/web/src/app/api/**` sẽ bị deprecate/remove theo phase.
- Data platform vẫn là Supabase (Postgres/Auth/RLS/Storage).
