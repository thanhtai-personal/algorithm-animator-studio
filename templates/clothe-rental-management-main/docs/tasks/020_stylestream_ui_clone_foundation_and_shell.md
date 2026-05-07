# Task 020 - Stylestream UI Clone Foundation (Theme Tokens + Shell)

## Mục tiêu
- Thiết lập nền UI clone từ `templates/stylestream-showcase-main` cho web app hiện tại.
- Clone visual language cốt lõi: theme tokens, typography, spacing, animation, admin shell, showroom shell.
- Chỉ thay đổi UI/UX layer, không đổi business logic/data flow của các module đã có.

## Phụ thuộc
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/017_i18n_completion_and_release_hardening.md`
- `docs/tasks/019_auth_role_based_redirect_and_flow_completion.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/index.css`
- `templates/stylestream-showcase-main/src/contexts/ThemeContext.tsx`
- `templates/stylestream-showcase-main/src/components/layouts/AdminLayout.tsx`
- `templates/stylestream-showcase-main/src/components/layouts/ShowroomLayout.tsx`

## Mapping màn hình/source
- Admin shell:
  - template: `src/components/layouts/AdminLayout.tsx`
  - source target: `apps/web/src/features/app-shell/components/DashboardShell.tsx`
- Showroom shell:
  - template: `src/components/layouts/ShowroomLayout.tsx`
  - source target: `apps/web/src/app/[locale]/showroom/layout.tsx` (hoặc component layout tương đương)
- Theme/tokens global:
  - template: `src/index.css`, `ThemeContext.tsx`
  - source target: `apps/web/src/app/globals.css`, `apps/web/src/lib/theme*`, `apps/web/src/store/authStore.ts` (nếu cần đồng bộ palette với user settings)

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone foundation UI từ templates/stylestream-showcase-main vào source web app hiện tại.

Yêu cầu:
1) Clone theme foundation:
   - HSL token system cho light/dark + semantic tokens (`--primary`, `--muted`, `--success`, `--warning`, `--sidebar-*`)
   - typography gần giống template (Plus Jakarta Sans hoặc tương đương đã approved)
   - motion utilities (`animate-fade-in`, `animate-slide-up`, `animate-scale-in`)
2) Clone admin shell layout:
   - sidebar + topbar style từ `AdminLayout`
   - mobile behavior: drawer/overlay, responsive nav
   - giữ locale routing + auth guard hiện có
3) Clone showroom shell layout:
   - sticky header + footer + mobile search behavior
   - ưu tiên tái sử dụng component shared thay vì copy nguyên khối
4) Palette/theme controls:
   - giữ tương thích user settings hiện có (`theme_mode`, `theme_variant`)
   - nếu thêm palette selector mới, map vào store hiện có, không tạo state ownership trùng
5) Không đổi logic nghiệp vụ:
   - không sửa API contract/module business flows
   - chỉ thay UI shell, styling, composition component
6) Kiến trúc bắt buộc:
   - Component -> Hook -> Query -> Service -> API/Supabase
   - không gọi Supabase trực tiếp trong component

Kết quả: shell và token system sẵn sàng để clone UI từng module ở các task tiếp theo.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt font chính (khuyến nghị: `Plus Jakarta Sans` như template).
- Chốt mapping `theme_variant` hiện tại sang palette set mới.
- Chốt scope dark mode:
  - hỗ trợ đầy đủ như template
  - hoặc chỉ giữ light mode cho MVP và hard-disable dark token switch.

## In-scope
- Theme tokens + motion utilities + typography.
- Admin shell visual clone (sidebar/topbar).
- Showroom shell visual clone (header/footer).
- Responsive behavior cơ bản của shell.

## Out-of-scope
- Clone chi tiết từng module page (dashboard/orders/products/...)
- Thay business logic module.
- Thay đổi schema DB hoặc auth flow.

## Deliverables mong muốn
- Dashboard shell và showroom shell mang visual language Stylestream.
- Theme token system ổn định cho tất cả module pages.
- Không phá i18n/auth/offline behavior hiện có.

## Done criteria (coding)
- `/{locale}/dashboard` dùng shell mới, responsive desktop/mobile.
- `/{locale}/showroom` có header/footer/showroom shell mới.
- Theme mode + palette (nếu bật) không gây mismatch hydration.
- Không đổi API payload/flow nghiệp vụ hiện có.

## Nhắc test nhanh
- Manual: desktop + mobile emulation cho dashboard shell/showroom shell.
- Manual: switch locale `vi/en`, switch role admin/non-admin.
- Manual: toggle theme mode/palette (nếu có) và reload.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 020 |- [x] 020 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 020
  - Task file: docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
