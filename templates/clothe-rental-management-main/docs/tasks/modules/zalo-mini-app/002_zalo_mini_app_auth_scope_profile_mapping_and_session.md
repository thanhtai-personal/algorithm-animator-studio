# Task 078 - Zalo Mini App auth: consent scope + profile mapping + session an toàn

## Input ban đầu
- Zalo Mini App cần danh tính người dùng để:
  - cá nhân hóa dữ liệu,
  - map với customer profile nội bộ,
  - kiểm soát quyền truy cập đúng branch/showroom.
- Nếu không chuẩn hóa consent + token flow sẽ dễ mismatch danh tính và lỗi session.

## Mục tiêu
- Thiết lập auth flow chuẩn cho mini app:
  - xin quyền (`authorize`),
  - lấy access token (`getAccessToken`),
  - lấy thông tin user (`getUserInfo`) theo consent.
- Mapping 1-1 danh tính Zalo với profile nội bộ, có cơ chế xử lý revoke consent.

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/037_add_role_customer.md`
- `docs/tasks/057_staff_customer_minimal_create_and_customer_phone_password_signin.md`

## Mapping màn hình/source
- Mini app auth feature (new):
  - `apps/zalo-mini-app/src/features/auth/components/**`
  - `apps/zalo-mini-app/src/features/auth/hooks/**`
  - `apps/zalo-mini-app/src/features/auth/queries/**`
  - `apps/zalo-mini-app/src/features/auth/services/**`
  - `apps/zalo-mini-app/src/features/auth/stores/**`
- Backend mapping API:
  - `apps/web/src/app/api/zalo-mini-app/auth/**` (new)
  - `apps/web/src/server/services/zaloMiniAppAuthService.ts` (new)
  - `apps/web/src/server/data-access/zaloMiniAppAuth.ts` (new)
  - `apps/web/src/types/zaloMiniAppAuth.ts` (new)
- SQL:
  - `apps/web/sql/0xx_zalo_mini_app_auth_identity.sql` (new)

## Quy tắc nghiệp vụ bắt buộc
- Consent scopes:
  - chỉ yêu cầu scope tối thiểu theo nhu cầu thực tế (`scope.userInfo`, mở rộng khi cần).
- Auth flow chuẩn:
  - `authorize` -> `getAccessToken` -> gửi token về backend để verify/mapping.
- Mapping identity:
  - mỗi `zalo_user_id` map tối đa 1 profile cloud chính (tránh duplicate account).
- Session safety:
  - token lỗi/hết hạn phải có refresh/retry path rõ ràng.
- Revoke consent:
  - chuẩn bị luồng invalidate liên kết khi có webhook event thu hồi quyền.

## In-scope
- Auth UI/flow mini app.
- Endpoint backend verify token + upsert mapping profile.
- Bảng mapping danh tính + audit metadata tối thiểu.
- Guard routes theo trạng thái xác thực thành công.

## Out-of-scope
- Social graph/friend list features.
- Đồng bộ profile nâng cao đa hệ thống ngoài phạm vi mini app.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện auth flow cho Zalo Mini App gồm consent, token, profile mapping và session guard.

Yêu cầu:
1) Implement authorize + getAccessToken + getUserInfo flow theo Zalo SDK.
2) Backend verify token và map `zalo_user_id` với profile nội bộ.
3) Có handling token invalid/expired và trạng thái chưa cấp quyền.
4) Chuẩn bị contract để xử lý revoke-consent event từ webhook.
5) Không phá auth flow hiện có của web/mobile.

Validation commands:
- cd apps/zalo-mini-app && npm run lint
- cd apps/web && npm run typecheck
```

## Done criteria (coding)
- Người dùng đăng nhập mini app thành công với consent hợp lệ.
- Backend lưu/match identity mapping ổn định, không tạo duplicate profile.
- Session guard hoạt động khi token lỗi hoặc user từ chối quyền.
- `cd apps/zalo-mini-app && npm run lint` pass.
- `cd apps/web && npm run typecheck` pass.

## Nhắc test nhanh
- Case first login: cấp quyền -> map profile thành công.
- Case deny consent: UI hiển thị hướng dẫn cấp quyền lại.
- Case token invalid: backend trả lỗi chuẩn, client fallback an toàn.
- Case account đã map trước đó: không tạo profile trùng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/002` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/002 |- [x] Modules/Zalo-Mini-App/002 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/002
  - Task file: docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
