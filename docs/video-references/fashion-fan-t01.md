# T01 — Phân tích video tham chiếu Fashion Fan

> **Trạng thái:** Phân tích tài liệu, KHÔNG sửa sản phẩm. Nguồn là clip người dùng cung cấp ngày 19/10/2026. Thông số media từ FFprobe; mốc sự kiện và hình học là quan sát thủ công ở độ phân giải gốc.  
> **Source of truth khi dựng lại:** `fashion-fan-t01.reference.json`. Frame index bắt đầu từ 0.

## 1. Media metadata

- Video H.264 / AAC, kích thước **360 × 640** (9:16); **30 FPS**.
- Có **296 frame**, chỉ số **0…295**; timestamp frame cuối `295/30 = 9.8333s`; duration container **9.867007s**. Phép đổi: `seconds = frame / 30`.
- SHA-256 của hai tên bản upload trùng nhau: `dd4b1b227ddc44eb173e265e8326e9437d5eaffb61ed3c7d4a32e31055e8bead`.
- Bộ storyboard 20 hình, ảnh lưới 4 mốc và 34 frame JPEG được lưu trong gói `fashion_fan_T01_reference.zip` của phiên làm việc, **không commit clip/ảnh frame gốc vào repository**.

## 2. Bố cục và tọa độ

Hệ tọa độ lấy `(0,0)` ở góc trên-trái frame 360×640. Tất cả bbox bên dưới là **ước lượng bằng quan sát**, dùng để bắt đầu đối chiếu T02/T03, không phải tọa độ tracking chính xác.

| Layer | Vị trí/khung ước lượng | Tham chiếu |
|---|---|---|
| Thảm | Toàn frame, xanh xanh-xám có vân mịn | Frame 27, 154, 214, 272 |
| Sofa cong hồng | `x=0..103`, `y≈150..591`; lấn khỏi cạnh trái | Frame 27, 154 |
| Đầu quạt kim loại | `x≈43..323`, `y≈0..116`; cắt bởi mép trên; hub gần `x=180` | Frame 27, 154 |
| Cánh quạt | Ba cánh chung một trục, lớn, quét qua phần người; có blur/ghosting | Frame 114–147, 182–194, 245–260 |
| Remote trắng | Cạnh phải người mẫu, cỡ `x≈287..326, y≈311..338` trong look đen; vị trí tương đối thay đổi do khung hình | Frame 27 |
| Người mẫu đầm đen | Đầu quanh `x≈180, y≈190`, váy giữa frame, chân đến `y≈570` | Frame 27 |
| Túi | Xuất hiện/đổi màu theo outfit: champagne hồng, silver xanh nhạt, pink hồng | Frame 153, 194, 272 |

**Lưu ý camera:** Góc nhìn vẫn top-down, nhưng khoảng **6.7–8.1s hình phóng gần**, nhân vật chiếm tỷ lệ khung lớn hơn; khi chuyển sang hồng hình thu về. Không giả định camera hoàn toàn tĩnh hoặc scale nhân vật cố định toàn thời lượng.

## 3. Timeline 296 frame

| Đoạn | Frame | Thời gian (s) | Nội dung quan sát |
|---|---:|---:|---|
| Entrance | 0–24 | 0–0.800 | Người mẫu **lăn từ sofa bên trái vào thảm**, không rơi xuống từ mép trên; dần nằm thẳng |
| Đầm đen/trắng | 24–132 | 0.800–4.400 | Cử động tay/chân/tóc, đổi dáng, váy đen phối cổ và tay trắng |
| Che đổi 1 | **132–147** | **4.400–4.900** | Cánh quạt lớn quét qua với ghosting; sang đầm champagne, giày trắng và túi hồng |
| Đầm champagne | 147–182 | 4.900–6.067 | Đầm ánh kim thêu/hạt, người mẫu kê hai tay sau đầu |
| Che đổi 2 | **182–194** | **6.067–6.467** | Cánh quạt che giữa người; sang đầm xanh bạc và túi xanh nhạt |
| Đầm xanh bạc | 194–245 | 6.467–8.167 | Co/bắt chéo chân, tay gần mặt; **zoom-in** ở phần giữa |
| Che đổi 3 | **245–260** | **8.167–8.667** | Quạt lướt qua, sang váy hồng bồng, túi hồng; **zoom-out** |
| Đầm hồng | 260–295 | 8.667–9.833 | Dang hai tay, chân bắt chéo và tạo dáng kết |

