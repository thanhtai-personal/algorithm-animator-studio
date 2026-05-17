# Chuẩn hóa localize text trong Kata Studio

File script:

```bash
node scripts/normalize-localized-page-text.mjs
```

Mục tiêu:

- gom các text UI còn hard-code vào cơ chế i18n hiện có;
- tránh sửa tay trực tiếp nhiều đoạn `app/i18n.tsx` vì file này hay bị lệch patch;
- script chạy dạng idempotent: chạy lại nhiều lần không nhân đôi key;
- nếu một pattern đã được sửa trước đó, script sẽ bỏ qua và in trong mục `Skipped patterns`.

Sau khi chạy script:

```bash
npm run build
```

Nếu muốn xem diff:

```bash
git diff
```
