"use client";

import type { AppLocale } from "@/constants/locale";
import type { MakeupOrdersPageModel } from "@/features/makeup/hooks/useMakeupOrdersPage";

interface MakeupPurchaseInvoicesTabSectionProps {
  locale: AppLocale;
  model: MakeupOrdersPageModel;
}

export function MakeupPurchaseInvoicesTabSection({
  locale,
  model,
}: MakeupPurchaseInvoicesTabSectionProps) {
  return (
    <>
      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">
          {locale === "vi" ? "Tạo hóa đơn nhập hàng makeup" : "Create purchase invoice"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Ngày hóa đơn" : "Invoice date"}</span>
            <input
              type="date"
              value={model.invoiceDate}
              onChange={(event) => model.setInvoiceDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Trạng thái" : "Status"}</span>
            <select
              value={model.invoiceCreateStatus}
              onChange={(event) => model.setInvoiceCreateStatus(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Nhà cung cấp" : "Supplier"}</span>
            <input
              type="text"
              value={model.invoiceSupplierName}
              onChange={(event) => model.setInvoiceSupplierName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "SĐT nhà cung cấp" : "Supplier phone"}</span>
            <input
              type="tel"
              value={model.invoiceSupplierPhone}
              onChange={(event) => model.setInvoiceSupplierPhone(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2 xl:col-span-4">
            <span>{locale === "vi" ? "Ghi chú" : "Note"}</span>
            <input
              type="text"
              value={model.invoiceNote}
              onChange={(event) => model.setInvoiceNote(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-3 md:grid-cols-5">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Món hàng (inventory)" : "Inventory item"}</span>
            <select
              value={model.invoiceItemInventoryId}
              onChange={(event) => model.setInvoiceItemInventoryId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">-</option>
              {model.inventoryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tên dòng hàng" : "Line item name"}</span>
            <input
              type="text"
              value={model.invoiceItemName}
              onChange={(event) => model.setInvoiceItemName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Số lượng" : "Quantity"}</span>
            <input
              type="number"
              min={1}
              value={model.invoiceItemQuantity}
              onChange={(event) => model.setInvoiceItemQuantity(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Đơn giá" : "Unit cost"}</span>
            <input
              type="number"
              min={0}
              value={model.invoiceItemUnitCost}
              onChange={(event) => model.setInvoiceItemUnitCost(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Ghi chú dòng" : "Line note"}</span>
            <input
              type="text"
              value={model.invoiceItemNote}
              onChange={(event) => model.setInvoiceItemNote(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <div className="md:col-span-5">
            <button
              type="button"
              onClick={model.onAddInvoiceDraftItem}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {locale === "vi" ? "Thêm dòng hàng" : "Add invoice line"}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {model.invoiceDraftItems.map((item, index) => (
            <article key={`${item.itemName}-${index}`} className="rounded-xl border border-border bg-muted/10 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-foreground">
                  {item.itemName} | {item.quantity} x {model.formatCurrency(item.unitCostAmount)} ={" "}
                  {model.formatCurrency(item.quantity * item.unitCostAmount)}
                </p>
                <button
                  type="button"
                  onClick={() => model.onRemoveInvoiceDraftItem(index)}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground"
                >
                  {locale === "vi" ? "Xóa dòng" : "Remove"}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void model.onCreatePurchaseInvoice()}
            disabled={model.createInvoiceMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {locale === "vi" ? "Tạo hóa đơn" : "Create invoice"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Từ ngày" : "Start date"}</span>
            <input
              type="date"
              value={model.invoiceStartDate}
              onChange={(event) => model.setInvoiceStartDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Đến ngày" : "End date"}</span>
            <input
              type="date"
              value={model.invoiceEndDate}
              onChange={(event) => model.setInvoiceEndDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Trạng thái" : "Status"}</span>
            <select
              value={model.invoiceStatus}
              onChange={(event) => model.setInvoiceStatus(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{locale === "vi" ? "Tất cả" : "All"}</option>
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
            <input
              type="search"
              value={model.invoiceSearch}
              onChange={(event) => model.setInvoiceSearch(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="space-y-2">
          {model.purchaseInvoices.map((invoice) => (
            <article key={invoice.id} className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {invoice.invoiceCode} | {invoice.invoiceDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.supplierName ?? "-"} | {invoice.supplierPhone ?? "-"} |{" "}
                    {model.formatCurrency(invoice.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">{invoice.note ?? "-"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={invoice.status}
                    onChange={(event) =>
                      void model.onUpdateInvoiceStatus(
                        invoice.id,
                        event.target.value as "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED"
                      )
                    }
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void model.onToggleInvoiceActive(invoice.id, invoice.isActive)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-semibold text-foreground"
                  >
                    {invoice.isActive
                      ? locale === "vi"
                        ? "Ẩn"
                        : "Deactivate"
                      : locale === "vi"
                        ? "Bật"
                        : "Activate"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
