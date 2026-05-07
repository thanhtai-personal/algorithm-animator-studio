# Task 092 - Kata Rental Order: Trang đơn active + chuyển trạng thái + bottom navigator 2 page

## Input ban đầu
- `apps/zalo-mini-apps/kata-rental-order` hiện tập trung vào flow tạo đơn.
- Chưa có màn hình riêng để theo dõi các đơn đang active.
- Chưa có điều hướng đáy (bottom navigator) để chuyển nhanh giữa trang tạo đơn và trang quản lý đơn active.

## Mục tiêu
- Bổ sung page hiển thị danh sách đơn đang active trong mini app `kata-rental-order`.
- Cho phép cập nhật trạng thái đơn thuê từ danh sách/chitiet đơn bằng API chuẩn module orders.
- Bổ sung bottom navigator để chuyển qua lại giữa:
  - page tạo đơn (hiện có),
  - page đơn active (mới).

## Phạm vi
- App: `apps/zalo-mini-apps/kata-rental-order/**`
- Ưu tiên sửa trong các lớp:
  - `features/rental-order/components`
  - `features/rental-order/hooks`
  - `features/rental-order/queries`
  - `features/rental-order/services`
  - `features/rental-order/stores`
  - `src/App.tsx` (hoặc entry container tương đương)

## Architecture Impact
- Layers affected:
  - Component, Hook, Query, Service, Store (MobX) của mini app rental-order.
- Domain affected:
  - Orders listing và status transition cho đơn thuê active.
  - Navigation trong client mini app.

## Current State vs Target State
- Current:
  - Người dùng tạo đơn trên 1 page chính; thiếu trang theo dõi đơn active.
  - Chưa có navigator đáy cho 2 page nghiệp vụ chính.
- Target (Architecture V2):
  - Có 2 page tách biệt: `Create Order` và `Active Orders`.
  - Bottom navigator điều hướng nhanh, state ổn định khi chuyển tab.
  - Active orders gọi API chuẩn `/api/v1/orders/**`, không dùng endpoint legacy.

## Boundary Rules
- Must keep:
  - Luồng `Component -> Hook -> Query -> Service -> API`.
  - Component không gọi `fetch` trực tiếp.
  - Query hydrate về MobX store, UI đọc từ store (store-first hydration).
  - Dùng API module chuẩn:
    - `GET /api/v1/orders` (lọc status active, branchId, search nếu cần)
    - `PATCH /api/v1/orders/:orderId/status` hoặc endpoint transition phù hợp trong module orders.
- Forbidden:
  - Thêm endpoint business mới ở `apps/web/app/api`.
  - Gọi Supabase trực tiếp từ mini app.
  - Duplicate logic transition status giữa client và server.

## Compatibility & Migration Strategy
- Compatibility window:
  - Không yêu cầu backward compatibility cho UI cũ trong cùng mini app; thay đổi trực tiếp tại `kata-rental-order`.
- Rollback condition:
  - Nếu phát sinh regression nặng ở flow tạo đơn hoặc status transition, rollback riêng phần bottom navigator + active orders page, giữ nguyên create-order page cũ.

## Yêu cầu chức năng chi tiết
1. Active orders page:
- Hiển thị danh sách đơn active theo branch hiện tại.
- Trạng thái active mặc định gồm: `DRAFT`, `RESERVED`, `CONFIRMED`, `PICKED_UP`, `DEBT`.
- Có loading/empty/error state rõ ràng.

2. Status transition:
- Từ từng đơn, cho phép đổi trạng thái theo action hợp lệ (theo business rules backend).
- Sau khi cập nhật thành công:
  - cập nhật store ngay,
  - invalidate/refetch query liên quan để đồng bộ.

3. Bottom navigator:
- Có 2 tab: `Tạo đơn` và `Đơn active`.
- Chuyển tab không làm mất state quan trọng của form tạo đơn ngoài các reset chủ động.
- UI phù hợp mobile viewport, giữ safe-area và khả năng thao tác một tay.

4. Search/filter (nếu có ô tìm kiếm trên active orders):
- Bắt buộc debounce `350ms` trước khi gọi query.

## Done Criteria (Architecture)
- [ ] Không phá vỡ layering `Component -> Hook -> Query -> Service`.
- [ ] Không thêm DB access ngoài `apps/server`.
- [ ] Không thêm endpoint business mới ngoài module chuẩn hiện có.
- [ ] Active orders + status transition dùng API chuẩn module orders.

## Done Criteria (Coding)
- [ ] Có page đơn active hiển thị đúng dữ liệu branch hiện tại.
- [ ] Có thể chuyển trạng thái đơn active thành công từ mini app.
- [ ] Có bottom navigator chuyển giữa 2 page ổn định.
- [ ] `cd apps/zalo-mini-apps/kata-rental-order && npm run lint` pass.
- [ ] `cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck` pass.

## Regression Scope
- [ ] Flow tạo đơn hiện tại vẫn chạy bình thường sau khi thêm navigator.
- [ ] Flow voice quick-fill (task 010/011) không bị ảnh hưởng khi chuyển tab.
- [ ] Không lỗi stale state khi chuyển qua lại giữa `Create Order` và `Active Orders`.
- [ ] Status transition fail path hiển thị lỗi rõ ràng, không làm crash page.

## Cập nhật tiến độ (sau khi hoàn thành task)
- Đánh dấu checklist `Modules/Zalo-Mini-App/012` trong:
  - `progress/modules/zalo-mini-app/tasks.md`
- Append completion log theo format hiện có của module.
