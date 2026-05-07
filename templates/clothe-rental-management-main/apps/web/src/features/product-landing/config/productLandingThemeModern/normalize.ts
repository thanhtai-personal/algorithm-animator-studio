import type { ProductLandingModernThemeConfig } from "./types";
import { buildDefaultProductLandingModernThemeConfig } from "./defaults";
import {
  localized,
  parseObject,
  readBoolean,
  readLocalizedStringArray,
  readLocalizedText,
  readNullableString,
  readNumber,
  readString,
  readStringArray,
} from "./utils";

export function normalizeProductLandingModernThemeConfig(
  value: unknown,
  fallback = buildDefaultProductLandingModernThemeConfig()
): ProductLandingModernThemeConfig {
  const source = parseObject(value);
  const meta = parseObject(source.meta);
  const navigation = parseObject(source.navigation);
  const hero = parseObject(source.hero);
  const products = parseObject(source.products);
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
      seoDescription: readLocalizedText(meta.seoDescription, fallback.meta.seoDescription),
    },
    navigation: {
      homeLabel: readLocalizedText(navigation.homeLabel, fallback.navigation.homeLabel),
      showroomLabel: readLocalizedText(navigation.showroomLabel, fallback.navigation.showroomLabel),
      bookingLabel: readLocalizedText(navigation.bookingLabel, fallback.navigation.bookingLabel),
      cartLabel: readLocalizedText(navigation.cartLabel, fallback.navigation.cartLabel),
      authActionLabel: readLocalizedText(
        navigation.authActionLabel,
        fallback.navigation.authActionLabel
      ),
      searchPlaceholder: readLocalizedText(
        navigation.searchPlaceholder,
        fallback.navigation.searchPlaceholder
      ),
    },
    hero: {
      badge: readLocalizedText(hero.badge, fallback.hero.badge),
      line1: readLocalizedText(hero.line1, fallback.hero.line1),
      line2: readLocalizedText(hero.line2, fallback.hero.line2),
      subtitle: readLocalizedText(hero.subtitle, fallback.hero.subtitle),
      primaryActionLabel: readLocalizedText(
        hero.primaryActionLabel,
        fallback.hero.primaryActionLabel
      ),
      secondaryActionLabel: readLocalizedText(
        hero.secondaryActionLabel,
        fallback.hero.secondaryActionLabel
      ),
      heroImagePath: readNullableString(hero.heroImagePath, fallback.hero.heroImagePath),
    },
    products: {
      label: readLocalizedText(products.label, fallback.products.label),
      title: readLocalizedText(products.title, fallback.products.title),
      showMoreActionLabel: readLocalizedText(
        products.showMoreActionLabel,
        fallback.products.showMoreActionLabel
      ),
    },
    features: {
      label: readLocalizedText(features.label, fallback.features.label),
      title: readLocalizedText(features.title, fallback.features.title),
    },
    testimonials: {
      label: readLocalizedText(testimonials.label, fallback.testimonials.label),
      title: readLocalizedText(testimonials.title, fallback.testimonials.title),
    },
    cta: {
      title: readLocalizedText(cta.title, fallback.cta.title),
      subtitle: readLocalizedText(cta.subtitle, fallback.cta.subtitle),
      actionLabel: readLocalizedText(cta.actionLabel, fallback.cta.actionLabel),
    },
    footer: {
      summary: readLocalizedText(footer.summary, fallback.footer.summary),
      linksTitle: readLocalizedText(footer.linksTitle, fallback.footer.linksTitle),
      supportTitle: readLocalizedText(footer.supportTitle, fallback.footer.supportTitle),
      links: readLocalizedStringArray(footer.links, fallback.footer.links),
      supportItems: readLocalizedStringArray(footer.supportItems, fallback.footer.supportItems),
      address: readLocalizedText(footer.address, fallback.footer.address),
      phone: readString(footer.phone, fallback.footer.phone),
      email: readString(footer.email, fallback.footer.email),
      copyright: readLocalizedText(footer.copyright, fallback.footer.copyright),
    },
    stats: Array.isArray(source.stats)
      ? source.stats.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow = fallback.stats[index] ?? fallback.stats[fallback.stats.length - 1];
          return {
            value: readString(row.value, fallbackRow.value),
            label: readLocalizedText(row.label, fallbackRow.label),
          };
        })
      : fallback.stats,
    featureItems: Array.isArray(source.featureItems)
      ? source.featureItems.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.featureItems[index] ?? fallback.featureItems[fallback.featureItems.length - 1];
          return {
            title: readLocalizedText(row.title, fallbackRow.title),
            description: readLocalizedText(row.description, fallbackRow.description),
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
            name: readLocalizedText(row.name, fallbackRow.name),
            text: readLocalizedText(row.text, fallbackRow.text),
            rating: Math.max(1, Math.min(5, Math.round(readNumber(row.rating, fallbackRow.rating)))),
          };
        })
      : fallback.testimonialItems,
    featuredCards: Array.isArray(source.featuredCards)
      ? source.featuredCards.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.featuredCards[index] ?? fallback.featuredCards[fallback.featuredCards.length - 1];
          const rawTag = row.tag;
          const nextTag =
            rawTag === null ? null : readLocalizedText(rawTag, fallbackRow.tag ?? localized("", ""));

          return {
            id: readString(row.id, fallbackRow.id),
            imagePath: readString(row.imagePath, fallbackRow.imagePath),
            name: readLocalizedText(row.name, fallbackRow.name),
            price: readLocalizedText(row.price, fallbackRow.price),
            tag: nextTag && (readString(nextTag.vi, "") || readString(nextTag.en, "")) ? nextTag : null,
          };
        })
      : fallback.featuredCards,
    featuredProductIds: readStringArray(source.featuredProductIds, fallback.featuredProductIds),
    display: {
      showPriceReference: readBoolean(
        display.showPriceReference,
        fallback.display.showPriceReference
      ),
      showSalePriceReference: readBoolean(
        display.showSalePriceReference,
        fallback.display.showSalePriceReference
      ),
      showDepositReference: readBoolean(
        display.showDepositReference,
        fallback.display.showDepositReference
      ),
      showSuccessfulRentCount: readBoolean(
        display.showSuccessfulRentCount,
        fallback.display.showSuccessfulRentCount
      ),
      showShortlist: readBoolean(display.showShortlist, fallback.display.showShortlist),
    },
  };
}
