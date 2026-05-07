"use client";

import { observer } from "mobx-react-lite";
import { ReceiptText } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { useSalesInvoicesPage } from "@/features/sales/hooks/useSalesInvoicesPage";
import { formatMoney } from "@/utils/format/money";

interface SalesInvoicesPageProps {
  locale: AppLocale;
}

export const SalesInvoicesPage = observer(function SalesInvoicesPage({
  locale,
}: SalesInvoicesPageProps) {
  const model = useSalesInvoicesPage(locale);

  return (
    <section className="flex h-[calc(100vh-6.5rem)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-r border-border lg:w-[360px]">
        <div className="border-b border-border p-4">
          <h1 className="text-base font-semibold text-foreground">{model.copy.title}</h1>
          <input
            type="search"
            value={model.search}
            onChange={(event) => model.setSearch(event.target.value)}
            placeholder={model.copy.searchPlaceholder}
            className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>

        <div className="flex-1 overflow-auto">
          {model.orders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{model.copy.noOrderHint}</p>
          ) : (
            model.orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => model.setSelectedOrderId(order.id)}
                className={`w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                  model.selectedOrderId === order.id ? "bg-accent/70" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{order.orderCode}</p>
                  <StatusBadge kind="order" status={order.status} labels={model.orderStatusLabels} />
                </div>
                <p className="mt-1 text-sm text-foreground">{order.customer.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(order.money.totalAmount, { locale, currency: "VND" }) || "-"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => model.setPage(Math.max(1, model.page - 1))}
            disabled={model.page <= 1}
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.prevPage}
          </button>
          <span>
            {model.copy.pageLabel} {model.page}/{model.totalPages}
          </span>
          <button
            type="button"
            onClick={() => model.setPage(Math.min(model.totalPages, model.page + 1))}
            disabled={model.page >= model.totalPages}
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.nextPage}
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {!model.selectedDetail ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ReceiptText className="h-12 w-12 opacity-40" />
            <p className="text-sm">{model.copy.selectHint}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={model.printInvoice}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
              >
                {model.copy.printAction}
              </button>
              <button
                type="button"
                onClick={() => {
                  model.printInvoice();
                  toast.message(locale === "vi" ? "Đã gửi lệnh xuất PDF qua print dialog." : "PDF export sent to print dialog.");
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
              >
                {model.copy.pdfAction}
              </button>
            </div>

            <article className="rounded-xl border border-border bg-card p-5 shadow-sm print:shadow-none">
              <header className="border-b border-border pb-4 text-center">
                <h2 className="text-xl font-bold text-foreground">{model.branchDisplayName} Rental</h2>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {locale === "vi" ? "Hóa đơn thuê trang phục" : "Rental invoice"}
                </p>
              </header>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Order</p>
                  <p className="font-semibold text-foreground">{model.selectedDetail.summary.orderCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">
                    {model.selectedDetail.summary.customer.fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start</p>
                  <p className="font-semibold text-foreground">{model.selectedDetail.summary.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End</p>
                  <p className="font-semibold text-foreground">{model.selectedDetail.summary.endDate}</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Items
                </p>
                {model.selectedDetail.items.map((item) => (
                  <div key={item.orderItemId} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.productName}</span>
                    <span className="font-medium text-foreground">
                      {formatMoney(item.rentPrice, { locale, currency: "VND" }) || "-"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Payments
                </p>
                {model.selectedDetail.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">-</p>
                ) : (
                  model.selectedDetail.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {model.paymentTypeLabels[payment.type]} · {model.paymentMethodLabels[payment.method]}
                      </span>
                      <span
                        className={
                          payment.type === "REFUND" ? "font-semibold text-destructive" : "font-semibold text-foreground"
                        }
                      >
                        {payment.type === "REFUND" ? "-" : "+"}
                        {formatMoney(payment.amount, { locale, currency: "VND" }) || "-"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Total</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(model.selectedDetail.summary.money.totalAmount, { locale, currency: "VND" }) || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Paid</span>
                  <span className="font-semibold text-success">
                    {formatMoney(model.totalPaid, { locale, currency: "VND" }) || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-foreground">
                  <span className="font-semibold">Outstanding</span>
                  <span className="font-semibold">
                    {formatMoney(model.selectedDetail.summary.money.outstandingAmount, {
                      locale,
                      currency: "VND",
                    }) || "-"}
                  </span>
                </div>
              </div>
            </article>

            <div className="rounded-xl border border-border bg-card p-4 print:hidden">
              <h3 className="text-sm font-semibold text-foreground">{model.copy.paymentAction}</h3>
              {model.canPickupSelected ? (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">
                      {locale === "vi" ? "Tiền thuê cần thu khi lấy đồ" : "Rent due at pickup"}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(model.rentOutstanding, { locale, currency: "VND" }) || "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={model.submitPickup}
                    disabled={model.submittingPayment}
                    className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {model.submittingPayment ? model.copy.paymentProcessing : model.copy.pickupAction}
                  </button>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <select
                  value={model.paymentType}
                  onChange={(event) => model.setPaymentType(event.target.value as typeof model.paymentType)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="RENT">{model.paymentTypeLabels.RENT}</option>
                  <option value="DEPOSIT">{model.paymentTypeLabels.DEPOSIT}</option>
                  <option value="FEE">{model.paymentTypeLabels.FEE}</option>
                  <option value="REFUND">{model.paymentTypeLabels.REFUND}</option>
                </select>

                <select
                  value={model.paymentMethod}
                  onChange={(event) => model.setPaymentMethod(event.target.value as typeof model.paymentMethod)}
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="CASH">{model.paymentMethodLabels.CASH}</option>
                  <option value="BANK">{model.paymentMethodLabels.BANK}</option>
                  <option value="MOMO">{model.paymentMethodLabels.MOMO}</option>
                </select>

                <input
                  value={model.paymentAmount}
                  onChange={(event) => model.setPaymentAmount(event.target.value)}
                  placeholder="Amount"
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                />

                <input
                  value={model.paymentNote}
                  onChange={(event) => model.setPaymentNote(event.target.value)}
                  placeholder="Note"
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                />
              </div>

              <button
                type="button"
                onClick={model.submitPayment}
                disabled={model.submittingPayment}
                className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {model.submittingPayment
                  ? model.copy.paymentProcessing
                  : model.copy.paymentAction}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
