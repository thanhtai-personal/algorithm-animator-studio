# Task 074 - Sửa voice input toàn hệ thống cho iOS/WebKit: web + Chrome iOS + Zalo Mini Apps

## Input ban đầu
- Voice input hiện tại chưa dùng được ổn định trên iOS:
  - Safari iOS,
  - Chrome iOS,
  - Zalo Mini Apps trên iOS.
- Shared primitive hiện tại của web đang dựa vào `SpeechRecognition` / `webkitSpeechRecognition`.
- Một phần mini app hiện cũng đang đi theo cùng hướng hoặc chưa có pipeline voice production-ready.
- Hệ quả:
  - bấm mic không ghi được,
  - transcript không trả về,
  - permission/runtime behavior lệch nhau giữa browser thường và container mini app,
  - các form đang có nút voice nhưng không usable thực tế trên iPhone/iPad.

## Mục tiêu
- Sửa gốc rễ voice input trên toàn hệ thống frontend web-based:
  - web dashboard/admin/public flows,
  - Zalo Mini Apps hiện có,
  - Zalo Mini Apps sẽ làm tiếp sau này.
- Thay shared voice strategy hiện tại bằng kiến trúc tương thích iOS/WebKit hơn.
- Chuẩn hóa behavior:
  - xin quyền mic,
  - start/stop/abort,
  - trả transcript,
  - fallback khi unsupported/permission denied,
  - không để stale async transcript ghi đè UI đã đóng.
- Giữ nguyên nguyên tắc sản phẩm:
  - voice chỉ hỗ trợ nhập liệu,
  - không tự submit,
  - không tự confirm action phá hủy/thu tiền/chốt đơn.

## Nghiên cứu nhanh và kết luận áp dụng
- `SpeechRecognition` của Web Speech API là `Limited availability`, không nên là đường chạy chính cho iOS/WebKit.
- `getUserMedia()` là API microphone nền tảng, nhưng chỉ dùng được trong secure context và cần user permission.
- WebKit hỗ trợ media capture qua HTTPS; `MediaRecorder` là hướng khả thi hơn cho iOS web/container so với phụ thuộc trực tiếp vào speech-recognition của browser.

Tham khảo:
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- https://webkit.org/blog/7726/announcing-webrtc-and-media-capture/
- https://webkit.org/blog/11353/mediarecorder-api/

Kết luận áp dụng:
- Không dùng `SpeechRecognition` / `webkitSpeechRecognition` làm primary path nữa.
- Shared voice primitive mới phải ưu tiên:
  - `navigator.mediaDevices.getUserMedia({ audio: true })`
  - `MediaRecorder`
  - upload/stream audio lên backend transcription endpoint
  - nhận transcript rồi map về field đang active
- `SpeechRecognition` chỉ được giữ như progressive enhancement hoặc desktop fallback nếu team thấy còn giá trị.
- Suy luận kỹ thuật:
  - vì Chrome iOS và Zalo iOS runtime đều nằm trên nền WebKit/container iOS, lỗi hiện tại nên được xử lý như một incompatibility ở shared strategy, không phải bug riêng từng màn hình.

## Phụ thuộc
- `docs/tasks/005_shared_ui_and_domain_primitives.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/036_bugs_admin_products_page.md`
- `docs/tasks/modules/zalo-mini-app/007_zalo_mini_apps_ios_view_overflow_and_modal_close_safe_area.md`
- `docs/tasks/modules/zalo-mini-app/009_zalo_mini_apps_rental_order_and_rental_revenue_voice_ios_safe.md`
- `docs/features/voice-input.md`

## Mapping màn hình/source
- Web shared primitive hiện tại:
  - `apps/web/src/components/voice/VoiceDictationField.tsx`
  - `apps/web/src/components/voice/VoiceInputButton.tsx`
  - `apps/web/src/components/voice/hooks/useVoiceDictationPrimitive.ts`
  - `apps/web/src/types/voiceDictation.ts`
