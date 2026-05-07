# PRD — Website Quản Lý Thuê Quần Áo + Trang Showroom Chọn Đồ (Next.js + Supabase)

> **Phiên bản:** v1.2 (đồng bộ theo tasks đã hoàn thành đến 2026-03-09)  
> **Mặc định ngôn ngữ:** Tiếng Việt (vi)  
> **Hỗ trợ:** Tiếng Việt (vi), Tiếng Anh (en)
>
> **Làm rõ thuật ngữ:** Trong tài liệu này,
> - `trang showroom` = trang khách xem/chọn sản phẩm (quần áo) trước khi đến shop thử đồ
> - `shop/branch/chi nhánh` = cửa hàng/showroom vật lý vận hành cho thuê

---

## 1) Mục tiêu sản phẩm

### 1.1 Mục tiêu
- Quản lý **tồn kho trang phục** theo trạng thái (sẵn sàng/đang thuê/đang giặt/đang sửa/hỏng/mất).
- Quản lý **đơn hàng RENTAL + SALE** theo timeline (đặt → nhận đồ → trả/quyết toán → hoàn tất).
- Tính toán **giá thuê**, **cọc**, **phụ phí** (trễ hạn, hư hỏng, mất).
- Quản lý **lịch sự kiện makeup** (book lịch, phân công chuyên gia, cảnh báo trùng lịch).
- Quản lý **khách hàng**, lịch sử thuê, ghi chú, blacklist (nếu cần).
- Quản lý **lịch shop/chi nhánh** (nhận/trả/hẹn thử), nhắc việc.
- Quản lý **ca bán hàng (sales shift)** cho staff POS (mở ca/kết ca + đối soát tiền mặt).
- Có **trang showroom cho khách** để xem/chọn đồ trước khi lên shop thử.
- Báo cáo doanh thu/lợi nhuận/debt theo ngày-tháng-năm, top sản phẩm thuê nhiều.
- Dashboard admin có nhóm số liệu theo module: tổng toàn hệ thống, bán/thuê đồ, makeup.

### 1.2 Phạm vi (Scope)
**In-scope**
- Admin web quản trị (nhân viên/manager).
- Trang showroom cho khách (catalog hiển thị sản phẩm + chọn trước danh sách đồ muốn thử).
- Các module: Sản phẩm – Tồn kho – Đơn hàng (RENTAL/SALE) – Khách hàng – Makeup Events – Thanh toán – Trả hàng – POS/Shift – Media – Notifications – Báo cáo – Thiết lập.
- Có toggle module vận chuyển ở mức hệ thống (MVP mặc định tắt, chưa triển khai flow vận chuyển đầy đủ).
- Đa chi nhánh (tuỳ chọn, thiết kế sẵn để mở rộng).

**Out-of-scope (giai đoạn 1)**
- Khách tự checkout/đặt thuê hoàn tất online (phase 2).
- Tích hợp vận chuyển (phase 2).
- Tích hợp POS/hóa đơn điện tử bên thứ ba (phase 2).

---

## 2) Đối tượng sử dụng & phân quyền

### 2.1 Vai trò
- **Owner Admin**: role seed-only, toàn quyền hệ thống, không cho cấp runtime từ UI/API.
- **Admin**: toàn quyền vận hành nghiệp vụ, cấu hình hệ thống, xem báo cáo.
- **Shop Admin**: quản trị một showroom cụ thể (config product page, vận hành catalog/public page theo showroom được gán).
- **Manager**: quản lý đơn/tồn kho/khách hàng, xem báo cáo chi nhánh.
- **Staff**: tạo đơn, check-in/out, cập nhật trạng thái giặt/sửa, thu tiền.
- **Makeup Artist**: tài khoản chuyên gia makeup, xem lịch makeup của chính mình.
- **Customer**: tài khoản khách (đăng nhập phone/password) để xem thông tin hồ sơ cơ bản ở public flows.
- **Accountant** (tuỳ chọn): xem/đối soát thanh toán, export.

### 2.2 Nguyên tắc phân quyền
- Áp dụng **RBAC** (role-based access control).
- Data isolation theo **shop/branch** (nếu có nhiều chi nhánh).
- `shop_admin` chỉ được gắn với đúng 1 showroom và chỉ thao tác trong showroom được gán.
- Audit log cho hành động quan trọng: sửa giá, huỷ đơn, hoàn cọc, đánh dấu mất/hỏng.
- Rule cứng đã triển khai: `owner_admin` là seed-only + immutable (được guard ở service + DB trigger).

---

## 3) Luồng nghiệp vụ cốt lõi (Core flows)

### 3.1 Flow xem showroom online trước khi đến shop (pre-selection)
1. Khách vào **product page theo showroom domain**: `/{shopDomain}`.
2. Nếu showroom chưa setup config/template riêng, hệ thống hiển thị **product page mặc định**.
3. Khách vào trang tìm kiếm theo showroom: `/{shopDomain}/search`.
4. Lọc theo nhu cầu (loại đồ, màu, size, style, mức giá...).
5. Chọn trước các mẫu muốn thử (shortlist/pre-selection list).
6. (Tuỳ MVP) lưu danh sách cục bộ hoặc gửi yêu cầu thử đồ/ghi chú cho shop.
7. Nhân viên dùng danh sách này để tư vấn/chuẩn bị khi khách đến shop.

**Nguyên tắc MVP**
- Không tạo lock item/date-range chỉ vì khách thêm vào shortlist.
- Không phát sinh payment trên trang showroom khách.
- Availability hiển thị ở mức tham khảo (nếu có), nguồn khóa thực tế vẫn là order/reservation flow nội bộ.
- Mỗi showroom đăng ký tối đa `1 shop_domain`; `shop_domain` phải unique toàn hệ thống.

