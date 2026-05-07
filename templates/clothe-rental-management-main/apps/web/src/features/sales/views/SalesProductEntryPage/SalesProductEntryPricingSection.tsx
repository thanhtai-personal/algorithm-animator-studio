"use client";

import type { SalesProductEntryPageModel } from "./types";
import { FieldError } from "./FieldError";

interface SalesProductEntryPricingSectionProps {
  model: SalesProductEntryPageModel;
}

export function SalesProductEntryPricingSection({ model }: SalesProductEntryPricingSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formSections.pricing}
      </h2>

      <div className="grid gap-3 lg:grid-cols-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.price1d}
          </span>
          <input
            value={model.draft.price1dInput}
            onChange={(event) => model.setDraftField("price1dInput", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <FieldError message={model.fieldErrors.price1dInput} />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.salePrice}
          </span>
          <input
            value={model.draft.salePriceInput}
            onChange={(event) => model.setDraftField("salePriceInput", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <FieldError message={model.fieldErrors.salePriceInput} />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.purchasePrice}
          </span>
          <input
            value={model.draft.purchasePriceInput}
            onChange={(event) => model.setDraftField("purchasePriceInput", event.target.value)}
            disabled={!model.canEditSensitivePricing}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <FieldError message={model.fieldErrors.purchasePriceInput} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.defaultDeposit}
          </span>
          <input
            value={model.draft.defaultDepositInput}
            onChange={(event) => model.setDraftField("defaultDepositInput", event.target.value)}
            disabled={!model.canEditSensitivePricing}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
          <FieldError message={model.fieldErrors.defaultDepositInput} />
        </label>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {[
          ["price3d", "price3dInput"],
          ["price7d", "price7dInput"],
          ["pricePerDay", "pricePerDayInput"],
        ].map(([labelKey, fieldKey]) => (
          <label key={fieldKey} className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fields[labelKey as "price3d" | "price7d" | "pricePerDay"]}
            </span>
            <input
              value={model.draft[fieldKey as "price3dInput" | "price7dInput" | "pricePerDayInput"]}
              onChange={(event) =>
                model.setDraftField(
                  fieldKey as "price3dInput" | "price7dInput" | "pricePerDayInput",
                  event.target.value
                )
              }
              disabled={!model.canEditSensitivePricing}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
            <FieldError
              message={
                model.fieldErrors[
                  fieldKey as "price3dInput" | "price7dInput" | "pricePerDayInput"
                ]
              }
            />
          </label>
        ))}
      </div>
    </section>
  );
}
