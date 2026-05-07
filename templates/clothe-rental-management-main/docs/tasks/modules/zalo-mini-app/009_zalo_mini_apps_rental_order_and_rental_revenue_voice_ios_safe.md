# Task 089 - Hai Zalo Mini Apps mới cho thuê đồ: staff tạo đơn thuê/bán + admin xem doanh thu thuê đồ, dùng voice input an toàn trên iOS

## Input ban đầu
- `kata-booking` là app đặt lịch makeup.
- `kata-calendar` là app xem lịch makeup.
- Cần tạo thêm 2 Zalo Mini Apps riêng cho module thuê đồ:
  - 1 app cho staff tạo đơn `RENTAL/SALE`,
  - 1 app cho admin xem doanh thu thuê đồ.
- Tất cả form input trong 2 app phải hỗ trợ voice input.
- Voice input phải hoạt động được trong môi trường iOS app của Zalo, không chỉ Android/Desktop.
- Module thuê đồ không được dính nghiệp vụ makeup, route makeup, DTO makeup, hay calendar makeup hiện có.
- Hệ thống hiện đã có business flow cho rental orders/sales/reports trên web và đã có module Zalo Mini App nền tảng; cần tái sử dụng tối đa thay vì copy logic.

## Mục tiêu
- Tạo 2 app mới trong `apps/zalo-mini-apps`:
  - `kata-rental-order` cho staff tạo đơn thuê/bán nhanh.
  - `kata-rental-revenue` cho admin/manager xem KPI doanh thu thuê đồ.
- Chuẩn hóa shared voice-input strategy cho Zalo Mini Apps theo hướng chịu được runtime iOS.
- Giữ chuẩn kiến trúc `Component -> Hook -> Query -> Service -> API/Supabase`.
- Không tạo thêm business rule riêng cho mini app; mini app chỉ là channel mới cho nghiệp vụ thuê đồ hiện có.
- Không import hoặc phụ thuộc vào feature makeup, service makeup, API makeup.

## Nghiên cứu nhanh và kết luận áp dụng
- Nền tảng chính thức của Zalo Mini App đã được module hiện tại chốt:
  - `zmp-cli`, `zmp-sdk`, `@zmp-ui/core`.
  - Tham khảo:
    - https://github.com/Zalo-MiniApp
    - https://mini.zalo.me/docs/
- Nguồn web platform chính thức cho voice trên iOS cho thấy:
  - `SpeechRecognition` của Web Speech API là `Limited availability`, không nên xem là đường chạy chính cho môi trường mobile container.
  - `getUserMedia()` chỉ hoạt động trong secure context và luôn cần user permission.
  - WebKit hỗ trợ Media Capture qua HTTPS trên iOS/Safari và MediaRecorder đã có support từ iOS 14.3 trở lên.
  - Tham khảo:
    - https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
    - https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    - https://webkit.org/blog/7726/announcing-webrtc-and-media-capture/
    - https://webkit.org/blog/11353/mediarecorder-api/

Kết luận áp dụng:
- Không dùng `window.SpeechRecognition` / `webkitSpeechRecognition` làm đường chính cho Zalo Mini App iOS.
- Đường chính cho voice input phải là:
  - `navigator.mediaDevices.getUserMedia({ audio: true })`
  - ghi âm bằng `MediaRecorder`
  - upload/stream audio lên backend để transcribe
  - trả transcript về form hiện tại
