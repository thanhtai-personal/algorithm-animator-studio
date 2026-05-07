import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM } from "@/features/showroom/constants";
import { TEMPLATE_COPY } from "@/features/product-landing/components/templates/charm/productLandingTemplateCharm.config";
import type { ProductLandingCharmThemeConfig } from "./types";
import { localized } from "./utils";

export function buildDefaultProductLandingCharmThemeConfig(): ProductLandingCharmThemeConfig {
  const vi = TEMPLATE_COPY.vi;
  const en = TEMPLATE_COPY.en;

  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
    meta: {
      pageName: localized("KATA Charm", "KATA Charm"),
      pageLogoUrl: null,
    },
    navigation: {
      homeLabel: localized(vi.navItems[0]?.label ?? "Trang chủ", en.navItems[0]?.label ?? "Home"),
      showroomLabel: localized(vi.navItems[1]?.label ?? "Phòng trưng bày", en.navItems[1]?.label ?? "Showroom"),
      bookingLabel: localized(vi.navItems[2]?.label ?? "Đặt lịch makeup", en.navItems[2]?.label ?? "Book makeup"),
      searchPlaceholder: localized(vi.searchPlaceholder, en.searchPlaceholder),
      signInLabel: localized(vi.signInLabel, en.signInLabel),
    },
    hero: {
      badge: localized(vi.heroBadge, en.heroBadge),
      line1: localized(vi.heroLine1, en.heroLine1),
      line2: localized(vi.heroLine2, en.heroLine2),
      subtitle: localized(vi.heroSubtitle, en.heroSubtitle),
      searchActionLabel: localized(vi.heroSearchAction, en.heroSearchAction),
      heroImagePath: "/template-assets/kata-charm/hero-bg.jpg",
    },
    featured: {
      title: localized(vi.featuredTitle, en.featuredTitle),
      subtitle: localized(vi.featuredSubtitle, en.featuredSubtitle),
      showMoreActionLabel: localized(vi.featuredShowMore, en.featuredShowMore),
      rentNowActionLabel: localized(vi.rentNowAction, en.rentNowAction),
    },
    features: {
      title: localized(vi.featuresTitle, en.featuresTitle),
      subtitle: localized(vi.featuresSubtitle, en.featuresSubtitle),
    },
    testimonials: {
      title: localized(vi.testimonialsTitle, en.testimonialsTitle),
      subtitle: localized(vi.testimonialsSubtitle, en.testimonialsSubtitle),
    },
    cta: {
      title: localized(vi.ctaTitle, en.ctaTitle),
      subtitle: localized(vi.ctaSubtitle, en.ctaSubtitle),
      showroomActionLabel: localized(vi.ctaShowroomAction, en.ctaShowroomAction),
    },
    footer: {
      summary: localized(vi.footerSummary, en.footerSummary),
      productsTitle: localized(vi.footerProductsTitle, en.footerProductsTitle),
      supportTitle: localized(vi.footerSupportTitle, en.footerSupportTitle),
      contactTitle: localized(vi.footerContactTitle, en.footerContactTitle),
      products: { vi: [...vi.footerProducts], en: [...en.footerProducts] },
      support: { vi: [...vi.footerSupport], en: [...en.footerSupport] },
      contactLines: { vi: [...vi.footerContactLines], en: [...en.footerContactLines] },
      madeWith: localized(vi.footerMadeWith, en.footerMadeWith),
    },
    stats: vi.stats.map((entry, index) => ({
      value: entry.value,
      suffix: entry.suffix,
      label: localized(entry.label, en.stats[index]?.label ?? entry.label),
      emoji: entry.emoji,
    })),
    products: vi.products.map((entry, index) => ({
      id: entry.id,
      name: localized(entry.name, en.products[index]?.name ?? entry.name),
      price: localized(entry.price, en.products[index]?.price ?? entry.price),
      tag: localized(entry.tag, en.products[index]?.tag ?? entry.tag),
      image: entry.image,
    })),
    featureItems: vi.features.map((entry, index) => ({
      title: localized(entry.title, en.features[index]?.title ?? entry.title),
      description: localized(entry.description, en.features[index]?.description ?? entry.description),
      gradientClass: entry.gradientClass,
    })),
    testimonialItems: vi.testimonials.map((entry, index) => ({
      quote: localized(entry.quote, en.testimonials[index]?.quote ?? entry.quote),
      name: localized(entry.name, en.testimonials[index]?.name ?? entry.name),
      role: localized(entry.role, en.testimonials[index]?.role ?? entry.role),
      stars: entry.stars,
    })),
    featuredProductIds: [],
    display: {
      showPriceReference: true,
      showSalePriceReference: true,
      showDepositReference: true,
      showSuccessfulRentCount: true,
      showShortlist: true,
    },
  };
}
