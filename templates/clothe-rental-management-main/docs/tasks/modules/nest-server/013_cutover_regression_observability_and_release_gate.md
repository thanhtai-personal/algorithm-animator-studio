# Task 104 - Regression, observability, rollout và release gate cho cutover Nest API

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/009_delivery_observability_and_quality.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- Sau migrate + remove web API, nguy cơ regression production tăng mạnh nếu thiếu release gate.

## Mục tiêu
- Thiết lập release gate bắt buộc cho cutover.
- Có checklist regression + observability + rollback plan rõ ràng.

## Architecture Impact
- Layers affected:
  - deployment/runbook/monitoring
  - CI release gates
- Domains affected:
  - toàn bộ domain đã migrate sang Nest

## Current State vs Target State
- Current:
  - release gate có thể chưa đầy đủ theo endpoint group/domain risk.
- Target (Architecture V2):
  - cutover có gate rõ ràng, đo lường được, rollback nhanh được.

## Boundary Rules
- Must keep:
  - có tiêu chí pass/fail trước release.
  - có rollback thao tác cụ thể.
  - theo dõi lỗi theo endpoint/domain group.
  - xác nhận production path không còn DB access ngoài `apps/server`.
- Forbidden:
  - release production khi chưa hoàn tất checklist regression bắt buộc.

## Compatibility & Migration Strategy
- Compatibility window:
  - có phương án hạ lưu về compatibility layer nếu cần rollback có kiểm soát.
- Rollback condition:
  - vượt error budget, regression critical auth/payment/order => rollback theo runbook.

## Phụ thuộc
- `docs/tasks/modules/nest-server/012_remove_web_api_routes_and_legacy_server_layer.md`

## Mapping màn hình/source
- `apps/server` logging/error hooks
- CI scripts lint/build/test
- docs deploy/rollback runbook
- smoke test scripts cho web + mini-app

## Quy tắc kỹ thuật bắt buộc
- Checklist regression bắt buộc theo nhóm domain critical.
- Có ngưỡng quan sát tối thiểu (error rate, p95 latency theo endpoint group).
- Có biên bản sign-off owners.

## In-scope
- Định nghĩa release gate checklist.
- Chuẩn hóa logging/monitoring tối thiểu cho endpoint mới.
- Chốt runbook release + rollback.
- Sign-off matrix theo module owner.

## Out-of-scope
- Xây observability platform mới từ đầu.
- Tối ưu hiệu năng sâu ngoài regression gate.

## Done Criteria (Architecture)
- [x] Có release gate checklist bắt buộc trước production.
- [ ] Có rollback plan khả thi, thao tác cụ thể, kiểm thử dry-run.
- [x] Có theo dõi lỗi/latency theo endpoint group.
- [x] Có bước verify không còn DB access ngoài `apps/server` cho domain đã cutover.

## Done Criteria (Coding)
- [x] artifacts runbook/checklist/sign-off được cập nhật trong repo docs.
- [ ] smoke tests staging cho flows critical pass.

## Regression Scope
- [ ] web critical flows (auth, order, payment, report).
- [ ] mini-app critical flows (config, login, order/payment).
- [ ] mô phỏng lỗi endpoint để xác nhận log/alert quan sát được.
- [ ] rollback dry-run thành công theo runbook.

## Implementation Snapshot
- Thêm structured request/error observability ở `apps/server`:
  - `[api-request]` có `endpointGroup`, `statusFamily`, `isSlowRequest`.
  - `[api-error]` có `endpointGroup`, `requestId`, `statusFamily`.
- Thêm release gate automation:
  - `apps/server/scripts/release-gate/check-nest-cutover-readiness.mjs`
  - `npm run release:gate` và `npm run release:gate:cutover` trong `apps/server/package.json`.
- Thêm runbook/checklist/sign-off matrix:
  - `docs/release/nest_api_cutover_release_gate.md`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/013 |- [x] Modules/Nest-Server/013 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/013
  - Task file: docs/tasks/modules/nest-server/013_cutover_regression_observability_and_release_gate.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
