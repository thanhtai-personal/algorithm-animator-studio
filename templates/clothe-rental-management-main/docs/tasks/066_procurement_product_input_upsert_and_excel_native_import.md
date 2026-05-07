# Task 066 - Cải thiện module nhập hàng: upsert sản phẩm theo mã + import/export Excel native (không CSV)

## Input ban đầu
- Cần cải thiện module nhập hàng, tập trung vào nhập liệu sản phẩm.
- Cho phép nhập sản phẩm chưa có trong hệ thống ngay trong flow nhập hàng.
- Hệ thống xác định sản phẩm cũ/mới theo `mã sản phẩm`.
- Nếu là sản phẩm cũ: cập nhật thông tin mới nếu có.
- Nếu là sản phẩm mới: cần đủ thông tin để tạo mới sản phẩm.
- Không dùng CSV; phải chuyển sang Excel (`.xlsx`).
- Khi thiết kế file mẫu/import context, admin cần chọn showroom (mặc định là showroom mặc định hiện tại) và một số thông tin cần thiết khác nếu có.
- Nếu record nhập hàng không có mã sản phẩm thì hệ thống tự sinh mã sản phẩm mới.
- Sau khi nhập hàng cần có thống kê kết quả: bao nhiêu row thành công, row nào chưa hoàn thành, và cho phép export lại file các row chưa hoàn thành để user bổ sung.

## Mục tiêu
- Chuẩn hóa nghiệp vụ nhập hàng với cơ chế `product upsert` theo `product_code`.
- Đảm bảo user có thể nhập hàng dù sản phẩm đã có hay chưa có trong catalog.
- Chuẩn hóa import/export bằng Excel native end-to-end (template, validate, commit).

## Thư viện đề xuất (thêm vào implementation plan)
- Version tham chiếu tại ngày `2026-03-09`:
  - `exceljs@4.4.0`
  - `file-type@21.3.0`
  - `xlsx@0.18.5` (fallback)
- Core cho Excel `.xlsx` (khuyến nghị chính):
  - `exceljs` (`^4.4.0`)
  - Lý do fit: đọc/ghi `.xlsx` trong Node.js, hỗ trợ style header, freeze pane, data validation, export file incomplete có thêm cột `error_reason`.
  - Mapping dùng trong task:
    - `template/route.ts`: generate template `.xlsx` chuẩn.
    - `import/validate/route.ts`: parse workbook từ file upload + map lỗi `sheet/row/column`.
    - `import/commit/route.ts`: dùng normalized rows để commit.
    - `import/incomplete/export/route.ts`: xuất `.xlsx` chỉ gồm row fail.
- Guard file upload:
  - `file-type` (`^21.3.0`)
  - Lý do fit: kiểm tra magic bytes để tránh file giả mạo đuôi `.xlsx` trước khi parse.
  - Gợi ý: reject sớm với code `INVALID_FILE_TYPE` khi MIME/signature không hợp lệ.
- Validation contract (đã có sẵn trong repo, không cần cài thêm):
  - `zod` (reuse dependency hiện tại)
  - Lý do fit: schema hóa row import/context payload/commit payload, trả lỗi ổn định theo field.
- Optional fallback (chỉ dùng nếu gặp file Excel đặc thù không parse tốt bằng `exceljs`):
  - `xlsx` / SheetJS
  - Lý do cân nhắc: khả năng tương thích parser rộng.
  - Lưu ý: ưu tiên chỉ một core library (`exceljs`) để giảm complexity; chỉ bổ sung SheetJS khi có test case chứng minh cần thiết.

## Ma trận khả năng sử dụng tốt cho task 066
- `exceljs`:
  - Mức phù hợp: cao.
  - Đáp ứng tốt: template `.xlsx`, validate import, export incomplete, giữ cùng một định dạng file xuyên suốt.
- `file-type`:
  - Mức phù hợp: cao.
  - Đáp ứng tốt: harden security/UX cho bước upload (fail fast, lỗi rõ ràng).
- `zod`:
  - Mức phù hợp: cao.
  - Đáp ứng tốt: chuẩn hóa lỗi validate và giảm lệch contract giữa API/service.
- `xlsx` / SheetJS:
  - Mức phù hợp: trung bình (fallback).
  - Đáp ứng tốt: parser compatibility cho file edge-case; không bắt buộc cho first delivery.

