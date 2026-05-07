"use client";

import { Loader2 } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import type { SalesPosPageModel } from "./types";

interface SalesPosPaymentReceiptModalProps {
  locale: AppLocale;
  model: SalesPosPageModel;
}

export function SalesPosPaymentReceiptModal({ locale, model }: SalesPosPaymentReceiptModalProps) {
  if (!model.paymentReceiptModalOpen) return null;

  const paymentReceiptLoadingLabel = locale === "vi" ? "Đang xử lý..." : "Processing...";

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={model.copy.paymentReceiptTitle}
      onClick={model.closePaymentReceiptModal}
    >
      <form
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
        onSubmit={(event) => {
          event.preventDefault();
          void model.confirmPaymentReceiptAndCreate();
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {model.copy.paymentReceiptTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {model.copy.paymentReceiptDescription}
            </p>
          </div>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">
            {model.copy.paymentReceiptAmountLabel}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={model.paymentReceiptAmountInput}
            onChange={(event) => model.setPaymentReceiptAmountInput(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">
            {model.copy.paymentReceiptMethodLabel}
          </span>
          <select
            value={model.paymentReceiptMethod}
            onChange={(event) =>
              model.setPaymentReceiptMethod(event.target.value as "CASH" | "BANK")
            }
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="CASH">{model.copy.paymentReceiptMethodOptions.CASH}</option>
            <option value="BANK">{model.copy.paymentReceiptMethodOptions.BANK}</option>
          </select>
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">
            {model.copy.paymentReceiptNoteLabel}
          </span>
          <textarea
            rows={3}
            value={model.paymentReceiptNote}
            onChange={(event) => model.setPaymentReceiptNote(event.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>

        {model.paymentReceiptError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {model.paymentReceiptError}
          </p>
        ) : null}

        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border bg-card/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:p-5">
          <button
            type="button"
            onClick={model.closePaymentReceiptModal}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {model.copy.paymentReceiptCancelAction}
          </button>
          <button
            type="submit"
            disabled={model.creating}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {model.creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>
              {model.creating
                ? paymentReceiptLoadingLabel
                : model.copy.paymentReceiptConfirmAction}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
