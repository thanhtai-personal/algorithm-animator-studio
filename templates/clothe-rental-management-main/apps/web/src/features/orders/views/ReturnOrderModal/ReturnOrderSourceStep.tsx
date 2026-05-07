"use client";

import type { AppLocale } from "@/constants/locale";
import { formatDateLabel } from "@/utils/format/date";
import type { ReturnOrderModalModel } from "./types";

interface ReturnOrderSourceStepProps {
  locale: AppLocale;
  model: ReturnOrderModalModel;
}

export function ReturnOrderSourceStep({ locale, model }: ReturnOrderSourceStepProps) {
  const totalPages = Math.max(1, Math.ceil(model.sourcesTotal / Math.max(1, model.sourcesPageSize)));

  return (
    <section className="space-y-3">
      <input
        type="search"
        value={model.sourceSearchInput}
        onChange={(event) => model.setSourceSearchInput(event.target.value)}
        placeholder={model.copy.source.searchPlaceholder}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
      />

      {model.sources.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {model.copy.source.empty}
        </p>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-border p-3">
          {model.sources.map((source) => {
            const active = model.selectedSourceOrderId === source.orderId;
            return (
              <button
                key={source.orderId}
                type="button"
                onClick={() => model.setSelectedSourceOrderId(source.orderId)}
                className={`w-full rounded-xl border px-3 py-2 text-left ${
                  active ? "border-primary/40 bg-primary/5" : "border-border hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{source.orderCode}</p>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {model.resolveSourceOrderStatusLabel(source.orderStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.customerName} · {source.customerPhone ?? "-"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {model.copy.source.expectedReturn}:{" "}
                  {formatDateLabel(source.expectedReturnDate, { locale })}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => model.setPage(Math.max(model.page - 1, 1))}
          disabled={model.page <= 1}
          className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          {model.page}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => model.setPage(Math.min(model.page + 1, totalPages))}
          disabled={model.page >= totalPages}
          className="rounded-lg border border-border px-2 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  );
}
