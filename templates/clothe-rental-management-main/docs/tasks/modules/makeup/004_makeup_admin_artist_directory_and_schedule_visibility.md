# Task 069 - Admin: danh sách chuyên viên makeup + lịch theo từng chuyên viên

## Input ban đầu
- Cần bổ sung khả năng để admin xem danh sách chuyên viên makeup theo branch.
- Từ danh sách chuyên viên, admin cần mở và xem lịch của từng chuyên viên.
- Lịch theo chuyên viên cần hiển thị được trạng thái conflict để hỗ trợ vận hành.

## Mục tiêu
- Tạo artist directory cho admin/manager trong module makeup.
- Chuẩn hóa luồng xem lịch theo chuyên viên (artist-centric schedule view).
- Giữ đúng RBAC và branch isolation như các task makeup nền tảng.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/modules/makeup/003_makeup_expert_schedule_and_conflict_calendar_colors.md`
- `docs/tasks/016_settings_users_roles_general.md`

## Mapping màn hình/source
- Routes:
  - `apps/web/src/app/[locale]/makeup/artists/page.tsx` (new)
  - `apps/web/src/app/[locale]/makeup/artists/[artistProfileId]/page.tsx` (new, optional nếu tách detail route)
- Feature:
  - `apps/web/src/features/makeup/components/MakeupArtistDirectoryPage.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupArtistSchedulePage.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupArtistDirectoryPage.ts` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupArtistSchedulePage.ts` (new)
  - `apps/web/src/features/makeup/queries/useMakeupQueries.ts`
- Backend:
  - `apps/web/src/server/data-access/makeup.ts`
  - `apps/web/src/server/services/makeupService.ts`
  - `apps/web/src/app/api/makeup/artists/route.ts` (new)
  - `apps/web/src/app/api/makeup/artists/[artistProfileId]/schedule/route.ts` (new)

## Quy tắc nghiệp vụ bắt buộc
- Chỉ `admin/manager/owner_admin` xem được artist directory.
- Danh sách chuyên viên luôn giới hạn theo branch context được phép.
- Admin có thể xem lịch theo từng chuyên viên theo filter ngày/tháng/trạng thái.
- Conflict trong lịch của chuyên viên phải được hiển thị rõ (badge/color warning như task 068).
- Nếu module makeup đang tắt thì route/API module makeup tuân theo policy disable hiện hành.

## In-scope
- API list chuyên viên makeup theo branch.
- API list lịch theo `artistProfileId` + date range.
- UI danh sách chuyên viên + drill-down lịch theo chuyên viên.
- Wire RBAC guard + nav visibility cho nhóm route mới.

## Out-of-scope
- Chỉnh sửa thông tin hồ sơ nhân sự chuyên viên từ module makeup.
- Tối ưu realtime/collaboration đa người dùng.
- Mobile app implementation.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm artist directory cho admin và xem lịch theo từng chuyên viên makeup.

Yêu cầu:
1) Tạo route/UI danh sách chuyên viên makeup theo branch.
2) Từ danh sách mở được lịch của từng chuyên viên (filter theo ngày/tháng/trạng thái).
3) Chỉ admin/manager/owner_admin truy cập được.
4) Hiển thị được conflict warning trên lịch của chuyên viên.
5) Giữ kiến trúc Component -> Hook -> Query -> Service -> API/Supabase.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Admin thấy được danh sách chuyên viên makeup theo branch.
- Admin mở được lịch của từng chuyên viên với filter cơ bản.
- RBAC/branch isolation đúng policy.
- Conflict warning hiển thị đúng trong artist schedule.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Login admin/manager:
  - vào `/[locale]/makeup/artists` thấy danh sách chuyên viên.
  - chọn từng chuyên viên xem lịch đúng dữ liệu branch.
- Login role khác không đủ quyền:
  - không truy cập được artist directory.
- Case có event conflict:
  - lịch chuyên viên hiển thị warning đúng semantics.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 069 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 068 /a - [ ] 069 | Makeup admin artist directory + per-artist schedule visibility with branch RBAC | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 069 |- [x] 069 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 069
  - Task file: docs/tasks/modules/makeup/004_makeup_admin_artist_directory_and_schedule_visibility.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
