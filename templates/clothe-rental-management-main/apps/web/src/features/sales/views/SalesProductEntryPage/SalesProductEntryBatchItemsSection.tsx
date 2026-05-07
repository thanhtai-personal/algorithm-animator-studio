"use client";

import type { AppLocale } from "@/constants/locale";
import type { SalesProductEntryPageModel } from "./types";
import { FieldError } from "./FieldError";

interface SalesProductEntryBatchItemsSectionProps {
  locale: AppLocale;
  model: SalesProductEntryPageModel;
}

export function SalesProductEntryBatchItemsSection({
  locale,
  model,
}: SalesProductEntryBatchItemsSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formSections.batchItems}
      </h2>

      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.itemQuantity}
          </span>
          <input
            type="number"
            min={0}
            step={1}
            value={model.draft.itemQuantityInput}
            onChange={(event) => model.setDraftField("itemQuantityInput", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">{model.copy.itemQuantityHint}</p>
          <FieldError message={model.fieldErrors.itemQuantityInput} />
        </label>

        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fields.itemStatus}
            </span>
            <select
              value={model.draft.initialItemStatus}
              onChange={(event) =>
                model.setDraftField(
                  "initialItemStatus",
                  event.target.value as typeof model.draft.initialItemStatus
                )
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {model.copy.itemStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fields.itemSize}
            </span>
            <input
              value={model.draft.itemSize}
              onChange={(event) => model.setDraftField("itemSize", event.target.value)}
              placeholder={locale === "vi" ? "VD: M, L, XL..." : "Example: M, L, XL..."}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.itemCodes}
        </span>
        {model.generatedItemCodes.length > 0 ? (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {model.generatedItemCodes.map((code) => (
              <p key={code} className="font-mono text-[11px] text-foreground">
                {code}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{model.copy.itemsPreviewEmpty}</p>
        )}
      </div>
    </section>
  );
}
