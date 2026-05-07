import { buildDefaultProductLandingCharmThemeConfig } from './defaults-charm';
import {
  parseObject,
  readBoolean,
  readNullableString,
  readString,
  readStringArray,
} from './helpers';
import { normalizeProductLandingCharmThemeConfig } from './normalize-charm';
import type { AppLocale, ProductLandingCharmThemeConfig } from './types';

export function migrateLegacyProductLandingCharmThemeConfig(options: {
  locale: AppLocale;
  title?: string | null;
  subtitle?: string | null;
  heroConfigJson?: unknown;
  sectionsConfigJson?: unknown;
  displayConfigJson?: unknown;
  themeConfigJson?: unknown;
}): ProductLandingCharmThemeConfig {
  const defaults = buildDefaultProductLandingCharmThemeConfig();
  const themeConfig = parseObject(options.themeConfigJson);
  const heroConfig = parseObject(options.heroConfigJson);
  const sectionsConfig = parseObject(options.sectionsConfigJson);
  const sectionI18n = parseObject(sectionsConfig.i18n);
  const displayConfig = parseObject(options.displayConfigJson);
  const perksI18n = parseObject(sectionI18n.perks);
  const testimonialsI18n = parseObject(sectionI18n.testimonials);

  const legacySeed = {
    ...defaults,
    meta: {
      ...defaults.meta,
      pageName: {
        vi:
          options.locale === 'vi'
            ? readString(options.title, defaults.meta.pageName.vi)
            : defaults.meta.pageName.vi,
        en:
          options.locale === 'en'
            ? readString(options.title, defaults.meta.pageName.en)
            : defaults.meta.pageName.en,
      },
      pageLogoUrl: readNullableString(
        heroConfig.pageLogoUrl,
        defaults.meta.pageLogoUrl,
      ),
    },
    navigation: {
      ...defaults.navigation,
      searchPlaceholder: {
        vi:
          options.locale === 'vi'
            ? readString(
                heroConfig.searchPlaceholder,
                defaults.navigation.searchPlaceholder.vi,
              )
            : defaults.navigation.searchPlaceholder.vi,
        en:
          options.locale === 'en'
            ? readString(
                heroConfig.searchPlaceholder,
                defaults.navigation.searchPlaceholder.en,
              )
            : defaults.navigation.searchPlaceholder.en,
      },
    },
    hero: {
      ...defaults.hero,
      badge: {
        vi:
          options.locale === 'vi'
            ? readString(heroConfig.badge, defaults.hero.badge.vi)
            : defaults.hero.badge.vi,
        en:
          options.locale === 'en'
            ? readString(heroConfig.badge, defaults.hero.badge.en)
            : defaults.hero.badge.en,
      },
      subtitle: {
        vi:
          options.locale === 'vi'
            ? readString(
                heroConfig.subheading,
                readString(options.subtitle, defaults.hero.subtitle.vi),
              )
            : defaults.hero.subtitle.vi,
        en:
          options.locale === 'en'
            ? readString(
                heroConfig.subheading,
                readString(options.subtitle, defaults.hero.subtitle.en),
              )
            : defaults.hero.subtitle.en,
      },
    },
    featured: {
      ...defaults.featured,
      title: {
        vi:
          options.locale === 'vi'
            ? readString(
                sectionsConfig.featuredTitle,
                defaults.featured.title.vi,
              )
            : defaults.featured.title.vi,
        en:
          options.locale === 'en'
            ? readString(
                sectionsConfig.featuredTitle,
                defaults.featured.title.en,
              )
            : defaults.featured.title.en,
      },
      showMoreActionLabel: {
        vi:
          options.locale === 'vi'
            ? readString(
                sectionsConfig.featuredShowMoreLabel,
                defaults.featured.showMoreActionLabel.vi,
              )
            : defaults.featured.showMoreActionLabel.vi,
        en:
          options.locale === 'en'
            ? readString(
                sectionsConfig.featuredShowMoreLabel,
                defaults.featured.showMoreActionLabel.en,
              )
            : defaults.featured.showMoreActionLabel.en,
      },
    },
    featureItems: defaults.featureItems.map((entry, index) => {
      const viRow = parseObject(
        Array.isArray(perksI18n.vi) ? perksI18n.vi[index] : null,
      );
      const enRow = parseObject(
        Array.isArray(perksI18n.en) ? perksI18n.en[index] : null,
      );
      return {
        title: {
          vi: readString(viRow.title, entry.title.vi),
          en: readString(enRow.title, entry.title.en),
        },
        description: {
          vi: readString(viRow.description, entry.description.vi),
          en: readString(enRow.description, entry.description.en),
        },
        gradientClass: entry.gradientClass,
      };
    }),
    testimonialItems: defaults.testimonialItems.map((entry, index) => {
      const viRow = parseObject(
        Array.isArray(testimonialsI18n.vi) ? testimonialsI18n.vi[index] : null,
      );
      const enRow = parseObject(
        Array.isArray(testimonialsI18n.en) ? testimonialsI18n.en[index] : null,
      );
      return {
        quote: {
          vi: readString(viRow.text, entry.quote.vi),
          en: readString(enRow.text, entry.quote.en),
        },
        name: {
          vi: readString(viRow.name, entry.name.vi),
          en: readString(enRow.name, entry.name.en),
        },
        role: entry.role,
        stars: entry.stars,
      };
    }),
    featuredProductIds: readStringArray(displayConfig.featuredProductIds, []),
    display: {
      showPriceReference: readBoolean(
        displayConfig.showPriceReference,
        defaults.display.showPriceReference,
      ),
      showSalePriceReference: readBoolean(
        displayConfig.showSalePriceReference,
        defaults.display.showSalePriceReference,
      ),
      showDepositReference: readBoolean(
        displayConfig.showDepositReference,
        defaults.display.showDepositReference,
      ),
      showSuccessfulRentCount: readBoolean(
        displayConfig.showSuccessfulRentCount,
        defaults.display.showSuccessfulRentCount,
      ),
      showShortlist: readBoolean(
        displayConfig.showShortlist,
        defaults.display.showShortlist,
      ),
    },
  };

  const legacyFallback = normalizeProductLandingCharmThemeConfig(
    legacySeed,
    defaults,
  );
  if (Object.keys(themeConfig).length > 0) {
    return normalizeProductLandingCharmThemeConfig(
      options.themeConfigJson,
      legacyFallback,
    );
  }

  return legacyFallback;
}
