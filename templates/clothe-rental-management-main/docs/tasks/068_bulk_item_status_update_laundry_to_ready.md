# Task 068 - Cập nhật trạng thái hàng loạt cho item (ưu tiên luồng Giặt là -> Sẵn sàng)

## Input ban đầu
- Hiện tại thao tác đổi trạng thái item chủ yếu theo từng item đơn lẻ.
- Nhu cầu vận hành thực tế: sau khi giặt xong thường cần đưa nhiều item từ `LAUNDRY` về `READY` trong một lần thao tác.
- Màn POS `Tồn kho` (stock lookup) đang hiển thị theo nhóm sản phẩm + list item, nhưng chưa có thao tác batch update status.

## Mục tiêu
- Bổ sung khả năng chọn nhiều item và cập nhật trạng thái hàng loạt.
- Tối ưu luồng vận hành chính: `LAUNDRY -> READY`.
- Đảm bảo sau khi cập nhật, số liệu `ready count` trên list/group được refresh ngay, không cần hard refresh.

## Phụ thuộc
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/050_return_order_modal_source_filter_and_sync.md`
- `docs/tasks/063_global_status_localization_across_all_screens.md`

## Mapping màn hình/source
- POS stock page:
  - `apps/web/src/app/[locale]/sales/stock/page.tsx`
  - `apps/web/src/features/sales/components/SalesStockPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesStockPage.ts`
- Admin inventory page:
  - `apps/web/src/app/[locale]/(dashboard)/inventory/page.tsx`
  - `apps/web/src/features/inventory/components/InventoryListPage.tsx`
  - `apps/web/src/features/inventory/hooks/useInventoryListPage.ts`
- Query/service/client contracts:
  - `apps/web/src/features/inventory/queries/useInventoryQueries.ts`
  - `apps/web/src/features/inventory/services/inventoryClientService.ts`
  - `apps/web/src/types/inventoryItems.ts`
- API + server:
  - `apps/web/src/app/api/inventory/**` (bổ sung bulk status route)
  - `apps/web/src/server/services/inventoryService.ts`
  - `apps/web/src/server/data-access/inventory.ts`

## Quy tắc nghiệp vụ bắt buộc
- Cho phép cập nhật theo batch nhiều `itemId` trong cùng request.
- Luồng ưu tiên đầu tiên:
  - action nhanh `Đánh dấu sẵn sàng` cho các item đang `LAUNDRY`.
- Vẫn phải tuân thủ đầy đủ rule transition hiện có:
  - kiểm tra `INVALID_STATUS_TRANSITION`,
  - kiểm tra `READY_BLOCKED_BY_ACTIVE_RESERVATION` cho từng item,
  - kiểm tra quyền với các status manager-only (nếu có mở rộng target status).
- Ghi `item_status_logs` cho từng item cập nhật thành công.
- Không fail cả batch chỉ vì một vài item lỗi:
  - trả summary `total/success/failed`,
  - trả chi tiết item fail + reason code để FE hiển thị.
- Sau mutation thành công phải invalidate/refetch list liên quan để cập nhật ngay:
  - inventory lists,
  - stock lookup grouped ready count.

## In-scope
- UI chọn nhiều item (checkbox row + chọn tất cả trong view/filter hiện tại).
- Thanh action batch (bulk action bar) cho thao tác đổi trạng thái.
- API/Service/Data-access xử lý bulk update trạng thái item.
- Kết quả phản hồi có summary + failed details để FE toast/message rõ ràng.
- Đồng bộ refresh dữ liệu trên POS stock page và Admin inventory page sau khi cập nhật.

## Out-of-scope
- Auto scheduling hoặc workflow tự động từ hệ thống giặt ủi bên ngoài.
- Batch update xuyên nhiều chi nhánh trong cùng request.
- Thiết kế lại toàn bộ layout inventory/stock ngoài phần cần cho bulk status action.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm tính năng cập nhật trạng thái hàng loạt cho item, ưu tiên luồng LAUNDRY -> READY.

Yêu cầu:
1) Bổ sung bulk status update end-to-end theo flow kiến trúc Component -> Hook -> Query -> Service -> API -> Data-access.
2) Thêm UI chọn nhiều item + action nhanh "Đánh dấu sẵn sàng" trên:
   - POS stock page,
   - Admin inventory list.
3) API bulk update nhận danh sách itemIds + target status, trả summary:
   - total, success, failed
   - failedItems[{ itemId, itemCode, reasonCode, reasonMessage }]
4) Áp dụng đầy đủ rule transition hiện tại cho từng item (invalid transition, ready blocked by reservation, RBAC).
5) Ghi item_status_logs cho từng item thành công.
6) Sau thành công, invalidate/refetch để cập nhật ngay ready count trên list/group (không cần hard refresh).
7) Không refactor lan rộng ngoài scope.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có thể chọn nhiều item và thực hiện batch status update trong UI.
- Có quick action `LAUNDRY -> READY` phục vụ vận hành giặt.
- API bulk update hoạt động với response summary + failed details rõ ràng.
- Không phá vỡ quy tắc transition/RBAC/log hiện có.
- Sau thao tác batch, số item `READY` trên các list/group cập nhật đúng ngay trong phiên.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Chọn nhiều item `LAUNDRY` và đổi sang `READY`:
  - verify số `ready/total` cập nhật ngay ở POS stock và admin inventory.
- Batch có item bị block bởi reservation:
  - item đó fail đúng reason, item khác vẫn success.
- Batch có item transition không hợp lệ:
  - trả failed details đúng, không crash toàn batch.
- Kiểm tra `item_status_logs`:
  - mỗi item success có log mới, actor và from/to status đúng.
- Kiểm tra RBAC:
  - role không đủ quyền cho status manager-only phải bị chặn đúng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 068 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 067 /a - [ ] 068 | Bulk item status update: multi-select + batch transition (focus LAUNDRY -> READY) for POS stock and admin inventory | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 068 |- [x] 068 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 068
  - Task file: docs/tasks/068_bulk_item_status_update_laundry_to_ready.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
