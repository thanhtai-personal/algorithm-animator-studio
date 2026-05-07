# Task 002 - KATA Charm Step 2: Refactor chuẩn codebase (vẫn mock data)

## Mục tiêu
- Refactor bản Charm step 1 theo chuẩn cấu trúc code hiện tại, giữ nguyên visual.

## Định nghĩa hoàn thành bắt buộc
### Sau Task 2
- UI của theme phải gắn liền với các chức năng đã có trên default theme: loại bỏ tính năng dư thừa, bổ sung đầy đủ tính năng còn thiếu.
- Header của theme phải có đầy đủ chức năng tương đương header default theme (routing/action/search/locale/cart/auth/theme controls), nhưng vẫn giữ giao diện của theme mới.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-charm/001_clone_parity_mock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: component/hook/utils frontend.
- Domain affected: template Charm.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current: clone raw khó maintain.
- Target: code sạch, tách rõ, visual parity giữ nguyên.

## Boundary Rules
- Must keep: không fetch trong component, không đổi behavior business.
- Forbidden: không bind backend ở bước này.

## Integration Guard (Mandatory)
- Sau refactor phải giữ nguyên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Không được biến action thật của shell/header thành local-only state trong quá trình tách component/hook/utils.
- Không được tách theme/palette/settings của template thành state riêng nếu app đã có source-of-truth chung cho theme appearance.
- Không được chấp nhận refactor chỉ đúng ở homepage nhưng làm showroom/detail/shortlist lệch shell hoặc mất tác động action.

## Compatibility & Migration Strategy
- Rollback condition: parity fail thì revert về step 1.

## Done criteria (coding)
- [x] Refactor xong, parity không đổi.
- [x] Toàn bộ action header/navigation vẫn đi qua routing/state thật sau refactor.

## Done Criteria (Architecture)
- [x] Không phá layering/import boundary.

## Regression Scope
- [x] Không regress layout/navigation.
- [x] Không regress route showroom/detail/shortlist trong cùng theme.

## Task tiếp theo liên quan
- `docs/tasks/modules/clone-UI-templates/kata-charm/004_theme_config_schema.md` (thiết kế cấu trúc config theo theme).
- `docs/tasks/modules/clone-UI-templates/kata-charm/003_backend_binding.md` (renderer Charm consume config từ Step 4).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 002 | Charm step2 refactor mock | done=2026-04-11 | refactor split config/header/sections, giữ nguyên action routing`
