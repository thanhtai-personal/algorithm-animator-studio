# Task 077 - Zalo Mini App foundation: kiến trúc tích hợp + bootstrap app

## Input ban đầu
- Cần mở thêm kênh bán/đặt hàng trên Zalo Mini App, nhưng vẫn tái sử dụng business hiện có của hệ thống.
- Hiện source chưa có app riêng cho Zalo Mini App.
- Cần kế hoạch kỹ thuật rõ ràng để tránh tách logic rời rạc hoặc lệch kiến trúc chuẩn.

## Mục tiêu
- Thiết lập nền tảng Zalo Mini App trong monorepo theo hướng:
  - tách app client riêng,
  - tái sử dụng service/backend domain hiện có,
  - giữ chuẩn `Component -> Hook -> Query -> Service -> API/Supabase`.
- Chốt contract tích hợp SDK/CLI chính thức và quy ước môi trường deploy.

## Nghiên cứu nhanh và kết luận áp dụng
- Nguồn chính thức xác nhận stack và vòng đời app:
  - Zalo Mini App template + CLI (`zmp-cli`, `zmp-sdk`, `@zmp-ui/core`) từ org chính chủ `Zalo-MiniApp`.
  - Link tham khảo:
    - https://github.com/Zalo-MiniApp/zmp-blank-templates
    - https://github.com/Zalo-MiniApp
- SDK chính thức cung cấp nhóm API cần cho nghiệp vụ:
  - auth (`authorize`, `getAccessToken`, `getUserInfo`),
  - payment (`openPayment`, server `createOrder`, callback/check transaction),
  - notification/permission (`requestSendNotification`, `openPermissionSetting`),
  - OA/support (`showOAWidget`).
  - Link docs:
    - https://mini.zalo.me/docs/api/authorize/
    - https://mini.zalo.me/docs/api/getaccesstoken/
    - https://mini.zalo.me/docs/api/getuserinfo/
    - https://mini.zalo.me/docs/api/openpayment/
    - https://mini.zalo.me/docs/api/requestsendnotification/
    - https://mini.zalo.me/docs/api/openpermissionsetting/
    - https://mini.zalo.me/docs/api/showoawidget/
- Open APIs/Webhook có yêu cầu bảo mật chữ ký và vận hành domain:
  - webhook URL, verify signature, revoke-consent event, domain monitoring.
  - Link docs:
    - https://mini.zalo.me/docs/open-api/overview/
    - https://mini.zalo.me/docs/open-api/webhook-url/
    - https://mini.zalo.me/docs/open-api/verify-signature/
    - https://mini.zalo.me/docs/open-api/user-revoke-consent/
    - https://mini.zalo.me/docs/monitoring/overview/

Kết luận áp dụng:
- Tạo app mới `apps/zalo-mini-app` dùng Zalo stack chính thức.
- Không copy business logic sang client mini app; mọi nghiệp vụ đi qua API/service backend hiện có.
- Chuẩn hóa adapter để cô lập Zalo SDK khỏi tầng component.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`
- `docs/tasks/033_pwa_web_enablement.md`
- `docs/tasks/041_product_landing_home_clone_admin_config_logo_featured.md`

## Mapping màn hình/source
- App bootstrap (new):
  - `apps/zalo-mini-app/**` (new)
  - `apps/zalo-mini-app/package.json` (new)
  - `apps/zalo-mini-app/src/**` (new)
- Mini-app adapter layer (new):
  - `apps/zalo-mini-app/src/features/platform/services/zaloSdkService.ts`
  - `apps/zalo-mini-app/src/features/platform/queries/useZaloPlatformQueries.ts`
  - `apps/zalo-mini-app/src/features/platform/hooks/useZaloPlatformBootstrap.ts`
- Shared backend integration:
  - `apps/web/src/app/api/**` (reuse/update selective endpoints if needed)
  - `apps/web/src/server/services/**` (reuse business services)
- Tài liệu:
  - `docs/guides/006_zalo_mini_app_integration_strategy.md` (new)

## Quy tắc kỹ thuật bắt buộc
- Kiến trúc client của mini app vẫn theo flow chuẩn:
  - `Component -> Hook -> Query -> Service -> API/Supabase`.
- Không gọi trực tiếp Supabase từ UI mini app cho nghiệp vụ chính.
- Không duplicate business rules giữa `apps/web` và `apps/zalo-mini-app`.
- Feature flag:
  - có cờ `is_zalo_mini_app_enabled` để rollout an toàn.
- Domain/API policy:
  - endpoint domain dùng cho mini app phải nằm trong allowlist theo platform monitoring.

## In-scope
- Khởi tạo skeleton `apps/zalo-mini-app` bằng stack chính thức.
- Thiết lập adapter service cho SDK calls cơ bản (chưa đi sâu nghiệp vụ).
- Tạo contract env/config cho appId, API base URL, release channel.
- Viết docs chiến lược tích hợp và checklist vận hành tối thiểu.

## Out-of-scope
- Full auth mapping/consent lifecycle chi tiết.
- Thanh toán hoàn chỉnh.
- Toàn bộ flow đơn hàng production-ready.

## Prompt gợi ý cho Codex
```text
Mục tiêu: bootstrap app Zalo Mini App trong monorepo và chốt kiến trúc tích hợp không lệch flow chuẩn.

Yêu cầu:
1) Tạo app `apps/zalo-mini-app` theo stack Zalo chính thức (zmp-cli/zmp-sdk/@zmp-ui/core).
2) Thiết kế adapter layer để component không gọi trực tiếp SDK.
3) Chốt env/config + feature flag `is_zalo_mini_app_enabled`.
4) Không duplicate business logic: mini app chỉ gọi API/service backend hiện có.
5) Viết guide kỹ thuật + runbook bootstrap.

Validation commands:
- cd apps/zalo-mini-app && npm run lint
- cd apps/zalo-mini-app && npm run build
```

## Done criteria (coding)
- Có app `apps/zalo-mini-app` chạy được skeleton cơ bản.
- Có adapter/hook/query nền tảng cho Zalo SDK.
- Có strategy doc mô tả integration flow và boundary.
- Có feature flag để bật/tắt an toàn.
- `cd apps/zalo-mini-app && npm run lint` pass.

## Nhắc test nhanh
- App boot được trong Zalo Mini App environment.
- Không có component gọi trực tiếp SDK (đi qua service layer).
- Feature flag OFF không ảnh hưởng web/mobile hiện tại.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/001` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/001 |- [x] Modules/Zalo-Mini-App/001 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/001
  - Task file: docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
