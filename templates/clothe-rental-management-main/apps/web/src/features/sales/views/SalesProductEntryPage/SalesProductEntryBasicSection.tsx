"use client";

import type { AppLocale } from "@/constants/locale";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import type { SalesProductEntryPageModel } from "./types";
import { FieldError } from "./FieldError";

interface SalesProductEntryBasicSectionProps {
  locale: AppLocale;
  model: SalesProductEntryPageModel;
}

export function SalesProductEntryBasicSection({
  locale,
  model,
}: SalesProductEntryBasicSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formGroups.basic}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.productCode}
          </span>
          <input
            value={model.draft.productCode}
            onChange={(event) => model.setDraftField("productCode", event.target.value.toUpperCase())}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          <FieldError message={model.fieldErrors.productCode} />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {model.copy.fields.category}
          </span>
          <select
            value={model.draft.productCategoryId}
            onChange={(event) => model.setDraftField("productCategoryId", event.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">-</option>
            {model.categories.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <VoiceDictationField
        locale={locale}
        label={model.copy.fields.productName}
        fieldType="input"
        value={model.draft.productName}
        onValueChange={(value) => model.setDraftField("productName", value)}
        language={locale === "vi" ? "vi-VN" : "en-US"}
      />
      <FieldError message={model.fieldErrors.productName} />

      <label className="space-y-1 md:max-w-xs">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {model.copy.fields.gender}
        </span>
        <select
          value={model.draft.gender}
          onChange={(event) =>
            model.setDraftField("gender", event.target.value as typeof model.draft.gender)
          }
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="">-</option>
          {model.genderOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
