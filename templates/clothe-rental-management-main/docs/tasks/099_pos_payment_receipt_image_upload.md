# Task 099 - POS payment receipt image upload for surcharge/expense

## Mục tiêu
- Bổ sung tính năng tải lên ảnh chứng từ/hóa đơn ngay tại màn hình POS phụ thu/phụ chi.
- Với các khoản chi lớn, chủ cửa hàng có thể kiểm tra từ xa bằng ảnh chụp hóa đơn gắn trực tiếp với payment.

## Input ban đầu
- URL tham chiếu người dùng nêu: `https://www.kata.makeup/vi/pos`
- Nhu cầu: thêm tính năng “Tải lên ảnh chứng từ/hóa đơn” tại POS, đặc biệt hữu ích với các khoản chi lớn.
- Ghi chú: URL public không đọc được trực tiếp trong lượt tạo task này; task bám theo source route POS hiện có trong repo:
  - `apps/web/src/app/[locale]/sales/surcharge-expense/page.tsx`
  - `apps/web/src/features/sales/views/SalesSurchargeExpensePage/SalesSurchargeExpensePage.tsx`

## Phụ thuộc
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/043_media_management_dashboard_and_product_picker.md`
- `docs/tasks/090_pos_surcharge_expense_and_admin_passkey_lock.md`
- `docs/tasks/092_payment_initial_capital_flag_pos_toggle_and_dashboard_capital_procurement_stats.md`
- `docs/tasks/098_bug_admin_payments_mobile_responsive.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`
- `apps/web/src/features/sales/hooks/useSalesSurchargeExpensePage.ts`
- `apps/web/src/features/sales/views/SalesSurchargeExpensePage/SalesSurchargeExpensePage.tsx`
- `apps/web/src/features/sales/queries/useSalesQueries.ts`
- `apps/web/src/features/sales/services/salesClientService.ts`
- `apps/web/src/types/paymentsDomain.ts`
- `apps/server/src/modules/payments/**`
- `apps/server/src/modules/media/**`

## Hiện trạng cần lưu ý
- POS phụ thu/phụ chi hiện tạo manual payment qua `CreatePosManualPaymentPayload`.
- Form hiện có: loại giao dịch, phương thức, số tiền, lý do, ghi chú, `isImportOrder`, `isInitialCapital`.
- Payment DTO hiện có `referenceCode`, nhưng chưa có attachment/chứng từ hình ảnh.
- Media module hiện có upload flow, nhưng product/media library đang thiên về public media. Chứng từ/hóa đơn nên branch-scoped và không public mặc định.

## Config cần chuẩn bị trước khi chạy task
- Chốt storage policy:
  - Ưu tiên private bucket hoặc signed URL cho chứng từ payment.
  - Không đưa ảnh chứng từ vào public product/media library nếu chưa có policy rõ.
- Chốt giới hạn upload:
  - File types: `image/jpeg`, `image/png`, `image/webp`.
  - Max file size đề xuất: `5MB/file`.
  - Max files đề xuất: `3` ảnh/payment.
- Chốt policy khoản chi lớn:
  - MVP: upload optional cho mọi `FEE`/`EXPENSE`, nhưng hiển thị gợi ý mạnh với `EXPENSE`.
  - Nếu cần enforce: thêm setting threshold sau, ví dụ `expenseReceiptRequiredThresholdVnd`.

## Prompt gợi ý cho Codex
```text
Implement POS payment receipt image upload for surcharge/expense.
Use server-owned payment attachment contract and private/branch-scoped storage.
POS UI lets staff attach/capture invoice photos before submit; payment list lets owner/admin view them.
Do not store receipt images in public product media library by default.
Keep Component -> Hook -> Query -> Service -> API and Nest Controller -> Service -> Data-access.
```

## Architecture Impact
- Layers affected:
  - Client component: POS surcharge/expense form, Payments list/detail display.
  - Client hook/query/service: sales manual payment mutation, payments query hydration/invalidation, upload flow.
  - Server API: payments attachment contract and upload/complete endpoints, preferably under `apps/server`.
  - Server data-access: payment attachment metadata and branch-scoped authorization.
  - DB/storage: payment attachment metadata table and private/signed storage path.
- Domain affected:
  - payments
  - sales/POS surcharge-expense
  - media/storage security
  - audit/reconciliation
- App(s) affected:
  - `apps/web`
  - `apps/server`

## Current State vs Target State
- Current:
  - POS phụ thu/phụ chi chỉ lưu payment text fields; chủ cửa hàng không có ảnh hóa đơn để kiểm tra từ xa.
  - Payment list không expose chứng từ ảnh.
  - Chưa có contract payment attachment riêng.
- Target (Architecture V2):
  - Staff có thể chụp/tải ảnh chứng từ khi tạo POS `FEE`/`EXPENSE`.
  - Payment record liên kết với 0..n ảnh chứng từ branch-scoped.
  - Owner/admin/manager xem ảnh chứng từ từ Payments list/detail theo quyền hiện có.
  - Backend `apps/server` là source-of-truth cho attachment metadata, authorization và signed access.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Server flow: `Controller -> Application Service -> Data-access/Repository -> Supabase`.
  - Chỉ `apps/server` truy cập Supabase DB.
  - Attachment metadata phải branch-scoped và gắn với `paymentId`.
  - Upload/preview phải tôn trọng RBAC hiện có của payments.
  - Payment creation và attachment linking phải có rollback/cleanup strategy nếu một bước fail.
- Forbidden:
  - Không thêm business endpoint mới chỉ ở `apps/web/src/app/api/**` nếu payments/media đã ở Nest.
  - Không lưu ảnh chứng từ nhạy cảm vào public product media library nếu chưa có policy.
  - Không expose public URL không giới hạn cho chứng từ payment.
  - Không duplicate validation upload ở cả UI và backend theo 2 rule khác nhau.

## Compatibility & Migration Strategy
- Compatibility window:
  - Payment payload cũ không có attachments vẫn hợp lệ.
  - Payment list cũ fallback `attachments=[]`.
  - Có thể triển khai theo 2 phase:
    1. DB/API attachment metadata + upload flow.
    2. POS form + Payments list viewer.
- Deprecation/removal plan:
  - Không có deprecation nếu là field/table mới backward-compatible.
- Rollback condition:
  - Nếu upload/linking lỗi gây fail tạo payment hàng loạt, tạm disable receipt upload UI nhưng vẫn giữ create payment không attachment.
  - Nếu signed URL policy sai quyền, rollback viewer trước, không expose public access.

## In-scope
- DB/schema:
  - Thêm bảng metadata, ví dụ `payment_attachments`:
    - `id`, `payment_id`, `branch_id`, `bucket`, `storage_path`, `mime_type`, `size_bytes`, `original_file_name`, `uploaded_by_profile_id`, `created_at`, `deleted_at`.
  - Index theo `payment_id`, `branch_id`, `created_at`.
  - RLS/authorization hoặc server-side guard theo branch/payment access.
- Storage/upload:
  - Tạo private/signed upload path cho chứng từ payment.
  - Validate MIME/size/count ở backend.
  - Cleanup orphan upload nếu payment create/link fail.
- Payments API:
  - Extend `PaymentListItemDto` hoặc thêm attachment summary:
    - `attachmentCount`
    - `attachments` khi detail/list policy cho phép.
  - Create POS manual payment hỗ trợ attachment session ids hoặc upload-complete ids.
  - Endpoint xem/download dùng signed URL ngắn hạn.
- POS UI:
  - Thêm control “Tải ảnh chứng từ/hóa đơn” tại `SalesSurchargeExpensePage`.
  - Hỗ trợ chọn file/camera capture trên mobile (`accept="image/*"`, `capture` nếu phù hợp).
  - Hiển thị thumbnail, tên file, dung lượng, nút xóa trước submit.
  - Với `EXPENSE`, hiển thị hint: “Nên tải hóa đơn cho khoản chi lớn để chủ cửa hàng kiểm tra từ xa.”
- Payments UI:
  - Payment list hiển thị badge số chứng từ.
  - Drawer/detail hoặc modal viewer để owner/admin/manager xem ảnh chứng từ.
  - CSV export có thể thêm `attachment_count`, không cần export ảnh.
- Audit:
  - Ghi audit event khi tạo payment có attachment và khi xóa attachment nếu scope có delete.

## Out-of-scope
- OCR đọc hóa đơn tự động.
- Ký số/chứng thực hóa đơn điện tử.
- Multi-step procurement invoice document management.
- Bắt buộc mọi khoản chi phải có hóa đơn theo setting phức tạp; MVP chỉ optional + hint.
- Lưu ảnh chứng từ vào public homepage/product media gallery.

## Deliverables mong muốn
- POS phụ thu/phụ chi upload được ảnh chứng từ trước khi submit payment.
- Payment record lưu attachment metadata branch-scoped.
- Payments list/viewer cho phép chủ cửa hàng kiểm tra ảnh chứng từ từ xa.
- API/storage policy không expose ảnh chứng từ public ngoài quyền.
- Regression notes rõ cho payments/POS/dashboard.

## Done criteria (coding)
- POS `FEE`/`EXPENSE` tạo payment thành công khi không có attachment.
- POS `EXPENSE` tạo payment thành công với 1..3 ảnh chứng từ.
- File sai type/quá size bị reject với lỗi rõ.
- Payment list hiển thị attachment badge/count.
- User có quyền xem payment cùng branch xem được ảnh bằng signed URL.
- User khác branch hoặc thiếu quyền không xem được attachment.
- Nếu submit payment fail, upload session/attachment orphan được cleanup hoặc đánh dấu expired.
- `cd apps/server && npm run build` pass.
- `cd apps/server && npm run lint` pass hoặc targeted eslint pass kèm known gaps.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass hoặc targeted eslint pass kèm known gaps.

## Done Criteria (Architecture)
- [ ] Không thêm business endpoint mới vào `apps/web/app/api` khi payments/media đã ở Nest.
- [ ] Không thêm truy cập Supabase DB ở runtime ngoài `apps/server`.
- [ ] Không phá client layering `Component -> Hook -> Query -> Service -> API`.
- [ ] Không phá server layering `Controller -> Service -> Data-access -> Supabase`.
- [ ] Attachment metadata branch-scoped và quyền xem/xóa được enforce server-side.
- [ ] Payment payload cũ vẫn backward-compatible.
- [ ] Có migration/storage policy note rõ.
- [ ] Progress log có `Token usage`.

## Regression Scope
- [ ] POS phụ thu không attachment.
- [ ] POS phụ chi không attachment.
- [ ] POS phụ chi có ảnh hóa đơn.
- [ ] POS mobile camera/file picker.
- [ ] Payment list filter/date/type/method vẫn hoạt động.
- [ ] Payment edit/status void/repost không làm mất attachment.
- [ ] Owner/admin/manager xem attachment cùng branch.
- [ ] Staff permission xem/upload đúng policy.
- [ ] Cross-branch access bị chặn.
- [ ] Dashboard/reports không đổi số liệu vì attachment-only field.

## Nhắc test nhanh
- Manual:
  - Mở `/vi/sales/surcharge-expense` hoặc route POS tương ứng.
  - Tạo `EXPENSE` với 0 ảnh, 1 ảnh, 3 ảnh.
  - Thử ảnh quá size và file không phải image.
  - Mở `/vi/payments`, kiểm tra attachment badge và viewer.
  - Test user cùng branch/khác branch nếu có account test.
- Commands:
  - `cd apps/server && npm run build`
  - `cd apps/server && npm run lint`
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npm run lint`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `099` thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 098 /a - [ ] 099 | POS payment receipt image upload for surcharge/expense | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 099 |- [x] 099 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 099
  - Task file: docs/tasks/099_pos_payment_receipt_image_upload.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  - Token usage: input=<n>, output=<n>, total=<n>
  PROGRESS_LOG
  ~~~
