# Mạng lưới logic cài runtime cho Kata Studio Desktop

Tài liệu này mô tả logic để file cài đặt `.exe` dễ chạy trên nhiều máy Windows nhất có thể, kể cả máy thiếu `winget`.

## Nguyên tắc

App không được phụ thuộc duy nhất vào `winget`. Runtime installer phải đi theo nhiều lớp fallback:

```text
1. Runtime đã bundle trong installer
2. Runtime đã cài riêng trong %LOCALAPPDATA%\Kata Studio
3. Runtime có sẵn trong PATH của máy
4. Runtime nằm trong các thư mục phổ biến của WinGet/Program Files/Chocolatey
5. Nếu có package manager thì tự cài
6. Nếu không có package manager thì hiển thị hướng dẫn thủ công rõ ràng
```

## Python / Piper

```text
Kiểm tra Python:
- py -3
- py
- python

Nếu có Python:
- tạo %LOCALAPPDATA%\Kata Studio\models\.venv
- cài piper-tts bằng pip
- kiểm tra .venv\Scripts\piper.exe --help

Nếu không có Python:
- nếu có winget: winget install Python.Python.3.12
- nếu không có winget: app không dừng, mở UI và yêu cầu cài Python thủ công
```

## Model Piper

```text
Kiểm tra model mặc định:
- vi_VN-vais1000-medium.onnx
- vi_VN-vais1000-medium.onnx.json

Nếu thiếu:
- tải bằng Node HTTPS vào %LOCALAPPDATA%\Kata Studio\models
- nếu mạng bị chặn: app hiển thị đường dẫn để user tải thủ công vào đúng thư mục
```

## FFmpeg / FFprobe

```text
Kiểm tra theo thứ tự:
1. process.env.FFMPEG_EXE / process.env.FFPROBE_EXE
2. %LOCALAPPDATA%\Kata Studio\tools\ffmpeg\bin
3. resources\runtime\tools\ffmpeg\bin trong bản Electron packaged
4. runtime\tools\ffmpeg\bin trong source/build
5. PATH: ffmpeg / ffprobe
6. WinGet packages / Program Files / Chocolatey

Nếu vẫn thiếu:
- nếu có winget: winget install Gyan.FFmpeg
- nếu winget báo package đã cài/no upgrade: không coi là lỗi, dò lại file ffmpeg.exe
- nếu không có winget: app không dừng, hiển thị hướng dẫn cài FFmpeg thủ công hoặc bundle runtime
```

## Bundle FFmpeg vào installer

Để không phụ thuộc winget, đặt FFmpeg theo cấu trúc này trước khi build:

```text
runtime
└─ tools
   └─ ffmpeg
      └─ bin
         ├─ ffmpeg.exe
         └─ ffprobe.exe
```

Sau đó cấu hình `extraResources` copy thư mục `runtime` vào installer. Khi chạy app, runtime installer sẽ ưu tiên dùng bản bundle này trước khi dùng winget.

## Trạng thái UI

Màn `Local runtime setup` phải hiển thị:

- Trạng thái từng dependency
- Năng lực máy hiện tại: có winget không, có Python không, có FFmpeg bundle không
- Tiến trình cài đặt
- Hướng dẫn thủ công nếu không thể tự cài
- Log chi tiết để debug máy user

## Điều quan trọng

Nếu một dependency cài không được, app vẫn nên mở UI. Không nên chặn toàn bộ app chỉ vì máy thiếu winget hoặc FFmpeg. User vẫn có thể vào Settings, xem log, cài thủ công, rồi bấm `Kiểm tra lại`.
