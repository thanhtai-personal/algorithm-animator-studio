# Task 093 - Inventory toàn bộ API web + khóa contract migrate sang Nest

## API production (bắt buộc)
- Base URL production: `https://kata-center-api.vercel.app`
- Env key chuẩn cho callers:
  - `NEST_API_BASE_URL` (server/next)
  - `VITE_NEST_API_BASE_URL` (vite mini apps)

## Architecture references (bắt buộc tuân thủ)
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/architecture/012_apps_server_source_structure_for_cms_admin.md`

## Input ban đầu
- API đang phân tán trong `apps/web/src/app/api/**`, khó chốt phạm vi migrate.
- Nhiều app consumer đang gọi route cũ, chưa có bảng mapping chuẩn để cutover an toàn.

## Mục tiêu
- Lập inventory đầy đủ endpoint hiện có ở `apps/web`.
- Khóa contract endpoint trước khi migrate code.
- Chuẩn hóa artifact mapping dùng chung cho task 004 -> 013.

## Architecture Impact
- Layers affected:
  - API ownership planning (web -> server)
  - Consumer cutover planning
  - Migration governance docs
- Domains affected:
  - toàn bộ domain API hiện có ở web

## Current State vs Target State
- Current:
  - thiếu artifact mapping chuẩn hóa cho endpoint ownership.
- Target (Architecture V2):
  - có inventory + contract lock đủ để migrate theo domain slices.

## Boundary Rules
- Must keep:
  - Endpoint business mới chỉ được tạo ở `apps/server`.
  - Mapping phải chỉ rõ caller và trạng thái cutover.
- Forbidden:
  - migrate endpoint mà không có contract parity baseline.
  - bỏ sót endpoint đang được caller tiêu thụ.

## Compatibility & Migration Strategy
- Compatibility window:
  - route legacy vẫn có thể giữ tạm thời, nhưng phải có trạng thái rõ `legacy-forward` hoặc `not-migrated`.
- Rollback condition:
  - nếu migrate endpoint gây regression, rollback theo mapping đã khóa (route cũ + caller tương ứng).

## Phụ thuộc
- `docs/tasks/modules/nest-server/001_nest_server_api_migration_foundation_and_consumer_cutover.md`

## Mapping màn hình/source
- `apps/web/src/app/api/**`
- `apps/web/src/server/services/**`
- `apps/web/src/server/data-access/**`
- `apps/web/src/features/**/services/**`
- `apps/zalo-mini-apps/**/src/features/**/services/**`

## Quy tắc kỹ thuật bắt buộc
- Contract mỗi endpoint phải có:
  - method/path
  - auth mode
  - role/branch scope
  - request/response/error shape
  - pagination/filter semantics (nếu có)
- Mỗi endpoint phải có owner domain module ở `apps/server`.

## In-scope
- Quét route handlers và phân nhóm theo domain.
- Tạo/chuẩn hóa artifact mapping endpoint.
- Đánh dấu trạng thái endpoint: `todo/in-progress/done/legacy-forward/deprecated`.

## Out-of-scope
- Coding migrate endpoint.
- Đổi business logic.

## Done Criteria (Architecture)
- [ ] Có artifact mapping đầy đủ endpoint + owner module.
- [ ] Có caller mapping cho web/mini-app/mobile liên quan.
- [ ] Có contract lock tối thiểu cho endpoint critical.

## Done Criteria (Coding)
- [ ] Artifact mapping cập nhật tại `docs/features/endpoint_mapping_inventory.md`.
- [ ] Không còn endpoint quan trọng bị thiếu trạng thái migrate.

## Regression Scope
- [ ] Đối chiếu số lượng route inventory với route thực tế trong `apps/web/src/app/api/**`.
- [ ] Đối chiếu caller references để đảm bảo không thiếu consumer.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Nest-Server/002 |- [x] Modules/Nest-Server/002 |" progress/modules/nest-server/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/nest-server/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Nest-Server/002
  - Task file: docs/tasks/modules/nest-server/002_nest_server_api_inventory_and_contract_lock.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
