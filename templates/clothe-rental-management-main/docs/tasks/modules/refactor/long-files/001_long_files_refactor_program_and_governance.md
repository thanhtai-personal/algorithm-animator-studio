# Task RF-LF-001 - Program refactor file >500 dong (server -> web -> zalo)

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
- Danh sach tong hop hien tai co `77` file >500 dong:
  - `server`: 19 file
  - `web`: 58 file
  - `zalo app`: 0 file
- Can co bo task refactor theo uu tien de de doc source va giam complexity.

## Muc tieu
- Chia backlog refactor long-files thanh cac wave nho, co thu tu ro rang.
- Uu tien xu ly `apps/server` truoc theo dung dinh huong architecture V2.
- Moi task con phai co gate architecture + regression scope + quality checks.

## Pham vi
- Tao chuong trinh task tai `docs/tasks/modules/refactor/long-files/**`.
- Khong implement refactor code trong task nay.

## Architecture Impact
- Layers affected:
  - Task planning/guideline cho `apps/server`, `apps/web`, `apps/zalo-mini-apps`.
- Domain affected:
  - Cross-domain maintainability/readability.
- App(s) affected:
  - `apps/server`, `apps/web`, `apps/zalo-mini-apps/*`.

## Current State vs Target State
- Current:
  - Danh sach file dai da co, nhung chua duoc tach thanh wave task theo architecture compliance.
- Target (Architecture V2):
  - Co sequence task ro rang: `server` P0/P1/P2 -> `web` P0/P1/P2/P3 -> `zalo` guard.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Server flow: `Controller -> Application Service -> Data-access -> Supabase`.
  - Chi `apps/server` duoc truy cap DB Supabase truc tiep.
- Forbidden:
  - Refactor long-file khong duoc hop ly hoa viec them logic business moi vao `apps/web/src/app/api/**`.
  - Khong duplicate business rule giua web legacy va server.

## Compatibility & Migration Strategy
- Compatibility window:
  - Tat ca wave refactor phai giu nguyen API contract va behavior hien tai.
- Rollback condition:
  - Neu wave nao gay regression nghiep vu critical, rollback theo tung wave/task (khong rollback toan bo program).

## Thu tu task va phu thuoc
1. `RF-LF-002` - Server P0 (file >1500 dong)
2. `RF-LF-003` - Server P1 (800-1500 dong)
3. `RF-LF-004` - Server P2 (500-799 dong)
4. `RF-LF-005` - Web P0 (legacy web server layer >900 dong)
5. `RF-LF-006` - Web P1 (feature files >1000 dong)
6. `RF-LF-007` - Web P2 (700-999 dong)
7. `RF-LF-008` - Web P3 (500-699 dong)
8. `RF-LF-009` - Zalo guard task (giu khong phat sinh file >500 dong)

## Done Criteria (Architecture)
- [ ] Tat ca task wave con deu co day du 6 section bat buoc theo doc `011`.
- [ ] Thu tu uu tien giu dung: server -> web -> zalo.
- [ ] Moi wave deu co boundary rules va regression scope ro rang.
- [ ] Co quality gate command theo app bi anh huong.

## Regression Scope
- [ ] Khong thay doi architecture ownership trong qua trinh tach task.
- [ ] Khong bo sot file >500 dong nao trong danh sach input.
- [ ] Chuoi task cho server duoc chot truoc khi sang web.

## Quality gate cho moi task con (tham chieu)
- Server:
  - `cd apps/server && npm run lint`
  - `cd apps/server && npm run build`
- Web:
  - `cd apps/web && npm run lint`
  - `cd apps/web && npm run typecheck`
- Zalo mini apps (neu touched):
  - `cd apps/zalo-mini-apps/<app> && npm run lint`
  - `cd apps/zalo-mini-apps/<app> && npm run typecheck`

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