- `SpeechRecognition` chỉ được dùng như progressive enhancement khi runtime thực tế có hỗ trợ rõ ràng.
- Vì iOS container có thể khác browser Safari thuần, task bắt buộc phải có test thật trong Zalo iOS runtime trước khi bật production.
- Suy luận kỹ thuật:
  - xem Zalo Mini App trên iOS như một constrained web container; mọi giả định về microphone API đều phải được verify trên device thật.

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`
- `docs/tasks/modules/zalo-mini-app/003_zalo_mini_app_catalog_order_draft_and_oa_support.md`
- `docs/tasks/modules/zalo-mini-app/005_zalo_mini_app_webhook_security_monitoring_and_release.md`
- `docs/tasks/modules/zalo-mini-app/007_zalo_mini_apps_ios_view_overflow_and_modal_close_safe_area.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/015_reports_module.md`
- `docs/tasks/052_revenue_debt_unified_calculation_dashboard_reports.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`

## Mapping màn hình/source
- New mini apps:
  - `apps/zalo-mini-apps/kata-rental-order/**` (new)
  - `apps/zalo-mini-apps/kata-rental-revenue/**` (new)
- Shared voice foundation cho mini apps:
  - `apps/zalo-mini-apps/shared/voice/**` (new, nếu tách dùng chung)
  - hoặc shared theo convention local:
    - `apps/zalo-mini-apps/kata-rental-order/src/lib/voice/**`
    - `apps/zalo-mini-apps/kata-rental-revenue/src/lib/voice/**`
- Order-entry app:
  - `apps/zalo-mini-apps/kata-rental-order/src/features/auth/**`
  - `apps/zalo-mini-apps/kata-rental-order/src/features/order-entry/**`
  - `apps/zalo-mini-apps/kata-rental-order/src/features/platform/**`
  - `apps/zalo-mini-apps/kata-rental-order/src/features/voice/**`
- Admin-revenue app:
  - `apps/zalo-mini-apps/kata-rental-revenue/src/features/auth/**`
  - `apps/zalo-mini-apps/kata-rental-revenue/src/features/revenue/**`
  - `apps/zalo-mini-apps/kata-rental-revenue/src/features/platform/**`
  - `apps/zalo-mini-apps/kata-rental-revenue/src/features/voice/**`
- Backend/API facade cho mini app:
  - `apps/web/src/app/api/zalo-mini-app/orders/create/route.ts` (new)
  - `apps/web/src/app/api/zalo-mini-app/orders/preview/route.ts` (optional new)
  - `apps/web/src/app/api/zalo-mini-app/reports/rental-revenue/route.ts` (new)
  - `apps/web/src/app/api/zalo-mini-app/voice/transcriptions/route.ts` (new)
  - `apps/web/src/server/services/zaloMiniAppCommerceService.ts` (extend)
  - `apps/web/src/server/services/zaloMiniAppReportsService.ts` (new)
  - `apps/web/src/server/services/zaloMiniAppVoiceService.ts` (new)
  - `apps/web/src/server/data-access/orders.ts` (reuse)
  - `apps/web/src/server/data-access/reports.ts` (reuse)
- Docs/runbook:
  - `docs/guides/zalo_mini_apps_rental_order_and_rental_revenue.md` (new)
  - `docs/guides/zalo_mini_apps_voice_input_ios_strategy.md` (new)

## Quy tắc kỹ thuật bắt buộc
- App boundary:
  - 2 mini app phải tách riêng app config, appId, release channel, runtime env.
  - Không nhồi cả 2 role vào 1 app rồi dùng chỉ điều hướng bằng menu.
  - Không tái dùng `kata-booking` hoặc `kata-calendar` cho module thuê đồ.
- Kiến trúc:
  - Giữ flow `Component -> Hook -> Query -> Service -> API/Supabase`.
  - UI render từ store; không render trực tiếp từ query result.
  - Không gọi trực tiếp Supabase từ component mini app cho nghiệp vụ chính.
- Order-entry app:
  - Chỉ hỗ trợ `RENTAL` và `SALE`.
  - Phải dùng contract tạo đơn hiện có của hệ thống; không sinh ra formula riêng cho cọc/giá/discount/payment.
  - Nếu có payment/deposit trong flow tạo đơn, phải giữ bước confirm/receipt, không bypass vì voice input.
  - Draft form phải persist local đủ để app background hoặc reload nhẹ không làm mất dữ liệu đang nhập.
- Admin-revenue app:
  - Chỉ hiển thị dữ liệu read-only cho KPI/chart/table tóm tắt của module thuê đồ.
  - Công thức revenue/profit/debt phải dùng source-of-truth hiện có từ `reports/dashboard` của rental module, không tạo query tính số riêng ở client mini app.
  - Filter branch/date range/granularity phải enforce ở server, không tin client.
- Rental boundary:
  - Không hiển thị doanh thu makeup trong app `kata-rental-revenue`.
  - Không gọi API `makeup/*`, không reuse types `makeupModule`, không render calendar makeup.
  - Không import component/hook/store từ `apps/zalo-mini-apps/kata-booking` hoặc `apps/zalo-mini-apps/kata-calendar`.
- Voice input:
  - Mọi form có ô nhập phải có phương án voice input hoặc fallback manual rõ ràng.
  - Với field text/search/note:
    - transcript có thể điền trực tiếp vào field đang active.
  - Với field số/tiền/ngày/giờ/phone:
    - transcript chỉ được đưa vào dạng suggestion/parsed draft,
    - user phải review/chỉnh lại trước khi commit.
  - Không tự submit form.
  - Không tự confirm action phá hủy/thu tiền/chốt đơn chỉ vì có transcript.
  - Chỉ cập nhật field đang focus/chọn; không ghi đè field khác.
  - Đường chính iOS phải dùng microphone capture + backend transcription, không dựa vào Web Speech API.
  - Khi modal/sheet/form đóng hoặc app background:
    - phải `abort()`/stop session ghi âm,
    - phải chặn stale async transcript quay lại sửa UI đã đóng/reset.
  - Với form xác nhận dài sau parse voice:
    - phải scroll được,
    - nút submit luôn nhìn thấy/tiếp cận được trên viewport iPhone.
- Platform/iOS:
  - Bắt buộc chạy trên HTTPS/secure context đối với môi trường dùng microphone.
  - Safe-area và vùng tap phải bám rule iOS/Zalo container đã chốt ở task 007.
  - Nếu runtime iOS không cấp microphone hoặc MediaRecorder bị chặn:
    - app phải xuống fallback nhập tay hoàn chỉnh,
    - không được để form unusable.
- Auth/RBAC:
  - `kata-rental-order`: `staff`, `manager`, `admin`, `owner_admin`.
  - `kata-rental-revenue`: `manager`, `admin`, `owner_admin`, `accountant` (nếu role này đã bật).
  - Tất cả data phải tiếp tục branch-scoped ở server.

## In-scope
- Bootstrap 2 Zalo Mini Apps mới theo stack chính thức.
- Auth/session + platform gate cho từng app.
- Order-entry MVP:
  - tạo đơn `RENTAL/SALE`,
  - chọn khách,
  - chọn item/sản phẩm,
  - nhập date/time/price/deposit/note,
  - xác nhận tạo đơn.
- Admin-revenue MVP:
  - KPI doanh thu thuê đồ,
  - chart day/month/year,
  - filter branch/date,
  - danh sách/tóm tắt doanh thu theo source hiện có của rental module.
- Shared voice capture/transcription strategy cho 2 mini apps.
- API facade/RBAC/CORS/DTO cho 2 app.
- Tài liệu runbook + checklist QA iOS.

## Out-of-scope
- Refactor lớn toàn bộ orders/reports module web.
- Triển khai online payment đầy đủ trong Zalo Mini App.
- Full offline sync queue ngang mức native app hiện tại.
- Calendar/makeup/admin module khác ngoài revenue scope.
- Voice command tự động thao tác đa field hoặc auto-submit end-to-end.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tạo 2 Zalo Mini Apps mới cho KATA:
1) app staff tạo đơn RENTAL/SALE cho thuê đồ,
2) app admin xem thống kê doanh thu thuê đồ,
và tất cả form input phải dùng được voice input trên iOS Zalo runtime.

Yêu cầu:
1) Tạo `apps/zalo-mini-apps/kata-rental-order` và `apps/zalo-mini-apps/kata-rental-revenue`.
2) Giữ kiến trúc Component -> Hook -> Query -> Service -> API, không duplicate business logic từ web.
3) Order app chỉ dùng contract rental orders/payments hiện có; revenue app chỉ đọc source-of-truth rental revenue từ reports/dashboard hiện có.
4) Không import hoặc phụ thuộc vào bất kỳ feature makeup nào; đây là module thuê đồ độc lập.
5) Thiết kế shared voice pipeline cho mini app:
   - primary path = getUserMedia + MediaRecorder + backend transcription,
   - SpeechRecognition chỉ là progressive enhancement,
   - abort session khi modal đóng/app background,
   - không auto-submit hoặc auto-confirm.
6) Với field số/ngày/giờ/phone, transcript phải qua bước review/confirm trước khi commit.
7) Thêm guard iOS safe-area + runtime fallback khi mic bị chặn.

Validation commands:
- cd apps/zalo-mini-apps/kata-rental-order && npm run lint
- cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck
- cd apps/zalo-mini-apps/kata-rental-order && npm run build
- cd apps/zalo-mini-apps/kata-rental-revenue && npm run lint
- cd apps/zalo-mini-apps/kata-rental-revenue && npm run typecheck
- cd apps/zalo-mini-apps/kata-rental-revenue && npm run build
- cd apps/web && npm run typecheck
```

## Done criteria (coding)
- Có 2 mini apps mới boot được độc lập trong `apps/zalo-mini-apps`.
- `kata-rental-order` tạo được đơn `RENTAL/SALE` theo contract hệ thống hiện có.
- `kata-rental-revenue` hiển thị đúng KPI/chart revenue của thuê đồ theo source hiện có.
- Voice input hoạt động ở cả 2 app với:
  - text/note/search fields,
  - structured review flow cho amount/date/time/phone.
- Đóng modal/chuyển màn/app background không để transcript trễ ghi đè form đã reset.
- Runtime iOS Zalo:
  - xin quyền mic được,
  - bắt đầu/dừng ghi âm được,
  - transcript trả về đúng field active,
  - permission denied vẫn nhập tay được.
- Không có component nào gọi trực tiếp Zalo SDK hoặc service backend vượt tầng kiến trúc.
- Lint/typecheck/build cho 2 mini apps pass.

## Nhắc test nhanh
- Order-entry:
  - tạo 1 đơn `RENTAL`,
  - tạo 1 đơn `SALE`,
  - verify payment/deposit confirm path không bị bypass.
- Revenue app:
  - đổi filter ngày/tháng/năm,
  - đổi branch,
  - đối chiếu KPI và chart với report web rental cùng filter.
- Voice:
  - field note/text/search điền trực tiếp đúng field đang active.
  - field amount/date/time/phone mở đúng bước review trước khi commit.
  - đang ghi âm mà đóng modal/sheet -> session bị abort, không có transcript trễ quay lại.
  - deny microphone permission -> fallback nhập tay vẫn dùng được.
- iOS runtime:
  - test trên Zalo iOS app thật, ưu tiên iPhone có notch (ví dụ iPhone 13),
  - verify safe-area, nút đóng modal, scroll form dài, nút submit cuối form.
- Security/RBAC:
  - staff không vào được app revenue.
  - role không hợp lệ không tạo đơn/xem dữ liệu ngoài branch.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/009` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/009 |- [x] Modules/Zalo-Mini-App/009 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/009
  - Task file: docs/tasks/modules/zalo-mini-app/009_zalo_mini_apps_rental_order_and_rental_revenue_voice_ios_safe.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
