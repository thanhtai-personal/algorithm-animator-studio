# Task 082 - Zalo Mini App clone màn hình đặt lịch makeup từ web product page

## Input ban đầu
- Source web đã có màn hình đặt lịch makeup trên product page:
  - `apps/web/src/features/makeup/components/MakeupBookingPage.tsx`
  - `apps/web/src/features/makeup/hooks/useMakeupProductBooking.ts`
- Cần đưa trải nghiệm này sang mini app `apps/zalo-mini-apps/kata-booking`.
- Mini app cần điều chỉnh UX theo môi trường Zalo Mini App:
  - ưu tiên thao tác nhanh trên mobile,
  - giảm phụ thuộc cloud-auth của web product page.

## Mục tiêu
- Clone giao diện/luồng booking makeup cốt lõi từ web sang mini app:
  - nhập lệnh booking dạng text,
  - parse câu lệnh,
  - xác nhận form,
  - tạo booking makeup.
- Điều chỉnh để phù hợp Zalo Mini App:
  - bỏ phụ thuộc component voice của web,
  - dùng branch mặc định qua env mini app,
  - xử lý conflict warning theo flow mini app.

## Phụ thuộc
- `docs/tasks/modules/makeup/007_makeup_product_page_voice_booking_single_input_and_time_range_conflict.md`
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`

## Mapping màn hình/source
- Source web tham chiếu:
  - `apps/web/src/features/makeup/components/MakeupBookingPage.tsx`
  - `apps/web/src/features/makeup/components/MakeupBookingConfirmForm.tsx`
  - `apps/web/src/features/makeup/components/MakeupMonthlyCalendar.tsx`
  - `apps/web/src/features/makeup/hooks/useMakeupProductBooking.ts`
- Target mini app:
  - `apps/zalo-mini-apps/kata-booking/src/features/makeup/**` (new)
  - `apps/zalo-mini-apps/kata-booking/src/App.tsx` (integrate section)
- Backend integration:
  - `apps/web/src/app/api/makeup/events/route.ts` (CORS for mini app)
  - `apps/web/src/app/api/makeup/events/parse/route.ts` (CORS for mini app)

## Quy tắc nghiệp vụ bắt buộc
- Giữ kiến trúc mini app:
  - `Component -> Hook -> Query -> Service -> API`.
- Parse booking phải dùng API parser hiện có:
  - `POST /api/makeup/events/parse`.
- Tạo booking mini app dùng public create flow:
  - `POST /api/makeup/events` với `requestAsPublic=true`.
- Conflict warning:
  - khi gặp `CONFLICT_WARNING_REQUIRED`, cho phép user xác nhận override và submit lại.
- Không đưa logic server-side makeup vào client.

## In-scope
- UI section booking makeup trong mini app.
- Hook/query/service/store cho booking makeup.
- CORS enable cho API parse/create để mini app gọi cross-origin hợp lệ.
- Cập nhật tài liệu mini app liên quan env/feature (nếu cần).

## Out-of-scope
- Port toàn bộ voice pipeline web (`VoiceDictationField`, speech primitives).
- Dashboard quản trị makeup cho mini app.
- Refactor lớn module makeup backend hiện tại.

## Prompt gợi ý cho Codex
```text
Mục tiêu: clone màn hình booking makeup từ web product page sang mini app kata-booking.

Yêu cầu:
1) Tạo feature makeup trong mini app theo flow Component -> Hook -> Query -> Service -> API.
2) Dùng parser API /api/makeup/events/parse để fill form booking.
3) Submit booking qua /api/makeup/events với requestAsPublic=true.
4) Xử lý conflict warning bằng confirm override submit lại.
5) Thêm CORS wrapper cho route parse/create để chạy được từ mini app origin.

Validation commands:
- cd apps/zalo-mini-apps/kata-booking && npm run lint
- cd apps/zalo-mini-apps/kata-booking && npm run typecheck
- cd apps/zalo-mini-apps/kata-booking && npm run build
- cd apps/web && npm run typecheck
```

## Done criteria (coding)
- Mini app có màn hình/section booking makeup hoạt động parse + submit.
- Có luồng confirm override khi conflict warning.
- API parse/create không lỗi CORS trong mini app flow local.
- `cd apps/zalo-mini-apps/kata-booking && npm run lint` pass.
- `cd apps/zalo-mini-apps/kata-booking && npm run typecheck` pass.
- `cd apps/zalo-mini-apps/kata-booking && npm run build` pass.

## Nhắc test nhanh
- Parse câu chuẩn tiếng Việt -> form được điền đúng.
- Submit booking hợp lệ -> tạo thành công, hiển thị trạng thái.
- Submit booking conflict -> hiện cảnh báo, confirm override -> lưu thành công.
- Thiếu branchId env -> hiện lỗi hướng dẫn cấu hình branch.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/006` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/006 |- [x] Modules/Zalo-Mini-App/006 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/006
  - Task file: docs/tasks/modules/zalo-mini-app/006_zalo_mini_app_makeup_booking_clone_from_web_product_page.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
