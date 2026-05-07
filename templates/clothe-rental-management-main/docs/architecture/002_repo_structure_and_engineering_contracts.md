# 002 - Cấu Trúc Repo Và Engineering Contracts

## 1) Monorepo structure (thực tế)
```text
apps/
  web/
  mobile/
  server/
  zalo-mini-apps/
docs/
  architecture/
  tasks/
  guides/
  release/
progress/
templates/
```

## 2) Bản đồ app

| Path | Tech | Vai trò |
|---|---|---|
| `apps/web` | Next.js 16, React 19, TS | Admin UI + compatibility API adapters |
| `apps/mobile` | Expo 53, RN 0.79, React 19 | Mobile app |
| `apps/server` | NestJS 11 | API source-of-truth + DB gateway duy nhất |
| `apps/zalo-mini-apps/*` | Vite + React 18 + ZMP SDK | Mini app channels |

## 3) Contract layering bắt buộc

### 3.1 Client-side
```text
Component -> Hook -> Query -> Service -> API (apps/server)
```

### 3.2 Server-side (apps/server)
```text
Controller -> Service -> Data-access -> Supabase
```

## 4) Dependency law
- Chỉ đi xuống tầng.
- Không import chéo tầng theo hướng ngược.
- Không để component gọi service trực tiếp.
- Không để route thao tác DB trực tiếp.
- Không import `src/server/**` vào client bundle.
- Không truy cập Supabase DB trực tiếp từ `apps/web`, `apps/mobile`, `apps/zalo-mini-apps/*`.

## 5) Feature module shape (web)
`apps/web/src/features/<feature>/` chuẩn:
- `components/`
- `hooks/`
- `queries/`
- `services/`
- `stores/`
- `types/`
- `utils/`
- `constants.ts`
- `index.ts`

## 6) Shared layers (web)
- `src/components`: shared UI primitives.
- `src/lib`: cross-feature infra libs (api client, i18n, theme, voice, sentry).
- `src/types`: shared DTO/types giữa nhiều module.
- `src/utils`: utility thuần, không domain-heavy.

## 7) Store-first hydration rule
1. Query fetch dữ liệu.
2. Merge vào MobX store.
3. UI render từ store.

Không được để query result và store cùng ownership một nguồn dữ liệu hiển thị.

## 8) Quy định file responsibility
- Một file một trách nhiệm chính.
- Refactor ưu tiên root-cause, không workaround UI-only nếu lỗi là data/contract.
- Với flow auth/offline/voice, bắt buộc regression check khi merge.

## 9) Boundary checklist trước khi merge
- [ ] Có phá layering không?
- [ ] Có import server-only code vào client không?
- [ ] Có duplication state ownership không?
- [ ] Có thay đổi flow auth/offline/voice mà không test không?
- [ ] Có thay đổi API contract mà chưa cập nhật caller không?
- [ ] Có phát sinh truy cập Supabase DB ở runtime ngoài `apps/server` không?