### 3.2 Flow thuê trực tiếp tại shop (showroom vật lý)
1. Nhân viên tạo **đơn thuê** → chọn khách (tạo mới nếu chưa có).
2. Chọn **items** (trang phục/size/màu/định danh) → hệ thống kiểm tra **availability** theo ngày.
3. Nhập **thời gian thuê** (ngày nhận – ngày trả dự kiến).
4. Hệ thống tính: **tiền thuê + cọc + phụ phí dự kiến** (nếu có).
5. Thu tiền (cọc/thuê) → ghi nhận **payment** (có bước xác nhận receipt với cash/bank ở flow tạo đơn).
6. Khi giao đồ: chuyển trạng thái items → **ON_RENT**; đơn → **PICKED_UP**.
   - Quy tắc MVP hiện tại: nếu module vận chuyển đang **tắt**, sau khi xác nhận đơn thuê có thể chuyển thẳng sang `PICKED_UP`.
7. Khi trả đồ: nhân viên check tình trạng:
   - Bình thường → items → **LAUNDRY/READY** (tuỳ quy trình) → hoàn tất.
   - Hư/mất → tạo **incident** + phụ phí; trừ cọc/thu thêm.
8. Hoàn cọc + thu bổ sung (nếu thiếu) theo settlement; nếu chưa tất toán thì đơn vào **DEBT**.
9. Khi công nợ về 0 và refund/deposit hoàn tất → đơn → **COMPLETED**.

### 3.3 Flow đặt trước (booking)
1. Tạo booking với trạng thái **RESERVED**.
2. Giữ hàng theo rule:
   - Giữ theo **date range** (ngày nhận/trả).
   - Có thể yêu cầu **đặt cọc trước** để lock.
3. Đến ngày nhận → chuyển sang **PICKED_UP**.

### 3.4 Flow giặt/sửa (laundry/maintenance)
- Item sau trả → trạng thái **LAUNDRY**.
- Nếu phát hiện lỗi → chuyển **MAINTENANCE** + tạo task.
- Hoàn tất → **READY**.

### 3.5 Flow bán hàng tại POS (SALE)
1. Staff mở ca với số tiền đầu ca.
2. Tạo đơn **SALE** (không dùng deposit), chọn item/sản phẩm và thu tiền.
3. Item bán được chuyển trạng thái **SOLD** theo quyền.
4. Kết ca: nhập tiền cuối ca, hệ thống đối soát expected cash và hiển thị variance.

### 3.6 Flow return-order entity (đơn trả độc lập)
1. Tạo `return_order` từ source rental order trạng thái `PICKED_UP`.
2. Ghi nhận ngày trả thực tế + checklist tình trạng item + phí phát sinh.
3. Settle return để sync source rental `PICKED_UP -> RETURNED`.
4. Complete return sẽ chốt source rental `RETURNED -> COMPLETED|DEBT` theo kết quả settlement.

### 3.7 Flow makeup booking (khách/staff/chuyên gia)
1. Admin bật module makeup trong Settings (`module toggle`).
2. Khách hàng hoặc staff tạo lịch makeup theo ngày + buổi (`morning/afternoon/evening`) + chuyên gia makeup + gói makeup (nếu có).
3. Hệ thống kiểm tra xung đột theo cùng ngày/cùng buổi:
   - trùng chuyên gia,
   - trùng khách hàng (nếu đã có lịch khác cùng buổi),
   - hoặc các rule conflict mở rộng theo branch.
4. Nếu có xung đột, hệ thống hiển thị **cảnh báo mềm** (warning) nhưng vẫn cho phép lưu nếu người dùng xác nhận.
5. Lịch có conflict được đánh dấu để hiển thị màu cảnh báo trên calendar ngày tương ứng.
6. Chuyên gia makeup đăng nhập và chỉ xem lịch của chính mình.
7. Admin xem được danh sách chuyên viên makeup và lịch theo từng chuyên viên.

---

## 4) Modules & yêu cầu chức năng (Functional Requirements)

### 4.1 Authentication / User management
- Login bằng Supabase Auth (email/password; magic link optional).
- Hỗ trợ đăng nhập **customer** bằng phone/password (mapping qua CRM profile link).
- Quản lý user nội bộ:
  - Tạo user, gán role, gán chi nhánh.
  - Vô hiệu hoá user.
- Reset password / change password.
- Có luồng profile/account self-service cơ bản cho customer.

**Acceptance criteria**
- User chỉ thấy data thuộc branch được phép.
- Owner xem được tất cả.

---

### 4.2 Sản phẩm (Catalog)
#### 4.2.1 Thực thể
- **Product**: mẫu trang phục (VD: “Áo dài đỏ mẫu A”).
- **Variant / SKU**: hiện để tương thích legacy; flow nhập mới đã đơn giản hóa theo product-level.
- **Item**: đơn vị cho thuê cụ thể (có mã/QR, tình trạng, lịch sử).

#### 4.2.2 Chức năng
- CRUD Product / Item.
- Auto-provision default variant nội bộ khi tạo product (không yêu cầu staff nhập variant thủ công).
- Upload ảnh (Supabase Storage), set ảnh cover.
- Quản lý media qua Media Library (cover/gallery/video URL từ picker).
- Thuộc tính: loại (váy/áo dài/vest…), giới tính, size chart, chất liệu…
- Thiết lập giá:
  - Giá thuê theo **gói** (1 ngày, 3 ngày, 7 ngày) hoặc theo **ngày**.
  - Giá cọc mặc định (có thể override trong đơn).
  - Bổ sung `sale_price`, `purchase_price`, `rent_deposit_amount`, `is_rentable`, `is_saleable`.
