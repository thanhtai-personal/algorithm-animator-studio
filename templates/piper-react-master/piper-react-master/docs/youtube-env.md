# YouTube Auto Upload UI

UI upload dùng YouTube Data API `videos.insert`, `playlists.list` và `playlistItems.insert` với OAuth2 user consent. Google yêu cầu scope upload và scope YouTube để đăng video rồi thêm video vào playlist của channel đã cấp quyền.

## 1. Tạo OAuth client

1. Vào Google Cloud Console.
2. Tạo hoặc chọn project.
3. Enable **YouTube Data API v3**.
4. Vào **APIs & Services > OAuth consent screen** và cấu hình app.
5. Vào **Credentials > Create Credentials > OAuth client ID**.
6. Chọn app type phù hợp. Với local UI, dùng redirect URI:

```text
http://localhost:5173/youtube
```

App đã cấu hình Vite `strictPort` để dùng cố định `5173`. Nếu port này đang bị chiếm, cần tắt process đang chiếm port trước khi chạy app.
Không dùng `/oauth2callback`; route callback hiện tại là `/youtube`.

## 2. Thêm cấu hình bằng file .env

Tạo hoặc sửa file `.env` ở root project cho cấu hình OAuth client và metadata mặc định. `YOUTUBE_REFRESH_TOKEN` không lưu trong `.env`; UI lưu token trong localStorage sau khi OAuth.

```bash
CLIENT_ORIGIN="http://localhost:5173"
SERVER_ORIGIN="http://localhost:5050"
VITE_CLIENT_ORIGIN="http://localhost:5173"
VITE_API_URL="http://localhost:5050"
FFMPEG_EXE="ffmpeg"
FFPROBE_EXE="ffprobe"

YOUTUBE_CLIENT_ID="your-google-oauth-client-id"
YOUTUBE_CLIENT_SECRET="your-google-oauth-client-secret"
YOUTUBE_REDIRECT_URI="http://localhost:5173/youtube"

YOUTUBE_TITLE="Tên video mặc định"
YOUTUBE_DESCRIPTION="Mô tả mặc định"
YOUTUBE_TAGS="truyen audio,piper,tts"
YOUTUBE_CATEGORY_ID="22"
YOUTUBE_PRIVACY_STATUS="unlisted"
YOUTUBE_MADE_FOR_KIDS="false"
YOUTUBE_NOTIFY_SUBSCRIBERS="false"
YOUTUBE_CONTAINS_SYNTHETIC_MEDIA="true"
```

Host config:

- `CLIENT_ORIGIN`: frontend origin cho backend dùng khi tạo OAuth redirect fallback.
- `SERVER_ORIGIN`: backend origin dùng để trả link audio generated.
- `VITE_CLIENT_ORIGIN`: frontend origin cho Vite/dev client.
- `VITE_API_URL`: backend API URL mà browser gọi.
- `FFMPEG_EXE` / `FFPROBE_EXE`: đường dẫn FFmpeg/FFprobe dùng cho page `/video`. Nếu FFmpeg đã nằm trong PATH thì để mặc định `ffmpeg` và `ffprobe`.

## 3. Lấy refresh token bằng UI

1. Bấm **Mở Google OAuth**.
2. Login đúng Google account chứa YouTube channel.
3. Cấp quyền upload và quản lý playlist.
4. Google sẽ redirect về lại `/youtube`.
5. UI tự lấy `code`, đổi refresh token và lưu vào localStorage của trình duyệt.

Khi upload, UI gửi refresh token từ localStorage kèm request cho backend dùng ngay.
Nếu đã cấp quyền từ phiên bản cũ, bấm **Đăng nhập lại YouTube** để token mới có quyền đọc và thêm playlist.
Playlist không cấu hình bằng `.env`; UI tự lấy danh sách playlist từ YouTube account đã đăng nhập và gửi `playlistId` đã chọn khi upload.

## 4. Upload video bằng UI

1. Chọn file video từ ô **File video**.
2. Điền title, description, tags, privacy, playlist và publish time nếu cần.
3. Bấm **Upload lên YouTube**.
4. Khi thành công, UI hiển thị YouTube ID và link mở video.

Schedule video:

- Chọn **Publish at** bằng date time picker trên UI.
- Khi dùng schedule, privacy nên để `private`.

## 5. Tạo video bằng page /video

Page `/video` dùng luồng:

```text
Text + mẫu giọng Piper + 1 ảnh nền
→ tạo audio WAV
→ FFmpeg ghép ảnh nền và audio thành MP4
→ preview video
→ upload trực tiếp video đã tạo lên YouTube
```

Video được lưu ở:

```text
server/generated-videos/YYYY-MM-DD/video-name.mp4
```

Backend serve video qua:

```text
http://localhost:5050/generated-videos/YYYY-MM-DD/video-name.mp4
```

Nếu tạo video báo không chạy được FFmpeg hoặc FFprobe, hãy cài FFmpeg và đặt đúng `FFMPEG_EXE`, `FFPROBE_EXE` trong `.env`.

## 6. Lưu ý vận hành

- Không commit `.env`; repo đã ignore file này.
- OAuth app ở trạng thái Testing có thể bị giới hạn user test và token có thể hết hạn theo policy của Google.
- YouTube upload tốn quota lớn; không chạy vòng lặp upload hàng loạt nếu chưa kiểm soát quota.
- Nếu mất hoặc revoke refresh token trong trình duyệt, chạy lại bước OAuth trên UI.
- Bấm **Ngắt liên kết YouTube** nếu muốn xoá token khỏi trình duyệt và đăng nhập lại.

Nguồn chính thức:

- YouTube `videos.insert`: https://developers.google.com/youtube/v3/docs/videos/insert
- YouTube `playlists.list`: https://developers.google.com/youtube/v3/docs/playlists/list
- YouTube `playlistItems.insert`: https://developers.google.com/youtube/v3/docs/playlistItems/insert
- OAuth installed apps và scope `youtube.upload`: https://developers.google.com/youtube/v3/guides/auth/installed-apps

ElevenLabs config riêng nằm ở `docs/elevenlabs-config.md`.
