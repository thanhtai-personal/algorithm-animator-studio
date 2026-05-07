import { resolveLocalizedText } from './helpers';
import type { AppLocale, ProductLandingCharmThemeConfig } from './types';

export function buildLegacyShowroomPageFieldsFromCharmThemeConfig(
  config: ProductLandingCharmThemeConfig,
  locale: AppLocale,
) {
  const title = resolveLocalizedText(config.meta.pageName, locale);
  const subtitle = resolveLocalizedText(config.hero.subtitle, locale);
  const heading =
    `${resolveLocalizedText(config.hero.line1, locale)} ${resolveLocalizedText(
      config.hero.line2,
      locale,
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
      searchPlaceholder: resolveLocalizedText(
        config.navigation.searchPlaceholder,
        locale,
      ),
      showSearchBox: true,
      showShortlistCta: config.display.showShortlist,
    },
    sectionsConfigJson: {
      featuredTitle: resolveLocalizedText(config.featured.title, locale),
      featuredShowMoreLabel: resolveLocalizedText(
        config.featured.showMoreActionLabel,
        locale,
      ),
      perks: config.featureItems.map((entry) => ({
        title: resolveLocalizedText(entry.title, locale),
        description: resolveLocalizedText(entry.description, locale),
      })),
      testimonials: config.testimonialItems.map((entry) => ({
        name: resolveLocalizedText(entry.name, locale),
        text: resolveLocalizedText(entry.quote, locale),
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
            text: entry.quote.vi,
          })),
          en: config.testimonialItems.map((entry) => ({
            name: entry.name.en,
            text: entry.quote.en,
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
      description: subtitle,
    },
  };
}
