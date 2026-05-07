"use client";

import type { AppLocale } from "@/constants/locale";
import type { ReturnOrderModalModel } from "./types";
import { ReturnOrderItemsDraftList } from "./ReturnOrderItemsDraftList";
import { ReturnOrderSettlementEstimate } from "./ReturnOrderSettlementEstimate";
import { ReturnOrderSettlementFields } from "./ReturnOrderSettlementFields";
import { ReturnOrderSettlementSummary } from "./ReturnOrderSettlementSummary";

interface ReturnOrderSettlementStepProps {
  locale: AppLocale;
  model: ReturnOrderModalModel;
}

export function ReturnOrderSettlementStep({ locale, model }: ReturnOrderSettlementStepProps) {
  return (
    <section className="space-y-4">
      <ReturnOrderSettlementSummary locale={locale} model={model} />
      <ReturnOrderSettlementFields model={model} />
      <ReturnOrderSettlementEstimate locale={locale} model={model} />
      <ReturnOrderItemsDraftList model={model} />
    </section>
  );
}
