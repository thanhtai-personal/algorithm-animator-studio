"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import type {
  LocalizedText,
  ProductLandingModernThemeConfig,
} from "@/features/product-landing/config/productLandingThemeModern";
import type { SettingsShowroomFeaturedProductOptionDto } from "@/types/settingsModule";
import { MODERN_THEME_FIELDS_COPY } from "../constants/showroomThemeModernFields.constants";
import { LocalizedTextField } from "./LocalizedTextField";

interface SettingsShowroomThemeModernFieldsProps {
  locale: AppLocale;
  config: ProductLandingModernThemeConfig;
  onChange: Dispatch<SetStateAction<ProductLandingModernThemeConfig>>;
  featuredSearch: string;
  setFeaturedSearch: (value: string) => void;
  filteredFeaturedProductOptions: SettingsShowroomFeaturedProductOptionDto[];
  branchId?: string | null;
}

export function SettingsShowroomThemeModernFields({
  locale,
  config,
  onChange,
  featuredSearch,
  setFeaturedSearch,
  filteredFeaturedProductOptions,
  branchId = null,
}: SettingsShowroomThemeModernFieldsProps) {
  const copy = MODERN_THEME_FIELDS_COPY[locale];
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const updateLocalized = (
    section: keyof ProductLandingModernThemeConfig,
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
    key: keyof ProductLandingModernThemeConfig["display"];
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
        <LocalizedTextField
          label={copy.seoDescription}
          value={config.meta.seoDescription}
          onChange={(localeKey, value) =>
            updateLocalized("meta", "seoDescription", localeKey, value)
          }
          multiline
          rows={4}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.navigation}</p>
        <LocalizedTextField label={copy.navHome} value={config.navigation.homeLabel} onChange={(l, v) => updateLocalized("navigation", "homeLabel", l, v)} />
        <LocalizedTextField label={copy.navShowroom} value={config.navigation.showroomLabel} onChange={(l, v) => updateLocalized("navigation", "showroomLabel", l, v)} />
        <LocalizedTextField label={copy.navBooking} value={config.navigation.bookingLabel} onChange={(l, v) => updateLocalized("navigation", "bookingLabel", l, v)} />
        <LocalizedTextField label={copy.navCart} value={config.navigation.cartLabel} onChange={(l, v) => updateLocalized("navigation", "cartLabel", l, v)} />
        <LocalizedTextField label={copy.navAuth} value={config.navigation.authActionLabel} onChange={(l, v) => updateLocalized("navigation", "authActionLabel", l, v)} />
        <LocalizedTextField label={copy.navSearch} value={config.navigation.searchPlaceholder} onChange={(l, v) => updateLocalized("navigation", "searchPlaceholder", l, v)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.hero}</p>
        <LocalizedTextField label={copy.heroBadge} value={config.hero.badge} onChange={(l, v) => updateLocalized("hero", "badge", l, v)} />
        <LocalizedTextField label={copy.heroLine1} value={config.hero.line1} onChange={(l, v) => updateLocalized("hero", "line1", l, v)} />
        <LocalizedTextField label={copy.heroLine2} value={config.hero.line2} onChange={(l, v) => updateLocalized("hero", "line2", l, v)} />
        <LocalizedTextField label={copy.heroSubtitle} value={config.hero.subtitle} onChange={(l, v) => updateLocalized("hero", "subtitle", l, v)} multiline rows={4} />
        <LocalizedTextField label={copy.heroPrimaryAction} value={config.hero.primaryActionLabel} onChange={(l, v) => updateLocalized("hero", "primaryActionLabel", l, v)} />
        <LocalizedTextField label={copy.heroSecondaryAction} value={config.hero.secondaryActionLabel} onChange={(l, v) => updateLocalized("hero", "secondaryActionLabel", l, v)} />
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.sections}</p>
        <LocalizedTextField label={copy.productsLabel} value={config.products.label} onChange={(l, v) => updateLocalized("products", "label", l, v)} />
        <LocalizedTextField label={copy.productsTitle} value={config.products.title} onChange={(l, v) => updateLocalized("products", "title", l, v)} />
        <LocalizedTextField label={copy.productsShowMore} value={config.products.showMoreActionLabel} onChange={(l, v) => updateLocalized("products", "showMoreActionLabel", l, v)} />

        <LocalizedTextField label={copy.featuresLabel} value={config.features.label} onChange={(l, v) => updateLocalized("features", "label", l, v)} />
        <LocalizedTextField label={copy.featuresTitle} value={config.features.title} onChange={(l, v) => updateLocalized("features", "title", l, v)} />

        <LocalizedTextField label={copy.testimonialsLabel} value={config.testimonials.label} onChange={(l, v) => updateLocalized("testimonials", "label", l, v)} />
        <LocalizedTextField label={copy.testimonialsTitle} value={config.testimonials.title} onChange={(l, v) => updateLocalized("testimonials", "title", l, v)} />

        <LocalizedTextField label={copy.ctaTitle} value={config.cta.title} onChange={(l, v) => updateLocalized("cta", "title", l, v)} />
        <LocalizedTextField label={copy.ctaSubtitle} value={config.cta.subtitle} onChange={(l, v) => updateLocalized("cta", "subtitle", l, v)} multiline rows={3} />
        <LocalizedTextField label={copy.ctaAction} value={config.cta.actionLabel} onChange={(l, v) => updateLocalized("cta", "actionLabel", l, v)} />

        <LocalizedTextField label={copy.footerSummary} value={config.footer.summary} onChange={(l, v) => updateLocalized("footer", "summary", l, v)} multiline rows={3} />
        <LocalizedTextField label={copy.footerLinksTitle} value={config.footer.linksTitle} onChange={(l, v) => updateLocalized("footer", "linksTitle", l, v)} />
        <LocalizedTextField label={copy.footerSupportTitle} value={config.footer.supportTitle} onChange={(l, v) => updateLocalized("footer", "supportTitle", l, v)} />
        <LocalizedTextField label={copy.footerAddress} value={config.footer.address} onChange={(l, v) => updateLocalized("footer", "address", l, v)} multiline rows={2} />

        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.footerPhone}</span>
          <input
            type="text"
            value={config.footer.phone}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                footer: {
                  ...previous.footer,
                  phone: event.target.value,
                },
              }))
            }
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.footerEmail}</span>
          <input
            type="email"
            value={config.footer.email}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                footer: {
                  ...previous.footer,
                  email: event.target.value,
                },
              }))
            }
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <LocalizedTextField label={copy.footerCopyright} value={config.footer.copyright} onChange={(l, v) => updateLocalized("footer", "copyright", l, v)} />

        <div className="grid gap-3 md:grid-cols-2">
          {(["vi", "en"] as const).map((localeKey) => (
            <label key={`links-${localeKey}`} className="space-y-1 text-xs text-muted-foreground">
              <span>{localeKey.toUpperCase()} - {copy.footerLinks}</span>
              <textarea
                rows={4}
                value={config.footer.links[localeKey].join("\n")}
                onChange={(event) =>
                  onChange((previous) => ({
                    ...previous,
                    footer: {
                      ...previous.footer,
                      links: {
                        ...previous.footer.links,
                        [localeKey]: parseList(event.target.value),
                      },
                    },
                  }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(["vi", "en"] as const).map((localeKey) => (
            <label key={`support-${localeKey}`} className="space-y-1 text-xs text-muted-foreground">
              <span>{localeKey.toUpperCase()} - {copy.footerSupportItems}</span>
              <textarea
                rows={4}
                value={config.footer.supportItems[localeKey].join("\n")}
                onChange={(event) =>
                  onChange((previous) => ({
                    ...previous,
                    footer: {
                      ...previous.footer,
                      supportItems: {
                        ...previous.footer.supportItems,
                        [localeKey]: parseList(event.target.value),
                      },
                    },
                  }))
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.products}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {displayToggleFields.map((field) => (
            <label
              key={field.key}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground"
            >
              <input
                type="checkbox"
                checked={field.checked}
                onChange={(event) =>
                  onChange((previous) => ({
                    ...previous,
                    display: {
                      ...previous.display,
                      [field.key]: event.target.checked,
                    },
                  }))
                }
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>

        <label className="space-y-1 text-xs text-muted-foreground">
          <span>{copy.searchProducts}</span>
          <input
            type="search"
            value={featuredSearch}
            onChange={(event) => setFeaturedSearch(event.target.value)}
            className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </label>

        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-3">
          {filteredFeaturedProductOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">-</p>
          ) : (
            filteredFeaturedProductOptions.map((entry) => {
              const checked = config.featuredProductIds.includes(entry.id);
              return (
                <label
                  key={entry.id}
                  className="flex items-start gap-2 rounded-lg border border-border/60 px-2 py-2 text-xs text-foreground"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeaturedProduct(entry.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-semibold">
                      {entry.productCode} - {entry.name}
                    </span>
                    <span className="block text-muted-foreground">{entry.categoryName ?? "-"}</span>
                  </span>
                </label>
              );
            })
          )}
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
