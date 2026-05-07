import { resolveLocalizedText } from './helpers';
import type { AppLocale, ProductLanding3DThemeConfig } from './types';

export function buildLegacyShowroomPageFieldsFrom3DThemeConfig(
  config: ProductLanding3DThemeConfig,
  locale: AppLocale,
) {
  const title = resolveLocalizedText(config.meta.pageName, locale);
  const subtitle = resolveLocalizedText(config.hero.subtitle, locale);

  return {
    title,
    subtitle,
    heroConfigJson: {
      badge: resolveLocalizedText(config.hero.badge, locale),
      heading: title,
      subheading: subtitle,
      pageName: title,
      pageLogoUrl: config.meta.pageLogoUrl,
      i18n: {
        pageName: config.meta.pageName,
      },
      searchPlaceholder: resolveLocalizedText(
        config.navigation.searchPlaceholder,
        locale,
      ),
      showSearchBox: true,
      showShortlistCta: config.display.showShortlist,
    },
    sectionsConfigJson: {
      featuredTitle: resolveLocalizedText(config.collection.title, locale),
      featuredShowMoreLabel: resolveLocalizedText(
        config.collection.actionLabel,
        locale,
      ),
      perks: config.features.map((entry) => ({
        title: resolveLocalizedText(entry.title, locale),
        description: resolveLocalizedText(entry.description, locale),
      })),
      testimonials: config.testimonials.map((entry) => ({
        name: resolveLocalizedText(entry.name, locale),
        text: resolveLocalizedText(entry.text, locale),
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
      cardVariant: 'classic_grid_v1',
    },
    seoConfigJson: {
      title,
      description: resolveLocalizedText(config.meta.seoDescription, locale),
    },
  };
}
