# KAI STUDIO — Hướng dẫn lấy API key/OAuth config cho local fake host

Tài liệu này dành cho bản desktop/local app đang chạy UI bằng fake host:

```txt
https://kai-studio.pro:3000
```

Backend vẫn chạy local:

```txt
http://localhost:5050
```

OAuth của YouTube/Facebook/TikTok/Instagram phải redirect về trang client `/channel`, không redirect về backend. URI cần khai báo giống y hệt trong dashboard provider:

```txt
https://kai-studio.pro:3000/channel
```

Nếu sai giao thức `http/https`, sai domain, sai port, hoặc thiếu `/channel`, provider thường báo `redirect_uri_mismatch`, `URL blocked`, hoặc không trả code.

---

## 1. Cấu hình fake host trên máy Windows

### 1.1. File hosts

Mở Notepad bằng quyền Administrator, mở file:

```txt
C:\Windows\System32\drivers\etc\hosts
```

Thêm dòng:

```txt
127.0.0.1 kai-studio.pro
```

Kiểm tra:

```bat
ping kai-studio.pro
```

Kết quả phải trỏ về `127.0.0.1`.

### 1.2. Chứng chỉ HTTPS local

Source đã có cấu hình Vite đọc certificate tại:

```txt
.certs/kai-studio.pro.pem
.certs/kai-studio.pro-key.pem
```

Nếu trình duyệt báo không tin cậy, cần tạo lại cert bằng `mkcert` rồi trust local CA:

```bat
mkcert -install
mkcert -cert-file .certs/kai-studio.pro.pem -key-file .certs/kai-studio.pro-key.pem kai-studio.pro localhost 127.0.0.1
```

Nếu chỉ dùng desktop app đóng gói, vẫn nên giữ fake host/cert ổn định để OAuth callback hoạt động thống nhất.

---

## 2. Biến môi trường/runtime config chuẩn

Có thể nhập trong màn hình setup/runtime settings hoặc ghi vào `.env`/file runtime env của desktop.

```txt
VITE_API_URL=http://localhost:5050
VITE_CLIENT_ORIGIN=https://kai-studio.pro:3000
CLIENT_ORIGIN=https://kai-studio.pro:3000
SERVER_ORIGIN=http://localhost:5050

YOUTUBE_REDIRECT_URI=https://kai-studio.pro:3000/channel
FACEBOOK_REDIRECT_URI=https://kai-studio.pro:3000/channel
TIKTOK_REDIRECT_URI=https://kai-studio.pro:3000/channel
INSTAGRAM_REDIRECT_URI=https://kai-studio.pro:3000/channel
```

Không dùng `http://localhost:3000/channel` nữa nếu app đang mở bằng `https://kai-studio.pro:3000`.

---

## 3. YouTube — lấy Client ID / Client Secret

YouTube không dùng API key thường để upload video. Upload cần OAuth Client ID/Secret và user phải cấp quyền cho channel.

### 3.1. Tạo Google Cloud project

1. Vào Google Cloud Console.
2. Tạo project mới hoặc chọn project đang dùng.
3. Vào `APIs & Services` → `Library`.
4. Enable `YouTube Data API v3`.
5. Vào `OAuth consent screen`.
6. Chọn `External` nếu dùng tài khoản Gmail thường.
7. Thêm email của bạn vào `Test users` nếu app còn ở Testing.

### 3.2. Tạo OAuth Client

Vào:

```txt
APIs & Services → Credentials → Create Credentials → OAuth client ID
```

Chọn loại:

```txt
Web application
```

Khai báo:

```txt
Authorized JavaScript origins:
https://kai-studio.pro:3000

Authorized redirect URIs:
https://kai-studio.pro:3000/channel
```

Copy vào config:

```txt
YOUTUBE_CLIENT_ID=xxxxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxxxx
YOUTUBE_REDIRECT_URI=https://kai-studio.pro:3000/channel
```

### 3.3. Scope YouTube app đang dùng

Backend upload đang dùng:

```txt
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube
```

Nếu đổi OAuth client hoặc scope, nên disconnect/reconnect lại channel để refresh token có đủ quyền mới.

---

## 4. Facebook Page — lấy App ID / App Secret và quyền upload Page video

Facebook upload video cần Page access token. App local chỉ lấy user token qua OAuth, sau đó gọi `/me/accounts` để lấy Page access token của Page mà user có quyền quản lý.