## Link tham khảo chính thức
- `exceljs`:
  - https://www.npmjs.com/package/exceljs
  - https://github.com/exceljs/exceljs
- `file-type`:
  - https://www.npmjs.com/package/file-type
- `SheetJS`:
  - https://docs.sheetjs.com/docs/getting-started/installation/nodejs
  - https://docs.sheetjs.com/docs/getting-started/solutions/output
- `Next.js Route Handlers` (upload/formData):
  - https://nextjs.org/docs/app/building-your-application/routing/route-handlers

## Phụ thuộc
- `docs/tasks/065_procurement_intake_manual_excel_import_and_dual_profit_metrics.md`
- `docs/tasks/006_products_catalog_module.md`
- `docs/tasks/007_inventory_items_module.md`
- `docs/tasks/039_product_pricing_cost_stock_rent_count_showroom_display.md`

## Mapping màn hình/source
- Procurement UI:
  - `apps/web/src/features/procurement/components/ProcurementPage.tsx`
  - `apps/web/src/features/procurement/hooks/**`
  - `apps/web/src/features/procurement/queries/**`
  - `apps/web/src/features/procurement/services/procurementClientService.ts`
  - `apps/web/src/features/procurement/stores/**`
- API + server:
  - `apps/web/src/app/api/procurement/import/context/route.ts` (new, nếu cần cho màn chọn showroom/tham số import)
  - `apps/web/src/app/api/procurement/import/validate/route.ts`
  - `apps/web/src/app/api/procurement/import/commit/route.ts`
  - `apps/web/src/app/api/procurement/import/incomplete/export/route.ts` (new)
  - `apps/web/src/app/api/procurement/template/route.ts`
  - `apps/web/src/server/services/procurementService.ts`
  - `apps/web/src/server/data-access/procurement.ts`
- Product domain integration:
  - `apps/web/src/server/data-access/products.ts`
  - `apps/web/src/types/productsCatalog.ts`
  - `apps/web/src/types/procurement.ts`

## Quy tắc nghiệp vụ bắt buộc
- Xác định sản phẩm cũ/mới theo khóa:
  - `(branch_id, lower(product_code))`.
- Import Excel:
  - Chỉ nhận `.xlsx` (không dùng `csvText` contract nữa).
  - Có endpoint export template `.xlsx`.
  - Trước khi tải template/import, admin chọn showroom (branch) với default = showroom mặc định đang active.
  - Cho phép chọn thêm tham số ngữ cảnh import (ví dụ: category mặc định, trạng thái hàng mặc định, is_rentable/is_saleable mặc định) nếu nghiệp vụ cần.
  - Có validate trước commit, trả lỗi theo `sheet + row + column`.
- Upsert theo `product_code`:
  - Nếu đã tồn tại:
    - cập nhật các field có giá trị mới trong file/form (patch non-empty).
    - field trống giữ nguyên dữ liệu hiện có.
  - Nếu chưa tồn tại:
    - tạo mới product trong cùng branch.
    - bắt buộc tối thiểu: `name`, `quantity`, `unit_cost`.
- Nếu `product_code` bị thiếu:
  - hệ thống tự generate mã mới (đảm bảo unique theo `(branch_id, lower(product_code))`).
  - mã generate phải trả lại trong kết quả import/commit để user trace.
- Quy tắc dữ liệu khi tạo mới:
  - `purchase_price` mặc định lấy từ `unit_cost` nếu không truyền riêng.
  - các field optional khác (category/price/is_rentable/is_saleable/material/gender/description...) map nếu có.
  - nếu truyền `category_code` nhưng không map được thì fail validate dòng đó.
- Flow nhập tay trên form:
  - nhập `product_code` phải hỗ trợ tra cứu cũ/mới tức thời.
  - nếu mã mới: hiển thị block nhập nhanh thông tin tạo mới trước khi thêm dòng nhập hàng.
- Kết quả import/commit:
  - sau khi xử lý phải có summary: `totalRows`, `successRows`, `incompleteRows`.
  - trả danh sách chi tiết row chưa hoàn thành + reason.
  - cho phép export file `.xlsx` chứa toàn bộ row chưa hoàn thành để user tải về và bổ sung rồi import lại.
