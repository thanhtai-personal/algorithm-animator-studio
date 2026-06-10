# Remotion video engine integration

Mục tiêu: thêm Remotion như một render engine mới cho màn `Video Create`, không thay thế pipeline Canvas/MediaRecorder hoặc FFmpeg hiện có.

## Cài package

Sau khi apply patch, chạy trong root source:

```bash
npm install remotion@latest @remotion/player@latest @remotion/renderer@latest @remotion/bundler@latest @remotion/media@latest --save-exact
```

Các package `remotion` và `@remotion/*` nên cùng version.

## Chạy dev

```bash
npm run dev
```

Mở app tại `/video-create`. Panel mới **Remotion video generator** sẽ xuất hiện phía trên upload/library.

Có thể mở Remotion Studio riêng để debug composition:

```bash
npm run dev:remotion
```

## API mới

- `GET /api/video/remotion/health`
- `POST /api/video/render-remotion`

Render xong, MP4 được lưu vào cùng thư mục `generated-videos` và tự hiện trong thư viện video.

## Cấu trúc file chính

```txt
src/features/remotion-video/
  components/RemotionVideoGenerator.tsx
  lib/remotionVideoApi.ts
  lib/remotionVideoTypes.ts
  remotion/index.ts
  remotion/Root.tsx
  remotion/AlgorithmExplainerComposition.tsx

server/models/RemotionVideo.ts
server/services/RemotionRenderService.ts
server/routes/videoRoutes.ts
```

## Hướng mở rộng tiếp theo

1. Thêm nhiều composition: `NewsVideoComposition`, `StoryVideoComposition`, `ShortsCaptionComposition`.
2. Cho chọn ảnh/video/voice từ thư viện generated assets.
3. Thêm subtitle theo timestamp.
4. Thêm render queue/progress/cancel job.
5. Gắn Remotion làm output option cho MU News, Story Video và Algorithm Long.
