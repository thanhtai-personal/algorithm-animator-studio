import type { AppLocale } from "@/constants/locale";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import type { ShowroomProductCardDto } from "@/types/productsCatalog";
import { buildDefaultProductLandingModernThemeConfig } from "./defaults";
import type { ProductLandingModernTemplateCopy, ProductLandingModernThemeConfig } from "./types";
import { formatVndCurrency, resolveLocalizedText } from "./utils";

export function buildProductLandingModernTemplateCopy(options: {
  config: ProductLandingModernThemeConfig;
  locale: AppLocale;
  featuredProducts: ShowroomProductCardDto[];
}): ProductLandingModernTemplateCopy {
  const { config, locale, featuredProducts } = options;
  const defaultFallbackCards = buildDefaultProductLandingModernThemeConfig().featuredCards;
  const configuredFallbackSource =
    config.featuredCards.length > 0 ? config.featuredCards : defaultFallbackCards;
  const fallbackCards = configuredFallbackSource.map((entry) => ({
    id: entry.id,
    imagePath: entry.imagePath,
    name: resolveLocalizedText(entry.name, locale),
    price: resolveLocalizedText(entry.price, locale),
    tag: entry.tag ? resolveLocalizedText(entry.tag, locale) : null,
  }));
  const firstFallbackCard = fallbackCards[0] ?? {
    id: "modern-featured-fallback-1",
    imagePath: "/template-assets/kata-modern/product1.jpg",
    name: locale === "vi" ? "Sản phẩm nổi bật" : "Featured product",
    price: locale === "vi" ? "Liên hệ" : "Contact us",
    tag: null,
  };

  const resolvedFeaturedCards =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 4).map((entry, index) => {
          const fallback = fallbackCards[index] ?? firstFallbackCard;
          const imageCandidate =
            (entry as ShowroomProductCardDto & { coverImageUrl?: string | null }).coverImageUrl ??
            (typeof entry.coverImagePath === "string" ? entry.coverImagePath : null);
          const safeTitle = typeof entry.title === "string" ? entry.title.trim() : "";
          const safePrice = typeof entry.priceLabel === "string" ? entry.priceLabel.trim() : "";
          const firstTag = Array.isArray(entry.tags)
            ? entry.tags.find((tag) => typeof tag === "string" && tag.trim().length > 0)
            : null;
          const safeCategory = typeof entry.categoryName === "string" ? entry.categoryName.trim() : "";

          return {
            id: entry.id,
            imagePath: normalizeRenderableImageSrc(imageCandidate) ?? fallback.imagePath,
            name: safeTitle || fallback.name,
            price:
              (typeof entry.rentPricePerDay === "number"
                ? formatVndCurrency(entry.rentPricePerDay, locale)
                : typeof entry.salePrice === "number"
                  ? formatVndCurrency(entry.salePrice, locale)
                  : safePrice || fallback.price),
            tag: firstTag ?? (safeCategory || fallback.tag),
          };
        })
      : fallbackCards.length > 0
        ? fallbackCards
        : [firstFallbackCard];

  const heroImagePath =
    normalizeRenderableImageSrc(config.hero.heroImagePath) ??
    "/template-assets/kata-modern/hero-bg.jpg";

  return {
    pageName: resolveLocalizedText(config.meta.pageName, locale),
    pageLogoUrl: normalizeRenderableImageSrc(config.meta.pageLogoUrl),
    seoDescription: resolveLocalizedText(config.meta.seoDescription, locale),
    navigation: {
      homeLabel: resolveLocalizedText(config.navigation.homeLabel, locale),
      showroomLabel: resolveLocalizedText(config.navigation.showroomLabel, locale),
      bookingLabel: resolveLocalizedText(config.navigation.bookingLabel, locale),
      cartLabel: resolveLocalizedText(config.navigation.cartLabel, locale),
      authActionLabel: resolveLocalizedText(config.navigation.authActionLabel, locale),
      searchPlaceholder: resolveLocalizedText(config.navigation.searchPlaceholder, locale),
    },
    hero: {
      badge: resolveLocalizedText(config.hero.badge, locale),
      line1: resolveLocalizedText(config.hero.line1, locale),
      line2: resolveLocalizedText(config.hero.line2, locale),
      subtitle: resolveLocalizedText(config.hero.subtitle, locale),
      primaryActionLabel: resolveLocalizedText(config.hero.primaryActionLabel, locale),
      secondaryActionLabel: resolveLocalizedText(config.hero.secondaryActionLabel, locale),
      heroImagePath,
    },
    products: {
      label: resolveLocalizedText(config.products.label, locale),
      title: resolveLocalizedText(config.products.title, locale),
      showMoreActionLabel: resolveLocalizedText(config.products.showMoreActionLabel, locale),
    },
    features: {
      label: resolveLocalizedText(config.features.label, locale),
      title: resolveLocalizedText(config.features.title, locale),
    },
    testimonials: {
      label: resolveLocalizedText(config.testimonials.label, locale),
      title: resolveLocalizedText(config.testimonials.title, locale),
    },
    cta: {
      title: resolveLocalizedText(config.cta.title, locale),
      subtitle: resolveLocalizedText(config.cta.subtitle, locale),
      actionLabel: resolveLocalizedText(config.cta.actionLabel, locale),
    },
    footer: {
      summary: resolveLocalizedText(config.footer.summary, locale),
      linksTitle: resolveLocalizedText(config.footer.linksTitle, locale),
      supportTitle: resolveLocalizedText(config.footer.supportTitle, locale),
      links: [...config.footer.links[locale]],
      supportItems: [...config.footer.supportItems[locale]],
      address: resolveLocalizedText(config.footer.address, locale),
      phone: config.footer.phone,
      email: config.footer.email,
      copyright: resolveLocalizedText(config.footer.copyright, locale),
    },
    stats: config.stats.map((entry) => ({
      value: entry.value,
      label: resolveLocalizedText(entry.label, locale),
    })),
    featureItems: config.featureItems.map((entry) => ({
      title: resolveLocalizedText(entry.title, locale),
      description: resolveLocalizedText(entry.description, locale),
    })),
    testimonialItems: config.testimonialItems.map((entry) => ({
      name: resolveLocalizedText(entry.name, locale),
      text: resolveLocalizedText(entry.text, locale),
      rating: entry.rating,
    })),
    featuredCards: resolvedFeaturedCards,
    display: config.display,
  };
}
