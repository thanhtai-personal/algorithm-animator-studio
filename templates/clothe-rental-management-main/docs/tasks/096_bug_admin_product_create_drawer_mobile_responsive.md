# Task 096 - Bug: Admin Product create drawer mobile responsive

## Mục tiêu
- Sửa responsive mobile cho drawer tạo sản phẩm trên Admin Products, bảo đảm form dài, media picker, preview và footer submit dùng được trên mobile.

## Phụ thuộc
- `docs/tasks/036_bugs_admin_products_page.md`
- `docs/tasks/089_media_picker_multi_select_for_multi_image_fields.md`
- `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Hiện trạng cần lưu ý
- Drawer create dùng `widthClassName="w-full max-w-full sm:max-w-[85vw] xl:w-[85vw]"`.
- Footer chỉ `flex justify-end gap-2`, chưa tối ưu touch/mobile.
- `ProductOverviewForm` được gọi với `layoutMode="twoColumn"`.
- Product code input + regenerate button là inline row với button `shrink-0`.

## Implementation Context (Token tối ưu)
- Route/screen: `/{locale}/products` -> Create product drawer.
- Entry component/hook: `CreateProductDrawer` nhận state/actions từ `useProductsListPage(locale)`.
- Đọc/sửa trước:
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx`
  - `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx`
  - `apps/web/src/components/layout/DrawerFormShell.tsx` nếu cần chỉnh shell backward-compatible.
- Chỉ đọc khi cần:
  - `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md` phần "Admin Products create drawer".
  - `apps/web/src/features/products/hooks/useProductsListPage/index.ts` chỉ khi cần hiểu submit props, không sửa business logic.
- Không cần nạp:
  - Products table/list task, payment/order files, backend product API/schema files.
- Boundary cần giữ: form/drawer UI-only; submit vẫn qua hook/query/service hiện có; không đổi create-product payload.
- QA nhanh: 320/375/390/768/1440px, open/close drawer, keyboard-safe footer, product code/regenerate, media picker nested modal.

## Prompt gợi ý cho Codex
```text
Fix mobile responsive cho Admin Products create drawer.
Ưu tiên full-screen mobile drawer, sticky footer actions, form controls không squeeze, nested media modal/preview không che submit.
Không đổi payload create product hoặc business rules.
```

## Architecture Impact
- Layers affected: client UI components only.
- Domain affected: products catalog, media picker integration.
- App affected: `apps/web`.

## Current State vs Target State
- Current: desktop drawer/form density có nguy cơ squeeze controls và hide submit trên mobile.
- Target: mobile drawer hoạt động như full-screen form với body scroll rõ ràng, footer/action luôn dễ thao tác, form sections stack hợp lý.

## Boundary Rules
- Must keep: `ProductOverviewForm` là UI-only; submit vẫn đi qua hook/query/service hiện có.
- Forbidden: đổi create-product API, thêm field contract mới, gọi service trực tiếp từ component.

## Compatibility & Migration Strategy
- Compatibility window: không có API cutover.
- Deprecation/removal plan: không áp dụng.
- Rollback condition: revert UI-only patch nếu create product hoặc media picker flow bị regression.

## In-scope
- Drawer/mobile viewport behavior.
- Sticky/mobile-safe footer actions.
- Product code + regenerate button stacking.
- Media preview/gallery grid mobile sizing.
- Nested `MediaPickerModal` smoke check khi mở từ create drawer.

## Out-of-scope
- Products list responsive; xử lý ở Task 095.
- Backend media schema/API changes.
- Product detail edit form.

## Deliverables mong muốn
- Patch UI tại:
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx`
  - `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx`
  - `apps/web/src/components/layout/DrawerFormShell.tsx` nếu cần shared, backward-compatible props.

## Done criteria (coding)
- Create drawer không có horizontal overflow tại 320px/375px/390px.
- Footer cancel/submit dễ bấm, không bị browser keyboard hoặc nested modal che.
- Product code input và regenerate action không squeeze nhau.
- Media preview grid không phá chiều rộng drawer.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không đổi API contract.
- [ ] Không thêm Supabase access ngoài `apps/server`.
- [ ] Có rollback condition rõ ràng.

## Regression Scope
- [ ] Open/close drawer bằng button, backdrop, ESC.
- [ ] Create product with generated/manual product code.
- [ ] Select cover/gallery/video from media picker.
- [ ] Create product error message display.
- [ ] Desktop 85vw drawer layout vẫn dùng tốt.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Manual widths: 320, 375, 390, 768, 1440.

## Cập nhật tiến độ
- Cập nhật `progress/tasks.md`.
- Completion log bắt buộc có `Token usage: input=<n>, output=<n>, total=<n>` hoặc `total=<n>`.
