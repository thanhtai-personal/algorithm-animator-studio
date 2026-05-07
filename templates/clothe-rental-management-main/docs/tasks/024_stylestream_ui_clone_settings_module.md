# Task 024 - Stylestream UI Clone: Settings Module

## Mục tiêu
- Clone UI settings từ template Stylestream vào settings area hiện có của dự án.
- Đồng bộ ngôn ngữ visual cho tabs, cards, form blocks, action buttons.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/pages/admin/Settings.tsx`

## Mapping màn hình/source
- Settings root:
  - `apps/web/src/app/[locale]/(dashboard)/settings/page.tsx`
- Settings pages:
  - `apps/web/src/features/settings/components/SettingsGeneralPage.tsx`
  - `apps/web/src/features/settings/components/SettingsBranchesPage.tsx`
  - `apps/web/src/features/settings/components/SettingsUsersPage.tsx`
  - `apps/web/src/features/settings/components/SettingsShowroomPagesPage.tsx`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone UI style cho settings module theo template stylestream.

Yêu cầu:
1) Clone style cấu trúc settings:
   - tabs/group sections
   - cards/blocks spacing
   - inline tags/chips/actions
2) Map vào source settings pages hiện có:
   - general, branches, users, showroom-pages
3) Giữ nguyên behavior admin:
   - user invite/role update/disable/reset
   - branches CRUD
   - showroom config publish
4) Không đổi logic RBAC và API contract.
5) i18n-safe: không hardcode text mới nếu page đã dùng key translation.

Không thay schema/settings business rules.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt bố cục settings:
  - tab-level navigation tại root
  - hay giữ route-level navigation hiện có và clone style card/form.
- Chốt mức độ clone của tags/pricing/showroom sections từ template vào data model hiện tại.

## In-scope
- Clone style settings pages và interaction visuals.
- Đồng bộ button/input/chip patterns với các task clone trước.

## Out-of-scope
- Thêm capability settings mới ngoài task 016.
- Thay auth/permission policy.

## Deliverables mong muốn
- Settings module nhìn đồng nhất với ngôn ngữ Stylestream.
- Flow thao tác admin hiện có không bị regress.

## Done criteria (coding)
- 4 settings pages dùng style clone thống nhất.
- Action admin quan trọng vẫn hoạt động (invite/update/publish/branch CRUD).
- Không xuất hiện hard reload requirement sau thao tác chính.

## Nhắc test nhanh
- Manual: settings general/branches/users/showroom-pages.
- Manual: publish showroom config và verify page khách.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 024 |- [x] 024 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 024
  - Task file: docs/tasks/024_stylestream_ui_clone_settings_module.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
