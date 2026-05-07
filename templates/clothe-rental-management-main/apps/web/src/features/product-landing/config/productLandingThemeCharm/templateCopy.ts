import type { AppLocale } from "@/constants/locale";
import { TEMPLATE_COPY, type TemplateCopy, type TemplateFeature, type TemplateProduct, type TemplateStat, type TemplateTestimonial } from "@/features/product-landing/components/templates/charm/productLandingTemplateCharm.config";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import type { ShowroomProductCardDto } from "@/types/productsCatalog";
import type { ProductLandingCharmThemeConfig } from "./types";
import { formatVndCurrency, resolveProductLandingCharmLocalizedText } from "./utils";

function buildDefaultProducts(locale: AppLocale): TemplateProduct[] {
  return TEMPLATE_COPY[locale].products.map((entry) => ({ ...entry }));
}

export function resolveProductLandingCharmHeroImage(config: ProductLandingCharmThemeConfig): string {
  return normalizeRenderableImageSrc(config.hero.heroImagePath) ?? "/template-assets/kata-charm/hero-bg.jpg";
}

export function buildProductLandingCharmTemplateCopy(options: {
  config: ProductLandingCharmThemeConfig;
  locale: AppLocale;
  featuredProducts: ShowroomProductCardDto[];
}): TemplateCopy {
  const { config, locale, featuredProducts } = options;
  const fallbackCopy = TEMPLATE_COPY[locale];
  const defaultProducts = buildDefaultProducts(locale);
  const configuredProducts = config.products.map((entry) => ({
    id: entry.id,
    name: resolveProductLandingCharmLocalizedText(entry.name, locale),
    price: resolveProductLandingCharmLocalizedText(entry.price, locale),
    tag: resolveProductLandingCharmLocalizedText(entry.tag, locale),
    image: entry.image,
  }));
  const fallbackProducts = configuredProducts.length > 0 ? configuredProducts : defaultProducts;

  const resolvedProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 6).map((entry, index) => {
          const fallbackProduct = fallbackProducts[index] ?? fallbackProducts[0];
          const imageCandidate =
            (entry as ShowroomProductCardDto & { coverImageUrl?: string | null }).coverImageUrl ??
            (typeof entry.coverImagePath === "string" ? entry.coverImagePath : null);
          const firstTag = Array.isArray(entry.tags)
            ? entry.tags.find((tag) => typeof tag === "string" && tag.trim().length > 0)
            : null;
          const safeTitle = typeof entry.title === "string" ? entry.title.trim() : "";
          const safePriceLabel =
            typeof entry.priceLabel === "string" ? entry.priceLabel.trim() : "";
          const safeCategory = typeof entry.categoryName === "string" ? entry.categoryName.trim() : "";

          return {
            id: entry.id,
            image: normalizeRenderableImageSrc(imageCandidate) ?? fallbackProduct.image,
            name: safeTitle || fallbackProduct.name,
            price:
              (typeof entry.rentPricePerDay === "number"
                ? formatVndCurrency(entry.rentPricePerDay, locale)
                : typeof entry.salePrice === "number"
                  ? formatVndCurrency(entry.salePrice, locale)
                  : safePriceLabel || fallbackProduct.price),
            tag: firstTag ?? (safeCategory || fallbackProduct.tag),
          };
        })
      : fallbackProducts;

  const navLabels = [
    resolveProductLandingCharmLocalizedText(config.navigation.homeLabel, locale),
    resolveProductLandingCharmLocalizedText(config.navigation.showroomLabel, locale),
    resolveProductLandingCharmLocalizedText(config.navigation.bookingLabel, locale),
  ];

  return {
    ...fallbackCopy,
    navItems: fallbackCopy.navItems.map((entry, index) => ({
      ...entry,
      label: navLabels[index] ?? entry.label,
    })),
    searchPlaceholder: resolveProductLandingCharmLocalizedText(config.navigation.searchPlaceholder, locale),
    signInLabel: resolveProductLandingCharmLocalizedText(config.navigation.signInLabel, locale),
    heroBadge: resolveProductLandingCharmLocalizedText(config.hero.badge, locale),
    heroLine1: resolveProductLandingCharmLocalizedText(config.hero.line1, locale),
    heroLine2: resolveProductLandingCharmLocalizedText(config.hero.line2, locale),
    heroSubtitle: resolveProductLandingCharmLocalizedText(config.hero.subtitle, locale),
    heroSearchAction: resolveProductLandingCharmLocalizedText(config.hero.searchActionLabel, locale),
    featuredTitle: resolveProductLandingCharmLocalizedText(config.featured.title, locale),
    featuredSubtitle: resolveProductLandingCharmLocalizedText(config.featured.subtitle, locale),
    featuredShowMore: resolveProductLandingCharmLocalizedText(config.featured.showMoreActionLabel, locale),
    rentNowAction: resolveProductLandingCharmLocalizedText(config.featured.rentNowActionLabel, locale),
    featuresTitle: resolveProductLandingCharmLocalizedText(config.features.title, locale),
    featuresSubtitle: resolveProductLandingCharmLocalizedText(config.features.subtitle, locale),
    testimonialsTitle: resolveProductLandingCharmLocalizedText(config.testimonials.title, locale),
    testimonialsSubtitle: resolveProductLandingCharmLocalizedText(config.testimonials.subtitle, locale),
    ctaTitle: resolveProductLandingCharmLocalizedText(config.cta.title, locale),
    ctaSubtitle: resolveProductLandingCharmLocalizedText(config.cta.subtitle, locale),
    ctaShowroomAction: resolveProductLandingCharmLocalizedText(config.cta.showroomActionLabel, locale),
    footerSummary: resolveProductLandingCharmLocalizedText(config.footer.summary, locale),
    footerProductsTitle: resolveProductLandingCharmLocalizedText(config.footer.productsTitle, locale),
    footerSupportTitle: resolveProductLandingCharmLocalizedText(config.footer.supportTitle, locale),
    footerContactTitle: resolveProductLandingCharmLocalizedText(config.footer.contactTitle, locale),
    footerProducts: [...config.footer.products[locale]],
    footerSupport: [...config.footer.support[locale]],
    footerContactLines: [...config.footer.contactLines[locale]],
    footerMadeWith: resolveProductLandingCharmLocalizedText(config.footer.madeWith, locale),
    stats: config.stats.map<TemplateStat>((entry) => ({
      value: entry.value,
      suffix: entry.suffix,
      label: resolveProductLandingCharmLocalizedText(entry.label, locale),
      emoji: entry.emoji,
    })),
    products: resolvedProducts,
    features: config.featureItems.map<TemplateFeature>((entry) => ({
      title: resolveProductLandingCharmLocalizedText(entry.title, locale),
      description: resolveProductLandingCharmLocalizedText(entry.description, locale),
      gradientClass: entry.gradientClass,
    })),
    testimonials: config.testimonialItems.map<TemplateTestimonial>((entry) => ({
      quote: resolveProductLandingCharmLocalizedText(entry.quote, locale),
      name: resolveProductLandingCharmLocalizedText(entry.name, locale),
      role: resolveProductLandingCharmLocalizedText(entry.role, locale),
      stars: entry.stars,
    })),
  };
}
