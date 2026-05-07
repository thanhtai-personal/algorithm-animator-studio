# Task 097 - Bug: Sales Product Entry mobile responsive

## Mục tiêu
- Sửa responsive mobile cho màn hình tạo sản phẩm POS-style tại Sales Product Entry.

## Phụ thuộc
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/074_system_wide_voice_input_ios_webkit_compatibility.md`
- `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Hiện trạng cần lưu ý
- Main layout dùng `xl:grid-cols-[minmax(0,1fr)_360px]`; summary/sidebar nằm sau form trên mobile.
- Footer submit/reset không sticky và nằm cuối form dài.
- Pricing dùng các grid `md:grid-cols-3`; tablet/mobile có thể quá dày với nhãn dài.
- Generated item codes nằm trong sidebar sau form, không giúp user kiểm tra nhanh trước submit trên mobile.

## Implementation Context (Token tối ưu)
- Route/screen: `/{locale}/sales/product-entry`.
- Entry component/hook: `SalesProductEntryPage`; giữ orchestration submit hiện có.
- Đọc/sửa trước:
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntrySidebar.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPricingSection.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryBatchItemsSection.tsx` nếu batch fields overflow.
- Chỉ đọc khi cần:
  - `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md` phần "Sales Product Entry".
  - Hook Sales Product Entry chỉ khi cần xác minh action props, không sửa RBAC/business rules.
- Không cần nạp:
  - Admin Products create drawer task, payment task, product backend/API files.
- Boundary cần giữ: UI responsive only; không đổi RBAC pricing guard, product creation payload, hook/query/service flow.
- QA nhanh: 320/375/390/768/1440px, long form scroll, sticky submit/reset, pricing labels, generated item codes preview.

## Prompt gợi ý cho Codex
```text
Fix mobile responsive cho /{locale}/sales/product-entry.
Ưu tiên sticky submit/reset mobile, compact summary trước hoặc trong form, pricing fields stack rõ ràng, không đổi RBAC/pricing rules.
Không gọi service trực tiếp từ component.
```

## Architecture Impact
- Layers affected: client UI components only.
- Domain affected: sales product entry, products catalog.
- App affected: `apps/web`.

## Current State vs Target State
- Current: form dài, action cuối trang, summary sau form làm mobile create flow khó hoàn tất.
- Target: mobile form có action visible, field groups stack tốt, summary/item code preview dễ kiểm tra trước submit.

## Boundary Rules
- Must keep: submit orchestration trong hook hiện có; UI không gọi API/service trực tiếp.
- Forbidden: đổi RBAC pricing guard, đổi create product payload, duplicate product creation logic.

## Compatibility & Migration Strategy
- Compatibility window: không có API cutover.
- Deprecation/removal plan: không áp dụng.
- Rollback condition: revert UI-only patch nếu staff/admin product entry submit bị regression.

## In-scope
- Mobile layout for product entry form.
- Sticky/mobile-safe action footer.
- Pricing/group fields breakpoint hardening.
- Sidebar/summary behavior on mobile.

## Out-of-scope
- Admin Products create drawer; xử lý ở Task 096.
- Sales POS checkout/payment modal; payment-specific scope ở Task 098.
- Backend/API changes.

## Deliverables mong muốn
- Patch UI tại:
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntrySidebar.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPricingSection.tsx`
  - Other SalesProductEntry sections if required.

## Done criteria (coding)
- No page-level horizontal overflow at 320px/375px/390px.
- Submit/reset actions remain reachable without scrolling to the absolute bottom after every field edit.
- Pricing and batch item fields do not clip labels or values.
- Summary/item codes are readable and do not dominate mobile vertical space.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không đổi API contract.
- [ ] Không thêm Supabase access ngoài `apps/server`.
- [ ] Có rollback condition rõ ràng.

## Regression Scope
- [ ] Staff/admin RBAC-sensitive pricing field visibility.
- [ ] Product code/name/category validation.
- [ ] Media URL preview.
- [ ] Batch item generation.
- [ ] Submit success and reset draft.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Manual widths: 320, 375, 390, 768, 1440.

## Cập nhật tiến độ
- Cập nhật `progress/tasks.md`.
- Completion log bắt buộc có `Token usage: input=<n>, output=<n>, total=<n>` hoặc `total=<n>`.
