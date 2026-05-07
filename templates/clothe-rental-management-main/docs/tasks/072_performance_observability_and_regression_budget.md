# Task 072 - Performance observability + regression budget

## Input ban đầu
- Dự án chưa có baseline performance thống nhất theo route/module.
- Chưa có cơ chế chặn regression performance trong CI/release.
- Build hiện có warning metadata và chưa có checklist đo lường định lượng sau mỗi thay đổi lớn.

## Mục tiêu
- Thiết lập baseline hiệu năng (web vitals + API latency + payload size) theo route quan trọng.
- Có tiêu chí budget và quy trình phát hiện regression sớm.
- Chuẩn hóa cách đo, lưu và so sánh số liệu qua từng đợt release.

## Phụ thuộc
- `docs/technical/002_performance_diagnostics_2026-03-10.md`
- `docs/tasks/070_performance_backend_query_pushdown_and_server_pagination.md`
- `docs/tasks/071_frontend_performance_render_bundle_and_image_optimization.md`

## Mapping màn hình/source
- Route ưu tiên:
  - `/[locale]/dashboard`
  - `/[locale]/sales/pos`
  - `/[locale]/inventory`
  - `/[locale]/products`
  - `/[locale]/showroom` và `/[locale]/product`
- API ưu tiên:
  - `/api/products`
  - `/api/inventory`
  - `/api/customers`
  - `/api/showroom/products`
  - `/api/return-orders/sources`

## Quy tắc bắt buộc
- Định nghĩa metric rõ ràng, đo được lặp lại.
- Không dựa vào cảm giác chủ quan.
- Có ngưỡng budget theo route/API.
- Kết quả đo phải được lưu vào docs/progress để so sánh theo thời gian.

## In-scope
- Thiết kế checklist đo Lighthouse/Web Vitals cho route quan trọng.
- Gắn logging/thống kê latency API tối thiểu ở service layer hoặc edge logs.
- Định nghĩa budget (LCP, INP/TBT, JS bytes, API p95).
- Thêm guideline review PR về performance regression.
- Cập nhật docs vận hành để team dùng thống nhất.

## Out-of-scope
- Xây hệ observability full-stack enterprise (APM phức tạp) trong một task.
- Tối ưu toàn bộ module một lúc.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tạo baseline + budget + quy trình theo dõi regression performance cho web app.

Yêu cầu:
1) Xác định route/API trọng yếu và metric cần theo dõi.
2) Đề xuất ngưỡng budget định lượng.
3) Chuẩn hóa workflow đo trước/sau thay đổi.
4) Tạo checklist tài liệu để team áp dụng trong release/PR review.
5) Không thay đổi business logic.

Validation commands:
- cd apps/web && npm run build
- cd apps/web && npm run typecheck
- cd apps/web && npm run lint
```

## Done criteria (coding/docs)
- Có baseline document cho route/API trọng yếu.
- Có budget định lượng + hướng xử lý khi vượt ngưỡng.
- Có checklist áp dụng vào review/release.
- Build/lint/typecheck không regression nếu có patch code.

## Nhắc test nhanh
- Chạy Lighthouse cho route trọng yếu ở cùng điều kiện mạng/device.
- Đo API p95 với dataset đủ lớn.
- So sánh trước/sau Task 070/071 và ghi lại chênh lệch.
- Validate route công khai showroom và route vận hành POS.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 072 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 071 /a - [ ] 072 | Performance observability baseline + budget + regression gate for critical routes/APIs | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 072 |- [x] 072 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 072
  - Task file: docs/tasks/072_performance_observability_and_regression_budget.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
