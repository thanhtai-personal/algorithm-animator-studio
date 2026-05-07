# Task 017 - i18n Completion + Release Hardening

## Mục tiêu
- Hoàn thiện coding cho i18n VI/EN trên các MVP pages và chuẩn bị release.
- Khóa các rủi ro còn lại (RLS, audit, overlap, regressions).

## Phụ thuộc
- Hoàn thành các task module core trước đó (`004` đến `016`)
- Nếu showroom page khách nằm trong MVP release: hoàn thành thêm `018_customer_showroom_preselection_page.md`

## Tài liệu tham chiếu
- `docs/000_Business_requests.md` (Sections 5, 6, 11, 13)
- `docs/001_wireframe.md` (Sections 12, 13)
- `AGENTS.md` (Completion checklist)

## Prompt gợi ý cho Codex
```text
Mục tiêu: chốt coding production-readiness cho hệ thống (admin dashboard + showroom page khách nếu thuộc MVP), tập trung i18n + hardening + release prep.

Yêu cầu:
1) i18n completion:
   - rà soát MVP pages không còn hard-coded strings
   - bổ sung key groups theo wireframe section 12 (nav/common/orders/inventory/validation/toast)
   - đảm bảo VI/EN switch đầy đủ, fallback hợp lý
   - nếu có `/{locale}/showroom`, include i18n text cho showroom page customer-facing
2) Hardening:
   - rà lại RLS branch/role on critical tables
   - rà anti-overlap race handling
   - rà audit log coverage cho actions quan trọng (sửa giá, huỷ đơn, refund, mark lost/damaged)
3) Tooling/release:
   - finalize lint/typecheck scripts
   - tạo docs runbook setup env + migration + seed + first admin login
4) Nhắc test nhanh (không làm thành QA task riêng):
   - liệt kê checklist test nhanh theo wireframe section 13 (orders/inventory/i18n)
   - nhắc thêm cases auth/anon/offline warning quan trọng từ source base docs
5) Kết quả trả về:
   - findings (ưu tiên bug/risk)
   - patch fixes
   - known gaps deferred phase 2
```

## Config cần chuẩn bị trước khi chạy task
- Danh sách pages/features được xem là MVP release
- Quyết định release environment:
  - Supabase project staging/prod
  - Site URL cho OAuth callback
- Test data seed nội bộ (products/items/customers/orders)
- Người test theo role: staff/manager/admin

## In-scope
- i18n coverage VI/EN cho MVP
- Hardening fixes + release prep docs/scripts
- Runbook/docs release nội bộ

## Out-of-scope
- Phase 2 (checkout online, online payments, PDF chuẩn form, shipping)
- Multi-language ngoài VI/EN
- Full QA/UAT execution plan chi tiết (chỉ để nhắc test nhanh)

## Deliverables mong muốn
- i18n coverage + hardening patches cho MVP
- Docs setup/release/runbook rõ ràng
- Danh sách known gaps phase 2

## Done criteria (coding)
- Không còn key fallback lộ ra UI MVP
- Tất cả pages MVP dùng key i18n VI/EN (không hard-code string nghiệp vụ mới)
- Hardening fixes cho RLS/anti-overlap/audit log đã được patch hoặc ghi rõ backlog
- Runbook đủ để dev khác setup và chạy

## Nhắc test nhanh
- `cd apps/web && npm run lint` (hoặc script lint mới đã chuẩn hóa)
- `cd apps/web && npx tsc --noEmit`
- Manual smoke test theo role + locale (tham chiếu wireframe section 13)
- SQL smoke test trên staging

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Cập nhật progress/tasks.md sau khi hoàn tất coding task và chạy mục Nhắc test nhanh.
- Đánh dấu checklist task này là hoàn thành:
  ~~~bash
  sed -i "s|^- \[ \] 017 |- [x] 017 |" progress/tasks.md
  ~~~
- Ghi log completion (append vào cuối file progress):
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 017
  - Task file: docs/tasks/017_i18n_completion_and_release_hardening.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [nhắc test nhanh đã chạy / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [none / mô tả]
  - Notes: [tóm tắt ngắn]
  PROGRESS_LOG
  ~~~