- Hỗ trợ nhập số lượng để auto-generate item, không yêu cầu fallback quantity ở product.

**Acceptance criteria**
- Tìm kiếm theo tên/mã/tags.
- Filter theo trạng thái (READY/ON_RENT/LAUNDRY…).
- Trường giá vốn (`purchase_price`) chỉ cho manager/admin/owner_admin.
- Sau create/update từ POS hoặc dashboard, dữ liệu products/inventory đồng bộ không cần hard refresh.

#### 4.2.3 Trang showroom cho khách (pre-selection)
- Public/customer-facing page hiển thị product catalog (không phải trang admin).
- Route theo showroom:
  - `/{shopDomain}`: product home page của showroom.
  - `/{shopDomain}/search`: trang list/filter/search sản phẩm của showroom.
- Nếu showroom chưa setup cấu hình riêng thì fallback về product page mặc định.
- Hiển thị ảnh cover, tên mẫu, thuộc tính chính, giá tham khảo, size/màu (theo dữ liệu catalog).
- Filter/search cơ bản (loại, tag, giới tính, size/màu, text search).
- Cho phép khách chọn trước danh sách mẫu muốn thử (`shortlist`).
- `shortlist` không khóa tồn kho, không tạo order/payment.
- (Tuỳ MVP) hỗ trợ lưu local/session hoặc tạo link chia sẻ danh sách cho nhân viên.
- Nội dung hiển thị trên trang showroom được cấu hình từ admin (xem mục Settings), không hard-code toàn bộ.
- Hỗ trợ cơ chế chọn `template` cho product home page:
  - **MVP** chỉ triển khai `1 template` (v1)
  - nhưng DB/schema chuẩn bị sẵn để sau này thêm nhiều template và chọn template theo branch/locale

**Acceptance criteria**
- Khách (không login) vẫn xem được catalog showroom.
- `shop_domain` được resolve đúng showroom; domain trùng bị chặn ở tầng dữ liệu + API.
- Khi showroom chưa setup config/template riêng, trang vẫn render theo default product page.
- Chỉ hiển thị sản phẩm được phép public/showroom (theo policy MVP).
- Không lộ dữ liệu nội bộ (ghi chú nội bộ, cost, audit, item-level nhạy cảm).
- Khi admin đổi config hiển thị showroom page, trang khách phản ánh đúng theo config đã publish.

---

### 4.3 Tồn kho & trạng thái Item

#### 4.3.1 Trạng thái item (đề xuất)
- `READY` — sẵn sàng cho thuê
- `RESERVED` — giữ cho booking
- `ON_RENT` — đang thuê
- `LAUNDRY` — đang giặt
- `MAINTENANCE` — đang sửa
- `DAMAGED` — hỏng (chờ xử lý)
- `LOST` — mất
- `SOLD` — đã bán
- `RETIRED` — ngừng cho thuê

#### 4.3.2 Chức năng
- Xem danh sách item theo trạng thái, theo chi nhánh.
- Chuyển trạng thái có rule:
  - READY → RESERVED → ON_RENT → LAUNDRY → READY
  - ON_RENT → LOST/DAMAGED (khi có sự cố)
- Lịch sử trạng thái + ai thao tác + thời điểm.
- Quét QR để mở nhanh item và thao tác “check-in/out”.
- Rule SOLD:
  - manager+ mới được set SOLD ở một số thao tác nhạy cảm.
  - SOLD không được tính vào active stock/utilization.

**Acceptance criteria**
- Không cho phép chọn item `ON_RENT` trong đơn mới trùng date range.

---

### 4.4 Đơn hàng (Rental + Sale Orders)

#### 4.4.0 Loại đơn
- `RENTAL`
- `SALE`

#### 4.4.1 Trạng thái order
- `DRAFT` — tạo nháp
- `RESERVED` — booking/đặt trước
- `CONFIRMED` — đã xác nhận (có/không cọc)
- `PICKED_UP` — đã nhận đồ
- `RETURNED` — đã trả đồ (chờ hoàn cọc/đối soát)
- `DEBT` — còn công nợ sau return/settlement
- `COMPLETED` — hoàn tất
- `CANCELLED` — huỷ

#### 4.4.2 Chức năng
- Tạo đơn:
  - Chọn loại đơn `RENTAL/SALE`
  - Khách hàng
  - Ngày nhận/trả dự kiến
  - Chọn items + giá thuê từng item
  - Cọc, discount, note
- Wizard tạo đơn ưu tiên thứ tự bước: `Items -> Rental time -> Customer -> Pricing -> Review`.
- Admin create-order trong dashboard dùng modal full-step, có cơ chế giữ draft khi đóng ngoài/ESC và chỉ discard khi bấm nút hủy tường minh.
- Rule vận chuyển (MVP fallback):
  - `is_shipping_module_enabled = false` (mặc định) => rental sau bước xác nhận chuyển sang `PICKED_UP` theo policy fallback.
- Sửa đơn theo quyền:
  - Staff sửa khi DRAFT/RESERVED
  - Manager/Admin sửa khi CONFIRMED (audit log)
- Nhận đồ (Pick up):
  - Đổi trạng thái order + items
- Trả đồ (Return):
  - Checklist tình trạng item
  - Ghi incident (hư/mất/bẩn nặng)
  - Tạo phụ phí, tính trừ cọc
- Hoàn cọc (refund):
  - Refund full/partial
  - Ghi payment/refund transaction
