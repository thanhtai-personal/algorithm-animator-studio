# Đánh Giá Rủi Ro & Mức Sẵn Sàng Thực Thi Roadmap

> Cập nhật: 2026-02-26  
> Phạm vi review: `docs/000_Business_requests.md`, `docs/001_wireframe.md`, `docs/tasks/000_*.md`, `progress/tasks.md`

## Kết luận nhanh (executive summary)
- `Đủ tốt để triển khai tuần tự từng task` (coding-first) với kiểm soát chặt.
- `Chưa đủ an toàn để triển khai song song nhiều task` nếu chưa bổ sung thêm tài liệu chuẩn bị (parallel plan + decision log + coding-rule enforcement checklist).
- Bộ `docs/tasks` hiện đã có cấu trúc tốt:
  - mục tiêu
  - phụ thuộc
  - config cần chuẩn bị
  - done criteria (coding)
  - nhắc test nhanh
  - cập nhật tiến độ
- Điểm thiếu chính không nằm ở module scope, mà nằm ở `governance khi thực thi` (song song, quyết định mở, chuẩn hóa coding-rule evidence).

## Readiness Matrix (đánh giá hiện tại)
- Roadmap coverage theo PRD/wireframe (module + thứ tự): `8/10`
- Readiness để làm tuần tự từng task: `7.5/10`
- Readiness để làm song song (nhiều task cùng lúc): `4.5/10`
- Bảo đảm coding rule trong lúc triển khai (tài liệu + nhắc nhở): `6/10`
- Mức chuẩn bị môi trường/config trước khi bắt đầu: `6/10`

## Findings (ưu tiên theo mức độ)

### 1) High - Chưa có kế hoạch chạy task song song (parallel execution plan) nên rất dễ đụng nhau
**Rủi ro**
- Task docs có `Phụ thuộc`, nhưng chưa có ma trận `task nào chạy song song được / task nào khóa`.
- Làm song song dễ conflict ở các file nền:
  - `apps/web/src/app/[locale]/*`
  - `src/components` shared UI
  - `src/constants`, `src/types`
  - SQL migration numbering / schema contracts

**Hậu quả**
- Merge conflict lớn
- Lệch conventions (enum/status/DTO)
- Rework do task sau overwrite quyết định task trước

**Đề xuất bổ sung trước khi chạy song song**
- Tạo `progress/parallel-plan.md` với:
  - lane A/B/C
  - file ownership tạm thời theo lane
  - “integration checkpoint” sau các mốc `005`, `009`, `012`, `016`
- Mỗi task thêm nhãn:
  - `parallel-safe: yes/no`
  - `shared-files-risk: low/medium/high`

**Trạng thái**
- `Open (blocking for parallel execution)`

---

### 2) High - Chưa có Decision Log tập trung cho các quyết định mở (config/business rules)
**Rủi ro**
- Mỗi task có `Config cần chuẩn bị`, nhưng chưa có nơi ghi quyết định cuối cùng.
- Các quyết định mở quan trọng xuất hiện rải rác:
  - date range semantics `[start, end)` vs inclusive
  - refund amount convention (dương + type=REFUND hay amount âm)
  - guest policy cho showroom
  - branch scoping strategy
  - late fee formula
  - enum naming canonical

**Hậu quả**
- Task sau dùng config khác task trước
- DB/app/report tính toán lệch nhau

**Đề xuất bổ sung**
- Tạo `progress/decisions.md` (bắt buộc cập nhật trước khi bắt đầu task liên quan)
- Mỗi quyết định ghi:
  - `Decision ID`
  - `Context`
  - `Chosen option`
  - `Impacted tasks`
  - `Date`

**Trạng thái**
- `Open (blocking for error-minimization goal)`

---

### 3) High - Coding rule có nhắc trong roadmap nhưng chưa có checklist thực thi bắt buộc cho từng lần làm task
**Rủi ro**
- `docs/tasks/000_task_index.md` đã nhắc architecture contract, nhưng chưa có “evidence template” buộc người thực hiện chứng minh đã tuân thủ.
- Khi task lớn (orders, inventory, settings), rất dễ lách rule:
  - component chứa business logic
  - hook gọi service trực tiếp
  - UI render trực tiếp từ query data
  - client import `server/**`