### 4.1. Tạo Meta app

1. Vào Meta for Developers.
2. Tạo app mới.
3. Vào `Settings` → `Basic`.
4. Copy:

```txt
App ID     → FACEBOOK_APP_ID
App Secret → FACEBOOK_APP_SECRET
```

5. Trong `App Domains`, thêm:

```txt
kai-studio.pro
```

Nếu Meta yêu cầu Website URL, nhập:

```txt
https://kai-studio.pro:3000
```

### 4.2. Cấu hình OAuth redirect

Thêm product:

```txt
Facebook Login
```

Vào phần settings của Facebook Login, khai báo:

```txt
Valid OAuth Redirect URIs:
https://kai-studio.pro:3000/channel
```

Meta kiểm tra redirect URI rất chặt, nên URL trong request phải khớp đúng với URL đã khai báo.

### 4.3. Permissions cần dùng

Config trong KAI:

```txt
FACEBOOK_APP_ID=xxxxx
FACEBOOK_APP_SECRET=xxxxx
FACEBOOK_REDIRECT_URI=https://kai-studio.pro:3000/channel
FACEBOOK_SCOPES=pages_show_list,pages_read_engagement,pages_manage_posts
```

Ý nghĩa:

- `pages_show_list`: lấy danh sách Page user quản lý.
- `pages_read_engagement`: đọc thông tin Page/các metadata cần thiết.
- `pages_manage_posts`: tạo/publish post/video lên Page.

Khi app còn ở Development mode, thường chỉ tài khoản admin/developer/tester của app dùng được. Muốn người ngoài dùng thì phải đưa app Live và xin App Review cho quyền Page.

### 4.4. Điều kiện Page

Tài khoản Facebook dùng để connect phải có quyền tạo nội dung trên Page. Nếu connect thành công nhưng upload lỗi, kiểm tra:

- User có quyền quản trị/tạo nội dung trên Page không.
- App đã được cấp đủ permission chưa.
- Page access token lấy từ `/me/accounts` còn hợp lệ không.
- Video file có đúng format/size mà Meta hỗ trợ không.

---

## 5. TikTok — lấy Client Key / Client Secret và Content Posting API

TikTok có 2 mode chính:

- `video.upload`: upload video vào TikTok inbox/draft để user mở app TikTok review rồi tự post.
- `video.publish`: direct post thẳng lên TikTok, yêu cầu review/approval chặt hơn.

Patch hiện ưu tiên `video.upload` vì hợp với local desktop app và an toàn hơn.

### 5.1. Tạo TikTok developer app

1. Vào TikTok for Developers.
2. Tạo app mới.
3. Chọn platform phù hợp: Web/Desktop tùy dashboard TikTok đang hiển thị.
4. Copy:

```txt
Client Key    → TIKTOK_CLIENT_KEY
Client Secret → TIKTOK_CLIENT_SECRET
```

### 5.2. Cấu hình redirect URI

Khai báo redirect/callback URI:

```txt
https://kai-studio.pro:3000/channel
```

Nếu TikTok yêu cầu `Web/Desktop URL` hoặc URL verification, cần dùng domain bạn kiểm soát thật. Nếu `kai-studio.pro` chỉ là fake host trên máy local và bạn không kiểm soát domain công khai, TikTok có thể không cho verify hoặc không approve Content Posting API. Khi đó vẫn giữ TikTok ở trạng thái manual/fallback.

### 5.3. Bật sản phẩm Content Posting API

Trong TikTok developer app:

1. Add product `Login Kit`.
2. Add product `Content Posting API`.
3. Xin/enable scope:

```txt
user.info.basic
video.upload
```

Config trong KAI:

```txt
TIKTOK_CLIENT_KEY=xxxxx
TIKTOK_CLIENT_SECRET=xxxxx
TIKTOK_REDIRECT_URI=https://kai-studio.pro:3000/channel
TIKTOK_SCOPES=user.info.basic,video.upload
```

Sau khi upload thành công bằng inbox upload, TikTok vẫn yêu cầu user mở TikTok và hoàn tất post. Vì vậy job trong KAI có thể chuyển sang `manual_required`, không phải lỗi.

---

## 6. Instagram — hiện để manual là đúng

Instagram Graph API thường cần media URL public để publish Reels/media. Với app local, video chỉ nằm trong máy:

```txt
C:\Users\...\KAI STUDIO\server-data\generated-videos\...
```

