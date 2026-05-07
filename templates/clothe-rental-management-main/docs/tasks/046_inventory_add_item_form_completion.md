# Task 046 - Hoàn thiện form thêm item cho sản phẩm trong màn hình tồn kho

## Input ban đầu
- Ở màn hình tồn kho hiện có nút placeholder `Thêm item (MVP sau)`.
- Cần hoàn thiện form để thêm item thật cho sản phẩm ngay tại inventory screen.

## Bối cảnh hiện tại
- `InventoryListPage` đã có button CTA nhưng chưa có modal/form submit.
- Luồng thêm item đã tồn tại ở Product Detail (`POST /api/products/{productId}/items`) và đã có validate RBAC/status/duplicate ở backend.
- Inventory module hiện mới có query list/detail/scan/update status, chưa có create-item mutation.

## Mục tiêu
- Bật luồng “thêm item” trực tiếp từ màn hình tồn kho.
- UX form rõ ràng, nhập nhanh theo batch item code, trạng thái item localize theo ngôn ngữ.
- Giữ đúng kiến trúc `Component -> Hook -> Query -> Service -> API/Supabase`.
- Không phá vỡ rule RBAC/status đã có (`SOLD` chỉ manager+).

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/044_add_sold_status_for_items.md`

## Mapping màn hình/source
- Inventory UI:
  - `apps/web/src/features/inventory/components/InventoryListPage.tsx`
  - `apps/web/src/features/inventory/hooks/useInventoryListPage.ts`
  - `apps/web/src/features/inventory/queries/useInventoryQueries.ts`
  - `apps/web/src/features/inventory/services/inventoryClientService.ts`
  - `apps/web/src/types/inventoryItems.ts`
- Product add-items contract (reuse):
  - `apps/web/src/types/productsCatalog.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/app/api/products/[productId]/items/route.ts`
- Option API wrapper riêng cho inventory (nếu cần):
  - `apps/web/src/app/api/inventory/route.ts`
  - `apps/web/src/server/services/inventoryService.ts`
  - `apps/web/src/server/data-access/inventory.ts`
- Localization/status labels:
  - `apps/web/src/constants/domainPrimitives.ts`
  - `apps/web/src/features/inventory/utils/statusPresentation.ts`
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`

## Quy tắc nghiệp vụ bắt buộc
- Form bắt buộc chọn `product` + nhập ít nhất 1 `itemCode`.
- Hỗ trợ batch input item code (mỗi dòng 1 mã, cho phép phân tách bằng dấu phẩy xuống dòng).
- `initialStatus`:
  - default = `READY`;
  - hiển thị label theo locale;
  - staff không được chọn `SOLD` ở UI;
  - backend vẫn phải enforce quyền cho `SOLD` (không chỉ dựa UI).
- Phát hiện duplicate item code ngay trong payload trước khi submit.
- Khi backend trả lỗi duplicate trong DB (`DUPLICATE_ITEM_CODE`, `DUPLICATE_ITEM_CODE_IN_PAYLOAD`) phải hiển thị lỗi localize rõ ràng.
- Sau khi tạo item thành công:
  - refresh lại inventory list;
  - đóng form + reset draft;
  - hiển thị toast thành công.

## In-scope
- Thêm modal/drawer form “Thêm item” tại Inventory list page.
- Product picker trong form (chọn sản phẩm theo branch hiện tại).
- Add-item mutation trong inventory module (reuse endpoint hiện có hoặc thêm wrapper API inventory nếu thật sự cần).
- Localize text/validation/error message trong form.
- Đồng bộ trạng thái loading/disabled khi submit.

## Out-of-scope
- Refactor lớn toàn bộ module products/inventory.
- Thay đổi schema SQL cho bài toán này.
- Thiết kế mới luồng tạo sản phẩm; chỉ tập trung thêm item vào sản phẩm đã có.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện form thêm item cho sản phẩm trong màn hình tồn kho.

Yêu cầu:
1) UI form:
   - tại `InventoryListPage`, nút "Thêm item (MVP sau)" mở modal/drawer form.
   - form có nhóm field:
     - Sản phẩm: product picker (search theo tên/mã).
     - Batch item: itemCodes multi-line, initialStatus (localized), size (optional).
   - hiển thị loading/disable đúng khi submit.

2) Data flow:
   - theo kiến trúc Component -> Hook -> Query -> Service -> API.
   - thêm mutation ở inventory module để submit create items.
   - ưu tiên reuse API `POST /api/products/{productId}/items`; chỉ thêm API inventory wrapper nếu cần.

3) Validation + RBAC:
   - validate required fields + duplicate trong payload.
   - status `SOLD` chỉ manager+; staff bị chặn ở UI và backend.
   - map lỗi duplicate/forbidden thành thông điệp localize.

4) Post-submit:
   - invalidate inventory list queries để hiển thị item mới ngay.
   - reset form + đóng modal + toast thành công.

5) Validation commands:
   - cd apps/web && npm run typecheck
   - cd apps/web && npx eslint [các file đã sửa]
```

## Done criteria (coding)
- Nút `Thêm item` trên Inventory mở được form nhập liệu thực tế.
- Có thể chọn sản phẩm + nhập batch item + submit thành công từ inventory page.
- Staff không thể tạo item `SOLD`; manager+ tạo được theo rule backend.
- Error duplicate item code hiển thị localize rõ ràng.
- Sau submit, danh sách tồn kho cập nhật ngay không cần hard refresh.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở inventory page -> bấm `Thêm item` -> form hiển thị đầy đủ field và grouped layout.
- Submit thiếu product hoặc thiếu item code -> báo lỗi validation localize.
- Nhập duplicate item code trong cùng payload -> bị chặn ở client.
- Submit item code đã tồn tại DB -> báo lỗi localize đúng.
- Staff thử chọn/submit `SOLD` -> bị chặn; manager submit `SOLD` -> thành công.
- Submit thành công -> modal đóng, toast hiện, table inventory có item mới.
- Lệnh:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npx eslint src/features/inventory/components/InventoryListPage.tsx src/features/inventory/hooks/useInventoryListPage.ts src/features/inventory/queries/useInventoryQueries.ts src/features/inventory/services/inventoryClientService.ts src/server/services/inventoryService.ts`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 046 thì thêm mới:
  ~~~bash
  sed -i '/^- \\[ \\] 045 /a - [ ] 046 | Complete inventory add-item form (product picker + localized status + RBAC-safe submit) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 046 |- [x] 046 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 046
  - Task file: docs/tasks/046_inventory_add_item_form_completion.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
