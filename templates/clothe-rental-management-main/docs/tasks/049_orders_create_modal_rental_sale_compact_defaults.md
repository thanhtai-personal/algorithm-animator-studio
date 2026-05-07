# Task 050 - Form tạo đơn thuê/bán trong 1 modal, mặc định nhập liệu hợp lý

## Input ban đầu
- Form tạo đơn cần gọn hơn và chạy full-step trong 1 modal.
- Có selector loại đơn `thuê`/`bán`.
- Nếu là đơn bán thì chỉ hiện field phù hợp đơn bán.
- Nếu là đơn thuê thì áp dụng default values hợp lý.

## Mục tiêu
- Xây dựng flow create order (dashboard) theo dạng modal nhiều bước.
- Áp dụng dynamic field set theo `orderType`.
- Đảm bảo default values cho RENTAL:
  - `ngày bắt đầu = hôm nay`
  - `ngày trả dự kiến = ngày mai`
  - `giờ nhận đồ mặc định = 07:00` (nếu có input time).
  - `giờ trả đồ mặc định = 07:00` (nếu có input time).
- Đổi label `ngày trả hàng` -> `ngày trả dự kiến`.
- Chuẩn hóa action trên danh sách đơn: thay button text `Chi tiết` bằng icon button.

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/010_orders_list_and_create_flow.md`

## Mapping màn hình/source
- UI/hook:
  - `apps/web/src/features/orders/components/OrderWizardPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
  - `apps/web/src/features/orders/components/OrdersListPage.tsx` (entry points)
- Query/service:
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/features/orders/services/ordersClientService.ts`
- Types/labels:
  - `apps/web/src/types/ordersDomain.ts`
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`

## Quy tắc nghiệp vụ bắt buộc
- `orderType` là bước đầu tiên trong flow.
- RENTAL:
  - hiện đầy đủ field thuê (period, pickup/return time, deposit,...).
- SALE:
  - ẩn/disable toàn bộ field chỉ dành cho thuê.
  - hiện field giá bán/thu tiền/ghi chú bán theo policy.
- Không cho submit nếu field bắt buộc của từng loại đơn chưa hợp lệ.
- Vẫn giữ kiến trúc `Component -> Hook -> Query -> Service -> API`.

## In-scope
- Refactor create flow sang 1 modal full-step.
- Dynamic form theo `orderType`.
- Default values + label rename cho RENTAL.
- Cập nhật UI action `Chi tiết` ở list theo dạng icon button (không đổi behavior điều hướng/mở chi tiết).

## Out-of-scope
- Return-order modal (task 051).
- Settlement no-partial/DEBT handling (task 052).
- Revenue/report aggregation (task 053).

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa form tạo đơn (RENTAL/SALE) trong 1 modal.

Yêu cầu:
1) Thêm bước chọn orderType.
2) RENTAL/SALE render field set khác nhau.
3) RENTAL có default date/time hợp lý và đổi label ngày trả dự kiến.
4) Submit payload đúng contract orderType.
5) Không đổi logic settlement/report ở task này.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Form tạo đơn chạy full-step trong 1 modal.
- Có selector `RENTAL/SALE`.
- RENTAL/SALE hiển thị field đúng nghiệp vụ.
- RENTAL có default date/time đúng.
- Action `Chi tiết` trên danh sách đơn hiển thị bằng icon button đúng spec.
- Payload gửi lên đúng `orderType`.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở modal tạo đơn từ danh sách đơn.
- Chuyển qua lại RENTAL/SALE và verify field thay đổi đúng.
- Submit RENTAL và SALE thành công.
- Verify label `ngày trả dự kiến` hiển thị đúng.
- Verify action `Chi tiết` hiển thị icon button và click vẫn mở đúng trang/modal chi tiết.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 050 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 049 /a - [ ] 050 | Create-order modal: RENTAL/SALE dynamic fields + compact defaults | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 050 |- [x] 050 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 050
  - Task file: docs/tasks/050_orders_create_modal_rental_sale_compact_defaults.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