- Rule settlement:
  - Không cho complete nếu còn phần phải thu/phải hoàn chưa khớp quy tắc no-partial.
  - Lifecycle nợ: `RETURNED -> DEBT -> COMPLETED`.
- In phiếu / xuất PDF (phase 1 optional, phase 2 nếu cần chuẩn form)

**Acceptance criteria**
- Tổng tiền = sum(item rent) - discount + fees.
- Cọc tracking rõ: thu cọc → giữ → hoàn/trừ.
- SALE flow không yêu cầu deposit.
- Payment receipt confirmation (cash/bank) phải được xác nhận rõ trước submit tạo đơn khi có tiền nhận.

#### 4.4.3 Return Orders (entity riêng)
- Có bảng/flow `return_orders` độc lập với source rental order.
- Trạng thái return-order: `DRAFT`, `CREATED`, `RETURN_SETTLED`, `COMPLETED`, `CANCELLED`.
- `return_orders` chỉ tạo từ source rental `PICKED_UP` và chặn tạo trùng return-order active cho cùng source.
- Hỗ trợ settlement có `additionalCollectedAmount` để thu thêm khi trả hàng.
- Trong UI/API nguồn tạo return-order, filter nguồn chỉ lấy đơn rental trạng thái `PICKED_UP`.

---

### 4.5 Khách hàng (CRM lite)
- CRUD khách: tên, sđt, social, địa chỉ, note.
- Xem lịch sử thuê, tổng chi tiêu, số lần trễ hạn, incident count.
- Tag khách: VIP / Blacklist (rule chỉ cảnh báo, không block cứng ở phase 1).

---

### 4.6 Thanh toán & đối soát
#### 4.6.1 Loại giao dịch
- Thu tiền thuê
- Thu cọc
- Thu phụ phí
- Hoàn cọc
- Hoàn tiền thuê (nếu huỷ)
- Chuẩn loại payment nội bộ:
  - `RENT`, `DEPOSIT`, `FEE`, `DEPOSIT_REFUND`, `RENT_REFUND`

#### 4.6.2 Chức năng
- Ghi nhận payment theo:
  - Cash / bank transfer / momo (nhập tay phase 1)
- MVP/phase 1: **không tích hợp payment gateway/webhook callback**; xử lý payment là thủ công.
- **Admin** cập nhật/chuyển trạng thái payment thủ công (khuyến nghị MVP: `POSTED` / `VOIDED`) và có audit log.
- Dashboard/POS create-order dùng cùng contract payment để đồng bộ validation server.
- Sổ thu chi đơn giản theo ngày
- Export CSV/Excel

---

### 4.7 Lịch & nhắc việc
- View lịch theo ngày/tuần:
  - Đơn đến hạn trả hôm nay
  - Đơn sắp đến hạn trả
  - Booking sắp nhận
- Nhắc việc (in-app):
  - overdue
  - items stuck in laundry/maintenance quá lâu

---

### 4.8 Báo cáo
- Doanh thu theo ngày/tháng
- Top products/items thuê nhiều
- Tỷ lệ utilization: ON_RENT / total
- Incident report: hư/mất/trễ

**Acceptance criteria**
- Filter theo branch/time range.
- Export.

---

### 4.9 Thiết lập hệ thống
- Cấu hình giá cọc mặc định theo loại sản phẩm
- Cấu hình phí trễ hạn (theo ngày hoặc %)
- Cấu hình chi nhánh, giờ mở cửa
- Mỗi showroom đăng ký `shop_domain` riêng (unique, không trùng route reserved)
- Gán role `shop_admin` với đúng 1 showroom
- Quản lý tags/categories
- Toggle module vận chuyển:
  - `is_shipping_module_enabled` (MVP mặc định `false`)
  - khi tắt dùng fallback nghiệp vụ rental auto `PICKED_UP`
- Cấu hình trang showroom khách (product home page):
  - nội dung hiển thị (hero/banner/section/filter options/thứ tự section...)
  - chọn template page cho product home page
  - admin page quản lý config theo branch/locale, chỉnh draft và publish config hiển thị
  - publish/unpublish config
- Template strategy:
  - MVP chỉ có `1` template product page
  - seed/default template ban đầu: `PRODUCT_HOME_V1`
  - DB và admin setting chuẩn bị sẵn cho nhiều template trong tương lai
- Hỗ trợ nhập liệu bằng giọng nói cho admin forms (MVP theo field, không bắt buộc mọi field):
  - áp dụng trước cho các field text/note dài (mô tả sản phẩm, ghi chú khách hàng, ghi chú đơn hàng, lý do huỷ/void/payment note, text block showroom page)
  - field số/ngày giờ vẫn ưu tiên nhập tay hoặc cần bước xác nhận/chỉnh sửa trước khi lưu
  - chỉ là hỗ trợ nhập liệu (dictation), không tự submit form / không tự trigger action phá huỷ
  - fallback nhập tay đầy đủ khi browser không hỗ trợ microphone/speech recognition

**Acceptance criteria**
- Admin có thể bật/tắt ghi âm nhập liệu trên các form được hỗ trợ.
- Nếu browser không hỗ trợ hoặc user từ chối microphone permission, form vẫn dùng bình thường.
- Kết quả dictation chỉ cập nhật field đang focus/chọn; không ghi đè field khác.
- Không tự submit hoặc tự confirm action chỉ vì có voice input.
- `shop_domain` duplicate bị chặn với lỗi rõ ràng.
- `shop_admin` không thể truy cập/chỉnh sửa showroom không được gán.