- Không phá vỡ flow payment `EXPENSE` và cập nhật tồn kho/cost của task 065.

## In-scope
- Thay import/export procurement từ CSV logic sang Excel native.
- Bổ sung validate/upsert sản phẩm cũ-mới theo mã trong cả:
  - form nhập tay,
  - import file Excel.
- Cập nhật DTO/API contract liên quan procurement import để dùng file Excel.
- Bổ sung thông tin preview validate:
  - `resolvedAction`: `UPDATE_EXISTING` | `CREATE_NEW`.
- Bổ sung contract kết quả import:
  - `summary` (total/success/incomplete),
  - `incompleteRows`,
  - `incompleteExportToken` hoặc endpoint để tải file incomplete `.xlsx`.

## Out-of-scope
- OCR chứng từ/hóa đơn từ ảnh/PDF.
- Đồng bộ hai chiều với ERP ngoài hệ thống.
- Merge/split sản phẩm tự động theo AI.

## Prompt gợi ý cho Codex
```text
Mục tiêu: nâng cấp module procurement để hỗ trợ upsert sản phẩm theo product_code và dùng Excel native thay cho CSV.

Yêu cầu:
1) Thay toàn bộ import/export CSV của procurement sang Excel .xlsx (template + validate + commit).
2) Khi nhập hàng, cho phép dòng sản phẩm có product_code chưa tồn tại:
   - nếu code đã có -> update field mới (patch non-empty),
   - nếu code chưa có -> tạo product mới với field bắt buộc.
3) Nếu row không có product_code thì auto-generate mã mới và trả lại trong kết quả.
4) Trước import/template, admin chọn showroom (default = showroom mặc định) + tham số cần thiết khác nếu có.
5) Form nhập tay cũng phải hỗ trợ tra cứu code cũ/mới và tạo nhanh product mới inline.
6) Validate trả lỗi rõ theo sheet/row/column; trả preview action CREATE_NEW/UPDATE_EXISTING.
7) Sau commit phải trả thống kê success/incomplete, liệt kê row lỗi, và cho export lại file `.xlsx` chỉ gồm row chưa hoàn thành.
8) Không regression flow receipt creation, item stock generation, weighted purchase cost, và payment EXPENSE đã có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Không còn `csvText` contract trong procurement import API/UI.
- Export template procurement trả file `.xlsx`.
- Import `.xlsx` validate + commit chạy end-to-end.
- Hỗ trợ upsert product theo `product_code`:
  - update product cũ khi có dữ liệu mới,
  - tạo product mới khi chưa có.
- Row thiếu `product_code` vẫn nhập được nhờ auto-generate mã mới.
- Form nhập tay hỗ trợ mã mới và tạo nhanh sản phẩm.
- Màn import có bước chọn showroom (default showroom mặc định) + tham số ngữ cảnh cần thiết.
- Sau commit hiển thị rõ tổng số row thành công/chưa hoàn thành.
- Có nút export file `.xlsx` gồm các row chưa hoàn thành để nhập lại.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Excel template:
  - chọn showroom, confirm default là showroom mặc định.
  - tải template `.xlsx`,
  - mở điền dữ liệu và import lại thành công.
- Existing product update:
  - dùng `product_code` đã có, thay đổi tên/material/price -> xác nhận product được patch đúng field.
- New product create:
  - dùng `product_code` mới với field bắt buộc -> tạo product mới + tạo receipt thành công.
- Missing product code:
  - để trống `product_code` -> hệ thống tự sinh mã, commit thành công và trả về mã mới.
- Dòng lỗi:
  - thiếu `name` cho mã mới / category_code sai -> báo lỗi đúng `row/column`.
- Incomplete export:
  - sau commit có row fail -> bấm export file incomplete `.xlsx`,
  - mở file thấy đúng các row fail + reason để user bổ sung.
- Regression:
  - payment `EXPENSE` vẫn ghi nhận đúng.
  - stock + purchase price update vẫn đúng sau commit.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 066 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 065 /a - [ ] 066 | Procurement enhancement: product upsert by code (existing/new) + Excel-native import/export (no CSV) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 066 |- [x] 066 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 066
  - Task file: docs/tasks/066_procurement_product_input_upsert_and_excel_native_import.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
