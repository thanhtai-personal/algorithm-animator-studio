# Task 04 — Phân tích video gốc 00:40–10:09

**Trạng thái:** Source-audited at 5-second thumbnail level + 0.2-second change-candidate scan. **Không phải edit-decision list chính xác tới từng frame.**  
**File gốc:** `FDown.vn_Tai_video_Facebook_720p (HD)_0dc1.mp4` (SHA256 `d6e5123f38293abd35b34c48b9b3d61127e5f99f9a01622ebae176e00ef0f1a5`)  
**Video:** 1280×720, 25 FPS, 15.217 frame, phần video 608,68 giây.  
**Kết quả chính:** [scene-manifest.json](math-sincos-v1.scene-manifest.json): 12 chương, **36 visual beats trong [1000, 15217)**, không bỏ/chồng frame. Math Video Studio đọc **cùng manifest** để điều khiển chapter navigation và scene renderer.

## 1. Phương pháp xác minh

1. Đọc file MP4 H.264 gốc (không dùng MP4 đã tái dựng), kiểm tra frame count/FPS/metadata.
2. Lấy **114 ảnh thumbnail cách nhau 5 giây**, từ 00:40 đến khoảng 10:05; ghép thành 4 contact sheet để quan sát nội dung thay đổi.
3. Quét toàn bộ frame video, lấy mẫu mỗi 5 frame (0,2 giây) sau khi thu nhỏ về 224×126. Tính sai khác RGB theo thời gian và mật độ foreground; tìm **ứng viên chuyển cảnh**. Đây chỉ là bộ phát hiện sự kiện hình ảnh: highlight, quay tròn hoặc chuyển động lớn cũng có thể tạo peak.
4. Đối chiếu các candidate mạnh bằng cặp ảnh trước/sau cách peak 0,6 giây, kiểm tra bằng mắt nhóm chủ đề ở xung quanh các mốc.
5. Ghi rõ bằng chứng/mức độ tin cậy cho mỗi chapter và beat trong JSON. Vì đa số chuyển động liên tục, ranh giới một số beat là **chọn mốc dựng hợp lý**, không khẳng định chính xác frame cắt.

**Độ phân giải của bằng chứng:** 0,2 giây (= 5 frame) với peak chuyển động mạnh; khoảng 5 giây (=125 frame) cho những đoạn chỉ xác định qua thumbnail. **Không thể suy ra giọng đọc/phụ đề/timing âm thanh** chỉ từ ảnh; Task 06 xử lý với nguồn audio hợp lệ.

## 2. Chapter map đã sửa so với mã nguồn cũ

| Chapter | Khoảng tham chiếu mới | Nội dung quan sát |
| --- | --- | --- |
| Intro → circle | 00:40–00:43 → 00:43 | Trục góc, mất hình, đường tròn xuất hiện |
| Circle | 00:43–02:20.2 | Hệ trục, sin/cos qua hình chiếu, góc 120°, dấu cos và đối xứng |
| Identity | 02:20.2–02:41.6 | `sin² α + cos² α = 1`, dựng diện tích hai bình phương |
| Wave/radian | 02:41.6–03:39.6 | Chuyển động tròn thành sóng sin; radian; sin và cos lệch pha |
| Complement | 03:39.6–03:52 | Tam giác, `cos α = sin(90° − α)` |
| Tangent | 03:52–04:55 | `tan = sin / cos`, tiệm cận, đường tan |
| History | 04:55–05:45.6 | Dây cung/chord, lịch sử tên gọi `jyā`, `sinus`, `sin` |
| Sound | 05:45.6–06:07.2 | Âm thoa, dao động sóng, logo Vô Hạn và chuyển đoạn |
| Astronomy | 06:07.2–06:38.4 | Bóng Mặt Trời, địa cầu, vĩ độ và góc chiếu |
| Practical heights/slopes | 06:38.4–08:27.8 | Thủy triều, cây/tan, dốc xe lăn, % độ dốc |
| Electricity | 08:27.8–09:17.8 | Điện ba pha 50 Hz, sóng lệch pha, 220/380 V |
| Final | 09:17.8–10:08.68 | Người que, trắc nghiệm `sin 120°`, phép chiếu và outro |

