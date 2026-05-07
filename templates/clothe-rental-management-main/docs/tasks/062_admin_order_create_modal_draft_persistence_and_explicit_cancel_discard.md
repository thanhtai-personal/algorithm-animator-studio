# Task 062 - UX form tạo đơn thuê (Admin modal): giữ draft khi đóng ngoài, thêm nút Hủy để đóng và bỏ dữ liệu

## Input ban đầu
- Ở admin dashboard, form tạo đơn thuê đang mở trong modal/drawer.
- Khi người dùng lỡ click ra ngoài (outside click) làm đóng modal, dữ liệu đã nhập bị mất hoàn toàn.
- Hiện chưa có nút `Hủy` rõ ràng ở phần header góc phải để người dùng chủ động đóng form và bỏ dữ liệu.

## Mục tiêu
- Tăng tính an toàn dữ liệu khi nhập form tạo đơn thuê trong modal:
  - nếu modal bị đóng do click outside/ESC thì **không mất dữ liệu draft**,
  - mở lại modal phải thấy lại đúng thông tin vừa nhập để tiếp tục.
- Thêm nút `Hủy` ở góc phải header modal:
  - click `Hủy` thì đóng modal và **xóa toàn bộ draft hiện tại** (không lưu).

## Phụ thuộc
- `docs/tasks/049_orders_create_modal_rental_sale_compact_defaults.md`
- `docs/tasks/059_order_create_step_reorder_items_time_customer.md`
- `docs/tasks/061_order_create_payment_receipt_confirmation_modal_pos_admin.md`

## Mapping màn hình/source
- Create-order modal tại admin orders list:
  - `apps/web/src/features/orders/components/OrdersListPage.tsx`
- Drawer shell:
  - `apps/web/src/components/layout/DrawerFormShell.tsx`
- Order wizard state:
  - `apps/web/src/features/orders/components/OrderWizardPage.tsx`
  - `apps/web/src/features/orders/hooks/useOrderWizardPage.ts`
- (Nếu cần) store tạm cho draft:
  - `apps/web/src/features/orders/stores/ordersStore.ts`

## Quy tắc nghiệp vụ bắt buộc
- Đóng modal bằng outside click hoặc phím `ESC`:
  - chỉ đóng UI,
  - không reset state form đã nhập.
- Mở lại create modal trong cùng phiên thao tác:
  - dữ liệu draft phải còn nguyên.
- Nút `Hủy` ở header (right top):
  - đóng modal,
  - reset toàn bộ dữ liệu form/draft về trạng thái khởi tạo.
- Submit thành công:
  - vẫn reset draft như flow hiện tại (tránh lưu rác).
- Không làm regression các validation/step/payment/receipt-confirm đã có.

## In-scope
- Bổ sung cơ chế lưu draft in-memory cho create-order modal của admin.
- Thêm UI button `Hủy` ở header và wire đúng hành vi discard.
- Phân biệt rõ 2 đường đóng modal:
  - `outside/ESC` = close + keep draft,
  - `Hủy` = close + discard draft.

## Out-of-scope
- Persist draft qua reload trang/browser restart.
- Áp dụng toàn hệ thống cho mọi modal ngoài create-order admin.
- Refactor kiến trúc modal toàn cục vượt phạm vi task này.

## Prompt gợi ý cho Codex
```text
Mục tiêu: cải thiện UX create-order modal ở admin dashboard.

Yêu cầu:
1) Nếu người dùng đóng modal bằng click outside/ESC thì giữ nguyên dữ liệu đã nhập.
2) Mở lại modal phải thấy lại draft vừa nhập.
3) Thêm nút "Hủy" ở góc phải header modal; click vào thì đóng modal và xóa draft.
4) Submit thành công vẫn reset draft như hiện tại.
5) Không regression các flow step/validation/payment/receipt confirm.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Outside click/ESC không làm mất dữ liệu form create-order modal.
- Re-open modal khôi phục đúng draft vừa nhập.
- Có nút `Hủy` ở right top header modal.
- Nút `Hủy` đóng modal và clear draft ngay lập tức.
- Submit thành công vẫn clear draft.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở create modal, nhập customer/items/time/note/payment -> click outside:
  - modal đóng, mở lại vẫn còn dữ liệu.
- Lặp lại với phím `ESC`:
  - dữ liệu vẫn giữ.
- Bấm nút `Hủy` trên header:
  - modal đóng,
  - mở lại form sạch (không còn draft).
- Submit tạo đơn thành công:
  - lần mở mới phải là form sạch.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 062 thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 061 /a - [ ] 062 | Admin order-create modal UX: keep draft on outside-close/ESC + explicit header cancel to discard draft | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 062 |- [x] 062 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 062
  - Task file: docs/tasks/062_admin_order_create_modal_draft_persistence_and_explicit_cancel_discard.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
