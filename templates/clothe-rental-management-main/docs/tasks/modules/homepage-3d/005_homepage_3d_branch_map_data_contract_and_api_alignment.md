# Task 005 - Contract dữ liệu branch cho homepage map (server + consumers)

## Mục tiêu
- Đảm bảo homepage map có contract dữ liệu public ổn định để render icon branch và điều hướng branch-domain.
- Đồng bộ API contract giữa `apps/server` và consumer `apps/web`.

## Contract tối thiểu bắt buộc
- `branchId`
- `branchName`
- `branchDomain`
- `isActive`
- `mapLat`
- `mapLng`
- `mapLabel` (optional)
- `displayOrder` (optional)

## Token Context Guard
- Chỉ nạp: task `001`, task `005`, và module server/web service liên quan contract branch map.
- Khi làm server contract, không nạp các file UI layout map clone.
- Với response mẫu, chỉ giữ 1 payload mẫu ngắn; tránh nhồi nhiều payload tương tự.

## Architecture Impact
- Layers affected: `apps/server` (controller/service/data-access), `apps/web` (service/query mapping).
- Domain affected: public branch context/listing.

## Current State vs Target State
- Current: contract branch map có thể thiếu field hoặc chưa ổn định.
- Target (Architecture V2): contract rõ ràng, stable cho map render + navigation.

## Boundary Rules
- Must keep: backend `Controller -> Application Service -> Data-access -> Supabase`.
- Must keep: client `Component -> Hook -> Query -> Service -> API`.
- Forbidden: DB query ngoài `apps/server`.
- Forbidden: duplicate business filter logic giữa web và server.

## Compatibility & Migration Strategy
- Compatibility window: giữ backward-compatible fields nếu endpoint cũ còn caller.
- Rollback condition: fallback contract cũ nếu web parse lỗi.

## Done Criteria (Architecture)
- [ ] Endpoint/contract branch map trả đủ field tối thiểu.
- [ ] Web map render được từ contract chuẩn, không hardcode.
- [ ] Không có Supabase query ngoài data-access/infrastructure `apps/server`.
- [ ] Không tạo endpoint business mới trong `apps/web/src/app/api/**`.
- [ ] `cd apps/server && npm run lint` pass.
- [ ] `cd apps/server && npm run build` pass.
- [ ] `cd apps/web && npm run lint` pass.
- [ ] `cd apps/web && npm run typecheck` pass.

## Regression Scope
- [ ] Contract response không làm vỡ caller cũ trong compatibility window.
- [ ] Branch inactive không hiển thị icon sai trên map.
- [ ] Branch có domain hợp lệ luôn điều hướng đúng `/{language}/{branch-domain}`.
