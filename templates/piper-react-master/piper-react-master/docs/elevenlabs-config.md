# ElevenLabs Config

ElevenLabs TTS chạy qua backend local. UI không lưu API key trong browser; backend đọc key từ `.env`.

## 1. Biến môi trường

Thêm vào `.env` ở root project:

```bash
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

ELEVENLABS_DEFAULT_VOICE_ID="21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_DEFAULT_VOICE_LABEL="Demo voice"
```

Nếu muốn nhiều voice trong dropdown, dùng JSON một dòng để tránh lỗi parser `.env`:

```bash
ELEVENLABS_VOICES='[{"id":"21m00Tcm4TlvDq8ikWAM","label":"Rachel"},{"id":"JBFqnCBsd6RMkjVDRZzb","label":"Demo voice"}]'
```

Khi có `ELEVENLABS_VOICES`, app ưu tiên danh sách này thay vì `ELEVENLABS_DEFAULT_VOICE_ID`.

## 2. File nghe thử cho các chế độ PRO

Nếu muốn modal confirm có audio nghe thử cho từng chế độ, cấu hình URL file MP3/WAV:

```bash
PRO_PREVIEW_FAST_URL="fast.mp3"
PRO_PREVIEW_BALANCED_URL="balanced.mp3"
PRO_PREVIEW_MULTILINGUAL_URL="multilingual.mp3"
PRO_PREVIEW_EXPRESSIVE_URL="expressive.mp3"
```

Với cấu hình trên, đặt file preview vào:

```text
server/generated/previews/fast.mp3
server/generated/previews/balanced.mp3
server/generated/previews/multilingual.mp3
server/generated/previews/expressive.mp3
```

Backend sẽ tự expose thành `http://localhost:5050/generated/previews/...`.

Ngoài tên file, cũng có thể dùng:

- full URL: `https://cdn.example.com/preview.mp3`
- đường dẫn backend: `/generated/previews/fast.mp3`

Nếu một chế độ không có biến preview, modal confirm sẽ không hiện audio nghe thử cho chế độ đó.

## 3. Lấy API key và voice ID

1. Đăng nhập ElevenLabs.
2. Vào profile/settings để tạo API key.
3. Chọn voice trong Voice Library hoặc My Voices.
4. Copy voice ID và đưa vào `.env`.
5. Restart backend sau khi sửa `.env`.

## 4. Giá hiển thị trong tool

Tool hiển thị giá trước khi generate trong modal xác nhận.

Theo ElevenLabs API pricing hiện tại:

- Flash / Turbo Text to Speech: `$0.05` mỗi 1,000 ký tự.
- Multilingual v2 / v3 Text to Speech: `$0.10` mỗi 1,000 ký tự.

App cũng hiển thị:

- số ký tự hiện tại,
- giới hạn ký tự của model,
- ước tính USD cho lượt generate,
- cảnh báo rằng giá chưa gồm thuế và có thể thay đổi theo plan, voice modifiers, hoặc pricing mới của ElevenLabs.

Nguồn chính thức:

- API pricing: https://elevenlabs.io/pricing/api
- TTS docs: https://elevenlabs.io/docs/overview/capabilities/text-to-speech
- API docs: https://elevenlabs.io/docs/api-reference/introduction
