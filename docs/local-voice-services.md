# Local voice services

Tài liệu này chỉ là trang điều hướng nhanh. Mỗi provider voice đã được tách thành tài liệu riêng để tránh trộn lẫn cài đặt, health check và troubleshooting của nhiều service.

## Piper local

- Tài liệu UI/runtime: `docs/tasks/voice-and-youtube-integration.md`
- Vai trò: tạo WAV local qua backend `/api/generate`.
- Không cần chạy service HTTP riêng nếu đã cấu hình `PIPER_EXE` và model `.onnx`.

## Supertonic local

- Tài liệu: `docs/tasks/supertonic-audio-integration.md`
- Vai trò: TTS server local HTTP.
- Lệnh chính:

```bat
npm run supertonic:install
npm run supertonic:serve
```

`npm run dev` đã gọi `npm run dev:supertonic`.

## Applio/RVC local

- Tài liệu provider: `docs/rvc-applio-local-voice-provider.md`
- Tài liệu template/API: `docs/applio-api-template-and-voice-text.md`
- Tài liệu train model: `docs/applio-rvc-model-training-guide.md`
- Vai trò: voice-to-voice hoặc Applio TTS qua Gradio API.

`npm run dev` đã gọi `npm run dev:applio`. Nếu `RVC_APPLIO_START_COMMAND` trống thì process Applio sẽ bỏ qua để không làm hỏng dev server.

## VieNeu-TTS local

- Tài liệu: `docs/vieneu-local-tts-provider.md`
- Source mặc định: `../VieNeu-TTS` (clone riêng từ upstream; không được bundle vào app repo)
- Python mặc định trên Windows: `../VieNeu-TTS/.venv/Scripts/python.exe`
- Lệnh chính:

```bat
npm run vieneu:install
npm run vieneu:health
npm run dev
```

`npm run vieneu:install` tạo môi trường Python riêng trong checkout VieNeu bên ngoài repo; `npm run vieneu:health` xác nhận SDK. Đặt `KAI_PROVIDER_VIENEU_ENABLED=true` và `VIENEU_AUTO_START=true` khi muốn bật. Mặc định provider này tắt để app không phụ thuộc vào VieNeu. Muốn mở UI Gradio thì đặt `VIENEU_START_MODE=gradio`.

## ElevenLabs

- Tài liệu UI/runtime: `docs/tasks/voice-and-youtube-integration.md`
- Vai trò: cloud TTS qua `ELEVENLABS_API_KEY`.
- Không có process local cần chạy trong `npm run dev`.