**Hậu quả**
- Drift kiến trúc sau vài task
- Rework lớn khi audit coding rule

**Đề xuất bổ sung**
- Tạo `progress/coding-rule-checklist.md` hoặc thêm block chuẩn vào `progress/tasks.md` completion log:
  - `Layers touched`
  - `Any component business logic? (yes/no)`
  - `Any hook -> service direct call? (yes/no, justify)`
  - `Store-first hydration verified? (yes/no/N/A)`
  - `Client/server boundary verified?`
- Với task có query/store:
  - bắt buộc ghi `query -> store merge path`

**Trạng thái**
- `Open (high priority before Task 003+)`

---

### 4) High - Chưa có preflight checklist môi trường (Supabase/OAuth/Storage/seed) ở mức toàn dự án
**Rủi ro**
- Config hiện được nêu theo từng task, nhưng thiếu checklist tổng trước khi bắt đầu.
- Dễ gặp lỗi triển khai giữa chừng:
  - thiếu OAuth redirect URL
  - thiếu bucket name
  - seed admin/profile/branch không đồng bộ
  - chạy nhầm DB (staging/prod)

**Hậu quả**
- Mất thời gian debug infra thay vì coding
- Seed/schema lệch môi trường

**Đề xuất bổ sung**
- Tạo `docs/tasks/000_preflight_checklist.md` hoặc mở rộng `docs/tasks/000_task_index.md` với:
  - Env var matrix (`local/staging`)
  - OAuth redirect URIs
  - Supabase buckets
  - SQL run order
  - admin seed account + branch/profile seed
  - test dataset seed

**Trạng thái**
- `Open (recommended before Task 002)`

---

### 5) High - Chưa có migration cutover/rollback plan giữa schema finance legacy và showroom schema mới
**Rủi ro**
- `docs/tasks/002_supabase_schema_showroom_core.md` đã nhắc “không ghi đè schema finance legacy”, nhưng chưa có kế hoạch cutover/rollback chính thức.
- Nếu chạy song song dev DB hoặc tái seed nhiều lần rất dễ rối namespace/migration order.

**Hậu quả**
- SQL drift
- Data inconsistency trong staging
- Khó rollback khi lỗi RLS/constraint

**Đề xuất bổ sung**
- Tạo section trong task `002` hoặc file riêng:
  - naming/namespacing strategy
  - migration source of truth (`apps/web/sql/00x_*.sql` hay `supabase/migrations`)
  - rollback notes (đặc biệt constraint/RLS)
  - seed re-run strategy (idempotent vs reset)

**Trạng thái**
- `Open (blocking for stable DB iteration)`

---

### 6) Medium - Chưa có integration checkpoints giữa các mốc lớn (cross-module sanity)
**Rủi ro**
- Dù đã tách task chi tiết, vẫn thiếu các mốc “gắn lại” giữa modules:
  - products + inventory
  - orders + payments
  - dashboard + reports + settings

**Hậu quả**
- Lỗi tích lũy đến cuối roadmap mới phát hiện

**Đề xuất bổ sung**
- Thêm vào `progress/tasks.md` các checkpoint hàng ngang:
  - `CP-A`: sau `005` (shared primitives + shell)
  - `CP-B`: sau `009` (orders core + DB constraints)
  - `CP-C`: sau `012` (orders/payments flow)
  - `CP-D`: sau `016` (pre-release functional integration)

**Trạng thái**
- `Open (non-blocking for sequential execution)`

---

### 7) Medium - Thiếu chiến lược seed/test fixture cố định để giảm lỗi khi test nhanh
**Rủi ro**
- Hiện mới có admin seed và schema legacy.
- Các task module lớn cần test data nhất quán (products/items/customers/orders/payments/incidents).

**Hậu quả**
- “Nhắc test nhanh” khó lặp lại
- Kết quả test không tái hiện được

**Đề xuất bổ sung**
- Tạo task phụ hoặc sub-step trong `002`/`006`/`009`:
  - `002b_seed_showroom_demo_data.sql` (idempotent)
  - hoặc `scripts/seed-showroom-demo.ts`
