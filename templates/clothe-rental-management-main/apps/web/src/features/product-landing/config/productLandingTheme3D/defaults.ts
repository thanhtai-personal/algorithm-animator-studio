import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D } from "@/features/showroom/constants";
import { TEMPLATE_COPY } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";
import type { ProductLanding3DThemeConfig } from "./types";
import { localized } from "./utils";

export function buildDefaultProductLanding3DThemeConfig(): ProductLanding3DThemeConfig {
  const vi = TEMPLATE_COPY.vi;
  const en = TEMPLATE_COPY.en;

  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
    meta: {
      pageName: localized("KATA 3D Showcase", "KATA 3D Showcase"),
      pageLogoUrl: null,
      seoDescription: localized(
        "Trang phục cao cấp cho mọi dịp đặc biệt.",
        "Premium outfits for every special moment."
      ),
    },
    navigation: {
      homeLabel: localized(vi.navHome, en.navHome),
      showroomLabel: localized(vi.navShowroom, en.navShowroom),
      bookingLabel: localized(vi.navBooking, en.navBooking),
      cartLabel: localized(vi.navCart, en.navCart),
      loginLabel: localized(vi.navLogin, en.navLogin),
      searchPlaceholder: localized(vi.navSearch, en.navSearch),
    },
    hero: {
      badge: localized(vi.heroBadge, en.heroBadge),
      line1: localized(vi.heroLine1, en.heroLine1),
      highlight: localized(vi.heroHighlight, en.heroHighlight),
      line3: localized(vi.heroLine3, en.heroLine3),
      subtitle: localized(vi.heroSubtitle, en.heroSubtitle),
      primaryActionLabel: localized(vi.heroPrimaryAction, en.heroPrimaryAction),
      secondaryActionLabel: localized(vi.heroSecondaryAction, en.heroSecondaryAction),
      featuredLabel: localized(vi.heroFeaturedLabel, en.heroFeaturedLabel),
      featuredName: localized(vi.heroFeaturedName, en.heroFeaturedName),
      featuredPrice: localized(vi.heroFeaturedPrice, en.heroFeaturedPrice),
      heroImagePath: "/template-assets/kata-3d/hero-dress.jpg",
    },
    collection: {
      label: localized(vi.collectionLabel, en.collectionLabel),
      title: localized(vi.collectionTitle, en.collectionTitle),
      highlight: localized(vi.collectionHighlight, en.collectionHighlight),
      actionLabel: localized(vi.featuredAction, en.featuredAction),
      productActionLabel: localized(vi.productAction, en.productAction),
      productPerDayLabel: localized(vi.productPerDay, en.productPerDay),
    },
    services: {
      label: localized(vi.servicesLabel, en.servicesLabel),
      whyChoosePrefix: localized(vi.whyChoosePrefix, en.whyChoosePrefix),
    },
    reviews: {
      label: localized(vi.reviewsLabel, en.reviewsLabel),
      titleLine1: localized(vi.reviewsTitle1, en.reviewsTitle1),
      titleLine2: localized(vi.reviewsTitle2, en.reviewsTitle2),
    },
    cta: {
      titleLine1: localized(vi.ctaTitleLine1, en.ctaTitleLine1),
      titleHighlight: localized(vi.ctaTitleHighlight, en.ctaTitleHighlight),
      subtitle: localized(vi.ctaSubtitle, en.ctaSubtitle),
      primaryActionLabel: localized(vi.ctaPrimaryAction, en.ctaPrimaryAction),
      secondaryActionLabel: localized(vi.ctaSecondaryAction, en.ctaSecondaryAction),
    },
    footer: {
      categoriesTitle: localized(vi.categoriesTitle, en.categoriesTitle),
      supportTitle: localized(vi.supportTitle, en.supportTitle),
      contactTitle: localized(vi.contactTitle, en.contactTitle),
      categories: {
        vi: [...vi.categories],
        en: [...en.categories],
      },
      supportItems: {
        vi: [...vi.supportItems],
        en: [...en.supportItems],
      },
      contactAddress: localized(vi.contactAddress, en.contactAddress),
      summary: localized(vi.footerSummary, en.footerSummary),
      copyright: localized(vi.footerCopyright, en.footerCopyright),
    },
    stats: vi.stats.map((entry, index) => ({
      value: entry.value,
      suffix: entry.suffix,
      label: localized(entry.label, en.stats[index]?.label ?? entry.label),
    })),
    features: vi.features.map((entry, index) => ({
      title: localized(entry.title, en.features[index]?.title ?? entry.title),
      description: localized(
        entry.description,
        en.features[index]?.description ?? entry.description
      ),
    })),
    testimonials: vi.testimonials.map((entry, index) => ({
      name: localized(entry.name, en.testimonials[index]?.name ?? entry.name),
      role: localized(entry.role, en.testimonials[index]?.role ?? entry.role),
      text: localized(entry.text, en.testimonials[index]?.text ?? entry.text),
    })),
    featuredProductIds: [],
    display: {
      showPriceReference: true,
      showSalePriceReference: true,
      showDepositReference: true,
      showSuccessfulRentCount: true,
      showShortlist: true,
    },
    appearance: {
      defaultMode: "dark",
      defaultPalette: "gold",
    },
  };
}
