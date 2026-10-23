VieNeu là provider tùy chọn. SDK phải được clone riêng vào `../VieNeu-TTS`; repo Algorithm Animator Studio không bundle SDK, preset hoặc sample voice assets. Health kiểm tra Python, bridge script và SDK `vieneu` có import được không.

### Cài đặt

1. Clone source từ `https://github.com/pnnbao97/VieNeu-TTS` vào `../VieNeu-TTS` (thư mục nằm ngoài repo ứng dụng).
2. Chạy lệnh cài để tạo `.venv` trong checkout VieNeu riêng và cài editable từ source.
3. Dùng Python 3.10 hoặc 3.11; script dùng Python global chỉ để bootstrap virtualenv.
4. Provider mặc định tắt. Sau khi cài, đặt `KAI_PROVIDER_VIENEU_ENABLED=true` và `VIENEU_AUTO_START=true` trong `.env` nếu muốn bật.

```bat
npm run vieneu:install
npm run vieneu:health
npm run dev
```

Nếu không dùng VieNeu, để `KAI_PROVIDER_VIENEU_ENABLED=false`. Không dùng preset/sample voices nếu điều khoản license không cho phép mục đích của bạn.

Nếu muốn dùng luôn Python global thay vì `.venv`, điền `VIENEU_PYTHON=python` trong `.env` hoặc Settings -> Voice -> VieNeu. Cách này chỉ hoạt động khi Python global đã cài được SDK/dependencies VieNeu.

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
