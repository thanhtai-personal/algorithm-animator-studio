# Task RF-LF-009 - Zalo mini apps: guard khong phat sinh file >500 dong

## Architecture references (bat buoc tuan thu)
- `.mcp.full.md`
- `docs/architecture/007_mobile_and_zalo_mini_apps.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/modules/refactor/long-files/001_long_files_refactor_program_and_governance.md`

## Input ban dau
- Lan quet 2026-04-22: `apps/zalo-mini-apps/*/src` khong co file >500 dong.
- Can tao guard de giu trang thai nay khi phat trien tiep.

## Muc tieu
- Dat quality gate line-count cho 4 mini apps:
  - `kata-booking`
  - `kata-calendar`
  - `kata-rental-order`
  - `kata-rental-revenue`
- Neu file vuot nguong 500, fail check trong CI/local.

## Pham vi
- `apps/zalo-mini-apps/*/src/**`
- Scripts/checks hoac lint rules phu hop monorepo.

## Architecture Impact
- Layers affected:
  - Engineering quality gate, khong tac dong business layer.
- Domain affected:
  - Cross-domain maintainability tren mini apps.
- App(s) affected:
  - `apps/zalo-mini-apps/*`.

## Current State vs Target State
- Current:
  - Chua co gate line-count chinh thuc cho mini apps.
- Target (Architecture V2):
  - Co gate phat hien som long-file regression, giu duoc codebase gon.

## Boundary Rules
- Must keep:
  - Giu layering mini app: `Component -> Hook -> Query -> Service -> API`.
  - Khong them DB access truc tiep trong mini apps.
- Forbidden:
  - Khong bien quality gate thanh blocker sai (exclude generated files, dist, node_modules).

## Compatibility & Migration Strategy
- Compatibility window:
  - Gate co the chay warning-only o wave dau, sau do nang len fail build.
- Rollback condition:
  - Neu gate false-positive nhieu, rollback rule moi va giu warning mode tam thoi.

## Done Criteria (Architecture)
- [ ] Guard duoc scope dung vao source mini apps.
- [ ] Khong phat sinh vi pham layering do cach fix de qua gate.

## Done Criteria (Coding)
- [ ] Co command/check de detect file >500 dong cho mini apps.
- [ ] Co huong dan run trong docs hoac scripts.
- [ ] `npm run lint` + `npm run typecheck` cua tung mini app van pass.

## Regression Scope
- [ ] Build/lint/typecheck mini apps khong bi anh huong ngoai du kien.
- [ ] Flow auth/session/bootstrap mini app khong doi.

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
