# Tiến Độ Module: Makeup

## Cách dùng
- Sau khi hoàn thành coding task trong `docs/tasks/modules/makeup`, cập nhật checklist và append 1 log entry vào file này.
- Giữ format log đồng nhất với `progress/tasks.md`.
- Không xóa log cũ; chỉ append để giữ lịch sử.

## Checklist
- [x] Modules/Makeup/001 | Nền tảng module Makeup: toggle admin + RBAC + schema domain | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/002 | Booking lịch Makeup: cảnh báo trùng lịch mềm + cho phép override lưu | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/003 | Lịch chuyên gia Makeup + màu cảnh báo ngày trùng lịch | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/004 | Admin: danh sách chuyên viên makeup + lịch theo từng chuyên viên | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/005 | Gói makeup: admin + chuyên viên tạo/setup | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/006 | Thống kê makeup: chuyên viên xem riêng + admin dashboard tách nhóm module | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/007 | Product page makeup booking: single-input voice/text parse + 80min per person + time-range conflict warning + confirm form + month-view calendar booking timeline | status=done | owner=[codex] | started=[2026-03-12] | done=[2026-03-12]
- [x] Modules/Makeup/008 | Admin makeup tabs shell: overview/calendar/inventory/orders + default mở lịch makeup | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]
- [x] Modules/Makeup/009 | Admin makeup overview: KPI đơn makeup + hóa đơn nhập hàng + chart doanh thu/cost/profit | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]
- [x] Modules/Makeup/010 | Admin makeup inventory: danh sách hàng makeup + link Shopee + mapping package/artist | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]
- [x] Modules/Makeup/011 | Admin makeup orders: CRUD đơn makeup + đơn nhập hàng makeup (purchase invoices) | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]
- [x] Modules/Makeup/012 | Makeup module isolation guard: kiểm tra tách biệt hoàn toàn với module thuê đồ | status=done | owner=[codex] | started=[2026-03-14] | done=[2026-03-14]

## Completion Log
<!-- Append logs below this line. -->

### 2026-03-12 - Modules/Makeup/001
- Task file: docs/tasks/modules/makeup/001_makeup_module_foundation_toggle_rbac_schema.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/sql/028_makeup_module_core.sql], [apps/web/src/types/showroomAuth.ts], [apps/web/src/features/auth/utils/{permissions,routeAccess,authRedirect}.ts], [apps/web/src/server/data-access/{auth,settings}.ts], [apps/web/src/server/services/settingsService.ts], [apps/web/src/types/settingsModule.ts], [apps/web/src/features/settings/{hooks,useSettingsGeneralPage.ts,components/SettingsGeneralPage.tsx,hooks/useSettingsUsersPage.ts}]
- Known gaps: [Chưa chạy manual browser QA đầy đủ cho settings toggle + auth redirect matrix]

### 2026-03-12 - Modules/Makeup/002
- Task file: docs/tasks/modules/makeup/002_makeup_booking_conflict_warning_and_override.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/server/data-access/{makeupShared.ts,makeupEvents.ts,makeup.ts}], [apps/web/src/server/services/makeupService.ts], [apps/web/src/app/api/makeup/events/route.ts], [apps/web/src/app/api/makeup/events/[eventId]/route.ts], [apps/web/src/app/api/makeup/events/conflicts/route.ts], [apps/web/src/features/makeup/{services/makeupClientService.ts,queries/useMakeupQueries.ts,hooks/useMakeupCalendarPage.ts,components/MakeupCalendarPage.tsx}], [apps/web/src/types/makeupModule.ts]
- Known gaps: [Chưa có manual QA luồng booking từ màn customer public (task hiện tại mới hoàn thiện contract + dashboard makeup flow)]

### 2026-03-12 - Modules/Makeup/003
- Task file: docs/tasks/modules/makeup/003_makeup_expert_schedule_and_conflict_calendar_colors.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/app/[locale]/(dashboard)/makeup/page.tsx], [apps/web/src/app/[locale]/(dashboard)/makeup/my-schedule/page.tsx], [apps/web/src/features/makeup/{hooks/useMakeupMySchedulePage.ts,components/MakeupMySchedulePage.tsx}], [apps/web/src/features/app-shell/{constants.ts,hooks/useDashboardShell.ts,components/DashboardShell.tsx}], [apps/web/src/lib/languages/{vi.ts,en.ts}]
- Known gaps: [Calendar UI hiện ở mức board/list MVP, chưa có drag-drop/realtime]

