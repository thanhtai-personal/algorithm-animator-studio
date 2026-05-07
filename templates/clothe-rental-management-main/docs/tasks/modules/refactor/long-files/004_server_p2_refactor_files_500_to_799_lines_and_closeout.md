# Task RF-LF-004 - Server P2: Refactor file 500-799 dong va dong wave server

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
File can refactor (3 file):
1. `apps/server/src/modules/makeup/infrastructure/makeupShared.ts` (759)
2. `apps/server/src/modules/returns/infrastructure/return-orders.data-access.ts` (750)
3. `apps/server/src/modules/returns/application/returns.service.ts` (539)

## Muc tieu
- Ket thuc toan bo backlog long-files cua `apps/server`.
- Dua 3 file con lai ve muc maintainable (`<=500` dong).

## Pham vi
- Chi gom `makeup` va `returns` module trong `apps/server`.

## Architecture Impact
- Layers affected:
  - `application` + `infrastructure`.
- Domain affected:
  - makeup, returns.
- App(s) affected:
  - `apps/server`.

## Current State vs Target State
- Current:
  - Server da duoc xu ly P0/P1, con 3 file chua xuong duoi nguong.
- Target (Architecture V2):
  - Tat ca file server trong danh sach long-files deu <=500 dong.

## Boundary Rules
- Must keep:
  - DB query chi nam o infrastructure.
  - Returns business flow nam o application.
- Forbidden:
  - Khong day business logic vao data-access.

## Compatibility & Migration Strategy
- Compatibility window:
  - Khong co cutover endpoint; giu nguyen contract.
- Rollback condition:
  - Rollback theo module `returns` hoac `makeup` neu co regression.

## Done Criteria (Architecture)
- [ ] Ket thuc 100% backlog long-file cua server theo danh sach input.
- [ ] Khong phat sinh vi pham layering.
- [ ] Khong doi ownership Supabase gateway.

## Done Criteria (Coding)
- [ ] 3/3 file da tach xong, <=500 dong.
- [ ] `cd apps/server && npm run lint` pass.
- [ ] `cd apps/server && npm run build` pass.

## Regression Scope
- [ ] Returns create/update/list flow.
- [ ] Makeup shared read model va helper flow.

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
