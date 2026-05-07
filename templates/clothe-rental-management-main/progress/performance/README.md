# Performance Snapshots

Mục tiêu thư mục này là lưu snapshot định lượng cho route/API trọng yếu để phát hiện regression sớm.

## Files hiện có
- `budget.json`: ngưỡng budget chính thức cho regression gate.
- `2026-03-10-baseline.json`: baseline seed sau Task 070/071.
- `current.json`: snapshot mới nhất dùng cho command gate.

## JSON contract
```json
{
  "meta": {
    "capturedAt": "YYYY-MM-DD",
    "source": "lighthouse+api-benchmark"
  },
  "routes": {
    "/vi/dashboard": {
      "lcpMs": 0,
      "inpMs": 0,
      "tbtMs": 0,
      "jsKb": 0
    }
  },
  "apis": {
    "/api/products": {
      "p95Ms": 0,
      "payloadKb": 0
    }
  }
}
```

## Regression gate
Chạy từ `apps/web`:

```bash
npm run perf:budget
```

Script sẽ fail nếu:
- Metric vượt `budget.json`, hoặc
- Metric vượt baseline quá ngưỡng mặc định 15%.

Có thể override input/budget/baseline:

```bash
node ./scripts/perf/check-performance-budget.mjs \
  --input ../../progress/performance/current.json \
  --budget ../../progress/performance/budget.json \
  --baseline ../../progress/performance/2026-03-10-baseline.json \
  --max-regression-pct 15
```
