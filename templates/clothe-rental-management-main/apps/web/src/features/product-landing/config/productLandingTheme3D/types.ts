import type { PaletteMode, TemplateLang, ThemeMode } from "@/features/product-landing/components/templates/three-d/productLandingTemplate3D.config";

export interface LocalizedText {
  vi: string;
  en: string;
}

export interface ProductLanding3DStatConfig {
  value: number;
  suffix: string;
  label: LocalizedText;
}

export interface ProductLanding3DFeatureConfig {
  title: LocalizedText;
  description: LocalizedText;
}

export interface ProductLanding3DTestimonialConfig {
  name: LocalizedText;
  role: LocalizedText;
  text: LocalizedText;
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
    categories: Record<TemplateLang, string[]>;
    supportItems: Record<TemplateLang, string[]>;
    contactAddress: LocalizedText;
    summary: LocalizedText;
    copyright: LocalizedText;
  };
  stats: ProductLanding3DStatConfig[];
  features: ProductLanding3DFeatureConfig[];
  testimonials: ProductLanding3DTestimonialConfig[];
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

export interface ProductLandingThemeConfigSchema {
  version: 1;
  themeCode: string;
  editor: "legacy" | "theme-3d" | "theme-charm" | "theme-modern";
  title: string;
  fieldGroups: Array<{
    key: string;
    title: string;
  }>;
}
