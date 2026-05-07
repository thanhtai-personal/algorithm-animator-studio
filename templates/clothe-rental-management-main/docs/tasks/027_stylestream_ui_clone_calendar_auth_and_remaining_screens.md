# Task 027 - Stylestream UI Clone: Calendar + Auth + Remaining Screens

## Mục tiêu
- Hoàn thiện clone UI cho các màn hình source chưa có template 1:1 trực tiếp.
- Áp dụng design language Stylestream (tokens/layout/components/motion) cho `calendar`, `auth`, và các màn placeholder/fallback còn lại.
- Đảm bảo toàn bộ app có visual consistency sau batch clone.

## Phụ thuộc
- `docs/tasks/020_stylestream_ui_clone_foundation_and_shell.md`
- `docs/tasks/026_stylestream_ui_clone_visual_hardening_and_qa.md`

## Nguồn tham chiếu template
- `templates/stylestream-showcase-main/src/components/layouts/AdminLayout.tsx`
- `templates/stylestream-showcase-main/src/components/layouts/ShowroomLayout.tsx`
- `templates/stylestream-showcase-main/src/pages/admin/Dashboard.tsx` (card/table hierarchy reference)
- `templates/stylestream-showcase-main/src/pages/showroom/Listing.tsx` (hero/filter presentation reference)

## Mapping màn hình/source
- Calendar:
  - route: `apps/web/src/app/[locale]/(dashboard)/calendar/page.tsx`
  - component: `apps/web/src/features/calendar/components/CalendarPage.tsx`
- Auth:
  - route: `apps/web/src/app/auth/page.tsx`
  - components: `apps/web/src/features/auth/components/LoginScreen.tsx`, `apps/web/src/features/auth/components/auth-screen/*`
- Remaining placeholders/fallbacks:
  - `apps/web/src/app/[locale]/(dashboard)/[module]/page.tsx`
  - các empty/error/loading placeholders nếu còn hardcoded style cũ.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện clone UI cho các màn hình không có template direct mapping (calendar/auth/placeholder pages) theo design language Stylestream.

Yêu cầu:
1) Calendar UI:
   - clone theo ngôn ngữ card/table/chip/action của admin screens Stylestream
   - giữ nguyên logic event/filter/reminder hiện có
2) Auth UI:
   - áp dụng tokens/typography/spacing/motion từ Stylestream
   - giữ nguyên flow login/signup/reset/callback logic
3) Placeholder/fallback screens:
   - bỏ style debug/plain cũ, dùng shared style đồng nhất với shell
4) Consistency:
   - đảm bảo các route chưa có trong template vẫn nhìn "cùng một hệ" với các màn đã clone
5) Constraints:
   - không thay auth policy, không thay calendar business logic
   - không sửa API/SQL

Kết quả: toàn bộ screens trong source có visual consistency với Stylestream.
```

## Config cần chuẩn bị trước khi chạy task
- Chốt calendar visual baseline:
  - ưu tiên monthly grid prominence
  - hay ưu tiên event list readability.
- Chốt auth page style target:
  - minimal card-centered
  - hoặc split-layout có hero panel.

## In-scope
- Styling/composition cho calendar/auth/fallback pages.
- Cleanup placeholder UI không còn phù hợp release.

## Out-of-scope
- Tính năng calendar/auth mới.
- Thay đổi data flow/back-end policies.

## Deliverables mong muốn
- Calendar + Auth đồng bộ visual với Stylestream clone batch.
- Không còn màn hình "lạc theme" trong source.

## Done criteria (coding)
- Calendar page đạt style consistency với các admin modules.
- Auth page đạt style consistency và không đổi hành vi flow.
- Placeholder/fallback pages dùng style system mới.

## Nhắc test nhanh
- Manual: auth flows (sign in/sign up/reset + callback path).
- Manual: calendar month/week/day + reminders panel.
- Manual: mở các route fallback/placeholder còn tồn tại.
- `cd apps/web && npm run lint:mvp`
- `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \\[ \\] 027 |- [x] 027 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 027
  - Task file: docs/tasks/027_stylestream_ui_clone_calendar_auth_and_remaining_screens.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
