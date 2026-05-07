# Task 045 - Tự động tạo items theo số lượng (Create Product + Product Detail/Items)

## Input ban đầu
- Không dùng mô hình `product quantity` để quản lý tồn kho.
- Ở form tạo sản phẩm cần bổ sung luồng auto-generate item:
  - nhập số lượng sản phẩm;
  - hệ thống tự sinh danh sách item tương ứng;
  - hiển thị preview ngay trên form;
  - lưu product thì lưu luôn các item đã sinh.
- Ở product detail (tab `Items`) cần có luồng generate nhanh:
  - nhập mã item gốc + số lượng;
  - bấm generate để gọi API tạo thêm item;
  - thành công thì reload list items để thấy item mới ngay.
- Áp dụng cho form tạo mới ở:
  - dashboard products;
  - POS product entry.
- Không thêm field quantity vào form edit overview.

## Bối cảnh hiện tại
- Tồn kho hệ thống đang dựa trên `items` và trạng thái item.
- Form tạo sản phẩm hiện dùng batch item code nhập tay, chưa có cơ chế generate tự động theo số lượng.
- Product detail đã có tab `Items` cho thêm item; cần chuẩn hóa thành flow generate theo số lượng và reload list sau khi API thành công.

## Mục tiêu
- Chuẩn hóa luồng tạo mới sản phẩm theo hướng item-based hoàn toàn (không có `products.quantity`).
- Giảm thao tác nhập tay item code bằng cách auto-generate theo `productCode`.
- Đồng bộ UX và contract giữa dashboard create form và POS create form.
- Bổ sung luồng generate nhanh ở product detail tab `Items` để thêm hàng loạt item cùng cấu hình.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`
- `docs/tasks/044_add_sold_status_for_items.md`

## Quy tắc nghiệp vụ bắt buộc
- Không thêm/không dùng field `products.quantity`.
- Form create product có input `itemQuantity` (số nguyên >= 0).
- Thêm nút `Tự động tạo items` (hoặc tương đương) trong create form.
- Khi người dùng nhập `itemQuantity = n`:
  - phần preview items bên dưới tự generate ra `n` item;
  - mỗi item có `initialStatus` và `size` theo cấu hình chung của form.
- Mã item generate theo pattern:
  - `${productCode}-${index}`;
  - khuyến nghị zero-pad để ổn định sort: `${productCode}-001`, `${productCode}-002`, ...
- Nếu đổi `productCode` hoặc `itemQuantity`, danh sách preview phải regenerate tương ứng.
- Luồng save create product phải gửi/lưu đúng danh sách items đã generate.
- Form edit overview không có input `itemQuantity` và không có nút auto-generate.
- Product detail tab `Items` phải có:
  - input `itemCode` (mã gốc) + input `quantity` (số nguyên > 0, default 1);
  - button `Generate items` (hoặc tương đương) gọi API add items;
  - gửi payload gồm `itemCode`, `quantity`, `initialStatus`, `size`;
  - thành công thì refetch/reload lại product detail để list items hiển thị ngay item mới.

## Mapping màn hình/source
- Dashboard create product:
  - `apps/web/src/features/products/components/ProductsListPage.tsx`
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
- POS create product:
  - `apps/web/src/features/sales/components/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesProductEntryPage.ts`
- Product detail (tab Items):
  - `apps/web/src/features/products/components/ProductDetailPage.tsx`
  - `apps/web/src/features/products/hooks/useProductDetailPage.ts`
- Type/API:
  - `apps/web/src/types/productsCatalog.ts`
  - `apps/web/src/types/salesProductEntry.ts`
  - `apps/web/src/app/api/products/[productId]/items/route.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`

## In-scope
- Bỏ mọi plan liên quan `product quantity fallback` trong task 045.
- Thêm input số lượng + button auto-generate + preview items trong 2 create form.
- Thêm input số lượng + button generate trong product detail tab `Items`.
- Đồng bộ logic generate item code giữa dashboard và POS.
- Đảm bảo payload create product/sales entry lưu đủ items đã generate.
- Đảm bảo API add-items theo quantity hoạt động đúng và detail list reload sau khi tạo thành công.
- Validation và thông báo lỗi rõ ràng (duplicate code, số lượng không hợp lệ, quyền trạng thái SOLD).

## Out-of-scope
- Thay đổi form edit overview ngoài phạm vi tab `Items`.
- Thêm schema/migration cho `products.quantity`.
- Thay đổi logic báo cáo/tồn kho ngoài phạm vi create form + payload tạo product.

## Prompt gợi ý cho Codex
```text
Mục tiêu: bỏ hướng quantity-based stock fallback và chuyển task 045 sang auto-generate items trong create form + product detail tab Items.

