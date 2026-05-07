# 009 - Delivery, Observability, Quality Gates

## 1) Build/lint/typecheck commands

### 1.1 Web
```bash
cd apps/web
npm run lint
npm run typecheck
npm run build
```

### 1.2 Mobile
```bash
cd apps/mobile
npm run lint
```

### 1.3 Server (Nest)
```bash
cd apps/server
npm run lint
npm run build
npm run test
```

### 1.4 Zalo mini apps (mỗi app)
```bash
cd apps/zalo-mini-apps/<app-name>
npm run lint
npm run typecheck
npm run build
```

## 2) Performance governance (web)
- Tài liệu baseline/budget:
  - `docs/technical/002_performance_diagnostics_2026-03-10.md`
  - `docs/technical/004_performance_observability_and_budget_2026-03-10.md`
- Budget gate script:
```bash
cd apps/web
npm run perf:budget
```
- Perf logs qua `PERF_OBS_LOG` và `PERF_OBS_WARN_MS`.

## 3) Monitoring & error tracking
- Sentry tích hợp cho web/mobile (env DSN/release/environment).
- Server-side sanitize hooks cho event data.
- Khuyến nghị:
  - release tagging đồng bộ giữa app/client/server.
  - map commit SHA -> release version.

## 4) Quality gate checklist trước release
- [ ] SQL setup/seed đã chạy đúng môi trường mục tiêu.
- [ ] Feature flags (`system_settings` + env) nhất quán.
- [ ] Auth/RBAC smoke test pass cho role chính.
- [ ] Mini app config endpoint/CORS/session pass.
- [ ] Perf budget không vi phạm gate hoặc có waiver rõ ràng.
- [ ] Sentry release + source maps (nếu bật) hoàn chỉnh.

## 5) Rollback strategy (khuyến nghị)
- API migration phase:
  - giữ compatibility route trong cửa sổ rollback.
- DB changes:
  - backup/snapshot trước migration destructive.
- Feature flags:
  - tắt module bằng flag thay vì rollback toàn bộ deploy nếu có thể.

## 6) Tài liệu vận hành liên quan
- Zalo integration:
  - `docs/guides/006_zalo_mini_app_integration_strategy.md`
  - `docs/guides/007_zalo_mini_app_setup.md`
  - `docs/guides/008_zalo_mini_app_ops_runbook.md`
- Release:
  - `docs/release/mvp_setup_release_runbook.md`
  - `docs/release/nest_api_cutover_release_gate.md`
