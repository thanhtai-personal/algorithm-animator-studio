# Task 005 - Shared UI Foundation & Domain Primitives

## Mục tiêu
- Tạo nền component/dto/constants dùng lại cho các module wireframe (table/filter/drawer/stepper/status badges/money/date) và trang showroom khách.
- Tạo nền UI/hook dùng lại cho `voice input` trên admin forms (dictation), tránh mỗi feature tự cài riêng.
- Giảm duplicate khi bước vào Products/Inventory/Orders và customer showroom page.

## Phụ thuộc
- `docs/tasks/004_locale_routing_app_shell.md`

## Tài liệu tham chiếu
- `docs/001_wireframe.md` (Sections 0.2, 4, 5, 6, 7, 8, 9, 10, 14)
- `docs/000_Business_requests.md` (Sections 4.x, 10)
- `.mcp.full.md` (shared component vs feature boundary)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây shared UI foundation + domain primitives cho hệ thống thuê đồ (admin + showroom page khách), phục vụ các module sau mà không overbuild.

Yêu cầu:
1) Tạo reusable components/atoms phù hợp wireframe:
   - DataTable shell (header/empty/loading/pagination slots)
   - FilterBar shell
   - ProductCard / ProductGrid card shell (dùng lại cho products và showroom page khách)
   - Filter chips/facets basic (nếu không overbuild)
   - Drawer/Sheet form wrapper
   - Stepper (cho Create Order)
   - StatusBadge (order/item/payment)
   - MoneyInput / money formatter helper
   - DateRange field wrapper (UI shell)
   - VoiceInputButton / VoiceDictationField wrapper (cho text/textarea fields admin forms)
2) Tạo domain constants/types dùng chung (không feature-specific deep imports):
   - item statuses, order statuses, payment types/methods
   - label map keys (i18n-ready)
3) Thêm util validation nền tảng:
   - phone format basic (VN-friendly)
   - date range validation
   - money non-negative parse
4) Thêm shared voice-dictation primitives (web admin):
   - UI states: idle/listening/processing/error/unsupported
   - browser capability check + permission-denied handling
   - onResult callback cho field hiện tại; không auto-submit form
   - cleanup/abort recognition khi đóng form/drawer hoặc unmount
5) Không implement business data fetching thật ở task này.
6) Bám coding rule: shared UI ở `src/components`, domain shared types ở `src/types` hoặc `src/constants` khi thực sự cross-feature.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt enum names canonical (DB code vs i18n key)
- Chốt formatting:
  - currency display default `VND`
  - date format `vi` / `en`
- Quyết định base UI stack:
  - tận dụng Radix + existing styling
  - giữ visual tối giản, chưa cần final design system
- Voice input strategy (web admin):
  - Web Speech API / browser speech recognition (khuyến nghị MVP nếu hỗ trợ môi trường)
  - fallback disabled state + manual typing
- Language mapping cho dictation:
  - `vi-VN`, `en-US` (khuyến nghị)
- Field scope MVP:
  - text/textarea only
  - numeric/date fields chưa bật hoặc cần confirm parse riêng ở feature task

## In-scope
- UI shells & shared constants/types/utils
- i18n-ready label key conventions
- Shared voice dictation UI primitive/hook cho admin forms

## Out-of-scope
- Module-specific data hooks/services
- Fancy chart/report components

## Deliverables mong muốn
- Bộ component base dùng được cho list/detail/form screens
- Domain constants/types shared cho products/inventory/orders/payments
- Primitive voice input dùng lại được cho các form admin (text/note)

## Done criteria (coding)
- Components không chứa business logic/module-specific query
- Enum/constants không trùng lặp giữa feature folders khi là shared semantics
- Có ít nhất 1 demo usage trong placeholder page/story-like section (nếu repo không có Storybook)
- Voice primitive xử lý được unsupported/permission-denied state và không làm crash form

## Nhắc test nhanh
- Build/lint/typecheck component + utils mới
- Manual render trên dashboard placeholder hoặc sandbox page nội bộ
- Manual voice dictation smoke test (nếu môi trường/browser hỗ trợ) + fallback unsupported


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 005 |- [x] 005 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 005
  - Task file: docs/tasks/005_shared_ui_and_domain_primitives.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
