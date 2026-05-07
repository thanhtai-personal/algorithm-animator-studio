# 001 - Bức Tranh Hệ Thống (System Landscape)

## 1) Mục tiêu sản phẩm
Hệ thống phục vụ vận hành showroom cho thuê/bán sản phẩm thời trang và makeup, gồm:
- Quản trị nội bộ (admin/staff/manager/owner_admin).
- Kênh mobile cho cùng hệ sinh thái.
- Kênh Zalo Mini App cho luồng khách/public và tác vụ rút gọn.

## 2) Thành phần runtime chính

| Thành phần | Vai trò | Trạng thái |
|---|---|---|
| `apps/web` | Web app trung tâm: UI dashboard + compatibility API adapters tạm thời | Active |
| `apps/mobile` | Expo mobile app (voice/offline + API client) | Active |
| `apps/zalo-mini-apps/*` | 4 mini apps theo domain nghiệp vụ | Active |
| `apps/server` | NestJS backend source-of-truth + DB gateway duy nhất | Migration in-progress |
| Supabase | DB/Auth/RLS/Storage/Realtime (chỉ `apps/server` truy cập DB) | Data platform chính |

## 3) Domain nghiệp vụ chính
- Auth & Profile
- Branch / Settings / Showroom config
- Products / Inventory
- Customers / CRM
- Orders / Return Orders / Availability
- Payments / Reports / Dashboard
- Sales shift / POS
- Procurement
- Makeup module
- Notifications
- Voice transcription
- Zalo Mini App flows

## 4) Giao tiếp giữa các thành phần
```mermaid
flowchart TD
  subgraph Clients
    WEB[Web Browser]
    MOB[Mobile App]
    ZALO[Zalo Mini Apps]
  end

  WEB --> W[apps/web]
  W --> NEST[apps/server]
  MOB --> NEST
  ZALO --> NEST
  NEST --> SB[(Supabase DB)]
```

Ghi chú:
- `apps/server` là backend source-of-truth.
- Chỉ `apps/server` được phép truy cập Supabase database.
- `apps/web` route layer còn lại chỉ dùng cho compatibility forwarding trong migration.

## 5) Luồng request nghiệp vụ chuẩn (web)
```mermaid
sequenceDiagram
  participant UI as Component
  participant H as Hook
  participant Q as Query
  participant S as Client Service
  participant A as apps/server Controller
  participant B as apps/server Service
  participant D as apps/server Data-access
  participant DB as Supabase

  UI->>H: user action
  H->>Q: run query/mutation
  Q->>S: call service
  S->>A: HTTP
  A->>B: delegate
  B->>D: business/data operation
  D->>DB: SQL/Auth/Storage
  DB-->>D: result
  D-->>B: dto
  B-->>A: response
  A-->>S: JSON
  S-->>Q: data
  Q-->>H: callbacks
  H-->>UI: update store + render
```

## 6) Các boundary kỹ thuật quan trọng
- Boundary 1: UI client vs server-only code
  - `apps/web/src/server/**` không được import vào client components.
- Boundary 2: Domain service vs data-access trong `apps/server`
  - business logic nằm ở `apps/server` service layer, data query nằm ở `apps/server` data-access/repository.
- Boundary 3: Supabase DB access ownership
  - chỉ `apps/server` được truy cập trực tiếp Supabase DB.
- Boundary 4: Web compatibility layer vs server source-of-truth
  - migration theo module, không big-bang.

## 7) Rủi ro kiến trúc đang tồn tại
- Một số luồng legacy còn đi qua web route layer trước khi chạm `apps/server`.
- Chưa hoàn tất decommission toàn bộ web business API cũ.
- Một số contract mini app còn mang dấu vết legacy (variant fields), cần đồng bộ dần theo schema mới.
