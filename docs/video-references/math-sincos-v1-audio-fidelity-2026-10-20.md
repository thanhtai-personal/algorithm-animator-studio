# V1 — Sửa sai lệch hình và đặt audio nguồn làm mặc định (20/10/2026)

## Âm thanh người dùng cung cấp

- File đầu vào: `FDown.vn_Tai_video_Facebook_MP3_c81d.mp4`, thực chất là **MP3 audio-only**, không có video.
- SHA256: `cbb844b08bf024fc9120660b2a72d4504c040552128192f887a6493d66a982ec`.
- 48.000 Hz, hai kênh, 608,712s; video gốc có 15.217 frame / 25fps = 608,680s. Chênh 32ms cuối track.
- Đã đối chiếu waveform trực tiếp với âm thanh trong MP4 tham chiếu ở 10s, 120s, 300s, 500s và 590s. Lệch thời điểm **đồng nhất khoảng 20ms**; tương quan ~0,97; **không trôi timeline**. Không tự kéo giãn/chỉnh tốc độ.
- V1 nhận file âm thanh do người dùng nhập vào **KAI STUDIO `/videos/math`**, lưu vĩnh viễn trong Generated Audio dưới `math-v1-default/` và cấu hình metadata; GET nạp mặc định lần sau.
- Trong màn hình, track này được ưu tiên trước TTS tự sinh khi tùy chọn "dùng audio gốc" bật; dùng cho cả preview và xuất MP4. Khi tắt tùy chọn mới cho dùng track TTS.
- **Không commit tài liệu âm thanh có bản quyền vào GitHub.** File được gửi trong phiên ChatGPT không tự xuất hiện trên ổ đĩa máy cài KAI STUDIO: người dùng cần **chọn tệp và nhập một lần** trong giao diện, hoặc chủ động sao chép vào dữ liệu dịch vụ. Bản sao ổn định từ UI lưu qua API.
- Backend dùng FFprobe nhận dạng codec thực, ngay cả khi file .mp4 là MP3 giả đuôi; giới hạn upload 40MiB, cấm video stream và từ chối file khác thời lượng hơn 1 giây.

## Những sai khác nguồn đã sửa bằng code

Đối chiếu ảnh thật tại các mốc 43s, 150/160s, 250s, 392s, 480s, 510/532s và 575/595s:

| Mốc | Sai trong bản trước | Sửa trong renderer v1 |
|---|---|---|
| 00:43 | Đường tròn xuất hiện ngay | Trục xuất hiện trước; đường tròn bắt đầu sau |
| 02:30–02:40 | Hình vuông màu cyan/orange ở sai vị trí và kích thước | Căn lại đường tròn (427,467), r=173, đỉnh 120°, hai hình vuông biến đổi theo beat |
| 04:10 | Tiêu đề tang và tâm đường tròn lệch | Dời tâm về (306,440), r=133, đưa tiêu đề về x=53, ray lên đúng (416,109) |
| 06:32 | Địa cầu và Mặt Trời nhỏ/sai vị trí, thiếu bóng 38 cm | Địa cầu (644,359), r=184, Mặt Trời (271,554), bổ sung góc Hà Nội, góc chiếu và nhãn mùa |
| 08:00 | Dùng đồ thị dốc lớn ở lúc nguồn chỉ có tam giác và nhân vật | Thay bằng tam giác nhỏ bên trái, dốc lớn hiển thị về sau |
| 08:30 | Hiện sóng điện ba pha khi nguồn mới có vòng tròn | Trì hoãn các vectơ và sóng; vòng tròn ban đầu ở (214,339) |
| 09:35–09:55 | Hình góc phần tư, ghi chú, người que và bảng quiz lệch | Đặt lại hình góc phần tư, danh sách ghi nhớ, vòng tròn và bảng kiểm tra |

Cập nhật unit tests từng mốc ở `mathReferenceScenes.test.tsx`. Bản dựng vẫn còn nhiều chênh chi tiết ở các khung hình khác — đây là đợt sửa có chọn lọc, **không được tuyên bố pixel-perfect**.

## Kiểm chứng

- File ghép audio tạm trên container từ **bản MP4 v1 cũ** đạt 15.217 frame video/25 FPS, H.264 và MP3 608,688s sau mux (video 608,680s). Đây là **preview kiểm tra âm thanh**, không phải video render lại các commit hình mới.
- GitHub-hosted Actions vẫn gặp lỗi trước lúc chạy steps. **Chưa có build frontend/server thành công trên commit vừa sửa**, chưa thể xác nhận ảnh Remotion mới từ CI.
- Phải kiểm tra upload default trên máy KAI STUDIO thực tế; user chưa cần xác nhận bản quyền đến lúc xuất bản công khai.
