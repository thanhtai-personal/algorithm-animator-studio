# Task 088 - Bổ sung trường giá thuê nhanh (trong ngày) và ràng buộc chọn loại giá khi tạo đơn thuê

## Mục tiêu
- Bổ sung một trường giá thuê ngắn hạn trong ngày (`giá thuê nhanh`) để lưu/publish riêng với giá thuê tiêu chuẩn.
- Khi tạo đơn thuê, bắt buộc chọn loại giá: `giá thuê tiêu chuẩn` hoặc `giá thuê nhanh`.
- Áp dụng rule thời gian mặc định theo loại giá:
  - `Giá thuê tiêu chuẩn`: bắt đầu = hiện tại, trả = sau 2 ngày (tổng 3 ngày).
  - `Giá thuê nhanh`: bắt đầu = hiện tại, trả = sau 24 giờ.
- Áp dụng đồng bộ trên `web app` và `zalo mini apps`; `mobile app` (Native) bỏ qua trong task này.

## Token Context Guard
- Chỉ nạp task `088` + file code thuộc `products/orders/sales/showroom` đang sửa.
- Tách lượt implement theo phần: schema -> server contract -> web -> zalo.
- Tham chiếu chuẩn: `docs/tasks/000_task_token_efficiency_standard.md`

## Phụ thuộc
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`
- `docs/tasks/034_staff_sales_pos_unified_module.md`
- `docs/tasks/035_staff_product_entry_pos_style_rbac.md`
- `docs/tasks/067_rounding_rules_frontend_only_backend_precision.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/000_authen-and-data-flow.md`
- `docs/test-case/auth-cases.md`
- `apps/server/src/modules/products/**`
- `apps/server/src/modules/orders/**`
- `apps/web/src/features/products/**`
- `apps/web/src/features/orders/**`
- `apps/web/src/features/sales/**`
- `apps/web/src/features/showroom/**`
- `apps/zalo-mini-apps/**`

## Architecture Impact
- Layers affected:
  - `apps/server`: contract sản phẩm/đơn thuê, validate loại giá, rule thời gian mặc định cho đơn thuê.
  - `apps/web`:
    - `Query/Service`: mở rộng DTO đọc/ghi giá thuê nhanh + loại giá áp dụng lúc tạo đơn.
    - `Hook`: orchestration lựa chọn loại giá và auto-fill thời gian thuê.
    - `Component`: thêm input/selector cho giá thuê nhanh và loại giá.
  - `apps/zalo-mini-apps/*`:
    - đồng bộ lựa chọn loại giá + auto-fill thời gian tương tự web.
- Domain affected:
  - Products pricing
  - Rental order creation
  - Sales POS/order flow
- App(s) affected: `apps/server`, `apps/web`, `apps/zalo-mini-apps/*`

## Current State vs Target State
- Current:
  - Chưa có field giá thuê nhanh tách riêng khỏi giá thuê tiêu chuẩn.
  - Luồng tạo đơn thuê chưa bắt buộc chọn loại giá tiêu chuẩn/nhanh với default thời gian theo policy mới.
- Target (Architecture V2):
  - Có field `quickRentPrice` (nullable, non-negative) trong model pricing.
  - API trả về field này đầy đủ và form quản trị có thể nhập/sửa.
  - Khi tạo đơn thuê phải chọn loại giá:
    - `STANDARD`:
      - `rentalStartDate` = thời điểm hiện tại.
      - `expectedReturnDate` = `rentalStartDate + 2 ngày` (tổng thuê 3 ngày).
    - `QUICK`:
      - `rentalStartDate` = thời điểm hiện tại.
      - `expectedReturnDate` = `rentalStartDate + 24 giờ`.
  - Rule trên áp dụng đồng nhất ở web và Zalo app.

## Boundary Rules
- Must keep:
  - Flow `Component -> Hook -> Query -> Service -> API (apps/server)`.
  - Chỉ `apps/server` truy cập DB/Supabase.
  - Field mới optional trong giai đoạn chuyển tiếp để không phá dữ liệu cũ.
  - Rule tính `expectedReturnDate` theo loại giá phải được chuẩn hóa ở domain layer, tránh mỗi client tự tính khác nhau.
- Forbidden:
  - Component gọi trực tiếp API/DB.
  - Duplicate business rule chọn loại giá/thời gian ở nhiều nơi mà không dùng shared logic.
  - Chỉ triển khai web mà bỏ qua Zalo app trong cùng luồng tạo đơn thuê.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giai đoạn 1: thêm field giá thuê nhanh nullable và mở rộng API contract.
  - Giai đoạn 2: thêm lựa chọn loại giá khi tạo đơn thuê + auto-fill thời gian mặc định.
  - Giai đoạn 3: rollout parity cho web và Zalo app.
- Deprecation/removal plan:
  - Chưa loại bỏ field giá thuê tiêu chuẩn cũ; dùng song song với giá thuê nhanh.
- Rollback condition:
  - Nếu phát sinh lệch thời gian thuê hoặc lệch tổng tiền do loại giá, rollback về luồng dùng giá tiêu chuẩn cũ và giữ field mới ở trạng thái không áp dụng.

## In-scope
1. Thiết kế contract field `quickRentPrice` trong DTO/API products.
2. Bổ sung migration/schema lưu `quickRentPrice` (nullable, non-negative).
3. Cập nhật form tạo/sửa sản phẩm để nhập giá thuê nhanh.
4. Cập nhật luồng tạo đơn thuê để chọn loại giá `STANDARD/QUICK`.
5. Áp dụng default thời gian theo rule:
  - STANDARD: hôm nay -> +2 ngày.
  - QUICK: hôm nay -> +24 giờ.
6. Triển khai parity trên web app và Zalo app.
7. Cập nhật copy vi/en cho nhãn và validation message liên quan.

## Out-of-scope
- Triển khai cho `Native-cli-remake` (mobile app).
- Dynamic pricing theo khung giờ.
- Promotion/discount engine cho giá thuê nhanh.
- Thay đổi cấu trúc thanh toán ngoài phạm vi chọn loại giá + thời gian mặc định.

## Danh sách task triển khai đề xuất
1. Chốt naming kỹ thuật (`quickRentPrice`, `pricingMode`).
2. Mở rộng schema + parser/validator phía server.
3. Mở rộng client types/service/query cho field mới và `pricingMode`.
4. Thêm UI chọn loại giá trong create-order web + zalo.
5. Chuẩn hóa default date-time theo policy STANDARD/QUICK.
6. Viết regression checklist cho web + zalo.

## Done criteria (coding)
- Có field `quickRentPrice` trong model dữ liệu + API contract.
- Form quản trị sản phẩm nhập/sửa được giá thuê nhanh.
- Tạo đơn thuê trên web + zalo bắt buộc chọn loại giá.
- STANDARD tự set thời gian thuê đúng (now -> +2 ngày).
- QUICK tự set thời gian thuê đúng (now -> +24h).
- Không làm hỏng dữ liệu sản phẩm/đơn cũ khi field mới đang null.

## Done Criteria (Architecture)
- [ ] Không phá layering/import boundary.
- [ ] Không duplicate business logic giữa runtime cũ/mới.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật (web + zalo).
- [ ] Có rollback condition cho pricing mode/time default.

## Regression Scope
- [ ] Products create/update (admin và sales entry nếu có).
- [ ] Web create-order (rental): chọn STANDARD/QUICK + kiểm tra default thời gian.
- [ ] Zalo create-order (rental): chọn STANDARD/QUICK + kiểm tra default thời gian.
- [ ] POS/showroom hiển thị giá đúng theo fallback policy.
- [ ] Tổng tiền và thời gian thuê không lệch khi field `quickRentPrice` null.
- [ ] Locale `vi/en` cho label/validation.

## Validation & Progress
- Validation/test/progress dùng chuẩn chung:
- `docs/tasks/000_task_token_efficiency_standard.md`
