# Desktop app + Public web runtime

## Mục tiêu

- Bản Desktop chạy được Piper local, model voice, FFmpeg và YouTube OAuth bằng .env/local runtime.
- Bản Web public vẫn chạy animation/export/browser TTS, nhưng giới hạn các tính năng cần quyền máy local.
- Web public hiển thị link tải Desktop app qua `VITE_DESKTOP_DOWNLOAD_URL`.

## Lệnh chính

```bat
npm run dev
npm run build:public
npm run build:desktop
npm run dist:win
```

## Desktop runtime

Electron sẽ mở màn hình setup, kiểm tra Python/Piper/model/FFmpeg, sau đó chạy backend nội bộ ở `127.0.0.1:8888` và UI ở `127.0.0.1:6868`.

## Public web

Build bằng:

```bat
set VITE_PUBLIC_WEB=true
set VITE_DESKTOP_DOWNLOAD_URL=https://domain-cua-ban.com/downloads/AlgoShorts-Studio-Setup.exe
npm run build:public
```
