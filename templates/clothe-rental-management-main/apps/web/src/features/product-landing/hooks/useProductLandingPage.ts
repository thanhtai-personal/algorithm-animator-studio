"use client";

import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";
import {
  isProductLandingCharmTemplateCode,
  migrateLegacyProductLandingCharmThemeConfig,
  resolveProductLandingCharmLocalizedText,
  type ProductLandingCharmThemeConfig,
} from "@/features/product-landing/config/productLandingThemeCharm";
import {
  buildProductLandingModernTemplateCopy,
  isProductLandingModernTemplateCode,
  migrateLegacyProductLandingModernThemeConfig,
  resolveProductLandingModernLocalizedText,
  type ProductLandingModernThemeConfig,
} from "@/features/product-landing/config/productLandingThemeModern";
import {
  isProductLanding3DTemplateCode,
  migrateLegacyProductLanding3DThemeConfig,
  type ProductLanding3DThemeConfig,
} from "@/features/product-landing/config/productLandingTheme3D";
import {
  useProductLandingConfigQuery,
  useProductLandingFeaturedProductsQuery,
} from "@/features/product-landing/queries/useProductLandingQueries";
import { productLandingStore } from "@/features/product-landing/stores/productLandingStore";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { buildShowroomBasePath, normalizeShopDomain } from "@/features/showroom/utils/paths";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import { normalizeRenderableImageSrc } from "@/lib/imageSource";
import { parsePublicContactInfo } from "@/lib/publicContactInfo";
import { parsePublicSocialLinks } from "@/lib/publicSocialLinks";

interface LandingStatsItem {
  label: string;
  value: string;
}

interface LandingPerkItem {
  title: string;
  description: string;
}

interface LandingTestimonialItem {
  name: string;
  text: string;
}

interface ProductLandingCopy {
  heroBadge: string;
  heroHeading: string;
  heroSubheading: string;
  searchPlaceholder: string;
  featuredTitle: string;
  featuredShowMoreLabel: string;
  statsTitle: string;
  perksTitle: string;
  testimonialsTitle: string;
  fallbackNotice: string;
  loading: string;
  emptyFeatured: string;
  openShowroomAction: string;
}

const PRODUCT_LANDING_COPY: Record<AppLocale, ProductLandingCopy> = {
  vi: {
    heroBadge: "Bộ sưu tập mới",
    heroHeading: "Trang phục cao cấp cho mọi dịp đặc biệt",
    heroSubheading:
      "Áo dài, vest, đầm dạ hội, thuê dễ dàng với chất lượng như mới và đa dạng phong cách.",
    searchPlaceholder: "Tìm trang phục bạn muốn thử...",
    featuredTitle: "Sản phẩm nổi bật",
    featuredShowMoreLabel: "Xem thêm",
    statsTitle: "Những con số nổi bật",
    perksTitle: "Vì sao chọn chúng tôi",
    testimonialsTitle: "Khách hàng nói gì",
    fallbackNotice: "Đang dùng cấu hình mặc định vì chưa có bản publish.",
    loading: "Đang tải product landing...",
    emptyFeatured: "Chưa có sản phẩm nổi bật.",
    openShowroomAction: "Đến phòng trưng bày",
  },
  en: {
    heroBadge: "New collection",
    heroHeading: "Premium outfits for every special moment",
    heroSubheading:
      "Ao dai, suits, and evening dresses with flexible rental flow and premium quality.",
    searchPlaceholder: "Search outfits you want to try...",
    featuredTitle: "Featured products",
    featuredShowMoreLabel: "Show more",
    statsTitle: "Highlights",
    perksTitle: "Why choose us",
    testimonialsTitle: "What customers say",
    fallbackNotice: "Using fallback config because no published version was found.",
    loading: "Loading product landing...",
    emptyFeatured: "No featured products yet.",
    openShowroomAction: "Go to showroom",
  },
};

const DEFAULT_STATS: Record<AppLocale, LandingStatsItem[]> = {
  vi: [
    { label: "Bộ trang phục", value: "500+" },
    { label: "Khách hài lòng", value: "2,000+" },
    { label: "Đơn hoàn tất", value: "8,000+" },
    { label: "Năm kinh nghiệm", value: "5+" },
  ],
  en: [
    { label: "Outfit collections", value: "500+" },
    { label: "Happy customers", value: "2,000+" },
    { label: "Completed orders", value: "8,000+" },
    { label: "Years of experience", value: "5+" },
  ],
};

