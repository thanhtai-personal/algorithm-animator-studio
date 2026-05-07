# Task 060 - Chuẩn hóa màn hình mở ca/kết ca + màn hình admin quản lý ca nhân viên

## Input ban đầu
- Flow mở ca/kết ca hiện có thiên về prompt/action nhanh, chưa thành form chuẩn rõ ràng.
- Khi kết ca, thông tin review ca chưa đủ sâu theo nhu cầu vận hành:
  - tổng số đơn trong ca,
  - danh sách đơn phát sinh trong ca,
  - breakdown số tiền đã nhận/cọc/thuê/bán.
- Chưa có màn hình quản lý ca tập trung cho admin để theo dõi ca làm việc nhân viên.

## Mục tiêu
- Chuẩn hóa UI mở ca thành 1 form riêng gồm:
  - `Số tiền trong két (đầu ca)` (bắt buộc),
  - `Ghi chú` (tùy chọn),
  - button submit để mở ca.
- Chuẩn hóa UI kết ca thành 1 form xác nhận gồm:
  - `Số tiền trong két lúc kết ca` (bắt buộc),
  - summary chỉ số ca,
  - danh sách đơn trong ca để nhân viên review trước khi chốt,
  - button `Xác nhận kết ca`.
- Bổ sung màn hình admin quản lý ca nhân viên (list + detail), hiển thị thông tin mở/kết ca và thời gian mở/kết ca.

## Phụ thuộc
- `docs/tasks/058_pos_shift_open_close_completion.md`
- `docs/tasks/012_payments_module_reconciliation.md`
- `docs/tasks/054_financial_formulas_revenue_profit_standardization.md`
- `docs/tasks/055_revenue_profit_charts_day_month_year_dashboard_reports.md`

## Mapping màn hình/source
- POS shift UI:
  - `apps/web/src/features/sales/components/SalesLayout.tsx`
  - `apps/web/src/features/sales/hooks/useSalesLayout.ts`
  - `apps/web/src/features/sales/components/SalesPosPage.tsx`
- Shift domain/API:
  - `apps/web/src/types/salesDesk.ts`
  - `apps/web/src/server/data-access/salesDesk.ts`
  - `apps/web/src/server/services/salesDeskService.ts`
  - `apps/web/src/app/api/sales/shift/{current,open,close}/route.ts`
  - `apps/web/src/app/api/sales/**` (nếu cần endpoint list/detail ca + đơn trong ca cho admin)
- Admin settings (đề xuất đặt trong settings):
  - `apps/web/src/app/[locale]/(dashboard)/settings/shifts/page.tsx` (new)
  - `apps/web/src/features/settings/components/SettingsShiftsPage.tsx` (new)
  - `apps/web/src/features/settings/hooks/useSettingsShiftsPage.ts` (new)
  - `apps/web/src/features/settings/queries/useSettingsQueries.ts`
  - `apps/web/src/features/settings/services/settingsClientService.ts`

## Quy tắc nghiệp vụ bắt buộc
- Mở ca:
  - yêu cầu `openingCash >= 0`,
  - `note` optional,
  - submit thành công mới chuyển trạng thái sang ca mở.
- Kết ca:
  - yêu cầu `closingCash >= 0`,
  - chỉ cho kết ca khi có ca `OPEN`,
  - trước khi xác nhận phải hiển thị rõ các chỉ số ca + danh sách đơn trong ca.
- Summary kết ca tối thiểu gồm:
  - tổng số đơn trong ca,
  - tổng tiền đã nhận trong ca,
  - tổng tiền cọc trong ca,
  - tổng tiền thuê trong ca,
  - tổng tiền bán trong ca,
  - expected cash / variance theo policy đã có.
- Danh sách đơn trong ca hiển thị tối thiểu:
  - mã đơn, loại đơn, khách hàng, trạng thái, thời gian tạo, tiền liên quan (theo contract hiện hành).
- Button `Xác nhận kết ca` là hành động chốt cuối cùng (có confirm guard nếu variance != 0 theo policy).
- Admin quản lý ca:
  - chỉ role phù hợp (owner_admin/admin; manager nếu policy cho phép),
  - xem được danh sách ca theo branch + staff + thời gian,
  - mở chi tiết ca để xem thông tin mở/kết ca + thời gian mở/kết ca + summary ca.
- Giữ kiến trúc `Component -> Hook -> Query -> Service -> API`.

## In-scope
- Chuyển open/close shift từ prompt rời rạc sang form UI chuẩn, rõ ràng.
- Bổ sung summary + danh sách đơn tại màn hình kết ca trước khi chốt.
- Bổ sung màn hình admin quản lý ca nhân viên (list + detail).
- Chuẩn hóa text/error i18n vi/en cho flow mới.

## Out-of-scope
- Chấm công/payroll theo ca.
- Tích hợp phần cứng (cash drawer, máy in hóa đơn).
- Refactor toàn bộ module settings ngoài phần cần thiết cho trang quản lý ca.

## Prompt gợi ý cho Codex
```text
Mục tiêu: chuẩn hóa màn hình mở ca/kết ca và thêm màn admin quản lý ca nhân viên.

Yêu cầu:
1) Open shift phải là form có openingCash + note + submit mở ca.
2) Close shift phải có closingCash + summary ca + list đơn trong ca + nút "Xác nhận kết ca".
3) Summary phải có: tổng đơn, tiền đã nhận, tiền cọc, tiền thuê, tiền bán, expected cash/variance.
4) Thêm trang admin quản lý ca: list theo branch/staff/time, có chi tiết mở ca-kết ca và timestamp.
5) Giữ nguyên rule lifecycle shift và không regression POS flow hiện có.

Validation commands:
- cd apps/web && npm run typecheck
- cd apps/web && npx eslint [files changed]
```

## Done criteria (coding)
- Mở ca dùng form chuẩn và submit mở ca thành công.
- Kết ca dùng form chuẩn, hiển thị đủ summary + danh sách đơn, có nút `Xác nhận kết ca`.
- Các số liệu tổng hợp trong ca hiển thị đúng theo contract/chính sách đã chốt.
- Có màn admin quản lý ca nhân viên với thông tin mở/kết ca + thời gian mở/kết ca.
- RBAC truy cập admin-shift screen đúng policy.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npx eslint [files changed]` pass.

## Nhắc test nhanh
- Mở ca với opening cash hợp lệ/không hợp lệ.
- Kết ca:
  - kiểm tra hiển thị summary,
  - kiểm tra danh sách đơn trong ca,
  - xác nhận kết ca với variance = 0 và variance != 0.
- Verify số liệu ca khớp dữ liệu order/payment phát sinh trong khung ca.
- Admin:
  - lọc danh sách ca theo branch/staff/ngày,
  - mở chi tiết ca và đối chiếu opening/closing cash + openedAt/closedAt.

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng 060 thì thêm mới:
  ~~~bash
  sed -i '/^- \[ \] 059 /a - [ ] 060 | Standardize shift open/close forms + admin staff-shift management screen (summary + order list) | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \[ \] 060 |- [x] 060 |" progress/tasks.md
  ~~~
- Append log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 060
  - Task file: docs/tasks/060_shift_open_close_ui_standardization_and_admin_shift_management.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  PROGRESS_LOG
  ~~~
