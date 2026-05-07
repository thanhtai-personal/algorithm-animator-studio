# Task 069 - Đảm bảo toàn vẹn payment khi xóa/giảm hàng + khóa sửa số lượng/giá nhập sau khi tạo

## Input ban đầu
- Hệ thống đang tự tạo `payment` khi nhập hàng/thêm hàng (procurement intake, product-entry intake).
- Có rủi ro lệch số liệu tài chính nếu admin:
  - xóa sản phẩm,
  - giảm số lượng hàng,
  - hoặc sửa trực tiếp số lượng/giá nhập của phiếu nhập đã tạo.
- Yêu cầu vận hành:
  - không cho sửa `số lượng hàng` và `giá nhập` sau khi tạo xong,
  - nếu sai dữ liệu thì phải xóa và tạo lại theo luồng chuẩn.

## Mục tiêu
- Bảo toàn tính đúng đắn giữa tồn kho và sổ payment (expense/intake).
- Chuyển các thao tác chỉnh sửa nhạy cảm sang luồng có kiểm soát (rollback/recreate), không mutate lịch sử.
- Ngăn tình huống “số hàng thay đổi nhưng payment lịch sử không đổi” hoặc ngược lại.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`
- `docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
- `docs/tasks/066_procurement_product_input_upsert_and_excel_native_import.md`

## Mapping màn hình/source
- Procurement intake:
  - `apps/web/src/features/procurement/**`
  - `apps/web/src/server/services/procurementService.ts`
  - `apps/web/src/server/data-access/procurement.ts`
  - `apps/web/src/types/procurement.ts`
- Product create/add item + delete:
  - `apps/web/src/features/products/**`
  - `apps/web/src/features/sales/**` (product-entry POS)
  - `apps/web/src/server/services/productsService.ts`
  - `apps/web/src/server/data-access/products.ts`
- Payments/Audit:
  - `apps/web/src/server/data-access/payments.ts`
  - `apps/web/src/server/data-access/orderFinance.ts`
  - `apps/web/src/server/data-access/reports.ts`
  - `apps/web/src/server/data-access/dashboard.ts`

## Quy tắc nghiệp vụ bắt buộc
- `Procurement receipt` sau khi tạo thành công là dữ liệu bất biến cho các trường:
  - `quantity`, `unit_cost_amount`, `purchase_price`, `sale_price`, `rent_price_per_day`.
- Không cho phép API/update UI chỉnh trực tiếp các trường trên sau khi receipt đã tạo.
- Nếu nhập sai:
  - dùng luồng `xóa/rollback phiếu nhập` rồi tạo lại phiếu mới.
  - không được patch số lượng/giá nhập tại chỗ.
- Xóa/rollback phiếu nhập phải đảm bảo đồng bộ:
  - tồn kho item phát sinh từ phiếu nhập,
  - payment expense liên quan,
  - audit log.
- Xóa sản phẩm hoặc giảm số lượng sản phẩm không được làm sai lịch sử tài chính:
  - không cho hard-delete sản phẩm khi đã có liên kết procurement/payment/order.
  - ưu tiên `soft archive` + stock adjustment flow có lý do.
  - nếu cần đảo dữ liệu, phải tạo bút toán/record đảo chiều theo quy tắc ledger, không sửa record cũ.
- Mọi thao tác bị chặn phải trả reason code rõ ràng để FE hiển thị đúng ngữ cảnh.

## In-scope
- Khóa chỉnh sửa số lượng/giá nhập của intake lines ở cả API + UI.
- Thiết kế và triển khai flow rollback/delete receipt có guard điều kiện.
- Guard xóa sản phẩm/giảm item quantity theo hướng không phá toàn vẹn payment.
- Bổ sung audit events cho các action nhạy cảm: rollback receipt, archive product, stock adjustment do correction.
- Cập nhật message lỗi FE cho các case:
  - immutable intake line,
  - forbidden product delete due to financial links,
  - required rollback-recreate flow.

## Out-of-scope
- Tích hợp hệ thống kế toán ngoài.
- Viết lại toàn bộ ledger engine.
- Refactor UI lớn ngoài phạm vi luồng correction nêu trên.

## Prompt gợi ý cho Codex
```text
Mục tiêu: đảm bảo toàn vẹn dữ liệu payment khi nhập hàng/thêm hàng và khi admin xóa sản phẩm hoặc giảm số lượng.

Yêu cầu:
1) Khóa immutable cho quantity + purchase pricing của procurement receipt sau khi tạo.
2) Không cho update trực tiếp intake line; nếu sai phải rollback/delete receipt và tạo lại.
3) Thiết kế rollback flow đảm bảo đồng bộ stock + payment + audit.
4) Khi admin xóa sản phẩm/giảm item, không làm sai lịch sử payment:
   - chặn hard delete nếu có financial references,
   - dùng soft archive/adjustment + reason code.
5) FE hiển thị lỗi rõ ràng theo reason code backend.
6) Không phá flow hiện tại của procurement/products/orders/payments.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn đường update trực tiếp số lượng/giá nhập của receipt đã tạo.
- Có flow correction chuẩn bằng rollback/delete + recreate.
- Xóa sản phẩm/giảm số lượng không làm lệch payment/ledger lịch sử.
- Có reason code + audit trail rõ ràng cho các thao tác bị chặn/correction.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Tạo phiếu nhập -> thử sửa quantity/purchase_price qua UI/API:
  - phải bị chặn đúng reason code.
- Nhập sai dữ liệu -> rollback/delete phiếu nhập:
  - stock, payment, audit cập nhật nhất quán.
- Sản phẩm đã có payment/procurement history:
  - hard-delete bị chặn, archive flow hoạt động.
- Giảm số lượng item:
  - không mutate lịch sử payment cũ,
  - có adjustment/rollback record theo policy.
- Dashboard/Reports:
  - tổng chi và lợi nhuận không lệch sau các flow correction.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 069 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 068 /a - [ ] 069 | Procurement/payment integrity: immutable intake quantity/cost after create + rollback-recreate correction flow + safe product delete/stock reduction guards | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 069 |- [x] 069 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 069
  - Task file: docs/tasks/069_procurement_payment_integrity_and_immutable_intake_lines.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
