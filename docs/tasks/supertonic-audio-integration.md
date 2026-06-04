# Supertonic Audio Integration

Supertonic được tích hợp như một TTS provider local cho KATA Studio. App không nhúng trực tiếp ONNX model vào frontend; frontend gọi backend Express, backend gọi `supertonic serve` qua HTTP.

## Cài Supertonic runtime

```bash
python -m pip install "supertonic[serve]"
supertonic serve --host 127.0.0.1 --port 7788 --cors http://localhost:3000
```

Lần chạy đầu Supertonic sẽ tự tải model từ Hugging Face nếu dùng Python SDK chính thức.

## Cấu hình `.env`

```env
SUPERTONIC_BASE_URL=http://127.0.0.1:7788
SUPERTONIC_MODEL=supertonic-3
SUPERTONIC_DEFAULT_VOICE=M1
SUPERTONIC_DEFAULT_LANG=en
SUPERTONIC_TOTAL_STEPS=8
```

## API nội bộ đã thêm

- `GET /api/supertonic/config`: kiểm tra server, health, danh sách voice/style.
- `POST /api/supertonic/generate`: tạo file voice-over, lưu vào `server/data/generated/supertonic/YYYY-MM-DD/`.

## Dùng trong Long Content Studio

Vào panel **Voice-over** và chọn:

```txt
Supertonic local · 44.1kHz WAV
```

Provider này phù hợp để tạo voice-over offline cho long video và tránh chi phí ElevenLabs trong giai đoạn sản xuất thử.
