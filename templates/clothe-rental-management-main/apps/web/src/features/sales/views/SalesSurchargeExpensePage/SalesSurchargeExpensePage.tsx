"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { ReceiptMediaPickerDrawer } from "@/components/media/ReceiptMediaPickerDrawer";
import { useSalesSurchargeExpensePage } from "@/features/sales/hooks/useSalesSurchargeExpensePage";

interface SalesSurchargeExpensePageProps {
  locale: AppLocale;
}

export const SalesSurchargeExpensePage = observer(function SalesSurchargeExpensePage({
  locale,
}: SalesSurchargeExpensePageProps) {
  const model = useSalesSurchargeExpensePage(locale);
  const formatFileSize = (sizeBytes: number) =>
    `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6">
      <header className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h1 className="text-lg font-semibold text-foreground md:text-xl">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void model.onSubmit();
        }}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{model.copy.typeLabel}</span>
            <select
              value={model.type}
              onChange={(event) => model.setType(event.target.value as "FEE" | "EXPENSE")}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="FEE">{model.copy.typeFee}</option>
              <option value="EXPENSE">{model.copy.typeExpense}</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">{model.copy.methodLabel}</span>
            <select
              value={model.method}
              onChange={(event) => model.setMethod(event.target.value as "CASH" | "BANK" | "MOMO")}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              {model.methodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.amountLabel}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={model.amountInput}
            onChange={(event) => model.setAmountInput(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.reasonLabel}</span>
          <input
            type="text"
            value={model.reason}
            onChange={(event) => model.setReason(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.noteLabel}</span>
          <textarea
            rows={3}
            value={model.note}
            onChange={(event) => model.setNote(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        {model.type === "EXPENSE" ? (
          <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={model.isImportOrder}
              onChange={(event) => model.setIsImportOrder(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <span>{model.copy.importOrderLabel}</span>
          </label>
        ) : null}

        <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={model.isInitialCapital}
            onChange={(event) => model.setIsInitialCapital(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          <span>{model.copy.initialCapitalLabel}</span>
        </label>

        <section className="space-y-3 rounded-xl border border-border bg-background p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {model.copy.receiptLabel}
              </p>
              {model.type === "EXPENSE" ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {model.copy.receiptHint}
                </p>
              ) : null}
            </div>
            <ReceiptMediaPickerDrawer
              title={model.copy.receiptPickerTitle}
              description={model.copy.receiptPickerDescription}
              triggerLabel={model.copy.receiptSelectAction}
              cameraLabel={model.copy.receiptCameraAction}
              uploadLabel={model.copy.receiptUploadAction}
              closeLabel={model.copy.receiptPickerCloseAction}
              onFilesSelected={model.addReceiptFiles}
            />
          </div>

          {model.receiptFiles.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {model.receiptFiles.map((entry) => (
                <article
                  key={entry.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <img
                    src={entry.previewUrl}
                    alt={entry.name}
                    className="h-28 w-full object-cover"
                  />
                  <div className="space-y-2 p-2">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {entry.name}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(entry.sizeBytes)}</span>
                      <button
                        type="button"
                        onClick={() => model.removeReceiptFile(entry.id)}
                        className="rounded-lg border border-border px-2 py-1 font-semibold transition hover:bg-accent"
                      >
                        {model.copy.receiptRemoveAction}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={model.submitting}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {model.submitting ? model.copy.processing : model.copy.submitAction}
          </button>
        </div>
      </form>

      {model.latestEntry ? (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-sm font-semibold text-foreground">{model.copy.latestLabel}</h2>
          <div className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">ID:</span> {model.latestEntry.id}
            </p>
            <p>
              <span className="font-medium text-foreground">TYPE:</span> {model.latestEntry.type}
            </p>
            <p>
              <span className="font-medium text-foreground">METHOD:</span> {model.latestEntry.method}
            </p>
            <p>
              <span className="font-medium text-foreground">AMOUNT:</span>{" "}
              {model.formatMoneyLabel(model.latestEntry.amount)}
            </p>
            <p className="md:col-span-2">
              <span className="font-medium text-foreground">REASON:</span>{" "}
              {model.latestEntry.reason ?? "-"}
            </p>
          </div>
        </section>
      ) : null}
    </section>
  );
});
