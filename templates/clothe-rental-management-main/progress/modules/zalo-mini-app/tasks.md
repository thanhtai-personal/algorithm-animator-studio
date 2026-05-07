# Tiến Độ Module: Zalo Mini App

## Cách dùng
- Sau khi hoàn thành coding task trong `docs/tasks/modules/zalo-mini-app`, cập nhật checklist và append 1 log entry vào file này.
- Giữ format log đồng nhất với `progress/tasks.md`.
- Không xóa log cũ; chỉ append để giữ lịch sử.

## Checklist
- [x] Modules/Zalo-Mini-App/001 | Zalo Mini App foundation: kiến trúc tích hợp + bootstrap app | status=done | owner=[codex] | started=[2026-03-13] | done=[2026-03-13]
- [x] Modules/Zalo-Mini-App/002 | Zalo Mini App auth: consent scope + profile mapping + session an toàn | status=done | owner=[codex] | started=[2026-03-13] | done=[2026-03-13]
- [x] Modules/Zalo-Mini-App/003 | Zalo Mini App commerce flow: catalog + cart + order draft + OA support | status=done | owner=[codex] | started=[2026-03-13] | done=[2026-03-13]
- [x] Modules/Zalo-Mini-App/004 | Zalo Mini App checkout: payment flow + callback + reconciliation | status=done | owner=[codex] | started=[2026-03-13] | done=[2026-03-13]
- [x] Modules/Zalo-Mini-App/005 | Zalo Mini App vận hành production: webhook, security, monitoring, release | status=done | owner=[codex] | started=[2026-03-13] | done=[2026-03-13]
- [x] Modules/Zalo-Mini-App/006 | Clone màn hình đặt lịch makeup từ web product page sang mini app kata-booking | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]
- [x] Modules/Zalo-Mini-App/007 | iOS viewport hardening: chống tràn view iPhone 13 + vùng đóng modal an toàn | status=done | owner=[codex] | started=[2026-03-18] | done=[2026-03-18]
- [x] Modules/Zalo-Mini-App/008 | Chuẩn hóa tương tác kata-calendar: click ngày -> modal lịch ngày -> detail booking | status=done | owner=[codex] | started=[2026-03-18] | done=[2026-03-18]
- [x] Modules/Zalo-Mini-App/009 | Hai Zalo Mini Apps mới cho thuê đồ: staff tạo đơn thuê/bán + admin xem doanh thu thuê đồ, voice input an toàn trên iOS | status=done | owner=[codex] | started=[2026-03-26] | done=[2026-03-26]
- [x] Modules/Zalo-Mini-App/010 | Kata rental-order: 1 mic button ở footer giữa 2 nút, voice quick-fill theo `tên field + nội dung`, bỏ mic ở từng input | status=done | owner=[codex] | started=[2026-03-31] | done=[2026-03-31]
- [x] Modules/Zalo-Mini-App/011 | Kata rental-order: hoàn thiện voice input nhận đúng field + parse date/time + chặn reset data khi cập nhật từ voice | status=done | owner=[codex] | started=[2026-03-31] | done=[2026-03-31]
- [x] Modules/Zalo-Mini-App/012 | Kata rental-order: thêm page đơn active + chuyển trạng thái đơn thuê + bottom navigator 2 page | status=done | owner=[codex] | started=[2026-04-13] | done=[2026-04-13]

## Completion Log
<!-- Append logs below this line. -->

### 2026-03-13 - Modules/Zalo-Mini-App/001
- Task file: docs/tasks/modules/zalo-mini-app/001_zalo_mini_app_foundation_and_platform_bootstrap.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-app && npm run lint: pass; cd apps/zalo-mini-app && npm run build: pass]
- Main files changed: [apps/zalo-mini-app/package.json], [apps/zalo-mini-app/src/features/platform/services/zaloSdkService.ts], [apps/zalo-mini-app/src/features/platform/queries/useZaloPlatformQueries.ts], [apps/zalo-mini-app/src/features/platform/hooks/useZaloPlatformBootstrap.ts], [docs/guides/zalo_mini_app_integration_strategy.md]
- Known gaps: [SDK APIs đang chạy mock fallback khi không ở runtime Zalo thật; chưa có QA trên device Zalo production]

