# Electron Windows EXE build

Tài liệu này dùng cho bản desktop KAI STUDIO chạy local backend + Vite static client trong Electron.

## 1. Chuẩn bị

```bat
cd /d C:\DATA\working\sources\video-creator-tools\algorithm-animator-studio-pro
npm install
```

Nếu muốn test các voice service trước khi đóng gói:

```bat
uv python pin 3.12
uv venv .venv --python 3.12 --seed
.venv\Scripts\python.exe -m pip install --upgrade pip setuptools wheel
.venv\Scripts\python.exe -m pip install -U gradio_client "supertonic[serve]"
.venv\Scripts\python.exe -m pip install -e libs\VieNeu-TTS --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/
```

## 2. Build desktop assets

```bat
npm run build:desktop
```

Lệnh này sẽ:

1. build UI vào `dist/` với API URL desktop `http://127.0.0.1:8888`;
2. bundle backend vào `dist-electron/server/index.js`;
3. chạy `scripts/verify-electron-build.mjs` để kiểm tra các file bắt buộc cho Electron.

## 3. Test trước khi đóng installer

```bat
npm run electron:preview
```

App sẽ mở màn hình setup runtime, sau đó chạy:

- UI local: `http://127.0.0.1:6868`
- Backend local: `http://127.0.0.1:8888`

## 4. Build EXE/installer

Build bản unpacked để debug nhanh:

```bat
npm run dist:win:unpacked
```

Build installer NSIS:

```bat
npm run dist:win:nsis
```

Hoặc build mặc định:

```bat
npm run dist:win
```

File output nằm trong:

```txt
release/win
```

## 5. Runtime được đóng gói kèm

Electron builder copy thêm các resource này ra ngoài `app.asar`:

```txt
desktop-client/                      # UI Vite build
electron-runtime/scripts/             # bridge scripts, gồm VieNeu health/generate
electron-runtime/libs/VieNeu-TTS/      # VieNeu source local
```

Khi chạy EXE, backend sẽ được trỏ bằng:

```txt
KATA_DESKTOP_RUNTIME=true
KATA_PROJECT_ROOT=<resources>/electron-runtime
KATA_DESKTOP_RESOURCE_ROOT=<resources>/electron-runtime
```

Nhờ vậy Python bridge không phải đọc script/source bên trong `app.asar`.

## 6. Dữ liệu người dùng

File generate, model Piper, FFmpeg runtime và dữ liệu server được ghi vào thư mục user data của app, không ghi vào `app.asar`.

Trên Windows thường nằm ở:

```txt
%APPDATA%\KAI STUDIO
%LOCALAPPDATA%\KAI STUDIO
```

## 7. Checklist lỗi thường gặp

### Port 6868 hoặc 8888 bị chiếm

Đóng app/dev server cũ, hoặc kiểm tra:

```bat
netstat -ano | findstr ":6868 :8888"
```

### VieNeu thiếu dependency

Bản EXE có kèm source VieNeu, nhưng Python package vẫn cần cài vào môi trường Python runtime. Trong bản dev, dùng:

```bat
npm run vieneu:install
npm run vieneu:health
```

### Build báo thiếu `dist/index.html`

Chạy lại:

```bat
npm run build:desktop
```

### Build báo thiếu `libs/VieNeu-TTS/pyproject.toml`

Kiểm tra source VieNeu đã nằm trong:

```txt
libs/VieNeu-TTS
```
