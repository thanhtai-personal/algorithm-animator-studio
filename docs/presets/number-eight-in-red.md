# Number Eight In Red preset

## Mục tiêu

Preset lyric-video toàn bài `Number Eight In Red` (03:48.4), lấy bài hát làm nội dung chính. Hình bóng đá chỉ là lớp hỗ trợ, dùng các trích đoạn ngắn từ video chính thức của Manchester United và luôn loại bỏ audio nguồn.

## Kịch bản hình

| Thời gian | Phần | Hướng dựng |
| --- | --- | --- |
| 00:00–00:15.6 | Opening hook | Clip goal chạy chậm, zoom nhẹ, title `NUMBER EIGHT IN RED`. |
| 00:15.6–00:43.8 | Verse 1 | Assist/player-cam, crop–pan và đường chuyền tactical theo nhịp. |
| 00:43.8–00:58.0 | Pre-chorus | Freeze frame để giảm chuyển động và đưa lyric lên trước. |
| 00:58.0–01:40.3 | Chorus 1 | Luân phiên goals/assists, beat pulse nhẹ và caption karaoke. |
| 01:40.3–02:08.5 | Verse 2 | Goal/shot clips, crop theo hướng dứt điểm. |
| 02:08.5–02:22.7 | Pre-chorus | Freeze frame lần hai, giữ vùng caption sạch. |
| 02:22.7–03:05.0 | Chorus 2 | Montage goals/assists, source audio vẫn muted. |
| 03:05.0–03:19.1 | Bridge | Freeze player-cam cho phần call-and-response. |
| 03:19.1–03:44.2 | Final chorus | Nhịp chuyển nhanh hơn, số 8 và tactical overlay tăng pulse. |
| 03:44.2–03:48.4 | Outro | Hold/fade và credit nguồn. |

## Lyric timing

Audio được đo ở khoảng **136 BPM**, beat đầu khoảng **1.486s**. Timing mặc định được sửa từ cách chia đều theo số caption sang các mốc bar/beat của từng section; opening bắt đầu ở beat đầu thay vì hiện lyric ngay từ 0s.

Mỗi cue có `id`, `start`, `end`. Màn hình Preset Video có editor để chỉnh riêng thời điểm xuất hiện/kết thúc; thay đổi được lưu cùng draft và dùng cho cả preview lẫn MP4 export. Nút play ở từng cue seek preview đúng về mốc start.

Đây là beat-alignment dựa trên tín hiệu audio, không phải forced alignment từ Whisper. Nếu cần khớp âm tiết tuyệt đối cho bản phát hành cuối, dùng editor để tinh chỉnh sau khi nghe lại.

## Nguồn video

Preset khai báo bốn nguồn YouTube chính thức của Manchester United:

- `Bruno Fernandes: 100 Goals!`
- `100 Bruno Fernandes United Assists`
- `Bruno Fernandes: Top 20 Goals!`
- `Player Cam | Bruno Fernandes`

Mỗi nguồn chỉ yêu cầu một đoạn **12 giây**. Preset này dùng `videoSourceStrategy: "local"` để tránh phụ thuộc `yt-dlp`: tại màn hình Preset Video, chọn file video đầy đủ tương ứng cho từng nguồn. Backend dùng FFprobe kiểm tra thời lượng, FFmpeg tự seek/cắt đúng mốc cấu hình, chuyển H.264 MP4, bỏ audio (`-an`) và cache dưới `generated-videos/preset-clips/number-eight-in-red/`.

Khi mở lại preset, backend chỉ đọc các clip đã cache và **không gọi YouTube**. Nếu clip còn thiếu, UI hiển thị từng nguồn cần chọn và khóa Export MP4 cho đến khi đủ 4 clip. Chọn lại một file sẽ thay clip cache của nguồn đó. Thumbnail chỉ còn là fallback trong preview khi clip chưa sẵn sàng.

## Output dọc/ngang

- `Shorts · Portrait`: 1080×1920 hoặc 720×1280. Composition chuyển sang crop 9:16, title/header/caption dùng safe spacing theo portrait.
- `Long-form · Landscape`: 1920×1080 hoặc 1280×720. Composition dùng bố cục 16:9 rộng.
- Square vẫn được giữ để không phá output cũ.

Preview portrait bị giới hạn theo chiều cao viewport nên không còn kéo Player vượt khỏi một screen view. Duration export vẫn theo vùng trim mà người dùng chọn; đổi orientation không tự ý cắt bài hát.

## Render progress

`/api/video/render-preset` trả NDJSON progress theo các stage `preparing → metadata → rendering/muxing → verifying`. UI hiển thị progress bar và phần trăm thực từ Remotion, không dùng fake timer.

## Cách giảm mức độ tái sử dụng nội dung nguồn

- Chỉ lấy trích đoạn ngắn đã cấu hình, không nhúng nguyên highlight.
- Loại bỏ hoàn toàn audio của video nguồn.
- Clip được crop, slow/freeze, color-grade, tactical overlay và lyric overlay.
- Credit `@manutd source clip` luôn hiển thị.
- Bài hát do người dùng cung cấp là audio chính.

Các biện pháp này giảm mức độ re-upload nguyên bản nhưng không tự động bảo đảm một trường hợp cụ thể được xem là fair use.

## Asset âm thanh

WAV người dùng cung cấp được transcode sang MP3 256 kbps tại:

`public/preset-assets/number-eight-in-red.mp3`

Preset khai báo `hasOriginalAudio: true`, vì vậy slider `Original audio` trong Preset Video Workspace điều chỉnh trực tiếp âm lượng bài hát.
