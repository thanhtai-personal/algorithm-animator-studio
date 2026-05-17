# Public Web build cho Kata Studio / piper-react

Bản public web dùng cho hosting thường như Vercel/Netlify/static host, không yêu cầu VPS riêng và không cần backend local chạy kèm.

## Build

```cmd
npm run build:public
```

Output chính nằm ở:

```txt
build/client
```

Có thể preview local:

```cmd
npm run preview:public
```

## Nguyên tắc engine

Bản public web không thay thế bản desktop/local. App dùng mô hình chọn công cụ theo khả năng có sẵn:

- Desktop/local:
  - Piper local nếu backend + model có sẵn.
  - ElevenLabs PRO nếu có API key qua backend.
  - FFmpeg local nếu backend + FFmpeg có sẵn.
  - Browser TTS và Browser Recorder vẫn có thể dùng nếu trình duyệt hỗ trợ.

- Public web:
  - Browser TTS dùng Web Speech API của trình duyệt.
  - Browser Recorder dùng canvas.captureStream + MediaRecorder.
  - Resources dùng IndexedDB trong chính trình duyệt.
  - Không dùng app-server cloud để lưu file.
  - Không thể mở thư mục máy tính vì trình duyệt không có quyền file-system trực tiếp.

## Lưu ý Browser TTS

Browser TTS đọc text trực tiếp bằng giọng có sẵn trên thiết bị/trình duyệt. Trình duyệt không xuất luồng WAV/MP3 của SpeechSynthesis, nên Browser TTS không tạo file audio để ghép video.

Muốn tạo video public-web có tiếng đọc, hãy upload audio sẵn vào Video Studio.

## Lưu ý Browser Recorder

Browser Recorder xuất video bằng MediaRecorder. Tùy trình duyệt, định dạng thường là WebM. Nếu cần MP4 chuẩn YouTube hoặc xử lý phức tạp hơn, dùng bản desktop/local với FFmpeg.

## Resources public web

Video tạo bằng Browser Recorder được lưu vào IndexedDB của trình duyệt hiện tại và hiển thị trong màn hình Resources. Dữ liệu này là local theo từng browser/device, không đồng bộ cloud.
