# Audit Component Size > 400 LOC (2026-03-10)

## Scope
- App: `apps/web`
- File type: `*.tsx`
- Rule: file có số dòng `> 400`

## Kết quả
- Tổng cộng: **25 components** vượt ngưỡng 400 dòng.

| LOC | File |
|---:|---|
| 2312 | `apps/web/src/features/orders/components/OrderDetailPage.tsx` |
| 1138 | `apps/web/src/features/orders/components/OrderWizardPage.tsx` |
| 1056 | `apps/web/src/features/procurement/components/ProcurementPage.tsx` |
| 994 | `apps/web/src/features/dashboard/components/DashboardHomePage.tsx` |
| 796 | `apps/web/src/features/inventory/components/InventoryListPage.tsx` |
| 734 | `apps/web/src/features/reports/components/RevenueReportPage.tsx` |
| 703 | `apps/web/src/features/products/components/ProductOverviewForm.tsx` |
| 629 | `apps/web/src/features/settings/components/SettingsShowroomPagesPage.tsx` |
| 610 | `apps/web/src/features/payments/components/PaymentsListPage.tsx` |
| 602 | `apps/web/src/features/orders/components/ReturnOrderModal.tsx` |
| 596 | `apps/web/src/features/orders/components/OrdersListPage.tsx` |
| 590 | `apps/web/src/features/sales/components/SalesProductEntryPage.tsx` |
| 584 | `apps/web/src/features/showroom/components/templates/ShowroomProductHomeV1.tsx` |
| 527 | `apps/web/src/features/sales/components/SalesPosPage.tsx` |
| 506 | `apps/web/src/features/reports/components/IncidentsReportPage.tsx` |
| 505 | `apps/web/src/features/products/components/ProductDetailPage.tsx` |
| 487 | `apps/web/src/features/products/components/ProductsListPage.tsx` |
| 484 | `apps/web/src/features/customers/components/CustomersListPage.tsx` |
| 471 | `apps/web/src/features/sales/components/SalesLayout.tsx` |
| 465 | `apps/web/src/features/reports/components/UtilizationReportPage.tsx` |
| 464 | `apps/web/src/features/calendar/components/CalendarPage.tsx` |
| 451 | `apps/web/src/features/customers/components/CustomerDetailPage.tsx` |
| 439 | `apps/web/src/features/settings/components/SettingsUsersPage.tsx` |
| 434 | `apps/web/src/features/settings/components/SettingsCategoriesPage.tsx` |
| 426 | `apps/web/src/features/inventory/components/InventoryDetailPage.tsx` |

## Ghi chú
- Đây là baseline đầu vào cho task refactor readability.
- Mục tiêu sau task: không còn component `> 400 LOC` trong `apps/web/src/features/**/components/*.tsx`.
