import type { AppLocale } from "@/constants/locale";

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface ProductLandingCharmThemeConfig {
  version: 1;
  themeCode: string;
  meta: {
    pageName: LocalizedText;
    pageLogoUrl: string | null;
  };
  navigation: {
    homeLabel: LocalizedText;
    showroomLabel: LocalizedText;
    bookingLabel: LocalizedText;
    searchPlaceholder: LocalizedText;
    signInLabel: LocalizedText;
  };
  hero: {
    badge: LocalizedText;
    line1: LocalizedText;
    line2: LocalizedText;
    subtitle: LocalizedText;
    searchActionLabel: LocalizedText;
    heroImagePath: string | null;
  };
  featured: {
    title: LocalizedText;
    subtitle: LocalizedText;
    showMoreActionLabel: LocalizedText;
    rentNowActionLabel: LocalizedText;
  };
  features: {
    title: LocalizedText;
    subtitle: LocalizedText;
  };
  testimonials: {
    title: LocalizedText;
    subtitle: LocalizedText;
  };
  cta: {
    title: LocalizedText;
    subtitle: LocalizedText;
    showroomActionLabel: LocalizedText;
  };
  footer: {
    summary: LocalizedText;
    productsTitle: LocalizedText;
    supportTitle: LocalizedText;
    contactTitle: LocalizedText;
    products: Record<AppLocale, string[]>;
    support: Record<AppLocale, string[]>;
    contactLines: Record<AppLocale, string[]>;
    madeWith: LocalizedText;
  };
  stats: Array<{
    value: number;
    suffix: string;
    label: LocalizedText;
    emoji: string;
  }>;
  products: Array<{
    id: string;
    name: LocalizedText;
    price: LocalizedText;
    tag: LocalizedText;
    image: string;
  }>;
  featureItems: Array<{
    title: LocalizedText;
    description: LocalizedText;
    gradientClass: string;
  }>;
  testimonialItems: Array<{
    quote: LocalizedText;
    name: LocalizedText;
    role: LocalizedText;
    stars: number;
  }>;
  featuredProductIds: string[];
  display: {
    showPriceReference: boolean;
    showSalePriceReference: boolean;
    showDepositReference: boolean;
    showSuccessfulRentCount: boolean;
    showShortlist: boolean;
  };
}
