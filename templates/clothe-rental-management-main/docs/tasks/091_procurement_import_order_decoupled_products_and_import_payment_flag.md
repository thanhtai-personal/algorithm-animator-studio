# Task 091 - Tách đơn nhập hàng khỏi sản phẩm và chuẩn hóa payment `isImportOrder`

## Input ban đầu
- Module nhập hàng bằng Excel hiện đang có giả định nhập hàng có thể tạo/cập nhật sản phẩm ngay trong flow import.
- Yêu cầu nghiệp vụ mới:
  - Khi nhập hàng không trực tiếp tạo sản phẩm.
  - Import/commit đơn nhập chỉ tạo đơn nhập hàng và payment chi tương ứng.
  - Payment phát sinh từ đơn nhập hàng phải có `isImportOrder = true`.
  - User mở chi tiết đơn nhập và bấm "Tạo sản phẩm" thì hệ thống mới tạo sản phẩm từ các dòng của đơn nhập.
  - User có thể chỉnh sửa mọi thông tin đơn nhập, bao gồm tổng tiền đơn dùng để tạo payment.
  - Tổng tiền đơn không bắt buộc khớp với tổng tiền các dòng sản phẩm trong đơn.
  - Sản phẩm đã tạo từ đơn nhập có thể sửa/xóa độc lập.
  - Đơn nhập có thể sửa/xóa độc lập, không bị ràng buộc bởi sản phẩm đã tạo.
  - Ngoài flow nhập hàng, user có thể tạo payment phụ chi với `isImportOrder = true` bằng toggle "Đơn nhập hàng" trong màn tạo phụ chi POS.

## Mục tiêu
- Tách hoàn toàn dependency nghiệp vụ giữa `procurement import order` và `products`.
- Đơn giản hóa thao tác vận hành: đơn nhập là chứng từ/chi phí, sản phẩm là catalog/stock độc lập sau khi được tạo.
- Chuẩn hóa nguồn nhận diện chi phí nhập hàng bằng cờ `isImportOrder` trên payment, không dựa vào liên kết cứng tới sản phẩm.

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
- `docs/tasks/066_procurement_product_input_upsert_and_excel_native_import.md`
- `docs/tasks/069_procurement_payment_integrity_and_immutable_intake_lines.md`
- `docs/tasks/090_pos_surcharge_expense_and_admin_passkey_lock.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`

## Hiện trạng cần lưu ý
- Task 066 từng định hướng import procurement có thể upsert/tạo sản phẩm theo `product_code`.
- Task 069 từng định hướng khóa một số thông tin nhập hàng sau tạo để giữ integrity giữa stock/payment.
- Task này là thay đổi nghiệp vụ mới, cần điều chỉnh lại giả định:
  - Đơn nhập không còn là nguồn khóa cứng của sản phẩm.
  - Payment nhập hàng là chi phí độc lập có `isImportOrder`.
  - Sản phẩm tạo từ đơn nhập chỉ là action tiện ích từ dữ liệu đơn nhập, không tạo quan hệ ràng buộc bắt buộc.

## Mapping màn hình/source dự kiến
- Procurement import/list/detail:
  - `apps/web/src/features/procurement/**`
  - `apps/server/src/modules/procurement/**` nếu domain đã/đang migrate sang Nest.
  - Legacy compatibility route trong `apps/web/src/app/api/procurement/**` chỉ được forward nếu còn tồn tại.
- Products:
  - `apps/web/src/features/products/**`
  - `apps/server/src/modules/products/**`
- Payments/POS surcharge expense:
  - `apps/web/src/features/sales/**`
  - `apps/server/src/modules/payments/**`
  - `apps/web/src/features/settings/**` nếu liên quan passkey/permission của phụ chi POS.
- SQL/migration:
  - schema payment cần có/được backfill field `isImportOrder` hoặc field equivalent theo naming hiện có.

## Config cần chuẩn bị trước khi chạy task
- Xác nhận tên field DB chính thức:
  - ưu tiên `is_import_order` ở DB/API,
  - map ra `isImportOrder` ở TypeScript DTO/client type.
