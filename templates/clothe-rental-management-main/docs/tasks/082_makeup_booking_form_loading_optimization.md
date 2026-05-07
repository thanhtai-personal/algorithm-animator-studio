# Task 082 - Tối ưu loading cho trang đặt lịch makeup (`/[locale]/booking`) [P0]

## Mục tiêu
- Giảm thời gian chờ ở trang booking makeup, đặc biệt khi form có ít nội dung.
- Ưu tiên hiển thị form khả dụng sớm thay vì giữ trạng thái loading kéo dài.

## Token Context Guard
- Chỉ nạp task `082` + task cha `079` + file booking makeup đang sửa.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/079_performance_critical_web_pages_loading_latency_program.md`
- `docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md`
- `docs/tasks/074_system_wide_voice_input_ios_webkit_compatibility.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `apps/web/src/app/[locale]/booking/page.tsx`
- `apps/web/src/features/makeup/views/MakeupBookingPage/MakeupBookingPage.tsx`
- `apps/web/src/features/makeup/hooks/useMakeupProductBooking.ts`

## Architecture Impact
- Layers affected: booking page shell, makeup booking hook/query/service, showroom config query used trong booking header.
- Domain affected: `makeup booking`, `public branding`, `voice parse + confirm form`.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current:
  - Booking page có thể chờ nhiều dữ liệu (branding/config/header state) trước khi người dùng thao tác được.
  - Trang nhẹ nhưng cảm giác chậm do loading state chưa tách critical/non-critical.
- Target (Architecture V2):
  - Form nhập và nút thao tác xuất hiện sớm, kể cả khi dữ liệu phụ đang tải.
  - Voice/parse/enrichment chạy sau mà không khóa toàn bộ form.
  - Không để stale async parse làm UI trạng thái "đang tải" kéo dài.

## Boundary Rules
- Must keep:
  - `Component -> Hook -> Query -> Service -> API`.
  - Giữ invariants voice flow: đóng/cancel phải abort sạch native/session.
  - Giữ check module enable (`isMakeupModuleEnabled`) và auth/role constraints.
- Forbidden:
  - Bỏ validation conflict/date/branch chỉ để tăng tốc.
  - Để async parse cũ ghi đè state sau khi form đã reset/close.

## Compatibility & Migration Strategy (nếu có cutover)
- Compatibility window: không đổi API contract bắt buộc trong task này.
- Deprecation/removal plan: cleanup loading fallback cũ sau khi hoàn tất segmented loading mới.
- Rollback condition: rollback nếu tạo booking sai dữ liệu hoặc modal/form bị race condition.

## In-scope
- Tách loading cho:
  - dữ liệu critical để form usable,
  - dữ liệu phụ (branding/theme/shell enrich).
- Giảm remount không cần thiết ở booking page.
- Rà soát query `enabled`, `staleTime`, và điều kiện fetch để tránh fetch trùng.
- Tối ưu cảm nhận tải trên mobile (form ít nội dung phải usable sớm).

## Out-of-scope
- Đổi flow booking business.
- Đổi UI template/visual toàn trang.

## Done criteria (coding)
- Người dùng vào booking thấy form khả dụng nhanh, không phải chờ loading dài.
- Loading indicator còn lại phải theo từng phần nhỏ, không block toàn bộ trang.
- Không regression create booking + voice parse + close/reset behavior.
- Build/typecheck/lint pass hoặc ghi rõ lỗi baseline ngoài phạm vi.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (nếu có).
- [ ] Có rollback condition (nếu task thuộc migration/cutover).

## Regression Scope
- [ ] `/[locale]/booking` mở trang -> nhập form -> submit thành công.
- [ ] Voice input mở/đóng/cancel không để session treo.
- [ ] Không có stale parse result hồi sinh modal/form state đã đóng.
- [ ] Khi module makeup bị tắt vẫn `notFound()` đúng như hiện tại.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
