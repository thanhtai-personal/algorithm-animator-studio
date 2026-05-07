# Tiến Độ Bugs

## Cách dùng
- Sau khi hoàn thành bugfix trong `docs/bugs`, cập nhật checklist và append 1 log entry vào file này.
- Dùng lệnh mẫu trong mục `Cập nhật tiến độ` ở cuối từng file bug.
- Bug ID đánh số từ `001` và tăng dần trong `docs/bugs`.
- Completion log bắt buộc có dòng `Token usage` (input/output/total hoặc total).
- Không xóa log cũ; chỉ append để giữ lịch sử.

## Checklist
- [x] 001 | Bugfix orders summary: exclude CANCELLED from total rental and outstanding KPI cards | status=done | owner=[codex] | started=[2026-03-08] | done=[2026-03-08]
- [x] 002 | Bugfix POS create-order Invalid payload: allow nullable optional numeric fields in /api/orders parser | status=done | owner=[codex] | started=[2026-03-08] | done=[2026-03-08]
- [x] 003 | Bugfix confirm modal top-layer over order modal + remove status suffix in action labels (RESERVED/CONFIRMED) | status=done | owner=[codex] | started=[2026-03-08] | done=[2026-03-08]
- [x] 004 | Bugfix return-order create flow: fix INVALID_PAYMENT on valid settlement payload | status=done | owner=[codex] | started=[2026-03-08] | done=[2026-03-08]
- [x] 005 | Bugfix admin create rental order: show success toast on successful submit | status=done | owner=[codex] | started=[2026-03-08] | done=[2026-03-08]
- [x] 006 | Bugfix sales shift current-detail API: avoid generic Unexpected error and expose actionable error message | status=done | owner=[codex] | started=[2026-03-09] | done=[2026-03-09]
- [ ] 007 | Bugfix return-order sources pagination: remove hard-cap 300 + avoid local slicing truncate | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]
- [ ] 008 | Bugfix POS available count: remove inventory pageSize=500 cap and use full-scope availability aggregation | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]
- [ ] 009 | Bugfix list APIs: remove overfetch + memory pagination in customers/inventory/products/showroom flows | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]
- [ ] 011 | Bugfix procurement Excel import: remove unit_cost column, verify purchase_price mapping, and rename rent/day labels to rent price | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]
- [x] 012 | Bugfix soft-delete system-wide: add is_delete to business tables, convert delete APIs to soft-delete, and exclude deleted rows from all API reads | status=done | owner=[codex] | started=[2026-04-22] | done=[2026-04-22]
- [x] 013 | Bugfix admin settings update requires rebuild: ensure public UI reads fresh config without rebuild/deploy | status=done | owner=[codex] | started=[2026-04-22] | done=[2026-04-22]
- [x] 014 | Bugfix products: allow create with code colliding inactive record + block is_delete=true rows from all read APIs | status=done | owner=[codex] | started=[2026-04-22] | done=[2026-04-22]
- [ ] 015 | Bugfix web supabase auth helper: handle network failure from auth.getUser with try/catch and stable API error mapping | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]
- [ ] 016 | Investigate web page global error retry-once behavior | status=todo | owner=[codex] | started=[2026-05-02] | done=[YYYY-MM-DD]

## Completion Log
<!-- Append logs below this line. -->

### 2026-03-08 - Bug 001
- Bug file: docs/bugs/001_orders_summary_exclude_cancelled_from_total_and_outstanding.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npx eslint src/features/orders/components/OrdersListPage.tsx` pass; `cd apps/web && npm run typecheck` pass]
- Main files changed: [apps/web/src/features/orders/components/OrdersListPage.tsx], [progress/bugs.md]
- Known gaps: [none]

### 2026-03-08 - Bug 002
- Bug file: docs/bugs/002_pos_create_order_invalid_payload_on_nullable_numeric_fields.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npx eslint src/server/services/ordersService.ts` pass; `cd apps/web && npm run typecheck` pass]
- Main files changed: [apps/web/src/server/services/ordersService.ts], [progress/bugs.md]
- Known gaps: [none]

### 2026-03-08 - Bug 003
- Bug file: docs/bugs/003_confirm_modal_hidden_under_order_modal_and_remove_status_suffix_labels.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npx eslint src/components/feedback/AppModalProvider.tsx src/features/orders/components/OrderWizardPage.tsx src/features/orders/hooks/useOrderWizardPage.ts src/features/sales/components/SalesPosPage.tsx` pass; `cd apps/web && npm run typecheck` pass]
- Main files changed: [apps/web/src/components/feedback/AppModalProvider.tsx], [apps/web/src/features/orders/components/OrderWizardPage.tsx], [apps/web/src/features/orders/hooks/useOrderWizardPage.ts], [apps/web/src/features/sales/components/SalesPosPage.tsx], [progress/bugs.md]
- Known gaps: [Chưa chạy manual browser regression trên toàn bộ popup confirm trong mọi module ngoài orders/sales]

### 2026-03-08 - Bug 004
- Bug file: docs/bugs/004_return_order_create_invalid_payment.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npm run typecheck` pass; `cd apps/web && npx eslint src/server/services/returnOrdersService.ts src/server/services/ordersService.ts` pass]
- Main files changed: [apps/web/src/server/services/returnOrdersService.ts], [apps/web/src/server/services/ordersService.ts], [progress/bugs.md]
- Known gaps: [Chưa chạy manual browser flow cho return-order modal/admin trên runtime thực tế]