**Các mốc là candidate 5-frame hoặc hình ảnh quan sát**, không phải hard cut đã được chứng minh chính xác. Đặc biệt đoạn 00:40–00:43 là chuyển tiếp giữa Task 03 và Task 04, không tự tách thành cảnh chính xác tại frame 1000.

## 3. Kết quả và sai khác quan trọng

- **Trước Task 04:** renderer khởi chạy Identity ở **01:50** và kết thúc lúc 02:50, trong khi nguồn bắt đầu trình bày rõ `sin²+cos²=1` gần **02:20** và chuyển cảnh khoảng **02:41**.
- Renderer cũ dồn mọi ứng dụng vào một cảnh "height" khoảng 07:05–08:25. Nguồn có **thủy triều, đo cây, dốc xe lăn và độ dốc phần trăm** liên tiếp từ khoảng **06:38 đến 08:28**.
- **Radian và lịch sử tên gọi** xuất hiện ở hai khoảng khác nhau: minh họa radian quanh 03:10 và lịch sử `sin` quanh 04:55–05:45; không gộp hai nhịp vào một scene.
- Chương điện ba pha bắt đầu gần **08:28**, không phải 08:25, và kết thúc khoảng 09:18.
- Phần chốt luận và quiz cần tách beat riêng **09:18–10:02**; outro khoảng **10:02–10:08.68**.

## 4. Hướng dẫn triển khai Task 05

Đọc `scene-manifest.json.referenceBeats` theo thứ tự. Mọi beat ghi `startFrame` (inclusive) và `endFrame` (exclusive), `chapterId`, `boundaryBasis`, `confidence`, cue visual và tình trạng audio. Tái dựng animation **không phát video nguồn**, đối chiếu ảnh tại các frame đầu/cuối và ít nhất một frame nội bộ của từng beat.

- Nếu beat có `confidence=source-observed-candidate-plus-or-minus-5-frames`: kiểm tra source lân cận ±5 frame để chốt thực sự khi code.
- Nếu là `source-observed-approximate-plus-or-minus-125-frames`: tìm mốc thoại/transition thật bằng nguồn khi thực hiện phân cảnh, không sử dụng mốc như bằng chứng tuyệt đối.
- Đối chiếu cấu trúc/hình học trước: circle, square, triangle, waveform, vector, character. Không tự tạo nhân vật/đồ họa khác chỉ vì renderer đã hỗ trợ.
- Những đoạn không thu thập được audio/lời nói **không suy diễn câu thoại**. Do v1 không trộn giọng đọc có quyền chưa được cung cấp, giữ QA âm thanh ở trạng thái chưa xác minh.
- Giữ cấu trúc JSON và build/test guards; chạy `npx vitest run src/features/math-video/__tests__`, `npm run build`, render PNG ở beat boundaries để so sánh. Không merge PR trước QA.

## 5. Nghiệm thu Task 04

- [x] Source MP4 thật được đọc và kiểm tra metadata, không sử dụng bản Remotion làm nguồn timeline.
- [x] 4 contact sheet tại khoảng 5 giây và 2 tấm before/after peak được tạo trong phiên phân tích.
- [x] Đã phân loại **36 beat [1000,15217)** theo 12 nhóm và lưu manifest với confidence.
- [x] Renderer/player được cấu hình đọc chapter từ manifest thay vì copy mốc riêng.
- [ ] **Chưa** xác định/duyệt tất cả ranh giới đến đúng 1 frame; đánh dấu chưa chứng minh trong manifest.
- [ ] **Chưa** có transcript/chốt timing audio.
- [ ] **Chưa** hoàn thiện fidelity các cảnh 00:40–10:09 (Task 05).

**Task 04 hoàn thành ở mức phân tích có bằng chứng để bắt đầu code Task 05**, không có nghĩa toàn bộ timing đã pixel-perfect hoặc video tái dựng xong.
