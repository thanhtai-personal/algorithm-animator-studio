# Task 077 - Branch Manager Settings Scope: manager thấy Settings nhưng chỉ chỉnh được dữ liệu branch của mình (bao gồm product page settings)

## Mục tiêu
- Cho phép `manager` truy cập màn hình Settings để vận hành chi nhánh.
- Giới hạn `manager` chỉ đọc/ghi dữ liệu thuộc branch đang được phân quyền.
- Bao gồm quyền cấu hình trang sản phẩm/public product page theo branch (ví dụ `PRODUCT_HOME`, `PRODUCT_LANDING_HOME`) nhưng không được chỉnh dữ liệu global/toàn hệ thống.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`
- `docs/tasks/075_branch_isolation_readiness_before_new_showroom.md`
- `docs/tasks/076_branch_public_product_site_by_branch.md`

## Tài liệu tham chiếu
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `.mcp.full.md`
- `docs/000_Business_requests.md`
- `templates/my-money-cloud-main/docs/000_authen-and-data-flow.md`
- `templates/my-money-cloud-main/docs/test-case/auth-cases.md`

## Architecture Impact
- Layers affected:
  - Client: `Component -> Hook -> Query -> Service -> API`.
  - Server: `Controller -> Service -> Data-access` cho RBAC + branch guard settings.
  - Auth/RBAC: phân quyền theo `profile_branch_access` cho role `manager`.
- Domain affected:
  - settings (general/branch/showroom-page configs), auth/rbac, public product/showroom config.
- App(s) affected:
  - `apps/web`, `apps/server`.

## Current State vs Target State
- Current:
  - Settings chủ yếu theo quyền Owner/Admin, chưa tách rõ scope thao tác cho manager theo branch.
  - Có rủi ro manager thấy/ghi cấu hình ngoài branch active nếu API guard chưa nhất quán.
  - Product page settings đã có luồng admin config nhưng chưa chốt contract quyền manager theo branch.
- Target (Architecture V2):
  - Manager vào được Settings nhưng chỉ thấy các section branch-scoped.
  - Mọi thao tác settings của manager bị hard-guard tại server theo branch access.
  - Manager chỉnh được product page settings của branch mình (draft/publish theo rule), không chỉnh được global settings hoặc branch khác.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập Supabase DB.
  - Branch scope đi từ auth context -> request -> service guard -> data-access filter.
  - Quyền manager luôn dựa trên `profile_branch_access`, không dựa vào branch do client tự gửi đơn lẻ.
- Forbidden:
  - Chỉ ẩn UI bằng frontend mà không enforce quyền ở server.
  - Cho manager sửa dữ liệu global (`system_settings`, users/roles toàn hệ thống, branch không thuộc quyền).
  - Fallback mơ hồ sang branch mặc định khi manager gửi branchId không hợp lệ.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window:
  - Giữ contract response settings hiện tại cho Owner/Admin.
  - Mở rộng role matrix để bổ sung nhánh manager branch-scoped.
- Deprecation/removal plan:
  - Nếu có endpoint/settings route legacy chỉ dành admin nhưng đang dùng chung, tách guard theo role và ghi migration note cho caller.
- Rollback condition:
  - Nếu rollout làm manager bị khóa nhầm khỏi settings branch hợp lệ hoặc lộ dữ liệu chéo branch, rollback policy mới theo feature flag RBAC.

## Danh sách task triển khai đề xuất

1. **Task 077.1 - RBAC matrix cho Settings theo role + branch**
   - Chốt rõ permission map:
     - `owner_admin/admin`: full settings theo chính sách hiện tại.
     - `manager`: chỉ settings branch-scoped.
     - `staff/customer`: không truy cập settings quản trị.
   - Định nghĩa error code chuẩn cho forbidden/out-of-branch.

2. **Task 077.2 - Server guard branch-scoped cho settings APIs**
   - Harden toàn bộ read/write settings endpoints bằng branch guard ở service/data-access.
   - Validate `requestedBranchId` phải thuộc `profile_branch_access` của manager.
   - Chặn thao tác cross-branch và chặn thao tác global-only với manager.

3. **Task 077.3 - UI settings theo scope manager**
   - Manager thấy menu/settings page nhưng chỉ hiện section được phép.
   - Disable/hide hành động global-only (users/roles/system-wide config).
   - Giữ UX rõ ràng: thông báo lý do khi action bị chặn do quyền.

4. **Task 077.4 - Product page settings theo branch cho manager**
   - Cho manager chỉnh config trang sản phẩm/public page của branch mình:
     - `PRODUCT_HOME`.
     - `PRODUCT_LANDING_HOME` (nếu đã bật).
   - Chỉ cho publish trong branch mình; không sửa config branch khác.
   - Đảm bảo public page đọc đúng bản publish theo branch sau khi manager cập nhật.

5. **Task 077.5 - Audit log + observability cho thao tác settings của manager**
   - Ghi log actor role, actor id, branch id, action, resource.
   - Bổ sung cảnh báo cho request mismatch branch access.

6. **Task 077.6 - Regression auth/anon/offline + branch switch**
   - Kiểm thử manager khi đổi branch active trong tập branch được cấp.
   - Kiểm thử manager không thể thao tác branch ngoài quyền.
   - Kiểm thử không phá các invariant auth/anon/offline hiện có.

## In-scope
- Mở quyền truy cập settings cho manager theo branch scope.
- Server-side RBAC + branch guard cho settings APIs.
- Manager chỉnh được product page settings của branch mình.
- UI/Navigation settings phản ánh đúng quyền manager.

## Out-of-scope
- Thay đổi policy quyền của owner_admin/admin ngoài phạm vi task.
- Thiết kế lại toàn bộ schema settings.
- Quyền manager chỉnh user/role toàn hệ thống.

## Prompt gợi ý cho Codex
```text
Mục tiêu: cho manager vào được Settings nhưng chỉ được xem/chỉnh dữ liệu của branch được phân quyền, bao gồm product page settings của branch đó.

