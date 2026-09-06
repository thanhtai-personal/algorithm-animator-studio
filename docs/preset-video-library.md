# Preset Video Library

`/videos/presets` là kho các video preset được định nghĩa bằng source code và được thêm vào Kai Studio qua git patch.

## Luồng chính

```text
AI tạo source preset
-> git patch
-> đăng ký preset trong presetVideoRegistry
-> preset xuất hiện trong Preset Video Library
-> preview / đổi output size / trim / chọn nhạc
-> Remotion render MP4
-> Generated Assets
```

Preset source là immutable từ UI. Các thay đổi trong workspace chỉ là export settings được lưu theo `presetId` trong local storage.

## Thêm preset mới bằng git patch

1. Tạo component React/Remotion nhận `PresetVideoCompositionProps`.
2. Tạo `PresetVideoDefinition` gồm metadata, duration, FPS, output mặc định và capability original audio.
3. Import definition vào `src/features/preset-video/presetVideoRegistry.ts`.
4. Thêm definition vào `PRESET_VIDEO_REGISTRY`.

Ví dụ tối thiểu:

```tsx
import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../types";

function MyPreset(props: PresetVideoCompositionProps) {
  return <div>{props.presetId}</div>;
}

export const myPreset: PresetVideoDefinition = {
  id: "my-preset",
  name: "My Preset",
  description: "Code-generated video preset.",
  tags: ["custom"],
  accentColor: "#38bdf8",
  defaultDurationSeconds: 15,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: false,
  component: MyPreset,
};
```

Background music được composition wrapper dùng chung của Kai Studio chèn vào tự động. Nếu preset có original audio, component dùng `props.originalAudioVolume` khi render audio gốc và đặt `hasOriginalAudio: true`.

Không cần sửa page Library, route hoặc backend render cho từng preset mới.

## Export settings hiện hỗ trợ

- Landscape 1920x1080 và 1280x720.
- Portrait 1080x1920 và 720x1280.
- Square 1080x1080.
- Trim start/end.
- Music Library hiện tại và music volume.
- Original audio volume khi preset khai báo có audio.
- Reset về defaults.
- Quick Export không cần mở workspace.

Output dùng `createVideoOutput` hiện có nên tiếp tục xuất hiện trong Generated Assets.
