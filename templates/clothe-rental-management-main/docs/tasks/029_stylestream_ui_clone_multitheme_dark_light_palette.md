# Task 029 - Stylestream UI Clone: Multi-Theme + Dark/Light + Palette

## Mục tiêu
- Clone hệ thống theme của Stylestream đầy đủ: dark/light mode, palette variants, và token mapping đồng nhất toàn app.
- Đảm bảo state theme đồng bộ với `userSettings` hiện có (`theme_mode`, `theme_variant`) cho cả cloud session và guest.
- Giữ nguyên logic auth/offline/anon, chỉ thay đổi UI theme layer.

## Phụ thuộc
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`
- `docs/tasks/024_stylestream_ui_clone_settings_module.md`
- `docs/tasks/028_stylestream_ui_clone_header_footer_navigation_parity.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/contexts/ThemeContext.tsx`
- `templates/stylestream-showcase-main/src/index.css`
- `templates/stylestream-showcase-main/src/components/ThemeToggle.tsx`
- `templates/stylestream-showcase-main/src/components/PaletteSelect.tsx`

## Mapping màn hình/source
- Theme foundation:
  - `apps/web/src/app/globals.css`
  - `apps/web/src/features/app-shell/components/ThemeAppearanceSync.tsx`
  - `apps/web/src/lib/theme.ts`
  - `apps/web/src/lib/themeVariants.ts`
- Theme controls placement:
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
  - `apps/web/src/features/showroom/components/ShowroomShell.tsx`
  - `apps/web/src/features/settings/components/SettingsGeneralPage.tsx` (nếu cần form-level settings)

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone multi-theme system từ Stylestream cho web app hiện tại.

Yêu cầu:
1) Token parity:
   - clone đầy đủ semantic tokens light/dark + palette variants từ template
   - map token cho admin + showroom + chart + table + form components
2) Theme state:
   - dark/light toggle giống template
   - palette select giống template
   - sync với authStore.userSettings (`theme_mode`, `theme_variant`)
3) Persistence/invariants:
   - cloud session: giữ update flow hiện có
   - guest session: local persistence không làm mất dữ liệu
   - không tạo state ownership trùng giữa store/query/component local state
4) Hydration/UX:
   - tránh FOUC/mismatch khi SSR hydration
   - đảm bảo fallback token khi giá trị theme invalid
5) Constraints:
   - không đổi API payload ngoài settings fields đã có
   - không sửa auth/offline business rules

Kết quả: dark/light + palette hoạt động đồng nhất như template trên toàn bộ routes.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt danh sách palette variants bắt buộc cho MVP.
- Chốt vị trí control theme:
  - chỉ trong settings
  - hay xuất hiện trực tiếp ở shell/header như template.
- Chốt fallback khi thiếu `theme_mode`/`theme_variant` trong data cũ.

## In-scope
- Token system dark/light + palette.
- Theme toggle/palette UI controls.
- Đồng bộ persistence với `userSettings`.

## Out-of-scope
- Thay đổi schema DB.
- Thêm business policy mới cho auth/offline.

## Deliverables mong muốn
- Theme parity gần template và không còn mismatch giữa các module.
- User đổi theme/palette và thấy hiệu lực ngay, reload vẫn giữ.

## Done criteria (coding)
- Dark/light + palette chạy ổn trên admin + showroom + reports charts.
- Reload/session switch vẫn giữ theme đúng theo settings.
- Không xuất hiện hydration warning liên quan theme.
- Không regression các flow auth guest/cloud.

## Nhắc test nhanh
- Manual: toggle dark/light và palette trên desktop/mobile.
- Manual: reload, sign in/out, guest mode -> verify persistence.
- Manual: kiểm tra contrast cơ bản trên các page chính.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 029 |- [x] 029 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 029
  - Task file: docs/tasks/029_stylestream_ui_clone_multitheme_dark_light_palette.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
