# Task 100 - Migrate toàn bộ Zalo Mini App APIs từ `apps/web` sang `apps/server`

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn: `NEST_API_BASE_URL`, `VITE_NEST_API_BASE_URL`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Zalo mini app APIs đang chạy qua web route handlers.
- Endpoint nhạy cảm: config, auth/session, rental access, payment, webhook.

## Mục tiêu
- Chuyển toàn bộ `api/zalo-mini-app/**` sang Nest.
- Giữ contract compatibility cho mini-app callers.

## Architecture Impact
- Layers affected:
  - server module zalo-mini-app
  - mini-app callers và compatibility routes
- Domains affected:
  - config/auth/rental/payment/webhook
- `apps/server` module layers touched:
  - `presentation`, `application`, `domain`, `infrastructure`

## Current State vs Target State
- Current:
  - source-of-truth cho mini-app APIs còn nằm web.
- Target (Architecture V2):
  - source-of-truth mini-app APIs nằm trong Nest.

## Boundary Rules
- Must keep:
  - contract response mini-app parity.
  - webhook signature verification parity hoặc chặt hơn.
  - payment callback idempotency.
  - chỉ `apps/server` được phép truy cập Supabase DB cho mini-app domains.
- Forbidden:
  - đổi contract ngầm làm vỡ mini-app clients.
  - đặt query DB ngoài infrastructure/data-access.

## Compatibility & Migration Strategy
- Compatibility window:
  - route cũ ở web vẫn forward cho endpoint đã migrate.
- Rollback condition:
  - regression config/auth/payment/webhook -> rollback theo nhóm endpoint mapping.

## Phụ thuộc
- `docs/tasks/modules/nest-server/008_nest_server_makeup_procurement_media_api_migration.md`
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/005_zalo_mini_app_webhook_security_monitoring_and_release.md`
- `docs/features/endpoint_mapping_inventory.md`

## Mapping màn hình/source
- Nguồn:
  - `apps/web/src/app/api/zalo-mini-app/**`
  - `apps/web/src/server/services/zaloMiniApp*.ts`
  - `apps/web/src/server/data-access/zaloMiniApp*.ts`
- Đích:
  - `apps/server/src/modules/zalo-mini-app/**`

## Quy tắc kỹ thuật bắt buộc
- Không đổi response contract config/auth/session mà apps đang dùng.
- Bảo toàn security rules cho webhook/payment.
- Error mapping nhất quán với callers hiện tại.

## In-scope
- Migrate toàn bộ endpoint Zalo mini app.
- Migrate guards/services/repositories tương ứng.
- Test config/session/payment/webhook.

## Out-of-scope
- Thay đổi UI mini apps.
- Đổi business flow checkout.

## Done Criteria (Architecture)
- [x] Zalo mini-app APIs source-of-truth ở Nest.
- [x] Layering module tuân thủ doc 012.
- [x] Không query DB ngoài infrastructure/data-access.

## Done Criteria (Coding)
- [x] mini-app config/auth/payment/webhook chạy qua Nest.
- [x] `cd apps/server && npm run lint` pass.
- [x] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] gọi `/config`, `/auth/session`.
- [ ] flow checkout + callback giả lập.
- [ ] webhook duplicate event không xử lý trùng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/009 |- [x] Modules/Nest-Server/009 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/009
  - Task file: docs/tasks/modules/nest-server/009_nest_server_zalo_mini_app_api_migration.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
