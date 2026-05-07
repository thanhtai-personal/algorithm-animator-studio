"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import type {
  LocalizedText,
  ProductLanding3DThemeConfig,
} from "@/features/product-landing/config/productLandingTheme3D";
import type { SettingsShowroomFeaturedProductOptionDto } from "@/types/settingsModule";
import { THREE_D_THEME_FIELDS_COPY } from "../constants/showroomTheme3DFields.constants";
import { LocalizedTextField } from "./LocalizedTextField";

interface SettingsShowroomTheme3DFieldsProps {
  locale: AppLocale;
  config: ProductLanding3DThemeConfig;
  onChange: Dispatch<SetStateAction<ProductLanding3DThemeConfig>>;
  featuredSearch: string;
  setFeaturedSearch: (value: string) => void;
  filteredFeaturedProductOptions: SettingsShowroomFeaturedProductOptionDto[];
  branchId?: string | null;
}

export function SettingsShowroomTheme3DFields({
  locale,
  config,
  onChange,
  featuredSearch,
  setFeaturedSearch,
  filteredFeaturedProductOptions,
  branchId = null,
}: SettingsShowroomTheme3DFieldsProps) {
  const copy = THREE_D_THEME_FIELDS_COPY[locale];
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const updateLocalized = (
    section: keyof ProductLanding3DThemeConfig,
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
        <LocalizedTextField label={copy.navLogin} value={config.navigation.loginLabel} onChange={(l, v) => updateLocalized("navigation", "loginLabel", l, v)} />
        <LocalizedTextField label={copy.navSearch} value={config.navigation.searchPlaceholder} onChange={(l, v) => updateLocalized("navigation", "searchPlaceholder", l, v)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.hero}</p>
        <LocalizedTextField label={copy.heroBadge} value={config.hero.badge} onChange={(l, v) => updateLocalized("hero", "badge", l, v)} />
        <LocalizedTextField label={copy.heroLine1} value={config.hero.line1} onChange={(l, v) => updateLocalized("hero", "line1", l, v)} />
        <LocalizedTextField label={copy.heroHighlight} value={config.hero.highlight} onChange={(l, v) => updateLocalized("hero", "highlight", l, v)} />
        <LocalizedTextField label={copy.heroLine3} value={config.hero.line3} onChange={(l, v) => updateLocalized("hero", "line3", l, v)} />
        <LocalizedTextField label={copy.heroSubtitle} value={config.hero.subtitle} onChange={(l, v) => updateLocalized("hero", "subtitle", l, v)} multiline rows={4} />
        <LocalizedTextField label={copy.heroPrimaryAction} value={config.hero.primaryActionLabel} onChange={(l, v) => updateLocalized("hero", "primaryActionLabel", l, v)} />
        <LocalizedTextField label={copy.heroSecondaryAction} value={config.hero.secondaryActionLabel} onChange={(l, v) => updateLocalized("hero", "secondaryActionLabel", l, v)} />
        <LocalizedTextField label={copy.heroFeaturedLabel} value={config.hero.featuredLabel} onChange={(l, v) => updateLocalized("hero", "featuredLabel", l, v)} />
        <LocalizedTextField label={copy.heroFeaturedName} value={config.hero.featuredName} onChange={(l, v) => updateLocalized("hero", "featuredName", l, v)} />
        <LocalizedTextField label={copy.heroFeaturedPrice} value={config.hero.featuredPrice} onChange={(l, v) => updateLocalized("hero", "featuredPrice", l, v)} />
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.collection}</p>
        <LocalizedTextField label={copy.collectionLabel} value={config.collection.label} onChange={(l, v) => updateLocalized("collection", "label", l, v)} />
        <LocalizedTextField label={copy.collectionTitle} value={config.collection.title} onChange={(l, v) => updateLocalized("collection", "title", l, v)} />
        <LocalizedTextField label={copy.collectionHighlight} value={config.collection.highlight} onChange={(l, v) => updateLocalized("collection", "highlight", l, v)} />
        <LocalizedTextField label={copy.collectionAction} value={config.collection.actionLabel} onChange={(l, v) => updateLocalized("collection", "actionLabel", l, v)} />
        <LocalizedTextField label={copy.productAction} value={config.collection.productActionLabel} onChange={(l, v) => updateLocalized("collection", "productActionLabel", l, v)} />
        <LocalizedTextField label={copy.productPerDay} value={config.collection.productPerDayLabel} onChange={(l, v) => updateLocalized("collection", "productPerDayLabel", l, v)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.services}</p>
        <LocalizedTextField label={copy.servicesLabel} value={config.services.label} onChange={(l, v) => updateLocalized("services", "label", l, v)} />
        <LocalizedTextField label={copy.whyChoosePrefix} value={config.services.whyChoosePrefix} onChange={(l, v) => updateLocalized("services", "whyChoosePrefix", l, v)} />
        <LocalizedTextField label={copy.reviewsLabel} value={config.reviews.label} onChange={(l, v) => updateLocalized("reviews", "label", l, v)} />
        <LocalizedTextField label={copy.reviewsTitle1} value={config.reviews.titleLine1} onChange={(l, v) => updateLocalized("reviews", "titleLine1", l, v)} />
        <LocalizedTextField label={copy.reviewsTitle2} value={config.reviews.titleLine2} onChange={(l, v) => updateLocalized("reviews", "titleLine2", l, v)} />
        <LocalizedTextField label={copy.ctaTitle1} value={config.cta.titleLine1} onChange={(l, v) => updateLocalized("cta", "titleLine1", l, v)} />
        <LocalizedTextField label={copy.ctaHighlight} value={config.cta.titleHighlight} onChange={(l, v) => updateLocalized("cta", "titleHighlight", l, v)} />
        <LocalizedTextField label={copy.ctaSubtitle} value={config.cta.subtitle} onChange={(l, v) => updateLocalized("cta", "subtitle", l, v)} multiline rows={4} />
        <LocalizedTextField label={copy.ctaPrimary} value={config.cta.primaryActionLabel} onChange={(l, v) => updateLocalized("cta", "primaryActionLabel", l, v)} />
        <LocalizedTextField label={copy.ctaSecondary} value={config.cta.secondaryActionLabel} onChange={(l, v) => updateLocalized("cta", "secondaryActionLabel", l, v)} />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.footer}</p>
        <LocalizedTextField label={copy.categoriesTitle} value={config.footer.categoriesTitle} onChange={(l, v) => updateLocalized("footer", "categoriesTitle", l, v)} />
        <LocalizedTextField label={copy.supportTitle} value={config.footer.supportTitle} onChange={(l, v) => updateLocalized("footer", "supportTitle", l, v)} />
        <LocalizedTextField label={copy.contactTitle} value={config.footer.contactTitle} onChange={(l, v) => updateLocalized("footer", "contactTitle", l, v)} />
        <LocalizedTextField label={copy.contactAddress} value={config.footer.contactAddress} onChange={(l, v) => updateLocalized("footer", "contactAddress", l, v)} multiline rows={2} />
        <LocalizedTextField label={copy.summary} value={config.footer.summary} onChange={(l, v) => updateLocalized("footer", "summary", l, v)} multiline rows={3} />
        <LocalizedTextField label={copy.copyright} value={config.footer.copyright} onChange={(l, v) => updateLocalized("footer", "copyright", l, v)} />
        <div className="grid gap-3 md:grid-cols-2">
          {(["vi", "en"] as const).map((localeKey) => (
            <label key={`categories-${localeKey}`} className="space-y-1 text-xs text-muted-foreground">
              <span>{localeKey.toUpperCase()} - {copy.categories}</span>
              <textarea
                rows={4}
                value={config.footer.categories[localeKey].join("\n")}
                onChange={(event) =>
                  onChange((previous) => ({
                    ...previous,
                    footer: {
                      ...previous.footer,
                      categories: {
                        ...previous.footer.categories,
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
              <span>{localeKey.toUpperCase()} - {copy.supportItems}</span>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.stats}</p>
        {config.stats.map((entry, index) => (
          <div key={`stat-${index}`} className="space-y-2 rounded-xl border border-border bg-background p-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>{copy.statValue}</span>
                <input type="number" value={entry.value} onChange={(event) => onChange((previous) => ({ ...previous, stats: previous.stats.map((row, rowIndex) => rowIndex === index ? { ...row, value: Number(event.target.value || 0) } : row) }))} className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>{copy.statSuffix}</span>
                <input type="text" value={entry.suffix} onChange={(event) => onChange((previous) => ({ ...previous, stats: previous.stats.map((row, rowIndex) => rowIndex === index ? { ...row, suffix: event.target.value } : row) }))} className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
              </label>
            </div>
            <LocalizedTextField label={copy.statLabel} value={entry.label} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, stats: previous.stats.map((row, rowIndex) => rowIndex === index ? { ...row, label: { ...row.label, [localeKey]: value } } : row) }))} />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.features}</p>
        {config.features.map((entry, index) => (
          <div key={`feature-${index}`} className="space-y-2 rounded-xl border border-border bg-background p-3">
            <LocalizedTextField label={copy.featureTitle} value={entry.title} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, features: previous.features.map((row, rowIndex) => rowIndex === index ? { ...row, title: { ...row.title, [localeKey]: value } } : row) }))} />
            <LocalizedTextField label={copy.featureDescription} value={entry.description} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, features: previous.features.map((row, rowIndex) => rowIndex === index ? { ...row, description: { ...row.description, [localeKey]: value } } : row) }))} multiline rows={3} />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.testimonials}</p>
        {config.testimonials.map((entry, index) => (
          <div key={`testimonial-${index}`} className="space-y-2 rounded-xl border border-border bg-background p-3">
            <LocalizedTextField label={copy.testimonialName} value={entry.name} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, testimonials: previous.testimonials.map((row, rowIndex) => rowIndex === index ? { ...row, name: { ...row.name, [localeKey]: value } } : row) }))} />
            <LocalizedTextField label={copy.testimonialRole} value={entry.role} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, testimonials: previous.testimonials.map((row, rowIndex) => rowIndex === index ? { ...row, role: { ...row.role, [localeKey]: value } } : row) }))} />
            <LocalizedTextField label={copy.testimonialText} value={entry.text} onChange={(localeKey, value) => onChange((previous) => ({ ...previous, testimonials: previous.testimonials.map((row, rowIndex) => rowIndex === index ? { ...row, text: { ...row.text, [localeKey]: value } } : row) }))} multiline rows={3} />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.products}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={config.display.showPriceReference} onChange={(event) => onChange((previous) => ({ ...previous, display: { ...previous.display, showPriceReference: event.target.checked } }))} />
            <span>{copy.showPrice}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={config.display.showSalePriceReference} onChange={(event) => onChange((previous) => ({ ...previous, display: { ...previous.display, showSalePriceReference: event.target.checked } }))} />
            <span>{copy.showSalePrice}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={config.display.showDepositReference} onChange={(event) => onChange((previous) => ({ ...previous, display: { ...previous.display, showDepositReference: event.target.checked } }))} />
            <span>{copy.showDeposit}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={config.display.showSuccessfulRentCount} onChange={(event) => onChange((previous) => ({ ...previous, display: { ...previous.display, showSuccessfulRentCount: event.target.checked } }))} />
            <span>{copy.showSuccessfulRentCount}</span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={config.display.showShortlist} onChange={(event) => onChange((previous) => ({ ...previous, display: { ...previous.display, showShortlist: event.target.checked } }))} />
            <span>{copy.showShortlist}</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.defaultMode}</span>
              <select value={config.appearance.defaultMode} onChange={(event) => onChange((previous) => ({ ...previous, appearance: { ...previous.appearance, defaultMode: event.target.value as ProductLanding3DThemeConfig["appearance"]["defaultMode"] } }))} className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
                <option value="dark">dark</option>
                <option value="light">light</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.defaultPalette}</span>
              <select value={config.appearance.defaultPalette} onChange={(event) => onChange((previous) => ({ ...previous, appearance: { ...previous.appearance, defaultPalette: event.target.value as ProductLanding3DThemeConfig["appearance"]["defaultPalette"] } }))} className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground">
                <option value="gold">gold</option>
                <option value="rose">rose</option>
                <option value="ocean">ocean</option>
                <option value="emerald">emerald</option>
              </select>
            </label>
          </div>
        </div>

        <input
          type="search"
          value={featuredSearch}
          onChange={(event) => setFeaturedSearch(event.target.value)}
          placeholder={copy.featuredProducts}
          className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        />

        <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-border bg-background p-2">
          {filteredFeaturedProductOptions.map((entry) => (
            <label key={entry.id} className="flex items-start gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground">
              <input
                type="checkbox"
                checked={config.featuredProductIds.includes(entry.id)}
                onChange={() =>
                  onChange((previous) => ({
                    ...previous,
                    featuredProductIds: previous.featuredProductIds.includes(entry.id)
                      ? previous.featuredProductIds.filter((value) => value !== entry.id)
                      : [...previous.featuredProductIds, entry.id],
                  }))
                }
                className="mt-0.5"
              />
              <span className="leading-relaxed">
                <span className="font-semibold">{entry.productCode}</span> - {entry.name}
                {entry.categoryName ? <span className="text-muted-foreground"> ({entry.categoryName})</span> : null}
              </span>
            </label>
          ))}
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
