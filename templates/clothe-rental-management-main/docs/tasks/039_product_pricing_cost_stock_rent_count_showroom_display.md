# Task 039 - Product pricing/cost/rent count + showroom display (đánh giá thực tế)

## Input ban đầu
- Bổ sung vào form tạo sản phẩm các thuộc tính:
  - giá thuê/ngày
  - giá bán
  - giá nhập
- Sửa API để nhận/lưu/cập nhật các field mới.
- Thêm migration SQL nếu schema chưa có cột tương ứng.
- Thêm `số lần đã được thuê` vào thông tin sản phẩm, giá trị bằng tổng số đơn thuê thành công.
- Cập nhật hiển thị tương ứng trên showroom page.

## Kiểm tra hiện trạng so với vận hành thực tế
| Nhóm thông tin | Hiện trạng | Đánh giá |
|---|---|---|
| Nhận diện sản phẩm | Đã có code, name, category, gender, material, tags, media | Đủ cho MVP catalog |
| Giá thuê/cọc | Đang nằm ở `product_variants` (`price_1d`, `price_per_day`, `default_deposit_amount`) | Chưa đủ cho nhập liệu nhanh ở mức product overview |
| Giá bán/giá nhập | Chưa có field product-level | Thiếu cho nghiệp vụ bán thanh lý và theo dõi chi phí |
| Trạng thái kinh doanh thuê/bán | Chưa có cờ sản phẩm có cho thuê / có cho bán | Thiếu để tách sản phẩm chỉ cho thuê, chỉ bán hoặc cả hai |
| KPI thuê thành công | Chưa có `successfulRentCount` | Thiếu dữ liệu xếp hạng/độ phổ biến |
| Hiển thị showroom | Hiện chủ yếu giá thuê tham khảo + cọc | Thiếu thông tin phổ biến: số lượt thuê, giá bán (nếu cho bán) |
| Bảo mật dữ liệu giá nhập | Chưa có field cost nên chưa có chính sách che dữ liệu | Cần ràng buộc rõ khi thêm `purchasePrice` |

## Kết luận
- Dữ liệu product hiện tại **chưa đủ** so với vận hành thực tế.
- Task 039 cần mở rộng thêm một số trường ngoài input ban đầu để dùng được trong bối cảnh thuê + bán + showroom public.

## Mục tiêu
- Mở rộng model sản phẩm để lưu đủ thông tin tài chính ở mức `product overview`.
- Đồng bộ luồng `Component -> Hook -> Query -> Service -> API -> DB`.
- Bổ sung metric `successfulRentCount` và expose cho admin + showroom theo phạm vi public-safe.
- Không phá luồng biến thể/items hiện có.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/010_orders_list_and_create_flow.md`
- `docs/tasks/011_order_detail_pickup_return_flow.md`
- `docs/tasks/018_customer_showroom_preselection_page.md`
- `docs/tasks/036_bugs_admin_products_page.md`

## Mapping màn hình/source
- Product create form (dashboard):
  - `apps/web/src/features/products/components/ProductsListPage.tsx`
  - `apps/web/src/features/products/hooks/useProductsListPage.ts`
- Product contracts + API:
  - `apps/web/src/types/productsCatalog.ts`
  - `apps/web/src/features/products/services/productsClientService.ts`
  - `apps/web/src/features/products/queries/useProductsQueries.ts`
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/app/api/products/route.ts`
- Showroom display:
  - `apps/web/src/features/showroom/components/templates/ShowroomProductHomeV1.tsx`
  - `apps/web/src/features/showroom/components/ShowroomProductDetailPage.tsx`
  - `apps/web/src/features/showroom/hooks/useShowroomListPage.ts`
  - `apps/web/src/features/showroom/stores/showroomStore.ts`
  - `apps/web/src/features/settings/hooks/useSettingsShowroomPagesPage.ts`
- SQL:
  - `apps/web/sql/011_products_pricing_stock_and_rent_metrics.sql` (mới)
  - `apps/web/sql/README.md` (cập nhật run order)

## Data contract đề xuất
### A) Bắt buộc cho MVP Task 039 (thêm vào `products`)
- `rent_price_per_day numeric(14,2) null check (rent_price_per_day >= 0)`
- `sale_price numeric(14,2) null check (sale_price >= 0)`
- `purchase_price numeric(14,2) null check (purchase_price >= 0)`
- `successful_rent_count integer not null default 0 check (successful_rent_count >= 0)`
- `is_rentable boolean not null default true`
- `is_saleable boolean not null default false`

### Ghi chú nghiệp vụ cho `successful_rent_count`
- Source of truth: tổng số **đơn thuê COMPLETED** có chứa item thuộc product.
- Không cho client truyền trực tiếp trường này trong create/update product API.
- Có 2 cơ chế:
  - cập nhật tức thời khi order chuyển trạng thái `COMPLETED`;
  - script rebuild/backfill để đối soát dữ liệu lịch sử.

