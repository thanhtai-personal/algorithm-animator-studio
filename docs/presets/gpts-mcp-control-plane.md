# GPTs MCP — Codex hết token, việc vẫn chạy

Preset `gpts-mcp-control-plane` là reel dọc 53 giây. Video Facebook do người dùng cung cấp được dùng để tham khảo nhịp trình bày: nền tối, tiêu đề ngắn, minh họa màn hình và CTA cuối. Nội dung sản phẩm được đối chiếu với `https://gpts-mcp.vercel.app/` ngày 13/09/2026.

| Giây | Vai trò | Lời đọc tiếng Việt |
| --- | --- | --- |
| 0–5 | Hook: ảnh Codex báo hết lượt dùng | Đang code thì Codex báo hết token. Việc vẫn chưa xong. Bạn làm gì? |
| 5–12 | Chuyển workflow | Mở Custom GPT đã kết nối GPTs MCP Gateway, rồi tiếp tục yêu cầu ngay trong chat. |
| 12–20 | Giới thiệu Gateway | Gateway là lớp trung gian giữa GPT và MCP: giữ quyền truy cập, rồi route yêu cầu tới provider. |
| 20–30 | Cấu hình Custom GPT | Nạp Integration Kit và Action schema vào GPT. GPT giữ mục tiêu, Gateway mở công cụ phù hợp. |
| 30–39 | Runtime và quyền truy cập | Gateway tìm service, tool và schema ở runtime trước khi gọi. Open ID kiểm tra quyền; provider key ở server. |
| 39–46 | Tiếp tục công việc | Codex tạm dừng, nhưng phiên GPT vẫn có thể tiếp tục workflow qua MCP tools. |
| 46–53 | CTA | Thử GPTs MCP Gateway tại gpts-mcp.vercel.app. Tải Integration Kit miễn phí và kết nối GPT của bạn. |

Media đã cắt gọn từ `C:\Users\Kai.Tran\Videos\code-lab\GPTs tech` và nằm trong `public/preset-assets/gpts-mcp-control-plane`:

| Asset | Nguồn | Đoạn nguồn |
| --- | --- | --- |
| `codex-token-limit.png` | `screen shot\00.png` | Cắt vùng cảnh báo Codex, không chứa vùng cấu hình key |
| `gateway-intro.mp4` | `screen-recording-20260912-195358.webm` | 00:07–00:15 |
| `gpt-action.mp4` | `screen-recording-20260912-195936.webm` | 02:01–02:11 |
| `gateway-services.mp4` | `screen-recording-20260912-195358.webm` | 00:49–00:58 |
| `gpt-conversation.mp4` | `screen-recording-20260912-225744.webm` | 15:50–15:57 |

Các clip được tắt âm thanh gốc để lời đọc không bị chồng. Lời đọc nằm trong `editableLyrics` của preset; sau khi cập nhật preset, tạo voice-over từ panel TTS trước khi xuất video có giọng đọc. `lyricTimingRevision: 2` đặt lại lời cũ và bỏ audio đã lưu từ phiên bản kịch bản trước để tránh xuất âm thanh lệch nội dung. Video nói workflow **có thể** tiếp tục qua GPT và Gateway; nó không ngụ ý Codex được nạp thêm token hoặc một task cụ thể đã hoàn tất.

Typography của preset dùng Be Vietnam Pro variable font, đóng gói tại `src/features/preset-video/presets/gpts-mcp-promo/font` cùng giấy phép SIL OFL 1.1. Font được lấy từ [repository của tác giả](https://github.com/bettergui/BeVietnamPro) để dấu tiếng Việt hiển thị ổn định trong preview và bản render.
