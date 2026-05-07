# Task 026 - Stylestream UI Clone: Visual Hardening + QA Closure

## Mục tiêu
- Hoàn thiện chất lượng sau clone UI toàn bộ màn hình.
- Chuẩn hóa consistency, responsive behavior, loading/empty/error states, accessibility, và visual regression checks.

## Phụ thuộc
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`
- `docs/tasks/021_stylestream_ui_clone_dashboard_kpi_module.md`
- `docs/tasks/022_stylestream_ui_clone_products_inventory_customers.md`
- `docs/tasks/023_stylestream_ui_clone_orders_payments_reports.md`
- `docs/tasks/024_stylestream_ui_clone_settings_module.md`
- `docs/tasks/025_stylestream_ui_clone_showroom_listing_detail_shortlist.md`

## Nguồn tham chiếu
- Toàn bộ pages trong `templates/stylestream-showcase-main/src/pages/**`
- Toàn bộ layouts trong `templates/stylestream-showcase-main/src/components/layouts/**`

## Prompt gợi ý cho Codex
```text
Mục tiêu: harden chất lượng sau khi clone UI Stylestream cho toàn bộ app screens.

Yêu cầu:
1) Cross-screen consistency:
   - spacing scale, card radius, shadow, typography hierarchy
   - status chips/button variants/table rows đồng nhất
2) State UX:
   - loading/empty/error/offline states đồng bộ style
   - bỏ placeholder debug không cần thiết khỏi UI production
3) Responsive tuning:
   - mobile nav/table/chart/form/layout không vỡ
   - kiểm tra các route dashboard + showroom chính
4) Accessibility:
   - focus ring visible, color contrast cơ bản, aria labels cho controls quan trọng
5) Regression safety:
   - không phá auth role redirect, anon showroom access, offline warnings
6) Output:
   - checklist visual QA theo route
   - danh sách khác biệt còn lại so với template (nếu có)

Không refactor business logic, chỉ hardening UI quality.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt tiêu chí hoàn thành clone:
  - visual parity target (ví dụ 80-90%).
- Chốt danh sách route cần screenshot compare:
  - dashboard, products, inventory, orders, customers, payments, reports, settings, showroom list/detail/shortlist.

## In-scope
- Visual consistency polish trên toàn app.
- Responsive/a11y hardening.
- Final QA checklist cho UI clone batch.

## Out-of-scope
- Tính năng nghiệp vụ mới.
- Thay đổi schema/API/auth policy.

## Deliverables mong muốn
- Bộ màn hình clone UI đồng nhất và sẵn sàng release nội bộ.
- Checklist QA đóng đầy đủ các điểm visual regression quan trọng.

## Done criteria (coding)
- Không còn mismatch lớn giữa các module về spacing/typography/tokens.
- Các route chính qua được smoke test responsive.
- Không có regression auth redirect/showroom access sau batch UI clone.

## Nhắc test nhanh
- Manual full route walk-through admin + showroom.
- Chụp screenshot desktop/mobile cho route chính để đối chiếu.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 026 |- [x] 026 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 026
  - Task file: docs/tasks/026_stylestream_ui_clone_visual_hardening_and_qa.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
