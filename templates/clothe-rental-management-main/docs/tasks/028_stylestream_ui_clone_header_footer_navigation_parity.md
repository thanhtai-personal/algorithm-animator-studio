# Task 028 - Stylestream UI Clone: Header + Footer + Navigation Parity

## Mục tiêu
- Clone đầy đủ layout/navigation của Stylestream cho cả admin và showroom: header, footer, sidebar/topbar, mobile drawer/overlay.
- Xóa các phần shell còn mang style cũ hoặc placeholder, thay bằng UI gần như 1:1 với template.
- Không thay đổi business logic/auth flow hiện có.

## Phụ thuộc
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`
- `docs/tasks/025_stylestream_ui_clone_showroom_listing_detail_shortlist.md`
- `docs/tasks/027_stylestream_ui_clone_calendar_auth_and_remaining_screens.md`

## Nguồn clone template
- `templates/stylestream-showcase-main/src/components/layouts/AdminLayout.tsx`
- `templates/stylestream-showcase-main/src/components/layouts/ShowroomLayout.tsx`
- `templates/stylestream-showcase-main/src/components/NavLink.tsx`
- `templates/stylestream-showcase-main/src/components/ShortlistButton.tsx`
- `templates/stylestream-showcase-main/src/components/ui/sidebar.tsx`
- `templates/stylestream-showcase-main/src/components/ui/sheet.tsx`

## Mapping màn hình/source
- Admin shell:
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx`
  - `apps/web/src/features/app-shell/hooks/useDashboardShell.ts`
  - `apps/web/src/app/[locale]/(dashboard)/layout.tsx`
- Showroom shell:
  - `apps/web/src/features/showroom/components/ShowroomShell.tsx`
  - `apps/web/src/features/showroom/hooks/useShowroomShell.ts`
  - `apps/web/src/app/[locale]/showroom/layout.tsx`

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone đầy đủ header/footer/navigation từ Stylestream template cho cả admin + showroom.

Yêu cầu:
1) Admin layout parity:
   - clone sidebar visual + active states + collapsed/mobile drawer behavior
   - clone topbar (title/breadcrumb/actions/profile/menu area)
2) Showroom layout parity:
   - clone sticky header, nav actions, shortlist badge, footer sections
   - mobile navigation behavior giống template (sheet/overlay/scroll lock)
3) Cross-layout consistency:
   - spacing, border, shadow, icon sizing, hover/active/disabled states đồng nhất
4) Constraints:
   - giữ nguyên locale routing, auth guard, role redirect, permissions gating
   - không thay query/service/API payload
5) UX:
   - fallback/loading/error của shell đồng bộ visual clone
   - đảm bảo readable trên mobile/tablet/desktop

Không đổi business policy, chỉ thay UI shell/navigation.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt mức độ parity header/footer:
  - strict (gần như pixel-close)
  - hoặc style-close (cho phép khác nhỏ do data thực tế).
- Chốt behavior cho admin footer:
  - giữ theo template
  - hay ẩn footer admin (nếu template không có).

## In-scope
- Header/footer/navigation của admin + showroom.
- Drawer/sheet/overlay interactions cho mobile.
- Visual cleanup cho route-level shell wrappers.

## Out-of-scope
- Chỉnh business logic trong từng module page.
- Thêm tính năng mới cho auth/showroom/order flows.

## Deliverables mong muốn
- Toàn bộ route admin/showroom dùng shell gần giống template.
- Không còn phần header/footer/nav mang style cũ.

## Done criteria (coding)
- `/{locale}/dashboard` và toàn bộ `/{locale}/*` admin routes hiển thị shell clone parity.
- `/{locale}/showroom*` có header/footer parity rõ ràng với template.
- Mobile drawer/menu hoạt động mượt, không vỡ layout.
- Không regression auth redirect và locale switch.

## Nhắc test nhanh
- Manual: admin routes + showroom routes trên desktop/mobile.
- Manual: toggle sidebar, mở mobile drawer, chuyển locale `vi/en`.
- Manual: role admin vs non-admin.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 028 |- [x] 028 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 028
  - Task file: docs/tasks/028_stylestream_ui_clone_header_footer_navigation_parity.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
