"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import type { useShowroomListPage } from "@/features/showroom/hooks/useShowroomListPage";
import type { ShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { cn } from "@/utils/className";
import { formatMoney } from "@/utils/format/money";
import styles from "./ShowroomProductHomeV1.module.css";

type ShowroomListPageModel = ReturnType<typeof useShowroomListPage>;

interface ShowroomProductHomeV1Props {
  locale: AppLocale;
  model: ShowroomListPageModel;
  themeVariant: ShowroomThemeVariant;
}

interface ShowroomFilterPanelProps {
  model: ShowroomListPageModel;
  theme: ShowroomThemeTokens;
  onClose?: () => void;
}

interface ShowroomThemeTokens {
  pageClass: string;
  heroFrameClass: string;
  heroOverlayStyle: CSSProperties;
  heroGlowStyle: CSSProperties;
  heroTextStyle: CSSProperties;
  heroMutedStyle: CSSProperties;
  accentTextClass: string;
  surfaceCardClass: string;
  productCardClass: string;
  shortlistCardClass: string;
}

const SHOWROOM_THEME_TOKENS: Record<ShowroomThemeVariant, ShowroomThemeTokens> = {
  default: {
    pageClass: "bg-gradient-background",
    heroFrameClass: "border-border shadow-[var(--showroom-hero-shadow)]",
    heroOverlayStyle: { background: "var(--showroom-hero-overlay)" },
    heroGlowStyle: { background: "var(--showroom-hero-glow)" },
    heroTextStyle: { color: "var(--showroom-hero-text)" },
    heroMutedStyle: { color: "var(--showroom-hero-muted)" },
    accentTextClass: "text-primary",
    surfaceCardClass: "border-border bg-card shadow-sm",
    productCardClass: "border-border bg-card shadow-sm hover:shadow-md",
    shortlistCardClass: "border-border bg-card shadow-sm",
  },
  charm: {
    pageClass:
      "bg-[radial-gradient(circle_at_18%_10%,hsl(var(--primary)/0.2),transparent_52%),radial-gradient(circle_at_90%_15%,hsl(var(--accent)/0.18),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    heroFrameClass:
      "border-[hsl(var(--primary)/0.28)] shadow-[0_28px_55px_-28px_hsl(var(--primary)/0.4)]",
    heroOverlayStyle: {
      background:
        "linear-gradient(130deg,hsl(var(--primary)/0.88)_8%,hsl(var(--accent)/0.74)_58%,hsl(var(--secondary)/0.66)_100%)",
    },
    heroGlowStyle: {
      background:
        "radial-gradient(circle_at_15%_12%,hsl(var(--primary)/0.36),transparent_48%),radial-gradient(circle_at_84%_85%,hsl(var(--accent)/0.24),transparent_52%)",
    },
    heroTextStyle: { color: "hsl(var(--primary-foreground))" },
    heroMutedStyle: { color: "hsl(var(--primary-foreground) / 0.86)" },
    accentTextClass: "text-[hsl(var(--primary-foreground))]",
    surfaceCardClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_14px_36px_-28px_hsl(var(--primary)/0.32)]",
    productCardClass:
      "border-[hsl(var(--border)/0.7)] bg-[hsl(var(--card)/0.96)] shadow-[0_20px_36px_-30px_hsl(var(--primary)/0.3)] hover:shadow-[0_24px_42px_-28px_hsl(var(--primary)/0.36)]",
    shortlistCardClass:
      "border-[hsl(var(--border)/0.7)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_32px_-26px_hsl(var(--primary)/0.3)]",
  },
  modern: {
    pageClass:
      "bg-[radial-gradient(circle_at_25%_10%,hsl(var(--secondary)/0.22),transparent_52%),radial-gradient(circle_at_80%_18%,hsl(var(--primary)/0.16),transparent_44%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))]",
    heroFrameClass:
      "border-[hsl(var(--primary)/0.28)] shadow-[0_26px_52px_-30px_hsl(var(--primary)/0.4)]",
    heroOverlayStyle: {
      background:
        "linear-gradient(120deg,hsl(var(--foreground)/0.84)_10%,hsl(var(--secondary-foreground)/0.74)_54%,hsl(var(--primary)/0.7)_100%)",
    },
    heroGlowStyle: {
      background:
        "radial-gradient(circle_at_16%_16%,hsl(var(--primary)/0.3),transparent_50%),radial-gradient(circle_at_86%_84%,hsl(var(--accent)/0.2),transparent_56%)",
    },
    heroTextStyle: { color: "hsl(var(--primary-foreground))" },
    heroMutedStyle: { color: "hsl(var(--primary-foreground) / 0.86)" },
    accentTextClass: "text-[hsl(var(--showroom-hero-highlight))]",
    surfaceCardClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_34px_-28px_hsl(var(--primary)/0.3)]",
    productCardClass:
      "border-[hsl(var(--border)/0.7)] bg-[hsl(var(--card)/0.96)] shadow-[0_22px_38px_-32px_hsl(var(--primary)/0.3)] hover:shadow-[0_24px_42px_-30px_hsl(var(--primary)/0.36)]",
    shortlistCardClass:
      "border-[hsl(var(--border)/0.75)] bg-[hsl(var(--card)/0.95)] shadow-[0_16px_32px_-26px_hsl(var(--primary)/0.28)]",
  },
  showcase3d: {
    pageClass:
      "bg-[radial-gradient(circle_at_10%_5%,hsl(var(--kata-primary)/0.16),transparent_46%),radial-gradient(circle_at_92%_18%,hsl(var(--kata-gold-light)/0.14),transparent_35%),linear-gradient(180deg,hsl(var(--kata-background)),hsl(var(--kata-background)))]",
    heroFrameClass:
      "border-[hsl(var(--kata-primary)/0.28)] shadow-[0_28px_58px_-34px_hsl(var(--kata-primary)/0.42)]",
    heroOverlayStyle: {
      background:
        "linear-gradient(130deg,hsl(var(--kata-background)/0.96)_12%,hsl(var(--kata-card)/0.92)_52%,hsl(var(--kata-primary)/0.24)_100%)",
    },
    heroGlowStyle: {
      background:
        "radial-gradient(circle_at_16%_22%,hsl(var(--kata-gold-light)/0.24),transparent_50%),radial-gradient(circle_at_86%_86%,hsl(var(--kata-primary)/0.18),transparent_54%)",
    },
    heroTextStyle: { color: "hsl(var(--kata-foreground))" },
    heroMutedStyle: { color: "hsl(var(--kata-muted-foreground))" },
    accentTextClass: "text-[hsl(var(--kata-primary))]",
    surfaceCardClass:
      "border-[hsl(var(--kata-border)/0.55)] bg-[hsl(var(--kata-card)/0.88)] shadow-[0_18px_40px_-34px_hsl(var(--kata-primary)/0.36)] backdrop-blur-xl",
    productCardClass:
      "border-[hsl(var(--kata-border)/0.6)] bg-[hsl(var(--kata-card)/0.92)] shadow-[0_22px_42px_-32px_hsl(var(--kata-primary)/0.34)] backdrop-blur-xl hover:shadow-[0_24px_46px_-30px_hsl(var(--kata-primary)/0.42)]",
    shortlistCardClass:
      "border-[hsl(var(--kata-border)/0.55)] bg-[hsl(var(--kata-card)/0.88)] shadow-[0_18px_36px_-28px_hsl(var(--kata-primary)/0.34)] backdrop-blur-xl",
  },
};

