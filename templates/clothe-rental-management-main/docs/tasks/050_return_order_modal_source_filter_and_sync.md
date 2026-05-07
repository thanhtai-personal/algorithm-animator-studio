# Task 051 - Form đơn trả trong 1 modal: lọc đơn nguồn + hydrate + đồng bộ trạng thái

## Input ban đầu
- Tạo đơn trả phải chọn đơn thuê tương ứng.
- Không lấy đơn bán trong danh sách nguồn.
- Không lấy đơn thuê đã hoàn thành.
- Dùng `ngày trả thực tế` để tính tiền thuê.
- Khi đơn trả hoàn tất thì đồng bộ trạng thái đơn thuê nguồn.
- Đơn trả là entity riêng, không dùng chung `orderType` với orders domain.

## Mục tiêu
- Tạo return-order flow dạng modal nhiều bước.
- Lọc đơn nguồn chặt theo nghiệp vụ.
- Hydrate dữ liệu từ đơn thuê nguồn ngay khi chọn.
- Chốt luồng đồng bộ trạng thái đơn thuê khi hoàn tất đơn trả.
- Chốt state machine nghiệp vụ cho đơn trả:
  - `Nháp -> Đã tạo đơn -> Xác nhận đã thanh toán và trả hàng -> Hoàn tất đơn trả`.
- Chốt terminal state trung tính cho đơn trả để xử lý cả trường hợp không cần hoàn cọc.

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/050_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`

## Mapping màn hình/source
- UI/hook:
  - `apps/web/src/features/orders/components/OrderDetailPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderDetailPage.ts`
  - (nếu tách page/modal riêng) `apps/web/src/features/orders/components/**`
- Query/service:
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`
- Server:
  - `apps/web/src/app/api/return-orders/**`
  - `apps/web/src/server/services/returnOrdersService.ts`
  - `apps/web/src/app/api/orders/**`
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/data-access/orders.ts`

## Quy tắc nghiệp vụ bắt buộc
- Return order model:
  - đơn trả là entity riêng có `sourceRentalOrderId` bắt buộc.
  - một đơn thuê chỉ có tối đa một return-order đang active tại cùng thời điểm.
- Trạng thái đơn trả phải đi theo flow đã chốt:
  - `DRAFT` (Nháp)
  - `CREATED` (Đã tạo đơn)
  - `RETURN_SETTLED` (Xác nhận đã thanh toán và trả hàng)
  - `COMPLETED` (Terminal trung tính)
  - nhánh hủy: `DRAFT|CREATED -> CANCELLED`.
- Step nghiệp vụ "Hoàn cọc (nếu có)":
  - biểu diễn qua `deposit_refund_status=REFUNDED` (hoặc field tương đương), không dùng làm terminal status duy nhất.
  - nếu đơn không cần hoàn cọc thì set `deposit_refund_status=NOT_REQUIRED` và vẫn được phép `COMPLETED`.
- Source filter cho đơn nguồn:
  - `orderType = RENTAL`
  - bắt buộc `status = PICKED_UP` để được tạo đơn trả
  - loại trừ `COMPLETED`, `CANCELLED`
  - loại trừ đơn đã có return-order active.
- Chọn đơn nguồn xong phải hydrate:
  - khách hàng, items, money summary, deposit/refund context, ngày trả dự kiến.
- `ngày trả thực tế` là input bắt buộc.
- Tính phí thuê/phát sinh dựa trên ngày trả thực tế theo policy.
- Bước xác nhận trả hàng phải gắn với trạng thái `RETURN_SETTLED`.
- Khi đơn trả vào `RETURN_SETTLED`, đơn thuê nguồn bắt buộc chuyển `PICKED_UP -> RETURNED`.
- Nếu có hoàn cọc thì tạo transaction hoàn cọc hợp lệ và set `deposit_refund_status=REFUNDED`.
- Chỉ cho chuyển `RETURN_SETTLED -> COMPLETED` khi:
  - `deposit_refund_status=REFUNDED`, hoặc
  - `deposit_refund_status=NOT_REQUIRED`.
- Khi đơn trả `COMPLETED`, đơn thuê nguồn mới được chuyển từ `RETURNED` sang:
  - `COMPLETED` nếu đã thu đủ,
  - `DEBT` nếu còn nợ (trạng thái pending, sẽ được xử lý tiếp ở màn hình quản lý đơn nợ task 052).

## In-scope
- Return-order modal full-step.
- Source selector + source filter.
- Data hydration từ đơn thuê nguồn.
- Trigger sync trạng thái đơn thuê nguồn sau khi xử lý trả.
- Trạng thái đơn trả + cờ hoàn cọc tách bạch rõ.

## Out-of-scope
- Rule no-partial settlement/DEBT transition chi tiết (task 052).
- KPI/reports doanh thu (task 053).
- POS parity (task 054).

## Prompt gợi ý cho Codex
```text
Mục tiêu: triển khai return-order modal full-step với source filter chặt và sync rental order.

Yêu cầu:
1) Return order là entity riêng, có `sourceRentalOrderId` bắt buộc.
2) Source selector chỉ trả về rental orders hợp lệ.
3) Chọn source -> hydrate dữ liệu đơn thuê vào form đơn trả.
4) Bắt buộc ngày trả thực tế.
5) State machine có `COMPLETED` terminal trung tính + `CANCELLED`; step hoàn cọc đi qua `deposit_refund_status`.
6) Hoàn tất đơn trả -> sync trạng thái đơn thuê nguồn.
7) Không xử lý KPI/report trong task này.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có modal đơn trả nhiều bước.
- Có đủ trạng thái đơn trả: `DRAFT/CREATED/RETURN_SETTLED/COMPLETED/CANCELLED`.
- Có `deposit_refund_status` (hoặc field tương đương) để thể hiện step hoàn cọc.
- Có sync bắt buộc `sourceRentalOrder: PICKED_UP -> RETURNED` khi return-order vào `RETURN_SETTLED`.
- Source filter không trả về sale/completed/cancelled.
- Có hydrate dữ liệu từ source order.
- Có validate bắt buộc ngày trả thực tế.
- Có sync trạng thái đơn thuê nguồn sau action hoàn tất (`RETURNED -> COMPLETED|DEBT(pending)`).
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở modal đơn trả, search nguồn:
  - không thấy đơn bán.
  - không thấy completed/cancelled.
- Chọn nguồn và verify dữ liệu hydrate.
- Nhập ngày trả thực tế và submit.
- Verify từng bước đổi trạng thái đơn trả đúng thứ tự đã định nghĩa.
- Verify ở bước `RETURN_SETTLED`, đơn thuê nguồn được set `RETURNED`.
- Verify case không cần hoàn cọc vẫn `COMPLETED` hợp lệ (`deposit_refund_status=NOT_REQUIRED`).
- Verify case cần hoàn cọc chỉ `COMPLETED` khi `deposit_refund_status=REFUNDED`.
- Verify nhánh hủy đơn trả từ `DRAFT/CREATED`.
- Verify trạng thái đơn thuê nguồn cập nhật đúng theo chuỗi `PICKED_UP -> RETURNED -> (COMPLETED|DEBT pending)`.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 051 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 050 /a - [ ] 051 | Return-order modal: source filter + hydrate + rental status sync | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 051 |- [x] 051 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 051
  - Task file: docs/tasks/051_return_order_modal_source_filter_and_sync.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
