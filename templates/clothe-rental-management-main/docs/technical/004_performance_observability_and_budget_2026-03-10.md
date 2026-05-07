# Performance Observability + Regression Budget (2026-03-10)

## 1) Phạm vi ưu tiên

### Routes critical
- `/[locale]/dashboard`
- `/[locale]/sales/pos`
- `/[locale]/inventory`
- `/[locale]/products`
- `/[locale]/showroom`
- `/[locale]/product`

### APIs critical
- `/api/products`
- `/api/inventory`
- `/api/customers`
- `/api/showroom/products`
- `/api/return-orders/sources`

## 2) Metrics chuẩn hóa

### Route metrics (lab)
- `lcpMs`: Largest Contentful Paint (ms)
- `inpMs`: Interaction to Next Paint (ms)
- `tbtMs`: Total Blocking Time (ms)
- `jsKb`: JS transfer size cho route (KB)

### API metrics
- `p95Ms`: p95 latency server-side (ms)
- `payloadKb`: kích thước response body (KB)

## 3) Budget + baseline

- Budget file: `progress/performance/budget.json`
- Baseline file: `progress/performance/2026-03-10-baseline.json`
- Latest snapshot: `progress/performance/current.json`

Lưu ý: baseline ngày 2026-03-10 là baseline seed để bật regression gate ngay. Khi có run benchmark ổn định (cùng network/device/dataset), cập nhật baseline bằng số đo thực.

## 4) API observability tối thiểu

Đã bật observer cho các API critical trên route layer:
- Gắn `Server-Timing` header vào response.
- Ghi perf log có cấu trúc dạng `[perf][api] ...` khi:
  - `PERF_OBS_LOG=1`, hoặc
  - latency vượt ngưỡng `PERF_OBS_WARN_MS` (default `600ms`).

Biến môi trường:
- `PERF_OBS_LOG=1`: log mọi request thuộc API đã gắn observer.
- `PERF_OBS_WARN_MS=700`: đổi ngưỡng cảnh báo request chậm.

## 5) Regression gate

Chạy từ `apps/web`:

```bash
npm run perf:budget
```

Gate fail khi:
1. Bất kỳ metric nào vượt budget hard limit.
2. Bất kỳ metric nào vượt baseline quá `15%` (mặc định).

Custom ngưỡng regression:

```bash
node ./scripts/perf/check-performance-budget.mjs --max-regression-pct 10
```

## 6) Quy trình đo chuẩn cho release

1. Build production:
```bash
cd apps/web && npm run build
```
2. Chạy Lighthouse cho route critical trong điều kiện cố định (desktop profile, network throttling cố định, cache cleared).
3. Benchmark API critical với dataset đủ lớn; lấy `p95Ms` + payload trung bình.
4. Ghi snapshot vào `progress/performance/current.json`.
5. Chạy regression gate:
```bash
cd apps/web && npm run perf:budget
```
6. Nếu pass, copy snapshot sang file dated mới (vd `progress/performance/2026-03-18-release-candidate.json`) và update `current.json`.

## 7) PR review checklist (performance)
- [ ] Có route/API critical nào bị ảnh hưởng bởi thay đổi này?
- [ ] Snapshot `current.json` đã cập nhật theo thay đổi thực tế?
- [ ] `npm run perf:budget` pass?
- [ ] Nếu vượt budget, đã có issue/task follow-up và mitigation plan rõ ràng?
- [ ] Không đánh đổi correctness/RBAC/i18n để lấy performance ngắn hạn?
