# Zalo Mini App Integration Strategy

## Mục tiêu
- Mở kênh Zalo Mini App nhưng không tách rời business logic khỏi hệ thống hiện tại.
- Duy trì kiến trúc chuẩn:
  - `Component -> Hook -> Query -> Service -> API/Supabase`
- Tách rõ boundary:
  - `apps/zalo-mini-app` chỉ xử lý UI + SDK bridge
  - `apps/web` giữ domain logic, auth mapping, order/payment/webhook.

## Kiến trúc tổng quan
- Mini app client:
  - Adapter SDK Zalo ở `apps/zalo-mini-app/src/features/platform/services/zaloSdkService.ts`
  - Hooks/queries không gọi SDK trực tiếp từ component
  - Commerce/payment gọi API web qua `fetch` service.
- Web backend:
  - API routes: `apps/web/src/app/api/zalo-mini-app/**`
  - Service layer: `apps/web/src/server/services/zaloMiniApp*.ts`
  - Data access: `apps/web/src/server/data-access/zaloMiniApp*.ts`
  - DTO contracts: `apps/web/src/types/zaloMiniApp.ts`

## Feature Flag
- Cờ hệ thống: `system_settings.is_zalo_mini_app_enabled`
- Mặc định: `false`
- Khi `false`:
  - endpoint config trả `enabled=false`
  - auth/order/payment endpoints trả lỗi domain `MODULE_DISABLED`
- Toggle admin nằm trong Settings > General > System operations.

## Contract API (MVP)
- `GET /api/zalo-mini-app/config`
  - trả cấu hình runtime: appId, oaId, apiBaseUrl, releaseChannel, allowedDomains, enabled.
- `POST /api/zalo-mini-app/auth/session`
  - payload từ SDK flow (zaloUserId, token, consent scopes)
  - lưu/mapping identity và phát hành session token nội bộ.
- `POST /api/zalo-mini-app/orders/draft`
  - tạo đơn nháp mini app theo items (branch co the bo trong payload; backend tu fallback).
- `GET /api/zalo-mini-app/orders/draft?draftId=...`
  - đọc lại draft.
- `POST /api/zalo-mini-app/payment/create-order`
  - tạo transaction thanh toán + external order id + checksum.
- `POST /api/zalo-mini-app/payment/callback`
  - callback từ payment gateway (verify chữ ký trước khi cập nhật).
- `GET /api/zalo-mini-app/payment/check-transaction?externalOrderId=...`
  - re-check trạng thái giao dịch.
- `POST /api/zalo-mini-app/webhooks`
  - ingest events (revoke consent, audit idempotent).

## Cấu hình môi trường (`apps/web`)
- `ZALO_MINI_APP_APP_ID`
- `ZALO_MINI_APP_APP_SECRET`
- `ZALO_MINI_APP_OA_ID`
- `ZALO_MINI_APP_API_BASE_URL`
- `ZALO_MINI_APP_RELEASE_CHANNEL`
- `ZALO_MINI_APP_ALLOWED_DOMAINS` (csv)
- `ZALO_MINI_APP_WEBHOOK_SECRET`

## Quy tắc bảo mật
- Không đưa `appSecret` về client mini app.
- Session lưu hash (`session_token_hash`, `access_token_hash`) thay vì raw token.
- Callback/webhook bắt buộc verify signature; signature sai phải reject.
- Event webhook xử lý idempotent theo `event_id`.

## Dữ liệu mới (SQL 034)
- `zalo_mini_app_identities`
- `zalo_mini_app_sessions`
- `zalo_mini_app_order_drafts`
- `zalo_mini_app_payment_transactions`
- `zalo_mini_app_webhook_events`

## Luồng triển khai theo phase
1. Foundation
- Deploy SQL `034_zalo_mini_app_core.sql`
- Bật env ở web server
- Để feature flag OFF
2. Internal test
- Test auth session + create draft + create payment order
- Test webhook/callback chữ ký đúng/sai
3. Staging pilot
- Bật feature flag ở staging
- Theo dõi log callback/webhook
4. Production canary
- Bật feature flag cho 1 showroom nội bộ
- Theo dõi lỗi và rollback nếu cần

## Regression checklist
- Không ảnh hưởng auth web/mobile hiện tại.
- Không có component gọi trực tiếp Supabase/service bypass query layer ở mini app.
- Không render state kép giữa query result và MobX store.
- Revoke consent phải revoke session liên quan.
