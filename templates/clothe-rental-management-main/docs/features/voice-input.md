# Voice Input (Web) - Mô tả hoạt động và chẩn đoán lỗi

## 1) Mục tiêu
- Cho phép nhập nhanh nội dung text vào `input/textarea` bằng giọng nói trên web.
- Reuse 1 primitive chung cho nhiều module (Products, Orders, Customers, Settings, Sales).
- Giữ UI nhất quán: icon mic nằm bên trong ô nhập liệu, trạng thái rõ ràng, không phá layout form.

## 2) Kiến trúc hiện tại
- `VoiceDictationField` (UI field wrapper):
  - File: `apps/web/src/components/voice/VoiceDictationField.tsx`
  - Nhiệm vụ: render input/textarea + nút mic + status hint.
  - Khi có transcript, append vào value hiện tại qua `onValueChange`.
- `VoiceInputButton` (nút mic):
  - File: `apps/web/src/components/voice/VoiceInputButton.tsx`
  - Nhiệm vụ: hiển thị icon theo state (`idle/listening/processing/error/unsupported`).
- `useVoiceDictationPrimitive` (core hook):
  - File: `apps/web/src/components/voice/hooks/useVoiceDictationPrimitive.ts`
  - Nhiệm vụ: quản lý session voice theo capability runtime:
    - ưu tiên `getUserMedia + MediaRecorder + backend transcription` cho iOS/WebKit,
    - chỉ dùng `SpeechRecognition/webkitSpeechRecognition` như fallback khi phù hợp.

## 2.1) Chiến lược runtime hiện tại
- Primary path cho iOS/WebKit:
  - xin quyền mic bằng `getUserMedia`
  - ghi audio bằng `MediaRecorder`
  - upload blob lên backend transcription route
  - nhận transcript rồi map về đúng field active
- Fallback path:
  - giữ `SpeechRecognition` cho runtime ngoài iOS khi browser speech API hoạt động ổn định hơn.
- Mục tiêu:
  - tránh phụ thuộc hoàn toàn vào browser speech API vốn không ổn định trên iOS, Chrome iOS và mini-app container.

## 3) Luồng hoạt động
1. User bấm icon mic trong `VoiceInputButton`.
2. `VoiceDictationField` gọi `start()` từ `useVoiceDictationPrimitive`.
3. Hook chọn runtime path theo capability:
   - recorder path cho iOS/WebKit hoặc runtime không có speech-recognition tin cậy,
   - speech-recognition fallback cho runtime còn lại.
4. Với recorder path:
   - ghi âm,
   - stop hoặc auto-stop,
   - gửi audio lên backend,
   - nhận transcript và đẩy vào `onResult`.
5. `VoiceDictationField` append transcript vào value hiện tại và cập nhật UI.

## 4) State machine
- `idle`: sẵn sàng ghi âm.
- `listening`: đang nghe microphone.
- `processing`: đang dừng/đang chờ commit transcript.
- `error`: lỗi nghiệp vụ kỹ thuật (network, no-speech, unknown...).
- `unsupported`: không hỗ trợ browser hoặc bị từ chối quyền mic.

## 5) Chẩn đoán lỗi đã gặp gần đây

### Triệu chứng
- Bấm mic, đọc xong nhưng text không xuất hiện trong input.
- UI hiện lỗi đỏ “Nhập giọng nói bị lỗi, vui lòng thử lại.”

### Nguyên nhân gốc (đã xác định)
1. `SpeechRecognition` không đáng tin cậy trên iOS/WebKit:
   - có runtime không expose API,
   - có runtime expose object nhưng không trả transcript ổn định.
2. Hook cũ phụ thuộc mạnh vào `result.isFinal`:
   - có browser vẫn có transcript nhưng không set `isFinal` như kỳ vọng ở event cuối.
   - kết quả: transcript bị rơi, không append vào input.

### Cách đã xử lý trong code
- Chuyển primary path sang recorder + backend transcription cho iOS/WebKit.
- Giữ `SpeechRecognition` làm fallback thay vì dependency bắt buộc.
- Abort session khi modal đóng/chuyển context để tránh stale callback.
- Hiển thị lỗi chi tiết (`error.message`) để debug chính xác hơn thay vì chỉ câu chung.

## 6) Bảng lỗi nhanh
- `permission-denied`:
  - Nguyên nhân: user chặn micro hoặc context không cho phép.
  - Hướng xử lý: bật quyền mic cho domain, reload trang.
- `no-speech`:
  - Nguyên nhân: không bắt được tiếng nói.
  - Hướng xử lý: nói rõ hơn/gần mic hơn, kiểm tra mic device.
- `network`:
  - Nguyên nhân: lỗi mạng khi nhận dạng.
  - Hướng xử lý: kiểm tra kết nối mạng/VPN/proxy.
- `unsupported`:
  - Nguyên nhân: browser không hỗ trợ Web Speech API.
  - Hướng xử lý: dùng Chrome/Edge mới.
- `aborted`:
  - Ý nghĩa: session bị dừng chủ động; hiện tại không còn xem là lỗi cứng.

## 7) Checklist debug khi phát sinh lỗi mới
1. Kiểm tra browser/runtime + version:
   - Safari iOS
   - Chrome iOS
   - Zalo Mini App iOS nếu có liên quan
2. Kiểm tra quyền mic của site (`Allow Microphone`).
3. Kiểm tra context có secure không (`window.isSecureContext`).
4. Nếu đang dùng recorder path, kiểm tra response của route transcription.
5. Nếu đang dùng speech-recognition fallback, theo dõi `event.error` trong `recognition.onerror`.
6. Kiểm tra status hint dưới field:
   - Nếu `unsupported`: focus quyền/browser.
   - Nếu `error`: đọc message chi tiết.
7. Test lại với câu ngắn trước, sau đó test câu dài.
8. Nếu vẫn lỗi, chụp:
   - status hint dưới input
   - console error
   - browser/version

## 8) Lưu ý tích hợp cho feature mới
- Không gọi trực tiếp Web Speech API, `getUserMedia`, hay `MediaRecorder` trong page/component feature.
- Luôn dùng `VoiceDictationField` để giữ behavior thống nhất.
- Khi modal đóng, nên set `active={false}` để `abort()` session voice và tránh callback trễ.
- Với field quan trọng, nên truyền `onDictationResult` để log/analytics (nếu cần) nhưng không thay đổi luồng append mặc định.
