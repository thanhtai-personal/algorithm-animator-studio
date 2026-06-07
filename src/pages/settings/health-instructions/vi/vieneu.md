VieNeu chạy qua source local trong `libs/VieNeu-TTS`. Health kiểm tra Python, bridge script và SDK `vieneu` có import được không.

### Cài đặt

1. Source VieNeu-TTS đã được đặt trong repo tại `libs/VieNeu-TTS`.
2. Chạy lệnh cài để tạo `.venv` ngay trong thư mục đó và cài editable từ source.
3. Sau khi cài xong, `npm run dev` sẽ tự chạy thêm process `vieneu` để kiểm tra bridge sẵn sàng.

```bat
npm run vieneu:install
npm run vieneu:health
npm run dev
```

Nếu muốn cập nhật VieNeu từ fork riêng, thay source trong `libs/VieNeu-TTS` hoặc set `VIENEU_SOURCE_DIR` sang thư mục fork của bạn trước khi chạy `npm run vieneu:install`.

### Lấy thông tin điền setting

1. Trong Settings -> Voice -> VieNeu, điền `VIENEU_PYTHON` là `{{VIENEU_PYTHON}}`.
2. Chọn `VIENEU_MODE`: dùng `turbo` hoặc `standard` cho SDK local.
3. Chỉ dùng `remote` nếu bạn có endpoint VieNeu kiểu OpenAI-compatible.
4. Nếu clone giọng, chọn `VIENEU_REFERENCE_AUDIO` và điền `VIENEU_REFERENCE_TEXT` là transcript của audio tham chiếu.
5. Điền `VIENEU_TIMEOUT_MS=1200000` nếu máy load model chậm.

### Chế độ chạy trong npm run dev

Mặc định `dev:vieneu` chạy ở chế độ `bridge`: kiểm tra SDK rồi giữ process sống để dễ nhìn log. Backend vẫn tạo audio qua `/api/vieneu/generate` và `scripts/vieneu-generate.py`, không cần mở UI Gradio.

Nếu muốn mở Gradio VieNeu cùng lúc dev, thêm vào `.env`:

```env
VIENEU_START_MODE=gradio
GRADIO_SERVER_NAME=127.0.0.1
GRADIO_SERVER_PORT=7860
```