### 2026-03-12 - Modules/Makeup/004
- Task file: docs/tasks/modules/makeup/004_makeup_admin_artist_directory_and_schedule_visibility.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/app/[locale]/(dashboard)/makeup/artists/page.tsx], [apps/web/src/app/[locale]/(dashboard)/makeup/artists/[artistProfileId]/page.tsx], [apps/web/src/app/api/makeup/artists/route.ts], [apps/web/src/app/api/makeup/artists/[artistProfileId]/schedule/route.ts], [apps/web/src/features/makeup/{hooks/useMakeupArtistDirectoryPage.ts,hooks/useMakeupArtistSchedulePage.ts,components/MakeupArtistDirectoryPage.tsx,components/MakeupArtistSchedulePage.tsx}], [apps/web/src/server/data-access/makeupEvents.ts]
- Known gaps: [Chưa có manual QA cho toàn bộ role matrix owner_admin/manager/staff/makeup_artist]

### 2026-03-12 - Modules/Makeup/005
- Task file: docs/tasks/modules/makeup/005_makeup_packages_setup_admin_and_artist.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/sql/029_makeup_packages_core.sql], [apps/web/src/server/data-access/{makeupPackages.ts,makeupShared.ts,makeupEvents.ts}], [apps/web/src/server/services/makeupService.ts], [apps/web/src/app/api/makeup/packages/route.ts], [apps/web/src/app/api/makeup/packages/[packageId]/route.ts], [apps/web/src/features/makeup/{hooks/useMakeupPackagesPage.ts,components/MakeupPackagesPage.tsx}]
- Known gaps: [Chưa có migration execution log trên môi trường production/staging trong turn này]

### 2026-03-12 - Modules/Makeup/006
- Task file: docs/tasks/modules/makeup/006_makeup_revenue_profit_artist_stats_and_dashboard_module_split.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass (sau khi dọn stale generated files trong `.next/types`); cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/app/[locale]/(dashboard)/makeup/my-stats/page.tsx], [apps/web/src/app/api/makeup/stats/my/route.ts], [apps/web/src/features/makeup/{hooks/useMakeupMyStatsPage.ts,components/MakeupMyStatsPage.tsx}], [apps/web/src/server/data-access/{makeupStats.ts,dashboard.ts}], [apps/web/src/features/dashboard/{hooks/useDashboardOverviewPage.ts,views/DashboardHomePage/DashboardHomePage.tsx}], [apps/web/src/types/dashboardOverview.ts], [apps/web/src/lib/languages/{vi.ts,en.ts}]
- Known gaps: [Chưa có benchmark đối soát số liệu production giữa all-modules và split-modules]

### 2026-03-12 - Modules/Makeup/007
- Task file: docs/tasks/modules/makeup/007_makeup_product_page_voice_booking_single_input_and_time_range_conflict.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/sql/030_makeup_event_time_range_and_voice_booking.sql], [apps/web/src/server/services/{makeupService.ts,makeupParser.ts}], [apps/web/src/server/data-access/{makeupShared.ts,makeupEvents.ts}], [apps/web/src/app/api/makeup/events/parse/route.ts], [apps/web/src/features/makeup/{hooks/useMakeupProductBooking.ts,hooks/makeupProductBookingCopy.ts,hooks/makeupProductBookingUtils.ts,components/MakeupBookingVoiceInputSection.tsx,components/MakeupBookingConfirmForm.tsx,components/MakeupMonthlyCalendar.tsx,queries/useMakeupQueries.ts,services/makeupClientService.ts,index.ts}], [apps/web/src/features/product-landing/components/ProductLandingPage.tsx], [apps/web/src/types/makeupModule.ts]
- Known gaps: [Chưa có manual browser QA luồng voice-input trên nhiều trình duyệt khác nhau]

