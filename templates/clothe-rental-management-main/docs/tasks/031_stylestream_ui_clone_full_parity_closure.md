# Task 031 - Stylestream UI Clone: Full Parity Closure + Release Gate

## Mục tiêu
- Đóng toàn bộ gap clone UI còn lại để app đạt mức parity cao với `templates/stylestream-showcase-main`.
- Thực hiện sweep route-by-route, loại bỏ hoàn toàn style cũ không cùng ngôn ngữ Stylestream.
- Tạo output QA đủ rõ để quyết định release nội bộ.

## Phụ thuộc
- `docs/tasks/028_stylestream_ui_clone_header_footer_navigation_parity.md`
- `docs/tasks/029_stylestream_ui_clone_multitheme_dark_light_palette.md`
- `docs/tasks/030_stylestream_ui_clone_motion_charts_and_component_parity.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/index.css`
- `templates/stylestream-showcase-main/src/components/layouts/**`
- `templates/stylestream-showcase-main/src/components/**`
- `templates/stylestream-showcase-main/src/pages/admin/**`
- `templates/stylestream-showcase-main/src/pages/showroom/**`

## Mapping màn hình/source
- Tất cả route chính trong `apps/web/src/app/[locale]/**`:
  - dashboard, products, inventory, customers, orders, payments, reports, settings, calendar
  - showroom list/detail/shortlist
  - auth và fallback screens
- Shared style system:
  - `apps/web/src/app/globals.css`
  - `apps/web/src/features/**/components/*.tsx`
  - `apps/web/src/components/**`

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện clone UI đạt parity cao với Stylestream, chốt release gate.

Yêu cầu:
1) Full parity sweep:
   - kiểm tra route-by-route, component-by-component
   - thay nốt các phần style cũ chưa theo template
2) Header/footer/theme/motion/chart consistency:
   - đồng bộ 100% theo các task 028-030
3) Visual QA artifacts:
   - tạo checklist parity theo route
   - ghi rõ phần nào chưa đạt và mức độ ảnh hưởng
4) Regression safety:
   - không đổi logic nghiệp vụ, không đổi API payload
   - verify auth role redirect, guest showroom, core order/payment actions còn chạy
5) Acceptance gate:
   - lint/typecheck/build pass
   - manual smoke list đủ cho admin + showroom

Kết quả: source web có UI đồng nhất gần template, sẵn sàng đóng phase clone.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt tiêu chí parity:
  - visual-close 90%+
  - hoặc strict pixel-close cho route ưu tiên.
- Chốt route priority nếu phải chia phase:
  - admin critical routes
  - showroom customer routes.

## In-scope
- Gap closure cho toàn bộ UI clone.
- Final consistency pass + visual QA summary.
- Release gate checks cho phase clone.

## Out-of-scope
- Feature/business mới ngoài clone UI.
- Thay đổi policy DB/API/auth.

## Deliverables mong muốn
- App UI đồng nhất Stylestream trên hầu hết route chính.
- Có checklist rõ route đạt/chưa đạt parity để follow-up.
- Build/lint/typecheck pass cho baseline MVP.

## Done criteria (coding)
- Không còn màn hình lớn mang style legacy rõ rệt.
- Header/footer/theme/motion/chart đồng bộ toàn app.
- `cd apps/web && npm run lint:mvp` pass.
- `cd apps/web && npm run typecheck:mvp` pass.
- `cd apps/web && npm run build` pass.

## Nhắc test nhanh
- Manual full route walk-through admin + showroom.
- Manual auth flows (admin/non-admin/guest), locale `vi/en`.
- Manual order/payment/report core actions smoke path.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`
- `cd apps/web && npm run build`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 031 |- [x] 031 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 031
  - Task file: docs/tasks/031_stylestream_ui_clone_full_parity_closure.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
