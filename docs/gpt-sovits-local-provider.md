# GPT-SoVITS local provider cho KAI STUDIO

GPT-SoVITS được tích hợp như một provider local thử nghiệm để tạo voice-over bằng API local `/tts`. Source/model phải được tải và cài riêng từ [upstream GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS), ví dụ vào thư mục sibling `../GPT-SoVITS`; chúng không được bundle trong repo này.
Provider này mặc định **tắt** để tránh làm `npm run dev` khởi động nặng.

## 1. Bật/tắt provider

Vào:

```txt
Manage → Provider Manager
```

Bật `GPT-SoVITS Local Experimental` khi cần dùng. Sau khi bật/tắt, hãy restart app/dev server:

```bash
npm run dev
```

Cấu hình được lưu vào `.env` bằng key:

```env
KAI_PROVIDER_GPT_SOVITS_ENABLED=false
```

## 2. Cấu hình API

Vào:

```txt
Settings → Voice → GPT-SoVITS
```

Các biến chính:

```env
GPT_SOVITS_BASE_URL=http://127.0.0.1:9880
GPT_SOVITS_TTS_ENDPOINT=/tts
GPT_SOVITS_START_COMMAND=
GPT_SOVITS_REFERENCE_AUDIO=
GPT_SOVITS_PROMPT_TEXT=
GPT_SOVITS_TEXT_LANG=en
GPT_SOVITS_PROMPT_LANG=en
GPT_SOVITS_MEDIA_TYPE=wav
GPT_SOVITS_TEXT_SPLIT_METHOD=cut5
GPT_SOVITS_TIMEOUT_MS=300000
```

`GPT_SOVITS_START_COMMAND` nên trỏ tới file `.bat` hoặc command bạn dùng để chạy GPT-SoVITS API, ví dụ:

```env
GPT_SOVITS_START_COMMAND=C:/TOOLS/GPT-SoVITS/go-api.bat
```

Nếu để trống, KAI STUDIO sẽ không tự mở GPT-SoVITS, nhưng vẫn có thể gọi API nếu bạn đã tự chạy server bên ngoài.

## 3. Sử dụng trong Text to Speech

Vào:

```txt
Common tools → Text to Speech
```

Chọn provider:

```txt
GPT-SoVITS Experimental
```

Nên nhập đủ:

- Reference audio path: file giọng mẫu WAV/MP3.
- Prompt text: câu nói đúng với nội dung trong audio mẫu.
- Text language / Prompt language: `en`, `zh`, `ja`, `ko`, `yue`, hoặc `auto`.

## 4. Lưu ý tiếng Việt

GPT-SoVITS mạnh ở clone giọng/few-shot TTS, nhưng tiếng Việt chưa nên xem là provider chính thức ổn định.
Với voice tiếng Việt, ưu tiên VieNeu/Piper trước; dùng GPT-SoVITS như provider thử nghiệm hoặc để test clone giọng.

## 5. Luồng kỹ thuật

```txt
Frontend Text to Speech
  → /api/gpt-sovits/generate
  → backend gọi GPT_SOVITS_BASE_URL + GPT_SOVITS_TTS_ENDPOINT
  → lưu file vào generated/gpt-sovits/YYYY-MM-DD
  → trả audioUrl/relativePath về UI
```
