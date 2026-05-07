import type { AppLocale } from "@/constants/locale";
import {
  isProductLandingCharmTemplateCode,
  migrateLegacyProductLandingCharmThemeConfig,
  resolveProductLandingCharmLocalizedText,
} from "@/features/product-landing/config/productLandingThemeCharm";
import { migrateLegacyProductLanding3DThemeConfig } from "@/features/product-landing/config/productLandingTheme3D";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";
import {
  SHOWROOM_DEFAULT_TEMPLATE_CODE,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import type { ShowroomPageViewConfig } from "@/features/showroom/types/showroom";

const DEFAULT_PAGE_COPY: Record<AppLocale, { title: string; subtitle: string }> = {
  vi: {
    title: "Phòng trưng bày cho thuê",
    subtitle: "Chọn trước trang phục bạn muốn thử trước khi đến cửa hàng.",
  },
  en: {
    title: "Rental showroom",
    subtitle: "Shortlist outfits before visiting the shop.",
  },
};

const LEGACY_VI_TEXT_MAP: Record<string, string> = {
  "showroom cho thue": "Phòng trưng bày cho thuê",
  "showroom cho thue quan ao": "Phòng trưng bày cho thuê quần áo",
  "chon truoc trang phuc ban muon thu truoc khi den cua hang":
    "Chọn trước trang phục bạn muốn thử trước khi đến cửa hàng.",
  "chon truoc trang phuc ban muon thu truoc khi den shop":
    "Chọn trước trang phục bạn muốn thử trước khi đến shop.",
  "kham pha bo suu tap": "Khám phá bộ sưu tập",
  "loc theo size, mau, loai va luu danh sach do muon thu":
    "Lọc theo size, màu, loại và lưu danh sách đồ muốn thử.",
};

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "boolean") return fallback;
  return value;
}

function normalizeLegacyVietnameseKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!…]+$/u, "");
}

function normalizeLegacyVietnameseText(value: string, locale: AppLocale): string {
  if (locale !== "vi") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const mapped = LEGACY_VI_TEXT_MAP[normalizeLegacyVietnameseKey(trimmed)];
  return mapped ?? value;
}

export function normalizeShowroomTemplateCode(value: string | null | undefined): string {
  if (!value) return SHOWROOM_DEFAULT_TEMPLATE_CODE;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return SHOWROOM_DEFAULT_TEMPLATE_CODE;

  if (
    normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM ||
    normalized.includes("CHARM") ||
    normalized.includes("CUTE")
  ) {
    return SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM;
  }

  if (
    normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D ||
    normalized.includes("3D") ||
    normalized.includes("SHOWCASE")
  ) {
    return SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D;
  }

  if (
    normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN ||
    normalized.includes("MODERN") ||
    normalized.includes("STUDIO")
  ) {
    return SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN;
  }

  return normalized;
}