### 2026-03-14 - Modules/Makeup/008
- Task file: docs/tasks/modules/makeup/008_makeup_admin_tabs_shell_and_default_calendar_route.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/app/[locale]/(dashboard)/makeup/{layout.tsx,page.tsx,calendar/page.tsx,overview/page.tsx,inventory/page.tsx,orders/page.tsx}], [apps/web/src/features/makeup/components/MakeupAdminTabs.tsx], [apps/web/src/features/makeup/hooks/useMakeupAdminTabs.ts], [apps/web/src/lib/languages/{vi.ts,en.ts}]
- Known gaps: [Chưa QA manual đầy đủ deep-link trên mọi role ở browser thật]

### 2026-03-14 - Modules/Makeup/009
- Task file: docs/tasks/modules/makeup/009_makeup_admin_overview_kpi_revenue_chart_and_procurement_invoice_summary.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/src/app/api/makeup/admin/overview/route.ts], [apps/web/src/server/data-access/makeupOverview.ts], [apps/web/src/server/services/{makeupOrdersAdminService.ts,makeupAdminServiceShared.ts}], [apps/web/src/features/makeup/{hooks/useMakeupAdminOverviewPage.ts,components/MakeupAdminOverviewPage.tsx,queries/useMakeupQueries.ts,services/makeupClientService.ts,stores/makeupStore.ts}], [apps/web/src/types/makeupModule.ts]
- Known gaps: [Chart đang ở mức line chart cơ bản, chưa có drill-down nâng cao]

### 2026-03-14 - Modules/Makeup/010
- Task file: docs/tasks/modules/makeup/010_makeup_admin_inventory_catalog_with_shopee_links_package_artist.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/sql/035_makeup_inventory_items_core.sql], [apps/web/src/app/api/makeup/inventory/{route.ts,[itemId]/route.ts}], [apps/web/src/server/data-access/makeupInventory.ts], [apps/web/src/server/services/{makeupInventoryService.ts,makeupAdminServiceShared.ts}], [apps/web/src/features/makeup/{hooks/useMakeupInventoryPage.ts,components/MakeupInventoryPage.tsx,queries/useMakeupQueries.ts,services/makeupClientService.ts,stores/makeupStore.ts}], [apps/web/src/types/makeupModule.ts], [apps/web/sql/README.md]
- Known gaps: [Chưa có integration test tự động cho regex Shopee URL trên nhiều biến thể domain]

### 2026-03-14 - Modules/Makeup/011
- Task file: docs/tasks/modules/makeup/011_makeup_admin_order_management_crud_makeup_orders_and_purchase_invoices.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [apps/web/sql/036_makeup_orders_and_purchase_invoices_core.sql], [apps/web/src/app/api/makeup/orders/{route.ts,[orderId]/route.ts}], [apps/web/src/app/api/makeup/purchase-invoices/{route.ts,[invoiceId]/route.ts}], [apps/web/src/server/data-access/{makeupOrders.ts,makeupPurchaseInvoices.ts,makeupPurchaseInvoicesShared.ts,makeup.ts}], [apps/web/src/server/services/{makeupOrdersAdminService.ts,makeupAdminServiceShared.ts}], [apps/web/src/features/makeup/{hooks/useMakeupOrdersPage.ts,components/MakeupOrdersPage.tsx,components/MakeupOrdersTabSection.tsx,components/MakeupPurchaseInvoicesTabSection.tsx,queries/useMakeupQueries.ts,services/makeupClientService.ts,stores/makeupStore.ts}], [apps/web/src/types/makeupModule.ts], [apps/web/sql/README.md]
- Known gaps: [Luồng update chi tiết line-items hóa đơn đang ở mức replace-all, chưa có inline row edit nâng cao]

### 2026-03-14 - Modules/Makeup/012
- Task file: docs/tasks/modules/makeup/012_makeup_module_isolation_regression_guard_against_rental_module.md
- Status: done
- Commit: [commit-hash-or-n/a]
- Test reminder result: [cd apps/web && npm run typecheck: pass; cd apps/web && npx eslint (changed files): pass]
- Main files changed: [docs/test-case/makeup_module_isolation_regression.md], [apps/web/src/server/data-access/{makeupEvents.ts,makeupPackages.ts,makeupStats.ts,makeupShared.ts}], [apps/web/src/server/services/{makeupInventoryService.ts,makeupOrdersAdminService.ts,makeupAdminServiceShared.ts}], [apps/web/sql/README.md]
- Known gaps: [Checklist regression mới ở mức tài liệu/manual, chưa có e2e automation]