Yêu cầu:
1) Create form (dashboard + POS):
   - thêm input `itemQuantity` (default khuyến nghị: 0 hoặc 1 theo UX hiện có).
   - thêm button `Tự động tạo items`.
   - thêm phần preview list items được generate ngay trên form.
   - không thêm các field này vào form edit overview.

2) Product detail (tab `Items`):
   - thêm input `itemCode` + `quantity` (default 1).
   - thêm button `Generate items`.
   - button gọi API add items với payload: `itemCode`, `quantity`, `initialStatus`, `size`.
   - sau khi API thành công: refetch product detail để render lại list item mới.

3) Rule generate:
   - item code = `${productCode}-${index}` (khuyến nghị zero-pad 3 chữ số).
   - đổi productCode hoặc itemQuantity -> regenerate preview list.
   - initialStatus + size của items lấy theo cấu hình chung tại form.

4) Save flow:
   - khi tạo product, gửi payload items đúng theo preview list.
   - khi generate ở detail tab Items, API tạo đúng số lượng item theo quantity.
   - backend vẫn enforce duplicate/rbac/status như hiện tại.

5) Validation:
   - itemQuantity phải là số nguyên >= 0.
   - khi itemQuantity > 0 mà productCode rỗng -> báo lỗi.
   - detail tab: quantity phải là số nguyên > 0, itemCode bắt buộc.
   - map lỗi duplicate/status SOLD sang message localize.

6) Validation commands:
   - cd apps/web && npm run typecheck
   - cd apps/web && npx eslint [các file đã sửa]
```

## Done criteria (coding)
- Dashboard create form có input số lượng + nút auto-generate + preview items.
- POS create form có hành vi tương tự dashboard.
- Mã item được generate đúng pattern `${productCode}-001..n`.
- Save create product lưu đủ items đã generate.
- Product detail tab `Items` có input quantity + button generate và gọi API thành công.
- Sau khi generate ở detail tab `Items`, list item được reload và hiển thị item mới.
- Form edit overview không xuất hiện field auto-generate.
- Không còn code path liên quan `products.quantity` trong scope task 045.

## Nhắc test nhanh
- Dashboard:
  - nhập `productCode=ABC`, `itemQuantity=3` -> preview: `ABC-001`, `ABC-002`, `ABC-003`.
  - đổi `productCode` -> preview đổi theo.
  - lưu product -> vào product detail thấy đủ 3 items.
- POS:
  - nhập số lượng, bấm auto-generate, kiểm tra preview và submit thành công.
  - test role staff/manager với `initialStatus=SOLD` để đảm bảo backend enforce đúng.
- Product detail tab `Items`:
  - nhập `itemCode=ABC`, `quantity=3`, status/size phù hợp -> bấm generate.
  - verify API tạo thêm 3 item (`ABC-001..003` theo rule hiện hành) và list reload thấy item mới.
- Form edit overview:
  - không có input `itemQuantity` / nút auto-generate.
- Lệnh:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npx eslint src/features/products/hooks/useProductsListPage.ts src/features/products/components/ProductsListPage.tsx src/features/sales/hooks/useSalesProductEntryPage.ts src/features/sales/components/SalesProductEntryPage.tsx src/server/services/productsService.ts`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 045 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 044 /a - [ ] 045 | Auto-generate items in create forms + product detail items-tab generate flow, no product quantity fallback | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 045 |- [x] 045 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 045
  - Task file: docs/tasks/045_quantity_based_stock_without_items.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
