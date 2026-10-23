# Supertonic Audio Integration

Supertonic được tích hợp như một TTS provider local cho KATA Studio. App không nhúng trực tiếp ONNX model vào frontend; frontend gọi backend Express, backend gọi `supertonic serve` qua HTTP.

## Cài Supertonic runtime

```bash
python -m pip install "supertonic[serve]"
supertonic serve --host 127.0.0.1 --port 6688 --cors http://localhost:3000
```

Hoặc chạy chung toàn bộ môi trường dev:

```bash
npm run dev
```

Lệnh `dev` sẽ khởi động đồng thời frontend, backend và Supertonic server.

Lần chạy đầu Supertonic sẽ tự tải model từ Hugging Face nếu dùng Python SDK chính thức.

## Cấu hình `.env`

```env
SUPERTONIC_BASE_URL=http://127.0.0.1:6688
SUPERTONIC_MODEL=supertonic-3
```

Default voice, language và total steps nằm trong `server/config/supertonicDefaults.ts`.

## Ngôn ngữ TTS

Supertonic không còn chọn ngôn ngữ riêng trong Settings. Khi tạo voice-over trong Long Content Studio, frontend lấy ngôn ngữ hệ thống đang chọn ở header app (`en` hoặc `vi`) và truyền thẳng xuống `/api/supertonic/generate`.

## API nội bộ đã thêm

- `GET /api/supertonic/config`: kiểm tra server, health, danh sách voice/style.
- `POST /api/supertonic/generate`: tạo file voice-over, lưu vào `server/data/generated/supertonic/YYYY-MM-DD/`.

## Dùng trong Long Content Studio

Vào panel **Voice-over** và chọn:

```txt
Supertonic local · 44.1kHz WAV
```

Provider này phù hợp để tạo voice-over offline cho long video và tránh chi phí ElevenLabs trong giai đoạn sản xuất thử.
