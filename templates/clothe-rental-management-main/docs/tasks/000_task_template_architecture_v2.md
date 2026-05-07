# Task Template - Architecture V2 Compliance

## Task ID / Tên task
- `Task XXX - ...`

## Mục tiêu
- ...

## Phụ thuộc
- ...

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`
- ...

## Hiện trạng cần lưu ý
- ...

## Implementation Context (Token tối ưu)
- Route/screen:
- Entry component/hook:
- Đọc/sửa trước:
  - `apps/...`
- Chỉ đọc khi cần:
  - `docs/...`
- Không cần nạp:
  - ...
- Boundary cần giữ:
  - ...
- QA nhanh:
  - ...

## Prompt gợi ý cho Codex (optional)
- Giới hạn <= 12 dòng. Nếu không cần thì bỏ qua section này.

## Config cần chuẩn bị trước khi chạy task
- ...

## Architecture Impact
- Layers affected:
- Domain affected:
- App(s) affected: `apps/web` / `apps/server` / `apps/mobile` / `apps/zalo-mini-apps/*`

## Current State vs Target State
- Current:
- Target (Architecture V2):

## Boundary Rules
- Must keep:
- Forbidden:

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
- Deprecation/removal plan:
- Rollback condition:

## In-scope
- ...

## Out-of-scope
- ...

## Deliverables mong muốn
- ...

## Done criteria (coding)
- ...

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] ...
- [ ] ...

## Nhắc test nhanh
- ...

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + completion log tại:
  - `progress/tasks.md` (task root), hoặc
  - `progress/modules/<module>/tasks.md` (task module)
- Nếu là module mới, tạo file index module và thêm vào `progress/modules/tasks.md`.
