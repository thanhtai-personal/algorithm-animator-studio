# Task 044 - Thêm trạng thái đã bán (SOLD) cho Items + Rà soát logic tồn kho liên quan

## Input ban đầu
- Bổ sung trạng thái `SOLD` cho lifecycle của `items`.
- Đảm bảo item `SOLD` không còn được tính là tồn kho vận hành.
- Rà soát các logic liên quan (RBAC, transition, báo cáo, số liệu tổng hợp).

## Bối cảnh hiện tại
- Domain đã có nhiều trạng thái item (`READY`, `ON_RENT`, `LAUNDRY`, `DAMAGED`, `RETIRED`, ...).
- Các màn hình products/inventory/sales/reports đều có tính số lượng theo trạng thái item.
- Nếu thêm `SOLD` thiếu đồng bộ có thể gây lệch số liệu tồn kho, utilization, hoặc bypass quyền khi tạo item.

## Mục tiêu
- Chuẩn hóa `SOLD` xuyên suốt type/constants/i18n/UI/server/SQL.
- Chặn thao tác tạo item `SOLD` với role không đủ quyền.
- Đảm bảo mọi số liệu “tồn kho/active stock” loại trừ item `SOLD`.
- Giữ khả năng tra cứu item `SOLD` cho mục đích lịch sử/audit.

## Phụ thuộc
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`

## Mapping màn hình/source
- Domain/constants/i18n:
  - `apps/web/src/types/domainPrimitives.ts`
  - `apps/web/src/constants/domainPrimitives.ts`
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`
- Product item create/add flow:
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
  - `apps/web/src/features/products/hooks/useProductDetailPage.ts`
  - `apps/web/src/features/sales/hooks/useSalesProductEntryPage.ts`
- Inventory/stock/reporting:
  - `apps/web/src/features/sales/hooks/useSalesStockPage.ts`
  - `apps/web/src/server/data-access/reports.ts`
  - `apps/web/src/features/products/stores/productsStore.ts`
- SQL:
  - `apps/web/sql/002_showroom_core_schema.sql`
  - `apps/web/sql/017_item_status_sold.sql` (migration bổ sung cho môi trường đã chạy schema cũ)

## Quy tắc nghiệp vụ bắt buộc
- `SOLD` là trạng thái kết thúc vòng đời vận hành; item `SOLD` không được tính trong tồn kho active.
- `SOLD` là trạng thái nhạy cảm, chỉ role manager+ (hoặc tương đương policy hiện hành) mới được set.
- Từ flow tạo mới item (product create / add items / sales entry), backend phải enforce quyền; không chỉ dựa UI.
- Các dashboard/report “active items” phải loại `SOLD` khỏi mẫu số utilization.

## In-scope
- Thêm `SOLD` vào type/constants/labels/status badge/status transition.
- Cập nhật SQL constraints cho `items.status` và `item_status_logs`.
- Bổ sung/siết RBAC cho tạo item với initial status = `SOLD`.
- Rà soát và sửa các phép tính tồn kho/active stock để loại `SOLD`.

## Out-of-scope
- Thay đổi chính sách kế toán/doanh thu khi bán item.
- Thêm module bán đứt/hoá đơn bán.
- Data migration business-level để tự động chuyển trạng thái item cũ sang `SOLD`.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa trạng thái item SOLD và đảm bảo SOLD không bị tính vào tồn kho active.

Yêu cầu:
1) Domain + UI:
   - thêm SOLD vào ItemStatus/constants/i18n/status badge.
   - cập nhật transition matrix và các dropdown status liên quan.

2) Backend:
   - enforce RBAC cho initialStatus=SOLD ở tất cả luồng tạo item.
   - trả lỗi domain rõ ràng (403) khi role không đủ quyền.

3) Stock/report:
   - rà soát mọi phép tính tồn kho/active items.
   - loại SOLD khỏi stock count và utilization denominator.

4) SQL:
   - thêm migration idempotent để cập nhật status check constraints có SOLD.

5) Validation:
   - cd apps/web && npm run typecheck
   - cd apps/web && npx eslint [các file đã sửa]
```

## Done criteria (coding)
- Không còn lỗi parse/validate khi payload có `initialStatus = SOLD`.
- Luồng staff không thể tạo item với trạng thái `SOLD` (backend trả `403`).
- Các màn hình/logic tồn kho active không tính item `SOLD`.
- Utilization report không tính `SOLD` trong `totalActiveItems`.
- SQL migration cho `SOLD` có thể chạy lặp lại an toàn.

## Nhắc test nhanh
- Tạo sản phẩm + batch item với `SOLD` bằng role staff -> bị chặn (403).
- Tạo tương tự bằng role manager -> thành công.
- Sales stock page:
  - filter `ALL`: số lượng tồn không tính `SOLD`;
  - filter `SOLD`: vẫn xem được item đã bán.
- Utilization report trước/sau khi có item `SOLD` phải không bị kéo sai mẫu số.
- Lệnh:
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npx eslint src/server/data-access/products.ts src/server/services/productsService.ts src/server/data-access/reports.ts src/features/sales/hooks/useSalesStockPage.ts src/features/products/stores/productsStore.ts`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 044 thì thêm mới:
  ~~~bash
  sed -i '/^- \\[x\\] 043 /a - [ ] 044 | Add SOLD status for items + stock/report consistency + RBAC hardening | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 044 |- [x] 044 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 044
  - Task file: docs/tasks/044_add_sold_status_for_items.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
