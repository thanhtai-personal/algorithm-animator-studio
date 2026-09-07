# YouTube Tools — tải video/audio và lấy transcript

Module này thêm màn hình Common tools → YouTube Tools tại route `/youtube-tools`.

## Chức năng

- Tải video YouTube bằng `yt-dlp`, lưu vào `generated-videos/youtube/<ngày>`.
- Tải audio MP3 bằng `yt-dlp -x`.
- Lấy transcript bằng Whisper local từ:
  - link YouTube trực tiếp; hoặc
  - file video/audio vừa tải.
- Xuất transcript dạng `.txt`, `.srt`, `.vtt`, `.json` trong `generated-videos/youtube-transcripts/<ngày>`.
- Health check nhóm công cụ nền trong Settings → Health Check → YouTube Tools.

## Công cụ nền cần có

```bash
python -m pip install -U yt-dlp openai-whisper
ffmpeg -version
```

Nếu máy đã cài Whisper trong Python/venv riêng, cấu hình `.env`:

```env
YOUTUBE_TOOLS_PYTHON=python
YOUTUBE_DLP_EXE=yt-dlp
WHISPER_EXE=whisper
YOUTUBE_TRANSCRIPT_MODEL=base
YOUTUBE_TRANSCRIPT_LANGUAGE=auto
YOUTUBE_COOKIES_FROM_BROWSER=
# Khi YouTube thực sự yêu cầu xác thực, ưu tiên cookies.txt:
# YOUTUBE_COOKIES_FILE=C:/path/to/youtube-cookies.txt
```

Gợi ý Windows nếu dùng venv:

```env
YOUTUBE_TOOLS_PYTHON=C:\TOOLS\whisper\.venv\Scripts\python.exe
```

## API backend

```txt
GET  /api/youtube-tools/health
POST /api/youtube-tools/download
POST /api/youtube-tools/transcript
```

Payload tải video/audio:

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "mode": "video",
  "maxHeight": 1080,
  "fileName": "my-video"
}
```

Payload transcript trực tiếp từ URL:

```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "model": "base",
  "language": "auto",
  "task": "transcribe"
}
```

Payload transcript từ file đã tải:

```json
{
  "sourceRelativePath": "youtube/2026-06-15/my-video-abc123.mp4",
  "model": "base",
  "language": "vi",
  "task": "transcribe"
}
```

## Ghi chú

- Backend chỉ nhận domain YouTube/youtu.be và luôn dùng `--no-playlist` để tránh tải cả playlist ngoài ý muốn.
- Browser cookies là tùy chọn. Downloader thử video public trước; chỉ dùng `YOUTUBE_COOKIES_FROM_BROWSER` khi YouTube yêu cầu xác thực. Nếu Chrome/Edge khóa cookie database, ưu tiên `YOUTUBE_COOKIES_FILE` hoặc đóng hẳn browser.
- Lệnh nền chạy bằng `spawn/execFile`, không chạy shell string.
- Video dài sẽ mất thời gian ở bước Whisper, nhất là model `medium/large`.
