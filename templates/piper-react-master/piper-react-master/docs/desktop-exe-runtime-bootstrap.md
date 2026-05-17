# Đóng gói EXE có tự cài Piper/FFmpeg khi mở app

Flow khi user mở app desktop:

```text
Mở Kata Studio.exe
→ hiện cửa sổ chuẩn bị môi trường local
→ kiểm tra Python
→ nếu thiếu Python thì chạy winget install Python.Python.3.12
→ kiểm tra %LOCALAPPDATA%/Kata Studio/models/.venv/Scripts/piper.exe
→ nếu thiếu thì tạo venv và pip install piper-tts
→ kiểm tra model vi_VN-vais1000-medium
→ nếu thiếu thì tải model + file json từ HuggingFace
→ kiểm tra ffmpeg/ffprobe
→ nếu thiếu thì chạy winget install Gyan.FFmpeg
→ start Express backend local
→ mở UI Kata Studio
```

Runtime không ghi vào Program Files. Mặc định dùng:

```text
%LOCALAPPDATA%/Kata Studio/models
%APPDATA%/Kata Studio/server-data
```

Build installer:

```cmd
npm install
npm run dist:win
```

File cài đặt Windows nằm trong:

```text
release/win/
```

Bản macOS nằm riêng trong:

```text
release/mac/
```
