# Task 085 - Admin Makeup Orders: CRUD quản lý đơn makeup + đơn nhập hàng makeup

## Input ban đầu
- Cần màn hình quản lý đơn makeup (CRUD) trong admin.
- Phạm vi đơn bao gồm:
  - đơn makeup (booking/service order),
  - đơn nhập hàng makeup (purchase invoice/order).

## Mục tiêu
- Xây tab `Orders` cho module makeup với 2 nhóm dữ liệu tách rõ:
  - `Makeup Orders`,
  - `Purchase Invoices`.
- Chuẩn hóa lifecycle trạng thái và hành động CRUD cho cả 2 nhóm đơn.
- Tạo nền dữ liệu để overview makeup có thể tổng hợp chính xác.

## Phụ thuộc
- `docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md`
- `docs/tasks/modules/makeup/010_makeup_admin_inventory_catalog_with_shopee_links_package_artist.md`

## Mapping màn hình/source
- UI:
  - `apps/web/src/app/[locale]/(dashboard)/makeup/orders/page.tsx`
  - `apps/web/src/features/makeup/components/MakeupOrdersPage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupOrdersPage.ts` (new)
- Query/Service:
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts` (extend)
  - `apps/web/src/features/makeup/services/makeupClientService.ts` (extend)
- API:
  - `apps/web/src/app/api/makeup/orders/route.ts` (new)
  - `apps/web/src/app/api/makeup/orders/[orderId]/route.ts` (new)
  - `apps/web/src/app/api/makeup/purchase-invoices/route.ts` (new)
  - `apps/web/src/app/api/makeup/purchase-invoices/[invoiceId]/route.ts` (new)
  - `apps/web/src/server/services/makeupService.ts` (extend)
  - `apps/web/src/server/data-access/makeupOrders.ts` (new)
  - `apps/web/src/server/data-access/makeupPurchaseInvoices.ts` (new)
- Schema:
  - `apps/web/sql/036_makeup_orders_and_purchase_invoices_core.sql` (new)
  - `apps/web/sql/README.md`
- Types:
  - `apps/web/src/types/makeupModule.ts` (extend order/invoice DTO)

## Quy tắc nghiệp vụ bắt buộc
- Tách domain rõ ràng:
  - đơn makeup không dùng bảng orders thuê đồ hiện tại.
  - đơn nhập hàng makeup không dùng thẳng bảng procurement chung nếu chưa có phân vùng module rõ.
- Lifecycle tối thiểu:
  - Makeup order: `BOOKED -> COMPLETED | CANCELLED`.
  - Purchase invoice: `DRAFT -> CONFIRMED -> PAID | CANCELLED`.
- CRUD:
  - tạo/sửa/xóa mềm cho cả 2 nhóm đơn theo RBAC.
- Liên kết dữ liệu:
  - purchase invoice items có thể map với inventory items makeup.
- Branch isolation + RBAC:
  - thao tác trong branch được cấp quyền.

## In-scope
- Tab orders với 2 sub-tab/list:
  - danh sách đơn makeup,
  - danh sách đơn nhập hàng makeup.
- Form CRUD cơ bản + filter + search + pagination.
- API và schema nền cho purchase invoice module makeup.

## Out-of-scope
- Accounting reconciliation sâu giữa nhiều module.
- Tự động đồng bộ nhà cung cấp ngoài hệ thống.
- Workflow phê duyệt nhiều tầng nâng cao.

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây tab Orders cho module makeup, gồm CRUD đơn makeup và đơn nhập hàng makeup.

Yêu cầu:
1) Tạo schema/API/UI riêng cho hai nhóm đơn trong module makeup.
2) Không tái dùng trực tiếp domain thuê đồ nếu không có boundary rõ.
3) Có trạng thái lifecycle rõ cho từng nhóm đơn.
4) Có list + filter + CRUD cơ bản.
5) Đảm bảo branch isolation + RBAC.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Tab orders hoạt động với 2 nhóm dữ liệu.
- CRUD đơn makeup và đơn nhập hàng chạy được end-to-end.
- API/schema tách domain makeup rõ ràng.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo/sửa/hủy đơn makeup và verify status transition.
- Tạo/sửa xác nhận hóa đơn nhập hàng makeup.
- Verify dữ liệu orders tab makeup không hiện đơn thuê đồ.
- Verify data branch A không lộ sang branch B.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng `Modules/Makeup/011` thì thêm vào:
  - `progress/modules/makeup/tasks.md`
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/011 |- [x] Modules/Makeup/011 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/011
  - Task file: docs/tasks/modules/makeup/011_makeup_admin_order_management_crud_makeup_orders_and_purchase_invoices.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
