import type { ProductLandingCharmThemeConfig } from "./types";
import { buildDefaultProductLandingCharmThemeConfig } from "./defaults";
import {
  parseObject,
  readBoolean,
  readLocalizedStringArray,
  readLocalizedText,
  readNullableString,
  readNumber,
  readString,
  readStringArray,
} from "./utils";

export function normalizeProductLandingCharmThemeConfig(
  value: unknown,
  fallback = buildDefaultProductLandingCharmThemeConfig()
): ProductLandingCharmThemeConfig {
  const source = parseObject(value);
  const meta = parseObject(source.meta);
  const navigation = parseObject(source.navigation);
  const hero = parseObject(source.hero);
  const featured = parseObject(source.featured);
  const features = parseObject(source.features);
  const testimonials = parseObject(source.testimonials);
  const cta = parseObject(source.cta);
  const footer = parseObject(source.footer);
  const display = parseObject(source.display);

  return {
    version: 1,
    themeCode: readString(source.themeCode, fallback.themeCode),
    meta: {
      pageName: readLocalizedText(meta.pageName, fallback.meta.pageName),
      pageLogoUrl: readNullableString(meta.pageLogoUrl, fallback.meta.pageLogoUrl),
    },
    navigation: {
      homeLabel: readLocalizedText(navigation.homeLabel, fallback.navigation.homeLabel),
      showroomLabel: readLocalizedText(navigation.showroomLabel, fallback.navigation.showroomLabel),
      bookingLabel: readLocalizedText(navigation.bookingLabel, fallback.navigation.bookingLabel),
      searchPlaceholder: readLocalizedText(
        navigation.searchPlaceholder,
        fallback.navigation.searchPlaceholder
      ),
      signInLabel: readLocalizedText(navigation.signInLabel, fallback.navigation.signInLabel),
    },
    hero: {
      badge: readLocalizedText(hero.badge, fallback.hero.badge),
      line1: readLocalizedText(hero.line1, fallback.hero.line1),
      line2: readLocalizedText(hero.line2, fallback.hero.line2),
      subtitle: readLocalizedText(hero.subtitle, fallback.hero.subtitle),
      searchActionLabel: readLocalizedText(hero.searchActionLabel, fallback.hero.searchActionLabel),
      heroImagePath: readNullableString(hero.heroImagePath, fallback.hero.heroImagePath),
    },
    featured: {
      title: readLocalizedText(featured.title, fallback.featured.title),
      subtitle: readLocalizedText(featured.subtitle, fallback.featured.subtitle),
      showMoreActionLabel: readLocalizedText(
        featured.showMoreActionLabel,
        fallback.featured.showMoreActionLabel
      ),
      rentNowActionLabel: readLocalizedText(
        featured.rentNowActionLabel,
        fallback.featured.rentNowActionLabel
      ),
    },
    features: {
      title: readLocalizedText(features.title, fallback.features.title),
      subtitle: readLocalizedText(features.subtitle, fallback.features.subtitle),
    },
    testimonials: {
      title: readLocalizedText(testimonials.title, fallback.testimonials.title),
      subtitle: readLocalizedText(testimonials.subtitle, fallback.testimonials.subtitle),
    },
    cta: {
      title: readLocalizedText(cta.title, fallback.cta.title),
      subtitle: readLocalizedText(cta.subtitle, fallback.cta.subtitle),
      showroomActionLabel: readLocalizedText(cta.showroomActionLabel, fallback.cta.showroomActionLabel),
    },
    footer: {
      summary: readLocalizedText(footer.summary, fallback.footer.summary),
      productsTitle: readLocalizedText(footer.productsTitle, fallback.footer.productsTitle),
      supportTitle: readLocalizedText(footer.supportTitle, fallback.footer.supportTitle),
      contactTitle: readLocalizedText(footer.contactTitle, fallback.footer.contactTitle),
      products: readLocalizedStringArray(footer.products, fallback.footer.products),
      support: readLocalizedStringArray(footer.support, fallback.footer.support),
      contactLines: readLocalizedStringArray(footer.contactLines, fallback.footer.contactLines),
      madeWith: readLocalizedText(footer.madeWith, fallback.footer.madeWith),
    },
    stats: Array.isArray(source.stats)
      ? source.stats.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow = fallback.stats[index] ?? fallback.stats[fallback.stats.length - 1];
          return {
            value: readNumber(row.value, fallbackRow.value),
            suffix: readString(row.suffix, fallbackRow.suffix),
            label: readLocalizedText(row.label, fallbackRow.label),
            emoji: readString(row.emoji, fallbackRow.emoji),
          };
        })
      : fallback.stats,
    products: Array.isArray(source.products)
      ? source.products.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow = fallback.products[index] ?? fallback.products[fallback.products.length - 1];
          return {
            id: readString(row.id, fallbackRow.id),
            name: readLocalizedText(row.name, fallbackRow.name),
            price: readLocalizedText(row.price, fallbackRow.price),
            tag: readLocalizedText(row.tag, fallbackRow.tag),
            image: readString(row.image, fallbackRow.image),
          };
        })
      : fallback.products,
    featureItems: Array.isArray(source.featureItems)
      ? source.featureItems.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.featureItems[index] ?? fallback.featureItems[fallback.featureItems.length - 1];
          return {
            title: readLocalizedText(row.title, fallbackRow.title),
            description: readLocalizedText(row.description, fallbackRow.description),
            gradientClass: readString(row.gradientClass, fallbackRow.gradientClass),
          };
        })
      : fallback.featureItems,
    testimonialItems: Array.isArray(source.testimonialItems)
      ? source.testimonialItems.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.testimonialItems[index] ??
            fallback.testimonialItems[fallback.testimonialItems.length - 1];
          return {
            quote: readLocalizedText(row.quote, fallbackRow.quote),
            name: readLocalizedText(row.name, fallbackRow.name),
            role: readLocalizedText(row.role, fallbackRow.role),
            stars: Math.max(1, Math.min(5, Math.round(readNumber(row.stars, fallbackRow.stars)))),
          };
        })
      : fallback.testimonialItems,
    featuredProductIds: readStringArray(source.featuredProductIds, fallback.featuredProductIds),
    display: {
      showPriceReference: readBoolean(display.showPriceReference, fallback.display.showPriceReference),
      showSalePriceReference: readBoolean(display.showSalePriceReference, fallback.display.showSalePriceReference),
      showDepositReference: readBoolean(display.showDepositReference, fallback.display.showDepositReference),
      showSuccessfulRentCount: readBoolean(
        display.showSuccessfulRentCount,
        fallback.display.showSuccessfulRentCount
      ),
      showShortlist: readBoolean(display.showShortlist, fallback.display.showShortlist),
    },
  };
}
