# Task 075 - Setup source: cấu hình Sentry app (error monitoring + release health)

## Input ban đầu
- Source hiện chưa có chuẩn cấu hình Sentry tập trung cho monorepo.
- Team cần theo dõi runtime errors theo môi trường/release để giảm thời gian debug production.
- Yêu cầu triển khai:
  - theo dõi lỗi cho cả web app và mobile app,
  - có release + environment tagging để truy vết rõ phiên bản lỗi.

## Mục tiêu
- Thiết lập Sentry foundation cho `apps/web` và `apps/mobile`.
- Chuẩn hóa luồng capture lỗi (global handlers + API/server handlers quan trọng).
- Bật release tracking + source maps để stack trace readable khi debug.

## Phụ thuộc
- `docs/tasks/001_foundation_source_base_alignment.md`
- `docs/tasks/072_performance_observability_and_regression_budget.md`
- `docs/tasks/modules/setup-source/001_setup_source_sonar_queue_warning_complexity_15.md`

## Mapping màn hình/source
- Web (Next.js):
  - `apps/web/sentry.client.config.ts` (new/update)
  - `apps/web/sentry.server.config.ts` (new/update)
  - `apps/web/next.config.*` (update plugin/config upload sourcemap)
  - `apps/web/src/app/**` (wiring error boundary nếu cần)
- Mobile (Expo/React Native):
  - `apps/mobile/app/**` hoặc `apps/mobile/src/**` (init Sentry entrypoint)
  - `apps/mobile/app.config.*` / `eas.json` (release/env wiring nếu cần)
- CI/CD + docs:
  - `.github/workflows/**` (inject env/release metadata nếu cần)
  - `docs/guides/002_sentry_setup_and_release_policy.md` (new)

## Quy tắc kỹ thuật bắt buộc
- Không làm crash app nếu Sentry thiếu DSN:
  - init phải fail-safe, app vẫn chạy bình thường.
- Mọi event gửi Sentry phải có tag cơ bản:
  - `environment`, `release`, `platform`, `branch/showroom_id` (khi có context hợp lệ).
- Bảo mật dữ liệu:
  - scrub/mask PII nhạy cảm (token, password, số điện thoại/email nếu policy yêu cầu).
- Không chặn luồng nghiệp vụ:
  - telemetry là non-blocking, không ảnh hưởng hành vi auth/offline/anon hiện tại.

## In-scope
- Thêm dependency và cấu hình init Sentry cho web + mobile.
- Cấu hình release/environment cho truy vết lỗi theo version.
- Bật source map upload (hoặc runbook rõ cách upload theo pipeline hiện tại).
- Thiết lập filter noise cơ bản:
  - ignore known non-actionable errors,
  - sampling policy cho performance/error phù hợp môi trường.
- Viết runbook setup env vars + verify checklist.

## Out-of-scope
- Xây dashboard observability đầy đủ đa công cụ (Datadog/NewRelic/Grafana).
- Thiết kế alert routing nâng cao (on-call escalation matrix đầy đủ).
- Remediate toàn bộ lỗi runtime legacy đang tồn tại.

## Prompt gợi ý cho Codex
```text
Mục tiêu: setup Sentry app cho monorepo (web + mobile) để theo dõi runtime errors theo release/environment.

Yêu cầu:
1) Cấu hình Sentry init cho apps/web và apps/mobile theo best practice framework.
2) Thêm release/environment tagging và ensure DSN fail-safe (không làm app crash nếu thiếu env).
3) Bật source map support để stack trace readable trong production.
4) Thiết lập scrub/mask dữ liệu nhạy cảm trước khi gửi event.
5) Bổ sung runbook docs/guides cho cách cấu hình env, release và kiểm tra hoạt động.

Validation commands:
- cd apps/web && npm run lint
- cd apps/mobile && npm run lint
```

## Done criteria (coding)
- `apps/web` capture được lỗi runtime/server với metadata `environment` + `release`.
- `apps/mobile` capture được lỗi runtime với metadata `environment` + `release`.
- Thiếu DSN không làm crash app (fail-safe init).
- Source map/release mapping hoạt động ở mức runbook hoặc CI wiring rõ ràng.
- Có tài liệu setup/verify trong docs.

## Nhắc test nhanh
- Web:
  - trigger 1 lỗi test ở môi trường dev/staging -> thấy event trên Sentry project đúng env/release.
- Mobile:
  - trigger 1 lỗi test từ app -> thấy event trên Sentry project đúng env/release.
- Fail-safe:
  - bỏ DSN env và chạy app -> app vẫn chạy, không block flow chính.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 075 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 074 /a - [ ] 075 | Setup source Sentry app for web+mobile: fail-safe init, release/environment tagging, sourcemap support, and monitoring runbook | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 075 |- [x] 075 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 075
  - Task file: docs/tasks/modules/setup-source/002_setup_source_sentry_app_error_monitoring_release_health.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