Yêu cầu:
1) Bổ sung RBAC matrix rõ ràng cho settings: owner_admin/admin full, manager branch-scoped, staff/customer forbidden.
2) Harden toàn bộ settings APIs ở apps/server bằng branch guard theo profile_branch_access.
3) Cập nhật UI settings để manager chỉ thấy section branch-scoped, không thấy action global-only.
4) Cho manager chỉnh/publish product page settings của branch mình (`PRODUCT_HOME`, `PRODUCT_LANDING_HOME` nếu có).
5) Bổ sung audit log và regression cho branch switch + forbidden cross-branch.
6) Không tạo duplicate business logic giữa web legacy và server mới; ưu tiên server source-of-truth.

Kiến trúc bắt buộc:
- Component -> Hook -> Query -> Service -> API
- Chỉ apps/server truy cập Supabase DB
- Không dựa vào client-only guard cho authorization
```

## Done criteria (coding)
- Manager truy cập được màn hình Settings theo role.
- Manager chỉ đọc/ghi settings thuộc branch được cấp quyền.
- Manager không chỉnh được global settings và không chỉnh được branch ngoài quyền.
- Manager chỉnh/publish product page settings branch mình và public page phản ánh đúng config.
- API trả `403/404` rõ ràng cho trường hợp out-of-scope/out-of-branch.
- Pass lint/typecheck/build cho app bị chạm.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` nếu domain đã ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition cho migration/cutover.

## Regression Scope
- [ ] Manager vào settings được nhưng chỉ thấy/đổi dữ liệu branch hợp lệ.
- [ ] Manager đổi branch active trong danh sách được cấp: dữ liệu/settings đổi đúng theo branch.
- [ ] Manager cố gọi API với branch ngoài quyền: bị chặn chắc chắn ở server.
- [ ] Product page settings của branch A không ảnh hưởng branch B.
- [ ] Owner/Admin vẫn giữ full quyền như trước (không regression).
- [ ] Auth/anon/offline flow không bị phá khi manager đăng nhập/đăng xuất/switch context.

## Nhắc test nhanh
- Seed tối thiểu 2 branch (`A`, `B`) + 1 manager chỉ có quyền branch A.
- Kiểm tra:
  - manager mở settings và cập nhật branch A thành công.
  - manager thử truy cập/sửa branch B thất bại đúng lỗi.
  - manager cập nhật `PRODUCT_HOME`/`PRODUCT_LANDING_HOME` branch A, public page branch A đổi đúng; branch B giữ nguyên.
- Validation commands:
  - `cd apps/server && npm run lint && npm run build`
  - `cd apps/web && npm run lint && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- Nếu checklist chưa có dòng `077` thì thêm mới:
  ```bash
  sed -i '/^- \[.\] 076 /a - [ ] 077 | Branch manager settings scope: manager can access settings but only manage own-branch settings incl. product page configs | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ```
- Đánh dấu checklist khi hoàn thành:
  ```bash
  sed -i "s|^- \[ \] 077 |- [x] 077 |" progress/tasks.md
  ```
- Append log:
  ```bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 077
  - Task file: docs/tasks/077_branch_manager_settings_scope_and_product_page_settings.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ```
