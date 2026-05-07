# Task 002 - KATA 3D Step 2: Refactor chuẩn codebase (vẫn mock data)

## Mục tiêu
- Refactor bản clone step 1 theo chuẩn coding skill agent và cấu trúc hiện tại.
- Vẫn dùng mock data để khóa visual parity.

## Định nghĩa hoàn thành bắt buộc
### Sau Task 2
- UI của theme phải gắn liền với các chức năng đã có trên default theme: loại bỏ tính năng dư thừa, bổ sung đầy đủ tính năng còn thiếu.
- Header của theme phải có đầy đủ chức năng tương đương header default theme (routing/action/search/locale/cart/auth/theme controls), nhưng vẫn giữ giao diện của theme mới.

## Phụ thuộc
- `docs/tasks/modules/clone-UI-templates/kata-3d/001_clone_parity_mock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`

## Architecture Impact
- Layers affected: component/hook/utils tổ chức lại trong `apps/web`.
- Domain affected: template 3D public product.
- App(s) affected: `apps/web`.

## Current State vs Target State
- Current: clone raw, còn khó maintain.
- Target (Architecture V2): code sạch, tách hợp lý, output visual không đổi.

## Boundary Rules
- Must keep:
  - Không fetch trực tiếp trong component.
  - Duy trì hướng phụ thuộc một chiều.
- Forbidden:
  - Không thay đổi behavior business ở bước này.

## Integration Guard (Mandatory)
- Sau refactor phải giữ nguyên route matrix công khai: `/product`, `/showroom`, `/showroom/p/[productId]`, `/showroom/shortlist` và biến thể `/b/[branchSlug]/...`.
- Không được biến action thật của shell/header thành local-only state trong quá trình tách component/hook/utils.
- Không được tách theme/palette/settings của template thành state riêng nếu app đã có source-of-truth chung cho theme appearance.
- Không được chấp nhận refactor chỉ đúng ở homepage nhưng làm showroom/detail/shortlist lệch shell hoặc mất tác động action.

## Compatibility & Migration Strategy
- Compatibility window: giữ snapshot parity từ step 1 để so sánh.
- Rollback condition: nếu đổi visual không mong muốn thì revert về step 1 baseline.

## In-scope
- Tách component/hook/utils/constants.
- Giảm inline logic phức tạp trong JSX.

## Out-of-scope
- Bind data backend thật.

## Done criteria (coding)
- [ ] Refactor hoàn tất, visual giữ parity với step 1.
- [ ] Không còn code duplication lớn trong template 3D.
- [ ] Toàn bộ action header/navigation vẫn đi qua routing/state thật sau refactor.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không thêm business endpoint web API.

## Regression Scope
- [ ] Không regress layout desktop/mobile.
- [ ] Không regress navigation hành vi cơ bản.
- [ ] Không regress route showroom/detail/shortlist trong cùng theme.

## Task tiếp theo liên quan
- `docs/tasks/modules/clone-UI-templates/kata-3d/004_theme_config_schema.md` (thiết kế cấu trúc config theo theme).
- `docs/tasks/modules/clone-UI-templates/kata-3d/003_backend_binding.md` (renderer 3D consume config từ Step 4).

## Nhắc test nhanh
- `cd apps/web && npm run lint`
- `cd apps/web && npm run typecheck`

## Cập nhật tiến độ (bắt buộc)
- `- [x] 002 | 3D step2 refactor mock | 2026-04-09: tách 3D template thành config/constants + state hook + header/settings + section blocks, giữ parity step1, pass eslint target files + typecheck + build apps/web.`
