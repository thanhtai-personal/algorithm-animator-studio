# Task 079 - Zalo Mini App commerce flow: catalog + cart + order draft + OA support

## Input ban đầu
- Sau khi có auth, cần luồng mua/đặt hàng tối thiểu trong mini app.
- Business cần hỗ trợ nhanh:
  - xem catalog/showroom,
  - thêm giỏ hàng,
  - tạo đơn nháp/chờ thanh toán,
  - mở kênh hỗ trợ OA trực tiếp.

## Mục tiêu
- Triển khai luồng commerce core cho mini app:
  - product listing/detail,
  - cart local state,
  - create order draft qua backend API.
- Tích hợp entry hỗ trợ OA trong màn chi tiết/checkout (SDK `showOAWidget`).

## Phụ thuộc
- `docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md`
- `docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/048_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`

## Mapping màn hình/source
- Mini app product/order feature:
  - `apps/zalo-mini-app/src/features/products/**` (new)
  - `apps/zalo-mini-app/src/features/orders/**` (new)
  - `apps/zalo-mini-app/src/features/cart/**` (new)
- Backend API reuse/extend:
  - `apps/web/src/app/api/showroom/products/route.ts` (reuse)
  - `apps/web/src/app/api/orders/route.ts` hoặc `apps/web/src/app/api/zalo-mini-app/orders/**` (extend/new)
  - `apps/web/src/server/services/ordersService.ts` (reuse business rules)
- Types:
  - `apps/web/src/types/zaloMiniAppOrder.ts` (new nếu cần tách DTO)

## Quy tắc nghiệp vụ bắt buộc
- Không bypass order rules hiện có:
  - validate stock, status transition, totals.
- Store-first hydration:
  - query fetch -> merge store -> UI render từ store.
- Cart chỉ là state UI:
  - dữ liệu authoritative vẫn ở backend khi tạo order draft.
- OA support:
  - trigger `showOAWidget` hoặc entry support tương đương, không chặn flow checkout.

## In-scope
- Product list/detail cho mini app.
- Cart CRUD local.
- Tạo order draft (chưa thu tiền) qua backend.
- Nút hỗ trợ OA trong flow mua hàng.

## Out-of-scope
- Full loyalty/gamification.
- Multi-shipment logistics nâng cao.
- Đồng bộ giỏ hàng đa thiết bị realtime.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm luồng commerce cơ bản cho Zalo Mini App gồm catalog, cart, order draft và OA support.

Yêu cầu:
1) Implement product list/detail + cart state theo kiến trúc chuẩn.
2) Tạo order draft qua backend, không duplicate business rules.
3) Bảo toàn validation stock/tổng tiền theo server services hiện có.
4) Tích hợp OA support entry (showOAWidget) ở điểm phù hợp.
5) Không regression các endpoint orders/products hiện hữu.

Validation commands:
- cd apps/zalo-mini-app && npm run lint
- cd apps/web && npm run typecheck
```

## Done criteria (coding)
- User xem sản phẩm, thêm/xóa giỏ hàng, tạo order draft thành công.
- OA support entry hoạt động ở flow mua hàng.
- Backend order totals/validation nhất quán với web hiện tại.
- `cd apps/zalo-mini-app && npm run lint` pass.
- `cd apps/web && npm run typecheck` pass.

## Nhắc test nhanh
- Catalog load theo branch/showroom context đúng.
- Cart update không cần reload.
- Create draft thành công với item hợp lệ; item invalid bị chặn đúng rule.
- OA widget mở được từ app mà không crash.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `Modules/Zalo-Mini-App/003` thì thêm mới vào:
  - `progress/modules/zalo-mini-app/tasks.md`
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] Modules/Zalo-Mini-App/003 |- [x] Modules/Zalo-Mini-App/003 |" progress/modules/zalo-mini-app/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/modules/zalo-mini-app/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Modules/Zalo-Mini-App/003
  - Task file: docs/tasks/modules/zalo-mini-app/003_zalo_mini_app_catalog_order_draft_and_oa_support.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
