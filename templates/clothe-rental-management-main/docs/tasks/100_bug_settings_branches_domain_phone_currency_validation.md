# Task 100 - Bug: Settings Branches domain, phone, and currency validation

## Mục tiêu
- Fix các rủi ro kỹ thuật tại màn hình Settings Branches (`/{locale}/settings/branches`):
  - Chặn public domain/shop domain trùng route hệ thống bằng blacklist backend source-of-truth.
  - Validate số điện thoại chi nhánh theo định dạng Việt Nam.
  - Chuẩn hóa currency code và ghi rõ hướng mở rộng tỷ giá cho chi nhánh quốc tế.

## Input ban đầu
- URL người dùng báo: `https://www.kata.makeup/vi/settings/branches`
- Rủi ro domain:
  - Nếu nhân viên đặt domain là `admin`, `settings`, `products`, ... có thể làm hỏng logic điều hướng public website.
  - Backend nên có blacklist từ khóa cấm và chặn ngay khi nhấn `Lưu`.
- Rủi ro phone:
  - Ô SĐT đang là văn bản tự do, ví dụ `0393545364`.
  - Cần validator số điện thoại Việt Nam để chuẩn bị gửi SMS thông báo đơn hàng.
- Currency:
  - Hiện default là `VND`.
  - Cần bảo đảm hệ thống có hướng mở rộng chi nhánh nước ngoài/tỷ giá theo cấu hình currency.

## Phụ thuộc
- `docs/tasks/016_settings_users_roles_general.md`
- `docs/tasks/038_showroom_management_slug_default_routing.md`
- `docs/tasks/076_branch_public_product_site_by_branch.md`
- `docs/tasks/078_branch_public_domain_path_routing_and_shop_domain_cutover.md`
- `docs/tasks/087_product_landing_theme_responsive_hardening.md`

## Tài liệu tham chiếu
- `.mcp.full.md`
- `docs/architecture/000_architecture_index.md`
- `docs/architecture/010_optimized_target_architecture.md`
- `docs/architecture/011_task_architecture_compliance_standard.md`
- `docs/tasks/000_task_structure_standard.md`
- `docs/tasks/000_task_token_efficiency_standard.md`
- `apps/web/src/features/settings/hooks/useSettingsBranchesPage.ts`
- `apps/web/src/features/settings/views/SettingsBranchesPage/SettingsBranchesPage.tsx`
- `apps/web/src/features/settings/queries/useSettingsQueries.ts`
- `apps/web/src/features/settings/services/settingsClientService.ts`
- `apps/web/src/types/settingsModule.ts`
- `apps/server/src/modules/settings/settings-service/settings.service.ts`
- `apps/server/src/modules/settings/settings-service/helpers-mutations.ts`
- `apps/server/src/modules/settings/infrastructure/settings.data-access.impl.ts`

## Hiện trạng cần lưu ý
- Branches page hiện gửi `shopDomain`, `phone`, `currencyCode` trực tiếp từ input text.
- Backend đã có reserved route helper trong settings data-access, nhưng task cần bảo đảm:
  - dùng chung cho create/update/check-shop-domain;
  - blacklist đủ route hệ thống hiện tại và dễ mở rộng;
  - lỗi trả về rõ ràng để UI hiển thị đúng trước/sau submit.
- General settings page đã có flow kiểm tra shop domain; Branches page chưa có UX check tương đương.
- `normalizeCurrencyCode` hiện chỉ kiểm tra tối thiểu độ dài >= 3; cần chặt hơn.

## Config cần chuẩn bị trước khi chạy task
- Blacklist route hệ thống đề xuất tối thiểu:
  - `api`, `auth`, `admin`, `b`, `booking`, `calendar`, `categories`, `customers`, `dashboard`, `inventory`, `makeup`, `media`, `orders`, `payments`, `pos`, `procurement`, `product`, `products`, `reports`, `sales`, `search`, `settings`, `showroom`, `shifts`, `users`, `offline`.
- Phone VN:
  - Accept display input: `0393545364`, `+84393545364`, `84 393 545 364`, khoảng trắng/dấu `.`/`-` nếu normalize được.
  - Store normalized recommendation: `+84393545364` hoặc thống nhất existing DB policy nếu đang lưu local `0xxxxxxxxx`.
  - Reject: chữ cái, số quá ngắn/dài, prefix không hợp lệ.
