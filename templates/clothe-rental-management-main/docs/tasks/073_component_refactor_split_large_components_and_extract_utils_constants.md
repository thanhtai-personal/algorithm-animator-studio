# Task 073 - Refactor readability: tách component > 400 dòng + extract utils/constants

## Input ban đầu
- Hiện có nhiều component web dài vượt ngưỡng 400 dòng, làm giảm khả năng đọc, review và bảo trì.
- Kết quả audit baseline:
  - `docs/technical/003_component_size_audit_2026-03-10.md`
  - 25 component `*.tsx` vượt ngưỡng 400 dòng trong `apps/web/src/features/**/components`.
- Nhiều file đang trộn: UI render + util format + constant config + inline handlers lớn trong cùng 1 file.

## Mục tiêu
- Tách các component dài thành các component nhỏ theo responsibility rõ ràng.
- Di chuyển utility functions/constants/types ra file riêng để giảm cognitive load.
- Chuẩn hóa cấu trúc feature để người mới có thể đọc và chỉnh sửa nhanh hơn.

## Phụ thuộc
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/technical/003_component_size_audit_2026-03-10.md`

## Mapping màn hình/source (scope chính)
- Tất cả file trong baseline audit:
  - `apps/web/src/features/**/components/*.tsx` có LOC > 400 (xem audit file).
- Ưu tiên xử lý theo mức độ lớn trước:
  1. `orders`, `procurement`, `dashboard`
  2. `inventory`, `reports`, `sales`
  3. `products`, `customers`, `settings`, `calendar`, `showroom`

## Quy tắc kiến trúc bắt buộc
- Giữ flow: `Component -> Hook -> Query -> Service -> API/Supabase`.
- Không đưa business logic mới vào component con tách ra.
- Component chỉ lo presentation/composition; logic orchestration giữ ở hook hiện có.
- Không đổi contract API, không đổi behavior nghiệp vụ.

## Quy tắc refactor readability
- Mỗi component mục tiêu sau refactor nên <= 400 LOC.
- Tách theo nhóm file chuẩn trong mỗi feature:
  - `components/<FeatureName>/*.tsx`
  - `constants/<feature>.ts` hoặc `components/<FeatureName>/constants.ts`
  - `utils/<feature>.ts` hoặc `components/<FeatureName>/utils.ts`
  - `types/<feature>.ts` khi type nội bộ phức tạp.
- Tất cả hàm thuần format/map/derive không phụ thuộc React state phải move ra `utils`.
- Hằng số copy/config/status-label-key dài phải move ra `constants`.
- Event handlers dài (nhiều nhánh) tách thành helpers/hook con có tên rõ nghĩa.

## In-scope
- Refactor cấu trúc component để cải thiện readability/maintainability.
- Giảm độ dài file và mức lồng JSX.
- Tách rõ section component (header/filter/table/modal/form blocks).
- Bổ sung comments ngắn gọn chỉ ở đoạn logic khó đọc (không comment thừa).

## Out-of-scope
- Thay đổi UI/UX behavior.
- Thay đổi schema/API contract.
- Tối ưu performance chuyên sâu ngoài phạm vi readability (đã có task perf riêng).

## Prompt gợi ý cho Codex
```text
Mục tiêu: refactor readability cho toàn bộ component >400 LOC trong apps/web/src/features/**/components.

Yêu cầu:
1) Dựa theo docs/technical/003_component_size_audit_2026-03-10.md, tách component lớn thành component nhỏ theo responsibility.
2) Move utility functions/constants/types ra file riêng, tránh trộn trong file component chính.
3) Giữ nguyên behavior, không đổi business logic/API contract.
4) Sau refactor, mỗi component mục tiêu <= 400 LOC.
5) Patch nhỏ theo từng feature/module để review dễ.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npm run lint
```

## Done criteria (coding)
- Không còn file `apps/web/src/features/**/components/*.tsx` nào > 400 LOC.
- Utility functions/constants được tách khỏi file component chính theo cấu trúc rõ ràng.
- Không regression behavior ở các flow chính (orders, procurement, POS, dashboard, reports).
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass.

## Nhắc test nhanh
- Smoke test từng module sau refactor:
  - Orders (list, create, detail, return)
  - Procurement (manual/import/history)
  - Sales POS / stock / product-entry
  - Dashboard + Reports
  - Products / Customers / Settings / Inventory
- So sánh screenshot/behavior trước-sau ở các action chính.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 073 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 072 /a - [ ] 073 | Readability refactor: split components >400 LOC + extract utils/constants/types out of component files | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 073 |- [x] 073 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 073
  - Task file: docs/tasks/073_component_refactor_split_large_components_and_extract_utils_constants.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
