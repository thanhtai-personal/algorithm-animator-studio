# Task 022 - Stylestream UI Clone: Products + Inventory + Customers

## Mục tiêu
- Clone UI nhóm màn hình catalog và CRM-lite theo template Stylestream.
- Bao gồm cả list + detail screens cho products và customers; list + detail/side panel cho inventory.
- Giữ nguyên behavior CRUD/validation/RBAC hiện có.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/008_customers_crm_module.md`
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/admin/Products.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/ProductDetail.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Inventory.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Customers.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/CustomerDetail.tsx`

## Mapping màn hình/source
- Products:
  - route: `apps/web/src/app/[locale]/(dashboard)/products/page.tsx`
  - component: `apps/web/src/features/products/components/ProductsListPage.tsx`
- Product detail:
  - route: `apps/web/src/app/[locale]/(dashboard)/products/[productId]/page.tsx`
  - component: `apps/web/src/features/products/components/ProductDetailPage.tsx`
- Inventory:
  - route: `apps/web/src/app/[locale]/(dashboard)/inventory/page.tsx`
  - component: `apps/web/src/features/inventory/components/InventoryListPage.tsx`
- Inventory detail:
  - route: `apps/web/src/app/[locale]/(dashboard)/inventory/[itemId]/page.tsx`
  - component: `apps/web/src/features/inventory/components/InventoryDetailPage.tsx`
- Customers:
  - route: `apps/web/src/app/[locale]/(dashboard)/customers/page.tsx`
  - component: `apps/web/src/features/customers/components/CustomersListPage.tsx`
- Customer detail:
  - route: `apps/web/src/app/[locale]/(dashboard)/customers/[customerId]/page.tsx`
  - component: `apps/web/src/features/customers/components/CustomerDetailPage.tsx`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone UI Stylestream cho nhóm modules products/inventory/customers.

Yêu cầu:
1) Products list/detail:
   - clone header, search, table rows, tags/chips, tabs layout (overview/items/media)
2) Inventory list/detail:
   - clone status chips row, table style, item detail side panel/sheet style
3) Customers list/detail:
   - clone VIP/blacklist badges, summary cards, order history table layout
4) Tái sử dụng primitives hiện có:
   - DataTableShell, StatusBadge, MoneyInput, Drawer/Sheet tương đương
   - tránh copy-paste component template nguyên xi nếu đã có primitive nội bộ
5) Không đổi logic:
   - giữ nguyên query/service/store flows và RBAC checks
   - giữ voice/file upload/status transition rules hiện có
6) Responsive + i18n:
   - không hardcode text tiếng Anh nếu page đang đi theo i18n keys

Không thay endpoint, không thay business validations.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt strategy detail panel Inventory:
  - giữ route detail riêng + style giống sheet
  - hoặc dùng sheet trực tiếp trên list page (nếu không ảnh hưởng flow hiện tại).
- Chốt mức độ clone tabs Product Detail (overview/items/media) theo source behavior.

## In-scope
- Clone UI list/detail cho products, inventory, customers.
- Đồng bộ visual style badges/cards/tables/forms của nhóm này.

## Out-of-scope
- Thêm API mới hoặc thay data contract.
- Refactor lớn các store/query không liên quan UI.

## Deliverables mong muốn
- 6 màn hình chính của nhóm có visual gần template.
- Không regress các action CRUD và transitions đang hoạt động.

## Done criteria (coding)
- Products list/detail, inventory list/detail, customers list/detail đều dùng style clone.
- Hành vi tìm kiếm/lọc/chọn row/action cũ vẫn hoạt động.
- RBAC/validation hiện có không bị bypass do đổi UI.

## Nhắc test nhanh
- Manual: products list/detail (tabs/media upload/voice fields nếu có).
- Manual: inventory status change flow.
- Manual: customer detail + history table.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 022 |- [x] 022 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 022
  - Task file: docs/tasks/022_stylestream_ui_clone_products_inventory_customers.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