### 2026-03-08 - Bug 005
- Bug file: docs/bugs/005_admin_rental_order_success_missing_toast.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npm run typecheck` pass; `cd apps/web && npx eslint src/features/orders/hooks/useOrderWizardPage.ts` pass]
- Main files changed: [apps/web/src/features/orders/hooks/useOrderWizardPage.ts], [progress/bugs.md]
- Known gaps: [Chưa chạy manual browser test create rental order admin modal/page]

### 2026-03-09 - Bug 006
- Bug file: docs/bugs/006_sales_shift_current_detail_unexpected_error.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npm run typecheck` pass; `cd apps/web && npx eslint src/server/services/salesDeskService.ts` pass]
- Main files changed: [apps/web/src/server/services/salesDeskService.ts], [progress/bugs.md]
- Known gaps: [Không thể reproduce end-to-end với session branch thực tế trong môi trường CLI này, đã fix nhánh mapping lỗi object từ Supabase/Postgrest để tránh trả generic "Unexpected error"]

### 2026-04-22 - Bug 012
- Bug file: docs/bugs/012_system_wide_soft_delete_is_delete_for_all_api_tables.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/server && npm run build` pass; `cd apps/server && npm run lint` fail do baseline unrelated lint errors; `cd apps/web && npm run typecheck` pass; `cd apps/web && npm run lint` fail do baseline unrelated lint errors]
- Main files changed: [apps/web/sql/009_patch_system_wide_soft_delete_is_delete.sql], [apps/server/src/modules/orders/infrastructure/orders.data-access.ts], [apps/server/src/modules/settings/infrastructure/settings.data-access.ts], [apps/server/src/modules/products/infrastructure/products.data-access.ts], [apps/server/src/modules/procurement/infrastructure/procurement.data-access.ts], [apps/server/src/modules/customers/infrastructure/customers-data-access.queries.ts], [apps/web/src/server/data-access/settings.ts], [apps/web/src/server/data-access/products.ts], [apps/web/src/server/data-access/makeupPurchaseInvoices.ts]
- Known gaps: [Web compatibility path vẫn còn nhiều query read chưa filter is_delete=false ở các bảng domain khác ngoài phạm vi bảng đã patch trọng điểm; cần hardening tiếp theo domain để đạt 100% coverage tuyệt đối.]

### 2026-04-22 - Bug 014
- Bug file: docs/bugs/014_products_create_with_inactive_code_and_is_delete_true_filter_leak.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/server && npm run build` pass; `cd apps/server && npx eslint src/modules/products/infrastructure/products.data-access.ts` pass; `cd apps/web && npx eslint src/server/data-access/products.ts` pass; `cd apps/web && npm run typecheck` pass; `cd apps/server && npm run lint` fail do baseline unrelated lint errors; `cd apps/web && npm run lint` fail do baseline unrelated lint errors]
- Main files changed: [apps/server/src/modules/products/infrastructure/products.data-access.ts], [apps/web/src/server/data-access/products.ts], [apps/web/sql/010_patch_products_unique_code_for_active_not_deleted.sql], [progress/bugs.md]
- Known gaps: [Cần apply SQL patch `apps/web/sql/010_patch_products_unique_code_for_active_not_deleted.sql` vào môi trường DB tương ứng để behavior create-code mới có hiệu lực runtime.]
- Token usage: total=n/a (không có số token chính xác từ CLI runtime)

### 2026-04-22 - Bug 013
- Bug file: docs/bugs/013_admin_settings_update_requires_rebuild_for_ui_config_refresh.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [`cd apps/web && npx eslint src/server/services/showroomPublicService.ts src/app/[locale]/[shopDomain]/page.tsx src/app/[locale]/[shopDomain]/products/page.tsx src/app/[locale]/b/[branchSlug]/products/page.tsx` pass; `cd apps/web && npm run typecheck` pass; `cd apps/web && npm run lint` fail do baseline unrelated lint errors]
- Main files changed: [apps/web/src/server/services/showroomPublicService.ts], [apps/web/src/app/[locale]/[shopDomain]/page.tsx], [apps/web/src/app/[locale]/[shopDomain]/products/page.tsx], [apps/web/src/app/[locale]/b/[branchSlug]/products/page.tsx], [progress/bugs.md]
- Known gaps: [Chưa chạy manual browser/QA end-to-end trên môi trường deploy để xác nhận ngay sau save settings ở mọi route public.]
- Token usage: total=n/a (không có số token chính xác từ CLI runtime)
