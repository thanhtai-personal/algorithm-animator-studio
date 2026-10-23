# Cài và chạy TTS độc lập — Algorithm Animator Studio

README là hướng dẫn thao tác chính: [Voice provider setup](../README.md#voice-provider-setup). Cài engine/model bên ngoài repository và bật riêng provider bạn đã cài. `npm run dev` chỉ chạy frontend + Node backend; không tự tải model hoặc cài Python engine.

| Provider | Cài đặt và khởi chạy | Kiểm tra |
| --- | --- | --- |
| Piper | Cài `piper-tts` trong virtualenv ngoài repo; đặt `PIPER_EXE` và tải voice qua Settings → Voice. | `piper --help`, sau đó tạo audio trong UI. |
| Supertonic | Cài `supertonic[serve]` trong virtualenv ngoài repo, kích hoạt env rồi chạy `npm run supertonic:serve`. | `http://127.0.0.1:6688/v1/health`. |
| VieNeu-TTS (tùy chọn/experimental) | Clone upstream vào `../VieNeu-TTS`; chạy `npm run vieneu:install`; đặt `VIENEU_MODE=v3turbo`; chạy `npm run vieneu:health`. | CLI health rồi thử tạo WAV. Nếu health/generation lỗi, tắt provider; adapter chưa được xác nhận end-to-end. |
| GPT-SoVITS | Cài riêng theo upstream; chạy `python api_v2.py -a 127.0.0.1 -p 9880` bằng Python môi trường GPT-SoVITS. | `http://127.0.0.1:9880/docs`. |
| RVC/Applio | Cài và chạy `run-applio.bat`/`run-applio.sh` theo OS; cài `gradio_client` vào Python bridge. | Dùng URL/`api_name` hiện tại trong [API template guide](rvc-applio-local-voice-provider.md). |
| ElevenLabs | Hosted/proprietary, không phải open source; thêm API key riêng vào `.env`. | Settings → Voice / Health Check. |

## Lưu ý

- Chỉ cài provider bạn cần. Model weights, checkpoints, preset voice và recordings không được bundle trong source này.
- Supertonic upstream đã archive; model weights có điều kiện riêng. VieNeu v4 là proprietary theo upstream; hướng dẫn ở đây nhắm tới SDK open-source v3. VieNeu preset/sample assets có giấy phép riêng và không được sao chép vào repository. Xem [TTS asset audit](oss/third-party-audit.md).
- Cập nhật `.env` xong thì restart backend. Nếu provider chưa cài, để cờ `KAI_PROVIDER_*_ENABLED=false`.
- `npm run validate:oss` kiểm tra cấu trúc/test/build, nhưng CI của nhánh cleanup chưa chạy được đến các bước test. Các lệnh health ở trên là bước kiểm tra runtime riêng cho từng provider.