**Quan trọng:** Các mốc che đổi là **cửa sổ cần rà frame**, không phải “hard cut chắc chắn xảy ra ở frame đầu/cuối”. Video có lớp cánh bán trong suốt và mờ chuyển động: khó gán một cut frame duy nhất chỉ từ thumbnail. Nếu cần pixel-perfect, T05 phải thử khung liên tiếp và xác nhận cut khi cánh đang phủ phần thân người.

## 4. 20 khung mốc đã trích

`0, 12, 24, 60, 90, 114, 132, 141, 147, 153, 175, 188, 194, 214, 245, 251, 257, 272, 285, 295`.  
Ngoài ra có 34 frame chọn lọc trong ZIP ở độ phân giải gốc, cộng ảnh grid 30px theo X và 40px theo Y để đo hình học.

## 5. Các khác biệt xác nhận được với code hiện hành

- `src/features/preset-video/presets/fashion-claw/FashionClawComposition.tsx`: `OUTFIT_SWITCH_SECONDS=.96` và `beatIndex % outfits.length` đang đổi đều 0.96s, **sai nhịp gốc**. Dùng 3 cửa sổ thực ở phần 3.
- Composition đặt `translateY = -height * .68 * firstEntrance` → mô phỏng **rơi từ trên xuống**, khác hướng **lăn từ trái** của clip.
- Ảnh đứng/người mẫu vector chỉ là phương án dự phòng; T04 cần **chuỗi pose/animation người thật**, ảnh tĩnh xoay toàn bộ không đạt chuyển động tay/chân/tóc.
- `FashionStage.tsx` cần so lại tỉ lệ fan/sofa/remote. Fan quay quanh một hub có 3 cánh; tránh biến dạng cánh khi xoay.

## 6. Handoff & acceptance cho các task sau

- **T02 — Set:** đối chiếu screenshot tại frame 27, 153, 214, 272 theo lưới trước khi chỉnh motion; sofa phía trái giữ hình cong, remote và túi có mặt đúng giai đoạn.
- **T03 — Fan:** so vị trí tâm hub và độ phủ cánh ở frame 114, 141, 188, 251; kiểm tra bóng, đục/mờ và góc cánh; không được dùng cánh như wipe chữ nhật.
- **T04 — Model:** dựng động tác lăn từ trái (frame 0…24), ít nhất 3 nhóm pose theo từng look; xử lý camera zoom ở silver. Bài toán tái hiện cử động chân/tay/tóc **không giải được bằng 1 ảnh đứng**.
- **T05 — Outfit:** chuyển đúng **3 lần**, với cửa sổ frame 132–147, 182–194, 245–260; đổi kèm đạo cụ/túi/giày phù hợp, che trước khi thay.
- **T07 — QA:** xuất 296 frame ở 30FPS 360×640 tham chiếu (có thể render 1080×1920); so trực tiếp frame 0/24/132/147/182/194/245/260/295. Tránh tự nhận “match” nếu chưa overlay video cạnh video.

### Mức độ chắc chắn

FFprobe, SHA-256, fps, frame count: **đã xác minh bằng công cụ**. Nhìn thấy sofa trái, 4 look, 3 chuyển đổi, khoảng zoom: **đã quan sát frame**. Bbox và mốc cut chính xác từng frame: **ước lượng**, phải refine bằng overlay ở T02/T05.

**Phạm vi T01:** Chỉ phân tích và tài liệu. Không sửa composition, UI, API, asset download hoặc logic xuất video.