const DEFAULT_PERKS: Record<AppLocale, LandingPerkItem[]> = {
  vi: [
    { title: "Giao nhận linh hoạt", description: "Hỗ trợ giao và nhận theo lịch hẹn phù hợp." },
    { title: "Chất lượng kiểm duyệt", description: "Trang phục luôn được kiểm tra trước mỗi đơn thuê." },
    { title: "Tư vấn nhanh", description: "Đội ngũ hỗ trợ chọn mẫu theo sự kiện và phong cách." },
  ],
  en: [
    { title: "Flexible delivery", description: "Delivery and return options tailored to your schedule." },
    { title: "Quality control", description: "Every outfit is quality-checked before each rental." },
    { title: "Fast consultation", description: "Styling support based on event and preference." },
  ],
};

const DEFAULT_TESTIMONIALS: Record<AppLocale, LandingTestimonialItem[]> = {
  vi: [
    { name: "Mai N.", text: "Dịch vụ nhanh và trang phục rất đẹp." },
    { name: "Hùng T.", text: "Nhân viên tư vấn đúng nhu cầu, dễ chọn đồ." },
    { name: "Hương L.", text: "Đặt online nhanh, đến phòng trưng bày thử là có ngay." },
  ],
  en: [
    { name: "Mai N.", text: "Great service and beautiful outfits." },
    { name: "Hung T.", text: "Helpful consultation and easy selection flow." },
    { name: "Huong L.", text: "Fast online flow and smooth in-store fitting." },
  ],
};

const LEGACY_VI_TEXT_MAP: Record<string, string> = {
  "kham pha bo suu tap": "Khám phá bộ sưu tập",
  "bo suu tap moi": "Bộ sưu tập mới",
  "loc theo size, mau, loai va luu danh sach do muon thu":
    "Lọc theo size, màu, loại và lưu danh sách đồ muốn thử.",
  "tim trang phuc ban muon thu": "Tìm trang phục bạn muốn thử...",
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

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function normalizeLegacyVietnameseKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!…]+$/u, "");
}

function normalizeLegacyVietnameseText(value: string, locale: AppLocale): string {
  if (locale !== "vi") return value;
  const key = normalizeLegacyVietnameseKey(value);
  if (!key) return value;
  return LEGACY_VI_TEXT_MAP[key] ?? value;
}

function readLocalizedString(value: unknown, locale: AppLocale, fallback: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  const map = parseObject(value);
  const preferred = readString(map[locale], "");
  if (preferred) return preferred;

  const alternate = readString(map[locale === "vi" ? "en" : "vi"], "");
  if (alternate) return alternate;

  return fallback;
}

function readStats(value: unknown, fallback: LandingStatsItem[]): LandingStatsItem[] {
  if (!Array.isArray(value)) return fallback;
  const output: LandingStatsItem[] = [];
  for (const entry of value) {
    const row = parseObject(entry);
    const label = readString(row.label, "");
    const valueText = readString(row.value, "");
    if (!label || !valueText) continue;
    output.push({ label, value: valueText });
  }
  return output.length > 0 ? output : fallback;
}

function readPerks(value: unknown, fallback: LandingPerkItem[]): LandingPerkItem[] {
  if (!Array.isArray(value)) return fallback;
  const output: LandingPerkItem[] = [];
  for (const entry of value) {
    const row = parseObject(entry);
    const title = readString(row.title, "");
    const description = readString(row.description, "");
    if (!title || !description) continue;
    output.push({ title, description });
  }
  return output.length > 0 ? output : fallback;
}

function readTestimonials(
  value: unknown,
  fallback: LandingTestimonialItem[]
): LandingTestimonialItem[] {
  if (!Array.isArray(value)) return fallback;
  const output: LandingTestimonialItem[] = [];
  for (const entry of value) {
    const row = parseObject(entry);
    const name = readString(row.name, "");
    const text = readString(row.text, "");
    if (!name || !text) continue;
    output.push({ name, text });
  }
  return output.length > 0 ? output : fallback;
}

