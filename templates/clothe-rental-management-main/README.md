# KATA Tool - Clothing Rental Management

Monorepo cho hệ sinh thái quản lý showroom thuê/bán đồ + makeup + Zalo mini apps.

## 1) Apps trong repo
- `apps/web`: Next.js admin UI + compatibility API adapters tạm thời.
- `apps/mobile`: Expo mobile app.
- `apps/server`: NestJS backend source-of-truth + DB gateway duy nhất tới Supabase.
- `apps/zalo-mini-apps/*`: các mini app theo domain.

## 1.1 Rule kiến trúc bắt buộc
- Chỉ `apps/server` được phép truy cập Supabase database.
- `apps/web`, `apps/mobile`, `apps/zalo-mini-apps/*` phải đi qua API `apps/server`.

## 2) Tài liệu kiến trúc/kỹ thuật (điểm vào chính)
- [docs/architecture/000_architecture_index.md](docs/architecture/000_architecture_index.md)

## 3) Quick start

### Web
```bash
cd apps/web
npm install
npm run dev
```

### Server (Nest)
```bash
cd apps/server
npm install
npm run start:dev
```

### Mobile
```bash
cd apps/mobile
npm install
npm run start
```

## 4) Database SQL runbook (Supabase)
- `apps/web/sql/full_setup_schema.sql`
- `apps/web/sql/full_seed_data.sql`
- `apps/web/sql/reset_data.sql`
- `apps/web/sql/hard_reset_public_schema.sql`

Thứ tự cài mới khuyến nghị:
1. `hard_reset_public_schema.sql` (nếu cần reset sạch schema public)
2. `full_setup_schema.sql`
3. `full_seed_data.sql`

## 5) Lộ trình migration backend
- Bộ task migration Nest:
  - `docs/tasks/modules/nest-server/*`

## 6) Chuẩn bắt buộc cho task mới
- Architecture V2 target:
  - `docs/architecture/010_optimized_target_architecture.md`
- Task compliance standard:
  - `docs/architecture/011_task_architecture_compliance_standard.md`
- Task template:
  - `docs/tasks/000_task_template_architecture_v2.md`