- Xác nhận permission được phép:
  - tạo/sửa/xóa đơn nhập,
  - tạo sản phẩm từ đơn nhập,
  - tạo phụ chi POS với toggle "Đơn nhập hàng".
- Xác nhận hành vi khi xóa đơn nhập:
  - mặc định không xóa payment nếu payment đã được user chỉnh/sửa thủ công sau đó, trừ khi UI có action xóa payment rõ ràng.
  - nếu product đã tạo từ đơn nhập, không cascade delete product.

## Architecture Impact
- Layers affected:
  - Client: procurement UI, product creation action, POS surcharge expense UI.
  - Client state: procurement/product/payment stores nếu có UI-visible state.
  - Server/API: procurement import/detail/update/delete, create-products-from-import-order, payment create/update.
  - DB: payment flag `is_import_order`, optional import order metadata.
- Domain affected:
  - Procurement/import orders.
  - Products/catalog/inventory.
  - Payments/expenses/POS surcharge expense.
  - Reports/dashboard nếu đang phân loại chi phí nhập hàng.
- App(s) affected:
  - `apps/web`
  - `apps/server`
  - Không đụng `apps/mobile`/`apps/zalo-mini-apps/*` trừ khi có caller payment/procurement hiện hữu.

## Current State vs Target State
- Current:
  - Procurement import có thể gắn chặt với logic tạo/upsert sản phẩm và integrity giữa line/product/payment.
  - Một số guard có thể chặn sửa/xóa vì giả định payment, stock và product phải nhất quán tuyệt đối.
  - POS phụ chi chưa chắc có toggle tạo payment nhập hàng.
- Target (Architecture V2):
  - Import Excel tạo `import order` + payment chi, không tạo sản phẩm ngay.
  - Chi tiết đơn nhập có action rõ ràng "Tạo sản phẩm" để tạo sản phẩm từ snapshot dòng đơn nhập.
  - Sau khi tạo, sản phẩm độc lập với đơn nhập; sửa/xóa sản phẩm không bị ràng buộc bởi đơn nhập.
  - Đơn nhập độc lập với sản phẩm; sửa/xóa đơn nhập không bị chặn bởi sản phẩm đã tạo.
  - Tổng tiền đơn nhập là field user-editable và là số tiền tạo/cập nhật payment; không bắt buộc bằng tổng line.
  - Payment nhập hàng luôn có `isImportOrder = true`, dù tạo từ import order hay từ POS phụ chi toggle "Đơn nhập hàng".
  - API source-of-truth nằm ở `apps/server`; web API route nếu còn dùng chỉ là adapter/forwarder.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Store-first hydration nếu màn procurement/products/payments đang dùng MobX store.
  - Server flow: `Controller -> Application Service -> Data-access/Repository -> Supabase`.
  - Chỉ `apps/server` được truy cập Supabase DB trực tiếp.
  - Product creation từ đơn nhập phải đi qua product API/application service hiện có, không gọi data-access trực tiếp từ procurement UI.
  - Payment create/update phải đi qua payment API/application service, không duplicate finance rule ở client.
- Forbidden:
  - Không tạo business endpoint mới chỉ trong `apps/web/src/app/api/**`.
  - Không import chéo feature internals giữa procurement/products/payments ở frontend.
  - Không để component gọi trực tiếp HTTP/service.
  - Không tạo foreign key/cascade cứng làm product bị phụ thuộc vòng đời import order.
  - Không validate bắt buộc `orderTotalAmount === sum(importLines)`.
  - Không chặn sửa/xóa product chỉ vì product từng được tạo từ đơn nhập.
  - Không chặn sửa/xóa import order chỉ vì đã tạo product.

## Compatibility & Migration Strategy
- Compatibility window:
  - Giữ đọc được dữ liệu procurement cũ đã có product/payment link nếu source đang tồn tại.
  - Với record cũ, UI chỉ hiển thị thông tin tham chiếu/migration note nếu cần; không tiếp tục áp dụng guard ràng buộc cũ.
  - Nếu legacy web API còn caller, chỉ forward sang Nest API và giữ response contract tương thích trong giai đoạn cutover.