- Định nghĩa dataset tối thiểu:
  - 1 branch
  - 3 products, 6 variants, 12 items
  - 5 customers
  - 4 orders (reserved/picked_up/returned/completed)
  - payments + incidents mẫu

**Trạng thái**
- `Open (recommended before Task 010)`

---

### 8) Medium - `progress/tasks.md` đã theo dõi tiến độ tốt nhưng chưa capture “mức độ tuân thủ coding rule”
**Rủi ro**
- Checklist hiện ghi trạng thái/owner/date/commit, nhưng thiếu field xác nhận coding-rule compliance.

**Hậu quả**
- Khó audit lại task nào vi phạm rule kiến trúc

**Đề xuất bổ sung**
- Thêm vào completion log template:
  - `Coding rule check: pass / warning`
  - `Architecture deviations (if any):`
  - `Follow-up refactor task (if any):`

**Trạng thái**
- `Open (non-blocking, nhưng nên làm trước Task 005+)`

## Mức độ đầy đủ hiện tại (trả lời trực tiếp câu hỏi)
- `Chưa thực sự đầy đủ` nếu mục tiêu là:
  - chạy nhiều task song song an toàn
  - giảm lỗi tối đa
  - bảo đảm coding rule một cách có thể kiểm chứng
- `Đã khá đầy đủ` nếu mục tiêu là:
  - chạy tuần tự từng task với 1 người thực hiện
  - có review kỹ ở mỗi task

## Khuyến nghị tối thiểu trước khi bắt đầu thực thi từng task (để giảm lỗi mạnh nhất)
1. Tạo `progress/decisions.md` và chốt các quyết định mở của `Task 002/003/009/012`.
2. Tạo `progress/parallel-plan.md` (dù làm tuần tự vẫn hữu ích; nếu sau này muốn chạy song song thì dùng ngay).
3. Bổ sung coding-rule evidence template vào `progress/tasks.md` completion log.
4. Bổ sung preflight checklist (env/OAuth/SQL/seed/bucket) vào `docs/tasks/000_*` hoặc file mới.
5. Chốt migration strategy/cutover plan cho showroom schema trong `Task 002`.
6. Chuẩn bị demo seed dataset trước khi vào `Task 010`.

## Gating Recommendation (khuyến nghị cho lần yêu cầu thực thi tiếp theo)
- Có thể bắt đầu ngay `Task 001` (sequential).
- Trước khi bắt đầu `Task 002`, nên hoàn thành ít nhất:
  - `Decision Log`
  - `Preflight checklist`
  - `Migration strategy note`
- Chưa nên chạy song song nhiều task cho đến khi đóng Findings #1, #2, #3.

---

## Bổ Sung Review - Rủi Ro Database (Task 002 rerun, showroom-page config/template)

> Cập nhật: 2026-02-26  
> Phạm vi review: `apps/web/sql/002_showroom_core_schema.sql`, `apps/web/sql/003_seed_showroom_bootstrap.sql`, `apps/web/sql/README.md`, `docs/tasks/002_supabase_schema_showroom_core.md`  
> Phương pháp: static review (không chạy SQL trực tiếp trên Supabase trong môi trường này)

### Kết luận nhanh
- Schema hiện tại `đủ tốt cho dev/MVP iteration`, đã có nền tốt:
  - anti-overlap ở DB (`reservation_windows` + `EXCLUDE`)
  - RLS baseline theo branch
  - seed idempotent cho branch/settings/admin mapping
  - DB-ready cho `showroom_page_templates` + `showroom_page_configs`
- Tuy nhiên, để giảm rủi ro vận hành và bảo mật khi bắt đầu code các module Orders/Payments/Settings, cần xử lý sớm các điểm sau:
  - `DB authorization` cho các bảng nghiệp vụ quan trọng vẫn còn quá rộng (branch-member CRUD baseline)
  - `audit_events` chưa append-only
  - thiếu `cross-table invariants` (branch consistency / entity lineage consistency)

### Findings (database)