### 4.10 Sales POS & Shift Management
- Module sales theo tab: `POS`, `Returns`, `Stock`, `Invoices`, `Product Entry`.
- Shift lifecycle:
  - mở ca (`OPEN`) với opening cash
  - kết ca (`CLOSED`) với closing cash + variance note khi chênh lệch
- Có màn hình admin quản lý shifts (filter theo staff/branch/status/time, xem summary + orders theo ca).
- POS và dashboard dùng chung contract tạo đơn để tránh lệch nghiệp vụ.

### 4.11 Media Library
- Dashboard media module: upload/list/delete/search theo branch.
- Quota media branch (MVP): 9GB.
- Product forms chọn media qua media picker modal, lưu URL/path vào product payload.

### 4.12 Notifications (in-app)
- Notification center trong dashboard shell (realtime + polling fallback).
- Nguồn sự kiện chính: thay đổi trạng thái đơn, payment exception, reminder quá hạn.
- Hỗ trợ mark-as-read và mark-all-read.

### 4.13 Makeup Event Management
#### 4.13.1 Quản trị module (admin toggle)
- Admin có quyền bật/tắt module Makeup trong Settings.
- Khi module tắt:
  - ẩn menu/màn hình makeup ở dashboard cho các role không có quyền makeup,
  - chặn API create/update booking makeup với mã lỗi module disabled,
  - dữ liệu cũ vẫn giữ, không xóa.

#### 4.13.2 Vai trò & quyền
- `customer`: có thể tạo booking makeup của chính mình (theo policy branch/public đã cấu hình).
- `staff`: xem/tạo/sửa lịch makeup theo branch.
- `admin/manager`: toàn quyền lịch makeup theo branch + quản trị cấu hình + xem danh sách chuyên viên và lịch của từng chuyên viên.
- `makeup_artist`: chỉ xem lịch makeup của chính mình.
- `admin` và `makeup_artist`: có thể tạo/setup các gói makeup theo policy branch.

#### 4.13.3 Booking & conflict warning
- Booking makeup tối thiểu gồm:
  - customer,
  - chuyên gia makeup,
  - gói makeup (optional ở MVP, bắt buộc khi branch bật policy package-required),
  - ngày,
  - buổi (`MORNING`/`AFTERNOON`/`EVENING`),
  - ghi chú.
- Rule conflict mặc định:
  - cảnh báo nếu cùng ngày + cùng buổi + cùng chuyên gia,
  - cảnh báo nếu cùng ngày + cùng buổi + cùng khách.
- Conflict là **soft warning**:
  - hệ thống vẫn cho lưu khi người dùng xác nhận override.
- Lịch conflict phải được gắn cờ để phục vụ hiển thị cảnh báo màu trên calendar.

#### 4.13.4 Calendar cảnh báo màu
- Ngày có lịch makeup bị conflict hiển thị màu cảnh báo (ví dụ amber/orange).
- Event card conflict có badge cảnh báo trực quan.
- Không chặn thao tác xem/chỉnh sửa chỉ vì có conflict flag.

#### 4.13.5 Quản lý gói makeup (admin + makeup artist)
- Gói makeup gồm tối thiểu:
  - `code`, `name`, `duration_minutes`, `price_amount`, `cost_amount`, `is_active`, `description`.
- `admin/manager`:
  - xem/tạo/sửa/tắt gói makeup theo branch.
- `makeup_artist`:
  - xem danh sách gói,
  - tạo/sửa gói theo policy được cấp (branch scope hoặc owner package).
- Booking makeup có thể gắn `package_id` để phục vụ thống kê doanh thu/lợi nhuận.

#### 4.13.6 Thống kê module makeup
- `makeup_artist` có màn hình `My Makeup Stats`:
  - chỉ xem số liệu của chính mình,
  - gồm doanh thu, lợi nhuận, số lịch/số đơn makeup theo khoảng thời gian.
- Admin dashboard có 3 nhóm thống kê doanh thu/lợi nhuận/đơn hàng:
  - `ALL_MODULES`: tổng toàn hệ thống,
  - `RENTAL_SALE_MODULE`: chỉ bán/thuê đồ,
  - `MAKEUP_MODULE`: chỉ makeup.
- Số liệu nhóm makeup phải lọc đúng theo nguồn dữ liệu makeup (không trộn payments rental/sale).

**Acceptance criteria**
- Admin bật/tắt module makeup thành công từ Settings.
- Customer có thể book lịch makeup; staff có thể xem/tạo/sửa.
- Makeup artist đăng nhập và xem được lịch cá nhân.
- Admin xem được danh sách chuyên viên makeup và lịch theo từng chuyên viên.
- Admin và makeup artist tạo/sửa gói makeup thành công theo policy.
- Makeup artist xem được thống kê doanh thu/lợi nhuận riêng của chính mình.
- Dashboard admin hiển thị đúng 3 nhóm số liệu: all modules / rental-sale / makeup.
- Khi tạo lịch trùng cùng ngày/cùng buổi, hệ thống cảnh báo rõ ràng nhưng vẫn cho phép lưu.
- Calendar hiển thị màu cảnh báo cho ngày có lịch trùng.

---

## 5) Multi-language (Tiếng Việt + Tiếng Anh)

### 5.1 Phạm vi i18n
- **UI text**: menu, label, button, toast, modal, validation message, empty state.
- **Hệ thống trạng thái**: hiển thị label theo ngôn ngữ (READY → “Sẵn sàng” / “Ready”).
- **Template in/print/export**: phiếu thuê, hoá đơn (nếu có) hỗ trợ song ngữ (phase 2), hoặc chọn 1 ngôn ngữ.
- **Dữ liệu nghiệp vụ**: mặc định **không dịch** (tên sản phẩm, ghi chú nội bộ) trừ khi có nhu cầu.

