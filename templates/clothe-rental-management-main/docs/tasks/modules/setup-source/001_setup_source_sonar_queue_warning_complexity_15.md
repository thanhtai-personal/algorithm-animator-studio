# Task 074 - Setup source: SonarQube (sonar queue) + giới hạn complexity 15 (warning-only)

## Input ban đầu
- Source hiện chưa có chuẩn kiểm soát complexity tập trung bằng SonarQube.
- Team cần cảnh báo sớm các hàm có độ phức tạp cao để giảm rủi ro maintainability.
- Yêu cầu bắt buộc từ vận hành:
  - đặt ngưỡng complexity là `15`,
  - chỉ cảnh báo (`warning`), không được block merge/deploy.

## Mục tiêu
- Bổ sung task cấu hình SonarQube cho source hiện tại (web + mobile trong monorepo).
- Áp dụng rule complexity threshold `15` cho code JS/TS.
- Thiết lập chế độ non-blocking: issue complexity chỉ hiển thị cảnh báo, pipeline không fail vì rule này.

## Phụ thuộc
- `docs/tasks/001_foundation_source_base_alignment.md`
- `docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md`
- `docs/tasks/073_component_refactor_split_large_components_and_extract_utils_constants.md`

## Mapping màn hình/source
- Sonar config:
  - `sonar-project.properties` (new)
  - hoặc `apps/web/sonar-project.properties`, `apps/mobile/sonar-project.properties` (tùy chiến lược scan)
- CI integration:
  - `.github/workflows/sonar-analysis.yml` (new hoặc update workflow hiện có)
- Tech docs/runbook:
  - `docs/guides/001_sonarqube_setup_and_warning_policy.md` (new)

## Quy tắc kỹ thuật bắt buộc
- Rule complexity:
  - dùng Cognitive Complexity threshold `15` cho function/method.
  - rule severity đặt ở mức `warning` (không phải blocker/critical gate).
- Quality gate/pipeline:
  - không fail build chỉ vì complexity warning.
  - nếu có bước Sonar trong CI thì để non-blocking (ví dụ optional check/`continue-on-error` theo CI system).
- Khả năng quan sát:
  - warning phải xuất hiện trong Sonar UI hoặc log scan để dev nhìn thấy rõ khi vượt ngưỡng.

## In-scope
- Thiết lập cấu hình SonarQube cho monorepo.
- Bật rule complexity 15 cho JS/TS.
- Wiring CI scan và xác nhận chế độ warning-only.
- Viết tài liệu ngắn cho team về cách đọc warning và cách xử lý.

## Out-of-scope
- Ép toàn bộ quality gate thành blocking.
- Sửa toàn bộ legacy violations đang tồn tại trong cùng task.
- Áp dụng auto-refactor bắt buộc cho mọi file vượt ngưỡng.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thiết lập SonarQube cho source và giới hạn complexity 15 ở mức warning-only.

Yêu cầu:
1) Thêm cấu hình Sonar scan cho monorepo (web + mobile) với include/exclude hợp lý.
2) Cấu hình rule Cognitive Complexity threshold = 15 cho JS/TS.
3) Đảm bảo rule này chỉ warning, không block merge/deploy.
4) Tích hợp scan vào CI nhưng non-blocking cho complexity warning.
5) Bổ sung runbook ngắn trong docs/guides để team biết cách theo dõi và xử lý cảnh báo.

Validation commands:
- cd apps/web && npm run lint
- cd apps/mobile && npm run lint
```

## Done criteria (coding)
- Có cấu hình SonarQube trong repo và scan chạy được trên codebase.
- Complexity threshold `15` được áp dụng cho JS/TS và hiển thị warning khi vi phạm.
- CI không fail chỉ vì complexity warning.
- Có tài liệu runbook mô tả rõ policy warning-only và cách theo dõi.

## Nhắc test nhanh
- Tạo 1 function mẫu có complexity > 15:
  - Sonar phải báo warning đúng rule.
  - Pipeline/check tổng thể vẫn pass (không bị block bởi warning này).
- Tạo 1 function complexity <= 15:
  - không phát sinh warning complexity.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 074 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 073 /a - [ ] 074 | Setup source SonarQube scan + cognitive complexity threshold 15 warning-only (non-blocking quality gate) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 074 |- [x] 074 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 074
  - Task file: docs/tasks/modules/setup-source/001_setup_source_sonar_queue_warning_complexity_15.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
