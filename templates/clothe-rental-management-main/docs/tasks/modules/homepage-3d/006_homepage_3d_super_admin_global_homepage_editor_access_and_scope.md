# Task 006 - Homepage 3D: Super Admin chỉnh sửa homepage chung

## Mục tiêu
- Cho phép `super admin` chỉnh sửa homepage chung `/{locale}/product` bằng cùng trải nghiệm editor như manager chỉnh homepage branch.
- Phân tách rõ phạm vi chỉnh sửa `global homepage` và `branch homepage`, tránh ghi đè nhầm dữ liệu branch.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/005_homepage_3d_branch_map_data_contract_and_api_alignment.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`

## Hiện trạng cần lưu ý
- Editor hiện tại tập trung vào cấu hình homepage theo branch (manager/admin branch scope).
- Chưa có ngữ cảnh riêng cho homepage chung toàn hệ thống.
- RBAC hiện có thể phân quyền theo role + branch scope, nhưng chưa có mode editor global dành riêng super admin.

## Config cần chuẩn bị trước khi chạy task
- Chốt role được quyền sửa homepage chung: `owner_admin` (super admin).
- Chốt policy đọc homepage chung cho user/public: luôn public, không phụ thuộc branch login.
- Chốt key định danh cấu hình homepage chung (ví dụ: `GLOBAL_PRODUCT_HOME` hoặc branchId = `null` với scope flag).

## Architecture Impact
- `apps/server`: settings/showroom config service + RBAC gate cho global scope.
- `apps/web`: settings showroom visual editor hỗ trợ chọn scope `global` vs `branch`.
- `apps/web`: route render homepage chung đọc đúng nguồn config global.

## Current State vs Target State
- Current: chỉ có flow editor branch-centric.
- Target: super admin có thể vào settings và chỉnh homepage chung bằng editor hiện hữu, không ảnh hưởng branch config trừ khi publish branch scope.

## Boundary Rules
- Must keep: `Component -> Hook -> Query -> Service -> API`.
- Must keep: backend là source-of-truth cho RBAC và scope write.
- Forbidden: web client tự bypass branch scope khi gọi API.
- Forbidden: trộn config global vào config branch trong cùng bản ghi không có scope rõ ràng.

## Compatibility & Migration Strategy
- Ưu tiên backward-compatible contract để không làm vỡ editor branch hiện tại.
- Nếu cần schema mới, cho phép read fallback từ config cũ trong giai đoạn migration.

## In-scope
- Thêm scope editor cho homepage chung.
- RBAC: chỉ super admin được write global homepage.
- API contract cho read/write config global homepage.
- Mapping UI settings page để chọn chế độ chỉnh sửa homepage chung.

## Out-of-scope
- Drag-drop marker logic chi tiết (Task 007).
- Data model nhiều icon trên 1 branch (Task 008).

## Deliverables mong muốn
- Super admin có thể mở editor homepage chung và lưu/publish thành công.
- Manager branch không thể ghi config homepage chung.
- Homepage `/{locale}/product` đọc đúng config global đã publish.

## Done criteria (coding)
- Thêm scope global vào settings homepage editor flow (web + server).
- Kiểm tra RBAC write global scope theo role super admin.
- Read path homepage chung dùng contract global ổn định.

## Done Criteria (Architecture)
- [ ] Không vi phạm layering `Component -> Hook -> Query -> Service -> API`.
- [ ] Không tạo endpoint business trong `apps/web/src/app/api/**`.
- [ ] Không thêm Supabase access trực tiếp từ web runtime.
- [ ] `cd apps/server && npm run build` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không ảnh hưởng flow chỉnh sửa homepage branch hiện có.
- [ ] Không leak quyền write global cho manager/staff.
- [ ] Homepage branch `/{locale}/{branch-domain}` vẫn render theo branch config.

## Nhắc test nhanh
- Login super admin -> mở settings showroom pages -> chuyển scope global -> lưu/publish.
- Login manager branch -> xác nhận không có quyền write global.
- Mở `/{locale}/product` và `/{locale}/{branch-domain}` để kiểm tra tách scope render.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật checklist + log tại:
  - `progress/modules/homepage-3d/tasks.md`