- Deprecation/removal plan:
  - Loại bỏ logic auto-create/upsert product khỏi import commit sau khi caller cutover xong.
  - Loại bỏ guard immutable cũ không còn phù hợp với policy tách rời.
  - Document lại semantics mới cho procurement/payment/product.
- Rollback condition:
  - Có thể tắt action "Tạo sản phẩm từ đơn nhập" bằng feature flag hoặc fallback UI nếu phát hiện lỗi tạo product hàng loạt.
  - Rollback không được xóa/sửa payment đã tạo; chỉ dừng action mới và giữ khả năng chỉnh tay đơn nhập/payment.

## In-scope
- Điều chỉnh import Excel:
  - validate/parse dòng đơn nhập,
  - tạo import order,
  - tạo payment chi với `isImportOrder = true`,
  - không tạo/upsert product trong bước import commit.
- Cho phép sửa toàn bộ thông tin đơn nhập sau tạo:
  - thông tin header,
  - dòng hàng trong đơn,
  - tổng tiền đơn/payment amount.
- Khi sửa tổng tiền đơn:
  - cập nhật payment liên quan nếu payment vẫn là payment gốc của đơn nhập,
  - hoặc hiển thị rõ nếu payment đã tách/chỉnh độc lập theo policy implementation.
- Thêm action ở chi tiết đơn nhập:
  - "Tạo sản phẩm" từ các dòng đơn nhập,
  - preview các dòng sẽ tạo,
  - xử lý dòng lỗi riêng, không rollback toàn bộ nếu policy hiện có hỗ trợ partial success.
- Sau khi tạo sản phẩm:
  - lưu metadata mềm để trace nguồn nếu cần, ví dụ `sourceImportOrderId`/note,
  - không tạo ràng buộc delete/update bắt buộc.
- Cho phép sửa/xóa product được tạo từ đơn nhập như product bình thường.
- Cho phép sửa/xóa đơn nhập sau khi đã tạo product.
- POS phụ chi:
  - thêm toggle "Đơn nhập hàng",
  - khi bật thì create payment với `isImportOrder = true`,
  - khi tắt thì `isImportOrder = false` hoặc unset theo contract hiện có.
- Cập nhật dashboard/report nếu đang phân loại chi phí nhập hàng theo nguồn cũ.

## Out-of-scope
- Kế toán bút toán kép/ledger engine đầy đủ.
- Tự động đồng bộ hai chiều giữa thay đổi product và đơn nhập.
- Bắt buộc reconcile tổng tiền đơn với tổng tiền line.
- Tích hợp OCR hóa đơn hoặc ERP ngoài hệ thống.

## Deliverables mong muốn
- API/DTO contract mới hoặc cập nhật:
  - import order create/update/delete/detail.
  - create products from import order.
  - payment create/update có `isImportOrder`.
  - POS surcharge expense create payload có `isImportOrder`.
- SQL migration/backfill cho `is_import_order` nếu thiếu.
- UI procurement detail có action tạo sản phẩm từ đơn nhập.
- UI import/order edit không còn khóa các trường theo dependency product.
- UI POS phụ chi có toggle "Đơn nhập hàng".
- Regression notes cho procurement, products, payments, reports.

## Prompt gợi ý cho Codex
```text
Mục tiêu: tách hoàn toàn đơn nhập hàng khỏi sản phẩm. Import Excel chỉ tạo import order + payment `isImportOrder=true`, không tạo/upsert product.
Yêu cầu: thêm action ở chi tiết đơn nhập "Tạo sản phẩm" để user chủ động tạo product từ dòng đơn nhập; product và đơn nhập sau đó sửa/xóa độc lập, không cascade/guard lẫn nhau.
Cho phép sửa mọi thông tin đơn nhập, gồm tổng tiền dùng cho payment; tổng tiền không cần bằng tổng line.
POS phụ chi thêm toggle "Đơn nhập hàng"; khi bật tạo payment `isImportOrder=true`.
Tuân thủ Component->Hook->Query->Service->API và Controller->Service->Repository->Supabase; endpoint business mới ở apps/server.
Validation: apps/web typecheck + targeted eslint; apps/server build + targeted lint.
```

