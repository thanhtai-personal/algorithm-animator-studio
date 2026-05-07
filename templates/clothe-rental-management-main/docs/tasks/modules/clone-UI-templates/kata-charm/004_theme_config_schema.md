# Task 004 - KATA Charm Step 4: Theme config schema riêng + admin fields động

## Mục tiêu
- Chuẩn hóa bộ config riêng cho template Charm.
- Khi admin đổi theme sang Charm, form cấu hình phải render đúng các field của Charm.
- Lưu toàn bộ config theo theme vào **một trường JSON data** trong database để dễ mở rộng.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-charm/002_refactor_mock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: admin form layer (component/hook/query/service), server validation layer, DB JSON config field.
- Domain affected: template Charm config cho admin + public renderer.
- App(s) affected: `apps/web`, `apps/server`.

## Current State vs Target State
- Current: cấu hình có thể còn static field, chưa phản ánh đúng từng theme.
- Target (Architecture V2): Charm có schema config riêng; admin đổi theme tự đổi field; dữ liệu config lưu một cột JSON thống nhất.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - Chỉ `apps/server` truy cập DB/Supabase.
  - Validation business nằm ở server, không đẩy hết logic vào component admin.
- Forbidden:
  - Không hardcode bộ field Charm trong shared component theo cách khó mở rộng.
  - Không thêm DB access ở runtime client.
  - Không thêm nhiều cột DB rời rạc cho từng field của Charm.

## Integration Guard (Mandatory)
- Schema/themeConfig mới phải được review trên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Dữ liệu theme không chỉ đủ để render section; còn phải đủ để shell/header/action của theme nối vào routing/state thật khi theme đó active.
- Schema không được đẩy responsibility của theme appearance sang local state riêng của template nếu app đã có source-of-truth theme/palette chung.
- Không được mark done nếu admin save/load đúng nhưng public runtime vẫn chỉ đúng ở homepage và lệch trên showroom/detail/shortlist.

## Compatibility & Migration Strategy
- Compatibility window: duy trì khả năng đọc config cũ trong thời gian migrate.
- Migration strategy:
  - Bổ sung một trường JSON (khuyến nghị `theme_config` kiểu JSONB) ở bảng config template.
  - Chuyển dữ liệu cũ sang JSON shape của Charm.
  - Chuẩn hóa API save/load theo `theme` + `themeConfig`.
- Rollback condition: nếu lỗi save/load hoặc render, bật fallback về config cũ và rollback mapping.

## In-scope
- Định nghĩa schema field cho theme Charm (ví dụ nhóm: hero/banner, collection cards, promo blocks, story/about, social proof, CTA).
- Admin render dynamic fields đúng theo schema Charm.
- Server validate payload theo schema Charm trước khi lưu JSON.
- Public renderer đọc config JSON Charm ổn định.

## Out-of-scope
- Redesign toàn bộ UI template Charm.
- Gộp triển khai chi tiết cho 3D/Modern trong cùng task.
- Bind mock -> backend data cho public template Charm theo luồng cũ (đã xử lý ở Step 3).

## Done criteria (coding)
- [x] Theme Charm có schema config riêng, độc lập với theme khác.
- [x] Đổi theme sang Charm trong admin thì form field đổi đúng theo schema Charm.
- [x] Config Charm được lưu trong một trường JSON của DB.
- [x] Public renderer Charm đọc JSON config mới và hiển thị đúng nội dung chính.
- [x] Contract config đủ để theme shell/header/action dùng thống nhất trên toàn bộ route matrix công khai.

## Done Criteria (Architecture)
- [x] Không phá layering/import boundary.
- [x] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [x] Contract API rõ ràng, không duplicate business validation ở nhiều runtime.

## Regression Scope
- [x] Đổi theme qua lại (Charm <-> theme khác) không mất dữ liệu config.
- [x] Save/reload admin vẫn đúng field + value của Charm.
- [x] Public route Charm không regress flow và layout chính.
- [x] Public route showroom/detail/shortlist không bị lệch shell/action sau khi đổi theme.

## Task tiếp theo liên quan
- `docs/tasks/modules/clone-UI-templates/kata-charm/003_backend_binding.md` (public renderer consume config đã chuẩn hóa ở Step 4).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- `cd apps/server && npm run lint && npm run build`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 004 | Charm step4 theme config schema + dynamic admin fields | Bổ sung schema editor=theme-charm + dynamic admin form cho Charm, normalize/validate server-side trước khi lưu themeConfigJson, đồng thời project về legacy hero/sections/display để tương thích route matrix public.`
