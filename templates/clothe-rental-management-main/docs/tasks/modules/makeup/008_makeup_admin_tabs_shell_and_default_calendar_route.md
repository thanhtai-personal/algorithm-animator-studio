# Task 082 - Admin Makeup tabs shell: điều hướng theo tab + mặc định mở Lịch makeup

## Input ban đầu
- Cần thêm tab menu cho admin module makeup để tách rõ từng nhóm màn hình.
- Tabs yêu cầu:
  - Tổng quan
  - Lịch makeup
  - Danh sách hàng makeup
  - Quản lý đơn makeup
- Yêu cầu UX:
  - Khi vào admin makeup, tab mặc định phải là **Lịch makeup**.

## Mục tiêu
- Xây shell điều hướng tab riêng cho module makeup trong dashboard.
- Chuẩn hóa route contract theo tab, hỗ trợ deep-link trực tiếp.
- Đảm bảo route mặc định của admin makeup mở tab Lịch makeup.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
- `docs/tasks/modules/makeup/007_makeup_product_page_voice_booking_single_input_and_time_range_conflict.md`

## Mapping màn hình/source
- Routes:
  - `apps/web/src/app/[locale]/(dashboard)/makeup/page.tsx` (redirect default)
  - `apps/web/src/app/[locale]/(dashboard)/makeup/overview/page.tsx` (new)
  - `apps/web/src/app/[locale]/(dashboard)/makeup/calendar/page.tsx` (new or reuse)
  - `apps/web/src/app/[locale]/(dashboard)/makeup/inventory/page.tsx` (new)
  - `apps/web/src/app/[locale]/(dashboard)/makeup/orders/page.tsx` (new)
- Shell:
  - `apps/web/src/app/[locale]/(dashboard)/makeup/layout.tsx` (extend)
  - `apps/web/src/features/makeup/components/MakeupAdminTabs.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupAdminTabs.ts` (new)
- i18n:
  - `apps/web/src/lib/languages/vi.ts`
  - `apps/web/src/lib/languages/en.ts`

## Quy tắc nghiệp vụ bắt buộc
- Default route:
  - `/[locale]/makeup` phải redirect về `/[locale]/makeup/calendar`.
- Active tab state:
  - Route nào thì tab đó active, không phụ thuộc local state tạm.
- RBAC:
  - Chỉ role được phép vào module makeup mới thấy tab.
  - Không làm thay đổi policy hiện tại của tab/module thuê đồ.
- Không phá link cũ:
  - Nếu đang có link cũ đến `/[locale]/makeup`, vẫn vào được và mở lịch.

## In-scope
- Tab shell UI + điều hướng route theo tab.
- Redirect default sang tab `calendar`.
- Bổ sung text i18n vi/en cho menu/tab.

## Out-of-scope
- Nghiệp vụ chi tiết của từng tab (được xử lý ở các task tiếp theo).
- Refactor lại toàn bộ dashboard shell ngoài phạm vi makeup.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tạo tab shell cho admin makeup với default tab là Lịch makeup.

Yêu cầu:
1) Tạo route/tab: overview, calendar, inventory, orders.
2) `/[locale]/makeup` redirect sang `/[locale]/makeup/calendar`.
3) Active tab bám theo pathname.
4) Không ảnh hưởng navigation/permission module thuê đồ.
5) Cập nhật i18n vi/en cho nhãn tab.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có tab menu admin makeup với đủ 4 tab.
- Route mặc định mở tab lịch makeup.
- Deep-link vào từng tab hoạt động đúng.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Truy cập `/vi/makeup` -> redirect sang `/vi/makeup/calendar`.
- Click từng tab -> route đúng, tab active đúng.
- Reload tại từng tab -> vẫn giữ đúng tab hiện tại.
- Verify menu/route module thuê đồ không thay đổi.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng `Modules/Makeup/008` thì thêm vào:
  - `progress/modules/makeup/tasks.md`
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/008 |- [x] Modules/Makeup/008 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/008
  - Task file: docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
