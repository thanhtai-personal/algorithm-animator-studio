"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Share2, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { useShowroomShortlistPage } from "@/features/showroom/hooks/useShowroomShortlistPage";
import type { ShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { resolveShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";
import { cn } from "@/utils/className";
import { formatMoney } from "@/utils/format/money";

interface ShowroomShortlistPageProps {
  locale: AppLocale;
  showroomSlug?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  initialConfig?: PublicShowroomPageConfigDto | null;
}

interface ShowroomThemeSurfaceClasses {
  pageClass: string;
  panelClass: string;
}

const SHOWROOM_THEME_SURFACE_CLASSES: Record<ShowroomThemeVariant, ShowroomThemeSurfaceClasses> = {
  default: {
    pageClass: "bg-gradient-background",
    panelClass: "border-border bg-card shadow-sm",
  },
  charm: {
    pageClass:
      "bg-[radial-gradient(circle_at_18%_8%,hsl(var(--primary)/0.2),transparent_52%),radial-gradient(circle_at_85%_12%,hsl(var(--accent)/0.18),transparent_42%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    panelClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_38px_-30px_hsl(var(--primary)/0.32)]",
  },
  modern: {
    pageClass:
      "bg-[radial-gradient(circle_at_26%_7%,hsl(var(--secondary)/0.22),transparent_52%),radial-gradient(circle_at_80%_18%,hsl(var(--primary)/0.16),transparent_44%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    panelClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_36px_-30px_hsl(var(--primary)/0.3)]",
  },
  showcase3d: {
    pageClass:
      "bg-[radial-gradient(circle_at_10%_8%,hsl(var(--kata-primary)/0.14),transparent_44%),linear-gradient(180deg,hsl(var(--kata-background)),hsl(var(--kata-background)))]",
    panelClass:
      "border-[hsl(var(--kata-border)/0.55)] bg-[hsl(var(--kata-card)/0.88)] shadow-[0_18px_42px_-32px_hsl(var(--kata-primary)/0.36)] backdrop-blur-xl",
  },
};

export const ShowroomShortlistPage = observer(function ShowroomShortlistPage({
  locale,
  showroomSlug,
  branchSlug,
  shopDomain,
  initialConfig,
}: ShowroomShortlistPageProps) {
  const model = useShowroomShortlistPage(
    locale,
    showroomSlug,
    branchSlug,
    shopDomain,
    initialConfig
  );
  const themeVariant = resolveShowroomThemeVariant(model.viewConfig.templateCode);
  const themeSurface = SHOWROOM_THEME_SURFACE_CLASSES[themeVariant];

  const localeTag = useMemo(() => (locale === "vi" ? "vi-VN" : "en-US"), [locale]);

  return (
    <section className={cn("min-h-screen px-4 py-6 md:py-10", themeSurface.pageClass)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className={cn("space-y-4 rounded-3xl p-5 md:p-6", themeSurface.panelClass)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={model.showroomPath}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{model.copy.backToShowroom}</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {model.shortlistCount > 0 ? (
                <button
                  type="button"
                  onClick={model.onClear}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {model.copy.clearAction}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void model.onShare()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                <Share2 className="h-3.5 w-3.5" />
                {model.copy.shareAction}
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{model.copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {model.shortlistCount} {model.copy.countLabel}
            </p>
          </div>

          {model.shareFeedback ? (
            <p
              className={`rounded-xl border px-3 py-2 text-xs ${
                model.shareFeedback === "success"
                  ? "border-success/35 bg-success/15 text-success"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {model.shareFeedback === "success"
                ? model.copy.shareSuccess
                : model.copy.shareError}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">{model.copy.copyHint}</p>
        </header>

        {model.shortlistItems.length === 0 ? (
          <section className={cn("rounded-3xl border border-dashed p-8 text-center", themeSurface.panelClass)}>
            <p className="text-lg font-semibold text-foreground">{model.copy.emptyTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{model.copy.emptyHint}</p>
            <Link
              href={model.showroomPath}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              {model.copy.exploreAction}
            </Link>
          </section>
        ) : (
          <section className="space-y-3">
            {model.shortlistItems.map((item) => (
              <article
                key={item.productId}
                className={cn("rounded-3xl p-4", themeSurface.panelClass)}
              >
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={model.detailPath(item.productId)}
                    className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:w-28"
                  >
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted-foreground">
                        {model.copy.noImage}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{item.categoryName ?? "-"}</p>
                        <Link
                          href={model.detailPath(item.productId)}
                          className="block truncate text-base font-semibold text-foreground"
                        >
                          {item.title}
                        </Link>
                        {item.price1d !== null ? (
                          <p className="mt-1 text-sm font-semibold text-primary">
                            {formatMoney(item.price1d, {
                              locale,
                              currency: "VND",
                              maximumFractionDigits: 0,
                            })}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              ({model.copy.priceLabel})
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => model.onRemove(item.productId)}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-2 text-xs font-semibold text-muted-foreground transition hover:text-destructive"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {model.copy.removeAction}
                      </button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {model.copy.addedAtLabel}: {" "}
                      {new Date(item.addedAt).toLocaleString(localeTag, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>

                    <label className="space-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide">{model.copy.noteLabel}</span>
                      <textarea
                        rows={3}
                        value={item.note}
                        onChange={(event) => model.onUpdateNote(item.productId, event.target.value)}
                        placeholder={model.copy.notePlaceholder}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </section>
  );
});
