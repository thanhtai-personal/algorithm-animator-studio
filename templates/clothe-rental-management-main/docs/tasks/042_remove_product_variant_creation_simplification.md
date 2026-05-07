# Task 042 - Loại Bỏ Tính Năng Tạo Variant Sản Phẩm (Đơn Giản Hóa + Cleanup Có Kiểm Soát)

## Input ban đầu
- Cần loại bỏ tính năng tạo variant thủ công vì quá phức tạp cho người dùng vận hành.
- Cần đảm bảo không phá dữ liệu/luồng đang phụ thuộc `variant_id`.
- Cần mô tả rõ cả phần UI/API cleanup và script SQL dọn relation dư.

## Bối cảnh hiện tại
- Trước đây flow tạo sản phẩm yêu cầu nhập variant (mã, tên, size/màu, pricing theo variant).
- Hệ thống backend từng phụ thuộc lịch sử vào `product_variants`:
  - `items.variant_id`
  - `rental_order_items.variant_id`
  - report/inventory/orders read-model dựa vào variant.
- Vì vậy cần chia thành 2 pha:
  - pha tương thích runtime (không phá vận hành);
  - pha cutover DB/destructive khi code đã sẵn sàng.

## Mục tiêu
- Loại bỏ hoàn toàn trải nghiệm nhập variant thủ công khỏi UI/flow người dùng thường.
- Chặn khả năng mutate variant qua public/admin API capability.
- Chuyển runtime sang model product-level (`items.product_id`, `rental_order_items.product_id`) để không còn phụ thuộc relation variant.
- Chuẩn bị sẵn migration SQL để drop relation variant dư khi sẵn sàng cutover.

## Phân pha thực thi (bắt buộc)
- **Pha A - Runtime-safe compatibility (áp dụng ngay):**
  - bỏ UI nhập/chọn variant;
  - `POST /api/sales/products` nhận payload `pricing` thay cho `variant`;
  - server tự tạo `DEFAULT` variant và map item vào đó;
  - endpoint mutate variant trả `410` (deprecated/blocked);
  - giữ schema variant để không phá inventory/orders/reports đang chạy.
- **Pha B - Schema cutover (destructive, chạy khi đã sẵn sàng):**
  - migration drop `items.variant_id`, `rental_order_items.variant_id`, `variant_name_snapshot`, `product_variants`;
  - chuyển linkage item sang `items.product_id`;
  - rewrite trigger/function sync `successful_rent_count` để không join `product_variants`.
  - refactor runtime `products/orders/inventory/reports` sang product-level read/write.

## Trạng thái triển khai hiện tại
- Đã làm xong Pha A.
- Đã bổ sung script Pha B: `apps/web/sql/014_remove_variant_relations_cutover.sql`.
- Đã refactor runtime code sang product-level cho:
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/server/data-access/inventory.ts`
  - `apps/web/src/server/data-access/reports.ts`
- Bước còn lại để sạch schema tuyệt đối: chạy migration `014_remove_variant_relations_cutover.sql` trên DB môi trường mục tiêu.

## Phụ thuộc
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/009_orders_domain_and_availability_core.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`

## Mapping màn hình/source
- Sales Product Entry simplification:
  - `apps/web/src/features/sales/components/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/hooks/useSalesProductEntryPage.ts`
  - `apps/web/src/types/salesProductEntry.ts`
- Showroom/Product UI cleanup bổ sung:
  - `apps/web/src/features/showroom/components/ShowroomProductDetailPage.tsx` (bỏ block chọn variant)
  - `apps/web/src/features/showroom/hooks/useShowroomProductDetailPage.ts` (bỏ copy variant)
  - `apps/web/src/features/products/constants.ts` (bỏ tab `items` trong product detail)
  - `apps/web/src/features/products/hooks/useProductDetailPage.ts`
  - `apps/web/src/features/products/components/ProductDetailPage.tsx`
- Product variant API capability cleanup:
  - `apps/web/src/app/api/products/[productId]/variants/route.ts`
  - `apps/web/src/app/api/products/[productId]/variants/[variantId]/route.ts`
  - `apps/web/src/server/services/productsService.ts`