## Done criteria (coding)
- Import Excel procurement không còn tạo/upsert product trong commit.
- Import Excel procurement tạo payment chi với `isImportOrder = true`.
- User có thể sửa toàn bộ đơn nhập, gồm `totalAmount/paymentAmount`, không bị validate bằng tổng line.
- Sửa tổng tiền đơn cập nhật đúng payment gốc hoặc có state tách payment rõ ràng theo policy đã chọn.
- Chi tiết đơn nhập có action "Tạo sản phẩm" chạy end-to-end từ các line của đơn nhập.
- Product tạo từ đơn nhập có thể sửa/xóa như product thường.
- Đơn nhập đã tạo product vẫn có thể sửa/xóa, không cascade product.
- POS phụ chi có toggle "Đơn nhập hàng" và payload/payment persistence đúng `isImportOrder`.
- Reports/dashboard dùng đúng `isImportOrder` khi phân loại chi phí nhập hàng.
- Không còn guard lỗi thời chặn sửa/xóa vì ràng buộc import order <-> product.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.
- `cd apps/server && npm run build` pass nếu sửa server.
- `cd apps/server && npx eslint [files changed]` pass nếu sửa server.

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` nếu domain đã ở Nest.
- [ ] Không thêm import ngược tầng hoặc gọi service/API trực tiếp từ component.
- [ ] Không duplicate business rule procurement/product/payment ở 2 runtime.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] API changes có contract parity hoặc migration note rõ ràng.
- [ ] Caller cutover list được cập nhật nếu có chuyển từ legacy web API sang Nest.
- [ ] Không tạo FK/cascade cứng giữa import order và product.
- [ ] Payment source flag `isImportOrder` được xử lý ở backend và expose nhất quán ra client DTO.
- [ ] Có rollback condition cho action tạo sản phẩm từ đơn nhập.
- [ ] Progress log có `Token usage`.

## Regression Scope
- [ ] Import Excel tạo đơn nhập + payment, không tạo product.
- [ ] Chi tiết đơn nhập hiển thị line/header/total đúng sau import.
- [ ] Sửa tổng tiền đơn không cần khớp tổng line và payment amount cập nhật đúng.
- [ ] Sửa/xóa line đơn nhập không ảnh hưởng product đã tạo.
- [ ] Bấm "Tạo sản phẩm" từ chi tiết đơn nhập tạo product đúng dữ liệu line.
- [ ] Product tạo từ đơn nhập sửa/xóa được như product thường.
- [ ] Xóa đơn nhập đã tạo product không xóa/chặn product.
- [ ] POS phụ chi bật "Đơn nhập hàng" tạo payment `isImportOrder = true`.
- [ ] POS phụ chi tắt "Đơn nhập hàng" không set nhầm chi phí nhập hàng.
- [ ] Dashboard/reports vẫn tính chi phí/lợi nhuận đúng theo payment.
- [ ] RBAC/branch isolation không bị nới quyền khi tạo/sửa/xóa đơn nhập, product, payment.

## Nhắc test nhanh
- Import một file Excel có 2-3 dòng:
  - confirm product count chưa tăng,
  - payment mới có `isImportOrder = true`.
- Vào chi tiết đơn nhập:
  - sửa tổng tiền khác tổng line,
  - reload lại thấy payment amount đúng.
- Bấm "Tạo sản phẩm":
  - confirm product được tạo,
  - sửa/xóa product đó không bị chặn bởi đơn nhập.
- Xóa/sửa đơn nhập sau khi đã tạo product:
  - confirm product không bị xóa/cascade.
- Tạo phụ chi POS:
  - bật toggle "Đơn nhập hàng" -> payment có `isImportOrder = true`,
  - tắt toggle -> payment thường.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 091 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 090 /a - [ ] 091 | Procurement decoupling: Excel import creates import order + payment only, products created later from detail, payment isImportOrder flag | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 091 |- [x] 091 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 091
  - Task file: docs/tasks/091_procurement_import_order_decoupled_products_and_import_payment_flag.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  - Token usage: input=<n>, output=<n>, total=<n>
  PROGRESS_LOG
  ~~~
