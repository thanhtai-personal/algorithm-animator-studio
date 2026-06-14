# KAI STUDIO — Local Publish Scheduler, Upload Queue & Agent Workflow

## Mục tiêu

Bản này học hướng vận hành của AiToEarn nhưng giữ đúng triết lý KAI STUDIO desktop/local app:

- Không cần hosting cloud.
- Queue, scheduler, history lưu trong `SERVER_DATA_DIR` trên máy local.
- App phải mở khi tới lịch đăng.
- YouTube tiếp tục dùng flow upload hiện có.
- Facebook/TikTok có adapter local ở backend; quyền API vẫn phụ thuộc app Facebook/TikTok của bạn.
- Instagram hiện dùng manual fallback vì Graph API thường cần `media_url` public, không phù hợp khi video chỉ nằm local.

## File dữ liệu local

Trong `SERVER_DATA_DIR` sẽ có thêm:

```txt
publish-jobs.json
publish-history.json
social-provider-accounts.json
```

`social-provider-accounts.json` lưu token OAuth local của Facebook/TikTok/Instagram. File này chỉ nằm trên máy đang chạy app, không đưa lên cloud hay commit git.

## API mới

```txt
GET    /api/publish/jobs
POST   /api/publish/jobs
POST   /api/publish/jobs/run-due
POST   /api/publish/jobs/:id/run
POST   /api/publish/jobs/:id/retry
POST   /api/publish/jobs/:id/cancel
GET    /api/publish/history
GET    /api/publish/agent-suggestions
GET    /api/publish/social-accounts
DELETE /api/publish/social-accounts/:id
```

## UI mới

Trang `/channel` có thêm tab `Queue`:

1. Chọn kênh bên trái.
2. Chọn video trong generated assets.
3. Sửa title/description/tags.
4. Chọn lịch chạy local nếu cần.
5. Bấm đưa vào queue hoặc lên lịch.
6. Local worker tự chạy mỗi 15 giây, hoặc bấm `Chạy job tới giờ`.

## Hành vi theo nền tảng

### YouTube

Upload tự động bằng `refreshToken` của kênh YouTube đang chọn. Nếu có `scheduledAt`, job upload private và truyền `publishAt` cho YouTube.

### Facebook Page

Backend lưu Page access token khi OAuth trả `/me/accounts`. Upload bằng Graph API `/{page-id}/videos`.

Cần scope:

```txt
FACEBOOK_SCOPES=pages_show_list,pages_read_engagement,pages_manage_posts
```

Nếu app/token chưa có quyền, job sẽ lỗi hoặc chuyển manual tùy trường hợp.

### TikTok

Backend lưu TikTok access token khi OAuth thành công. Queue dùng Content Posting API inbox upload:

```txt
/v2/post/publish/inbox/video/init/
```

Cần scope:

```txt
TIKTOK_SCOPES=user.info.basic,video.upload
```

Sau khi upload thành công, TikTok vẫn yêu cầu mở app TikTok và bấm notification để hoàn tất post. Vì vậy job chuyển trạng thái `manual_required`, không đánh dấu `success` tuyệt đối.

### Instagram

Hiện chuyển `manual_required`. Lý do: Instagram Graph API cho Reels thường cần video `media_url` public, trong khi KAI STUDIO local không host file public. Có thể bổ sung sau nếu dùng public URL, S3/RustFS local tunneling, hoặc upload flow riêng được Meta hỗ trợ.

## FFmpeg packaging

Backend sẽ ưu tiên:

1. `FFMPEG_EXE` / `FFPROBE_EXE` trong runtime settings hoặc env.
2. Binary từ `@ffmpeg-installer/ffmpeg` và `@ffprobe-installer/ffprobe` nếu đã cài.
3. Fallback `ffmpeg` / `ffprobe` từ PATH.

Sau khi apply patch, chạy:

```bash
npm install
npm run build
npm run build:server
npm run dist:win:nsis
```

## Lưu ý vận hành local

- Lịch đăng chỉ chạy khi app local đang mở.
- Không xóa video trong generated assets khi job còn chờ xử lý.
- Token Facebook/TikTok có thể hết hạn hoặc thiếu quyền; khi đó bấm kết nối lại provider.
- Không commit `server/data`, `SERVER_DATA_DIR`, token hoặc file history có chứa thông tin private.
