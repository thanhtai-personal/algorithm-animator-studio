# Task 035 - Staff Product Entry Page (POS-style) + RBAC Staff/Admin

## Mục tiêu
- Tạo màn hình nhập liệu sản phẩm mới theo trải nghiệm thao tác nhanh tương tự POS tại quầy.
- Cho phép nhân viên (`staff`) nhập sản phẩm mới theo luồng chuẩn, nhưng giới hạn quyền ở các trường nhạy cảm.
- Cho phép nhóm admin (`owner_admin`/`manager`) toàn quyền duyệt/chốt dữ liệu sản phẩm.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`

## Nguồn clone template (style-close)
- `templates/stylestream-showcase-main/src/pages/sales/POS.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Products.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/ProductDetail.tsx`

## Mapping màn hình/source
- Sales route mới:
  - `apps/web/src/app/[locale]/sales/product-entry/page.tsx`
- Sales feature layer:
  - `apps/web/src/features/sales/components/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesProductEntryPage.ts`
  - `apps/web/src/features/sales/queries/useSalesQueries.ts` (bổ sung query/mutation cho product entry)
  - `apps/web/src/features/sales/services/salesClientService.ts`
  - `apps/web/src/features/sales/stores/salesStore.ts`
- API/server layer:
  - `apps/web/src/app/api/sales/products/route.ts`
  - `apps/web/src/app/api/sales/products/[productId]/route.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`
- Auth guard/access:
  - `apps/web/src/features/auth/utils/routeAccess.ts`
  - `apps/web/src/features/auth/utils/permissions.ts`
  - `apps/web/src/types/showroomAuth.ts`

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm trang nhập liệu sản phẩm ở khu vực Sales theo style thao tác nhanh như POS,
phân quyền Staff/Admin rõ ràng, không phá kiến trúc hiện có.

Yêu cầu:
1) Route + navigation:
   - thêm route `/{locale}/sales/product-entry`
   - thêm tab/menu trong Sales layout: POS / Returns / Stock / Invoices / Product Entry
   - giữ locale-aware navigation và không tạo redirect loop

2) POS-style product entry UX:
   - form nhập nhanh: tên sản phẩm, category/tag, chất liệu, mô tả ngắn, ảnh cover (MVP 1 ảnh)
   - variant nhập nhanh: tên biến thể, SKU, size/màu, giá thuê cơ bản
   - block nhập lô item ban đầu (serial/code, tình trạng ban đầu) để giảm thao tác sau khi tạo product
   - có panel preview/tóm tắt trước khi submit (tương tự side summary POS)

3) RBAC:
   - `staff`: được tạo product/variant/item ở mức dữ liệu vận hành; không được chỉnh pricing policy nhạy cảm, không archive
   - `owner_admin`/`manager`: full quyền edit/publish/archive + pricing
   - `accountant`: không truy cập route này
   - nếu bổ sung permission key mới, cập nhật đầy đủ type + mapping role

4) Data flow contract:
   - bắt buộc theo Component -> Hook -> Query -> Service -> API/Supabase
   - query fetch/mutation xong phải merge vào store, UI đọc từ store (không dual ownership)
   - create/update xong phải phản ánh ngay ở list/detail liên quan, không cần hard refresh

5) Reuse domain rules:
   - không fork rules của Products/Inventory hiện có
   - validate trùng SKU theo branch đúng rule hiện hành
   - giữ tương thích contract phục vụ showroom/public read-side đã chốt ở Task 006/018

6) UX guardrails:
   - chặn double-submit
   - giữ dữ liệu nháp local trong phiên khi chưa submit
   - hiển thị lỗi theo field + toast tổng quát
```

## In-scope
- Màn hình nhập liệu sản phẩm trong Sales module với trải nghiệm thao tác nhanh.
- Tạo mới product + variant + batch item ban đầu trong cùng flow.
- Phân quyền Staff/Admin theo role matrix nêu trên.
- Đồng bộ dữ liệu sau submit với products/inventory views.

## Out-of-scope
- Bulk import từ Excel/CSV.
- Chỉnh sửa hàng loạt pricing policy nâng cao.
- Workflow duyệt nhiều cấp/phê duyệt 2 bước.

## Done criteria (coding)
- Truy cập được `/[locale]/sales/product-entry` từ Sales layout.
- `staff` tạo mới product + variant + item batch thành công nhưng không sửa pricing nhạy cảm.
- `owner_admin`/`manager` thao tác đầy đủ (gồm pricing/publish/archive nếu có trong scope MVP).
- `accountant` bị chặn truy cập đúng guard policy.
- Sau submit, dữ liệu mới hiển thị nhất quán ở products/inventory liên quan mà không hard refresh.
- Không regression luồng POS hiện có (`/sales/pos`, `/sales/returns`, `/sales/stock`, `/sales/invoices`).

## Nhắc test nhanh
- Manual role matrix:
  - staff: vào được route + tạo dữ liệu nhưng bị block action nhạy cảm
  - owner_admin/manager: full action
  - accountant: bị redirect theo guard
- Manual create flow:
  - tạo product + 1 variant + N item
  - kiểm tra xuất hiện ở products list, product detail, inventory list
- Manual validation:
  - SKU trùng, field bắt buộc, double submit
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`
- `cd apps/web && npm run build`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 035 |- [x] 035 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 035
  - Task file: docs/tasks/035_staff_product_entry_pos_style_rbac.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