export function buildShowroomPageViewConfig(options: {
  locale: AppLocale;
  config: PublicShowroomPageConfigDto | null;
}): ShowroomPageViewConfig {
  const defaults = DEFAULT_PAGE_COPY[options.locale];
  const heroConfig = parseObject(options.config?.heroConfigJson);
  const displayConfig = parseObject(options.config?.displayConfigJson);
  const filtersConfig = parseObject(options.config?.filtersConfigJson);
  const normalizedTemplateCode = normalizeShowroomTemplateCode(options.config?.templateCode);
  const themeCharmConfig = isProductLandingCharmTemplateCode(normalizedTemplateCode)
    ? migrateLegacyProductLandingCharmThemeConfig({
        locale: options.locale,
        title: options.config?.title ?? null,
        subtitle: options.config?.subtitle ?? null,
        heroConfigJson: options.config?.heroConfigJson,
        sectionsConfigJson: options.config?.sectionsConfigJson,
        displayConfigJson: options.config?.displayConfigJson,
        themeConfigJson: options.config?.themeConfigJson,
      })
    : null;
  const theme3dConfig =
    normalizedTemplateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D
      ? migrateLegacyProductLanding3DThemeConfig({
          locale: options.locale,
          title: options.config?.title ?? null,
          subtitle: options.config?.subtitle ?? null,
          heroConfigJson: options.config?.heroConfigJson,
          sectionsConfigJson: options.config?.sectionsConfigJson,
          seoConfigJson: options.config?.seoConfigJson,
          displayConfigJson: options.config?.displayConfigJson,
          themeConfigJson: options.config?.themeConfigJson,
        })
      : null;
  const charmTitle = themeCharmConfig
    ? resolveProductLandingCharmLocalizedText(themeCharmConfig.meta.pageName, options.locale)
    : null;
  const charmSubtitle = themeCharmConfig
    ? resolveProductLandingCharmLocalizedText(themeCharmConfig.hero.subtitle, options.locale)
    : null;
  const charmHeadingLine1 = themeCharmConfig
    ? resolveProductLandingCharmLocalizedText(themeCharmConfig.hero.line1, options.locale)
    : "";
  const charmHeadingLine2 = themeCharmConfig
    ? resolveProductLandingCharmLocalizedText(themeCharmConfig.hero.line2, options.locale)
    : "";
  const charmHeroHeading = [charmHeadingLine1, charmHeadingLine2].filter(Boolean).join(" ").trim();

  const title = normalizeLegacyVietnameseText(
    readString(charmTitle, readString(options.config?.title, defaults.title)),
    options.locale
  );
  const subtitle = normalizeLegacyVietnameseText(
    readString(charmSubtitle, readString(options.config?.subtitle, defaults.subtitle)),
    options.locale
  );
  const heroHeading = normalizeLegacyVietnameseText(
    readString(heroConfig.heading, charmHeroHeading || title),
    options.locale
  );
  const heroSubheading = normalizeLegacyVietnameseText(
    readString(heroConfig.subheading, charmSubtitle || subtitle),
    options.locale
  );
  const showShortlist =
    theme3dConfig?.display.showShortlist ??
    themeCharmConfig?.display.showShortlist ??
    readBoolean(displayConfig.showShortlist, true);

  return {
    branchId: options.config?.branchId ?? null,
    locale: options.locale,
    pageKey: "PRODUCT_HOME",
    templateCode: normalizedTemplateCode,
    templateVersion:
      typeof options.config?.templateVersion === "number" && Number.isFinite(options.config.templateVersion)
        ? Math.max(1, Math.round(options.config.templateVersion))
        : 1,
    title,
    subtitle,
    hero: {
      heading: heroHeading,
      subheading: heroSubheading,
      showSearchBox: readBoolean(heroConfig.showSearchBox, true),
      showShortlistCta: showShortlist,
    },
    display: {
      showPriceReference:
        theme3dConfig?.display.showPriceReference ??
        themeCharmConfig?.display.showPriceReference ??
        readBoolean(displayConfig.showPriceReference, true),
      showSalePriceReference:
        theme3dConfig?.display.showSalePriceReference ??
        themeCharmConfig?.display.showSalePriceReference ??
        readBoolean(displayConfig.showSalePriceReference, true),
      showDepositReference:
        theme3dConfig?.display.showDepositReference ??
        themeCharmConfig?.display.showDepositReference ??
        readBoolean(displayConfig.showDepositReference, true),
      showSuccessfulRentCount:
        theme3dConfig?.display.showSuccessfulRentCount ??
        themeCharmConfig?.display.showSuccessfulRentCount ??
        readBoolean(displayConfig.showSuccessfulRentCount, true),
      showShortlist: showShortlist,
    },
    filters: {
      category: readBoolean(filtersConfig.category, true),
      tag: readBoolean(filtersConfig.tag, true),
      gender: readBoolean(filtersConfig.gender, true),
      size: readBoolean(filtersConfig.size, true),
      color: readBoolean(filtersConfig.color, true),
      textSearch: readBoolean(filtersConfig.textSearch, true),
    },
    fallbackUsed: !options.config,
  };
}
