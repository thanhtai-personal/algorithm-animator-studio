# File Upload (Web) - Mô tả hiện trạng và chẩn đoán

## 1) Mục tiêu
- Tổng hợp cách tính năng upload đang hoạt động trong web app.
- Chỉ ra phạm vi đã hỗ trợ, chưa hỗ trợ, và các rủi ro kỹ thuật hiện tại.
- Cung cấp checklist kiểm thử thủ công khi debug lỗi upload.

## 2) Phạm vi kiểm tra
- `Products` (admin catalog):
  - Trang danh sách sản phẩm (tạo mới): upload cover/gallery/video.
  - Trang chi tiết sản phẩm: upload cover.
- `Sales` (POS nhập liệu sản phẩm):
  - Upload 1 ảnh cover khi tạo nhanh sản phẩm.
- `Showroom / Inventory`:
  - Chỉ đọc và resolve URL ảnh từ `coverImagePath`/`galleryImagePaths`.
- `Settings`:
  - Chưa có UI upload file (dù type đã có `heroImagePath`).

## 3) Kiến trúc upload hiện tại
- Luồng chuẩn đang dùng:
  - `Component -> Hook -> Query -> Service -> Supabase Storage / API`
- Upload file được thực hiện trực tiếp từ client qua `supabase.storage.from(...).upload(...)`.
- API server không nhận multipart file trong các flow này; API chỉ nhận payload JSON chứa path/url sau upload.

## 4) Chi tiết theo module

### 4.1 Products - Trang tạo sản phẩm (list page)
- UI cho phép:
  - `cover`: nhập URL hoặc chọn 1 file ảnh.
  - `gallery`: nhập nhiều URL hoặc chọn nhiều file ảnh.
  - `video`: nhập nhiều URL hoặc chọn nhiều file video.
- Luồng submit:
  1. Tạo sản phẩm trước bằng JSON (`coverImagePath`, `galleryImagePaths`, `videoUrls` từ ô URL nếu có).
  2. Nếu có file thì upload từng file lên storage.
  3. Gọi patch overview lần 2 để merge thêm path/url từ file vừa upload.

### 4.2 Products - Trang chi tiết sản phẩm
- Hỗ trợ upload nhanh `cover` qua nút file input.
- Sau khi upload thành công:
  - Nhận về storage path.
  - Gọi API update overview để cập nhật `coverImagePath`.
- Chưa có UI upload gallery/video ở trang chi tiết.

### 4.3 Sales - Trang POS nhập liệu sản phẩm
- Chỉ có upload cover (1 file ảnh).
- Luồng submit:
  1. Tạo product + variant + items trước.
  2. Nếu có cover file thì upload storage.
  3. Patch product overview với `coverImagePath`.
- Không có input URL/gallery/video ở màn Sales entry.

### 4.4 Showroom / Inventory
- Không upload file.
- Chỉ resolve path sang public URL để hiển thị ảnh.

### 4.5 Settings
- `SettingsShowroomPagesUpdatePayload` có trường `heroImagePath`.
- Nhưng UI hiện tại chưa có control nhập/upload `heroImagePath`, nên chưa vận hành upload media ở Settings.

## 5) Quy ước bucket và path
- Bucket ảnh dùng chung:
  - `NEXT_PUBLIC_PRODUCT_IMAGE_BUCKET` (fallback: `product-images`).

- Products upload path:
  - `products/{productId}/{kind}/{timestamp}-{fileName}`
  - `kind`: `cover` | `gallery` | `video`

- Sales upload path:
  - `products/{productId}/{timestamp}-{fileName}`
  - Không tách thư mục theo `kind`.

- Resolve URL hiển thị:
  - Nếu giá trị đã là `http/https` thì dùng trực tiếp.
  - Nếu là storage path thì gọi `getPublicUrl(...)` để render.

## 6) Cách dữ liệu media đang được lưu
- DB products có các cột:
  - `cover_image_path` (`text`)
  - `gallery_image_paths` (`text[]`)
  - `video_urls` (`text[]`)
- Có migration `apps/web/sql/008_products_media_fields.sql` để bổ sung `gallery_image_paths`, `video_urls`.

- Lưu ý format hiện tại:
  - `cover_image_path`: thường là storage path (hoặc URL nếu user nhập URL trực tiếp).
  - `gallery_image_paths`: thường lưu storage path + có thể trộn URL nhập tay.
  - `video_urls`: khi upload file video, code hiện convert sang public URL trước khi lưu (không lưu path thuần như gallery).

## 7) Chẩn đoán lỗi upload thường gặp

### 7.1 Upload lỗi ngay tại `.upload(...)`
- Triệu chứng: toast/error message trả về từ Supabase Storage.
- Khả năng cao:
  - Bucket chưa tạo hoặc sai tên bucket env.
  - Storage policy/RLS không cho role hiện tại upload.
  - File quá lớn hoặc content-type bị chặn bởi policy.

### 7.2 Upload thành công nhưng không thấy ảnh/video hiển thị
- Khả năng cao:
  - Upload ok nhưng patch overview thất bại (path/url không được lưu vào DB).
  - Lưu path đúng nhưng bucket không public hoặc policy read không cho `getPublicUrl` truy cập như mong đợi.
  - Nhập URL thủ công không hợp lệ.

### 7.3 Chỉ một phần media được lưu
- Với flow create product, upload và patch là bước thứ hai sau create.
- Nếu upload một số file fail giữa chừng thì có thể sản phẩm đã tạo nhưng media chưa đầy đủ.

## 8) Các điểm thiếu/rủi ro hiện tại
- Chưa có validate mạnh cho file:
  - Chỉ dùng `accept` ở input; chưa kiểm tra chặt MIME/size/duration phía client.
- Chưa có progress UI cho upload nhiều file.
- Chưa có cơ chế cleanup file mồ côi:
  - Nếu upload thành công nhưng patch DB fail thì file vẫn nằm trong bucket.
- Inconsistency path convention:
  - Products có thư mục `kind`, Sales thì không.
- Inconsistency định dạng dữ liệu video:
  - Video file upload được lưu thành public URL, trong khi gallery thường là storage path.
- Chưa thấy migration/runbook storage bucket + policy đi kèm SQL hiện tại.

## 9) Checklist test thủ công
1. Tạo sản phẩm mới bằng URL-only:
   - cover URL, gallery URL, video URL.
   - Xác nhận hiển thị đúng ở list/detail/showroom.
2. Tạo sản phẩm bằng file-only:
   - cover file, gallery files, video files.
   - Xác nhận DB lưu đúng cột và UI render được.
3. Tạo sản phẩm mix URL + file:
   - đảm bảo không trùng item trong mảng sau merge.
4. Test role:
   - staff/admin đều upload được theo policy mong muốn.
5. Test lỗi:
   - bucket sai tên env.
   - file quá lớn.
   - tắt mạng khi đang upload nhiều file.
6. Test Sales entry:
   - tạo nhanh sản phẩm + cover file, kiểm tra ảnh xuất hiện ở Products/Sales/Showroom.

## 10) Đề xuất ưu tiên cải thiện (ngắn hạn)
1. Chuẩn hóa một định dạng lưu media (ưu tiên lưu path thuần, resolve URL khi render).
2. Thống nhất convention path giữa Products và Sales.
3. Bổ sung validate file size/MIME trước upload + message lỗi rõ ràng.
4. Viết runbook/migration cho bucket + storage policy để môi trường mới không lỗi upload.
5. Thêm cơ chế retry hoặc cleanup file mồ côi khi bước patch overview thất bại.
