import type { AppLocale } from "@/constants/locale";

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface ProductLandingModernThemeConfig {
  version: 1;
  themeCode: string;
  meta: {
    pageName: LocalizedText;
    pageLogoUrl: string | null;
    seoDescription: LocalizedText;
  };
  navigation: {
    homeLabel: LocalizedText;
    showroomLabel: LocalizedText;
    bookingLabel: LocalizedText;
    cartLabel: LocalizedText;
    authActionLabel: LocalizedText;
    searchPlaceholder: LocalizedText;
  };
  hero: {
    badge: LocalizedText;
    line1: LocalizedText;
    line2: LocalizedText;
    subtitle: LocalizedText;
    primaryActionLabel: LocalizedText;
    secondaryActionLabel: LocalizedText;
    heroImagePath: string | null;
  };
  products: {
    label: LocalizedText;
    title: LocalizedText;
    showMoreActionLabel: LocalizedText;
  };
  features: {
    label: LocalizedText;
    title: LocalizedText;
  };
  testimonials: {
    label: LocalizedText;
    title: LocalizedText;
  };
  cta: {
    title: LocalizedText;
    subtitle: LocalizedText;
    actionLabel: LocalizedText;
  };
  footer: {
    summary: LocalizedText;
    linksTitle: LocalizedText;
    supportTitle: LocalizedText;
    links: Record<AppLocale, string[]>;
    supportItems: Record<AppLocale, string[]>;
    address: LocalizedText;
    phone: string;
    email: string;
    copyright: LocalizedText;
  };
  stats: Array<{
    value: string;
    label: LocalizedText;
  }>;
  featureItems: Array<{
    title: LocalizedText;
    description: LocalizedText;
  }>;
  testimonialItems: Array<{
    name: LocalizedText;
    text: LocalizedText;
    rating: number;
  }>;
  featuredCards: Array<{
    id: string;
    imagePath: string;
    name: LocalizedText;
    price: LocalizedText;
    tag: LocalizedText | null;
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

export interface ProductLandingModernTemplateCopy {
  pageName: string;
  pageLogoUrl: string | null;
  seoDescription: string;
  navigation: {
    homeLabel: string;
    showroomLabel: string;
    bookingLabel: string;
    cartLabel: string;
    authActionLabel: string;
    searchPlaceholder: string;
  };
  hero: {
    badge: string;
    line1: string;
    line2: string;
    subtitle: string;
    primaryActionLabel: string;
    secondaryActionLabel: string;
    heroImagePath: string;
  };
  products: {
    label: string;
    title: string;
    showMoreActionLabel: string;
  };
  features: {
    label: string;
    title: string;
  };
  testimonials: {
    label: string;
    title: string;
  };
  cta: {
    title: string;
    subtitle: string;
    actionLabel: string;
  };
  footer: {
    summary: string;
    linksTitle: string;
    supportTitle: string;
    links: string[];
    supportItems: string[];
    address: string;
    phone: string;
    email: string;
    copyright: string;
  };
  stats: Array<{
    value: string;
    label: string;
  }>;
  featureItems: Array<{
    title: string;
    description: string;
  }>;
  testimonialItems: Array<{
    name: string;
    text: string;
    rating: number;
  }>;
  featuredCards: Array<{
    id: string;
    imagePath: string;
    name: string;
    price: string;
    tag: string | null;
  }>;
  display: ProductLandingModernThemeConfig["display"];
}