Nền tảng Meta không lấy được file local này qua public URL, nên app chuyển Instagram job sang `manual_required` là hợp lý.

Nếu sau này muốn tự động Instagram thật, cần một trong các hướng:

1. Tạo public temporary file server/tunnel.
2. Upload video lên storage public rồi đưa `media_url` cho Instagram Graph API.
3. Dùng manual publish: KAI tạo metadata, user tự upload.

Config nếu vẫn muốn connect Instagram account:

```txt
INSTAGRAM_APP_ID=xxxxx
INSTAGRAM_APP_SECRET=xxxxx
INSTAGRAM_REDIRECT_URI=https://kai-studio.pro:3000/channel
INSTAGRAM_SCOPES=instagram_basic,pages_show_list,pages_read_engagement
```

Yêu cầu: Instagram Business/Creator account phải gắn với Facebook Page.

---

## 7. Agent workflow / AI key

Agent workflow trong publish queue hiện chủ yếu là local rule-based suggestions, không bắt buộc OpenAI key.

Các tính năng tạo kịch bản/tin tức/metadata bằng AI có thể dùng:

```txt
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_CHAT_MODEL=gpt-4o-mini
```

Nếu dùng OpenAI-compatible server local hoặc proxy riêng:

```txt
OPENAI_API_KEY=local-or-proxy-key
OPENAI_BASE_URL=http://127.0.0.1:11434/v1
OPENAI_CHAT_MODEL=your-model-name
```

Các key video AI/Gemini/Veo nếu dùng tính năng short AI:

```txt
AI_SHORTS_API_KEY=xxxxx
AI_SHORTS_API_URL=https://generativelanguage.googleapis.com/v1beta
AI_SHORTS_MODEL=veo-3.1-fast-generate-preview
AI_SHORTS_PROVIDER=gemini-veo
```

Không cần các key này để chạy queue/scheduler/history cơ bản.

---

## 8. FFmpeg/FFprobe packaging config

App ưu tiên theo thứ tự:

```txt
FFMPEG_EXE / FFPROBE_EXE trong runtime settings
→ @ffmpeg-installer/ffmpeg và @ffprobe-installer/ffprobe packaged trong app
→ ffmpeg / ffprobe từ PATH
```

Nếu đã cài FFmpeg thủ công, cấu hình rõ đường dẫn:

```txt
FFMPEG_EXE=C:\TOOLS\ffmpeg\bin\ffmpeg.exe
FFPROBE_EXE=C:\TOOLS\ffmpeg\bin\ffprobe.exe
```

Nếu dùng packaged binary, chỉ cần chạy:

```bat
npm install
npm run build:server
npm run dist:win:nsis
```

---

## 9. Checklist sau khi config

1. Mở app bằng đúng URL:

```txt
https://kai-studio.pro:3000/channel
```

2. Vào màn hình quản lý kênh.
3. Provider nào thiếu key/secret phải bị disabled.
4. YouTube connect/upload vẫn hoạt động như cũ.
5. Facebook connect phải hiện danh sách Page.
6. Facebook upload queue thành công nếu Page token và permission đủ.
7. TikTok connect phải lấy được profile.
8. TikTok upload queue thường kết thúc `manual_required` để user mở TikTok hoàn tất post.
9. Queue/history nằm trong `SERVER_DATA_DIR`, không commit lên git.

---

## 10. Lỗi thường gặp

### `redirect_uri_mismatch`

Nguyên nhân thường là dashboard provider khai báo khác với app request.

Cần thống nhất:

```txt
https://kai-studio.pro:3000/channel
```

Không trộn với:

```txt
http://localhost:3000/channel
http://127.0.0.1:3000/channel
https://localhost:3000/channel
```

### Facebook `URL blocked`

Kiểm tra `Valid OAuth Redirect URIs` và `App Domains` trong Meta app.

### Facebook không thấy Page

Kiểm tra tài khoản Facebook có quyền quản lý/tạo nội dung trên Page và đã cấp đúng scope khi OAuth.

### TikTok connect được nhưng upload lỗi

Kiểm tra app đã add Content Posting API, đã được cấp `video.upload`, và TikTok developer dashboard có yêu cầu verify URL/domain hay không.

### TikTok upload xong nhưng không tự public

Đây là hành vi đúng với `video.upload`: user cần mở TikTok inbox/notification để review và post.
