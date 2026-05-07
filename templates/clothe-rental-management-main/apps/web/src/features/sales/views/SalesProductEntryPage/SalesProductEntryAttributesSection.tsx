"use client";

import type { AppLocale } from "@/constants/locale";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import type { SalesProductEntryPageModel } from "./types";

interface SalesProductEntryAttributesSectionProps {
  locale: AppLocale;
  model: SalesProductEntryPageModel;
}

export function SalesProductEntryAttributesSection({
  locale,
  model,
}: SalesProductEntryAttributesSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-background/60 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {model.copy.formGroups.attributes}
      </h3>

      <VoiceDictationField
        locale={locale}
        label={model.copy.fields.material}
        fieldType="input"
        value={model.draft.material}
        onValueChange={(value) => model.setDraftField("material", value)}
        language={locale === "vi" ? "vi-VN" : "en-US"}
      />

      <VoiceDictationField
        locale={locale}
        label={model.copy.fields.description}
        fieldType="textarea"
        value={model.draft.description}
        onValueChange={(value) => model.setDraftField("description", value)}
        language={locale === "vi" ? "vi-VN" : "en-US"}
      />
    </div>
  );
}
