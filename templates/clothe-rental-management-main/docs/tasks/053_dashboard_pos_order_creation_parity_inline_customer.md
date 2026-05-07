# Task 054 - Đồng bộ Dashboard/POS khi tạo đơn + POS inline tạo khách hàng

## Input ban đầu
- Cần đồng bộ cách tạo đơn giữa dashboard và POS.
- POS phải cho phép tạo nhanh khách hàng bằng `số điện thoại + tên` khi search không thấy.

## Mục tiêu
- Dashboard và POS dùng cùng contract tạo đơn (`orderType`, validate, defaults nghiệp vụ).
- POS có inline flow tạo customer trong màn hình tạo đơn.
- Tạo customer xong phải auto-select và tiếp tục flow không thoát màn hình.

## Phụ thuộc
- `docs/tasks/049_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/050_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/008_customers_crm_module.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`

## Mapping màn hình/source
- POS:
  - `apps/web/src/features/sales/components/SalesPosPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Customers:
  - `apps/web/src/features/customers/**`
- Orders create contract:
  - `apps/web/src/features/orders/services/ordersClientService.ts`
  - `apps/web/src/features/orders/queries/useOrdersDomainQueries.ts`
  - `apps/web/src/types/ordersDomain.ts`

## Quy tắc nghiệp vụ bắt buộc
- Dashboard/POS phải dùng cùng schema payload create order.
- Validation chính phải đồng nhất (không để dashboard pass nhưng POS fail vì rule khác).
- POS inline customer create:
  - bắt buộc `phone`, `fullName`.
  - chặn phone invalid/duplicate theo policy hiện tại.
  - tạo thành công -> auto-select customer vừa tạo.
- Không phá flow hiện có của POS quick create.

## In-scope
- Đồng bộ contract + validation create order giữa dashboard và POS.
- Bổ sung UI/hook inline create customer tại POS khi phone search miss.
- Localize message/validation cho vi/en.

## Out-of-scope
- Refactor toàn bộ module customers ngoài luồng cần dùng.
- Thay đổi lớn kiến trúc POS ngoài phạm vi tạo đơn.

## Prompt gợi ý cho Codex
```text
Mục tiêu: đồng bộ create-order giữa dashboard/POS và thêm inline create-customer trong POS.

Yêu cầu:
1) Dùng chung contract payload create order.
2) So khớp validation rule dashboard vs POS.
3) POS: khi search phone không thấy, cho tạo nhanh customer (phone + fullName), tạo xong auto-select.
4) Giữ flow tạo đơn POS mượt, không nhảy màn.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Dashboard/POS submit create-order cùng contract và rule.
- POS có inline create customer khi phone miss.
- Tạo customer thành công thì auto-select.
- Localize đầy đủ text/error cho vi/en.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo đơn từ dashboard và POS cùng input, verify backend xử lý nhất quán.
- POS search phone không thấy:
  - mở form tạo nhanh customer,
  - nhập phone + fullName,
  - tạo thành công,
  - customer auto-selected,
  - tạo đơn thành công.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 054 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 053 /a - [ ] 054 | Dashboard/POS create-order parity + POS inline customer create on phone-miss | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 054 |- [x] 054 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 054
  - Task file: docs/tasks/054_dashboard_pos_order_creation_parity_inline_customer.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