#### 1) High - RLS baseline cho bảng nghiệp vụ chính đang cho phép mọi branch member CRUD (quá rộng cho dữ liệu nhạy cảm)
**Bằng chứng**
- Generic branch-scoped policy loop áp dụng `SELECT/INSERT/UPDATE/DELETE` cho nhiều bảng cùng một rule `can_access_branch(branch_id)` tại `apps/web/sql/002_showroom_core_schema.sql:1036`.
- Danh sách bảng gồm cả `rental_orders`, `reservation_windows`, `payments`, `incidents`, `maintenance_tasks` tại `apps/web/sql/002_showroom_core_schema.sql:1040`.
- Grants cũng cấp `select, insert, update, delete` cho `authenticated` trên toàn bộ bảng showroom tại `apps/web/sql/002_showroom_core_schema.sql:1201` và `apps/web/sql/002_showroom_core_schema.sql:1215`.

**Rủi ro**
- Nếu client/browser gọi Data API trực tiếp (hoặc service layer có bug), user branch-level có thể sửa/xóa records nhạy cảm vượt policy nghiệp vụ mong muốn (ví dụ payments/refunds/locks).
- `reservation_windows` và `payments` đặc biệt nhạy cảm vì ảnh hưởng anti-overlap và số liệu tài chính.

**Khuyến nghị**
- Tách policy riêng cho ít nhất các bảng: `rental_orders`, `reservation_windows`, `payments`, `incidents`, `maintenance_tasks`.
- Chặn `DELETE` ở DB cho `payments`/`reservation_windows` (ưu tiên `void + new record` / `release` semantics).
- Dùng role-aware checks (`owner_admin/manager/staff`) ở RLS cho action quan trọng, không chỉ `can_access_branch`.

**Trạng thái**
- `Open (high priority trước Task 009/010/011/012)`

---

#### 2) High - `audit_events` cho phép `UPDATE`/`DELETE` (rủi ro tamper audit log)
**Bằng chứng**
- `audit_events` table dùng làm audit trail tại `apps/web/sql/002_showroom_core_schema.sql:651`.
- Policy vẫn cho `UPDATE` và `DELETE` bởi owner_admin tại `apps/web/sql/002_showroom_core_schema.sql:1185` và `apps/web/sql/002_showroom_core_schema.sql:1191`.

**Rủi ro**
- Mất tính bất biến (immutability) của audit log.
- Khi có sự cố nội bộ, dữ liệu audit có thể bị chỉnh/xóa và làm giảm khả năng điều tra/đối soát.

**Khuyến nghị**
- Chuyển `audit_events` thành append-only ở DB:
  - cho `SELECT` + `INSERT`
  - bỏ `UPDATE` + `DELETE` policies
- Nếu cần sửa metadata hiếm gặp: dùng bảng correction riêng hoặc service-role-only maintenance script có audit bổ sung.

**Trạng thái**
- `Open (high priority trước Task 011/012)`

---

#### 3) High - Thiếu DB invariants cho branch consistency và entity lineage consistency (dễ tạo dữ liệu lệch nếu app/service lỗi)
**Bằng chứng**
- Các bảng có `branch_id` + FK độc lập nhưng chưa có trigger/check để đảm bảo tính nhất quán giữa các liên kết:
  - `customers` tại `apps/web/sql/002_showroom_core_schema.sql:258`
  - `items` tại `apps/web/sql/002_showroom_core_schema.sql:425`
  - `rental_orders` (`branch_id`, `customer_id`) tại `apps/web/sql/002_showroom_core_schema.sql:454`
  - `rental_order_items` (`order_id`, `item_id`, `product_id`, `variant_id`) tại `apps/web/sql/002_showroom_core_schema.sql:507`
  - `reservation_windows` (`branch_id`, `order_id`, `item_id`) tại `apps/web/sql/002_showroom_core_schema.sql:537`
  - `payments` (`branch_id`, `order_id`, `customer_id`) tại `apps/web/sql/002_showroom_core_schema.sql:575`
  - `incidents` (`branch_id`, `order_id`, `order_item_id`, `item_id`, `customer_id`) tại `apps/web/sql/002_showroom_core_schema.sql:626`

**Rủi ro**
- Có thể tạo bản ghi hợp lệ về mặt FK nhưng sai nghiệp vụ:
  - order branch A gắn customer branch B
  - payment branch A gắn order branch B
  - reservation_window branch A gắn item/order khác branch
  - rental_order_item có `item_id` không thuộc `variant_id/product_id` được ghi kèm