- Currency:
  - MVP allow-list: `VND` trước, hoặc ISO-4217 allow-list nhỏ nếu business đã cần quốc tế (`VND`, `USD`, `EUR`, ...).
  - Nếu chỉ hỗ trợ `VND`, UI phải khóa/select thay vì text tự do và có note rõ out-of-scope cho FX.

## Prompt gợi ý cho Codex
```text
Fix Settings Branches validation for shopDomain, Vietnamese phone, and currency.
Backend must own reserved route blacklist and reject create/update/check-shop-domain.
UI should pre-validate and show clear localized errors, but server remains source-of-truth.
Keep settings flow Component -> Hook -> Query -> Service -> API and Nest Controller -> Service -> Data-access.
```

## Architecture Impact
- Layers affected:
  - Client component: Settings Branches form fields, validation hints, error rendering.
  - Client hook/query/service: branch create/update/check-shop-domain orchestration.
  - Server application/data-access: settings branch payload validation and reserved route/domain policy.
  - DB: no required schema change for validation-only fix.
- Domain affected:
  - settings/branches
  - public branch routing/shop domain
  - future SMS phone readiness
  - future multi-currency readiness
- App(s) affected:
  - `apps/web`
  - `apps/server`

## Current State vs Target State
- Current:
  - Branches page accepts free-text shop domain/phone/currency and relies on late backend normalization.
  - Reserved route protection is not clearly surfaced in Branches create/update UX.
  - Phone format can be stored inconsistently, blocking future SMS integration.
  - Currency is free text and only lightly normalized.
- Target (Architecture V2):
  - Backend has one authoritative branch public domain blacklist used by create/update/check-shop-domain.
  - Branches UI validates early and blocks submit with localized messages, while backend remains final authority.
  - Phone is normalized/validated consistently for VN format.
  - Currency is constrained to supported ISO-4217 codes, with explicit FX future task note instead of implicit unsupported behavior.

## Boundary Rules
- Must keep:
  - Client flow: `Component -> Hook -> Query -> Service -> API`.
  - Server flow: `Controller -> Application Service -> Data-access -> Supabase`.
  - Only `apps/server` can query Supabase DB.
  - Reserved route blacklist is source-of-truth on backend; UI can mirror for instant feedback only.
  - Branch manager can only update allowed branch fields per existing RBAC.
- Forbidden:
  - Do not add settings business endpoint only in `apps/web/src/app/api/**`.
  - Do not rely only on frontend validation for blacklist/phone/currency.
  - Do not silently coerce invalid shop domains into valid but unexpected route names.
  - Do not broaden branch/settings permissions.

## Compatibility & Migration Strategy
- Compatibility window:
  - Existing branch rows remain readable.
  - For existing invalid `shop_domain` rows, list should render but update should force correction or surface warning.
  - Existing phone values can be displayed as-is, but saving should normalize/validate.
- Deprecation/removal plan:
  - No endpoint deprecation.
  - If any client still uses legacy web API, it must forward to Nest settings contract or preserve identical validation.
- Rollback condition:
  - Rollback if valid existing branch domains are incorrectly blocked or manager branch domain update is broken.
  - Rollback phone enforcement only if it blocks known valid Vietnamese shop numbers after normalization.

## In-scope
- Backend domain blacklist:
  - Centralize reserved public branch route segments in a reusable helper/constant.
  - Include `admin`, `pos`, `categories`, `shifts`, `users`, `offline` in addition to current route set.
  - Enforce on:
    - create branch,
    - update branch,
    - check-shop-domain endpoint.
  - Return stable error code/message context, e.g. `INVALID_SHOP_DOMAIN` with `reason=reserved-route`.
- Shop domain validation UX:
  - Branches page create/update validates normalized candidate before mutation.
  - Show localized reserved/duplicate/invalid messages.
  - Optional: add “Kiểm tra domain” action per row or debounce check before save, without request-per-keystroke.
- Phone validation:
  - Add shared server validator for Vietnamese phone numbers.
  - Normalize accepted VN phone formats consistently.
  - Add UI helper/error for create/update branch phone field.
  - Keep phone optional if business currently allows branch without phone.
- Currency validation:
  - Replace text input with select or guarded uppercase ISO-4217 input.
  - Backend validates exact 3-letter ISO uppercase and allow-list if configured.
  - If only `VND` supported now, explicitly prevent unsupported currency save and add note for future FX task.
