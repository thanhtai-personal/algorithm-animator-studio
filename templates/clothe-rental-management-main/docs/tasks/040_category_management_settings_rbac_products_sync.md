# Task 040 - Quản Lý Danh Mục Sản Phẩm (Standalone page ngang cấp Products + RBAC + đồng bộ Products/Showroom)

## Input ban đầu
- Thiếu phần quản lý danh mục.
- Cần bổ sung task riêng để triển khai đầy đủ chức năng quản lý danh mục theo chuẩn các task hiện có.

## Bối cảnh hiện tại
- Màn hình sản phẩm đã dùng `categoryId` để tạo/sửa/filter sản phẩm.
- Danh mục cần một màn hình quản trị riêng ngang cấp với `Products` (không đặt trong Settings tabs) để:
  - thêm mới danh mục;
  - sửa tên/mã;
  - bật/tắt hoạt động;
  - xử lý an toàn khi danh mục đã được gán cho sản phẩm.

## Mục tiêu
- Bổ sung module quản lý danh mục sản phẩm ở route riêng `/{locale}/categories` (dashboard-level).
- Route cũ `/{locale}/settings/categories` chỉ dùng redirect về `/{locale}/categories` để tương thích link cũ.
- Chuẩn hóa luồng dữ liệu kiến trúc:
  - `Component -> Hook -> Query -> Service -> API -> DB`
