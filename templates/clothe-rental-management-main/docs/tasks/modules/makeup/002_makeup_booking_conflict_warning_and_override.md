# Task 067 - Booking lịch Makeup: cảnh báo trùng lịch mềm + cho phép override lưu

## Input ban đầu
- Hệ thống cần cho customer/staff tạo lịch makeup.
- Khi cùng ngày/cùng buổi bị trùng lịch, phải cảnh báo nhưng vẫn cho lưu nếu xác nhận.
- Cần thống nhất contract warning để UI hiển thị rõ trước khi lưu lịch mới và vẫn giữ cả lịch củ, chỉ có cảnh báo trùng trên UI.

## Mục tiêu
- Triển khai đầy đủ booking flow makeup cho customer và staff.
- Có conflict detection cùng ngày/cùng buổi theo rule nghiệp vụ.
- Conflict là warning mềm: không block cứng, nhưng bắt buộc xác nhận để tạo lịch.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/008_customers_crm_module.md`
- `docs/tasks/014_calendar_module_reminders.md`

## Mapping màn hình/source
- Customer booking UI (new/extend):
  - `apps/web/src/features/product-landing/**` hoặc `apps/web/src/features/showroom/**` (tùy vị trí product team chốt)
- Staff booking board UI (new):
  - `apps/web/src/features/makeup/components/MakeupBookingBoard.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupBookingBoard.ts` (new)
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts` (new)
  - `apps/web/src/features/makeup/services/makeupClientService.ts` (new)
- Backend:
  - `apps/web/src/server/services/makeupService.ts`
  - `apps/web/src/server/data-access/makeup.ts`
  - `apps/web/src/app/api/makeup/events/route.ts`
  - `apps/web/src/app/api/makeup/events/conflicts/route.ts` (optional if tách endpoint)

## Quy tắc nghiệp vụ bắt buộc
- Booking makeup bắt buộc có:
  - `eventDate`,
  - `sessionSlot` (`MORNING`/`AFTERNOON`/`EVENING`),
  - `artistProfileId`,
  - customer context.
- Conflict warning rule (MVP):
  - trùng cùng ngày + cùng buổi + cùng chuyên gia,
  - trùng cùng ngày + cùng buổi + cùng khách.
- Soft warning flow:
  - API trả warning payload khi phát hiện conflict.
  - Người dùng có thể gửi lại với `confirmConflictOverride=true` để lưu.
- Vẫn phải giữ branch isolation + RBAC.

## In-scope
- Create/update booking API + UI cho customer/staff.
- Conflict detection + warning payload (kèm danh sách lịch xung đột tóm tắt).
- Override save flow có confirm rõ ràng.
- Persist cờ `isConflictWarning`/`conflictNote` vào record makeup event khi override.

## Out-of-scope
- Tối ưu thuật toán xung đột theo khung giờ chi tiết phút/giây.
- Payment cho dịch vụ makeup.
- Notification automation nâng cao cho makeup event.

## Prompt gợi ý cho Codex
```text
Mục tiêu: làm booking makeup có cảnh báo trùng lịch mềm và vẫn cho override save.

Yêu cầu:
1) Customer + staff tạo/sửa lịch makeup được.
2) Check conflict theo cùng ngày/cùng buổi cho artist/customer.
3) API trả warning rõ ràng khi conflict, không tự lưu ngay.
4) Có cơ chế confirmConflictOverride=true để vẫn lưu lịch.
5) Lịch override phải có cờ conflict để UI calendar dùng hiển thị màu cảnh báo.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Customer và staff tạo booking makeup thành công theo policy.
- Trường hợp trùng lịch cùng ngày/cùng buổi có warning rõ ràng.
- Người dùng xác nhận override vẫn lưu được lịch.
- Record conflict lưu được cờ để phục vụ calendar warning.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Case không conflict: tạo lịch thành công 1 lần submit.
- Case conflict artist:
  - submit lần 1 nhận warning,
  - submit xác nhận override thì lưu thành công.
- Case conflict customer cùng buổi:
  - warning đúng,
  - override lưu thành công.
- Verify module toggle off thì create/update vẫn bị chặn như Task 066.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 067 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 066 /a - [ ] 067 | Makeup booking flow: customer/staff create-edit with same-day/session conflict warning + override save | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 067 |- [x] 067 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 067
  - Task file: docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
