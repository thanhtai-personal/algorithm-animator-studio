# Task 065 - Module vận chuyển: toggle admin + fallback auto PICKED_UP khi tắt

## Input ban đầu
- Cần thêm khả năng bật/tắt module vận chuyển từ admin settings.
- Module vận chuyển chưa triển khai ở giai đoạn hiện tại nên mặc định phải là `tắt`.
- Khi module vận chuyển tắt:
  - sau khi xác nhận đơn thuê, đơn phải chuyển sang trạng thái khách đã nhận đồ (`PICKED_UP`) luôn.
  - giao diện tạo đơn trả chỉ lấy nguồn từ các đơn đã `PICKED_UP`.

## Mục tiêu
- Bổ sung toggle `is_shipping_module_enabled` ở hệ thống.
- Thiết lập mặc định toggle là `false`.
- Chuẩn hóa business fallback cho rental flow khi shipping off.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/048_orders_domain_order_type_and_debt_status.md`
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/050_return_order_modal_source_filter_and_sync.md`

## Mapping màn hình/source
- Settings toggle:
  - `apps/web/src/features/settings/components/SettingsGeneralPage.tsx`
  - `apps/web/src/features/settings/hooks/useSettingsGeneralPage.ts`
  - `apps/web/src/features/settings/services/settingsClientService.ts`
  - `apps/web/src/server/services/settingsService.ts`
  - `apps/web/src/server/data-access/settings.ts`
- Orders domain:
  - `apps/web/src/server/services/ordersService.ts`
  - `apps/web/src/server/data-access/orders.ts`
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
  - `apps/web/src/features/sales/hooks/useSalesPosPage.ts`
- Return-order sources:
  - `apps/web/src/server/services/returnOrdersService.ts`
  - `apps/web/src/server/data-access/returnOrders.ts`
  - `apps/web/src/features/orders/hooks/useReturnOrderModal.ts`
- SQL:
  - `apps/web/sql/026_shipping_module_toggle.sql` (new)
  - `apps/web/sql/README.md`

## Quy tắc nghiệp vụ bắt buộc
- `is_shipping_module_enabled`:
  - có thể chỉnh bởi admin (owner_admin/admin theo policy settings hiện tại),
  - mặc định `false` trên môi trường mới sau migration.
- Khi shipping module `false`:
  - flow xác nhận đơn thuê phải auto chuyển trạng thái sang `PICKED_UP` (không dừng ở `CONFIRMED`).
- Trong flow tạo đơn trả:
  - source filter chỉ lấy đơn rental trạng thái `PICKED_UP`.
- Khi shipping module `true` (chuẩn bị cho tương lai):
  - giữ nguyên semantics hiện hành cho bước `CONFIRMED` trước pickup (không phá forward compatibility).

## In-scope
- Thêm field settings + migration mặc định `false`.
- Wiring UI/API cho admin bật/tắt.
- Update server business rule transition khi tạo/xác nhận đơn thuê theo toggle shipping.
- Verify return-order source filter chỉ lấy `PICKED_UP` trong UI/API.

## Out-of-scope
- Xây dựng đầy đủ module vận chuyển (carrier, tracking, shipment states).
- Thêm màn hình dashboard vận chuyển.
- Tích hợp API bên thứ ba cho vận chuyển.

## Prompt gợi ý cho Codex
```text
Mục tiêu: thêm shipping toggle (mặc định off) và fallback rental auto PICKED_UP khi shipping off.

Yêu cầu:
1) Thêm `is_shipping_module_enabled` vào settings (default false) + SQL migration.
2) Admin có thể bật/tắt từ Settings.
3) Nếu shipping off: sau khi xác nhận đơn thuê, trạng thái đơn phải là PICKED_UP luôn.
4) Return-order source chỉ lấy đơn PICKED_UP để tạo đơn trả.
5) Không regression flow SALE và các transition DEBT/COMPLETED hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Có migration SQL và runbook cho shipping toggle.
- Settings UI/API chỉnh được shipping toggle.
- Rental confirm/create flow khi shipping off ra trạng thái `PICKED_UP`.
- Return-order sources filter chỉ còn đơn `PICKED_UP`.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Toggle mặc định sau migration là OFF.
- OFF:
  - tạo/xác nhận rental order -> trạng thái lên `PICKED_UP`.
  - mở modal tạo return-order -> chỉ thấy source `PICKED_UP`.
- ON (test forward-compat):
  - semantics confirm/pickup không bị hard-break.
- Verify không ảnh hưởng flow SALE.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 065 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 064 /a - [ ] 065 | Shipping module toggle (default off) + rental auto-pickup fallback + return source filter PICKED_UP only | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 065 |- [x] 065 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 065
  - Task file: docs/tasks/modules/shipping/001_shipping_module_toggle_and_rental_auto_pickup.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
