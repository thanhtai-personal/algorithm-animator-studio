# Task RF-LF-003 - Server P1: Refactor file 800-1500 dong

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (8 file):
1. `apps/server/src/modules/settings/settings.service.ts` (1400)
2. `apps/server/src/modules/inventory/infrastructure/inventory.data-access.ts` (1348)
3. `apps/server/src/modules/products/application/products.service.ts` (1152)
4. `apps/server/src/modules/payments/infrastructure/payments.data-access.ts` (1013)
5. `apps/server/src/modules/mini-app/mini-app.service.ts` (958)
6. `apps/server/src/modules/procurement/application/procurement.service.ts` (855)
7. `apps/server/src/modules/media/infrastructure/media.data-access.ts` (840)
8. `apps/server/src/modules/makeup/application/makeup-core.service.ts` (800)

## Muc tieu
- Chuan hoa file o muc maintainable (`<=500` dong cho file logic).
- Hoan tat tach service/data-access de giam coupling va de test don vi.

## Pham vi
- `apps/server/src/modules/settings|inventory|products|payments|mini-app|procurement|media|makeup/**`
- Tiep noi sau `RF-LF-002`.

## Architecture Impact
- Layers affected:
  - `application` va `infrastructure`.
- Domain affected:
  - settings, inventory, products, payments, mini-app, procurement, media, makeup.
- App(s) affected:
  - `apps/server`.

## Current State vs Target State
- Current:
  - Nhom file trung binh-cao van gom nhieu flow trong mot file.
- Target (Architecture V2):
  - Service gom orchestration theo use-case nho.
  - Infrastructure tach query adapter/mapper ro rang.

## Boundary Rules
- Must keep:
  - Service la noi giu business orchestration.
  - Infrastructure chi DB/access implementation.
- Forbidden:
  - Khong cho controller goi thang data-access.
  - Khong dua utility transport vao domain logic.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giu nguyen interface method duoc module/consumer dang goi.
- Rollback condition:
  - Neu regression module nao, rollback theo module do.

## Done Criteria (Architecture)
- [ ] Khong co import nguoc tang.
- [ ] Khong phat sinh DB access ngoai infrastructure.
- [ ] Khong doi ownership boundary giua module.

## Done Criteria (Coding)
- [ ] 8/8 file duoc tach thanh cac file nho theo responsibility.
- [ ] Moi file logic chinh <=500 dong.
- [ ] `cd apps/server && npm run lint` pass.
- [ ] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] Settings/system flags flow.
- [ ] Inventory CRUD/list flow.
- [ ] Products read/write flow.
- [ ] Payments write/read flow.
- [ ] Mini-app bootstrap/service flow.
- [ ] Procurement service flow.
- [ ] Media upload metadata flow.
- [ ] Makeup core flow.

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
