# Task 068 - Lịch chuyên gia Makeup + màu cảnh báo ngày trùng lịch

## Input ban đầu
- Chuyên gia makeup cần tài khoản để xem lịch cá nhân.
- Staff/admin cần nhìn lịch makeup theo calendar có cảnh báo trực quan cho ngày trùng lịch.
- Đã có conflict flag từ task booking, cần render rõ bằng màu cảnh báo.

## Mục tiêu
- Cung cấp màn hình `My Schedule` cho role `makeup_artist`.
- Hoàn thiện board/calendar makeup cho staff/admin với color semantics cho conflict day.
- Chuẩn hóa i18n/copy/status label cho module makeup.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
- `docs/tasks/063_global_status_localization_across_all_screens.md`

## Mapping màn hình/source
- Routes:
  - `apps/web/src/app/[locale]/makeup/page.tsx` (new)
  - `apps/web/src/app/[locale]/makeup/my-schedule/page.tsx` (new)
- Feature:
  - `apps/web/src/features/makeup/components/MakeupCalendarPage.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupMySchedulePage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupCalendarPage.ts` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupMySchedulePage.ts` (new)
- App shell/nav:
  - `apps/web/src/features/app-shell/**`
- i18n:
  - `apps/web/src/lib/languages/{vi,en}.ts`

## Quy tắc nghiệp vụ bắt buộc
- `makeup_artist`:
  - chỉ xem lịch cá nhân (không xem/sửa lịch người khác),
  - dữ liệu luôn bị filter theo `artistProfileId = currentUser`.
- Staff/admin/manager:
  - xem board theo branch, lọc theo chuyên gia/ngày/trạng thái.
- Color warning semantics:
  - ngày có >= 1 event `isConflictWarning=true` hiển thị màu cảnh báo (amber/orange).
  - event conflict có badge/icon warning rõ ràng.
- Màu cảnh báo không thay thế trạng thái nghiệp vụ (chỉ là visual alert).

## In-scope
- Tạo route + page cho makeup board và my-schedule.
- Wire RBAC + route guard đúng role.
- Render calendar màu cảnh báo ngày trùng lịch.
- Bổ sung localization cho labels/status/warnings module makeup.

## Out-of-scope
- Drag-drop scheduler phức tạp.
- Realtime collaboration đa user cho calendar makeup.
- Mobile app implementation cho module makeup.

## Prompt gợi ý cho Codex
```text
Mục tiêu: hoàn thiện UI lịch makeup cho staff/admin và my-schedule cho makeup_artist.

Yêu cầu:
1) Thêm route `/[locale]/makeup` và `/[locale]/makeup/my-schedule`.
2) Role makeup_artist chỉ xem lịch của chính mình.
3) Staff/admin xem calendar theo branch với filter cơ bản.
4) Ngày có conflict hiển thị màu cảnh báo + event có badge warning.
5) Hoàn thiện i18n vi/en cho makeup labels/status/warnings.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Makeup artist đăng nhập và xem được lịch cá nhân.
- Staff/admin xem được makeup calendar board theo branch.
- Ngày trùng lịch hiển thị màu cảnh báo đúng theo conflict flag.
- Event conflict có hiển thị warning badge rõ ràng.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Login role `makeup_artist`:
  - thấy route my-schedule,
  - không truy cập được board admin/staff nếu policy chặn.
- Login role `staff/admin`:
  - thấy board makeup,
  - lọc theo artist/ngày hoạt động.
- Ngày có event conflict:
  - cell ngày đổi màu cảnh báo,
  - event có badge warning.
- Switch locale vi/en, text warning/status không bị rơi key.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 068 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 067 /a - [ ] 068 | Makeup expert schedule + staff calendar board with conflict-day warning colors and role guards | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 068 |- [x] 068 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 068
  - Task file: docs/tasks/modules/makeup/003_makeup_expert_schedule_and_conflict_calendar_colors.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
