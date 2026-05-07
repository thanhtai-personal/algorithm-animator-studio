import type { PaletteMode, ThemeMode } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";
import type { ProductLanding3DThemeConfig } from "./types";
import { buildDefaultProductLanding3DThemeConfig } from "./defaults";
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

export function normalizeProductLanding3DThemeConfig(
  value: unknown,
  fallback = buildDefaultProductLanding3DThemeConfig()
): ProductLanding3DThemeConfig {
  const source = parseObject(value);
  const meta = parseObject(source.meta);
  const navigation = parseObject(source.navigation);
  const hero = parseObject(source.hero);
  const collection = parseObject(source.collection);
  const services = parseObject(source.services);
  const reviews = parseObject(source.reviews);
  const cta = parseObject(source.cta);
  const footer = parseObject(source.footer);
  const display = parseObject(source.display);
  const appearance = parseObject(source.appearance);

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
      loginLabel: readLocalizedText(navigation.loginLabel, fallback.navigation.loginLabel),
      searchPlaceholder: readLocalizedText(
        navigation.searchPlaceholder,
        fallback.navigation.searchPlaceholder
      ),
    },
    hero: {
      badge: readLocalizedText(hero.badge, fallback.hero.badge),
      line1: readLocalizedText(hero.line1, fallback.hero.line1),
      highlight: readLocalizedText(hero.highlight, fallback.hero.highlight),
      line3: readLocalizedText(hero.line3, fallback.hero.line3),
      subtitle: readLocalizedText(hero.subtitle, fallback.hero.subtitle),
      primaryActionLabel: readLocalizedText(
        hero.primaryActionLabel,
        fallback.hero.primaryActionLabel
      ),
      secondaryActionLabel: readLocalizedText(
        hero.secondaryActionLabel,
        fallback.hero.secondaryActionLabel
      ),
      featuredLabel: readLocalizedText(hero.featuredLabel, fallback.hero.featuredLabel),
      featuredName: readLocalizedText(hero.featuredName, fallback.hero.featuredName),
      featuredPrice: readLocalizedText(hero.featuredPrice, fallback.hero.featuredPrice),
      heroImagePath: readNullableString(hero.heroImagePath, fallback.hero.heroImagePath),
    },
    collection: {
      label: readLocalizedText(collection.label, fallback.collection.label),
      title: readLocalizedText(collection.title, fallback.collection.title),
      highlight: readLocalizedText(collection.highlight, fallback.collection.highlight),
      actionLabel: readLocalizedText(collection.actionLabel, fallback.collection.actionLabel),
      productActionLabel: readLocalizedText(
        collection.productActionLabel,
        fallback.collection.productActionLabel
      ),
      productPerDayLabel: readLocalizedText(
        collection.productPerDayLabel,
        fallback.collection.productPerDayLabel
      ),
    },
    services: {
      label: readLocalizedText(services.label, fallback.services.label),
      whyChoosePrefix: readLocalizedText(
        services.whyChoosePrefix,
        fallback.services.whyChoosePrefix
      ),
    },
    reviews: {
      label: readLocalizedText(reviews.label, fallback.reviews.label),
      titleLine1: readLocalizedText(reviews.titleLine1, fallback.reviews.titleLine1),
      titleLine2: readLocalizedText(reviews.titleLine2, fallback.reviews.titleLine2),
    },
    cta: {
      titleLine1: readLocalizedText(cta.titleLine1, fallback.cta.titleLine1),
      titleHighlight: readLocalizedText(cta.titleHighlight, fallback.cta.titleHighlight),
      subtitle: readLocalizedText(cta.subtitle, fallback.cta.subtitle),
      primaryActionLabel: readLocalizedText(
        cta.primaryActionLabel,
        fallback.cta.primaryActionLabel
      ),
      secondaryActionLabel: readLocalizedText(
        cta.secondaryActionLabel,
        fallback.cta.secondaryActionLabel
      ),
    },
    footer: {
      categoriesTitle: readLocalizedText(footer.categoriesTitle, fallback.footer.categoriesTitle),
      supportTitle: readLocalizedText(footer.supportTitle, fallback.footer.supportTitle),
      contactTitle: readLocalizedText(footer.contactTitle, fallback.footer.contactTitle),
      categories: readLocalizedStringArray(footer.categories, fallback.footer.categories),
      supportItems: readLocalizedStringArray(footer.supportItems, fallback.footer.supportItems),
      contactAddress: readLocalizedText(footer.contactAddress, fallback.footer.contactAddress),
      summary: readLocalizedText(footer.summary, fallback.footer.summary),
      copyright: readLocalizedText(footer.copyright, fallback.footer.copyright),
    },
    stats: Array.isArray(source.stats)
      ? source.stats.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow = fallback.stats[index] ?? fallback.stats[fallback.stats.length - 1];
          return {
            value: readNumber(row.value, fallbackRow.value),
            suffix: readString(row.suffix, fallbackRow.suffix),
            label: readLocalizedText(row.label, fallbackRow.label),
          };
        })
      : fallback.stats,
    features: Array.isArray(source.features)
      ? source.features.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.features[index] ?? fallback.features[fallback.features.length - 1];
          return {
            title: readLocalizedText(row.title, fallbackRow.title),
            description: readLocalizedText(row.description, fallbackRow.description),
          };
        })
      : fallback.features,
    testimonials: Array.isArray(source.testimonials)
      ? source.testimonials.map((entry, index) => {
          const row = parseObject(entry);
          const fallbackRow =
            fallback.testimonials[index] ??
            fallback.testimonials[fallback.testimonials.length - 1];
          return {
            name: readLocalizedText(row.name, fallbackRow.name),
            role: readLocalizedText(row.role, fallbackRow.role),
            text: readLocalizedText(row.text, fallbackRow.text),
          };
        })
      : fallback.testimonials,
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
    appearance: {
      defaultMode: readString(appearance.defaultMode, fallback.appearance.defaultMode) as ThemeMode,
      defaultPalette: readString(
        appearance.defaultPalette,
        fallback.appearance.defaultPalette
      ) as PaletteMode,
    },
  };
}
