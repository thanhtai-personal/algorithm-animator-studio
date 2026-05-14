# Voice + YouTube integration

## Run local production workflow

```bash
npm install
npm run dev:full
```

Frontend mặc định chạy ở `http://localhost:5173`, backend voice/YouTube chạy ở `http://localhost:5050`.

## Voice providers

Long Content Studio hỗ trợ 3 nguồn giọng:

1. Browser TTS: dùng để nghe thử nhanh khi preview. Browser SpeechSynthesis không xuất audio stream chuẩn để nhúng vào MediaRecorder.
2. Piper local: tạo file WAV qua backend `/api/generate`, sau đó mix voice vào video export bằng Web Audio + MediaRecorder.
3. ElevenLabs: tạo file MP3 qua backend `/api/elevenlabs/generate`, sau đó mix voice vào video export bằng Web Audio + MediaRecorder.

## Piper models

Đặt model ở thư mục `models/`:

```txt
models/.venv/Scripts/piper.exe
models/vi_VN-vais1000-medium.onnx
models/vi_VN-vais1000-medium.onnx.json
models/en_US-lessac-medium.onnx
models/en_US-lessac-medium.onnx.json
```

Có thể đổi `MODEL_DIR` hoặc `PIPER_EXE` trong `.env`.

## ElevenLabs voices

Trong `.env`, khai báo:

```txt
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICES=[{"id":"VOICE_ID","label":"My narration voice"}]
```

## YouTube upload

Tạo OAuth Client trong Google Cloud, thêm redirect URI:

```txt
http://localhost:5173/youtube-publishing
```

Sau đó điền `.env`:

```txt
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
YOUTUBE_REDIRECT_URI=http://localhost:5173/youtube-publishing
```

Màn hình `/youtube-publishing` có thể dùng file video vừa export trong phiên hiện tại hoặc upload file video khác.