### 5.2 Quy tắc & hành vi
- Ngôn ngữ mặc định: **vi**.
- User có thể đổi ngôn ngữ:
  - Toggle trong header (VI / EN).
  - Lưu preference theo thứ tự ưu tiên:
    1) `profiles.locale` (DB) nếu user đăng nhập
    2) cookie `locale`
    3) fallback `vi`
- Đổi ngôn ngữ **không reload mất state form** (ưu tiên client-side switch với routing locale).
- Mọi thông báo lỗi/validation phải theo locale hiện tại.

### 5.3 Yêu cầu kỹ thuật (Next.js)
- Áp dụng i18n theo **routing locale**: `/vi/...` và `/en/...` (khuyến nghị).
- Thư mục messages:
  - `messages/vi.json`
  - `messages/en.json`
- Chuẩn key:
  - `nav.orders`, `nav.products`
  - `common.save`, `common.cancel`
  - `orders.status.draft`, `items.status.ready`
- Không hard-code string trong component (trừ prototype).

### 5.4 Danh mục string tối thiểu (MVP)
- Navigation & layout: Dashboard, Products, Inventory, Orders, Customers, Payments, Calendar, Reports, Settings, Sales POS, Media, Notifications, Logout
- Common: Save, Cancel, Create, Edit, Delete, Search, Filter, Export, Confirm, Back, Next
- Orders: Create order, Rental/Sale, Pick up, Return, Debt, Complete, Cancel order, Deposit, Discount, Fees, Total
- Inventory: Scan QR, Change status, Ready, On rent, Laundry, Maintenance, Damaged, Lost, Sold
- Makeup: Book makeup, Makeup artist, Session slot (morning/afternoon/evening), Conflict warning, Override and save, My schedule, Makeup package, My makeup stats, Module grouped dashboard stats
- Validation: Required field, Invalid phone number, Date range invalid, Item not available
- Toast: Created successfully, Updated successfully, Payment recorded, Refund processed

### 5.5 Mapping trạng thái (ví dụ)
- Item status:
  - `READY`: vi = “Sẵn sàng”, en = “Ready”
  - `ON_RENT`: vi = “Đang thuê”, en = “On rent”
  - `LAUNDRY`: vi = “Đang giặt”, en = “Laundry”
  - `SOLD`: vi = “Đã bán”, en = “Sold”
- Order status:
  - `DRAFT`: vi = “Nháp”, en = “Draft”
  - `RESERVED`: vi = “Đặt trước”, en = “Reserved”
  - `PICKED_UP`: vi = “Đã nhận đồ”, en = “Picked up”
  - `DEBT`: vi = “Còn nợ”, en = “Debt”
- Makeup booking status (ví dụ):
  - `BOOKED`: vi = “Đã đặt lịch”, en = “Booked”
  - `CONFIRMED`: vi = “Đã xác nhận”, en = “Confirmed”
  - `COMPLETED`: vi = “Hoàn thành”, en = “Completed”
  - `CANCELLED`: vi = “Đã hủy”, en = “Cancelled”

### 5.6 Acceptance criteria i18n
- Tất cả màn hình MVP chuyển đổi VI/EN đầy đủ.
- Không có string “lọt” (fallback key hiển thị) ở UI production.
- Locale được nhớ đúng theo `profiles.locale` khi đăng nhập lại.

---

## 6) Yêu cầu phi chức năng (Non-functional)
- **Performance**: list pages có pagination, search debounced.
- **Auditability**: log thay đổi trạng thái/giá/huỷ/hoàn cọc.
- **Security**:
  - Supabase RLS theo branch + role.
  - Không lộ public URLs nhạy cảm.
  - Voice input trên admin forms yêu cầu user chủ động cấp microphone permission; không tự khởi động ghi âm.
- **Privacy/UX (voice input)**:
  - Hiển thị trạng thái rõ ràng: listening / processing / error / unsupported.
  - Cho phép stop/cancel để tránh ghi nhầm.
  - Không làm gián đoạn flow nhập tay khi voice feature lỗi hoặc bị chặn.
- **Reliability**: tránh double booking (transaction/constraint).
- **Observability**: basic logs cho edge functions.

---

## 7) Data model đề xuất (Supabase/Postgres)

### 7.1 Bảng chính
- `profiles` (map auth.users → profile) — thêm `locale` (vi/en)
- `branches`
- `customers`
- `products`
- `product_variants` (legacy compatibility; đã có lộ trình cutover product-level)
- `items`
- `rental_orders`
- `rental_order_items`
- `return_orders`
- `sales_shifts`
- `payments`
- `item_status_logs`
- `incidents` (hư/mất/phụ phí)
- `reservation_windows`
- `audit_events`
- `maintenance_tasks`
- `showrooms`
- `notifications`
- `media_assets`
- `media_upload_sessions`
- `makeup_artists` (mapping profile chuyên gia makeup theo branch)
- `makeup_packages`
- `makeup_events`
- `showroom_page_templates` (registry template cho customer showroom product home page)
- `showroom_page_configs` (config hiển thị + template selection cho showroom page theo branch/locale)

