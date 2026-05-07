# Task 057 - Staff tạo customer tối thiểu + customer phone/password sign-in + self-service profile/account

## Input ban đầu
- Cần cho nhân viên tạo nhanh khách hàng chỉ với:
  - số điện thoại
  - họ và tên
- Cần bổ sung login page để khách hàng có thể đăng nhập bằng `số điện thoại + mật khẩu`.
- Cần cho customer đã login:
  - xem profile cá nhân ngay trên product page,
  - thêm số điện thoại hoặc email vào tài khoản,
  - sửa tên đăng nhập (tên hiển thị),
  - đổi mật khẩu đăng nhập.

## Mục tiêu
- Chuẩn hóa flow tạo customer tối thiểu cho staff trong các màn create-order/POS.
- Login page hỗ trợ sign-in bằng phone/password cho role customer (không phá flow email/password hiện tại).
- Bổ sung self-service account cho customer trên web:
  - xem thông tin profile trên product page,
  - cập nhật contact methods (phone/email),
  - cập nhật tên hiển thị,
  - đổi mật khẩu.
- Giữ invariant auth/anon/offline hiện có.

## Phụ thuộc
- `docs/tasks/008_customers_crm_module.md`
- `docs/tasks/037_add_role_customer.md`
- `docs/tasks/053_dashboard_pos_order_creation_parity_inline_customer.md`
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`

## Mapping màn hình/source
- Customer create (staff flow):
  - `apps/web/src/features/orders/**`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
  - `apps/web/src/server/data-access/customers.ts`
  - `apps/web/src/server/services/customersService.ts`
- Auth/login:
  - `apps/web/src/features/auth/components/**`
  - `apps/web/src/features/auth/hooks/login/**`
  - `apps/web/src/features/auth/hooks/home/**`
  - `apps/web/src/features/auth/services/authBrowserService.ts`
  - `apps/web/src/server/services/authService.ts`
  - `apps/web/src/app/api/auth/sign-in/route.ts`
- Product page/customer profile:
  - `apps/web/src/features/showroom/**`
  - `apps/web/src/app/[locale]/product/**`
  - `apps/web/src/store/authStore.ts`

## Quy tắc nghiệp vụ bắt buộc
- Staff tạo customer tối thiểu:
  - bắt buộc `phone`, `fullName`;
  - các field khác optional/null;
  - validate phone theo rule hệ thống hiện hành;
  - unique phone theo branch phải được giữ.
- Nếu phone đã tồn tại:
  - không tạo duplicate;
  - trả thông điệp rõ để staff chọn customer đã có.
- Login bằng phone/password:
  - hỗ trợ trên cùng login page (song song email/password);
  - không làm hỏng sign-in email/password, OAuth, guest mode;
  - sau login customer phải redirect đúng flow customer/showroom.
- Customer profile/self-service:
  - customer đăng nhập có thể xem profile cá nhân trên product page.
  - cho phép thêm `phone` hoặc `email` vào tài khoản (không bắt buộc có cả hai).
  - không cho phép gắn `phone/email` đã thuộc tài khoản khác.
  - cho phép cập nhật tên hiển thị (username/fullName).
  - cho phép đổi mật khẩu đăng nhập bằng flow an toàn hiện hành.
- Không bypass RBAC và không làm lộ thông tin nhạy cảm trong error message.

## In-scope
- Bổ sung UI/hook/query/service để staff tạo nhanh customer tối thiểu.
- Bổ sung selector hoặc input mode cho sign-in bằng phone/password.
- Bổ sung khu vực hiển thị profile customer trên product page khi đã login.
- Bổ sung UI/hook/service cho customer tự cập nhật phone/email/fullName và đổi mật khẩu.
- Chuẩn hóa error mapping cho duplicate phone/auth fail.
- Cập nhật i18n vi/en cho text mới.

## Out-of-scope
- Thay đổi toàn bộ onboarding/sign-up flow của customer.
- Xây OTP/SMS login.
- Verify phone/email qua OTP.

## Prompt gợi ý cho Codex
```text
Mục tiêu:
1) staff tạo customer với phone + fullName;
2) login page hỗ trợ customer sign-in bằng phone/password;
3) customer self-service profile/account trên product page.

Yêu cầu:
- Giữ architecture Component -> Hook -> Query -> Service -> API.
- Không regression email sign-in, google sign-in, guest mode.
- Duplicate phone phải xử lý rõ, không tạo trùng.
- Redirect customer sau login đúng route customer/showroom.
- Customer có thể xem profile, thêm phone/email, sửa fullName, đổi mật khẩu.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Staff có thể tạo customer chỉ với `phone + fullName` ở các flow liên quan.
- Duplicate phone không tạo bản ghi mới và có thông báo phù hợp.
- Login page sign-in được bằng `phone + password`.
- Email/password sign-in cũ vẫn hoạt động.
- Product page hiển thị profile customer khi đã login.
- Customer cập nhật được phone/email (nếu không trùng), cập nhật fullName và đổi mật khẩu thành công.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Staff tạo customer mới từ flow POS/orders.
- Thử tạo customer với phone trùng để verify duplicate handling.
- Customer sign-in bằng email/password và phone/password.
- Verify redirect sau login của customer và staff không bị đảo sai.
- Trên product page: verify customer thấy đúng thông tin profile của chính mình.
- Cập nhật phone/email:
  - thêm phone/email mới hợp lệ,
  - thử phone/email đã tồn tại để verify reject.
- Đổi tên hiển thị và đổi mật khẩu:
  - login lại bằng mật khẩu mới thành công.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 057 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 056 /a - [ ] 057 | Staff minimal customer create + customer phone/password sign-in + profile/account self-service | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 057 |- [x] 057 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 057
  - Task file: docs/tasks/057_staff_customer_minimal_create_and_customer_phone_password_signin.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
