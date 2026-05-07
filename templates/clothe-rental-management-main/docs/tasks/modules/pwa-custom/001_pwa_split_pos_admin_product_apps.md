# Task 076 - Tách PWA thành 3 app: POS App, Admin App, Product App

## Input ban đầu
- Hiện tại web PWA đang chạy như một app thống nhất, chưa tách trải nghiệm cài đặt theo vai trò/mục đích sử dụng.
- Nhu cầu vận hành:
  - POS cần app tập trung tốc độ thao tác bán hàng tại quầy.
  - Admin cần app tập trung quản trị (dashboard/settings/users/reports).
  - Product cần app tập trung duyệt sản phẩm/showroom cho staff hoặc khách.
- Cần tách app theo hướng installable riêng nhưng vẫn giữ chung source base.

## Mục tiêu
- Tách PWA trong `apps/web` thành 3 app logic:
  - `POS App`
  - `Admin App`
  - `Product App`
- Mỗi app có manifest/scope/start_url/icon riêng, cài đặt độc lập được trên cùng thiết bị.
- Giữ nguyên kiến trúc business hiện tại, không phá flow auth/offline/anon.

## Phụ thuộc
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`
- `docs/tasks/033_pwa_web_enablement.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`
- `docs/tasks/063_global_status_localization_across_all_screens.md`

## Mapping màn hình/source
- PWA manifest + metadata:
  - `apps/web/src/app/**/manifest.ts` (new/update theo từng app scope)
  - `apps/web/public/icons/pos/**` (new)
  - `apps/web/public/icons/admin/**` (new)
  - `apps/web/public/icons/product/**` (new)
- Install prompt + shell wiring:
  - `apps/web/src/features/pwa/hooks/usePwaInstallPrompt.ts` (update để hỗ trợ multi-app context)
  - `apps/web/src/features/app-shell/components/**` (update CTA theo app context)
  - `apps/web/src/components/layout/PublicSiteHeader.tsx` (product app install entry nếu cần)
- Service worker/cache strategy:
  - `apps/web/public/sw.js` hoặc config plugin PWA hiện tại (update)
  - `apps/web/next.config.*` (update)
- Route/app entry:
  - `apps/web/src/app/**` (wiring start_url/scope cho pos/admin/product)
- Tài liệu:
  - `docs/guides/pwa_multi_app_strategy_pos_admin_product.md` (new)

## Quy tắc nghiệp vụ bắt buộc
- Installability:
  - mỗi app phải có `name`, `short_name`, `id`, `start_url`, `scope`, `icons` riêng.
  - không xung đột install identity giữa 3 app.
- RBAC + route guard:
  - `POS App`: staff/manager/admin/owner_admin theo policy hiện hành.
  - `Admin App`: admin/owner_admin.
  - `Product App`: theo policy public/customer/staff đã có.
- Bảo mật cache:
  - không cache response nhạy cảm (auth/token/user-private payload).
  - tránh cache key collision giữa các app scope.
- Tính ổn định:
  - thiếu điều kiện PWA không được làm hỏng flow web hiện có.
  - không phá onboarding -> home navigation và auth redirect.

## In-scope
- Tách cấu hình PWA thành 3 app context trong cùng codebase.
- Tách icon/branding và install prompt theo context.
- Cập nhật cache strategy theo từng scope để tránh nhiễu dữ liệu.
- Cập nhật docs runbook cho dev/QA về cách verify cài đặt 3 app.

## Out-of-scope
- Tách thành 3 repo độc lập hoặc 3 deployment pipeline độc lập.
- Viết lại toàn bộ module POS/Admin/Product.
- Thiết kế lại UI tổng thể ngoài phạm vi PWA split.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tách PWA web hiện tại thành 3 app installable riêng: POS, Admin, Product.

Yêu cầu:
1) Thiết kế multi-manifest/multi-scope để 3 app có thể cài độc lập trên cùng thiết bị.
2) Mỗi app có branding/icon/start_url/scope riêng và không conflict identity.
3) Cập nhật install prompt để hiển thị đúng theo app context hiện tại.
4) Cập nhật service worker/cache strategy để không trộn dữ liệu nhạy cảm giữa app scopes.
5) Giữ nguyên flow auth/RBAC/offline hiện có; không regression điều hướng và nghiệp vụ chính.
6) Bổ sung tài liệu verify thủ công cho QA.

Validation commands:
- cd apps/web && npm run lint
- cd apps/web && npm run typecheck
- cd apps/web && npm run build
```

## Done criteria (coding)
- Cài đặt được 3 app độc lập (POS/Admin/Product) từ cùng domain/source base.
- Mỗi app mở từ icon sẽ vào đúng `start_url` và nằm trong đúng `scope`.
- Route guard/RBAC không bị bypass sau khi tách.
- Không có regression rõ ràng ở auth redirect và các flow chính POS/Admin/Product.
- `cd apps/web && npm run lint` pass.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run build` pass.

## Nhắc test nhanh
- Install test:
  - cài lần lượt POS/Admin/Product trên cùng thiết bị, xác nhận có 3 icon/app riêng.
- Scope test:
  - mở từng app từ icon và xác nhận vào đúng route mục tiêu.
- Permission test:
  - tài khoản staff không vào được admin app routes.
  - admin vào được admin app + pos app.
- Offline/safety:
  - offline mở lại app shell từng app vẫn có fallback hợp lệ.
  - logout không làm lộ dữ liệu nhạy cảm qua cache.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 076 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 075 /a - [ ] 076 | Split web PWA into POS/Admin/Product installable apps with separate manifests/scopes/icons and safe cache strategy | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 076 |- [x] 076 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 076
  - Task file: docs/tasks/076_pwa_split_pos_admin_product_apps.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
