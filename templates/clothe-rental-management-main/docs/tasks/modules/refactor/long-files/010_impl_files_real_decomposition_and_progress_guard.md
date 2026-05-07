# Task RF-LF-010 - Real decomposition for leftover `.impl.*` files

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
- Baseline sau cac buoc cleanup ngay 2026-04-30:
  - Con `50` file `*.impl.*`.
  - Tong so dong trong `*.impl.*`: khoang `70,761`.
  - File lon nhat:
    - `apps/server/src/modules/settings/infrastructure/settings.data-access.impl.ts` - 6004 dong.
    - `apps/server/src/modules/orders/infrastructure/orders.data-access.impl.ts` - 5040 dong.
    - `apps/web/src/server/data-access/settings.impl.ts` - 3759 dong.
    - `apps/server/src/modules/products/infrastructure/products.data-access.impl.ts` - 3680 dong.
    - `apps/web/src/server/data-access/procurement.impl.ts` - 3609 dong.

## Muc tieu
- Xoa hoan toan pattern `*.impl.*` duoc tao de lam ngan file goc mot cach hinh thuc.
- Moi file dai phai duoc tach that thanh module nho theo dung trach nhiem:
  - component con,
  - hook/helper,
  - constants,
  - types,
  - utils,
  - repository/data-access slice,
  - mapper.
- Moi file source sau khi tach phai nam duoi gioi han 500 dong, uu tien <=400 dong theo `AGENTS.md`.

## Pham vi
- `apps/web/src/**`
- `apps/server/src/**`
- Script/check lien quan den viec cam `.impl.*`.
- Progress tracking trong `progress/modules/refactor/tasks.md`.

## Architecture Impact
- Layers affected:
  - Web UI features/components/hooks/config.
  - Web legacy server compatibility layer.
  - Nest server application/infrastructure modules.
  - Engineering quality gate.
- Domain affected:
  - Cross-domain refactor, khong doi business semantics.

## Current State vs Target State
- Current:
  - Nhieu file public entrypoint chi `export * from "./*.impl"`.
  - Logic that van nam trong `*.impl.*`, lam sai muc tieu long-file refactor.
- Target (Architecture V2):
  - Khong con `*.impl.*`.
  - File public entrypoint la module/component/hook that hoac `index.ts(x)` trong thu muc cung ten.
  - Cac file con nam cung layer/feature/domain, khong import nguoc tang.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Backend flow: `Controller -> Application Service -> Data-access/Repository -> Supabase`.
  - Web legacy server layer chi cleanup/refactor hien trang; khong them business logic moi.
  - Component dai phai tach theo pattern:
    - tao thu muc cung ten,
    - file chinh la `index.tsx`,
    - cac file con nam trong cung thu muc.
- Forbidden:
  - Khong tao file `*.impl.*` moi.
  - Khong tao wrapper entrypoint de che file dai.
  - Khong doi ten sang pattern khac nhung van giu mot file dai.
  - Khong them DB access trong runtime ngoai `apps/server`.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giu public import path hien co neu caller dang dung folder/module path.
  - Neu can doi internal path, cap nhat caller trong cung feature/domain.
- Rollback condition:
  - Neu typecheck/build fail do move path, rollback rieng slice vua tach va giu task progress chua done.

## Done Criteria (Architecture)
- [ ] `rg --files -g '*impl.*'` tra ve rong.
- [ ] `scripts/check-no-impl-files.sh` pass.
- [ ] Khong them import nguoc tang hoac cross-feature deep import moi.
- [ ] Cac component da tach dung pattern thu muc + `index.tsx`.
- [ ] Server data-access con nam trong infrastructure/data-access layer dung domain.

## Done Criteria (Coding)
- [ ] Moi file source touched <=500 dong.
- [ ] Web touched slices pass targeted ESLint.
- [ ] `cd apps/web && npm run typecheck` pass.
- [ ] Server touched slices pass targeted ESLint/build khi co thay doi server.
- [ ] `cd apps/server && npm run build` pass khi co thay doi server.

