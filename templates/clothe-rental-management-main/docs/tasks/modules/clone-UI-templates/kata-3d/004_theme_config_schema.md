# Task 004 - KATA 3D Step 4: Theme config schema riêng + admin fields động

## Mục tiêu
- Chuẩn hóa bộ config riêng cho template 3D (không dùng chung field cứng với theme khác).
- Khi admin đổi theme sang 3D, form cấu hình phải render đúng field của theme 3D.
- Lưu toàn bộ config theo theme vào **một trường JSON data** trong database để dễ mở rộng.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-3d/002_refactor_mock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: admin UI form (component/hook/query/service), server validation contract, DB schema (1 cột JSON config).
- Domain affected: template 3D config trong admin + public renderer đọc config theo theme.
- App(s) affected: `apps/web`, `apps/server`.

## Current State vs Target State
- Current: config landing/template có xu hướng field cố định, khó đổi theo từng theme.
- Target (Architecture V2): 3D có schema config riêng; admin đổi theme thì field đổi theo; dữ liệu config lưu trong một cột JSON thống nhất.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` được truy cập DB/Supabase.
  - UI admin chỉ render form theo schema nhận từ service/query, không chứa business validation phức tạp.
- Forbidden:
  - Không gọi DB trực tiếp từ `apps/web`.
  - Không hardcode field 3D vào shared form theo cách phá khả năng mở rộng theme khác.
  - Không tách thêm nhiều cột DB theo từng field UI.

## Integration Guard (Mandatory)
- Schema/themeConfig mới phải được review trên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Dữ liệu theme không chỉ đủ để render section; còn phải đủ để shell/header/action của theme nối vào routing/state thật khi theme đó active.
- Schema không được đẩy responsibility của theme appearance sang local state riêng của template nếu app đã có source-of-truth theme/palette chung.
- Không được mark done nếu admin save/load đúng nhưng public runtime vẫn chỉ đúng ở homepage và lệch trên showroom/detail/shortlist.

## Compatibility & Migration Strategy
- Compatibility window: cho phép fallback đọc config cũ trong lúc migrate sang JSON field.
- Migration strategy:
  - Bổ sung một trường JSON (khuyến nghị `theme_config` kiểu JSONB) trong bảng config template hiện tại.
  - Map dữ liệu cũ (nếu có) sang JSON shape của 3D.
  - API trả cả `theme` + `themeConfig` để admin/public renderer dùng thống nhất.
- Rollback condition: nếu config mới gây lỗi render/admin save, rollback về logic đọc field cũ và giữ migration script an toàn.

## In-scope
- Định nghĩa schema field cho theme 3D (ví dụ nhóm: hero, 3D scene/model, CTA, featured products, gallery/testimonial).
- Cơ chế admin render dynamic fields theo schema của theme 3D.
- Validate payload theo schema 3D ở server trước khi lưu JSON.
- Chuẩn serialize/deserialize config JSON cho admin edit và public render.

## Out-of-scope
- Redesign UI template 3D.
- Migrate toàn bộ theme khác trong cùng PR (Modern/Charm làm ở task tương ứng).
- Bind mock -> backend data cho public template 3D theo luồng cũ (đã xử lý ở Step 3).

## Done criteria (coding)
- [ ] Theme 3D có schema config riêng, tách khỏi schema của theme khác.
- [ ] Admin đổi theme sang 3D thì field cấu hình đổi đúng theo schema 3D.
- [ ] Lưu config 3D vào một trường JSON trong DB (không tách nhiều cột field-level).
- [ ] Public renderer đọc được config JSON 3D và không vỡ layout chính.
- [ ] Contract config đủ để theme shell/header/action dùng thống nhất trên toàn bộ route matrix công khai.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Contract API giữa admin và server rõ ràng cho `theme` + `themeConfig`.

## Regression Scope
- [ ] Đổi theme qua lại (3D <-> theme khác) không làm mất dữ liệu config đã lưu.
- [ ] Save/load lại trang admin vẫn hiển thị đúng field + value theo theme 3D.
- [ ] Public route template 3D render ổn định với config mới.
- [ ] Public route showroom/detail/shortlist không bị lệch shell/action sau khi đổi theme.

## Task tiếp theo liên quan
- `docs/tasks/modules/clone-UI-templates/kata-3d/003_backend_binding.md` (public renderer consume config đã chuẩn hóa ở Step 4).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- `cd apps/server && npm run lint && npm run build`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 004 | 3D step4 theme config schema + dynamic admin fields | Added themeConfigJson JSON field contract + SQL patch, returned template configSchemaJson from settings API, and switched admin showroom page to schema-driven 3D config editor with legacy fallback migration.`
