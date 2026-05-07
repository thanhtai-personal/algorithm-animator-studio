# Chẩn đoán Performance - Web App (2026-03-10)

## Phạm vi audit
- App: `apps/web`
- Cách audit: static code review + build production (`cd apps/web && npm run build`)
- Mục tiêu: tìm lỗi performance có thể tái hiện ngay và khoanh vùng tối ưu theo mức ưu tiên.

## Tóm tắt nhanh
- Có **3 lỗi performance mức cao** cần tạo bug riêng ngay.
- Có các vùng cải thiện **medium-impact** ở frontend render/bundle/network.
- Build hiện pass nhưng có warning metadata (`metadataBase`) và chưa có budget/perf gate.

## Lỗi performance mức cao (cần fix trước)

### 1) Return order source bị hard-cap 300 + paginate cục bộ
- File: `apps/web/src/server/data-access/returnOrders.ts`
- Bằng chứng:
  - gọi `listOrdersForAdmin(... page: 1, pageSize: 300)` tại line `314-321`
  - sau đó lọc và `filtered.slice(...)` tại line `352`
- Hậu quả:
  - dữ liệu trang sau có thể **thiếu đơn hợp lệ** nếu số source > 300.
  - CPU/memory tăng do lọc/slice tại server app layer thay vì DB.

### 2) POS tính tồn khả dụng bằng query inventory pageSize=500
- File: `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Bằng chứng:
  - `useInventoryListQuery(... pageSize: 500)` tại line `494`
  - tính `availableCountByProductId` từ dataset này tại line `544`
- Hậu quả:
  - sai số khả dụng khi inventory READY > 500 bản ghi.
  - payload/network nặng không cần thiết cho màn POS.

### 3) Nhiều list API đang overfetch và paginate trong memory
- Files:
  - `apps/web/src/server/data-access/customers.ts`
    - `fetchCustomers()` load toàn bộ rồi `paginateItems(...)` tại line `694-717`
  - `apps/web/src/server/data-access/inventory.ts`
    - `fetchItems()` load toàn bộ, sau đó `paginateItems(...)` tại line `436-459`, `519-585`
  - `apps/web/src/server/data-access/products.ts`
    - list admin/showroom đều `fetchProducts()` trước rồi mới `paginateItems(...)` tại line `1486-1521`, `2681-2841`
- Hậu quả:
  - query latency tăng tuyến tính theo tổng dữ liệu.
  - memory pressure tăng ở server runtime.
  - TTFB/response time không ổn định khi scale.

## Vùng tối ưu medium-impact

### A) Render inefficiency trong grouping loop
- File: `apps/web/src/features/sales/hooks/useSalesStockPage.ts`
- Bằng chứng: `existing.items = [...existing.items, item]` trong loop tại line `162`.
- Hậu quả: tạo array mới mỗi vòng, có thể thành O(n^2) copy cost với dataset lớn.

### B) Ảnh public/admin đang dùng `<img>` thay vì `next/image`
- Files:
  - `apps/web/src/components/layout/PublicSiteHeader.tsx:66`
  - `apps/web/src/features/product-landing/components/ProductLandingPage.tsx:55,132`
  - `apps/web/src/features/app-shell/components/DashboardShell.tsx:113`
- Hậu quả: khó tối ưu LCP/bytes/format responsive theo device.

### C) QueryClient chưa có default tuning
- File: `apps/web/src/app/providers.tsx:29`
- Bằng chứng: `new QueryClient()` chưa set `defaultOptions`.
- Hậu quả: hành vi refetch/retry mặc định có thể gây request churn không cần thiết.

### D) Missing metadataBase warning khi build
- Ghi nhận từ `npm run build`:
  - warning: `metadataBase property in metadata export is not set...`
- Ảnh hưởng: SEO/social metadata chưa chuẩn; gián tiếp ảnh hưởng discoverability và cache behavior kỳ vọng.

## Định hướng ưu tiên
1. Fix ngay bug 007/008/009 (được tách file trong `docs/bugs`).
2. Chạy Task 070 để push pagination/filter xuống DB + giảm overfetch.
3. Chạy Task 071 để tối ưu frontend render/image/bundle.
4. Chạy Task 072 để có baseline, budget và performance regression gate.

## Lệnh đã chạy
- `cd apps/web && npm run build` (pass)
- `rg`/`sed` để trace hotspot theo file/line.
