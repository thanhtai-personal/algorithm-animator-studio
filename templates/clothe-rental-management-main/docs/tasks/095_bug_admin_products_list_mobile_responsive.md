# Task 095 - Bug: Admin Products list mobile responsive

## Mục tiêu
- Sửa responsive mobile cho màn hình Admin Products list để filter, toolbar, table/list và pagination dùng được trên viewport nhỏ.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/036_bugs_admin_products_page.md`
- `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Hiện trạng cần lưu ý
- Search filter đang có `min-w-64 flex-1`.
- Filter category/tag/ready-only là fixed inline chips.
- Products table dùng `DataTableShell` với `disableTableInnerScroll`, dễ làm page bị overflow ngang.
- Toolbar selected/page/total + bulk delete đang là cụm inline dày.

## Implementation Context (Token tối ưu)
- Route/screen: `/{locale}/products` - Admin Products list.
- Entry component/hook: `ProductsListPage` + `useProductsListPage(locale)`.
- Đọc/sửa trước:
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx`
  - `apps/web/src/features/products/views/ProductsListPage/ProductsTableRows.tsx`
  - `apps/web/src/components/data-display/DataTableShell.tsx` nếu cần contained scroll/shared prop.
  - `apps/web/src/components/filters/FilterBarShell.tsx` nếu filter shell gây overflow.
- Chỉ đọc khi cần:
  - `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md` phần "Admin Products list".
- Không cần nạp:
  - Toàn bộ `docs/tasks/**`, product API/service/server files, payment/order task files.
- Boundary cần giữ: UI-only; không đổi hook/query/service/API contract và không thêm Supabase access.
- QA nhanh: 320/375/390/768/1440px, check page-level horizontal overflow, filter wrapping, bulk toolbar, pagination touch.

## Prompt gợi ý cho Codex
```text
Fix mobile responsive cho Admin Products list tại /{locale}/products.
Tập trung filter stack full-width mobile, toolbar không tràn, table có mobile card/list hoặc contained scroll rõ ràng.
Không đổi business logic, không đổi query/service/API contract.
Giữ flow Component -> Hook -> Query -> Service -> API.
```

## Architecture Impact
- Layers affected: client UI components only.
- Domain affected: products catalog.
- App affected: `apps/web`.

## Current State vs Target State
- Current: desktop-first filter/table layout có nguy cơ overflow ở 320-390px.
- Target: mobile-first list usable without page-level horizontal overflow; desktop layout giữ nguyên hoặc chỉ tinh chỉnh tối thiểu.

## Boundary Rules
- Must keep: component chỉ render UI và gọi hook hiện có; không gọi service/API trực tiếp.
- Forbidden: thêm business endpoint, đổi payload product, query Supabase từ web client.

## Compatibility & Migration Strategy
- Compatibility window: không có API cutover.
- Deprecation/removal plan: không áp dụng.
- Rollback condition: revert UI-only patch nếu desktop table hoặc bulk delete bị regression.

## In-scope
- Products filter bar mobile stacking.
- Products table/list mobile rendering strategy.
- Toolbar and pagination responsive behavior.
- Manual responsive QA notes.

## Out-of-scope
- Product create drawer; xử lý ở Task 096.
- Product detail page.
- API/query/store refactor.

## Deliverables mong muốn
- Patch UI tại:
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx`
  - `apps/web/src/features/products/views/ProductsListPage/ProductsTableRows.tsx` nếu cần mobile rows/cards.
  - Shared shells only if change is backward-compatible.

## Done criteria (coding)
- Không có page-level horizontal overflow tại 320px/375px/390px.
- Search/filter controls có width ổn định và không clipped text.
- Bulk delete toolbar không đè table title/subtitle.
- Pagination dùng được bằng touch trên mobile.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không đổi API contract.
- [ ] Không thêm Supabase access ngoài `apps/server`.
- [ ] Có rollback condition rõ ràng.

## Regression Scope
- [ ] Products search/category/tag/ready-only filter.
- [ ] Select all/current page selection.
- [ ] Bulk delete confirmation.
- [ ] Quick cover media picker entry point không regression.
- [ ] Desktop products table vẫn đọc được.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Manual widths: 320, 375, 390, 768, 1440.

## Cập nhật tiến độ
- Cập nhật `progress/tasks.md`.
- Completion log bắt buộc có `Token usage: input=<n>, output=<n>, total=<n>` hoặc `total=<n>`.