### 2026-03-13 - Modules/Zalo-Mini-App/002
- Task file: docs/tasks/modules/zalo-mini-app/002_zalo_mini_app_auth_scope_profile_mapping_and_session.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (zalo/settings files): pass]
- Main files changed: [apps/web/sql/034_zalo_mini_app_core.sql], [apps/web/src/server/data-access/zaloMiniAppAuth.ts], [apps/web/src/server/services/zaloMiniAppAuthService.ts], [apps/web/src/app/api/zalo-mini-app/auth/session/route.ts], [apps/zalo-mini-app/src/features/auth/{services,queries,hooks,stores}/]
- Known gaps: [Token verify với Open API Zalo thật chưa tích hợp trong turn này; hiện dùng contract session backend nội bộ + validate cơ bản]

### 2026-03-13 - Modules/Zalo-Mini-App/003
- Task file: docs/tasks/modules/zalo-mini-app/003_zalo_mini_app_catalog_order_draft_and_oa_support.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-app && npm run lint: pass; cd apps/web && npm run typecheck: pass]
- Main files changed: [apps/web/src/server/data-access/zaloMiniAppCommerce.ts], [apps/web/src/server/services/zaloMiniAppCommerceService.ts], [apps/web/src/app/api/zalo-mini-app/orders/draft/route.ts], [apps/zalo-mini-app/src/features/products/**], [apps/zalo-mini-app/src/features/cart/**], [apps/zalo-mini-app/src/features/orders/**], [apps/zalo-mini-app/src/features/support/**]
- Known gaps: [Catalog mini app hiện dùng endpoint showroom list chung; chưa thêm phân trang/filter UI nâng cao]

### 2026-03-13 - Modules/Zalo-Mini-App/004
- Task file: docs/tasks/modules/zalo-mini-app/004_zalo_mini_app_checkout_payment_and_reconciliation.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (zalo/settings files): pass; cd apps/zalo-mini-app && npm run build: pass]
- Main files changed: [apps/web/src/server/data-access/zaloMiniAppPayment.ts], [apps/web/src/server/services/zaloMiniAppPaymentService.ts], [apps/web/src/app/api/zalo-mini-app/payment/{create-order,callback,check-transaction}/route.ts], [apps/zalo-mini-app/src/features/checkout/**]
- Known gaps: [Chưa wiring trực tiếp vào orders/payments ledger module hiện tại (đang giữ transaction + draft state trong bảng module riêng cho MVP)]

### 2026-03-13 - Modules/Zalo-Mini-App/005
- Task file: docs/tasks/modules/zalo-mini-app/005_zalo_mini_app_webhook_security_monitoring_and_release.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (zalo/settings files): pass]
- Main files changed: [apps/web/src/server/config/zaloMiniAppConfig.ts], [apps/web/src/server/data-access/zaloMiniAppWebhook.ts], [apps/web/src/server/services/zaloMiniAppWebhookService.ts], [apps/web/src/app/api/zalo-mini-app/webhooks/route.ts], [docs/guides/zalo_mini_app_ops_runbook.md], [apps/web/.env.example], [apps/web/sql/README.md]
- Known gaps: [Chưa gắn telemetry Sentry/dashboard metrics chuyên biệt cho mini app trong turn này]

### 2026-03-14 - Modules/Zalo-Mini-App/006
- Task file: docs/tasks/modules/zalo-mini-app/006_zalo_mini_app_makeup_booking_clone_from_web_product_page.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-booking && npm run lint: pass; npm run typecheck: pass; npm run build: pass; cd apps/web && npm run typecheck: pass]
- Main files changed: [apps/zalo-mini-apps/kata-booking/src/features/makeup/**], [apps/zalo-mini-apps/kata-booking/src/App.tsx], [apps/zalo-mini-apps/kata-booking/src/styles.css], [apps/web/src/app/api/makeup/events/route.ts], [apps/web/src/app/api/makeup/events/parse/route.ts]
- Known gaps: [Chưa port full voice input pipeline từ web sang mini app; calendar đang hiển thị các booking tạo trong phiên mini app]

### 2026-03-18 - Modules/Zalo-Mini-App/007
- Task file: docs/tasks/modules/zalo-mini-app/007_zalo_mini_apps_ios_view_overflow_and_modal_close_safe_area.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-calendar && npm run lint: pass; npm run typecheck: pass; cd apps/zalo-mini-apps/kata-booking && npm run lint: pass; npm run typecheck: pass]
- Main files changed: [apps/zalo-mini-apps/kata-calendar/src/styles.css], [apps/zalo-mini-apps/kata-booking/src/styles.css]
- Known gaps: [Chưa xác thực thủ công trên runtime Zalo Mini App iPhone 13 thật trong turn này]

### 2026-03-18 - Modules/Zalo-Mini-App/008
- Task file: docs/tasks/modules/zalo-mini-app/008_zalo_mini_app_kata_calendar_day_modal_detail_flow_standardization.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-calendar && npm run lint: pass; npm run typecheck: pass; npm run build: pass]
- Main files changed: [apps/zalo-mini-apps/kata-calendar/src/features/calendar/components/ZaloCalendarSection.tsx], [apps/zalo-mini-apps/kata-calendar/src/features/calendar/hooks/useZaloMiniAppCalendar.ts]
- Known gaps: [Chưa có automated UI test cho chuỗi interaction month-cell -> day-modal -> detail-modal]

### 2026-03-26 - Modules/Zalo-Mini-App/009
- Task file: docs/tasks/modules/zalo-mini-app/009_zalo_mini_apps_rental_order_and_rental_revenue_voice_ios_safe.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck: pass; cd apps/zalo-mini-apps/kata-rental-order && npm run lint: pass; cd apps/zalo-mini-apps/kata-rental-revenue && npm run typecheck: pass; cd apps/zalo-mini-apps/kata-rental-revenue && npm run lint: pass; build hai mini app: blocked bởi môi trường npm/rollup trong WSL mounted workspace]
- Main files changed: [apps/web/src/server/data-access/zaloMiniAppRental.ts], [apps/web/src/server/services/zaloMiniAppRentalService.ts], [apps/web/src/app/api/zalo-mini-app/rental/**], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/**], [apps/zalo-mini-apps/kata-rental-order/src/lib/contracts.ts], [apps/zalo-mini-apps/kata-rental-revenue/src/features/rental-revenue/**], [apps/zalo-mini-apps/kata-rental-revenue/src/lib/contracts.ts]
- Known gaps: [Chưa QA trên Zalo iOS runtime thật; build sau khi reinstall dependency trong WSL gặp lỗi npm nội bộ `Exit handler never called!`, nên chưa chốt được bundle output cuối cùng]

### 2026-03-31 - Modules/Zalo-Mini-App/010
- Task file: docs/tasks/modules/zalo-mini-app/010_kata_rental_order_single_voice_quick_fill_button.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-rental-order && npm run lint: pass; cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck: pass]
- Main files changed: [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/components/RentalOrderSection.tsx], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/hooks/useRentalOrderPage.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/stores/rentalOrderStore.ts], [apps/zalo-mini-apps/kata-rental-order/src/styles.css], [docs/tasks/modules/zalo-mini-app/010_kata_rental_order_single_voice_quick_fill_button.md]
- Known gaps: [Chưa QA thủ công trên runtime Zalo iOS/Android thật cho luồng single mic nhiều lượt nhập]

### 2026-03-31 - Modules/Zalo-Mini-App/011
- Task file: docs/tasks/modules/zalo-mini-app/011_kata_rental_order_voice_input_field_accuracy_and_no_reset.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-rental-order && npm run lint: pass; cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck: pass]
- Main files changed: [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/hooks/useRentalOrderPage.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/stores/rentalOrderStore.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/components/RentalOrderSection.tsx], [apps/zalo-mini-apps/kata-rental-order/src/styles.css], [docs/tasks/modules/zalo-mini-app/011_kata_rental_order_voice_input_field_accuracy_and_no_reset.md], [progress/modules/zalo-mini-app/tasks.md]
- Known gaps: [Chưa QA end-to-end trên Zalo runtime thật cho toàn bộ mẫu câu date/time tiếng Việt đa biến thể]
### 2026-04-13 - Modules/Zalo-Mini-App/012
- Task file: docs/tasks/modules/zalo-mini-app/012_kata_rental_order_active_orders_status_transition_and_bottom_navigation.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/zalo-mini-apps/kata-rental-order && npm run lint: pass; cd apps/zalo-mini-apps/kata-rental-order && npm run typecheck: pass]
- Main files changed: [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/components/ActiveOrdersPage.tsx], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/components/RentalOrderSection.tsx], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/hooks/useRentalOrderPage.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/queries/useRentalOrderQueries.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/services/rentalOrderApiService.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/rental-order/stores/rentalOrderStore.ts], [apps/zalo-mini-apps/kata-rental-order/src/features/platform/components/ZaloPlatformGate.tsx], [apps/zalo-mini-apps/kata-rental-order/src/lib/contracts.ts], [progress/modules/zalo-mini-app/tasks.md]
- Known gaps: [None identified; typecheck and lint pass after implementation.]