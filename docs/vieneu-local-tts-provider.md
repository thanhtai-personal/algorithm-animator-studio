# Tích hợp VieNeu-TTS local provider

Tài liệu này hướng dẫn setup VieNeu-TTS như một provider TTS local mới trong KAI Studio / KATA Studio.

Provider mới dùng Python bridge thay vì gọi trực tiếp từ frontend:

```txt
React UI
  -> Express backend /api/vieneu/*
  -> scripts/vieneu-health.py / scripts/vieneu-generate.py
  -> Python SDK vieneu
  -> server/data/generated/vieneu/YYYY-MM-DD/*.wav
```

## 1. Những phần đã thêm vào source

### Backend

- `server/routes/vieneuRoutes.ts`
  - `GET /api/vieneu/config`: kiểm tra Python, bridge script, SDK `vieneu`, reference audio.
  - `POST /api/vieneu/generate`: tạo WAV bằng VieNeu-TTS.
- `server/services/VieneuService.ts`: đọc cấu hình, gọi Python bridge, lưu file audio.
- `server/models/Vieneu.ts`: type request/response cho provider.
- `scripts/vieneu-health.py`: health check SDK.
- `scripts/vieneu-generate.py`: bridge tạo audio từ JSON payload.

### Frontend

- Settings > Voice có thêm tab `VieNeu`.
- Settings > Health Check có thêm trạng thái `VieNeu SDK` và `VieNeu Python`.
- Long Content Studio có thêm voice provider `VieNeu-TTS local`.
- Story Video Studio có thêm voice provider `VieNeu-TTS local`.

### Env / scripts

- `.env.example` có thêm nhóm `VIENEU_*`.
- `package.json` có thêm:

```bash
npm run vieneu:install
npm run vieneu:health
```

`npm run vieneu:install` hiện cài editable từ source VieNeu-TTS trong `libs/VieNeu-TTS` mặc định. `npm run dev` cũng chạy thêm process `dev:vieneu` để kiểm tra bridge VieNeu sẵn sàng.

## 2. Yêu cầu máy local

Khuyến nghị:

- Python 3.10 hoặc 3.11.
- Windows nên dùng virtualenv riêng cho VieNeu; Python global chỉ dùng để bootstrap/tạo `.venv`.
- Có mạng trong lần chạy đầu tiên để SDK tải model/cache nếu cần.
- CPU vẫn test được với `VIENEU_MODE=turbo`; GPU/standard cho chất lượng tốt hơn.

## 3. Cài VieNeu-TTS từ source trong `libs/`

Không khuyến nghị cài VieNeu bằng `pip install vieneu` trực tiếp nữa. Source VieNeu-TTS hiện đã nằm trong repo tại:

```txt
libs/VieNeu-TTS
```

Cách chuẩn là tạo virtual environment ngay trong `libs/VieNeu-TTS` và cài editable từ source để KAI Studio có thể dùng code VieNeu local:

```bat
npm run vieneu:install
```

Lệnh trên mặc định dùng Python global để tạo `.venv`, sau đó cài SDK vào Python riêng của VieNeu:

```txt
VIENEU_SOURCE_DIR=libs/VieNeu-TTS
VIENEU_PYTHON=libs/VieNeu-TTS/.venv/Scripts/python.exe
```

Nếu chưa tạo `.venv`, health check sẽ fallback sang Python global để báo đúng lỗi thiếu SDK/dependencies, thay vì báo nhầm là mất Python.

Kiểm tra import SDK:

```bat
npm run vieneu:health
```

Nếu muốn dùng source VieNeu ở thư mục fork riêng, đặt biến trước khi chạy:

```bat
set VIENEU_SOURCE_DIR=D:\AI\VieNeu-TTS
npm run vieneu:install
```

## 4. Cấu hình `.env`

Thêm hoặc chỉnh các biến sau:

```env
VIENEU_SOURCE_DIR=libs/VieNeu-TTS
VIENEU_PYTHON=libs/VieNeu-TTS/.venv/Scripts/python.exe
VIENEU_START_MODE=bridge
VIENEU_AUTO_START=true
VIENEU_MODE=turbo
VIENEU_EMOTION=natural
VIENEU_DEFAULT_VOICE_ID=
VIENEU_REFERENCE_AUDIO=
VIENEU_REFERENCE_TEXT=
VIENEU_REMOTE_API_BASE=http://127.0.0.1:23333/v1
VIENEU_REMOTE_MODEL=pnnbao-ump/VieNeu-TTS-v2
VIENEU_TIMEOUT_MS=1200000
```

Giải thích nhanh:

| Biến | Ý nghĩa |
| --- | --- |
| `VIENEU_SOURCE_DIR` | Source VieNeu-TTS, mặc định `libs/VieNeu-TTS`. Dùng cho `npm run vieneu:install`, `npm run vieneu:health`, `npm run dev:vieneu`. |
| `VIENEU_PYTHON` | Python executable trong virtualenv của source VieNeu-TTS, mặc định `libs/VieNeu-TTS/.venv/Scripts/python.exe`. Có thể set `python` để dùng Python global nếu global đã cài SDK VieNeu. |
| `VIENEU_START_MODE` | Chế độ process VieNeu khi `npm run dev`: `bridge` để health-check và chờ backend gọi on-demand, `gradio` để mở UI Gradio, `off` để tắt. |
| `VIENEU_AUTO_START` | Đặt `false` nếu không muốn `npm run dev` tự chạy process VieNeu. |
| `VIENEU_MODE` | `turbo`, `standard`, hoặc `remote`. CPU nên test bằng `turbo`. |
| `VIENEU_EMOTION` | Emotion truyền vào SDK, mặc định `natural`. |
| `VIENEU_DEFAULT_VOICE_ID` | Preset voice ID nếu SDK/model có preset voice. Để trống dùng giọng mặc định. |
| `VIENEU_REFERENCE_AUDIO` | File audio mẫu để clone giọng. Không bắt buộc. |
| `VIENEU_REFERENCE_TEXT` | Nội dung khớp với audio mẫu. Nên có khi dùng `standard` clone giọng. |
| `VIENEU_TIMEOUT_MS` | Timeout tạo audio. Lần đầu có thể load/tải model nên để cao. |

## 5. Health check bằng command line

Chạy:

```bat
npm run vieneu:health
```

Nếu OK sẽ thấy JSON tương tự:

```json
{"ok": true, "sdkInstalled": true, "version": "..."}
```

Nếu lỗi import `vieneu`, kiểm tra lại:

```bat
libs\VieNeu-TTS\.venv\Scripts\activate
python -c "import vieneu; print(getattr(vieneu, '__version__', 'dev'))"
```

## 6. Chạy cùng `npm run dev` và health check trong app

Chạy dev như bình thường. Lệnh này hiện khởi động đồng thời `client`, `server`, `supertonic`, `applio` và `vieneu`:

```bat
npm run dev
```

Mặc định `dev:vieneu` chạy chế độ `bridge`: kiểm tra SDK, báo ready và giữ process sống để log không biến mất. Backend vẫn tạo audio bằng `/api/vieneu/generate`, không cần mở Gradio.

Nếu muốn mở Gradio VieNeu cùng lúc dev:

```env
VIENEU_START_MODE=gradio
GRADIO_SERVER_NAME=127.0.0.1
GRADIO_SERVER_PORT=7860
```

Vào:

```txt
Settings -> Voice -> VieNeu
```

Kiểm tra các field:

- `VieNeu Python`: trỏ đúng `libs/VieNeu-TTS/.venv/Scripts/python.exe` hoặc đường dẫn tuyệt đối tương ứng.
- `VieNeu mode`: `turbo` để test CPU.
- `VieNeu emotion`: `natural`.
- Bấm lưu settings nếu đang chỉnh runtime settings.

Sau đó vào:

```txt
Settings -> Health Check -> Check again
```

Kết quả mong muốn:

- `VieNeu Python`: OK.
- `VieNeu SDK`: OK.
- `Bridge`: OK.

Có thể kiểm tra API trực tiếp:

```txt
http://localhost:5050/api/vieneu/config
```

## 7. Test generate audio bằng API

Khi backend đang chạy:

```bat
curl -X POST http://localhost:5050/api/vieneu/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Xin chào, đây là giọng đọc thử từ VieNeu TTS trong KAI Studio.\",\"fileName\":\"vieneu-health-check\",\"mode\":\"turbo\",\"emotion\":\"natural\"}"
```

Output audio nằm ở:

```txt
server/data/generated/vieneu/YYYY-MM-DD/vieneu-health-check.wav
```

Response sẽ có `audioUrl`, ví dụ:

```txt
http://localhost:5050/generated/vieneu/YYYY-MM-DD/vieneu-health-check.wav
```

## 8. Dùng trong Long Content Studio

Vào Long Content Studio:

1. Mở panel `Voice-over`.
2. Chọn `VieNeu-TTS local · tiếng Việt/clone giọng`.
3. Để `mode=turbo`, `emotion=natural`.
4. Bấm `Kiểm tra`.
5. Bấm `Tạo voice-over cho video`.

Khi tạo xong, audio được cache và có thể export kèm video giống Piper/ElevenLabs/Supertonic.

## 9. Dùng trong Story Video Studio

Vào Story Video Studio:

1. Ở `Voice đọc truyện`, chọn `VieNeu-TTS local`.
2. Chọn `mode`, `emotion`, preset voice nếu có.
3. Dán nội dung truyện.
4. Bấm `Tạo audio đọc truyện`.
5. Audio sinh ra sẽ vào danh sách audio đã tạo và dùng tiếp để render video.

## 10. Clone giọng bằng reference audio

Cấu hình `.env`:

```env
VIENEU_REFERENCE_AUDIO=C:/voices/my-voice.wav
VIENEU_REFERENCE_TEXT=Tôi đang thu một đoạn âm thanh mẫu để clone giọng.
```

Lưu ý:

- Dùng audio của chính mình hoặc người đã cho phép.
- Audio nên sạch, ít nhiễu, không nhạc nền.
- Nếu clone bằng `standard`, nên nhập đúng `VIENEU_REFERENCE_TEXT`.
- Nếu clone lỗi với `standard`, thử `turbo` trước để xác nhận bridge hoạt động.

## 11. Troubleshooting

### Health check báo không tìm thấy Python

Kiểm tra `VIENEU_PYTHON` có đúng file không:

```bat
libs\VieNeu-TTS\.venv\Scripts\python.exe --version
```

Nếu dùng runtime settings trong UI, đường dẫn trên UI sẽ override `.env`.

### Health check báo chưa import được `vieneu`

Cài lại từ source VieNeu-TTS trong đúng môi trường:

```bat
cd /d libs\VieNeu-TTS
.venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e . --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/
python -c "import vieneu; print(getattr(vieneu, '__version__', 'dev'))"
```

Nếu vừa sửa code trong repo VieNeu-TTS, thường không cần cài lại vì đang dùng `pip install -e .`. Chỉ cần chạy lại health check hoặc restart `npm run dev`.

### Lần generate đầu rất lâu

Bình thường. Lần đầu SDK/model có thể tải hoặc load cache. Giữ `VIENEU_TIMEOUT_MS=1200000` hoặc cao hơn.

### Audio câu quá ngắn nghe lạ

Hãy test bằng câu dài hơn 1–2 câu. Với CPU/turbo, câu quá ngắn thường dễ lộ artifacts hơn. Ví dụ:

```txt
Xin chào, đây là bản kiểm tra giọng đọc tiếng Việt. Hôm nay chúng ta sẽ tạo một video giải thích thuật toán bằng hình ảnh trực quan.
```

### Muốn chất lượng cao hơn

Dùng `VIENEU_MODE=standard` và môi trường GPU nếu máy hỗ trợ. CPU `turbo` phù hợp để test nhanh và chạy nhẹ.

### Muốn dùng server VieNeu remote

Cấu hình:

```env
VIENEU_MODE=remote
VIENEU_REMOTE_API_BASE=http://127.0.0.1:23333/v1
VIENEU_REMOTE_MODEL=pnnbao-ump/VieNeu-TTS-v2
```

Sau đó chạy server VieNeu riêng theo hướng dẫn của repo VieNeu-TTS, hoặc đặt `VIENEU_START_MODE=gradio` nếu chỉ cần mở Gradio local đi kèm dev.