function splitHeroHeading(heading: string): { baseLine: string; accentLine: string | null } {
  const normalized = heading.replace(/<br\s*\/?>/gi, "\n").trim();
  if (!normalized) {
    return { baseLine: "", accentLine: null };
  }

  const lineParts = normalized
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (lineParts.length > 1) {
    return {
      baseLine: lineParts[0],
      accentLine: lineParts.slice(1).join(" "),
    };
  }

  const splitKeyword = normalized.includes(" cho ")
    ? " cho "
    : normalized.includes(" for ")
      ? " for "
      : null;
  if (splitKeyword) {
    const splitIndex = normalized.indexOf(splitKeyword);
    const baseLine = normalized.slice(0, splitIndex).trim();
    const accentPart = normalized.slice(splitIndex + splitKeyword.length).trim();
    const accentPrefix = splitKeyword.trim();
    if (baseLine && accentPart) {
      return {
        baseLine,
        accentLine: `${accentPrefix} ${accentPart}`,
      };
    }

    return {
      baseLine: normalized,
      accentLine: null,
    };
  }

  const words = normalized.split(/\s+/);
  if (words.length >= 5) {
    const splitIndex = Math.max(2, words.length - 3);
    return {
      baseLine: words.slice(0, splitIndex).join(" "),
      accentLine: words.slice(splitIndex).join(" "),
    };
  }

  return { baseLine: normalized, accentLine: null };
}

