# Task 004 - KATA Modern Step 4: Theme config schema riêng + admin fields động

## Mục tiêu
- Chuẩn hóa bộ config riêng cho template Modern.
- Khi admin đổi theme sang Modern, form cấu hình phải render đúng các field của Modern.
- Lưu toàn bộ config của theme vào **một trường JSON data** trong database để dễ tùy biến.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-modern/002_refactor_mock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: admin UI form (component/hook/query/service), server validation contract, DB schema JSON config.
- Domain affected: template Modern config trong admin + public renderer.
- App(s) affected: `apps/web`, `apps/server`.

## Current State vs Target State
- Current: cấu hình có thể đang phụ thuộc field tĩnh, chưa tối ưu cho theme-specific.
- Target (Architecture V2): Modern có schema config riêng; admin đổi theme thì field đổi theo; config lưu một cột JSON thống nhất.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API`.
  - DB access chỉ ở `apps/server`.
  - Client chỉ render field từ schema/theme metadata nhận qua API.
- Forbidden:
  - Không hardcode chung mọi field cho mọi theme trong một form tĩnh.
  - Không thêm Supabase query trong `apps/web`.
  - Không tách config thành nhiều cột DB theo từng field riêng lẻ.

## Integration Guard (Mandatory)
- Schema/themeConfig mới phải được review trên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Dữ liệu theme không chỉ đủ để render section; còn phải đủ để shell/header/action của theme nối vào routing/state thật khi theme đó active.
- Schema không được đẩy responsibility của theme appearance sang local state riêng của template nếu app đã có source-of-truth theme/palette chung.
- Không được mark done nếu admin save/load đúng nhưng public runtime vẫn chỉ đúng ở homepage và lệch trên showroom/detail/shortlist.

## Compatibility & Migration Strategy
- Compatibility window: tạm thời hỗ trợ đọc config cũ trong giai đoạn migrate.
- Migration strategy:
  - Bổ sung một trường JSON (khuyến nghị `theme_config` kiểu JSONB) trong bảng config template hiện tại.
  - Map dữ liệu cũ sang JSON shape của Modern.
  - Chuẩn hóa API save/load với cặp `theme` + `themeConfig`.
- Rollback condition: nếu admin/public render lỗi sau migrate, rollback logic đọc config cũ.

## In-scope
- Định nghĩa schema field cho theme Modern (ví dụ nhóm: hero tối giản, section giới thiệu, services/highlight cards, testimonial, CTA).
- Cơ chế render dynamic fields theo theme Modern trong admin.
- Validate server-side theo schema Modern trước khi persist JSON.
- Chuẩn parse config JSON để public renderer dùng ổn định.

## Out-of-scope
- Redesign giao diện template Modern.
- Triển khai schema chi tiết cho Charm/3D trong cùng task.
- Bind mock -> backend data cho public template Modern theo luồng cũ (đã xử lý ở Step 3).

## Done criteria (coding)
- [x] Theme Modern có schema config riêng, không phụ thuộc field của theme khác.
- [x] Đổi theme sang Modern trong admin thì field hiển thị đúng schema Modern.
- [x] Config được lưu vào một trường JSON trong DB.
- [x] Public renderer Modern đọc config JSON mới và hiển thị đúng dữ liệu chính.
- [x] Contract config đủ để theme shell/header/action dùng thống nhất trên toàn bộ route matrix công khai.

## Done Criteria (Architecture)
- [x] Không phá layering/import boundary.
- [x] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [x] Không thêm business endpoint mới ở web route layer nếu đã có Nest path.

## Regression Scope
- [x] Đổi theme qua lại (Modern <-> theme khác) không mất config đã lưu.
- [x] Reload admin vẫn thấy đúng value theo schema Modern.
- [x] Public route Modern không regress layout/hành vi chính.
- [x] Public route showroom/detail/shortlist không bị lệch shell/action sau khi đổi theme.

## Task tiếp theo liên quan
- `docs/tasks/modules/clone-UI-templates/kata-modern/003_backend_binding.md` (public renderer consume config đã chuẩn hóa ở Step 4).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`
- `cd apps/server && npm run lint && npm run build`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 004 | Modern step4 theme config schema + dynamic admin fields | 2026-04-12: bổ sung schema/editor theme-modern, thêm form dynamic fields riêng cho Modern trong admin, lưu `themeConfigJson` theo shape Modern và map lại legacy fields khi save.`
