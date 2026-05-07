# Task 003 - Homepage 3D: post-login redirect theo role/branch

## Mục tiêu
- Thực hiện bước 3 của module: chuẩn hóa redirect sau login theo role/branch.
- Bước này chỉ xử lý post-login redirect matrix.

## Redirect matrix (bắt buộc)
1. `owner_admin | admin | manager | staff | accountant | makeup_artist` -> `/{language}/dashboard` (hoặc admin shell hiện hành).
2. `customer` có `branch-domain` hợp lệ -> `/{language}/{branch-domain}`.
3. `customer` không có branch-domain -> `/{language}/product`.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/002_homepage_3d_clone_ui_from_vietnam_store_map_template.md`

## Token Context Guard
- Chỉ nạp: task `003` + task `002` + file auth redirect resolver/callback.
- Không nạp task map/API contract trong lượt này.

## Architecture Impact
- Layers affected: `apps/web` routing/middleware + auth redirect resolver.
- Có thể ảnh hưởng `apps/server` nếu cần enrich branch-domain lookup.
- Domain affected: auth bootstrap + RBAC landing.

## Current State vs Target State
- Current: post-login redirect chưa nhất quán theo role/branch matrix.
- Target (Architecture V2): redirect ổn định, không loop, đúng role/branch.

## Boundary Rules
- Must keep: `Component -> Hook -> Query -> Service -> API`.
- Must keep: auth verification + branch access thuộc backend source-of-truth.
- Forbidden: hardcode role logic rải rác nhiều component.
- Forbidden: DB/Supabase access trực tiếp từ web.

## Compatibility & Migration Strategy
- Compatibility window: giữ fallback redirect cũ ngắn hạn.
- Rollback condition: rollback policy cũ nếu có redirect loop/sai landing.

## Done Criteria (Architecture)
- [ ] Post-login redirect đúng matrix role/branch.
- [ ] Không tạo endpoint business mới trong `apps/web/src/app/api/**`.
- [ ] Không thêm Supabase access trực tiếp từ web.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không có redirect loop ở login/callback.
- [ ] Admin không bị rơi về home chung sau login.
- [ ] Customer branch-scoped không bị vào nhầm branch khác.
- [ ] Customer không có branch vẫn dùng được home chung.
