# Task 002 - Homepage 3D: route entry `/` và login button cho homepage mới

## Mục tiêu
- Thực hiện bước 2 của module: chuẩn hóa entry route public và login action trên header homepage mới.
- Bước này chưa xử lý post-login redirect matrix theo role/branch.

## Phụ thuộc
- `docs/tasks/modules/homepage-3d/001_homepage_3d_clone_ui_and_business_integration_from_vietnam_store_map.md`

## Token Context Guard
- Chỉ nạp: task `002` + task `001` + file route/header liên quan.
- Không nạp task `003-005` trong lượt này.

## Architecture Impact
- Layers affected: `apps/web` routing/entry và component header action.
- Domain affected: public entry flow.

## Current State vs Target State
- Current: entry route và login button chưa được chuẩn hóa theo homepage mới.
- Target (Architecture V2):
- `/` -> `/{language}/product`.
- Login button trên homepage -> `/{language}/auth`.

## Boundary Rules
- Must keep: `Component -> Hook -> Query -> Service -> API`.
- Must keep: locale-aware routing theo cơ chế hiện tại.
- Forbidden: hardcode domain/locale ngoài route resolver hiện hành.

## Compatibility & Migration Strategy
- Compatibility window: giữ fallback route cũ ngắn hạn nếu cần rollback nhanh.
- Rollback condition: rollback nếu xảy ra redirect loop hoặc sai locale.

## Done Criteria (Architecture)
- [ ] `/` luôn điều hướng đúng `/{language}/product`.
- [ ] Login button luôn điều hướng `/{language}/auth`.
- [ ] Không tạo endpoint business mới trong `apps/web/src/app/api/**`.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Không có redirect loop tại `/`.
- [ ] Locale vi/en điều hướng đúng.
- [ ] Header action không ảnh hưởng route dashboard hiện có.
