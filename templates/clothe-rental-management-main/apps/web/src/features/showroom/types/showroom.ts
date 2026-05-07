import type { AppLocale } from "@/constants/locale";

export interface ShowroomHeroConfig {
  heading: string;
  subheading: string;
  showSearchBox: boolean;
  showShortlistCta: boolean;
}

export interface ShowroomDisplayConfig {
  showPriceReference: boolean;
  showSalePriceReference: boolean;
  showDepositReference: boolean;
  showSuccessfulRentCount: boolean;
  showShortlist: boolean;
}

export interface ShowroomFiltersConfig {
  category: boolean;
  tag: boolean;
  gender: boolean;
  size: boolean;
  color: boolean;
  textSearch: boolean;
}

export interface ShowroomPageViewConfig {
  branchId: string | null;
  locale: AppLocale;
  pageKey: "PRODUCT_HOME";
  templateCode: string;
  templateVersion: number;
  title: string;
  subtitle: string;
  hero: ShowroomHeroConfig;
  display: ShowroomDisplayConfig;
  filters: ShowroomFiltersConfig;
  fallbackUsed: boolean;
}

export interface ShowroomShortlistItem {
  productId: string;
  title: string;
  coverImagePath: string | null;
  categoryName: string | null;
  price1d: number | null;
  note: string;
  addedAt: string;
}
