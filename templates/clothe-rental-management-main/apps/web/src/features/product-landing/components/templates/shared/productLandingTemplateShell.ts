import type { AppLocale } from "@/constants/locale";

export interface ProductLandingTemplateShell {
  authActionLabel: string;
  authHref: string;
  hasCloudSession: boolean;
  homeHref: string;
  siteLogoUrl?: string | null;
  isHomeActive: boolean;
  isShortlistActive: boolean;
  isShowroomActive: boolean;
  searchQuery?: string;
  showroomHref: string;
  shortlistCount: number;
  shortlistHref: string;
  submitSearch: (query: string) => void;
  switchLocale: (locale: AppLocale) => void;
  handleAuthAction: () => void | Promise<void>;
}
