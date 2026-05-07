"use client";

import type { AppLocale } from "@/constants/locale";
import { formatMoney } from "@/utils/format/money";
import type { ReturnOrderModalModel } from "./types";

interface ReturnOrderSettlementEstimateProps {
  locale: AppLocale;
  model: ReturnOrderModalModel;
}

export function ReturnOrderSettlementEstimate({ locale, model }: ReturnOrderSettlementEstimateProps) {
  const money = (value: number) => formatMoney(value, { locale, currency: "VND" }) || "-";

  return (
    <article className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-3">
      <p className="text-xs text-muted-foreground">
        {model.copy.settlement.outstandingBeforeReturn}:{" "}
        <span className="font-semibold text-foreground">{money(model.returnOutstandingBefore)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.settlement.estimatedAdditionalCharge}:{" "}
        <span className="font-semibold text-warning">{money(model.returnEstimatedAdditionalCharge)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {model.copy.settlement.estimatedOutstandingAfterReturn}:{" "}
        <span className="font-semibold text-warning">{money(model.returnEstimatedOutstandingAfter)}</span>
      </p>
      <p className="text-[11px] text-muted-foreground md:col-span-3">
        {model.copy.settlement.estimatedHint}
      </p>
    </article>
  );
}
