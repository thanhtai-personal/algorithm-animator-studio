# Task 063 - Localize toàn bộ status trên tất cả màn hình

## Input ban đầu
- Nhiều màn hình vẫn hiển thị status dạng raw enum kỹ thuật (`LAUNDRY`, `READY`, `CONFIRMED`, `VOIDED`, ...).
- Trải nghiệm chưa nhất quán với locale hiện tại (đặc biệt bản `vi`), gây khó hiểu cho nhân viên vận hành.
- Ví dụ thực tế: dropdown trạng thái item sau trả đang hiển thị toàn bộ tiếng Anh uppercase.

## Mục tiêu
- Chuẩn hóa hiển thị status theo locale (`vi`/`en`) trên toàn bộ UI:
  - bảng list,
  - detail page,
  - filter chips/select options,
  - modal/drawer/form controls,
  - status badge/pill và label trong review/summary.
- Không còn hiển thị raw enum kỹ thuật trực tiếp ra UI.

## Phụ thuộc
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/017_i18n_completion_and_release_hardening.md`
- `docs/tasks/048_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/060_shift_open_close_ui_standardization_and_admin_shift_management.md`

## Mapping màn hình/source
- Shared constants/formatter:
  - `apps/web/src/constants/domainPrimitives.ts`
  - `apps/web/src/components/feedback/StatusBadge.tsx`
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`
- Orders:
  - `apps/web/src/features/orders/**`
- Inventory:
  - `apps/web/src/features/inventory/**`
- Sales/POS:
  - `apps/web/src/features/sales/**`
- Payments:
  - `apps/web/src/features/payments/**`
- Reports/Calendar/Settings và các module còn lại có status dropdown/filter.

## Quy tắc nghiệp vụ bắt buộc
- UI không được render trực tiếp enum raw cho người dùng cuối.
- Mọi status hiển thị phải đi qua map localize thống nhất theo locale hiện tại.
- Các nhóm status cần chuẩn hóa:
  - `order status`,
  - `item status`,
  - `payment status`,
  - `incident/return condition status`,
  - `shift status` (nếu có hiển thị).
- Fallback an toàn:
  - nếu thiếu mapping, hiển thị label thân thiện thay vì enum thô (ưu tiên không lộ raw code).
- Không đổi semantics nghiệp vụ hay payload API; chỉ chuẩn hóa presentation layer.

## In-scope
- Rà soát và thay thế toàn bộ điểm render status thô bằng helper/localize map.
- Bổ sung/chuẩn hóa dictionary `vi/en` cho đầy đủ status đang dùng.
- Đồng bộ style hiển thị status giữa table/filter/select/badge.

## Out-of-scope
- Đổi tên enum trong DB/API.
- Refactor lớn cấu trúc domain/status machine.
- Thay đổi logic transition status nghiệp vụ.

## Prompt gợi ý cho Codex
```text
Mục tiêu: localize toàn bộ status trên tất cả màn hình, không hiển thị raw enum.

Yêu cầu:
1) Rà soát toàn bộ UI render status (orders/inventory/sales/payments/settings...).
2) Chuẩn hóa qua 1 mapping/localization layer thống nhất theo locale vi/en.
3) Dropdown/filter/status badge đều phải dùng label đã localize.
4) Không đổi payload/API/domain logic; chỉ presentation.
5) Bổ sung fallback an toàn khi thiếu mapping.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn status raw enum xuất hiện trên UI ở các màn hình chính.
- Tất cả dropdown/filter/badge/list/detail hiển thị status đúng theo locale.
- Locale `vi` và `en` đều đầy đủ label status.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Orders list/detail/create:
  - verify status labels/filter/status badge theo locale.
- Inventory list/detail/return flows:
  - verify item status + return target status đã localize.
- POS + shift:
  - verify status hiển thị trong các form/select/chips.
- Payments:
  - verify trạng thái `POSTED/VOIDED` hiển thị đã dịch.
- Chuyển `vi <-> en`:
  - verify label status đổi đúng, không lộ raw enum.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 063 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 062 /a - [ ] 063 | Global status localization: translate all status labels across all screens (vi/en) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 063 |- [x] 063 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 063
  - Task file: docs/tasks/063_global_status_localization_across_all_screens.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
