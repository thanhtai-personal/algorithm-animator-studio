"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import type {
  LocalizedText,
  ProductLandingCharmThemeConfig,
} from "@/features/product-landing/config/productLandingThemeCharm";
import type { SettingsShowroomFeaturedProductOptionDto } from "@/types/settingsModule";
import { CHARM_THEME_FIELDS_COPY } from "../constants/showroomThemeCharmFields.constants";
import { LocalizedTextField } from "./LocalizedTextField";

interface SettingsShowroomThemeCharmFieldsProps {
  locale: AppLocale;
  config: ProductLandingCharmThemeConfig;
  onChange: Dispatch<SetStateAction<ProductLandingCharmThemeConfig>>;
  featuredSearch: string;
  setFeaturedSearch: (value: string) => void;
  filteredFeaturedProductOptions: SettingsShowroomFeaturedProductOptionDto[];
  branchId?: string | null;
}

export function SettingsShowroomThemeCharmFields({
  locale,
  config,
  onChange,
  featuredSearch,
  setFeaturedSearch,
  filteredFeaturedProductOptions,
  branchId = null,
}: SettingsShowroomThemeCharmFieldsProps) {
  const copy = CHARM_THEME_FIELDS_COPY[locale];
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const updateLocalized = (
    section: keyof ProductLandingCharmThemeConfig,
    field: string,
    localeKey: "vi" | "en",
    value: string
  ) => {
    onChange((previous) => ({
      ...previous,
      [section]: {
        ...(previous[section] as Record<string, unknown>),
        [field]: {
          ...((previous[section] as Record<string, LocalizedText>)[field] as LocalizedText),
          [localeKey]: value,
        },
      },
    }));
  };

  const parseList = (value: string) =>
    value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);

  const toggleFeaturedProduct = (productId: string) => {
    onChange((previous) => ({
      ...previous,
      featuredProductIds: previous.featuredProductIds.includes(productId)
        ? previous.featuredProductIds.filter((entry) => entry !== productId)
        : [...previous.featuredProductIds, productId],
    }));
  };

  const displayToggleFields: Array<{
    key: keyof ProductLandingCharmThemeConfig["display"];
    label: string;
    checked: boolean;
  }> = [
    {
      key: "showPriceReference",
      label: copy.showPrice,
      checked: config.display.showPriceReference,
    },
    {
      key: "showSalePriceReference",
      label: copy.showSalePrice,
      checked: config.display.showSalePriceReference,
    },
    {
      key: "showDepositReference",
      label: copy.showDeposit,
      checked: config.display.showDepositReference,
    },
    {
      key: "showSuccessfulRentCount",
      label: copy.showSuccessfulRentCount,
      checked: config.display.showSuccessfulRentCount,
    },
    {
      key: "showShortlist",
      label: copy.showShortlist,
      checked: config.display.showShortlist,
    },
  ];

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{copy.title}</h3>
        <p className="text-xs text-muted-foreground">{copy.hint}</p>
      </header>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.meta}</p>
        <LocalizedTextField
          label={copy.pageName}
          value={config.meta.pageName}
          onChange={(localeKey, value) => updateLocalized("meta", "pageName", localeKey, value)}
        />
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.pageLogoUrl}</span>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://..."
              value={config.meta.pageLogoUrl ?? ""}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  meta: {
                    ...previous.meta,
                    pageLogoUrl: event.target.value || null,
                  },
                }))
              }
              onBlur={(event) =>
                onChange((previous) => ({
                  ...previous,
                  meta: {
                    ...previous.meta,
                    pageLogoUrl: event.target.value.trim() || null,
                  },
                }))
              }
              className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
            <button
              type="button"
              disabled={!branchId}
              onClick={() => setIsLogoPickerOpen(true)}
              title={!branchId ? (locale === "vi" ? "Cần chọn chi nhánh trước khi mở thư viện media." : "Select a branch before opening media library.") : undefined}
              className="h-9 shrink-0 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locale === "vi" ? "Chọn từ thư viện" : "Choose from library"}
            </button>
          </div>

          {config.meta.pageLogoUrl ? (
            <div className="mt-2">
              <p className="text-[11px] font-medium text-muted-foreground">{locale === "vi" ? "Xem trước" : "Preview"}</p>
              <div className="mt-1 w-32 overflow-hidden rounded-md border border-border/60 bg-muted/20 p-1">
                <img src={showroomClientService.resolveCoverImageUrl(config.meta.pageLogoUrl) ?? config.meta.pageLogoUrl ?? ""} alt={locale === "vi" ? "Logo xem trước" : "Logo preview"} className="h-16 w-full object-contain" />
              </div>
            </div>
          ) : null}
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.navigation}</p>
        <LocalizedTextField label={copy.navHome} value={config.navigation.homeLabel} onChange={(localeKey, value) => updateLocalized("navigation", "homeLabel", localeKey, value)} />
        <LocalizedTextField label={copy.navShowroom} value={config.navigation.showroomLabel} onChange={(localeKey, value) => updateLocalized("navigation", "showroomLabel", localeKey, value)} />
        <LocalizedTextField label={copy.navBooking} value={config.navigation.bookingLabel} onChange={(localeKey, value) => updateLocalized("navigation", "bookingLabel", localeKey, value)} />
        <LocalizedTextField label={copy.navSearch} value={config.navigation.searchPlaceholder} onChange={(localeKey, value) => updateLocalized("navigation", "searchPlaceholder", localeKey, value)} />
        <LocalizedTextField label={copy.navSignIn} value={config.navigation.signInLabel} onChange={(localeKey, value) => updateLocalized("navigation", "signInLabel", localeKey, value)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.hero}</p>
        <LocalizedTextField label={copy.heroBadge} value={config.hero.badge} onChange={(localeKey, value) => updateLocalized("hero", "badge", localeKey, value)} />
        <LocalizedTextField label={copy.heroLine1} value={config.hero.line1} onChange={(localeKey, value) => updateLocalized("hero", "line1", localeKey, value)} />
        <LocalizedTextField label={copy.heroLine2} value={config.hero.line2} onChange={(localeKey, value) => updateLocalized("hero", "line2", localeKey, value)} />
        <LocalizedTextField label={copy.heroSubtitle} value={config.hero.subtitle} onChange={(localeKey, value) => updateLocalized("hero", "subtitle", localeKey, value)} multiline rows={4} />
        <LocalizedTextField label={copy.heroSearchAction} value={config.hero.searchActionLabel} onChange={(localeKey, value) => updateLocalized("hero", "searchActionLabel", localeKey, value)} />
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.heroImagePath}</span>
          <input
            type="text"
            value={config.hero.heroImagePath ?? ""}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                hero: {
                  ...previous.hero,
                  heroImagePath: event.target.value || null,
                },
              }))
            }
            onBlur={(event) =>
              onChange((previous) => ({
                ...previous,
                hero: {
                  ...previous.hero,
                  heroImagePath: event.target.value.trim() || null,
                },
              }))
            }
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.featured}</p>
        <LocalizedTextField label={copy.featuredTitle} value={config.featured.title} onChange={(localeKey, value) => updateLocalized("featured", "title", localeKey, value)} />
        <LocalizedTextField label={copy.featuredSubtitle} value={config.featured.subtitle} onChange={(localeKey, value) => updateLocalized("featured", "subtitle", localeKey, value)} multiline rows={3} />
        <LocalizedTextField label={copy.featuredShowMore} value={config.featured.showMoreActionLabel} onChange={(localeKey, value) => updateLocalized("featured", "showMoreActionLabel", localeKey, value)} />
        <LocalizedTextField label={copy.featuredRentNow} value={config.featured.rentNowActionLabel} onChange={(localeKey, value) => updateLocalized("featured", "rentNowActionLabel", localeKey, value)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.sectionTitles}</p>
        <LocalizedTextField label={copy.featuresTitle} value={config.features.title} onChange={(localeKey, value) => updateLocalized("features", "title", localeKey, value)} />
        <LocalizedTextField label={copy.featuresSubtitle} value={config.features.subtitle} onChange={(localeKey, value) => updateLocalized("features", "subtitle", localeKey, value)} multiline rows={3} />
        <LocalizedTextField label={copy.testimonialsTitle} value={config.testimonials.title} onChange={(localeKey, value) => updateLocalized("testimonials", "title", localeKey, value)} />
        <LocalizedTextField label={copy.testimonialsSubtitle} value={config.testimonials.subtitle} onChange={(localeKey, value) => updateLocalized("testimonials", "subtitle", localeKey, value)} multiline rows={3} />
        <LocalizedTextField label={copy.ctaTitle} value={config.cta.title} onChange={(localeKey, value) => updateLocalized("cta", "title", localeKey, value)} />
        <LocalizedTextField label={copy.ctaSubtitle} value={config.cta.subtitle} onChange={(localeKey, value) => updateLocalized("cta", "subtitle", localeKey, value)} multiline rows={3} />
        <LocalizedTextField label={copy.ctaAction} value={config.cta.showroomActionLabel} onChange={(localeKey, value) => updateLocalized("cta", "showroomActionLabel", localeKey, value)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.footer}</p>
        <LocalizedTextField label={copy.footerSummary} value={config.footer.summary} onChange={(localeKey, value) => updateLocalized("footer", "summary", localeKey, value)} multiline rows={3} />
        <LocalizedTextField label={copy.footerProductsTitle} value={config.footer.productsTitle} onChange={(localeKey, value) => updateLocalized("footer", "productsTitle", localeKey, value)} />
        <LocalizedTextField label={copy.footerSupportTitle} value={config.footer.supportTitle} onChange={(localeKey, value) => updateLocalized("footer", "supportTitle", localeKey, value)} />
        <LocalizedTextField label={copy.footerContactTitle} value={config.footer.contactTitle} onChange={(localeKey, value) => updateLocalized("footer", "contactTitle", localeKey, value)} />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.vi} - {copy.footerProducts}</span>
            <textarea
              rows={4}
              value={config.footer.products.vi.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    products: {
                      ...previous.footer.products,
                      vi: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.en} - {copy.footerProducts}</span>
            <textarea
              rows={4}
              value={config.footer.products.en.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    products: {
                      ...previous.footer.products,
                      en: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.vi} - {copy.footerSupport}</span>
            <textarea
              rows={4}
              value={config.footer.support.vi.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    support: {
                      ...previous.footer.support,
                      vi: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.en} - {copy.footerSupport}</span>
            <textarea
              rows={4}
              value={config.footer.support.en.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    support: {
                      ...previous.footer.support,
                      en: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.vi} - {copy.footerContactLines}</span>
            <textarea
              rows={4}
              value={config.footer.contactLines.vi.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    contactLines: {
                      ...previous.footer.contactLines,
                      vi: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.en} - {copy.footerContactLines}</span>
            <textarea
              rows={4}
              value={config.footer.contactLines.en.join("\n")}
              onChange={(event) =>
                onChange((previous) => ({
                  ...previous,
                  footer: {
                    ...previous.footer,
                    contactLines: {
                      ...previous.footer.contactLines,
                      en: parseList(event.target.value),
                    },
                  },
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>

        <LocalizedTextField label={copy.footerMadeWith} value={config.footer.madeWith} onChange={(localeKey, value) => updateLocalized("footer", "madeWith", localeKey, value)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.products}</p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayToggleFields.map((entry) => (
            <label
              key={entry.key}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
            >
              <input
                type="checkbox"
                checked={entry.checked}
                onChange={(event) =>
                  onChange((previous) => ({
                    ...previous,
                    display: {
                      ...previous.display,
                      [entry.key]: event.target.checked,
                    },
                  }))
                }
              />
              <span>{entry.label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.featuredProducts}</p>
          <input
            type="search"
            value={featuredSearch}
            onChange={(event) => setFeaturedSearch(event.target.value)}
            placeholder={copy.searchProducts}
            className="h-9 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          />
          <div className="max-h-56 space-y-1 overflow-auto pr-1">
            {filteredFeaturedProductOptions.map((entry) => {
              const checked = config.featuredProductIds.includes(entry.id);
              return (
                <label
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground"
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleFeaturedProduct(entry.id)} />
                  <span className="truncate">{entry.productCode} - {entry.name}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
      <MediaPickerModal
        locale={locale}
        open={isLogoPickerOpen}
        onOpenChange={(open) => setIsLogoPickerOpen(open)}
        branchId={branchId}
        defaultMediaType="image"
        onSelectAsset={(asset) => {
          const selectedUrl = asset.publicUrl;
          if (!selectedUrl) return;
          onChange((previous) => ({
            ...previous,
            meta: {
              ...previous.meta,
              pageLogoUrl: selectedUrl,
            },
          }));
          setIsLogoPickerOpen(false);
        }}
      />
    </section>
  );
}