export function useProductLandingPage(
  locale: AppLocale,
  options?: { branchSlug?: string | null; shopDomain?: string | null; initialConfig?: PublicShowroomPageConfigDto | null }
) {
  const router = useRouter();
  const copy = PRODUCT_LANDING_COPY[locale];
  const requestedBranchSlug = options?.branchSlug ?? null;
  const requestedShopDomain = normalizeShopDomain(options?.shopDomain);

  const configQuery = useProductLandingConfigQuery({
    locale,
    branchSlug: requestedBranchSlug,
    shopDomain: requestedShopDomain,
    initialData: options?.initialConfig ?? undefined,
  });

  const config = configQuery.data ?? productLandingStore.config;
  const heroConfig = parseObject(config?.heroConfigJson);
  const sectionsConfig = parseObject(config?.sectionsConfigJson);
  const heroI18n = parseObject(heroConfig.i18n);
  const sectionI18n = parseObject(sectionsConfig.i18n);
  const displayConfig = parseObject(config?.displayConfigJson);
  const socialLinks = parsePublicSocialLinks(displayConfig);
  const contactInfo = parsePublicContactInfo(displayConfig);
  const normalizedTemplateCode = normalizeShowroomTemplateCode(config?.templateCode);
  const themeCharmConfig: ProductLandingCharmThemeConfig | null = isProductLandingCharmTemplateCode(
    normalizedTemplateCode
  )
    ? migrateLegacyProductLandingCharmThemeConfig({
        locale,
        title: config?.title ?? null,
        subtitle: config?.subtitle ?? null,
        heroConfigJson: config?.heroConfigJson,
        sectionsConfigJson: config?.sectionsConfigJson,
        displayConfigJson: config?.displayConfigJson,
        themeConfigJson: config?.themeConfigJson,
      })
    : null;
  const theme3dConfig: ProductLanding3DThemeConfig | null = isProductLanding3DTemplateCode(
    normalizedTemplateCode
  )
    ? migrateLegacyProductLanding3DThemeConfig({
        locale,
        title: config?.title ?? null,
        subtitle: config?.subtitle ?? null,
        heroConfigJson: config?.heroConfigJson,
        sectionsConfigJson: config?.sectionsConfigJson,
        seoConfigJson: config?.seoConfigJson,
        displayConfigJson: config?.displayConfigJson,
        themeConfigJson: config?.themeConfigJson,
      })
    : null;
  const themeModernConfig: ProductLandingModernThemeConfig | null = isProductLandingModernTemplateCode(
    normalizedTemplateCode
  )
    ? migrateLegacyProductLandingModernThemeConfig({
        locale,
        title: config?.title ?? null,
        subtitle: config?.subtitle ?? null,
        heroConfigJson: config?.heroConfigJson,
        sectionsConfigJson: config?.sectionsConfigJson,
        seoConfigJson: config?.seoConfigJson,
        displayConfigJson: config?.displayConfigJson,
        themeConfigJson: config?.themeConfigJson,
      })
    : null;
  const featuredProductIds =
    themeModernConfig?.featuredProductIds ??
    theme3dConfig?.featuredProductIds ??
    themeCharmConfig?.featuredProductIds ??
    readStringArray(displayConfig.featuredProductIds);

  const activeBranchSlug = config?.branchSlug ?? requestedBranchSlug ?? null;
  const activeShopDomain = config?.shopDomain ?? requestedShopDomain ?? null;
  const branchName = readString(config?.branchName, "");
  const showroomPath = buildShowroomBasePath(
    locale,
    config?.showroomSlug ?? null,
    activeBranchSlug,
    activeShopDomain
  );
  const featuredQuery = useProductLandingFeaturedProductsQuery({
    locale,
    showroomSlug: config?.showroomSlug ?? null,
    branchId: config?.branchId ?? null,
    branchSlug: activeBranchSlug,
    shopDomain: activeShopDomain,
    productIds: featuredProductIds,
    enabled: Boolean(configQuery.isSuccess || configQuery.isError),
  });
  const themeModernCopy = themeModernConfig
    ? buildProductLandingModernTemplateCopy({
        config: themeModernConfig,
        locale,
        featuredProducts: productLandingStore.featuredProducts,
      })
    : null;

  const stats = readStats(sectionsConfig.stats, DEFAULT_STATS[locale]);
  const perks = readPerks(
    parseObject(sectionI18n.perks)[locale],
    readPerks(sectionsConfig.perks, DEFAULT_PERKS[locale])
  );
  const testimonials = readTestimonials(
    parseObject(sectionI18n.testimonials)[locale],
    readTestimonials(sectionsConfig.testimonials, DEFAULT_TESTIMONIALS[locale])
  );

  const pageName = normalizeLegacyVietnameseText(
    themeCharmConfig
      ? resolveProductLandingCharmLocalizedText(themeCharmConfig.meta.pageName, locale)
      : themeModernConfig
        ? resolveProductLandingModernLocalizedText(themeModernConfig.meta.pageName, locale)
      : readLocalizedString(
          parseObject(heroI18n.pageName),
          locale,
          readString(heroConfig.pageName, readString(heroConfig.heading, copy.heroHeading))
        ),
    locale
  );
  const pageLogoUrl = normalizeRenderableImageSrc(
    themeCharmConfig?.meta.pageLogoUrl ??
      theme3dConfig?.meta.pageLogoUrl ??
      themeModernConfig?.meta.pageLogoUrl ??
      readString(heroConfig.pageLogoUrl, "")
  );
  const heroBadge = normalizeLegacyVietnameseText(
    themeModernConfig
      ? resolveProductLandingModernLocalizedText(themeModernConfig.hero.badge, locale)
      : readString(heroConfig.badge, copy.heroBadge),
    locale
  );
  const heroHeading = normalizeLegacyVietnameseText(
    themeModernCopy
      ? `${themeModernCopy.hero.line1} ${themeModernCopy.hero.line2}`.trim()
      : readString(heroConfig.heading, copy.heroHeading),
    locale
  );
  const heroSubheading = normalizeLegacyVietnameseText(
    themeModernConfig
      ? resolveProductLandingModernLocalizedText(themeModernConfig.hero.subtitle, locale)
      : readString(heroConfig.subheading, copy.heroSubheading),
    locale
  );
  const searchPlaceholder = normalizeLegacyVietnameseText(
    themeModernConfig
      ? resolveProductLandingModernLocalizedText(themeModernConfig.navigation.searchPlaceholder, locale)
      : readString(heroConfig.searchPlaceholder, copy.searchPlaceholder),
    locale
  );
  const featuredProducts = productLandingStore.featuredProducts.map((entry) => ({
    ...entry,
    coverImageUrl: showroomClientService.resolveCoverImageUrl(entry.coverImagePath),
  }));
  const isFeaturedLoading = featuredQuery.isLoading && featuredProducts.length === 0;

  return {
    copy,
    isLoading: configQuery.isLoading,
    isFeaturedLoading,
    isFallback: !config,
    templateCode: normalizedTemplateCode,
    templateVersion:
      typeof config?.templateVersion === "number" && Number.isFinite(config.templateVersion)
        ? Math.max(1, Math.round(config.templateVersion))
        : 1,
    pageName,
    pageLogoUrl,
    socialLinks,
    contactInfo,
    heroBadge,
    heroHeading,
    heroSubheading,
    searchPlaceholder,
    featuredTitle:
      themeModernConfig
        ? resolveProductLandingModernLocalizedText(themeModernConfig.products.title, locale)
        : readString(sectionsConfig.featuredTitle, copy.featuredTitle),
    featuredShowMoreLabel:
      themeModernConfig
        ? resolveProductLandingModernLocalizedText(
            themeModernConfig.products.showMoreActionLabel,
            locale
          )
        : readString(sectionsConfig.featuredShowMoreLabel, copy.featuredShowMoreLabel),
    featuredProducts,
    stats,
    perks,
    testimonials,
    branchName: branchName || null,
    branchSlug: activeBranchSlug,
    shopDomain: activeShopDomain,
    showroomSlug: config?.showroomSlug ?? null,
    showroomPath,
    themeCharmConfig,
    theme3dConfig,
    themeModernConfig,
    openShowroom: () => {
      router.push(showroomPath);
    },
  };
}