- Đảm bảo khi danh mục thay đổi:
  - form tạo/sửa sản phẩm và bộ lọc sản phẩm cập nhật đồng bộ, không cần hard refresh;
  - showroom chỉ hiển thị danh mục hợp lệ theo rule hoạt động.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`

## Mapping màn hình/source
- Category management standalone page:
  - `apps/web/src/app/[locale]/(dashboard)/categories/page.tsx` (mới)
  - `apps/web/src/app/[locale]/(dashboard)/settings/categories/page.tsx` (redirect)
  - `apps/web/src/features/settings/components/SettingsCategoriesPage.tsx` (dùng cho route standalone)
  - `apps/web/src/features/settings/hooks/useSettingsCategoriesPage.ts` (hook xử lý CRUD + branch filter)
  - `apps/web/src/features/app-shell/constants.ts` (thêm nav item `categories`)
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts` (label/href)
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx` (icon)
  - `apps/web/src/features/settings/queries/useSettingsQueries.ts` (mở rộng)
  - `apps/web/src/features/settings/services/settingsClientService.ts` (mở rộng)
  - `apps/web/src/features/settings/stores/settingsStore.ts` (mở rộng)
- API/server:
  - `apps/web/src/app/api/settings/product-categories/route.ts` (mới)
  - `apps/web/src/app/api/settings/product-categories/[categoryId]/route.ts` (mới)
  - `apps/web/src/server/services/settingsService.ts` (mở rộng)
  - `apps/web/src/server/data-access/settings.ts` (mở rộng)
  - `apps/web/src/types/settingsModule.ts` (mở rộng contract)
- Đồng bộ products/showroom:
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
  - `apps/web/src/features/products/hooks/useProductDetailPage.ts`
  - `apps/web/src/features/products/queries/useProductsQueries.ts`
  - `apps/web/src/features/showroom/hooks/useShowroomListPage.ts`

## Data contract đề xuất
- Sử dụng bảng hiện có `product_categories` (ưu tiên), bổ sung migration nếu thiếu cột:
  - `code text not null`
  - `name text not null`
  - `branch_id uuid null/not null` theo thiết kế hiện tại
  - `is_active boolean not null default true`
  - `sort_order integer not null default 0` (nếu chưa có)
  - `created_at/updated_at`
- Ràng buộc:
  - unique `code` theo phạm vi branch (`branch_id, lower(code)`)
  - `name` không rỗng (`btrim(name) <> ''`)

## Quy tắc nghiệp vụ bắt buộc
- Phân quyền danh mục phải giống màn hình `Products`:
  - cho phép vai trò dashboard quản lý sản phẩm (`owner_admin`/`admin`/`manager`) thao tác CRUD theo branch scope;
  - `staff`/`customer` không truy cập được route dashboard categories.
- Không cho tạo/sửa với `code` trùng trong cùng branch.
- Khi danh mục đã được gán cho sản phẩm:
  - không xóa cứng trong MVP;
  - dùng `is_active=false` (soft disable), hoặc chặn delete với lỗi nghiệp vụ rõ ràng.
- Products create/edit:
  - chỉ cho chọn danh mục `is_active=true`.
- Filter/list:
  - vẫn hỗ trợ hiển thị/sửa sản phẩm cũ có danh mục đã ngừng hoạt động, nhưng phân biệt nhãn trạng thái danh mục.

## API contract đề xuất
- `GET /api/settings/product-categories?branchId=...`
- `POST /api/settings/product-categories`
  - payload: `code`, `name`, `branchId?`, `isActive?`, `sortOrder?`
- `PATCH /api/settings/product-categories/{categoryId}`
  - payload: partial fields (`code`, `name`, `isActive`, `sortOrder`)
- `DELETE /api/settings/product-categories/{categoryId}` (nếu có)
  - mặc định nên chặn khi đang được tham chiếu bởi products.

## In-scope
- CRUD danh mục ở route standalone `/{locale}/categories`.
- Validate dữ liệu + RBAC + branch scope ở server.
- Đồng bộ query/store để Products page nhận danh mục mới ngay sau thao tác.
- Bổ sung migration SQL nếu schema chưa đủ cho quản trị danh mục ổn định.
- Cập nhật i18n copy VI/EN cho nav + màn hình categories.

## Out-of-scope
- Quản lý taxonomy đa cấp (parent/child category).
- Mapping danh mục theo showroom riêng biệt.
- Import/export hàng loạt từ file.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm module quản lý danh mục sản phẩm ở route dashboard riêng `/{locale}/categories`, có RBAC và đồng bộ sang Products/Showroom.

Yêu cầu:
1) Xây màn Categories riêng ngang cấp Products:
   - list, create, edit, activate/deactivate (và delete nếu policy cho phép)
   - route chính: `/{locale}/categories`
   - route cũ `/{locale}/settings/categories` redirect sang route mới

2) API + server:
   - thêm endpoint CRUD `/api/settings/product-categories`
   - validate code/name, unique theo branch, xử lý reference-safe khi category đã được gán cho product
   - enforce RBAC giống Products screen (`owner_admin/admin/manager`)

3) Đồng bộ products:
   - create/edit product form dùng danh mục mới ngay sau khi thao tác settings
   - chỉ cho chọn category active trong create mới

4) SQL:
   - thêm migration nếu thiếu cột/ràng buộc (`sort_order`, unique index, checks...)
   - migration idempotent

5) Kiến trúc:
   - Component -> Hook -> Query -> Service -> API -> DB
   - không gọi service trực tiếp trong component
```

## Done criteria (coding)
- Có route dashboard riêng `/{locale}/categories` để quản lý danh mục.
- Sidebar hiển thị menu `Categories` ngang cấp `Products`.
- `/{locale}/settings/categories` redirect đúng sang `/{locale}/categories`.
- CRUD danh mục hoạt động đúng RBAC + branch scope.
- Chặn trùng `code` và xử lý đúng khi category đang được product tham chiếu.
- Products page (create/edit/filter) đồng bộ dữ liệu danh mục ngay sau thay đổi.
- `npm run lint:mvp` và `npm run typecheck:mvp` pass.

## Nhắc test nhanh
- RBAC:
  - staff/customer không truy cập hoặc không thao tác được.
  - owner_admin/admin/manager thao tác được như Products.
- CRUD:
  - tạo category mới -> xuất hiện ở products form.
  - sửa tên/mã -> products filter/select cập nhật.
  - tắt active -> không cho chọn mới trong create product.
  - thử delete category có product tham chiếu -> bị chặn đúng rule.
- Lệnh:
  - `cd apps/web && npm run lint:mvp`
  - `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 040 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 039 /a - [ ] 040 | Product category management in settings (CRUD + RBAC + products sync) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 040 |- [x] 040 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 040
  - Task file: docs/tasks/040_category_management_settings_rbac_products_sync.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
