# Spec: KAI Remote desktop app

## Objective

Tách màn hình **Settings → Remote** và Telegram Remote Control khỏi KAI STUDIO thành ứng dụng Windows độc lập tên **KAI Remote**. Ứng dụng tự chạy backend Remote Control trên localhost, tiếp tục hoạt động khi cửa sổ bị đóng xuống system tray, và có thể được cấu hình khởi động ẩn cùng Windows.

Người dùng hiện tại giữ nguyên bot token và cấu hình vì app mới tiếp tục đọc dữ liệu Remote Control trong `%LOCALAPPDATA%\KAI STUDIO`.

## Acceptance criteria

- `KAI Remote.exe` chạy độc lập khi KAI STUDIO chưa mở.
- App chỉ khởi động backend, API và UI cần cho Remote Control; không khởi động voice, video, publish worker hoặc toàn bộ KAI STUDIO.
- UI hiện tại cho phép cấu hình bot Telegram, allowlist, Ollama, app aliases và power actions.
- Đóng cửa sổ sẽ ẩn app xuống Windows system tray; menu tray có Mở KAI Remote, Khởi động cùng Windows và Thoát.
- Khi bật khởi động cùng Windows, app đăng ký login item và lần đăng nhập sau chạy với cửa sổ ẩn.
- App chỉ cho phép một instance; mở lần hai sẽ hiện cửa sổ instance đang chạy.
- Installer NSIS và bản unpacked được xuất riêng, không ghi đè installer KAI STUDIO.
- KAI STUDIO không còn khởi động Telegram Remote Control, tránh hai tiến trình long-poll cùng một bot token.
- Có tài liệu tiếng Việt về build, cài đặt, tray, startup và cách xử lý lỗi.

## Tech stack

- React 18 + TypeScript + Vite cho renderer riêng.
- Electron 42 cho cửa sổ, system tray, single-instance và Windows login item.
- Express 5 cho backend loopback-only.
- electron-builder/NSIS cho installer Windows x64.
- Vitest cho logic có thể kiểm thử độc lập.

## Commands

```bat
npm run dev:remote
npm run test -- --run remote-control-app/test
npm run build:remote
npm run remote:preview
npm run dist:remote:win:unpacked
npm run dist:remote:win:nsis
npm run build
python3 scripts/context_index.py check
```

## Project structure

```text
remote-control-app/src/        Renderer shell và desktop preferences của KAI Remote
remote-control-app/server/     Express composition root chỉ dành cho Remote Control
remote-control-app/electron/   Electron lifecycle, preload, tray và login item
remote-control-app/scripts/    Staging package và build verification
remote-control-app/README.md   Hướng dẫn build/cài đặt/sử dụng
remote-control-app/test/      Unit/component tests liên quan
```

Component React được chuyển thành `remote-control-app/src/RemoteControlSettings.tsx`; shell mới chỉ thêm tiêu đề, trạng thái desktop và tùy chọn startup. IPC desktop được khai báo bằng type rõ ràng, không bật `nodeIntegration` trong renderer.

## Code style

```ts
export type RemoteDesktopPreferences = {
  launchAtLogin: boolean;
  packaged: boolean;
  platform: string;
};

export async function getRemoteDesktopPreferences() {
  return window.kaiRemote.getPreferences();
}
```

- Tên component/type dùng PascalCase; function/variable dùng camelCase.
- Ưu tiên hàm nhỏ, contract rõ, không tạo abstraction dùng một lần.
- File source mới hoặc được chạm không vượt quá 400 dòng.

## Testing strategy

- Unit test cho chuẩn hóa trạng thái startup, tham số `--hidden` và contract preferences nếu logic được tách thành hàm thuần.
- Component test cho shell KAI Remote: render màn hình cấu hình và trạng thái desktop khi IPC có/không khả dụng.
- Tiếp tục chạy các test Remote Control hiện có để bảo toàn whitelist và validation.
- Build riêng phải kiểm tra đủ renderer, remote server bundle, Electron main/preload và cấu hình installer.
- `npm run build` cuối cùng phải pass theo guardrail của repository.
- Tray và Windows startup cần smoke test trên Windows thật; môi trường WSL/Linux chỉ xác minh build/static contract.

## Boundaries

### Always

- Chỉ bind HTTP server vào `127.0.0.1`.
- Giữ nguyên allowlist và giới hạn Remote Control hiện có; không thêm remote shell.
- Dùng `contextIsolation: true`, `nodeIntegration: false` và preload API tối thiểu.
- Dùng app ID, product name và output directory riêng cho KAI Remote.
- Giữ/migrate dữ liệu Remote Control hiện tại mà không log bot token.

### Ask first

- Đổi vị trí lưu dữ liệu hoặc xóa cấu hình/token hiện có.
- Giữ Telegram polling đồng thời trong cả KAI STUDIO và KAI Remote.
- Thêm cơ chế cập nhật tự động hoặc ký code installer.

### Never

- Không mở backend ra LAN/Internet.
- Không cho phép Telegram chạy lệnh CMD/PowerShell tùy ý.
- Không commit secret, bot token hoặc dữ liệu user.
- Không hoàn nguyên hay gộp các thay đổi có sẵn trong worktree.

## Implementation plan

1. Tạo test/contract và backend Remote Control tối giản; xác minh test hiện có.
2. Tạo renderer entry riêng trong `remote-control-app`; tái sử dụng màn hình cấu hình hiện tại.
3. Tạo Electron main/preload riêng với single-instance, tray, close-to-tray và login item.
4. Tạo electron-builder config/scripts riêng và build verification.
5. Ngắt composition root Remote Control khỏi KAI STUDIO sau khi app riêng hoạt động.
6. Viết hướng dẫn Windows, cập nhật context index, chạy test và full build.

## Delivery tasks

- [x] Backend độc lập chỉ chứa `/api/remote-control/settings` và health endpoint.
- [x] Renderer KAI Remote build độc lập và không kéo App shell/video routes vào bundle.
- [x] Tray, close-to-tray, single-instance và startup IPC hoạt động.
- [x] Installer/unpacked commands tạo output riêng trong `remote-control-app/release/win`.
- [x] KAI STUDIO ngừng sở hữu Telegram polling.
- [x] Tài liệu cài đặt và checklist smoke test Windows hoàn tất.
- [x] Remote tests, build verification, context-index check và `npm run build` pass.

## Resolved decision

KAI STUDIO đã bỏ mục **Settings → Remote** và không còn chạy Telegram bot. Toàn bộ quyền sở hữu Remote Control được chuyển sang KAI Remote để tránh xung đột Telegram long polling.
