# Task 081 - Zalo Mini App vận hành production: webhook, security, monitoring, release

## Input ban đầu
- Sau khi có auth + commerce + payment, cần lớp vận hành production:
  - webhook events,
  - security/domain policy,
  - monitoring và release checklist.
- Thiếu lớp này sẽ rủi ro cao khi scale traffic và khi user thu hồi consent.

## Mục tiêu
- Hoàn thiện hardening cho mini app:
  - webhook receiver + signature verify,
  - xử lý revoke-consent lifecycle,
  - domain monitoring/allowlist chuẩn,
  - observability + release runbook.

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`
- `docs/tasks/modules/zalo-mini-app/004_zalo_mini_app_checkout_payment_and_reconciliation.md`
- `docs/tasks/modules/setup-source/002_setup_source_sentry_app_error_monitoring_release_health.md`
- `docs/tasks/072_performance_observability_and_regression_budget.md`

## Mapping màn hình/source
- Webhook/Open API handlers:
  - `apps/web/src/app/api/zalo-mini-app/webhooks/route.ts` (new)
  - `apps/web/src/server/services/zaloMiniAppWebhookService.ts` (new)
  - `apps/web/src/server/data-access/zaloMiniAppWebhook.ts` (new)
- Security + config:
  - `apps/web/src/server/config/zaloMiniAppConfig.ts` (new)
  - `apps/web/.env.example` (update)
- Observability/runbook:
  - `docs/guides/008_zalo_mini_app_ops_runbook.md` (new)
  - `progress/risk.md` hoặc `progress/risks.md` (update nếu cần)

## Quy tắc nghiệp vụ bắt buộc
- Webhook security:
  - verify signature theo công thức tài liệu chính thức trước khi xử lý event.
- Revoke-consent lifecycle:
  - khi nhận event user thu hồi quyền, phải invalidate liên kết/token liên quan.
- Domain policy:
  - API domain, image domain, CSP/allowlist cấu hình đúng theo platform monitoring.
- Telemetry:
  - log đầy đủ request-id/event-id, không log PII nhạy cảm.
- Resilience:
  - webhook handler idempotent, retry-safe, không tạo side effects lặp.

## In-scope
- Implement webhook endpoint + signature verify + revoke-consent handling.
- Bổ sung domain/config checklist production.
- Tích hợp logging/error monitor cho flow mini app quan trọng.
- Viết runbook deploy/rollback/incident response cho mini app.

## Out-of-scope
- Thiết kế alerting matrix toàn công ty.
- BI dashboard nâng cao ngoài các metric tối thiểu.
- Tối ưu growth campaign automation nâng cao.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hardening vận hành production cho Zalo Mini App.

Yêu cầu:
1) Implement webhook endpoint với verify signature chuẩn tài liệu.
2) Xử lý event user revoke-consent để invalidate mapping/session liên quan.
3) Chuẩn hóa domain allowlist/monitoring config và secrets policy.
4) Bổ sung observability + runbook release/rollback cho mini app.
5) Đảm bảo webhook idempotent, retry-safe, không lộ PII nhạy cảm.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Webhook receiver hoạt động, verify signature pass/fail đúng chuẩn.
- Revoke-consent event xử lý đúng lifecycle dữ liệu người dùng.
- Có runbook production cho deploy + rollback + incident.
- `cd apps/web && npm run typecheck` pass.

## Nhắc test nhanh
- Gửi webhook payload hợp lệ -> event được ghi nhận và xử lý.
- Gửi payload signature sai -> endpoint từ chối.
- Mô phỏng revoke-consent -> liên kết account bị vô hiệu đúng.
- Kiểm tra logs không chứa token/PII nhạy cảm.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/005` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/005 |- [x] Modules/Zalo-Mini-App/005 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/005
  - Task file: docs/tasks/modules/zalo-mini-app/005_zalo_mini_app_webhook_security_monitoring_and_release.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
