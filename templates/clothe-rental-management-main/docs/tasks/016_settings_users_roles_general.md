# Task 016 - Settings Module (General, Branches, Users & Roles)

## Mục tiêu
- Implement Settings module cho cấu hình hệ thống, cấu hình showroom page khách, và quản lý user nội bộ theo PRD.
- Hoàn tất nền quản trị cho Owner/Admin.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`
- `docs/tasks/004_locale_routing_app_shell.md`
- `docs/tasks/015_reports_module.md` (không bắt buộc, nhưng nên sau khi modules core ổn định)

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 4.1, 4.9, 5.2)
- `docs/001_wireframe.md` (Section 11)

## Prompt gợi ý cho Codex
```text
Mục tiêu: xây Settings module MVP gồm General Settings, Showroom Page Config, Branches (optional), Users & Roles.

Yêu cầu:
1) Routes:
   - /[locale]/settings/general
   - /[locale]/settings/showroom-pages (hoặc section trong General nếu muốn gộp MVP)
   - /[locale]/settings/branches (optional/feature-flag)
   - /[locale]/settings/users
2) General Settings:
   - default locale (vi/en)
   - currency default (VND)
   - late fee policy (fixed/day or percent/day)
   - laundry tracking toggle
   - opening hours (theo PRD)
   - reminder thresholds (optional nhưng khuyến nghị): overdue/laundry-stuck threshold nếu dùng calendar reminders
   - default deposit config theo loại sản phẩm (PRD)
   - quản lý tags/categories hệ thống (ít nhất product categories + customer tags MVP)
3) Users & Roles:
   - list users (name/email/role/branch/active)
   - actions: invite user, change role, disable user
   - validation role/branch required for staff/manager
   - reset password (admin trigger) / change password path (self-service hoặc redirect auth flow) phải được định nghĩa rõ và không regress auth hiện có
4) Branches:
   - CRUD nếu bật multi-branch
5) Showroom page config (customer product home page):
   - admin cấu hình thông tin hiển thị trên showroom page (hero/banner/section order/filter options/text blocks...)
   - chọn template page cho `PRODUCT_HOME`
   - danh sách template đọc từ `showroom_page_templates` (DB registry từ Task 002), không hard-code list trong UI
   - publish/unpublish config theo branch/locale
   - MVP chỉ có 1 template render thật (`v1`) nhưng UI/DB contract phải sẵn cho nhiều template sau này
   - hỗ trợ voice input cho text blocks/hero title/subtitle/SEO text fields (optional MVP) nếu shared primitive từ Task 005 đã có
6) RBAC:
   - Owner/Admin only cho settings quan trọng
   - showroom page config/template selection chỉ Admin (khuyến nghị MVP)
7) Tích hợp auth/profiles:
   - update profiles.locale
   - branch assignments
8) Tích hợp business modules:
   - late fee + laundry toggle đọc được ở return flow
   - default deposit config đọc được ở products/orders pricing
   - customer tag/category settings phản ánh vào filters/forms liên quan
   - showroom page khách đọc đúng config/template đã publish

Không làm quá sâu invite email UX nếu Supabase invite hạn chế; có thể MVP admin tạo user + reset password flow documented.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt feature flag multi-branch:
  - `off` cho MVP nhưng schema có sẵn
  - `on` nếu cần demo
- Invite strategy:
  - Supabase admin invite API
  - hay seed/create auth user trực tiếp từ server service (không khuyến nghị production)
- Cấu hình late fee defaults
- Quy ước nơi lưu general settings:
  - `system_settings` table
  - hoặc branch-level settings table
- Opening hours model:
  - global per system
  - per branch
- Tags/categories scope MVP:
  - product categories
  - customer tags (vip/blacklist + custom?)
- Default deposit config granularity + precedence:
  - product type/category -> product -> variant -> order override
- Showroom page config scope:
  - per branch + per locale (khuyến nghị, align schema)
  - hay global default + branch override
- Showroom template strategy:
  - MVP render 1 template (`PRODUCT_HOME_V1`)
  - DB có registry template + page config chọn template
  - Task 002 phải seed sẵn template registry + default published config để UI có dữ liệu nền (không phụ thuộc manual SQL ngoài luồng)
- Publish workflow cho showroom page config:
  - edit draft -> publish
  - hoặc save trực tiếp (MVP đơn giản)
- Password flows:
  - admin reset via Supabase invite/reset link
  - user change password via auth screen/profile action
- Voice input strategy cho Settings forms:
  - text fields/textareas only (khuyến nghị MVP)
  - fallback manual typing nếu browser unsupported/permission denied

## In-scope
- Settings general/showroom-page/users/roles (+ branches optional)
- RBAC enforcement cho settings
- Opening hours + tags/categories + default deposit config (MVP)
- Password reset/change flow definition + integration (MVP-level)
- Showroom page display config + template selection (MVP admin control)
- Voice input support cho các text-heavy admin settings forms (ưu tiên showroom page content config)

## Out-of-scope
- Deep audit dashboard cho user management
- SSO enterprise
- Advanced workflow engine cho reminders

## Deliverables mong muốn
- Owner/Admin quản được users/roles + settings cơ bản
- System settings đọc được ở Orders/Return flow (late fee, laundry toggle)
- Opening hours / tags-categories / default deposit config usable trong modules liên quan
- Admin cấu hình được nội dung hiển thị showroom product home page + chọn template
- Admin có thể dùng voice input để nhập nhanh text fields ở settings forms được bật (không bắt buộc mọi field)
- Password reset/change path rõ ràng (UI hoặc documented integration) và không regress auth

## Done criteria (coding)
- Owner/Admin truy cập settings được, staff bị chặn
- Late fee policy thay đổi phản ánh vào return fee calc
- Cập nhật role/branch user thành công
- Opening hours và tags/categories lưu + đọc được
- Default deposit config theo loại sản phẩm phản ánh vào create order/product pricing defaults
- Showroom page config lưu/đọc/publish được; customer showroom page dùng đúng config published
- Template selection cho `PRODUCT_HOME` lưu được (MVP chỉ render `v1`, nhưng DB/UI contract support future templates)
- UI chỉ cho publish template/config hợp lệ; template inactive không selectable (hoặc bị chặn rõ ràng)
- Voice input (nếu bật) không auto-publish/auto-save settings form
- Reset/change password path hoạt động hoặc documented fallback rõ ràng (không mơ hồ)

## Nhắc test nhanh
- Manual RBAC checks
- Manual settings change impact (late fee/laundry toggle)
- Manual settings change impact (default deposit/category tags/opening hours)
- Manual settings change impact (showroom page config/template selection -> customer showroom page)
- Manual voice input trong settings text fields + fallback unsupported/permission denied
- Manual reset/change password flow regression check
- Lint/typecheck settings module

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 016 |- [x] 016 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 016
  - Task file: docs/tasks/016_settings_users_roles_general.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