### 7.2 Key fields (tóm tắt)
- `profiles`: `id`, `full_name`, `role`, `branch_id`, `managed_showroom_id`, `locale`
- `items`: `id`, `branch_id`, `product_id`, `code`, `status`
- `rental_orders`: `id`, `branch_id`, `customer_id`, `order_type`, `status`, `start_date`, `end_date`, `deposit_amount`, `discount_amount`, `total_amount`
- `rental_order_items`: `order_id`, `item_id`, `product_id`, `rent_price`, `deposit_override`, `cogs_snapshot_amount`
- `return_orders`: `id`, `source_rental_order_id`, `status`, `deposit_refund_status`, `actual_return_date`, `settled_at`, `completed_at`
- `sales_shifts`: `id`, `branch_id`, `opened_by`, `opened_at`, `opening_cash`, `status`, `closed_by`, `closed_at`, `closing_cash`
- `payments`: `order_id`, `type`, `method`, `amount`, `status`, `created_by` (tuỳ cần thêm `updated_by`, `void_reason`)
- `item_status_logs`: `item_id`, `from`, `to`, `by`, `at`
- `notifications`: `id`, `profile_id`, `title`, `body`, `is_read`, `created_at`
- `media_assets`: `id`, `branch_id`, `storage_path`, `media_type`, `size_bytes`, `created_by`
- `makeup_artists`: `id`, `profile_id`, `branch_id`, `display_name`, `is_active`
- `makeup_packages`: `id`, `branch_id`, `code`, `name`, `duration_minutes`, `price_amount`, `cost_amount`, `is_active`, `created_by_profile_id`
- `makeup_events`: `id`, `branch_id`, `customer_id`, `artist_profile_id`, `package_id`, `event_date`, `session_slot`, `status`, `is_conflict_warning`, `conflict_note`, `service_amount`, `cost_amount`, `profit_amount`
- `showrooms`: `id`, `branch_id`, `name`, `slug`, `shop_domain`, `is_default`, `is_active` (`shop_domain` unique toàn hệ thống)
- `system_settings`: bổ sung flag `is_makeup_module_enabled`
- `system_settings`: bổ sung flag `is_shipping_module_enabled` (default false ở MVP hiện tại)
- `showroom_page_templates`: `code`, `page_key`, `name`, `template_version`, `is_default`
- `showroom_page_configs`: `branch_id`, `locale`, `page_key`, `template_id`, `sections_config_json`, `display_config_json`, `is_published`

### 7.3 Ràng buộc chống trùng lịch thuê (gợi ý)
- Khi order chuyển sang `CONFIRMED/RESERVED/PICKED_UP`, tạo record “reservation window” cho từng `item_id` với `daterange(start_date, end_date)`.
- Dùng `EXCLUDE constraint` trên `(item_id WITH =, date_range WITH &&)` để cấm overlap.
  - Thường cần extension `btree_gist`.
- Với Supabase: implement bằng SQL migration.

---

## 8) API/Architecture đề xuất (Next.js App Router)

### 8.1 Kiến trúc
- **Next.js App Router**
  - `app/[locale]/(auth)` login
  - `app/[locale]/(dashboard)` layout admin
- Data access:
  - Supabase server client (RSC + route handlers)
  - Supabase browser client (mutations + realtime updates)
- State:
  - TanStack Query (optional) + optimistic update cho đơn.

### 8.2 Các route/modules
- `/{shopDomain}` (public product home page theo showroom domain)
- `/{shopDomain}/search` (public catalog/search theo showroom domain)
- `/[locale]/product` (fallback default product page khi showroom/domain chưa setup)
- `/[locale]/dashboard` (overview)
- `/[locale]/products`, `/[locale]/products/[id]`
- `/[locale]/inventory` (items)
- `/[locale]/orders`, `/[locale]/orders/[id]`
- `/[locale]/sales/pos`, `/[locale]/sales/returns`, `/[locale]/sales/stock`, `/[locale]/sales/invoices`, `/[locale]/sales/product-entry`
- `/[locale]/makeup` (staff/admin/manager booking board)
- `/[locale]/makeup/my-schedule` (makeup artist xem lịch cá nhân)
- `/[locale]/makeup/artists` (admin xem danh sách chuyên viên + lịch từng chuyên viên)
- `/[locale]/makeup/packages` (admin/makeup artist setup gói makeup)
- `/[locale]/makeup/my-stats` (makeup artist xem thống kê riêng)
- `/[locale]/customers`, `/[locale]/customers/[id]`
- `/[locale]/payments`
- `/[locale]/calendar`
- `/[locale]/reports`
- `/[locale]/media`
- `/[locale]/categories`
- `/[locale]/settings`

---

## 9) UI/UX yêu cầu (mức BA + dev-friendly)

### 9.1 Dashboard
- Card nhóm 1 (ALL_MODULES): doanh thu/lợi nhuận/đơn hàng toàn hệ thống.
- Card nhóm 2 (RENTAL_SALE_MODULE): doanh thu/lợi nhuận/đơn hàng module bán/thuê đồ.
- Card nhóm 3 (MAKEUP_MODULE): doanh thu/lợi nhuận/đơn hàng module makeup.
- Bảng: danh sách “đến hạn trả hôm nay” + CTA “Return”.

### 9.2 Orders list
- Filter: status, date range, customer, staff.
- Quick actions: Confirm / Pick up / Return / Cancel / Settle debt.
- Tạo đơn qua modal wizard từ danh sách đơn (giữ draft theo UX rules).

### 9.3 Order detail
- Header: status, timeline
- Items table: item code, product, price, status
- Payments: list + add payment
- Incidents: add fee, attach photos (phase 2 nếu cần)
- Actions: change status + print/export

---

## 10) Quy tắc tính tiền (Pricing rules)
- `rent_amount` = Σ (rent_price của từng item theo gói/ngày)
- `fees_amount` = late_fee + damage_fee + cleaning_fee + lost_fee
- `discount_amount` nhập tay (phase 1)
- `total_amount` = rent_amount - discount + fees_amount
- Cọc:
  - `deposit_amount` có thể theo item hoặc cả đơn
  - Khi hoàn: `refund = deposit - fees_applied_to_deposit`
