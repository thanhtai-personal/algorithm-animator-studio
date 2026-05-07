# Bug Scan 017 - Admin mobile responsive audit (products + payment)

## Scope
- App: `apps/web`
- Date: 2026-05-06
- Method: static responsive scan of dashboard/admin source, focused on mobile width risks in product creation and payment screens.
- Architecture sources loaded:
  - `.mcp.full.md`
  - `docs/architecture/000_architecture_index.md`
  - `docs/architecture/010_optimized_target_architecture.md`
  - `docs/architecture/011_task_architecture_compliance_standard.md`

## Summary
- Main responsive risk pattern: desktop-first table/filter/drawer layouts are reused on mobile without mobile-specific cards, stacked controls, sticky action bars, or viewport-safe modal bodies.
- Highest priority screens:
  1. Admin Products list: filter/table toolbar likely overflows or creates hard horizontal scroll.
  2. Admin Products create drawer: full product form is wide and action footer is not optimized for mobile.
  3. Sales Product Entry: long create-product form has no mobile sticky submit and summary is placed after the form.
  4. Admin Payments: table is forced to `min-w-[1450px]`; filters and edit drawer are desktop-first.

## Screen Group: Admin Products list
- Route: `/{locale}/products`
- Main files:
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx`
  - `apps/web/src/features/products/views/ProductsListPage/ProductsTableRows.tsx`
  - `apps/web/src/components/data-display/DataTableShell.tsx`
  - `apps/web/src/components/filters/FilterBarShell.tsx`
- Findings:
  - Search filter uses `min-w-64 flex-1`, which can force the filter row wider than a 320-390px viewport.
  - Category/tag/ready-only filters are fixed `inline-flex h-10` chips and are not converted to full-width stacked controls on mobile.
  - `DataTableShell` is used with `disableTableInnerScroll`, so the products table can push page-level width instead of contained scroll/card rendering.
  - Toolbar count labels and bulk delete button stay in a dense inline cluster; likely wraps awkwardly and can crowd the table header.
- Evidence:
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx:209`
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx:210`
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx:221`
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx:270`
  - `apps/web/src/features/products/views/ProductsListPage/index.tsx:304`

## Screen Group: Admin Products create drawer
- Route: `/{locale}/products` -> Create product drawer
- Main files:
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx`
  - `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx`
  - `apps/web/src/components/layout/DrawerFormShell.tsx`
- Findings:
  - Drawer width uses `w-full max-w-full sm:max-w-[85vw] xl:w-[85vw]`; on mobile this becomes a full-screen drawer but keeps a desktop right-slide mental model.
  - Footer action group is only `flex justify-end gap-2`; buttons can be cramped and are not full-width/sticky-bottom mobile actions.
  - `ProductOverviewForm` is forced into `layoutMode="twoColumn"` and only drops the internal grid at `lg`, so tablet/narrow landscape still gets dense two-column sections.
  - Product code input and regenerate button are an inline row; the regenerate button is `shrink-0` and can squeeze the input on small widths.
  - Media picker / preview grids use compact fixed grids and need mobile safe-height checks with nested modals.
- Evidence:
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx:82`
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx:84`
  - `apps/web/src/features/products/views/ProductsListPage/CreateProductDrawer.tsx:131`
  - `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx:188`
  - `apps/web/src/features/products/views/ProductOverviewForm/ProductOverviewForm.impl.tsx:205`

## Screen Group: Sales Product Entry
- Route: `/{locale}/sales/product-entry`
- Main files:
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntrySidebar.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryBasicSection.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPricingSection.tsx`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryBatchItemsSection.tsx`
- Findings:
  - Main grid switches to sidebar only at `xl`, but the summary/sidebar content appears after the full long form on mobile; users cannot see generated item codes/created product summary while submitting.
  - Footer actions are inline at `sm` and not sticky; on long mobile forms, submit/reset can be far below current input context.
  - Pricing uses `md:grid-cols-3`; tablet portrait can be too dense for long Vietnamese labels and VND values.
  - Sidebar generated item codes can become a long scrollable block after the form instead of a compact mobile summary.
- Evidence:
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx:31`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx:52`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntryPage.tsx:54`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntrySidebar.tsx:18`
  - `apps/web/src/features/sales/views/SalesProductEntryPage/SalesProductEntrySidebar.tsx:62`

## Screen Group: Admin Payments
- Route: `/{locale}/payments`
- Main files:
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx`
  - `apps/web/src/components/data-display/DataTableShell.tsx`
  - `apps/web/src/components/filters/FilterBarShell.tsx`
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx`
  - `apps/web/src/features/sales/views/SalesPosPage/SalesPosPaymentReceiptModal.tsx`
- Findings:
  - Payments table uses eight columns and `tableClassName="min-w-[1450px]"`; mobile gets a very wide horizontal table instead of payment cards.
  - Date range filter packs label, two date inputs, and separator inside one fixed-height inline label. This is likely clipped on 320-390px widths.
  - Type/method/branch filters are desktop inline chips and need full-width stacked mobile controls.
  - Edit drawer footer uses right-aligned inline buttons; mobile should use full-width stacked or sticky action bar.
  - Order wizard payment rows use `md:grid-cols-4`; on small tablets it may be too dense, and remove action relies on invisible label spacer.
  - Payment receipt modals in Order Wizard and POS have `max-w` cards but no explicit `max-h` / overflow body, so keyboard and small-height devices can hide the confirm button.
- Evidence:
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx:102`
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx:524`
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx:530`
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx:617`
  - `apps/web/src/features/payments/views/PaymentsListPage/PaymentsListPage.impl.tsx:658`
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx:691`
  - `apps/web/src/features/orders/views/OrderWizardPage/OrderWizardPage.impl.tsx:1040`
  - `apps/web/src/features/sales/views/SalesPosPage/SalesPosPaymentReceiptModal.tsx:18`

## Recommended Task Sequence
1. `docs/tasks/095_bug_admin_products_list_mobile_responsive.md`
2. `docs/tasks/096_bug_admin_product_create_drawer_mobile_responsive.md`
3. `docs/tasks/097_bug_sales_product_entry_mobile_responsive.md`
4. `docs/tasks/098_bug_admin_payments_mobile_responsive.md`

## Validation Notes
- Static scan completed.
- Browser/device screenshots were not executed in this pass; each task requires manual verification at 320px, 375px, 390px, 768px, and desktop widths.