- Các consumer web hiện có:
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.tsx`
  - `apps/web/src/features/orders/views/OrderDetailPage/OrderDetailPage.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx`
  - `apps/web/src/features/inventory/views/InventoryDetailPage/InventoryDetailPage.tsx`
  - `apps/web/src/features/settings/views/SettingsShowroomPagesPage/SettingsShowroomPagesPage.tsx`
  - `apps/web/src/features/makeup/components/MakeupBookingConfirmForm.tsx`
  - `apps/web/src/features/makeup/components/MakeupBookingVoiceInputSection.tsx`
- Mini app voice hiện có:
  - `apps/zalo-mini-apps/kata-booking/src/lib/voice/useVoiceDictationPrimitive.ts`
  - `apps/zalo-mini-apps/kata-booking/src/lib/voice/types.ts`
  - `apps/zalo-mini-apps/kata-booking/src/components/voice/VoiceInputButton.tsx`
- Backend/API mới hoặc mở rộng:
  - `apps/web/src/app/api/voice/transcriptions/route.ts` (new)
  - `apps/web/src/app/api/zalo-mini-app/voice/transcriptions/route.ts` (new/align nếu cần mini-app-specific policy)
  - `apps/web/src/server/services/voiceTranscriptionService.ts` (new)
  - `apps/web/src/server/config/**` (nếu cần env/model/provider config)
- Tài liệu:
  - `docs/features/voice-input.md`
  - `docs/guides/voice_input_ios_webkit_strategy.md` (new)

## Quy tắc kỹ thuật bắt buộc
- Kiến trúc:
  - `Component -> Hook -> Query -> Service -> API`.
  - Component không trực tiếp gọi `getUserMedia`, `MediaRecorder`, hay browser voice API.
  - Browser/runtime integration phải bị cô lập trong shared service/hook.
- Shared strategy:
  - Primary path cho iOS/WebKit:
    - capture audio bằng microphone API,
    - gửi backend transcription,
    - trả transcript về field active.
  - Không assume `SpeechRecognition` khả dụng chỉ vì browser expose object.
  - Phải có feature detection theo capability thật:
    - secure context,
    - `navigator.mediaDevices`,
    - `MediaRecorder`,
    - permission / stream availability.
- UI/UX:
  - Mọi field dùng voice phải có fallback nhập tay đầy đủ.
  - Khi modal/drawer/sheet đóng:
    - phải stop/abort session ghi âm,
    - phải hủy request transcription pending nếu có thể,
    - tối thiểu phải ignore result cũ nếu context đã đổi.
  - Không để transcript từ field A chảy sang field B.
  - Với field số/amount/date/time/phone:
    - không auto-commit mù,
    - cho phép parse/suggest nhưng user phải review trước khi lưu nếu field đó đang nhạy cảm.
- Platform:
  - Web dashboard/public:
    - phải chạy được trên iPhone Safari và Chrome iOS.
  - Mini apps:
    - phải chạy được trong Zalo iOS runtime thật.
  - Runtime không có mic hoặc bị deny:
    - hiện state rõ ràng,
    - form vẫn usable bằng tay.
- Product invariants:
  - Không auto-submit.
  - Không auto-confirm destructive/payment actions.
  - Không phá validation business hiện có.
- Native mobile boundary:
  - `apps/mobile` đang dùng `expo-speech-recognition`; task này không thay voice stack native mobile.
  - Nếu backend transcription service dùng chung được thì chỉ coi là reusable backend capability, không refactor app native trong task này.

## In-scope
- Thiết kế lại shared voice input pipeline cho toàn bộ web-based surfaces.
- Tạo backend transcription route/service.
- Refactor shared voice primitives của web.
- Đồng bộ/port primitive tương thích iOS cho mini apps.
- Migrate các màn đang dùng `VoiceDictationField` hoặc primitive mini-app cũ sang strategy mới.
- Cập nhật docs và QA checklist iOS.

## Out-of-scope
- Refactor native mobile `apps/mobile` sang cùng UI primitive.
- AI command parsing đa ý định/phức tạp ngoài scope transcript.
- Tự động điền nhiều field cùng lúc không qua review.
- Thay đổi business flow của orders/payments/makeup ngoài phần voice integration.

## Prompt gợi ý cho Codex
```text
Mục tiêu: sửa voice input toàn hệ thống để dùng được trên iOS/WebKit, bao gồm web admin/public và Zalo Mini Apps.

Yêu cầu:
1) Audit shared voice input hiện tại đang phụ thuộc `SpeechRecognition` ở đâu.
2) Thay shared strategy bằng primary path `getUserMedia + MediaRecorder + backend transcription`.
3) Giữ component không gọi browser API trực tiếp; browser/runtime handling nằm trong service/hook dùng chung.
4) Web và mini apps phải dùng cùng contract state machine: idle/listening/processing/error/unsupported.
5) Khi modal đóng/app background/navigation đổi context, phải abort session và chặn stale transcript callback.
6) Permission denied / unsupported / insecure context phải có fallback manual rõ ràng.
7) Không auto-submit hoặc auto-confirm action vì voice input.
8) Giữ patch tập trung vào voice infrastructure + integration, không refactor lan sang business logic.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npm run lint
- cd apps/zalo-mini-apps/kata-booking && npm run lint
- cd apps/zalo-mini-apps/kata-booking && npm run typecheck
```

## Done criteria (coding)
- Voice input dùng được trên iPhone/iPad với web dashboard/public ở Safari iOS và Chrome iOS.
- Voice input dùng được trong Zalo Mini Apps iOS runtime ít nhất ở app hiện có đang có voice scope.
- Shared web primitive không còn phụ thuộc primary vào `SpeechRecognition`.
- Có backend transcription contract rõ ràng cho web/mini apps.
- Đóng modal/chuyển màn/background app không gây stale transcript hoặc reopen state sai.
- Permission denied / unsupported / insecure context đều có UX fallback rõ.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass.

## Nhắc test nhanh
- Web iOS:
  - test trên Safari iOS và Chrome iOS cùng 1 field note/text.
  - verify xin quyền mic, start, stop, transcript, retry.
- Mini app iOS:
  - test trong Zalo app thật trên iPhone.
  - verify stop/close modal không bị transcript trễ quay lại.
- Manual regression:
  - Orders create note/payment note.
  - Order detail incident/cancel/return notes.
  - Product entry / inventory / settings text fields.
  - Makeup booking fields đang dùng voice.
- Permission/error:
  - deny microphone.
  - insecure/non-supported runtime.
  - no speech / timeout / network failure.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 074 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 073 /a - [ ] 074 | System-wide voice input fix for iOS/WebKit across web + Chrome iOS + Zalo Mini Apps | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 074 |- [x] 074 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 074
  - Task file: docs/tasks/074_system_wide_voice_input_ios_webkit_compatibility.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