function ShowroomFilterPanel({ model, theme, onClose }: ShowroomFilterPanelProps) {
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const filteredCategories = useMemo(() => {
    const keyword = categorySearchInput.trim().toLowerCase();
    if (!keyword) return model.categories;

    return model.categories.filter((entry) => entry.name.toLowerCase().includes(keyword));
  }, [categorySearchInput, model.categories]);

  const hasActiveFilter =
    model.searchInput.trim().length > 0 ||
    model.productCategoryIds.length > 0 ||
    Boolean(model.tagId) ||
    model.genders.length > 0 ||
    model.sizes.length > 0;

  return (
    <div className={cn("space-y-4 rounded-3xl p-4 md:p-5", theme.surfaceCardClass)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{model.copy.filtersTitle}</h2>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground"
          >
            {model.copy.closeFilters}
          </button>
        ) : null}
      </div>

      {model.viewConfig.filters.textSearch ? (
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.searchLabel}</span>
          <input
            type="search"
            value={model.searchInput}
            onChange={(event) => model.setSearchInput(event.target.value)}
            placeholder={model.copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
      ) : null}

      {model.viewConfig.filters.category ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.allCategories}</span>
          <input
            type="search"
            value={categorySearchInput}
            onChange={(event) => setCategorySearchInput(event.target.value)}
            placeholder={model.copy.categorySearchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />

          <div className="max-h-44 space-y-1 overflow-auto rounded-xl border border-border bg-background p-2">
            {filteredCategories.length === 0 ? (
              <p className="px-2 py-1 text-xs text-muted-foreground">{model.copy.noCategoryMatches}</p>
            ) : (
              filteredCategories.map((entry) => (
                <label
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={model.productCategoryIds.includes(entry.id)}
                    onChange={() => model.toggleProductCategoryId(entry.id)}
                  />
                  <span>{entry.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      ) : null}

      {model.viewConfig.filters.tag ? (
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.allTags}</span>
          <select
            value={model.tagId}
            onChange={(event) => model.setTagId(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="">{model.copy.allTags}</option>
            {model.tags.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {model.viewConfig.filters.gender ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.allGenders}</span>
          <div className="flex flex-wrap gap-2">
            {model.genderOptions.map((entry) => {
              const isActive = model.genders.includes(entry.value);

              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => model.toggleGender(entry.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {entry.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {model.viewConfig.filters.size ? (
        <div className="space-y-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wide">{model.copy.allSizes}</span>
          {model.sizeOptions.length === 0 ? (
            <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              -
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {model.sizeOptions.map((entry) => {
                const isActive = model.sizes.includes(entry);

                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => model.toggleSize(entry)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={model.clearFilters}
        disabled={!hasActiveFilter}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground disabled:opacity-60"
      >
        {model.copy.clearFilters}
      </button>
    </div>
  );
}

function ShowroomProductCard({ locale, model, theme, product }: {
  locale: AppLocale;
  model: ShowroomListPageModel;
  theme: ShowroomThemeTokens;
  product: ShowroomListPageModel["listItems"][number];
}) {
  const productDetailHref = model.detailPath(product.id);
  const rentPriceReference =
    product.rentPricePerDay ??
    product.pricePlan.pricePerDay ??
    product.pricePlan.price1d;
  const genderLabel = product.gender
    ? model.genderOptions.find((entry) => entry.value === product.gender)?.label ?? product.gender
    : null;
  const newBadgeLabel = locale === "vi" ? "Mới" : "New";
  const rentLabel = locale === "vi" ? "Giá thuê" : "Rental price";
  const rentPriceLabel = formatMoney(rentPriceReference, {
    locale,
    currency: "VND",
    maximumFractionDigits: 0,
  });

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_18px_40px_-26px_hsl(var(--foreground)/0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-26px_hsl(var(--foreground)/0.5)]",
        theme.productCardClass
      )}
    >
      <Link
        href={productDetailHref}
        aria-label={`${model.copy.viewDetail}: ${product.title}`}
        className="absolute inset-0 z-10"
      />

      <div className="relative overflow-hidden bg-muted">
        <div className="relative aspect-[4/5] w-full">
          {product.coverImageUrl ? (
            <img
              src={product.coverImageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              {model.copy.noImage}
            </div>
          )}
        </div>

        <span className="absolute left-4 top-4 rounded-full bg-[linear-gradient(135deg,#f4bd4a,#d88714)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
          {newBadgeLabel}
        </span>
      </div>

      <div className="grid min-h-[11rem] grid-rows-[1fr_auto] bg-card p-5">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {product.categoryName ?? "-"}
            </p>
            {genderLabel ? (
              <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {genderLabel}
              </span>
            ) : null}
          </div>
          <p className="text-xl font-semibold leading-tight text-foreground">
            {product.title}
          </p>
          <p className="line-clamp-1 text-sm italic text-muted-foreground">{product.material ?? "-"}</p>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {rentLabel}
            </p>
            {model.viewConfig.display.showPriceReference && product.isRentable ? (
              <p className="mt-1 text-lg font-bold text-[#d98d1f]">
                {rentPriceLabel || "-"}
              </p>
            ) : null}
          </div>
          {model.viewConfig.display.showShortlist ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const wasShortlisted = product.isShortlisted;
                model.toggleShortlist(product.id);
                if (!wasShortlisted) {
                  toast.success(
                    locale === "vi"
                      ? "Đã thêm vào giỏ hàng thành công."
                      : "Added to cart successfully."
                  );
                }
              }}
              className={`relative z-20 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_22px_-12px_rgba(216,137,24,0.9)] transition hover:-translate-y-0.5 ${
                product.isShortlisted
                  ? "bg-[linear-gradient(135deg,#c57913,#9f5f0f)]"
                  : "bg-[linear-gradient(135deg,#f4bd4a,#d88714)]"
              }`}
              aria-label={product.isShortlisted ? model.copy.shortlistRemove : model.copy.shortlistAdd}
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ShowroomProductHomeV1({ locale, model, themeVariant }: ShowroomProductHomeV1Props) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const theme = SHOWROOM_THEME_TOKENS[themeVariant];
  const isShowcase3d = themeVariant === "showcase3d";
  const isGlobalHomepage = !model.viewConfig.branchId;
  const showDesktopGlobalAmbient = isGlobalHomepage && !isShowcase3d;

  const isInitialLoading = model.listQuery.isFetching && model.listItems.length === 0;
  const hasInitialError = model.listQuery.isError && model.listItems.length === 0;
  const errorMessage =
    model.listQuery.error instanceof Error ? model.listQuery.error.message : model.copy.empty;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (model.searchInput.trim()) count += 1;
    count += model.productCategoryIds.length;
    if (model.tagId) count += 1;
    count += model.genders.length;
    count += model.sizes.length;
    return count;
  }, [model.genders.length, model.productCategoryIds.length, model.searchInput, model.sizes.length, model.tagId]);
  const heroHeading = useMemo(
    () => splitHeroHeading(model.viewConfig.hero.heading),
    [model.viewConfig.hero.heading]
  );
  const paginationItems = useMemo<Array<number | "start-ellipsis" | "end-ellipsis">>(() => {
    const totalPages = model.totalPages;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | "start-ellipsis" | "end-ellipsis"> = [1];
    const middleStart = Math.max(2, model.page - 1);
    const middleEnd = Math.min(totalPages - 1, model.page + 1);

    if (middleStart > 2) {
      items.push("start-ellipsis");
    }

    for (let page = middleStart; page <= middleEnd; page += 1) {
      items.push(page);
    }

    if (middleEnd < totalPages - 1) {
      items.push("end-ellipsis");
    }

    items.push(totalPages);
    return items;
  }, [model.page, model.totalPages]);

  return (
    <div className={cn("min-h-screen pb-10", theme.pageClass, styles.pageRoot)}>
      {showDesktopGlobalAmbient ? (
        <div className={styles.desktopAmbient} aria-hidden>
          <span className={`${styles.desktopAmbientOrb} ${styles.desktopAmbientOrbOne}`} />
          <span className={`${styles.desktopAmbientOrb} ${styles.desktopAmbientOrbTwo}`} />
          <span className={`${styles.desktopAmbientOrb} ${styles.desktopAmbientOrbThree}`} />
          <span className={`${styles.desktopAmbientLine} ${styles.desktopAmbientLineOne}`} />
          <span className={`${styles.desktopAmbientLine} ${styles.desktopAmbientLineTwo}`} />
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 md:py-10">
        

        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              isShowcase3d
                ? "text-[hsl(var(--kata-muted-foreground))]"
                : "text-muted-foreground"
            )}
          >
            {model.listTotal} {model.copy.productCount}
          </p>

          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold md:hidden",
              isShowcase3d
                ? "border-[hsl(var(--kata-primary)/0.35)] bg-[hsl(var(--kata-primary)/0.12)] text-[hsl(var(--kata-foreground))]"
                : "border-border text-foreground"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {model.copy.openFilters}
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px,1fr] xl:gap-6">
          <aside className={cn("hidden lg:block", styles.filterSidebar)}>
            <div className={styles.filterSticky}>
              <ShowroomFilterPanel model={model} theme={theme} />
            </div>
          </aside>

          <section className={cn("space-y-4 rounded-3xl p-4 md:p-5", theme.surfaceCardClass)}>
            <h2 className="text-sm font-semibold text-foreground">{model.copy.resultsTitle}</h2>

            {isInitialLoading ? (
              <p className="text-sm text-muted-foreground">{model.copy.loading}</p>
            ) : null}

            {hasInitialError ? (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => model.listQuery.refetch()}
                  className="mt-2 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {model.copy.retry}
                </button>
              </div>
            ) : null}

            {!isInitialLoading && !hasInitialError && model.listItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-10 text-center">
                <p className="text-lg font-semibold text-foreground">{model.copy.noProductsTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{model.copy.noProductsHint}</p>
              </div>
            ) : null}

            {model.listItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {model.listItems.map((product) => (
                  <ShowroomProductCard
                    key={product.id}
                    locale={locale}
                    model={model}
                    theme={theme}
                    product={product}
                  />
                ))}
              </div>
            ) : null}

            {model.totalPages > 1 ? (
              <div className="flex justify-center pt-1">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={model.goToPreviousPage}
                    disabled={!model.hasPreviousPage || model.listQuery.isFetching}
                    className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
                  >
                    {model.copy.paginationPrevious}
                  </button>

                  {paginationItems.map((entry, index) => {
                    if (entry === "start-ellipsis" || entry === "end-ellipsis") {
                      return (
                        <span
                          key={`${entry}-${index}`}
                          className="px-1 text-sm font-semibold text-muted-foreground"
                        >
                          ...
                        </span>
                      );
                    }

                    const active = model.page === entry;
                    return (
                      <button
                        key={`page-${entry}`}
                        type="button"
                        onClick={() => model.goToPage(entry)}
                        disabled={model.listQuery.isFetching}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "h-9 min-w-9 rounded-xl border px-3 text-sm font-semibold disabled:opacity-60",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-foreground"
                        )}
                      >
                        {entry}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={model.goToNextPage}
                    disabled={!model.hasNextPage || model.listQuery.isFetching}
                    className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
                  >
                    {model.copy.paginationNext}
                  </button>

                  <span className="w-full text-center text-xs text-muted-foreground sm:w-auto sm:pl-2">
                    {model.copy.paginationPageLabel} {model.page}/{model.totalPages}
                  </span>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {model.viewConfig.display.showShortlist && model.viewConfig.hero.showShortlistCta ? (
          <section className={cn("rounded-3xl p-4 md:p-5", theme.shortlistCardClass)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {model.copy.shortlistTitle} ({model.shortlistCount})
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">{model.copy.shortlistHint}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={model.shortlistPath}
                  className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground"
                >
                  {model.copy.viewShortlist}
                </Link>
                {model.shortlistCount > 0 ? (
                  <button
                    type="button"
                    onClick={model.clearShortlist}
                    className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground"
                  >
                    {model.copy.clearShortlist}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <DrawerFormShell
        open={filterDrawerOpen}
        title={model.copy.filtersTitle}
        onOpenChange={setFilterDrawerOpen}
        widthClassName="max-w-md"
      >
        <ShowroomFilterPanel
          model={model}
          theme={theme}
          onClose={() => setFilterDrawerOpen(false)}
        />
      </DrawerFormShell>
    </div>
  );
}
