import type { AppLocale } from "@/constants/locale";
import { TEMPLATE_COPY, type TemplateCopy, type TemplateLang, type TemplateProduct } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import type { ShowroomProductCardDto } from "@/types/productsCatalog";
import type { ProductLanding3DThemeConfig } from "./types";
import { formatVndCurrency, resolveLocalizedText } from "./utils";

function buildDefaultProducts(lang: TemplateLang): TemplateProduct[] {
  return TEMPLATE_COPY[lang].products.map((entry) => ({ ...entry }));
}

export function buildProductLanding3DTemplateCopy(options: {
  config: ProductLanding3DThemeConfig;
  lang: TemplateLang;
  locale: AppLocale;
  featuredProducts: ShowroomProductCardDto[];
}): TemplateCopy {
  const { config, lang, locale, featuredProducts } = options;
  const fallbackCopy = TEMPLATE_COPY[lang];
  const fallbackProducts = buildDefaultProducts(lang);

  const resolvedProducts =
    featuredProducts.length > 0
      ? featuredProducts.slice(0, 4).map((entry, index) => {
          const fallbackProduct = fallbackProducts[index] ?? fallbackProducts[0];
          const imageCandidate =
            (entry as ShowroomProductCardDto & { coverImageUrl?: string | null }).coverImageUrl ??
            (typeof entry.coverImagePath === "string" ? entry.coverImagePath : null);
          const imageUrl = normalizeRenderableImageSrc(imageCandidate);
          const firstTag = Array.isArray(entry.tags)
            ? entry.tags.find((tag) => typeof tag === "string" && tag.trim().length > 0)
            : null;
          const safeTitle = typeof entry.title === "string" ? entry.title.trim() : "";
          const safeCategoryName =
            typeof entry.categoryName === "string" ? entry.categoryName.trim() : "";
          const safePriceLabel =
            typeof entry.priceLabel === "string" ? entry.priceLabel.trim() : "";

          return {
            id: entry.id,
            image: imageUrl ?? fallbackProduct.image,
            name: safeTitle || fallbackProduct.name,
            tag: firstTag ?? (safeCategoryName || (fallbackCopy.products[index]?.tag ?? "Hot")),
            priceLabel:
              (typeof entry.rentPricePerDay === "number"
                ? formatVndCurrency(entry.rentPricePerDay, locale)
                : typeof entry.salePrice === "number"
                  ? formatVndCurrency(entry.salePrice, locale)
                  : safePriceLabel || (fallbackCopy.products[index]?.priceLabel ?? "")),
          };
        })
      : fallbackProducts;

  return {
    ...fallbackCopy,
    navHome: resolveLocalizedText(config.navigation.homeLabel, lang),
    navShowroom: resolveLocalizedText(config.navigation.showroomLabel, lang),
    navBooking: resolveLocalizedText(config.navigation.bookingLabel, lang),
    navCart: resolveLocalizedText(config.navigation.cartLabel, lang),
    navLogin: resolveLocalizedText(config.navigation.loginLabel, lang),
    navSearch: resolveLocalizedText(config.navigation.searchPlaceholder, lang),
    heroBadge: resolveLocalizedText(config.hero.badge, lang),
    heroLine1: resolveLocalizedText(config.hero.line1, lang),
    heroHighlight: resolveLocalizedText(config.hero.highlight, lang),
    heroLine3: resolveLocalizedText(config.hero.line3, lang),
    heroSubtitle: resolveLocalizedText(config.hero.subtitle, lang),
    heroPrimaryAction: resolveLocalizedText(config.hero.primaryActionLabel, lang),
    heroSecondaryAction: resolveLocalizedText(config.hero.secondaryActionLabel, lang),
    heroFeaturedLabel: resolveLocalizedText(config.hero.featuredLabel, lang),
    heroFeaturedName: resolveLocalizedText(config.hero.featuredName, lang),
    heroFeaturedPrice: resolveLocalizedText(config.hero.featuredPrice, lang),
    stats: config.stats.map((entry) => ({
      value: entry.value,
      suffix: entry.suffix,
      label: resolveLocalizedText(entry.label, lang),
    })),
    collectionLabel: resolveLocalizedText(config.collection.label, lang),
    collectionTitle: resolveLocalizedText(config.collection.title, lang),
    collectionHighlight: resolveLocalizedText(config.collection.highlight, lang),
    featuredAction: resolveLocalizedText(config.collection.actionLabel, lang),
    productAction: resolveLocalizedText(config.collection.productActionLabel, lang),
    productPerDay: resolveLocalizedText(config.collection.productPerDayLabel, lang),
    servicesLabel: resolveLocalizedText(config.services.label, lang),
    whyChoosePrefix: resolveLocalizedText(config.services.whyChoosePrefix, lang),
    reviewsLabel: resolveLocalizedText(config.reviews.label, lang),
    reviewsTitle1: resolveLocalizedText(config.reviews.titleLine1, lang),
    reviewsTitle2: resolveLocalizedText(config.reviews.titleLine2, lang),
    ctaTitleLine1: resolveLocalizedText(config.cta.titleLine1, lang),
    ctaTitleHighlight: resolveLocalizedText(config.cta.titleHighlight, lang),
    ctaSubtitle: resolveLocalizedText(config.cta.subtitle, lang),
    ctaPrimaryAction: resolveLocalizedText(config.cta.primaryActionLabel, lang),
    ctaSecondaryAction: resolveLocalizedText(config.cta.secondaryActionLabel, lang),
    categoriesTitle: resolveLocalizedText(config.footer.categoriesTitle, lang),
    supportTitle: resolveLocalizedText(config.footer.supportTitle, lang),
    contactTitle: resolveLocalizedText(config.footer.contactTitle, lang),
    categories: [...config.footer.categories[lang]],
    supportItems: [...config.footer.supportItems[lang]],
    contactAddress: resolveLocalizedText(config.footer.contactAddress, lang),
    footerSummary: resolveLocalizedText(config.footer.summary, lang),
    footerCopyright: resolveLocalizedText(config.footer.copyright, lang),
    products: resolvedProducts,
    features: config.features.map((entry) => ({
      title: resolveLocalizedText(entry.title, lang),
      description: resolveLocalizedText(entry.description, lang),
    })),
    testimonials: config.testimonials.map((entry) => ({
      name: resolveLocalizedText(entry.name, lang),
      role: resolveLocalizedText(entry.role, lang),
      text: resolveLocalizedText(entry.text, lang),
    })),
  };
}
