import type { AppLocale } from "@/constants/locale";
import type { ProductLandingModernThemeConfig } from "./types";
import { buildDefaultProductLandingModernThemeConfig } from "./defaults";
import { normalizeProductLandingModernThemeConfig } from "./normalize";
import {
  parseObject,
  readBoolean,
  readNullableString,
  readString,
  readStringArray,
  resolveLocalizedText,
} from "./utils";

export function migrateLegacyProductLandingModernThemeConfig(options: {
  locale: AppLocale;
  title?: string | null;
  subtitle?: string | null;
  heroConfigJson?: unknown;
  sectionsConfigJson?: unknown;
  seoConfigJson?: unknown;
  displayConfigJson?: unknown;
  themeConfigJson?: unknown;
}): ProductLandingModernThemeConfig {
  const defaults = buildDefaultProductLandingModernThemeConfig();
  const themeConfig = parseObject(options.themeConfigJson);
  if (Object.keys(themeConfig).length > 0) {
    return normalizeProductLandingModernThemeConfig(options.themeConfigJson, defaults);
  }

  const heroConfig = parseObject(options.heroConfigJson);
  const sectionsConfig = parseObject(options.sectionsConfigJson);
  const sectionI18n = parseObject(sectionsConfig.i18n);
  const perksI18n = parseObject(sectionI18n.perks);
  const testimonialsI18n = parseObject(sectionI18n.testimonials);
  const seoConfig = parseObject(options.seoConfigJson);
  const displayConfig = parseObject(options.displayConfigJson);

  const legacySeed = {
    ...defaults,
    meta: {
      ...defaults.meta,
      pageName: {
        vi:
          options.locale === "vi"
            ? readString(options.title, defaults.meta.pageName.vi)
            : defaults.meta.pageName.vi,
        en:
          options.locale === "en"
            ? readString(options.title, defaults.meta.pageName.en)
            : defaults.meta.pageName.en,
      },
      pageLogoUrl: readNullableString(heroConfig.pageLogoUrl, defaults.meta.pageLogoUrl),
      seoDescription: {
        vi:
          options.locale === "vi"
            ? readString(seoConfig.description, defaults.meta.seoDescription.vi)
            : defaults.meta.seoDescription.vi,
        en:
          options.locale === "en"
            ? readString(seoConfig.description, defaults.meta.seoDescription.en)
            : defaults.meta.seoDescription.en,
      },
    },
    navigation: {
      ...defaults.navigation,
      searchPlaceholder: {
        vi:
          options.locale === "vi"
            ? readString(heroConfig.searchPlaceholder, defaults.navigation.searchPlaceholder.vi)
            : defaults.navigation.searchPlaceholder.vi,
        en:
          options.locale === "en"
            ? readString(heroConfig.searchPlaceholder, defaults.navigation.searchPlaceholder.en)
            : defaults.navigation.searchPlaceholder.en,
      },
    },
    hero: {
      ...defaults.hero,
      badge: {
        vi:
          options.locale === "vi"
            ? readString(heroConfig.badge, defaults.hero.badge.vi)
            : defaults.hero.badge.vi,
        en:
          options.locale === "en"
            ? readString(heroConfig.badge, defaults.hero.badge.en)
            : defaults.hero.badge.en,
      },
      subtitle: {
        vi:
          options.locale === "vi"
            ? readString(heroConfig.subheading, readString(options.subtitle, defaults.hero.subtitle.vi))
            : defaults.hero.subtitle.vi,
        en:
          options.locale === "en"
            ? readString(heroConfig.subheading, readString(options.subtitle, defaults.hero.subtitle.en))
            : defaults.hero.subtitle.en,
      },
    },
    products: {
      ...defaults.products,
      title: {
        vi:
          options.locale === "vi"
            ? readString(sectionsConfig.featuredTitle, defaults.products.title.vi)
            : defaults.products.title.vi,
        en:
          options.locale === "en"
            ? readString(sectionsConfig.featuredTitle, defaults.products.title.en)
            : defaults.products.title.en,
      },
      showMoreActionLabel: {
        vi:
          options.locale === "vi"
            ? readString(sectionsConfig.featuredShowMoreLabel, defaults.products.showMoreActionLabel.vi)
            : defaults.products.showMoreActionLabel.vi,
        en:
          options.locale === "en"
            ? readString(sectionsConfig.featuredShowMoreLabel, defaults.products.showMoreActionLabel.en)
            : defaults.products.showMoreActionLabel.en,
      },
    },
    featureItems: defaults.featureItems.map((entry, index) => {
      const viRow = parseObject(Array.isArray(perksI18n.vi) ? perksI18n.vi[index] : null);
      const enRow = parseObject(Array.isArray(perksI18n.en) ? perksI18n.en[index] : null);
      return {
        title: {
          vi: readString(viRow.title, entry.title.vi),
          en: readString(enRow.title, entry.title.en),
        },
        description: {
          vi: readString(viRow.description, entry.description.vi),
          en: readString(enRow.description, entry.description.en),
        },
      };
    }),
    testimonialItems: defaults.testimonialItems.map((entry, index) => {
      const viRow = parseObject(Array.isArray(testimonialsI18n.vi) ? testimonialsI18n.vi[index] : null);
      const enRow = parseObject(Array.isArray(testimonialsI18n.en) ? testimonialsI18n.en[index] : null);
      return {
        name: {
          vi: readString(viRow.name, entry.name.vi),
          en: readString(enRow.name, entry.name.en),
        },
        text: {
          vi: readString(viRow.text, entry.text.vi),
          en: readString(enRow.text, entry.text.en),
        },
        rating: entry.rating,
      };
    }),
    featuredProductIds: readStringArray(displayConfig.featuredProductIds, []),
    display: {
      showPriceReference: readBoolean(displayConfig.showPriceReference, defaults.display.showPriceReference),
      showSalePriceReference: readBoolean(
        displayConfig.showSalePriceReference,
        defaults.display.showSalePriceReference
      ),
      showDepositReference: readBoolean(displayConfig.showDepositReference, defaults.display.showDepositReference),
      showSuccessfulRentCount: readBoolean(
        displayConfig.showSuccessfulRentCount,
        defaults.display.showSuccessfulRentCount
      ),
      showShortlist: readBoolean(displayConfig.showShortlist, defaults.display.showShortlist),
    },
  };

  return normalizeProductLandingModernThemeConfig(legacySeed, defaults);
}

