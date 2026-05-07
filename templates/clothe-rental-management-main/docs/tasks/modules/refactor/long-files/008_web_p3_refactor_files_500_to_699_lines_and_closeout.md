# Task RF-LF-008 - Web P3: Refactor file 500-699 dong va dong wave web

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/006_client_state_offline_realtime_voice.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (24 file):
1. `apps/web/src/features/products/hooks/useProductDetailPage.ts` (633)
2. `apps/web/src/features/orders/views/OrdersListPage/OrdersListPage.tsx` (623)
3. `apps/web/src/features/sales/hooks/useSalesLayout.ts` (618)
4. `apps/web/src/features/orders/views/ReturnOrderModal/ReturnOrderModal.tsx` (610)
5. `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.tsx` (610)
6. `apps/web/src/features/makeup/views/MakeupCalendarPage/MakeupCalendarPage.tsx` (606)
7. `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx` (587)
8. `apps/web/src/features/inventory/hooks/useInventoryListPage.ts` (581)
9. `apps/web/src/features/settings/components/SettingsShowroomTheme3DFields.tsx` (579)
10. `apps/web/src/server/data-access/calendar.ts` (579)
11. `apps/web/src/features/settings/views/SettingsUsersPage/SettingsUsersPage.tsx` (570)
12. `apps/web/src/features/sales/views/SalesPosPage/SalesPosPage.tsx` (569)
13. `apps/web/src/features/settings/hooks/useSettingsGeneralPage.ts` (567)
14. `apps/web/src/features/settings/components/SettingsShowroomThemeCharmFields.tsx` (565)
15. `apps/web/src/features/settings/hooks/useSettingsUsersPage.ts` (549)
16. `apps/web/src/features/settings/components/SettingsShowroomThemeModernFields.tsx` (545)
17. `apps/web/src/features/products/views/ProductsListPage/ProductsListPage.tsx` (540)
18. `apps/web/src/features/products/views/ProductDetailPage/ProductDetailPage.tsx` (519)
19. `apps/web/src/features/settings/views/SettingsGeneralPage/SettingsGeneralPage.tsx` (517)
20. `apps/web/src/features/reports/views/IncidentsReportPage/IncidentsReportPage.tsx` (506)
21. `apps/web/src/lib/languages/hi.json` (501)
22. `apps/web/src/lib/languages/ja.json` (501)
23. `apps/web/src/lib/languages/ko.json` (501)
24. `apps/web/src/lib/languages/zh.json` (501)

Ghi chu gom nhom:
- Nhom A (feature hooks/views/components): item 1-20.
- Nhom B (i18n locale files): item 21-24.

## Muc tieu
- Hoan tat backlog long-files cho web.
- Chia file views/hooks/components theo section/use-case.
- Chuan hoa i18n dictionaries theo namespace de tranh file locale phinh.

## Pham vi
- `apps/web/src/features/**`
- `apps/web/src/server/data-access/calendar.ts`
- `apps/web/src/lib/languages/*.json`

## Architecture Impact
- Layers affected:
  - Component/Hook/legacy data-access + i18n infra.
- Domain affected:
  - orders, payments, makeup, sales, inventory, settings, products, reports, calendar, i18n.
- App(s) affected:
  - `apps/web`.

## Current State vs Target State
- Current:
  - Con nhieu file sat nguong 500, kho maintain va de tiep tuc phinh them.
- Target (Architecture V2):
  - Dong wave web voi file duoc tach nho, de enforce guard line-count tu dong.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Voice/offline/auth flow khong regression khi tach UI/hook.
  - Debounce 350ms cho cac search/filter input co query.
- Forbidden:
  - Khong dua network call truc tiep vao component.
  - Khong tao duplicate state giua query va store.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giu nguyen route/page behavior va i18n key hien tai.
- Rollback condition:
  - Rollback theo tung feature page/component neu phat hien regression.

## Done Criteria (Architecture)
- [ ] Khong vi pham layering client.
- [ ] Khong tao endpoint/business logic moi o web route layer.
- [ ] Khong vi pham ownership state query/store.

## Done Criteria (Coding)
- [ ] Hoan tat toan bo item trong pham vi task, target <=500 dong cho file logic/chinh.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Orders list + return modal flow.
- [ ] Payments list flow.
- [ ] Makeup calendar flow.
- [ ] Sales POS/product-entry flow.
- [ ] Settings general/users/theme pages flow.
- [ ] Products list/detail flow.
- [ ] Reports incidents flow.
- [ ] I18n render khong mat key.

## Cập nhật tiến độ (bắt buộc)
- Progress file: `progress/modules/refactor/tasks.md`
- Khi hoàn thành task:
  - Cập nhật checklist item tương ứng trong file progress module.
  - Append completion log, bắt buộc có:
    - `Task file`
    - `Status`
    - `Test reminder result`
    - `Main files changed`
    - `Known gaps`
    - `Token usage: input=<n>, output=<n>, total=<n>` (hoặc `total=<n>` nếu hệ thống chỉ cung cấp tổng token)
