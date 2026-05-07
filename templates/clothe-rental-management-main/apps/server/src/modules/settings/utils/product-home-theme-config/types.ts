export type AppLocale = 'vi' | 'en';
export type ThemeMode = 'dark' | 'light';
export type PaletteMode = 'gold' | 'rose' | 'ocean' | 'emerald';

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface ProductLanding3DThemeConfig {
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
    loginLabel: LocalizedText;
    searchPlaceholder: LocalizedText;
  };
  hero: {
    badge: LocalizedText;
    line1: LocalizedText;
    highlight: LocalizedText;
    line3: LocalizedText;
    subtitle: LocalizedText;
    primaryActionLabel: LocalizedText;
    secondaryActionLabel: LocalizedText;
    featuredLabel: LocalizedText;
    featuredName: LocalizedText;
    featuredPrice: LocalizedText;
    heroImagePath: string | null;
  };
  collection: {
    label: LocalizedText;
    title: LocalizedText;
    highlight: LocalizedText;
    actionLabel: LocalizedText;
    productActionLabel: LocalizedText;
    productPerDayLabel: LocalizedText;
  };
  services: {
    label: LocalizedText;
    whyChoosePrefix: LocalizedText;
  };
  reviews: {
    label: LocalizedText;
    titleLine1: LocalizedText;
    titleLine2: LocalizedText;
  };
  cta: {
    titleLine1: LocalizedText;
    titleHighlight: LocalizedText;
    subtitle: LocalizedText;
    primaryActionLabel: LocalizedText;
    secondaryActionLabel: LocalizedText;
  };
  footer: {
    categoriesTitle: LocalizedText;
    supportTitle: LocalizedText;
    contactTitle: LocalizedText;
    categories: Record<AppLocale, string[]>;
    supportItems: Record<AppLocale, string[]>;
    contactAddress: LocalizedText;
    summary: LocalizedText;
    copyright: LocalizedText;
  };
  stats: Array<{
    value: number;
    suffix: string;
    label: LocalizedText;
  }>;
  features: Array<{
    title: LocalizedText;
    description: LocalizedText;
  }>;
  testimonials: Array<{
    name: LocalizedText;
    role: LocalizedText;
    text: LocalizedText;
  }>;
  featuredProductIds: string[];
  display: {
    showPriceReference: boolean;
    showSalePriceReference: boolean;
    showDepositReference: boolean;
    showSuccessfulRentCount: boolean;
    showShortlist: boolean;
  };
  appearance: {
    defaultMode: ThemeMode;
    defaultPalette: PaletteMode;
  };
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

export interface ProductLandingThemeConfigSchema {
  version: 1;
  themeCode: string;
  editor: 'legacy' | 'theme-3d' | 'theme-charm' | 'theme-modern';
  title: string;
  fieldGroups: Array<{
    key: string;
    title: string;
  }>;
}
