# Task RF-LF-005 - Web P0: Refactor legacy web server layer >900 dong

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/003_web_app_architecture.md`
- `docs/architecture/008_nest_server_target_and_migration.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (8 file):
1. `apps/web/src/server/data-access/settings.ts` (3759)
2. `apps/web/src/server/data-access/procurement.ts` (3371)
3. `apps/web/src/server/data-access/products.ts` (3274)
4. `apps/web/src/server/data-access/makeupEvents.ts` (1395)
5. `apps/web/src/server/services/productsService.ts` (1367)
6. `apps/web/src/server/services/settingsService.ts` (1270)
7. `apps/web/src/server/data-access/dashboard.ts` (1250)
8. `apps/web/src/server/data-access/salesDesk.ts` (995)

## Muc tieu
- Giam do dai file de de maintain trong giai doan compatibility.
- Khong tao them ownership moi cho web server layer.
- Chuan bi de decommission theo roadmap Nest API.

## Pham vi
- Chi sua `apps/web/src/server/data-access/**` va `apps/web/src/server/services/**` trong danh sach.

## Architecture Impact
- Layers affected:
  - Legacy web server compatibility layer.
- Domain affected:
  - settings, procurement, products, makeup, dashboard, sales.
- App(s) affected:
  - `apps/web`.

## Current State vs Target State
- Current:
  - Legacy web server layer con file rat dai, kho review va de loi side-effect.
- Target (Architecture V2):
  - Layer van chi la compatibility, file duoc tach theo sub-responsibility.

## Boundary Rules
- Must keep:
  - Khong them business endpoint moi trong `apps/web/src/app/api/**`.
  - Khong them DB logic moi cho web layer ngoai pham vi giu tuong thich.
  - Neu co co hoi, uu tien tach helper de de forward/cutover sang Nest.
- Forbidden:
  - Khong duplicate business rule da co o `apps/server`.
  - Khong thay doi contract API dang duoc caller su dung.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giu nguyen hanh vi compatibility hien tai cua web APIs.
- Deprecation/removal plan:
  - Chi danh dau file/segment da san sang de move/remove sau khi cutover.
- Rollback condition:
  - Neu regression caller, rollback tung domain file.

## Done Criteria (Architecture)
- [ ] Khong vi pham policy web compatibility layer.
- [ ] Khong phat sinh them coupling web <-> DB.
- [ ] Co mapping segment nao co the move sang `apps/server` trong wave migration tiep theo.

## Done Criteria (Coding)
- [ ] 8/8 file duoc tach, target <=500 dong cho file logic.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Settings API response khong doi.
- [ ] Products/procurement/dashboard/sales API behavior khong doi.
- [ ] Feature-flag/system-settings behavior khong regression.

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