export function buildLegacyShowroomPageFieldsFromModernThemeConfig(
  config: ProductLandingModernThemeConfig,
  locale: AppLocale
) {
  const title = resolveLocalizedText(config.meta.pageName, locale);
  const subtitle = resolveLocalizedText(config.hero.subtitle, locale);
  const heading = `${resolveLocalizedText(config.hero.line1, locale)} ${resolveLocalizedText(
    config.hero.line2,
    locale
  )}`.trim();

  return {
    title,
    subtitle,
    heroConfigJson: {
      badge: resolveLocalizedText(config.hero.badge, locale),
      heading,
      subheading: subtitle,
      pageName: title,
      pageLogoUrl: config.meta.pageLogoUrl,
      i18n: {
        pageName: config.meta.pageName,
      },
      searchPlaceholder: resolveLocalizedText(config.navigation.searchPlaceholder, locale),
      showSearchBox: true,
      showShortlistCta: config.display.showShortlist,
    },
    sectionsConfigJson: {
      featuredTitle: resolveLocalizedText(config.products.title, locale),
      featuredShowMoreLabel: resolveLocalizedText(config.products.showMoreActionLabel, locale),
      stats: config.stats.map((entry) => ({
        label: resolveLocalizedText(entry.label, locale),
        value: entry.value,
      })),
      perks: config.featureItems.map((entry) => ({
        title: resolveLocalizedText(entry.title, locale),
        description: resolveLocalizedText(entry.description, locale),
      })),
      testimonials: config.testimonialItems.map((entry) => ({
        name: resolveLocalizedText(entry.name, locale),
        text: resolveLocalizedText(entry.text, locale),
      })),
      i18n: {
        perks: {
          vi: config.featureItems.map((entry) => ({
            title: entry.title.vi,
            description: entry.description.vi,
          })),
          en: config.featureItems.map((entry) => ({
            title: entry.title.en,
            description: entry.description.en,
          })),
        },
        testimonials: {
          vi: config.testimonialItems.map((entry) => ({
            name: entry.name.vi,
            text: entry.text.vi,
          })),
          en: config.testimonialItems.map((entry) => ({
            name: entry.name.en,
            text: entry.text.en,
          })),
        },
      },
    },
    seoConfigJson: {
      title,
      description: resolveLocalizedText(config.meta.seoDescription, locale),
    },
    displayConfigJson: {
      ...config.display,
      featuredProductIds: config.featuredProductIds,
      cardVariant: "classic_grid_v1",
    },
  };
}
