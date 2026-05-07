# Task RF-LF-006 - Web P1: Refactor feature files >1000 dong

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/006_client_state_offline_realtime_voice.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (9 file):
1. `apps/web/src/features/settings/hooks/useSettingsShowroomVisualEditor.ts` (2655)
2. `apps/web/src/features/orders/views/OrderDetailPage/OrderDetailPage.tsx` (2312)
3. `apps/web/src/features/orders/hooks/useOrderWizardPage.ts` (1846)
4. `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.ts` (1637)
5. `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.tsx` (1139)
6. `apps/web/src/features/sales/hooks/useSalesPosPage.ts` (1101)
7. `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.tsx` (1076)
8. `apps/web/src/features/product-landing/config/productLandingThemeModern.ts` (1030)
9. `apps/web/src/features/dashboard/views/DashboardHomePage/DashboardHomePage.tsx` (1026)

## Muc tieu
- Tach hook/view lon thanh composition nho de de doc source.
- Bao toan flow `Component -> Hook -> Query -> Service -> API`.
- Giam complexity cua UI state management va side effects.

## Pham vi
- `apps/web/src/features/**` trong danh sach tren.

## Architecture Impact
- Layers affected:
  - Component + Hook + config trong feature modules.
- Domain affected:
  - settings, orders, sales, product-landing, dashboard.
- App(s) affected:
  - `apps/web`.

## Current State vs Target State
- Current:
  - Hook/view lon gom qua nhieu responsibilities (data, orchestration, UI state, side-effect).
- Target (Architecture V2):
  - View chi render + wire props.
  - Hook chia theo use-case (query state, form state, action handlers).
  - Query/service contract khong doi.

## Boundary Rules
- Must keep:
  - Component khong goi fetch/service truc tiep.
  - Query own request lifecycle.
  - UI render tu store (store-first hydration) o cac man hinh co MobX ownership.
- Forbidden:
  - Khong move business logic sang component.
  - Khong duplicate state ownership giua query data va store.

## Compatibility & Migration Strategy
- Compatibility window:
  - Khong doi route UX semantics; chi tach code noi bo.
- Rollback condition:
  - Neu regression tren orders/settings flow, rollback theo tung feature.

## Done Criteria (Architecture)
- [ ] Khong vi pham layering client.
- [ ] Khong duplicate ownership state query/store.
- [ ] Khong thay doi API contract dang duoc service su dung.

## Done Criteria (Coding)
- [ ] 9/9 file duoc tach, target <=500 dong cho file logic/chinh.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Orders detail/wizard create-update flow.
- [ ] Settings showroom pages + visual editor flow.
- [ ] Sales POS flow.
- [ ] Dashboard render flow.
- [ ] Product landing modern config render flow.

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
