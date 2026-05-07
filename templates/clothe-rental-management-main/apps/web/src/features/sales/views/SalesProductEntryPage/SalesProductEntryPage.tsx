"use client";

import { observer } from "mobx-react-lite";
import { productsClientService } from "@/features/products/services/productsClientService";
import { useSalesProductEntryPage } from "@/features/sales/hooks/useSalesProductEntryPage";
import { SalesProductEntryAttributesSection } from "./SalesProductEntryAttributesSection";
import { SalesProductEntryBasicSection } from "./SalesProductEntryBasicSection";
import { SalesProductEntryBatchItemsSection } from "./SalesProductEntryBatchItemsSection";
import { SalesProductEntryBusinessSection } from "./SalesProductEntryBusinessSection";
import { SalesProductEntryMediaSection } from "./SalesProductEntryMediaSection";
import { SalesProductEntryPricingSection } from "./SalesProductEntryPricingSection";
import { SalesProductEntrySidebar } from "./SalesProductEntrySidebar";
import type { SalesProductEntryPageProps } from "./types";

export const SalesProductEntryPage = observer(function SalesProductEntryPage({
  locale,
}: SalesProductEntryPageProps) {
  const model = useSalesProductEntryPage(locale);
  const trimmedCoverImageUrl = model.draft.coverImageUrl.trim();
  const coverPreviewUrl = trimmedCoverImageUrl
    ? productsClientService.resolveCoverImageUrl(trimmedCoverImageUrl) ?? trimmedCoverImageUrl
    : null;

  return (
    <section className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SalesProductEntrySidebar
          locale={locale}
          model={model}
          className="xl:hidden"
          showSupportingCards={false}
          generatedCodesMaxHeightClassName="max-h-28"
        />

        <article className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-5">
          <div className="rounded-xl border border-border/60 bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
            {model.canEditSensitivePricing
              ? model.copy.permissionsNoteAdmin
              : model.copy.permissionsNoteStaff}
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.formSections.product}
            </h2>
            <SalesProductEntryBasicSection locale={locale} model={model} />
            <SalesProductEntryMediaSection model={model} coverPreviewUrl={coverPreviewUrl} />
            <SalesProductEntryAttributesSection locale={locale} model={model} />
            <SalesProductEntryBusinessSection model={model} />
          </section>

          <SalesProductEntryPricingSection model={model} />
          <SalesProductEntryBatchItemsSection locale={locale} model={model} />

          <footer className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 border-t border-border bg-card/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:flex-row md:items-center md:justify-between md:bg-transparent md:px-0 md:pb-0 md:pt-4 md:backdrop-blur-none">
            <p className="text-xs text-muted-foreground">{model.copy.draftSavedHint}</p>
            <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
              <button
                type="button"
                onClick={model.resetDraft}
                className="min-h-10 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
              >
                {model.copy.resetAction}
              </button>
              <button
                type="button"
                onClick={model.handleSubmit}
                disabled={model.isSubmitting}
                className="min-h-10 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                {model.isSubmitting ? model.copy.creatingLabel : model.copy.submitAction}
              </button>
            </div>
          </footer>
        </article>

        <SalesProductEntrySidebar locale={locale} model={model} className="hidden xl:block" />
      </div>
    </section>
  );
});
