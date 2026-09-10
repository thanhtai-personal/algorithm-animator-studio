# KAI Remote cho Windows

KAI Remote là ứng dụng desktop độc lập chạy Telegram Remote Control mà không cần mở KAI STUDIO. Backend chỉ lắng nghe tại `127.0.0.1:8891`; cửa sổ có thể đóng xuống system tray trong khi bot tiếp tục chạy.

## Yêu cầu để build

- Windows 10/11 x64.
- Node.js 20 trở lên và npm.
- Internet trong lần cài dependency/Electron đầu tiên.
- Không chạy một KAI Remote khác trên port `8891` trong lúc preview.

Từ Command Prompt hoặc PowerShell:

```bat
cd /d C:\DATA\working\sources\video-creator-tools\algorithm-animator-studio-pro
npm install
```

## Chạy ở chế độ phát triển

```bat
npm run dev:remote
```

Mở `http://127.0.0.1:3891`. Chế độ này kiểm tra UI và bot nhưng không có system tray/startup API của Electron.

## Build và preview app desktop

```bat
npm run build:remote
npm run remote:preview
```

`build:remote` tạo:

```text
dist-remote/                         UI riêng của KAI Remote
dist-electron/remote-server/index.js backend Remote Control riêng
```

Trong preview, chức năng bot và tray hoạt động. Tùy chọn khởi động cùng Windows chỉ bật trong bản đã đóng gói.

## Xuất ứng dụng Windows

Build thư mục unpacked để smoke test nhanh:

```bat
npm run dist:remote:win:unpacked
```

Build installer NSIS:

```bat
npm run dist:remote:win:nsis
```

Output riêng nằm tại:

```text
release\remote-win\
```

Chạy file `KAI-Remote-<version>-x64.exe` để cài đặt. Installer dùng app ID `vn.kaistudio.remote`, shortcut `KAI Remote`, và không ghi đè KAI STUDIO.

## Thiết lập Telegram Remote Control

1. Tạo bot bằng BotFather và sao chép bot token.
2. Lấy numeric Telegram user ID của bạn.
3. Mở KAI Remote từ Desktop hoặc Start Menu.
4. Nhập token, thêm user ID vào allowlist và bật **Telegram Remote Control**.
5. Có thể cấu hình Ollama localhost, app alias và power actions.
6. Bấm **Lưu Remote settings** và kiểm tra badge hiển thị bot đang chạy.

Dữ liệu cũ được dùng lại tại `%LOCALAPPDATA%\KAI STUDIO`:

```text
remote-control.json
remote-control.env
remote-control-audit.log
```

Token không được trả về renderer hoặc ghi vào log.

## Khởi động cùng Windows

1. Mở KAI Remote.
2. Trong thẻ **Ứng dụng Windows**, bật **Khởi động cùng Windows**.
3. Đăng xuất/đăng nhập lại để kiểm tra.

App đăng ký chính executable đã cài với tham số `--hidden`. Sau khi đăng nhập Windows, bot chạy nền và chỉ hiện icon ở system tray. Tắt switch để gỡ đăng ký startup.

## Dùng system tray

- Bấm nút đóng cửa sổ: cửa sổ ẩn, bot vẫn chạy.
- Bấm icon KAI Remote ở tray hoặc chọn **Mở KAI Remote**: hiện lại cửa sổ.
- Có thể bật/tắt startup ngay trong menu tray.
- Chọn **Thoát** trong menu tray: dừng hoàn toàn KAI Remote và bot.

Windows có thể gom icon vào vùng **Show hidden icons**; kéo icon KAI Remote ra taskbar nếu muốn luôn nhìn thấy.

## Khắc phục lỗi

### Port 8891 đang được sử dụng

```bat
netstat -ano | findstr :8891
tasklist /fi "PID eq <PID>"
```

Thoát KAI Remote cũ bằng menu tray. Chỉ kill PID khi đã xác định đúng tiến trình.

### Không thấy icon tray

Mở **Show hidden icons** trên taskbar. Nếu app đã thoát, mở lại từ Start Menu.

### Startup không hoạt động

- Startup chỉ được đăng ký từ bản installer/unpacked đã đóng gói, không phải trang dev trong trình duyệt.
- Tắt rồi bật lại **Khởi động cùng Windows**.
- Kiểm tra Task Manager → Startup apps và quyền của tài khoản Windows.

### Bot báo stopped

Kiểm tra token, allowlist và kết nối tới `api.telegram.org`. Nếu dùng Ollama, endpoint phải là localhost và model phải tồn tại. Xem thêm [Telegram Remote Control](./telegram-remote-control.md).

## Checklist phát hành

```bat
npm run test -- --run src/test/KaiRemoteDesktop.test.ts src/test/KaiRemoteDesktopCard.test.tsx src/test/KaiRemoteServer.test.ts src/test/RemoteControlConfigService.test.ts src/test/RemoteControlOllamaService.test.ts
npm run build:remote
npm run build
npm run dist:remote:win:unpacked
```

Trên Windows thật, kiểm tra thêm: installer, mở app, close-to-tray, menu **Thoát**, bật startup, đăng xuất/đăng nhập và bot phản hồi `/status`.
