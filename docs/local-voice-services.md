# Cài TTS độc lập — Algorithm Animator Studio (OSS)

Tài liệu điều hướng nhanh. [README — Voice provider setup](../README.md#voice-provider-setup) có các lệnh chi tiết, cấu hình `.env` và địa chỉ kiểm tra từng engine. **`npm run dev` chỉ khởi chạy web và Node server**, không tự cài/khởi chạy toàn bộ TTS.

| Provider | Tải từ upstream | Khởi chạy và kết nối |
| --- | --- | --- |
| **Piper** | [OHF Piper](https://github.com/OHF-Voice/piper1-gpl) | Cài `piper-tts` hoặc binary tương thích với adapter; đặt `PIPER_EXE`, tải model riêng qua Settings → Voice hoặc `MODEL_DIR`. Không cần HTTP server |
| **Supertonic** | [Supertonic](https://github.com/supertone-oss-archive/supertonic), [Python HTTP service](https://github.com/supertone-oss-archive/supertonic-py) | Trong môi trường Python riêng chạy `npm run supertonic:install`, `npm run supertonic:serve`; `SUPERTONIC_BASE_URL=http://127.0.0.1:6688` |
| **VieNeu-TTS** | [VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS) | Clone bên ngoài repo (`../VieNeu-TTS`), chạy `npm run vieneu:install`, `npm run vieneu:health`; cấu hình `VIENEU_SOURCE_DIR` và `VIENEU_PYTHON`. Backend tạo giọng qua Python bridge khi được yêu cầu, không cần chạy Gradio |
| **GPT-SoVITS** | [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) | Cài riêng, chạy API của bản upstream; `GPT_SOVITS_BASE_URL` (thường port 9880). Có thể đặt `GPT_SOVITS_START_COMMAND` rồi dùng `npm run gpt-sovits:serve` |
| **RVC/Applio** | [Applio](https://github.com/IAHispano/Applio) | Cài/chạy Gradio riêng, cấu hình `RVC_APPLIO_BASE_URL`, `RVC_APPLIO_PYTHON` và API template trong [hướng dẫn Applio](rvc-applio-local-voice-provider.md); `npm run applio:install` chỉ cài `gradio_client` cho Python đang dùng |
| **ElevenLabs** | Dịch vụ thương mại, **không mã nguồn mở** | Không cần cài local. Đặt `ELEVENLABS_API_KEY` của chính bạn; không commit API key |

## Chạy ứng dụng mà không cài engine tùy chọn

```bash
npm ci
npm run dev
```

Truy cập `http://localhost:3000/text-to-speech` và `Settings → Voice / Health Check`. Trong `.env.example` và runtime defaults, các cờ `KAI_PROVIDER_*_ENABLED` của Supertonic, VieNeu, GPT-SoVITS và Applio mặc định là `false`; tiến trình startup cũng bỏ qua provider nếu không bật cờ. Chỉ bật provider đã cài và chỉ tải model/voice mà bạn có quyền sử dụng. Thiếu provider tùy chọn không được ngăn app thuật toán khởi động.

**Riêng VieNeu:** không còn chứa SDK/vendor, preset hoặc mẫu voice trong source. Để tắt hoàn toàn, giữ `KAI_PROVIDER_VIENEU_ENABLED=false`, `VIENEU_AUTO_START=false`. Để bật, clone riêng upstream vào thư mục sibling rồi làm theo [hướng dẫn VieNeu đầy đủ](vieneu-local-tts-provider.md). Nếu chọn Gradio, cấu hình `VIENEU_START_MODE=gradio` và chạy `npm run vieneu:serve` riêng; backend dùng bridge on-demand không bắt buộc Gradio.

`npm run dev:full` chỉ dành cho môi trường đã cài và cấu hình các provider; lệnh này có thể cố gắng gọi thêm tiến trình tùy chọn. Luôn kiểm tra giấy phép độc lập của model/voice/preset trước khi dùng thương mại hoặc phát hành lại: [kiểm toán tài nguyên TTS](oss/third-party-audit.md).

**Kiểm thử source:** `npm ci && npm run validate:oss`. Các bài test/command này chưa được xác nhận chạy thành công trên CI của nhánh cleanup.

## Licensing notes for a public build

The application adapter is part of the proposed MIT source. Independent engines/models have separate licenses: Piper runtime GPLv3, Supertonic runtime/sample code MIT but weights OpenRAIL-M, VieNeu SDK Apache-2.0 with non-commercial sample voices, and possible external voice-recording restrictions. Remotion itself is source-available under a non-OSI license. **Do not bundle downloaded engines, models, presets or recordings** without reviewing their exact terms; see [third-party notices](../THIRD_PARTY_NOTICES.md) and [release checklist](oss/RELEASE_CHECKLIST.md).
