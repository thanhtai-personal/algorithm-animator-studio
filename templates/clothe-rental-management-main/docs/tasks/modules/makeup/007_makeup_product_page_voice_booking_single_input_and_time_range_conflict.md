# Task 072 - Product page đặt lịch makeup: single-input voice/text + parse câu + conflict theo khung giờ

## Input ban đầu
- Cần thêm trang/section đặt lịch makeup ngay trên product page.
- Người dùng chỉ được nhập **1 nguồn input duy nhất**: voice hoặc text.
- Input theo cấu trúc chuẩn:
  - `đặt lịch make up x người y giờ ngày z tên o sđt p`
- Hệ thống phải tự tách câu để lấy dữ liệu booking và tính thời gian:
  - `startTime` từ `y giờ ngày z`
  - `endTime = startTime + (x * 80 phút)`
- Cần kiểm tra trùng lịch và cảnh báo conflict.
- Chuyên viên có thể chỉnh sửa kết quả parse bằng form xác nhận trước khi lưu lịch.
- Cần thêm giao diện lịch makeup theo **calendar tháng**, mỗi ngày hiển thị danh sách booking theo thời gian đã đặt (tương tự trải nghiệm Google Calendar ở mức MVP).

## Mục tiêu
- Triển khai luồng đặt lịch makeup trên product page bằng voice/text single-input.
- Chuẩn hóa parser tiếng Việt theo câu lệnh booking.
- Chuyển từ conflict theo buổi sang conflict theo khung giờ thực tế (time range overlap).
- Bổ sung form xác nhận giúp chuyên viên sửa dữ liệu parse trước khi submit.
- Bổ sung màn hình/month-view calendar để quan sát booking theo ngày và khung giờ ngay trên UI makeup.