## API contract đề xuất
### Admin create/update
- `POST /api/products` nhận thêm:
  - `rentPricePerDay?: number | null`
  - `salePrice?: number | null`
  - `purchasePrice?: number | null`
  - `isRentable?: boolean`
  - `isSaleable?: boolean`
- `PATCH /api/products/{productId}` (overview) nhận các field tương tự.

### Admin read
- `GET /api/products` + `GET /api/products/{id}` trả về thêm:
  - `rentPricePerDay`
  - `salePrice`
  - `purchasePrice` (chỉ role được phép)
  - `isRentable`
  - `isSaleable`
  - `successfulRentCount`

### Showroom/public read
- `GET /api/showroom/products` + `GET /api/showroom/products/{id}` chỉ expose:
  - `rentPricePerDay` (khi `isRentable = true`)
  - `salePrice` (khi `isSaleable = true` và policy hiển thị bật)
  - `successfulRentCount`
  - `purchasePrice` luôn không public.

## Quy tắc nghiệp vụ bắt buộc
- Giá không âm.
- `purchasePrice` là dữ liệu nhạy cảm: không trả cho showroom/public.
- Staff không được chỉnh `purchasePrice` (chỉ Owner/Admin, hoặc Manager theo policy hiện hành).
- `successfulRentCount` chỉ đồng bộ từ order domain, không update tay qua endpoint product.
- Nếu `isRentable = false` thì showroom không hiển thị giá thuê.
- Nếu `isSaleable = false` thì showroom không hiển thị giá bán.

## In-scope
- Form tạo/sửa overview sản phẩm thêm field:
  - `rentPricePerDay`, `salePrice`, `purchasePrice`, `isRentable`, `isSaleable`.
- Cập nhật type/query/service/API cho create/update/list/detail.
- SQL migration + backfill dữ liệu mặc định.
- Đồng bộ metric `successfulRentCount`.
- Cập nhật showroom card/detail hiển thị:
  - giá thuê/ngày, giá bán (theo cờ hiển thị),
  - số lượt thuê thành công.
- Cập nhật settings showroom display config để có thể bật/tắt:
  - `showSalePriceReference`
  - `showSuccessfulRentCount`

## Out-of-scope
- Thay đổi toàn bộ mô hình kho sang stock-only.
- Tính profit đầy đủ từ `purchasePrice` trong reports.
- Cơ chế dynamic pricing phức tạp theo ngày/sự kiện.

## Prompt gợi ý cho Codex
```text
Mục tiêu: bổ sung thông tin product còn thiếu cho vận hành thực tế (pricing/cost/rent count + flags thuê/bán), đồng bộ admin API và showroom display.

Yêu cầu:
1) UI form sản phẩm (create + overview):
   - thêm: rentPricePerDay, salePrice, purchasePrice, isRentable, isSaleable
   - validate non-negative
   - enforce role: purchasePrice chỉ role được phép

2) API/contracts:
   - cập nhật DTO/payload cho admin list/detail/create/update
   - showroom DTO chỉ trả field public-safe, không lộ purchasePrice
   - thêm successfulRentCount read-only

3) DB migration:
   - thêm cột mới vào products + constraints
   - backfill hợp lý cho dữ liệu cũ
   - có SQL rebuild successfulRentCount từ orders COMPLETED

4) successfulRentCount:
   - đồng bộ khi order chuyển COMPLETED
   - có script đối soát/rebuild
   - không cho client set trực tiếp

5) Showroom:
   - card/detail hiển thị giá thuê, giá bán (nếu enabled), successfulRentCount
   - thêm display toggles trong settings showroom page
```

## Done criteria (coding)
- Form tạo/sửa product overview lưu được các field mới.
- API admin create/update/list/detail hoạt động với field mới và đúng role gate.
- API showroom không lộ `purchasePrice`, hiển thị đúng field public-safe.
- SQL migration idempotent, backfill chạy được.
- `successfulRentCount` tăng đúng khi có đơn `COMPLETED`.
- `npm run lint:mvp` và `npm run typecheck:mvp` pass.

## Nhắc test nhanh
- Create/update product:
  - nhập đủ field mới, reload vẫn giữ dữ liệu.
  - nhập âm -> báo lỗi đúng.
- RBAC:
  - Staff không sửa được `purchasePrice`.
  - Owner/Admin sửa được.
- Rental count:
  - tạo đơn có sản phẩm, hoàn tất đơn, kiểm tra `successfulRentCount` tăng đúng.
  - chạy rebuild để đối chiếu dữ liệu lịch sử.
- Showroom:
  - card/detail hiển thị đúng giá thuê/giá bán/số lượt thuê theo display config.
  - không lộ `purchasePrice`.
- Lệnh:
  - `cd apps/web && npm run lint:mvp`
  - `cd apps/web && npm run typecheck:mvp`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 039 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 038 /a - [ ] 039 | Product practical pricing/cost/rent metrics + showroom display | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 039 |- [x] 039 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 039
  - Task file: docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