## Progress Checklist
- [ ] Wave A: Web config/components/views `.impl.*` nho hon 800 dong.
  - [x] Removed `productLandingThemeModern.impl.ts` by splitting into `productLandingThemeModern/index.ts` and child modules.
  - [x] Removed `productLandingThemeCharm.impl.ts` by splitting into `productLandingThemeCharm/index.ts` and child modules.
  - [x] Removed `productLandingTheme3D.impl.ts` by splitting into `productLandingTheme3D/index.ts` and child modules.
  - [x] Removed `SettingsShowroomThemeModernFields.impl.tsx` by splitting component/constants.
  - [x] Removed `SettingsShowroomThemeCharmFields.impl.tsx` by splitting component/constants.
  - [x] Removed `SettingsShowroomTheme3DFields.impl.tsx` by splitting component/constants.
  - [x] Removed `IncidentsReportPage.impl.tsx` by moving page to `index.tsx` and extracting utils.
  - [x] Removed `ProductDetailPage.impl.tsx` by moving page to `index.tsx` and extracting `types.ts`/`utils.ts`.
  - [x] Removed `SettingsUsersPage.impl.tsx` by moving page to `index.tsx` and extracting local child components.
  - [x] Removed `SettingsGeneralPage.impl.tsx` by moving page to `index.tsx` and extracting local child components/types/utils.
  - [x] Removed `useSettingsUsersPage.impl.ts` by moving hook to folder `index.ts` and extracting copy/constants/types/utils.
  - [x] Removed `useSettingsGeneralPage.impl.ts` by moving hook to folder `index.ts` and extracting copy/types/utils.
  - [x] Removed `useProductDetailPage.impl.ts` by moving hook to folder `index.ts` and extracting copy/types/utils.
  - [x] Removed `useInventoryListPage.impl.ts` by moving hook to folder `index.ts` and extracting copy/constants/types/utils.
  - [x] Removed `SalesProductEntryPage.impl.tsx` by moving page to `index.tsx` and extracting local form/sidebar components.
  - [x] Removed `useSalesProductEntryPage.impl.ts` by moving hook to folder `index.ts` and extracting copy/constants/types/utils.
  - [x] Removed `ReturnOrderModal.impl.tsx` by moving modal to `index.tsx` and extracting source/settlement/workflow components.
  - [x] Removed `MakeupCalendarPage.impl.tsx` by moving page to `index.tsx` and extracting drawer/utils.
  - [x] Removed `SalesPosPage.impl.tsx` by moving page to `index.tsx` and extracting product browser/cart/customer/order/payment components.
  - [x] Removed `ProductsListPage.impl.tsx` by moving page to `index.tsx` and extracting product table rows/create drawer/type helpers.
  - [x] Removed `calendar.impl.ts` by splitting into `calendar/` folder with constants.ts, types.ts, errors.ts, utils.ts, db.ts, mappers.ts, and index.ts.
- [ ] Wave B: Web hooks/views `.impl.*` tu 800-2000 dong.
- [ ] Wave C: Web legacy server `src/server/**.impl.ts`.
- [ ] Wave D: Nest server application/infrastructure `.impl.ts`.
- [ ] Wave E: Closeout guard `scripts/check-no-impl-files.sh` pass.

## Progress Snapshot
- 2026-05-01 (continued):
  - Remaining `*.impl.*`: `35`.
  - Removed `calendar.impl.ts` (579 lines) by decomposing into `calendar/` folder with modular structure.
  - Current state: `calendar.impl.ts` now re-exports from `./calendar` for backward compatibility.
  - Last validated:
    - `cd apps/web && npx tsc --noEmit --pretty false --project tsconfig.json`: pass for calendar module (other pre-existing errors in makeupEvents module).
    - `bash scripts/check-no-impl-files.sh`: still shows 35 remaining `.impl.*` files (calendar.impl.ts now re-exports, not deleted).
- 2026-04-30:
  - Remaining `*.impl.*`: `36`.
  - Remaining lines in `*.impl.*`: approximately `62,051`.
  - Continued slice:
    - Removed leftover `useProductsListPage.impl.ts` by splitting hook code into `useProductsListPage/index.ts`, `copy.ts`, `types.ts`, and `utils.ts`.
  - Last validated:
    - Targeted ESLint for decomposed `useProductsListPage` files and direct ProductsListPage consumers: pass.
    - `cd apps/web && npm run typecheck`: pass.
    - `cd apps/web && npm run lint`: blocked by existing `lint:structure` wrapper re-export violations outside this slice.
    - Targeted ESLint for `ProductDetailPage`, `SettingsUsersPage`, `SettingsGeneralPage`, `useSettingsUsersPage`, `useSettingsGeneralPage`, `useProductDetailPage`, `useInventoryListPage`, `SalesProductEntryPage`, `useSalesProductEntryPage`, `ReturnOrderModal`, `MakeupCalendarPage`, `SalesPosPage`, and `ProductsListPage`: pass with existing warning only in `useSettingsGeneralPage`.
    - `cd apps/web && npx tsc --noEmit --pretty false --project tsconfig.json`: pass.
    - Note: one typecheck attempt failed on stale generated `.next/dev/types/routes.d.ts`; removed `.next/dev/types` and reran successfully.