## Phụ thuộc
- `docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md`
- `docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
- `docs/tasks/modules/makeup/003_makeup_expert_schedule_and_conflict_calendar_colors.md`
- `docs/tasks/018_customer_showroom_page_public_catalog_preselect.md`
- `docs/tasks/063_global_status_localization_across_all_screens.md`

## Mapping màn hình/source
- Product page booking UI:
  - `apps/web/src/app/[locale]/product/page.tsx` (extend)
  - `apps/web/src/features/product-landing/**` (extend/new)
  - `apps/web/src/features/makeup/components/MakeupBookingVoiceInputSection.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupBookingConfirmForm.tsx` (new)
  - `apps/web/src/features/makeup/components/MakeupMonthlyCalendar.tsx` (new)
  - `apps/web/src/features/makeup/hooks/useMakeupProductBooking.ts` (new)
- Parser + booking API:
  - `apps/web/src/app/api/makeup/events/parse/route.ts` (new)
  - `apps/web/src/app/api/makeup/events/preview/route.ts` (optional new)
  - `apps/web/src/server/services/makeupService.ts` (extend)
  - `apps/web/src/server/data-access/makeupEvents.ts` (extend)
  - `apps/web/src/types/makeupModule.ts` (extend DTO/payload)
- Schema:
  - `apps/web/sql/030_makeup_event_time_range_and_voice_booking.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- Single input mode:
  - Chỉ cho phép 1 mode active tại 1 thời điểm: `VOICE` hoặc `TEXT`.
  - Khi đã có dữ liệu ở mode A, mode B bị khóa cho tới khi user xóa/reset.
- Cấu trúc parse chuẩn:
  - `đặt lịch make up x người y giờ ngày z tên o sđt p`
  - Parse tối thiểu được:
    - `guestCount = x`
    - `bookingDate = z`
    - `bookingTime = y`
    - `customerName = o`
    - `customerPhone = p`
- Thời lượng:
  - Mặc định `80 phút / người`.
  - `durationMinutes = guestCount * 80`.
  - `startTime` + `endTime` phải được trả về trong preview.
- Form xác nhận chuyên viên:
  - Có thể chỉnh sửa đầy đủ:
    - `x người`
    - `y giờ ngày z`
    - `startTime`
    - `endTime`
    - `customerPhone`
    - `customerName`
  - Có hướng dẫn nhập voice đúng format ở đầu form.
- Conflict warning:
  - Conflict khi khoảng `[startTime, endTime)` chồng lấn booking khác của cùng artist.
  - Giữ soft-warning + override tương tự Task 067.
- Monthly calendar UI:
  - Hiển thị theo tháng (`month view`) với navigation tháng trước/sau.
  - Mỗi ô ngày hiển thị danh sách booking theo format giờ, ví dụ `09:00-10:20`.
  - Booking conflict phải có visual warning (badge/màu) ngay trong ô ngày.
  - Giới hạn hiển thị số booking trong ô ngày (ví dụ top N) và có `+X more` để mở danh sách đầy đủ ngày đó.
- Branch isolation + RBAC:
  - Không tạo/sửa event ngoài branch được phép.
  - `makeup_artist` chỉ thao tác lịch của chính mình (hoặc auto gán artist = current user).

## In-scope
- UI booking voice/text trên product page.
- Voice transcript -> parser -> preview -> confirm form -> create event.
- UI monthly calendar hiển thị các booking đã đặt theo ngày/giờ.
- SQL mở rộng `makeup_events` để lưu khung giờ thực tế:
  - ví dụ: `guest_count`, `start_at`, `end_at`, `duration_minutes`.
- API conflict check theo overlap khung giờ.
- i18n vi/en cho:
  - hướng dẫn format voice
  - parse errors
  - conflict warnings
  - confirm form labels.

## Out-of-scope
- NLP tự do đa ngôn ngữ nâng cao (ngoài format chuẩn MVP).
- Tối ưu lịch theo nhiều chuyên viên đồng thời.
- Thanh toán online ở product page.
- Mobile app implementation.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm booking makeup trên product page với single-input (voice hoặc text), parse câu chuẩn và conflict theo khung giờ.

Yêu cầu:
1) Chỉ cho phép 1 input mode active: voice hoặc text.
2) Parse câu: "đặt lịch make up x người y giờ ngày z tên o sđt p" thành booking draft.
3) Tính start/end theo công thức 80 phút/người.
4) Kiểm tra conflict theo overlap thời gian, trả warning mềm + override.
5) Chuyên viên được chỉnh kết quả parse bằng form xác nhận trước khi lưu.
6) Thêm giao diện calendar tháng, mỗi ngày hiển thị các booking theo khung giờ (giống Google Calendar ở mức month view MVP).
7) Cập nhật schema/API/types/UI theo kiến trúc Component -> Hook -> Query -> Service -> API/Supabase.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Product page có section đặt lịch makeup bằng voice/text single-input.
- Parse thành công câu lệnh chuẩn thành booking draft.
- Tính đúng `startTime/endTime` theo `80 phút * số người`.
- Conflict theo time range hoạt động, có warning + override.
- Form xác nhận cho chuyên viên cho phép sửa đầy đủ trường trước khi lưu.
- Có calendar tháng hiển thị booking theo ngày/giờ, có warning rõ cho event conflict.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Voice mode:
  - nhập câu mẫu -> parse đủ field -> mở form xác nhận.
- Text mode:
  - khi text có dữ liệu thì voice bị khóa (và ngược lại).
- Duration:
  - 1 người = 80 phút, 2 người = 160 phút, kiểm tra endTime.
- Conflict:
  - case overlap -> warning ở preview/confirm.
  - confirm override -> lưu thành công và có cờ conflict.
- Calendar month view:
  - booking mới lưu xong xuất hiện đúng ngày đúng khung giờ trong ô lịch.
  - ngày có nhiều booking hiển thị `+X more` và mở được danh sách đầy đủ.
  - event conflict hiển thị style warning trong cell ngày.
- Verify branch/RBAC:
  - artist không tạo lịch cho artist khác.
  - không thể thao tác ngoài branch scope.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist module chưa có dòng 007 thì thêm mới:
  ~~~bash
  sed -i '/Modules\/Makeup\/006/a - [ ] Modules/Makeup/007 | Product page makeup booking: single-input voice/text parse + 80min per person + time-range conflict warning + confirm form + month-view calendar booking timeline | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/modules/makeup/tasks.md
  ~~~
- Đánh dấu checklist khi done:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Makeup/007 |- [x] Modules/Makeup/007 |" progress/modules/makeup/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/makeup/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Makeup/007
  - Task file: docs/tasks/modules/makeup/007_makeup_product_page_voice_booking_single_input_and_time_range_conflict.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