- Khi report/totals/RLS chạy theo `branch_id`, dữ liệu sẽ lệch hoặc gây bug khó truy vết.

**Khuyến nghị**
- Thêm trigger validation (BEFORE INSERT/UPDATE) cho các bảng nghiệp vụ chính để enforce branch/lineage.
- Hoặc thiết kế composite keys/materialized branch references để enforce bằng FK (phức tạp hơn nhưng chặt hơn).
- Tối thiểu: bắt đầu với `rental_orders`, `reservation_windows`, `payments`, `rental_order_items`.

**Trạng thái**
- `Open (high priority trước Task 009/010/011/012)`

---

#### 4) Medium - Mô hình `showroom_page_configs` hiện tại chưa hỗ trợ draft/published đồng thời (xung đột với workflow Save draft + Publish)
**Bằng chứng**
- `showroom_page_configs` chỉ có một row theo `(branch_id, locale, page_key)` tại `apps/web/sql/002_showroom_core_schema.sql:205`.
- Unique index một row duy nhất tại `apps/web/sql/002_showroom_core_schema.sql:229`.
- Wireframe đã mô tả action `Save draft`, `Publish`, `Unpublish` tại `docs/001_wireframe.md:867`.

**Rủi ro**
- Nếu implement theo đúng UI workflow, không có chỗ lưu `draft` tách biệt với `published` version hiện tại.
- Dễ dẫn đến behavior mơ hồ:
  - draft overwrite trực tiếp row đang publish
  - hoặc phải dùng “draft trong memory/UI only” (mất dữ liệu khi reload)

**Khuyến nghị**
- Chốt sớm chiến lược trước Task 016:
  - MVP đơn giản: 1 row + `Save` là edit trực tiếp, `Publish` chỉ đổi `is_published`
  - hoặc thêm `showroom_page_config_versions` / `status` model để giữ song song draft+published
- Nếu giữ 1-row MVP, cập nhật wireframe/task wording để tránh kỳ vọng versioning.

**Trạng thái**
- `Open (medium priority trước Task 016)`

---

#### 5) Medium - Thiếu DB validation cho `template_id ↔ page_key` và JSON config schema (rủi ro khi mở rộng multi-template)
**Bằng chứng**
- `showroom_page_templates` có `page_key`, `config_schema_json` tại `apps/web/sql/002_showroom_core_schema.sql:178`.
- `showroom_page_configs` có `page_key`, `template_id`, nhiều JSON config columns tại `apps/web/sql/002_showroom_core_schema.sql:205`.
- Hiện chỉ có FK `template_id` và check `page_key in ('PRODUCT_HOME')`; chưa có validation cross-table rằng template được chọn đúng `page_key` của config.

**Rủi ro**
- Hiện chưa lộ vì mới có `PRODUCT_HOME`, nhưng khi thêm page/template khác sau này rất dễ gắn nhầm template.
- JSON config malformed/không khớp renderer expectation sẽ lỗi runtime ở public page hoặc admin preview.

**Khuyến nghị**
- Thêm trigger validate:
  - `showroom_page_configs.page_key = showroom_page_templates.page_key`
  - template phải `is_active=true` khi publish
- Cân nhắc JSON schema validation mức tối thiểu (trigger/RPC/service validation) trước `Publish`.

**Trạng thái**
- `Open (medium priority trước mở rộng multi-template / Task 016 production hardening)`

---

#### 6) Medium - Policies đang dùng default `TO PUBLIC` (không ghi explicit `TO authenticated`), an toàn hiện tại nhưng dễ gây nhầm và giảm defense-in-depth
**Bằng chứng**
- Nhiều policies tạo mà không có `TO authenticated` (ví dụ `system_settings_select`, `showroom_page_templates_*`, `showroom_page_configs_*`, `audit_events_*`) tại `apps/web/sql/002_showroom_core_schema.sql:946`, `apps/web/sql/002_showroom_core_schema.sql:967`, `apps/web/sql/002_showroom_core_schema.sql:1012`, `apps/web/sql/002_showroom_core_schema.sql:1169`.
- Grants hiện chỉ cấp cho `authenticated` tại `apps/web/sql/002_showroom_core_schema.sql:1199` và `apps/web/sql/002_showroom_core_schema.sql:1215`.

