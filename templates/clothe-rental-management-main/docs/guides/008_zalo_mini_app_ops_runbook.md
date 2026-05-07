# Zalo Mini App Ops Runbook

## 1) Pre-Release Checklist
- SQL migrations:
  - đảm bảo đã chạy `apps/web/sql/034_zalo_mini_app_core.sql`
- Env secrets (`apps/web` deployment target):
  - `ZALO_MINI_APP_APP_ID`
  - `ZALO_MINI_APP_APP_SECRET`
  - `ZALO_MINI_APP_WEBHOOK_SECRET`
  - `ZALO_MINI_APP_API_BASE_URL`
  - `ZALO_MINI_APP_ALLOWED_DOMAINS`
- Feature flag:
  - `system_settings.is_zalo_mini_app_enabled = false` trước khi smoke test

## 2) Smoke Test API
- `GET /api/v1/zalo-mini-app/config`
  - verify `enabled` và `appId` đúng environment
- `POST /api/v1/zalo-mini-app/auth/session`
  - test payload hợp lệ -> nhận `sessionToken`
  - payload token thiếu/sai -> lỗi `INVALID_TOKEN`
- `POST /api/v1/zalo-mini-app/orders/draft`
  - tạo draft hợp lệ -> nhận `draft.id`
- `POST /api/v1/zalo-mini-app/payment/create-order`
  - verify có `externalOrderId`, `checksum`

## 3) Payment Callback Validation
- Endpoint: `POST /api/v1/zalo-mini-app/payment/callback`
- Header signature: `x-zalo-signature`
- Trường hợp bắt buộc test:
  - signature đúng + status `SUCCESS` -> transaction success + draft paid
  - callback duplicate cùng transaction -> `duplicate=true`
  - signature sai -> reject (`INVALID_SIGNATURE`)

## 4) Webhook Validation
- Endpoint: `POST /api/v1/zalo-mini-app/webhooks`
- Header signature: `x-zalo-signature`
- Trường hợp bắt buộc test:
  - payload hợp lệ -> event `PROCESSED`
  - payload duplicate `event_id` -> không tạo side-effect lặp
  - event revoke consent -> identity/session bị revoke

## 5) Observability
- Log tối thiểu cho mỗi request quan trọng:
  - route
  - event/order id
  - status xử lý
  - timestamp
- Không log raw token/secret/PII nhạy cảm.
- Theo dõi tỷ lệ lỗi:
  - callback signature fail
  - webhook reject
  - create-order fail
  - session resolve fail

## 6) Incident Handling
1. Triệu chứng: payment callback không cập nhật đơn
- Kiểm tra signature secret đang dùng có khớp không
- Kiểm tra log `externalOrderId` có tồn tại transaction chưa
- Chạy endpoint check transaction để reconcile

2. Triệu chứng: user bị mất phiên mini app
- Kiểm tra `expires_at`, `revoked_at` trong `zalo_mini_app_sessions`
- Kiểm tra có webhook revoke consent gần thời điểm lỗi không

3. Triệu chứng: webhook tăng lỗi đột biến
- Tạm thời tắt feature flag nếu ảnh hưởng user flow
- Xác nhận domain/secret/callback config từ Zalo console

## 7) Rollback Plan
- Bước rollback nhanh:
  1. set `system_settings.is_zalo_mini_app_enabled = false`
  2. redeploy `apps/web` bản ổn định gần nhất
- Không xóa bảng dữ liệu để giữ audit/reconcile.

## 8) Post-Release Review
- Đối soát số lượng giao dịch callback vs payment transaction success.
- Kiểm tra duplicate callback đã idempotent.
- Đánh giá lỗi top N và cập nhật rule giám sát.

## 9) Cutover Release Gate
- Trước production release các flow mini-app đã cutover sang Nest, phải hoàn thành:
  - `docs/release/nest_api_cutover_release_gate.md`
