import { buildDefaultProductLanding3DThemeConfig } from './defaults-3d';
import {
  parseObject,
  readBoolean,
  readNullableString,
  readString,
  readStringArray,
} from './helpers';
import { normalizeProductLanding3DThemeConfig } from './normalize-3d';
import type { AppLocale, ProductLanding3DThemeConfig } from './types';

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
  const providedThemeConfig = parseObject(options.themeConfigJson);
  if (Object.keys(providedThemeConfig).length > 0) {
    return normalizeProductLanding3DThemeConfig(
      options.themeConfigJson,
      defaults,
    );
  }

  const heroConfig = parseObject(options.heroConfigJson);
  const heroI18n = parseObject(heroConfig.i18n);
  const pageNameI18n = parseObject(heroI18n.pageName);
  const sectionsConfig = parseObject(options.sectionsConfigJson);
  const sectionI18n = parseObject(sectionsConfig.i18n);
  const seoConfig = parseObject(options.seoConfigJson);
  const displayConfig = parseObject(options.displayConfigJson);
  const perkI18n = parseObject(sectionI18n.perks);
  const testimonialI18n = parseObject(sectionI18n.testimonials);

  return normalizeProductLanding3DThemeConfig(
    {
      ...defaults,
      meta: {
        pageName: {
          vi: readString(
            pageNameI18n.vi,
            options.locale === 'vi'
              ? readString(options.title, defaults.meta.pageName.vi)
              : defaults.meta.pageName.vi,
          ),
          en: readString(
            pageNameI18n.en,
            options.locale === 'en'
              ? readString(options.title, defaults.meta.pageName.en)
              : defaults.meta.pageName.en,
          ),
        },
        pageLogoUrl: readNullableString(
          heroConfig.pageLogoUrl,
          defaults.meta.pageLogoUrl,
        ),
        seoDescription: {
          vi:
            options.locale === 'vi'
              ? readString(
                  seoConfig.description,
                  readString(options.subtitle, defaults.meta.seoDescription.vi),
                )
              : defaults.meta.seoDescription.vi,
          en:
            options.locale === 'en'
              ? readString(
                  seoConfig.description,
                  readString(options.subtitle, defaults.meta.seoDescription.en),
                )
              : defaults.meta.seoDescription.en,
        },
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
      collection: {
        ...defaults.collection,
        title: {
          vi:
            options.locale === 'vi'
              ? readString(
                  sectionsConfig.featuredTitle,
                  defaults.collection.title.vi,
                )
              : defaults.collection.title.vi,
          en:
            options.locale === 'en'
              ? readString(
                  sectionsConfig.featuredTitle,
                  defaults.collection.title.en,
                )
              : defaults.collection.title.en,
        },
        actionLabel: {
          vi:
            options.locale === 'vi'
              ? readString(
                  sectionsConfig.featuredShowMoreLabel,
                  defaults.collection.actionLabel.vi,
                )
              : defaults.collection.actionLabel.vi,
          en:
            options.locale === 'en'
              ? readString(
                  sectionsConfig.featuredShowMoreLabel,
                  defaults.collection.actionLabel.en,
                )
              : defaults.collection.actionLabel.en,
        },
      },
      features: defaults.features.map((entry, index) => {
        const viRow = parseObject(
          Array.isArray(perkI18n.vi) ? perkI18n.vi[index] : null,
        );
        const enRow = parseObject(
          Array.isArray(perkI18n.en) ? perkI18n.en[index] : null,
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
        };
      }),
      testimonials: defaults.testimonials.map((entry, index) => {
        const viRow = parseObject(
          Array.isArray(testimonialI18n.vi) ? testimonialI18n.vi[index] : null,
        );
        const enRow = parseObject(
          Array.isArray(testimonialI18n.en) ? testimonialI18n.en[index] : null,
        );
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
    },
    defaults,
  );
}
