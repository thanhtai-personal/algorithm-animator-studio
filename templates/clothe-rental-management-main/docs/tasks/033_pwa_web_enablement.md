# Task 033 - PWA Enablement for Web App (Installable + Offline Base)

## Mục tiêu
- Thêm khả năng PWA cho `apps/web` để web app có thể cài đặt như app (desktop/mobile) và có offline base behavior.
- Đảm bảo chuẩn installability: manifest hợp lệ, icon đầy đủ, service worker đăng ký đúng, HTTPS/prod ready.
- Không thay đổi business logic hiện có; chỉ mở rộng platform capability cho web.

## Phụ thuộc
- `docs/tasks/001_foundation_source_base_alignment.md`
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/017_i18n_completion_and_release_hardening.md`
- `docs/tasks/031_stylestream_ui_clone_full_parity_closure.md`

## Nguồn tham chiếu
- `AGENTS.md`
- `.mcp.full.md`
- Next.js PWA approach (App Router)
- Web App Manifest spec
- Service Worker / Cache Storage best practices

## Mapping màn hình/source
- App config + metadata:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/manifest.ts` (hoặc `public/manifest.webmanifest`)
  - `apps/web/public/icons/**`
- Service worker + runtime caching:
  - `apps/web/public/sw.js` (nếu custom) hoặc plugin-generated output
  - `apps/web/next.config.ts` (nếu dùng `next-pwa`)
- Install prompt/UI:
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts`
  - `apps/web/src/features/pwa/hooks/usePwaInstallPrompt.ts`
- Offline/fallback:
  - `apps/web/src/app/offline/page.tsx` (optional)
  - cache strategy cho static assets + shell route

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm PWA capability cho apps/web (Next.js), giữ nguyên business logic.

Yêu cầu:
1) Installability chuẩn:
   - tạo manifest đầy đủ (name, short_name, start_url, display, theme_color, background_color, icons maskable + non-maskable)
   - đảm bảo icons đủ kích thước phổ biến (192/512)
2) Service worker:
   - implement/enable SW cho cache static assets + app shell
   - có update strategy an toàn (activate mới, cleanup cache cũ)
3) Runtime caching strategy:
   - static assets: cache-first
   - API GET non-sensitive: network-first with fallback (nếu phù hợp)
   - không cache dữ liệu nhạy cảm/auth response
4) Install prompt UX:
   - detect `beforeinstallprompt`
   - CTA cài app ở shell/topbar/menu (desktop + mobile)
   - fallback hướng dẫn thủ công cho iOS Safari
5) Offline UX:
   - offline fallback page/message rõ ràng
   - route critical shell vẫn mở được tối thiểu khi mất mạng
6) Constraints:
   - không đổi flow auth/permissions/business API
   - không phá SEO/canonical hiện có
   - không cache sai gây lộ dữ liệu user
7) Validation:
   - Lighthouse PWA checks pass ở mức MVP
   - manual test install/update/offline

Kết quả: web app có thể install như app, có offline base behavior ổn định và không regression nghiệp vụ.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt phương án SW:
  - dùng `next-pwa`
  - hoặc custom SW + Workbox
- Chốt phạm vi offline MVP:
  - app shell + static assets
  - hay thêm một số route public (`/showroom`) và offline page
- Chốt branding/icon pack cho PWA:
  - app name/short name
  - icon/splash color theo theme chính
- Chốt policy cache API:
  - endpoint nào được cache
  - endpoint nào bắt buộc bypass cache

## Hướng dẫn cài đặt nếu project chưa có PWA stack
1. Chuẩn bị package/tooling:
   - cài thư viện cần thiết (`next-pwa` hoặc Workbox tùy chiến lược)
   - cập nhật `next.config.ts` để build ra service worker
2. Khai báo manifest:
   - tạo `src/app/manifest.ts` hoặc `public/manifest.webmanifest`
   - khai báo đầy đủ metadata + icon paths
3. Tạo icon assets:
   - thêm icon 192x192, 512x512, maskable icon vào `public/icons/`
4. Đăng ký service worker:
   - đảm bảo chỉ enable ở production (khuyến nghị)
   - xử lý update + cache cleanup
5. Kết nối UI install prompt:
   - bắt event `beforeinstallprompt`, lưu deferred event
   - thêm button/menu action “Cài đặt ứng dụng”
6. Kiểm tra production prerequisites:
   - deploy qua HTTPS
   - xác nhận scope SW đúng domain/path

## In-scope
- Web manifest + icons + SW integration.
- Install prompt UX cơ bản.
- Offline fallback/base caching strategy cho MVP.
- QA checklist PWA install/update/offline.

## Out-of-scope
- Rewrite logic offline sync sâu cho toàn bộ domain.
- Native push notification (FCM/APNs).
- Desktop app packaging (Electron/Tauri).

## Deliverables mong muốn
- App web cài được như PWA trên Chrome/Edge/Android (và có hướng dẫn iOS).
- Có service worker hoạt động ổn định, offline base UX rõ ràng.
- Không regression các luồng auth/dashboard/showroom hiện có.

## Done criteria (coding)
- Lighthouse PWA criteria trọng yếu pass (manifest + SW + installable).
- Có install CTA hoạt động và thể hiện trạng thái cài đặt.
- Offline mode hiển thị fallback hợp lệ thay vì màn hình lỗi thô.
- `cd apps/web && npm run lint:mvp` pass.
- `cd apps/web && npm run typecheck:mvp` pass.
- `cd apps/web && npm run build` pass.

## Nhắc test nhanh
- Manual: open app trên Chrome -> thấy install prompt/CTA.
- Manual: install app, mở lại từ icon app vẫn vào đúng route.
- Manual: giả lập offline -> app hiển thị fallback đúng.
- Manual: deploy/build mới -> SW update flow không kẹt cache cũ.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`
- `cd apps/web && npm run build`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 033 |- [x] 033 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 033
  - Task file: docs/tasks/033_pwa_web_enablement.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
