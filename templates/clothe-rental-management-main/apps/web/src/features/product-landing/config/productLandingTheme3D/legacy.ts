import type { AppLocale } from "@/constants/locale";
import type { TemplateLang } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";
import type { ProductLanding3DThemeConfig } from "./types";
import { buildDefaultProductLanding3DThemeConfig } from "./defaults";
import { normalizeProductLanding3DThemeConfig } from "./normalize";
import {
  parseObject,
  readBoolean,
  readNullableString,
  readString,
  readStringArray,
  resolveLocalizedText,
} from "./utils";

export function migrateLegacyProductLanding3DThemeConfig(options: {
  locale: AppLocale;
  title?: string | null;
  subtitle?: string | null;
  heroConfigJson?: unknown;
  sectionsConfigJson?: unknown;
  seoConfigJson?: unknown;
  displayConfigJson?: unknown;
  themeConfigJson?: unknown;
}): ProductLanding3DThemeConfig {
  const defaults = buildDefaultProductLanding3DThemeConfig();
  const themeConfig = parseObject(options.themeConfigJson);
  if (Object.keys(themeConfig).length > 0) {
    return normalizeProductLanding3DThemeConfig(options.themeConfigJson, defaults);
  }

  const heroConfig = parseObject(options.heroConfigJson);
  const heroI18n = parseObject(heroConfig.i18n);
  const pageNameI18n = parseObject(heroI18n.pageName);
  const sectionsConfig = parseObject(options.sectionsConfigJson);
  const sectionI18n = parseObject(sectionsConfig.i18n);
  const seoConfig = parseObject(options.seoConfigJson);
  const displayConfig = parseObject(options.displayConfigJson);
  const featuresVi = Array.isArray(parseObject(sectionI18n.perks).vi)
    ? parseObject(sectionI18n.perks).vi
    : sectionsConfig.perks;
  const featuresEn = Array.isArray(parseObject(sectionI18n.perks).en)
    ? parseObject(sectionI18n.perks).en
    : undefined;
  const testimonialsVi = Array.isArray(parseObject(sectionI18n.testimonials).vi)
    ? parseObject(sectionI18n.testimonials).vi
    : sectionsConfig.testimonials;
  const testimonialsEn = Array.isArray(parseObject(sectionI18n.testimonials).en)
    ? parseObject(sectionI18n.testimonials).en
    : undefined;

  const next = normalizeProductLanding3DThemeConfig(
    {
      ...defaults,
      meta: {
        pageName: {
          vi: readString(pageNameI18n.vi, options.locale === "vi" ? readString(options.title, defaults.meta.pageName.vi) : defaults.meta.pageName.vi),
          en: readString(pageNameI18n.en, options.locale === "en" ? readString(options.title, defaults.meta.pageName.en) : defaults.meta.pageName.en),
        },
        pageLogoUrl: readNullableString(heroConfig.pageLogoUrl, defaults.meta.pageLogoUrl),
        seoDescription: {
          vi: options.locale === "vi"
            ? readString(seoConfig.description, readString(options.subtitle, defaults.meta.seoDescription.vi))
            : defaults.meta.seoDescription.vi,
          en: options.locale === "en"
            ? readString(seoConfig.description, readString(options.subtitle, defaults.meta.seoDescription.en))
            : defaults.meta.seoDescription.en,
        },
      },
      navigation: {
        ...defaults.navigation,
        searchPlaceholder: {
          vi: options.locale === "vi"
            ? readString(heroConfig.searchPlaceholder, defaults.navigation.searchPlaceholder.vi)
            : defaults.navigation.searchPlaceholder.vi,
          en: options.locale === "en"
            ? readString(heroConfig.searchPlaceholder, defaults.navigation.searchPlaceholder.en)
            : defaults.navigation.searchPlaceholder.en,
        },
      },
      hero: {
        ...defaults.hero,
        badge: {
          vi: options.locale === "vi" ? readString(heroConfig.badge, defaults.hero.badge.vi) : defaults.hero.badge.vi,
          en: options.locale === "en" ? readString(heroConfig.badge, defaults.hero.badge.en) : defaults.hero.badge.en,
        },
        subtitle: {
          vi: options.locale === "vi"
            ? readString(heroConfig.subheading, readString(options.subtitle, defaults.hero.subtitle.vi))
            : defaults.hero.subtitle.vi,
          en: options.locale === "en"
            ? readString(heroConfig.subheading, readString(options.subtitle, defaults.hero.subtitle.en))
            : defaults.hero.subtitle.en,
        },
      },
      collection: {
        ...defaults.collection,
        title: {
          vi: options.locale === "vi"
            ? readString(sectionsConfig.featuredTitle, defaults.collection.title.vi)
            : defaults.collection.title.vi,
          en: options.locale === "en"
            ? readString(sectionsConfig.featuredTitle, defaults.collection.title.en)
            : defaults.collection.title.en,
        },
        actionLabel: {
          vi: options.locale === "vi"
            ? readString(sectionsConfig.featuredShowMoreLabel, defaults.collection.actionLabel.vi)
            : defaults.collection.actionLabel.vi,
          en: options.locale === "en"
            ? readString(sectionsConfig.featuredShowMoreLabel, defaults.collection.actionLabel.en)
            : defaults.collection.actionLabel.en,
        },
      },
      stats: defaults.stats,
      features: defaults.features.map((entry, index) => {
        const viRow = parseObject(Array.isArray(featuresVi) ? featuresVi[index] : null);
        const enRow = parseObject(Array.isArray(featuresEn) ? featuresEn[index] : null);
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
      testimonials: defaults.testimonials.map((entry, index) => {
        const viRow = parseObject(Array.isArray(testimonialsVi) ? testimonialsVi[index] : null);
        const enRow = parseObject(Array.isArray(testimonialsEn) ? testimonialsEn[index] : null);
        return {
          name: {
            vi: readString(viRow.name, entry.name.vi),
            en: readString(enRow.name, entry.name.en),
          },
          role: entry.role,
          text: {
            vi: readString(viRow.text, entry.text.vi),
            en: readString(enRow.text, entry.text.en),
          },
        };
      }),
      featuredProductIds: readStringArray(displayConfig.featuredProductIds, []),
      display: {
        showPriceReference: readBoolean(displayConfig.showPriceReference, defaults.display.showPriceReference),
        showSalePriceReference: readBoolean(displayConfig.showSalePriceReference, defaults.display.showSalePriceReference),
        showDepositReference: readBoolean(displayConfig.showDepositReference, defaults.display.showDepositReference),
        showSuccessfulRentCount: readBoolean(displayConfig.showSuccessfulRentCount, defaults.display.showSuccessfulRentCount),
        showShortlist: readBoolean(displayConfig.showShortlist, defaults.display.showShortlist),
      },
    },
    defaults
  );

  return next;
}

export function buildLegacyShowroomPageFieldsFrom3DThemeConfig(
  config: ProductLanding3DThemeConfig,
  locale: AppLocale
) {
  const lang: TemplateLang = locale === "vi" ? "vi" : "en";
  const title = resolveLocalizedText(config.meta.pageName, lang);
  const subtitle = resolveLocalizedText(config.hero.subtitle, lang);

  return {
    title,
    subtitle,
    heroConfigJson: {
      badge: resolveLocalizedText(config.hero.badge, lang),
      heading: title,
      subheading: subtitle,
      pageName: title,
      pageLogoUrl: config.meta.pageLogoUrl,
      i18n: {
        pageName: config.meta.pageName,
      },
      searchPlaceholder: resolveLocalizedText(config.navigation.searchPlaceholder, lang),
      showSearchBox: true,
      showShortlistCta: config.display.showShortlist,
    },
    sectionsConfigJson: {
      featuredTitle: resolveLocalizedText(config.collection.title, lang),
      featuredShowMoreLabel: resolveLocalizedText(config.collection.actionLabel, lang),
      stats: config.stats.map((entry) => ({
        label: resolveLocalizedText(entry.label, lang),
        value: `${entry.value}${entry.suffix}`,
      })),
      perks: config.features.map((entry) => ({
        title: resolveLocalizedText(entry.title, lang),
        description: resolveLocalizedText(entry.description, lang),
      })),
      testimonials: config.testimonials.map((entry) => ({
        name: resolveLocalizedText(entry.name, lang),
        text: resolveLocalizedText(entry.text, lang),
      })),
      i18n: {
        perks: {
          vi: config.features.map((entry) => ({
            title: entry.title.vi,
            description: entry.description.vi,
          })),
          en: config.features.map((entry) => ({
            title: entry.title.en,
            description: entry.description.en,
          })),
        },
        testimonials: {
          vi: config.testimonials.map((entry) => ({
            name: entry.name.vi,
            text: entry.text.vi,
          })),
          en: config.testimonials.map((entry) => ({
            name: entry.name.en,
            text: entry.text.en,
          })),
        },
      },
    },
    displayConfigJson: {
      ...config.display,
      featuredProductIds: config.featuredProductIds,
      cardVariant: "classic_grid_v1",
    },
    seoConfigJson: {
      title,
      description: resolveLocalizedText(config.meta.seoDescription, lang),
    },
  };
}
