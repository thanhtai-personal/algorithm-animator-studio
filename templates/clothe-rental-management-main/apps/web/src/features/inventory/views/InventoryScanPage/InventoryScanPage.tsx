"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { QrCode, Search } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { ITEM_STATUS_LABELS } from "@/features/inventory/utils/statusPresentation";
import { useInventoryScanPage } from "@/features/inventory/hooks/useInventoryScanPage";

interface InventoryScanPageProps {
  locale: AppLocale;
}

export const InventoryScanPage = observer(function InventoryScanPage({
  locale,
}: InventoryScanPageProps) {
  const {
    copy,
    codeInput,
    setCodeInput,
    scanError,
    setScanError,
    scanMutation,
    scanItem,
  } = useInventoryScanPage(locale);

  const result = scanMutation.data;

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <QrCode className="h-3.5 w-3.5" />
          Inventory
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="space-y-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.codeLabel}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                placeholder={copy.codePlaceholder}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
              />
            </div>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={scanMutation.isPending}
              onClick={async () => {
                try {
                  setScanError(null);
                  await scanItem();
                } catch (error) {
                  setScanError(
                    error instanceof Error ? error.message : copy.notFoundMessage
                  );
                }
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {copy.submitAction}
            </button>
          </div>

          {scanError ? <p className="text-xs text-destructive">{scanError}</p> : null}
        </div>
      </section>

      {result ? (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm text-sm animate-slide-up">
          <h2 className="font-semibold text-foreground">{copy.recentResult}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground">
              {copy.itemCode}: <span className="font-mono text-foreground">{result.itemCode}</span>
            </p>
            <StatusBadge kind="item" status={result.status} labels={ITEM_STATUS_LABELS[locale]} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {copy.status}: {ITEM_STATUS_LABELS[locale][result.status]}
          </p>

          <div className="mt-3">
            <Link
              href={`/${locale}/inventory/${result.itemId}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40"
            >
              {copy.openDetail}
            </Link>
          </div>
        </section>
      ) : null}
    </section>
  );
});
