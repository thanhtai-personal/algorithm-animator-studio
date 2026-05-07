# Task 034 - Unified Staff Sales POS: Redirect + Shift + UI Parity + Feature Completion

> Task này là bản hợp nhất scope staff sales desk + stylestream sales POS parity.

## Mục tiêu
- Xây module Sales/POS riêng cho nhân viên tại quầy.
- Staff đăng nhập vào thẳng Sales POS (không đi qua dashboard admin).
- Clone UI nhóm `templates/.../pages/sales/*` + `SalesLayout.tsx` theo style-close.
- Hoàn thiện đủ nghiệp vụ MVP tại quầy:
  - POS tạo đơn nhanh.
  - Thanh toán + in hóa đơn.
  - Trả hàng nhanh.
  - Tra cứu tồn kho.
  - Mở ca / kết ca.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`
- `docs/tasks/028_stylestream_ui_clone_header_footer_navigation_parity.md`
- `docs/tasks/029_stylestream_ui_clone_multitheme_dark_light_palette.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/components/layouts/SalesLayout.tsx`
- `templates/stylestream-showcase-main/src/pages/sales/POS.tsx`
- `templates/stylestream-showcase-main/src/pages/sales/Returns.tsx`
- `templates/stylestream-showcase-main/src/pages/sales/StockCheck.tsx`
- `templates/stylestream-showcase-main/src/pages/sales/Invoices.tsx`

## Mapping màn hình/source
- Sales routes:
  - `apps/web/src/app/[locale]/sales/layout.tsx`
  - `apps/web/src/app/[locale]/sales/pos/page.tsx`
  - `apps/web/src/app/[locale]/sales/returns/page.tsx`
  - `apps/web/src/app/[locale]/sales/stock/page.tsx`
  - `apps/web/src/app/[locale]/sales/invoices/page.tsx`
  - `apps/web/src/app/[locale]/sales/desk/page.tsx` (alias/redirect)
- Sales feature layer:
  - `apps/web/src/features/sales/**`
- Auth redirect + guard:
  - `apps/web/src/features/auth/utils/authRedirect.ts`
  - `apps/web/src/features/auth/utils/routeAccess.ts`
  - `apps/web/src/features/auth/hooks/routing/useAuthRouting.ts`
  - `apps/web/src/features/auth/hooks/login/useAuthActions.ts`
  - `apps/web/src/features/auth/hooks/callback/useAuthCallbackPage.ts`
  - `apps/web/src/server/services/localeService.ts`
- Shift backend:
  - `apps/web/sql/007_sales_shift_module.sql`
  - `apps/web/src/app/api/sales/shift/{current,open,close}/route.ts`
  - `apps/web/src/server/services/salesDeskService.ts`
  - `apps/web/src/server/data-access/salesDesk.ts`

## Prompt gợi ý cho Codex
```text
Mục tiêu: hợp nhất task 034+035 thành 1 lần triển khai sales POS đầy đủ cho staff.

Yêu cầu:
1) Role redirect + guard:
   - staff login/callback/refresh -> /{locale}/sales/pos
   - owner_admin/manager -> /{locale}/dashboard
   - owner_admin/manager/staff truy cập /sales/* được
   - tránh redirect loop

2) Sales layout + tab parity:
   - clone topbar + tab nav: POS / Returns / Stock / Invoices
   - giữ theme/palette toggle từ app hiện tại

3) POS màn tạo đơn nhanh:
   - product search/grid + cart
   - customer quick select
   - rental days/deposit summary
   - create order dùng logic orders domain hiện có (không fork rule)

4) Returns:
   - list đơn đang thuê + checklist condition từng item + note
   - submit trả hàng dùng flow return hiện có

5) Stock check:
   - search/filter + danh sách sản phẩm + item status table
   - dữ liệu từ inventory module hiện có

6) Invoices + payment:
   - list đơn + preview hóa đơn
   - ghi nhận thanh toán tại quầy
   - action in hóa đơn (MVP browser print)

7) Shift actions:
   - open shift + close shift (opening/closing cash + note)
   - chỉ 1 shift OPEN cho 1 user/branch tại 1 thời điểm (MVP)
   - ghi audit event open/close

8) Constraints:
   - giữ architecture Component -> Hook -> Query -> Service -> API/Supabase
   - không đổi status machine / refund policy / reconciliation rules / payload cũ
```

## In-scope
- Hợp nhất và hoàn thiện toàn bộ scope sales desk + sales UI parity trong 1 task.
- Shift module backend tối thiểu để open/close và truy vấn ca hiện tại.

## Out-of-scope
- Hardware POS integration (ESC/POS printer, scanner native, cash drawer).
- Payroll/chấm công đầy đủ.
- Thay đổi policy kế toán/hoàn tiền ngoài nghiệp vụ hiện có.

## Done criteria (coding)
- Staff đăng nhập luôn vào `/[locale]/sales/pos`.
- Sales module có 4 màn chạy được nghiệp vụ MVP.
- Open/close shift hoạt động + có validation + có audit event.
- UI style-close theo template sales.
- Không regression auth + orders/payments/inventory core flows.

## Nhắc test nhanh
- Manual role matrix:
  - staff -> sales pos
  - owner_admin/manager -> dashboard, truy cập sales được
  - accountant -> theo guard policy đã chốt
- Manual flow:
  - open shift -> create order -> add payment -> print invoice -> return -> close shift
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`
- `cd apps/web && npm run build`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 034 |- [x] 034 |" progress/tasks.md
~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 034
  - Task file: docs/tasks/034_staff_sales_pos_unified_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
