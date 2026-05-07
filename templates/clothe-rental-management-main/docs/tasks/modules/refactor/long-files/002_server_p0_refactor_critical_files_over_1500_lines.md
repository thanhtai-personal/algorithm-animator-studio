# Task RF-LF-002 - Server P0: Refactor file >1500 dong (uu tien cao nhat)

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (8 file):
1. `apps/server/src/modules/settings/infrastructure/settings.data-access.ts` (5942)
2. `apps/server/src/modules/orders/infrastructure/orders.data-access.ts` (5016)
3. `apps/server/src/modules/procurement/infrastructure/procurement.data-access.ts` (3724)
4. `apps/server/src/modules/products/infrastructure/products.data-access.ts` (3616)
5. `apps/server/src/modules/mini-app/mini-app-extensions.service.ts` (2597)
6. `apps/server/src/modules/orders/application/orders.service.ts` (2005)
7. `apps/server/src/modules/settings/utils/product-home-theme-config.ts` (1839)
8. `apps/server/src/modules/makeup/infrastructure/makeupEvents.ts` (1540)

## Muc tieu
- Giam kich thuoc tung file xuong nguong de maintain (`<=500` dong cho file xu ly logic).
- Neu file data/config lon: tach file du lieu + factory/loader rieng, file entry khong vuot `<=350` dong.
- Khong doi API contract, khong doi nghia nghiep vu.

## Pham vi
- Chi trong `apps/server/src/modules/**` (module settings/orders/procurement/products/mini-app/makeup).
- Uu tien tach theo module con: query-builder, mapper, validator, policy helper, transaction orchestration.

## Architecture Impact
- Layers affected:
  - `application` va `infrastructure` cua cac module server.
- Domain affected:
  - settings, orders, procurement, products, mini-app, makeup.
- App(s) affected:
  - `apps/server`.

## Current State vs Target State
- Current:
  - Mot so file gom qua nhieu use-case/query path trong cung 1 file, kho review va de tao conflict.
- Target (Architecture V2):
  - Moi module server tach ro theo `presentation/application/domain/infrastructure`.
  - Query Supabase van nam trong infrastructure, business flow o application.

## Boundary Rules
- Must keep:
  - `Controller -> Application Service -> Data-access -> Supabase`.
  - Data-access khong chua business policy phuc tap.
  - Application service khong chua raw SQL/Supabase query.
- Forbidden:
  - Khong move query DB sang `application`.
  - Khong move business flow sang `presentation`.
  - Khong tao shared util chung gay import nguoc module.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giu nguyen DTO/service signatures dang duoc module khac su dung.
- Rollback condition:
  - Neu regression business (orders/procurement/settings), rollback theo tung module commit.

## In-scope
- Tach file theo use-case group va responsibility.
- Bo sung test/fixture hoac smoke scripts neu can de bao toan behavior.
- Chuan hoa private helper trong cung module.

## Out-of-scope
- Thay doi business rule.
- Thay doi API path/status code.
- Refactor module ngoai danh sach 8 file.

## Done Criteria (Architecture)
- [ ] Khong vi pham layering server.
- [ ] Khong them truy cap Supabase ngoai infrastructure.
- [ ] Khong duplicate business rule giua application va infrastructure.
- [ ] Co ghi chu mapping file-cu -> file-moi cho moi module.

## Done Criteria (Coding)
- [ ] 8/8 file duoc tach, file logic chinh <=500 dong.
- [ ] Build pass: `cd apps/server && npm run build`.
- [ ] Lint pass: `cd apps/server && npm run lint`.

## Regression Scope
- [ ] Settings read/write flow khong doi ket qua.
- [ ] Orders create/update/status transition khong doi semantics.
- [ ] Procurement create/list/detail khong doi.
- [ ] Products list/detail/update khong doi.
- [ ] Mini-app extension flow khong doi contract.
- [ ] Makeup event flow khong doi.

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