- Regression documentation:
  - Record known behavior for existing invalid records and future FX handling.

## Out-of-scope
- Implementing FX rate provider or automatic currency conversion.
- SMS sending integration.
- Public domain DNS ownership verification.
- Migrating existing bad branch data automatically without approval.
- Redesigning all Settings tabs.

## Deliverables mong muốn
- Backend validation hardening in `apps/server/src/modules/settings/**`.
- Branches page UX messages and controls in `apps/web/src/features/settings/**`.
- Stable error handling for reserved route, invalid phone, invalid currency.
- Task summary/regression notes for route collision, phone, currency.

## Done criteria (coding)
- Saving `shopDomain=admin`, `settings`, `products`, `pos`, or any blacklisted route is rejected on backend.
- `check-shop-domain` returns unavailable/reserved for blacklisted domains.
- Branches page blocks or clearly reports reserved/invalid/duplicate domain before or at save.
- Phone accepts valid VN values such as `0393545364` and `+84393545364` after normalization.
- Phone rejects invalid free text and impossible length/prefix.
- Currency cannot be saved as arbitrary text such as `VNDD` or `ABC`.
- Existing valid branch create/update still works for owner_admin/admin.
- Manager can still update allowed branch public domain only.
- `cd apps/server && npm run build` pass.
- `cd apps/server && npm run lint` pass or targeted eslint pass with known gaps.
- `cd apps/web && npm run typecheck` pass.
- `cd apps/web && npm run lint` pass or targeted eslint pass with known gaps.

## Done Criteria (Architecture)
- [ ] No new settings business endpoint is added only under `apps/web/app/api`.
- [ ] No Supabase DB access is added outside `apps/server`.
- [ ] Client layering stays `Component -> Hook -> Query -> Service -> API`.
- [ ] Server layering stays `Controller -> Service -> Data-access -> Supabase`.
- [ ] Reserved route, phone, and currency validation are enforced server-side.
- [ ] RBAC for branch create/update is unchanged or stricter.
- [ ] Progress log has `Token usage`.

## Regression Scope
- [ ] Create branch with valid shop domain/phone/currency.
- [ ] Create branch with reserved shop domain: `admin`, `settings`, `products`, `pos`.
- [ ] Update existing branch to reserved shop domain.
- [ ] Manager updates own branch shop domain.
- [ ] Manager cannot update forbidden branch fields.
- [ ] Duplicate shop domain still rejected.
- [ ] Phone valid local VN format `0393545364`.
- [ ] Phone valid E.164 VN format `+84393545364`.
- [ ] Phone invalid text rejected.
- [ ] Currency invalid text rejected.
- [ ] Public route `/{locale}/{shopDomain}/...` still resolves valid branch domains.

## Nhắc test nhanh
- Manual:
  - Open `/vi/settings/branches`.
  - Try save domain `admin`, `settings`, `products`, `pos`.
  - Try valid domain unique to a branch.
  - Try phone `0393545364`, `+84393545364`, `abc123`.
  - Try currency `VND`, `VNDD`, `ABC`.
- Commands:
  - `cd apps/server && npm run build`
  - `cd apps/server && npm run lint`
  - `cd apps/web && npm run typecheck`
  - `cd apps/web && npm run lint`

## Cập nhật tiến độ (bắt buộc sau khi hoàn thành task)
- Nếu checklist chưa có dòng `100` thì thêm mới:
  ~~~bash
  sed -i '/^- \[.\] 099 /a - [ ] 100 | Bug Settings Branches domain, phone, and currency validation | status=todo | owner=[name] | started=[YYYY-MM-DD] | done=[YYYY-MM-DD]' progress/tasks.md
  ~~~
- Đánh dấu checklist:
  ~~~bash
  sed -i "s|^- \\[ \\] 100 |- [x] 100 |" progress/tasks.md
  ~~~
- Append completion log:
  ~~~bash
  cat >> progress/tasks.md <<PROGRESS_LOG

  ### $(date +%F) - Task 100
  - Task file: docs/tasks/100_bug_settings_branches_domain_phone_currency_validation.md
  - Status: done
  - Commit: [commit-hash-or-n/a]
  - Test reminder result: [đã chạy lệnh nào / kết quả chính]
  - Main files changed: [path1], [path2]
  - Known gaps: [nếu có]
  - Token usage: input=<n>, output=<n>, total=<n>
  PROGRESS_LOG
  ~~~