- Server/data-access compatibility layer:
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/server/data-access/inventory.ts`
  - `apps/web/src/server/data-access/reports.ts`
- SQL cutover:
  - `apps/web/sql/014_remove_variant_relations_cutover.sql`
  - `apps/web/sql/README.md`

## Định nghĩa “clean” (rõ ràng để nghiệm thu)
- **Clean UX (bắt buộc):**
  - không còn form nhập variant khi tạo sản phẩm;
  - không còn section “Lựa chọn biến thể” ở showroom product detail;
  - không còn tab `Items` ở admin product detail.
- **Clean API capability (bắt buộc):**
  - `POST/PATCH/DELETE /api/products/*/variants*` bị chặn (`410`).
- **Clean runtime compatibility (bắt buộc):**
  - tạo product + items vẫn chạy bình thường;
  - inventory/orders/reports không regression.
- **Clean schema tuyệt đối (optional, chỉ sau cutover):**
  - không còn `product_variants`, `variant_id`, `variant_name_snapshot` trong DB.

## Tiêu chí kiểm tra “đã thực sự clean chưa?”
- Nếu theo nghĩa **UX/API clean**: đạt khi pass các điều kiện bắt buộc ở trên.
- Nếu theo nghĩa **full-stack clean code/runtime**: đạt (đã bỏ phụ thuộc runtime vào `product_variants`/`variant_id`).
- Nếu theo nghĩa **full-stack clean runtime+schema trên môi trường thật**: cần chạy migration `014_remove_variant_relations_cutover.sql`.

## API contract mục tiêu
- `POST /api/sales/products`
  - payload dùng `pricing` + `product` + `items`.
  - server ghi item theo `product_id` (không cần mutate variant table).
- `POST/PATCH/DELETE /api/products/{productId}/variants*`
  - blocked/deprecated (`410`, error code `MANUAL_VARIANT_MUTATION_DISABLED`).
- `GET product detail`
  - pha tương thích có thể vẫn trả `variants[]` để không phá module cũ.

## In-scope
- Bỏ UI variant thủ công ở các màn vận hành.
- Bỏ capability mutate variant công khai.
- Refactor runtime sang product-level (`items.product_id`, `rental_order_items.product_id`) để bỏ phụ thuộc variant relations.
- Bổ sung migration SQL cutover để drop relation dư.

## Out-of-scope
- Chạy migration destructive trực tiếp trên production mà chưa đánh giá impact.

## Prompt gợi ý cho Codex
```text
Mục tiêu: loại bỏ variant thủ công khỏi UX/API nhưng không gây vỡ runtime đang phụ thuộc variant_id,
đồng thời chuẩn bị migration SQL cutover để dọn sạch relation variant khi sẵn sàng.

Yêu cầu:
1) UI cleanup:
   - bỏ input variant trong Sales Product Entry
   - bỏ section chọn variant ở Showroom Product Detail
   - bỏ tab Items ở Product Detail admin

2) API/runtime cleanup:
   - payload sales create dùng pricing thay vì variant
   - server ghi item theo `product_id`, không đọc/ghi `product_variants`
   - chặn endpoint mutate variant trả 410

3) SQL cutover script:
   - thêm migration drop relation variant dư và rewrite successful_rent_count triggers
   - cập nhật SQL runbook

4) Validation:
   - `cd apps/web && npm run lint:mvp`
   - `cd apps/web && npm run typecheck:mvp`

5) Audit clean:
   - kết luận rõ: UX/API clean hay full-stack clean
```

## Done criteria (coding)
- [x] Không còn UI nhập/chọn variant ở các màn user-facing nêu trên.
- [x] Endpoint mutate variant bị chặn.
- [x] Runtime data-access chuyển sang product-level cho products/orders/inventory/reports (không còn query `product_variants`/`variant_id`).
- [x] Có script SQL cutover drop relation variant dư.
- [x] `lint:mvp` + `typecheck:mvp` pass.

## Nhắc test nhanh
- Sales Product Entry:
  - tạo sản phẩm mới không có trường variant.
  - tạo batch item thành công.
- Showroom product detail:
  - không còn section chọn biến thể.
- Product detail admin:
  - không còn tab `Items`.
- API:
  - gọi thử `/api/products/{id}/variants` POST/PATCH/DELETE -> nhận `410`.
- SQL readiness:
  - review script `014_remove_variant_relations_cutover.sql` trước khi áp dụng.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 042 thì thêm mới:
  ~~~bash
  sed -i '/^- \[x\] 041 /a - [ ] 042 | Remove manual product variant creation (simplified product entry + safe compatibility) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 042 |- [x] 042 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 042
  - Task file: docs/tasks/042_remove_product_variant_creation_simplification.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
