# Task 004 - Locale Routing + App Shell (Sidebar/Topbar)

## Mục tiêu
- Chuyển từ current routes (`/`, `/auth`) sang route structure có locale routing `/{locale}/...` cho cả:
  - khu dashboard admin
  - trang showroom khách (public/customer-facing)
- Giữ tương thích auth hiện có và không làm mất state khi đổi ngôn ngữ.

## Phụ thuộc
- `docs/tasks/003_auth_profiles_rbac_branching.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 5, 8.2, 9.1)
- `docs/001_wireframe.md` (Sections 0.3, 1, 2, 3)

## Hiện trạng cần lưu ý
- `I18nProvider` đang client-side, chưa có `/[locale]`
- Route `/` hiện là session panel test auth
- Wireframe app shell cần sidebar/topbar/locale switch/user menu/branch selector

## Prompt gợi ý cho Codex
```text
Mục tiêu: implement locale routing nền tảng cho dashboard admin + public showroom page, bám source base auth hiện tại.

Yêu cầu:
1) Tạo route structure mục tiêu:
   - app/[locale]/showroom/page.tsx (public showroom page placeholder)
   - app/[locale]/(dashboard)/dashboard/page.tsx
   - layout cho dashboard shell (sidebar + topbar)
2) Thiết kế redirect/compat:
   - root `/` -> redirect theo locale + strategy đã chốt (VD `/vi/showroom` hoặc `/vi/dashboard` nếu nội bộ-only)
   - `/auth` giữ hoạt động hiện tại; có thể bổ sung locale-aware redirect sau login
3) Locale handling:
   - hỗ trợ `vi`, `en` (MVP)
   - nhớ locale theo ưu tiên PRD (profiles.locale -> cookie -> fallback vi)
   - đổi locale không mất state form (client-side navigation strategy)
4) App shell UI tối thiểu:
   - sidebar nav đủ các module (placeholder page cũng được)
   - topbar có locale switch, user menu, branch selector placeholder
   - loading/error/offline banner placeholder
   - lưu ý: `/{locale}/showroom` là route public, không bắt buộc dùng dashboard shell
5) Bám kiến trúc: UI ở component, logic điều hướng/quyền ở hooks/util/query/service.
6) Không xóa các routes auth cũ (`/auth`, `/auth/callback`) cho đến khi cutover hoàn tất.
```

## Config cần chuẩn bị trước khi chạy task
- Danh sách locale MVP: `vi`, `en`
- Locale default hệ thống: `vi`
- Cookie name cho locale (ví dụ `locale`)
- Quyết định route auth target:
  - giữ `/auth` (khuyến nghị trước)
  - hoặc thêm `/{locale}/login` alias
- Root landing strategy:
  - public showroom (`/{locale}/showroom`) (khuyến nghị nếu có customer page trong MVP)
  - admin dashboard (`/{locale}/dashboard`) (nếu triển khai nội bộ trước)
- Danh sách nav items từ wireframe (Dashboard, Orders, Inventory, Products, Customers, Payments, Calendar, Reports, Settings)

## In-scope
- Locale route group + dashboard shell
- Placeholder route cho customer showroom page (`/{locale}/showroom`)
- Redirect strategy
- Locale switch + persistence (cookie/profile sync nền tảng)
- Placeholder pages/nav

## Out-of-scope
- Business UI đầy đủ từng module
- Full i18n catalog coverage (task 016)

## Deliverables mong muốn
- App shell chạy được với `/{locale}/dashboard`
- Sidebar/topbar skeleton
- Locale switch hoạt động vi/en
- Root redirect rõ ràng

## Done criteria (coding)
- `vi`/`en` route vào dashboard được
- Đổi locale không mất state form ở trang thử nghiệm (ít nhất 1 form)
- `/auth` và `/auth/callback` vẫn login được
- Không hard-code quyền trong component nav/action nếu đã có helper

## Nhắc test nhanh
- Manual: `/`, `/vi/dashboard`, `/en/dashboard`, `/auth`
- Manual: switch locale while typing in a simple form
- Lint/typecheck phạm vi app shell + i18n + routing


## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 004 |- [x] 004 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 004
  - Task file: docs/tasks/004_locale_routing_app_shell.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
