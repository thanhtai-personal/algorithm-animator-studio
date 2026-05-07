"use client";

import type { AppLocale } from "@/constants/locale";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";
import type { ReturnOrderModalModel } from "./types";

interface ReturnOrderSettlementSummaryProps {
  locale: AppLocale;
  model: ReturnOrderModalModel;
}

export function ReturnOrderSettlementSummary({ locale, model }: ReturnOrderSettlementSummaryProps) {
  if (!model.sourceSummary) return null;

  const money = (value: number) => formatMoney(value, { locale, currency: "VND" }) || "-";

  return (
    <article className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-2">
      <p className="text-xs text-muted-foreground">
        {model.copy.source.customer}:{" "}
        <span className="font-semibold text-foreground">
          {model.sourceSummary.customerName} ({model.sourceSummary.customerPhone ?? "-"})
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.source.expectedReturn}:{" "}
        <span className="font-semibold text-foreground">
          {formatDateLabel(model.sourceSummary.expectedReturnDate, { locale })}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.source.total}:{" "}
        <span className="font-semibold text-foreground">{money(model.sourceSummary.totalAmount)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.source.depositPaid}:{" "}
        <span className="font-semibold text-foreground">{money(model.sourceSummary.depositPaid)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.source.refundableDeposit}:{" "}
        <span className="font-semibold text-foreground">
          {money(model.sourceSummary.refundableDeposit)}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.source.outstanding}:{" "}
        <span className="font-semibold text-warning">
          {money(model.sourceSummary.outstandingAmount)}
        </span>
      </p>
    </article>
  );
}
