# Task RF-LF-007 - Web P2: Refactor feature files 700-999 dong

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/006_client_state_offline_realtime_voice.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (17 file):
1. `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomVisualEditor.tsx` (989)
2. `apps/web/src/features/procurement/hooks/useProcurementPage.ts` (915)
3. `apps/web/src/features/product-landing/config/productLandingTheme3D.ts` (829)
4. `apps/web/src/features/orders/hooks/useReturnOrderModal.ts` (810)
5. `apps/web/src/features/product-landing/config/productLandingThemeCharm.ts` (795)
6. `apps/web/src/features/makeup/hooks/useMakeupCalendarPage.ts` (791)
7. `apps/web/src/features/inventory/views/InventoryListPage/InventoryListPage.tsx` (789)
8. `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.tsx` (756)
9. `apps/web/src/features/sales/hooks/useSalesProductEntryPage.ts` (751)
10. `apps/web/src/lib/languages/en.json` (749)
11. `apps/web/src/lib/languages/vi.json` (745)
12. `apps/web/src/features/reports/views/RevenueReportPage/RevenueReportPage.tsx` (734)
13. `apps/web/src/components/voice/hooks/useVoiceDictationPrimitive.ts` (725)
14. `apps/web/src/features/procurement/views/ProcurementPage/ProcurementPage.tsx` (717)
15. `apps/web/src/server/data-access/makeupShared.ts` (717)
16. `apps/web/src/features/products/hooks/useProductsListPage.ts` (713)
17. `apps/web/src/features/showroom/views/ShowroomProductHomeV1/ShowroomProductHomeV1.tsx` (701)

## Muc tieu
- Tach tiep nhom file medium-high de de review.
- Xu ly dac biet cho file i18n lon: chuyen sang segmented locale dictionaries theo namespace.
- Giu on dinh voice flow va procurement/makeup flows.

## Pham vi
- `apps/web/src/features/**`, `apps/web/src/components/voice/**`, `apps/web/src/lib/languages/**`, `apps/web/src/server/data-access/makeupShared.ts`.

## Architecture Impact
- Layers affected:
  - Component/Hook/legacy web data-access/i18n infra.
- Domain affected:
  - settings, procurement, product-landing, orders, makeup, inventory, products, reports, voice, showroom.
- App(s) affected:
  - `apps/web`.

## Current State vs Target State
- Current:
  - Nhieu file medium-high van gom nhieu concern trong mot file.
- Target (Architecture V2):
  - Cac concern duoc chia theo module con (view sections, hook sub-logic, helper map, locale namespace).

## Boundary Rules
- Must keep:
  - Voice flow phai an toan stale async state.
  - Search/filter co debounce 350ms neu co query theo typing.
  - Khong doi contract API.
- Forbidden:
  - Khong de voice async ket qua stale cap nhat vao modal da dong.
  - Khong dua business logic vao component render.

## Compatibility & Migration Strategy
- Compatibility window:
  - i18n key va business behavior ben ngoai giu nguyen.
- Rollback condition:
  - Rollback theo feature neu regression (voice/procurement/makeup la high-risk).

## Done Criteria (Architecture)
- [ ] Khong vi pham layering.
- [ ] Voice va state ownership contract duoc bao toan.
- [ ] Khong phat sinh API endpoint moi.

## Done Criteria (Coding)
- [ ] 17/17 file duoc tach theo responsibility, target <=500 dong cho file logic.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Procurement list/create/update flow.
- [ ] Makeup calendar flow.
- [ ] Revenue report render/filter flow.
- [ ] Voice dictation close/cancel/reset safety.
- [ ] Product overview/list flow.
- [ ] Showroom product home V1 render flow.

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
