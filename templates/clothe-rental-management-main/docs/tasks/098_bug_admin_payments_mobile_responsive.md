# Task 098 - Bug: Admin Payments mobile responsive

## Mục tiêu
- Sửa responsive mobile cho màn hình Admin Payments và các payment modal liên quan để payment list, filters, edit drawer và receipt confirmation dùng được trên mobile.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`
- `docs/tasks/092_payment_initial_capital_flag_pos_toggle_and_dashboard_capital_procurement_stats.md`
- `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Hiện trạng cần lưu ý
- Payments table uses eight columns and `tableClassName="min-w-[1450px]"`.
- Date range filter packs label + two date inputs into one fixed-height inline label.
- Type/method/branch filters are inline chips.
- Edit drawer footer is right-aligned inline actions.
- Order wizard and POS payment receipt modals need max-height/body-scroll checks so confirm action remains visible on small screens and with virtual keyboard.

## Implementation Context (Token tối ưu)
- Route/screen: `/{locale}/payments` plus payment receipt modal entry points from order wizard/POS.
- Entry component/hook: `PaymentsListPage` + `usePaymentsListPage(locale)`.
- Đọc/sửa trước:
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx`
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx`
  - `apps/web/src/features/sales/views/SalesPosPage/SalesPosPaymentReceiptModal.tsx`
  - `apps/web/src/components/data-display/DataTableShell.tsx` nếu cần contained scroll/shared prop.
  - `apps/web/src/components/filters/FilterBarShell.tsx` nếu filter shell gây overflow.
- Chỉ đọc khi cần:
  - `docs/bugs/017_admin_mobile_responsive_scan_2026-05-06.md` phần "Admin Payments".
  - `apps/web/src/features/payments/hooks/usePaymentsListPage.ts` chỉ khi cần hiểu action props, không sửa business semantics.
- Không cần nạp:
  - Product responsive tasks, payment API/server files, financial formula docs trừ khi phát hiện regression business logic.
- Boundary cần giữ: payment mutations vẫn qua hook/query/service; không đổi payment validation/status lifecycle hoặc settlement semantics.
- QA nhanh: 320/375/390/768/1440px, filters/date range, payment card/table scroll, edit drawer footer, Order Wizard receipt, POS receipt with keyboard.

## Prompt gợi ý cho Codex
```text
Fix mobile responsive cho /{locale}/payments và payment receipt modal liên quan.
Ưu tiên mobile payment cards hoặc contained scroll, stacked filters, viewport-safe edit/receipt modals.
Không đổi payment business validation/status semantics.
```

## Architecture Impact
- Layers affected: client UI components only.
- Domain affected: payments, order create receipt, POS receipt.
- App affected: `apps/web`.

## Current State vs Target State
- Current: payment list is desktop-table-first and modal bodies can hide actions on small screens.
- Target: payment browsing/editing and receipt confirmation are usable on 320-390px mobile screens without losing action buttons.

## Boundary Rules
- Must keep: payment mutations through query/service layer; component only renders UI and calls hook actions.
- Forbidden: weakening payment validation, changing status lifecycle, adding payment business logic in UI.

## Compatibility & Migration Strategy
- Compatibility window: không có API cutover.
- Deprecation/removal plan: không áp dụng.
- Rollback condition: revert UI-only patch if payment update/status/order receipt/POS receipt regress.

## In-scope
- Payments filter bar mobile stacking.
- Payments table mobile card/list or clear contained horizontal scroll.
- Payment edit drawer mobile-safe footer/body.
- Payment receipt modal max-height/scroll/action visibility in Order Wizard and POS.
- Cashbook table responsive hardening if it overflows page.

## Out-of-scope
- Payment API/domain formula changes.
- Realtime notification work.
- Procurement payment flow changes outside visible payment list regressions.

## Deliverables mong muốn
- Patch UI tại:
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx`
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx`
  - `apps/web/src/features/sales/views/SalesPosPage/SalesPosPaymentReceiptModal.tsx`
  - Shared shells only if change is backward-compatible.

## Done criteria (coding)
- No page-level horizontal overflow at 320px/375px/390px unless a table intentionally scrolls inside a contained region.
- Payment filters stack cleanly and date range remains editable.
- Edit drawer actions remain visible/reachable.
- Receipt modal confirm/cancel remain visible with small viewport and keyboard open.
- Desktop payments table remains readable.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không đổi API contract.
- [ ] Không thêm Supabase access ngoài `apps/server`.
- [ ] Có rollback condition rõ ràng.

## Regression Scope
- [ ] Payment date/type/method/branch filtering.
- [ ] Payment status void/repost action.
- [ ] Manual fee/expense payment edit.
- [ ] Order Wizard payment rows and receipt confirmation.
- [ ] POS payment receipt confirmation.
- [ ] Cashbook totals section.

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- Manual widths: 320, 375, 390, 768, 1440.

## Cập nhật tiến độ
- Cập nhật `progress/tasks.md`.
- Completion log bắt buộc có `Token usage: input=<n>, output=<n>, total=<n>` hoặc `total=<n>`.