- Chuẩn tài chính đã chốt (Finance V1):
  - Revenue chỉ tính từ payments `POSTED` (không tính `VOIDED`)
  - `revenue_gross` nhận từ type `RENT` + `FEE`
  - `revenue_net = revenue_gross - refund_effective`
  - `DEPOSIT` theo dõi riêng, không cộng thẳng vào revenue
  - `cogs` dùng `rental_order_items.cogs_snapshot_amount` cho SALE; RENTAL fallback 0 ở MVP
  - `gross_profit = revenue_net - cogs`
  - `outstanding_debt = receivable_valid - collected_valid` (floor 0)

---

## 11) Acceptance Criteria tổng quát (Definition of Done)
- Tạo đơn, giữ item không overlap
- Hỗ trợ đầy đủ 2 loại đơn `RENTAL` và `SALE`
- Pick up → item ON_RENT
- Return/return-order → item LAUNDRY/MAINTENANCE + xử lý incident + hỗ trợ thu thêm
- Debt lifecycle đúng: `RETURNED -> DEBT -> COMPLETED`
- Thanh toán/hoàn cọc rõ ràng, báo cáo doanh thu chuẩn theo payments
- POS shift open/close + cash reconciliation hoạt động ổn định
- Module makeup có toggle admin, booking customer/staff, và lịch cá nhân cho makeup artist
- Admin xem được danh sách chuyên viên makeup và lịch theo từng chuyên viên
- Admin/makeup_artist setup được gói makeup theo policy
- Makeup artist xem được báo cáo doanh thu/lợi nhuận của riêng mình
- Dashboard admin có đủ 3 nhóm số liệu (all modules / rental-sale / makeup)
- Conflict cùng ngày/cùng buổi hiển thị warning + cho phép override save
- Shipping toggle mặc định off và fallback auto `PICKED_UP` hoạt động đúng theo policy
- Public showroom route theo `shop_domain` hoạt động (`/{shopDomain}` + `/{shopDomain}/search`)
- `shop_domain` unique toàn hệ thống và `shop_admin` chỉ thao tác trong showroom được gán
- RLS bảo vệ dữ liệu theo branch/role
- `owner_admin` không thể được cấp/sửa runtime ngoài seed/migration
- UI hỗ trợ VI/EN, mặc định VI, lưu preference theo profiles/cookie

---

## 12) Backlog đề xuất theo Phase

### Phase 1 (MVP quản trị)
- Auth + RBAC + branch
- Multi-language VI/EN (default VI)
- Trang showroom khách (catalog + chọn trước danh sách đồ muốn thử; không checkout online)
- Product/Item + ảnh + media library + product landing
- Orders (RENTAL/SALE) + return-orders + payments + notifications + reports
- Sales POS + shift open/close + shift management
- Shipping toggle (default off) + fallback rental auto `PICKED_UP`
- Makeup events (toggle, booking, conflict warning, lịch chuyên gia, danh sách chuyên viên)
- Makeup packages (admin + makeup artist setup)
- Makeup analytics (my stats cho chuyên viên + dashboard admin tách nhóm module)
- Availability check + chống overlap
- Customer phone/password sign-in + account panel cơ bản

### Phase 2
- Khách đặt thuê/checkout online hoàn chỉnh
- Tích hợp thanh toán online
- In phiếu PDF chuẩn form (song ngữ/tuỳ chọn)
- Tích hợp vận chuyển
- CRM nâng cao + automation reminders (Zalo/Email)
- PWA enablement nâng cao/offline-first UX hoàn chỉnh

---

## 13) Risks & assumptions
- Assumption: quy trình giặt/sửa có thể khác nhau theo shop → nên cấu hình trạng thái linh hoạt (nhưng MVP dùng fixed states).
- Risk: chống trùng lịch thuê nếu làm “kiểm tra app-level” dễ race condition → nên dùng constraint DB.
- Risk: makeup booking soft-warning (không block cứng) có thể tạo overbook nếu thao tác sai; cần UI cảnh báo rõ + audit override.
- Risk: nhập tiền mặt/chuyển khoản thủ công dễ sai → cần audit log + permission.
- Risk i18n: hard-code string trong UI sẽ làm rò rỉ ngôn ngữ → enforce lint/checklist PR.

---

## 14) Cập nhật theo task đã hoàn thành (snapshot)
- Đã đồng bộ theo checklist completed trong `progress/tasks.md`:
  - Core + auth + RBAC + i18n + dashboard/settings + showroom + products/inventory/customers/orders/payments/reports/calendar/notifications.
  - Sales POS module + shift open/close + admin shift management.
  - Order type `RENTAL/SALE`, order status `DEBT`, item status `SOLD`.
  - Return-order entity độc lập + settlement có additional collection.
  - Financial formulas chuẩn hóa (`FINANCE_V1_PAYMENT_POSTED_COGS`) và chart day/month/year.
  - Media library + product media picker + quota branch.
- Hạng mục còn pending theo checklist hiện tại:
  - Task `033` (PWA Enablement for Web App) chưa được đánh dấu hoàn tất.
  - Module vận chuyển ở mức toggle/fallback là phạm vi mở rộng mới, thực thi tại `docs/tasks/modules/shipping/001_shipping_module_toggle_and_rental_auto_pickup.md` (global task `065`).
  - Module Makeup là phạm vi mở rộng mới, thực thi tại `docs/tasks/modules/makeup/001..006_*.md` (global task `066-071`).