**Rủi ro**
- Hiện tại đa số vẫn an toàn nhờ grants + RLS expressions.
- Nhưng khi sau này thêm `GRANT` cho `anon` hoặc chỉnh policy lỏng hơn, `TO PUBLIC` có thể mở rộng phạm vi ngoài ý muốn.
- Dễ gây hiểu nhầm khi review trên Supabase UI (`Applied to public`).

**Khuyến nghị**
- Hardening dần: thêm explicit `TO authenticated` (hoặc role cụ thể) cho policies nhạy cảm.
- Giữ `anon` access chỉ qua RPC/view/API đã kiểm soát (đặc biệt cho showroom public page).

**Trạng thái**
- `Open (medium priority, defense-in-depth)`

---

#### 7) Medium - Public showroom page phụ thuộc chặt vào server-layer filtering (DB hiện cố ý không mở trực tiếp config cho anon)
**Bằng chứng**
- `showroom_page_configs` select policy là admin-only tại `apps/web/sql/002_showroom_core_schema.sql:1012`.
- Comment trong schema cũng ghi rõ public page nên đọc qua server layer, không qua anon Data API trực tiếp tại `apps/web/sql/002_showroom_core_schema.sql:1011`.

**Rủi ro**
- Đây là lựa chọn bảo mật tốt, nhưng tạo dependency kiến trúc bắt buộc:
  - nếu Task 018 implement sai (đọc browser/anon trực tiếp), feature sẽ không chạy hoặc dev nới quyền bừa
  - nếu server route quên filter `is_published`, có thể lộ config nháp

**Khuyến nghị**
- Trước Task 018, tạo contract rõ cho read-side public:
  - route handler / RPC / view chỉ trả `is_published=true`
  - whitelist fields trả ra (không trả draft/admin metadata)
- Thêm test case regression cho unpublished config leak.

**Trạng thái**
- `Open (medium priority trước Task 018)`

---

#### 8) Low - Hiệu năng reporting/payment list có thể sớm cần index theo `status`
**Bằng chứng**
- `payments` có index theo `(branch_id, created_at)`, `order_id`, `type`, `method` tại `apps/web/sql/002_showroom_core_schema.sql:602`.
- Chưa có index trực tiếp theo `status`, trong khi business/report rules liên tục lọc `POSTED` vs `VOIDED`.

**Rủi ro**
- Khi volume payment tăng, query list/reports lọc theo branch + date + status có thể kém hiệu quả.

**Khuyến nghị**
- Theo dõi query plan sau khi có dữ liệu thật.
- Cân nhắc thêm index `(branch_id, status, created_at)` hoặc partial index `where status = 'POSTED'`.

**Trạng thái**
- `Open (low priority, optimize when data grows)`

### Điểm tích cực (đã giảm rủi ro so với trước)
- `profiles` self-write privilege escalation đã được khóa; write vào `profiles` chỉ còn owner_admin.
- Global catalog rows (`branch_id is null`) không còn bị mọi authenticated user ghi/xóa; đã giới hạn owner_admin cho write.
- `item_status_logs` đã append-only (read + insert), phù hợp operational log.
- `showroom_page_templates` và `showroom_page_configs` đã có RLS riêng, không mở thẳng cho `anon`.
- Seed `PRODUCT_HOME_V1` + config publish mặc định (`vi/en`) giúp giảm rủi ro drift giữa DB schema và Task 016/018.

### Gợi ý thứ tự xử lý rủi ro DB (thực dụng)
1. Khóa `audit_events` thành append-only.
2. Tách RLS cho `payments` + `reservation_windows` + `rental_orders` (ít nhất chặn delete và siết role).
3. Thêm trigger branch/lineage consistency cho `rental_orders`, `reservation_windows`, `payments`, `rental_order_items`.
4. Chốt draft/publish model cho `showroom_page_configs` trước Task 016.
5. Thêm explicit `TO authenticated` cho policies nhạy cảm (hardening).