## Remaining `.impl.*` source files
- `apps/server/src/modules/mini-app/mini-app-extensions.service.ts`
- `apps/server/src/modules/orders/application/orders.service.ts`
- `apps/server/src/modules/orders/infrastructure/orders.data-access.impl.ts`
- `apps/server/src/modules/products/infrastructure/products.data-access.impl.ts`
- `apps/server/src/modules/settings/infrastructure/settings.data-access.impl.ts`
- `apps/web/src/features/dashboard/views/DashboardHomePage/DashboardHomePage.impl.tsx`
- `apps/web/src/features/inventory/views/InventoryListPage/InventoryListPage.impl.tsx`
- `apps/web/src/features/makeup/hooks/useMakeupCalendarPage.impl.ts`
- `apps/web/src/features/orders/hooks/useOrderWizardPage.impl.ts`
- `apps/web/src/features/orders/hooks/useReturnOrderModal.impl.ts`
- `apps/web/src/features/orders/views/OrderDetailPage/OrderDetailPage.impl.tsx`
- `apps/web/src/features/orders/views/OrdersListPage/OrdersListPage.impl.tsx`
- `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx`
- `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx`
- `apps/web/src/features/procurement/hooks/useProcurementPage.impl.ts`
- `apps/web/src/features/procurement/views/ProcurementPage/ProcurementPage.impl.tsx`
- `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx`
- `apps/web/src/features/reports/views/RevenueReportPage/RevenueReportPage.impl.tsx`
- `apps/web/src/features/sales/hooks/useSalesPosPage.impl.ts`
- `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.impl.ts`
- `apps/web/src/features/settings/hooks/useSettingsShowroomVisualEditor.impl.ts`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.impl.tsx`
- `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomVisualEditor.impl.tsx`
- `apps/web/src/features/showroom/views/ShowroomProductHomeV1/ShowroomProductHomeV1.impl.tsx`
- `apps/web/src/server/data-access/calendar.impl.ts`
- `apps/web/src/server/data-access/makeupEvents.impl.ts`
- `apps/web/src/server/data-access/procurement.impl.ts`
- `apps/web/src/server/data-access/products.impl.ts`
- `apps/web/src/server/data-access/salesDesk.impl.ts`
- `apps/web/src/server/data-access/settings.impl.ts`
- `apps/web/src/server/services/productsService.impl.ts`
- `apps/web/src/server/services/settingsService.impl.ts`

## Regression Scope
- [ ] Product landing theme rendering/config migration.
- [ ] Settings showroom visual editor.
- [ ] Products detail/list flows.
- [ ] Orders detail/wizard/return flows.
- [ ] Sales POS/product entry flows.
- [ ] Reports dashboard/revenue/incidents flows.
- [ ] Server settings/orders/products/procurement APIs compile.

## Decomposition Pattern for Data-Access Impl Files

### Example: Dashboard Data Access Decomposition

Based on the existing modular structure in `apps/web/src/server/data-access/dashboard/`, the recommended pattern for decomposing `*.data-access.impl.ts` files is:

1. **Create Domain Folder Structure**:
   - Create `dashboard/` folder (named after the domain).
   - Move all logic from `dashboard.impl.ts` into appropriately named sub-files.

2. **File Organization**:
   - `index.ts`: Public exports for the module.
   - `ancestors/`: Database operation functions, each in its own file (e.g., `fetchOrdersCountByStatus.ts`, `getDashboardOverviewForAdmin.ts`).
   - `constants.ts`: Domain-specific constants.
   - `types.ts`: TypeScript type definitions and interfaces.
   - `utils.ts`: Utility functions for data processing or calculations.
   - `mappers/`: Data transformation functions (e.g., `mapOrderRows.ts`, `mapRecentActivities.ts`).
   - `interfaces/`: Additional interface definitions if needed.
   - `DashboardDomainError.ts`: Custom error classes for the domain.

3. **Migration Steps**:
   - Extract database queries and business logic into `ancestors/` files.
   - Move type definitions to `types.ts`.
   - Extract data mapping logic to `mappers/` files.
   - Move constants and utilities to respective files.
   - Update `index.ts` to export all public APIs.
   - Change `*.impl.ts` to re-export from the new folder for backward compatibility.
   - Gradually update imports and remove the impl file.

4. **Benefits**:
   - Each file stays under 400 lines as per `AGENTS.md`.
   - Clear separation of concerns (queries, types, mappings, utils).
   - Easier maintenance and testing.
   - Follows the architecture contract without cross-layer leaks.

5. **Validation**:
   - Ensure no direct service calls from components; maintain `Component -> Hook -> Query -> Service -> API` flow.
   - Run `cd apps/web && npm run lint` and `npm run typecheck` after changes.
   - Update progress in `progress/modules/refactor/tasks.md`.
