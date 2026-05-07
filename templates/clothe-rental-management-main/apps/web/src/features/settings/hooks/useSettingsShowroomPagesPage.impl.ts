"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  buildLegacyShowroomPageFieldsFromCharmThemeConfig,
  buildDefaultProductLandingCharmThemeConfig,
  buildProductLandingCharmThemeConfigSchema,
  isProductLandingCharmTemplateCode,
  migrateLegacyProductLandingCharmThemeConfig,
  normalizeProductLandingCharmThemeConfig,
  type ProductLandingCharmThemeConfig,
} from "@/features/product-landing/config/productLandingThemeCharm";
import {
  buildDefaultProductLandingModernThemeConfig,
  buildLegacyShowroomPageFieldsFromModernThemeConfig,
  buildProductLandingModernThemeConfigSchema,
  isProductLandingModernTemplateCode,
  migrateLegacyProductLandingModernThemeConfig,
  normalizeProductLandingModernThemeConfig,
  type ProductLandingModernThemeConfig,
} from "@/features/product-landing/config/productLandingThemeModern";
import {
  buildDefaultProductLanding3DThemeConfig,
  buildLegacyShowroomPageFieldsFrom3DThemeConfig,
  buildProductLanding3DThemeConfigSchema,
  isProductLanding3DTemplateCode,
  migrateLegacyProductLanding3DThemeConfig,
  normalizeProductLanding3DThemeConfig,
  type ProductLanding3DThemeConfig,
  type ProductLandingThemeConfigSchema,
} from "@/features/product-landing/config/productLandingTheme3D";
import {
  mergeGlobalHomepageMapMarkers,
  parseGlobalHomepageMapMarkers,
  type GlobalHomepageMapMarkerCollection,
  type GlobalHomepageMapMarkerPosition,
} from "@/features/product-landing/utils/globalHomepageMapConfig";
import {
  useSettingsBranchesQuery,
  useSettingsShowroomPagesQuery,
  useUpdateSettingsShowroomPagesMutation,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import {
  parsePublicSocialLinks,
  toPublicSocialLinksPayload,
  type PublicSocialLinks,
} from "@/lib/publicSocialLinks";
import {
  parsePublicContactInfo,
  toPublicContactInfoPayload,
  type PublicContactInfo as PublicContactInfoValue,
} from "@/lib/publicContactInfo";
import type {
  SettingLocale,
  SettingsBranchDto,
  SettingsShowroomPageScope,
  SettingsShowroomFeaturedProductOptionDto,
} from "@/types/settingsModule";

interface SettingsShowroomPagesCopy {
  title: string;
  subtitle: string;
  noPermission: string;
  scopeLabel: string;
  branchScopeOption: string;
  globalScopeOption: string;
  globalScopeHint: string;
  globalContextLabel: string;
  branchLabel: string;
  localeLabel: string;
  templateLabel: string;
  titleLabel: string;
  subtitleLabel: string;
  heroBadgeLabel: string;
  heroHeadingLabel: string;
  heroSubheadingLabel: string;
  heroSearchPlaceholderLabel: string;
  featuredTitleLabel: string;
  featuredShowMoreLabel: string;
  featuredProductsLabel: string;
  featuredProductsHint: string;
  featuredProductsSearchPlaceholder: string;
  noProductsLabel: string;
  bilingualRequiredHint: string;
  pageNameLabel: string;
  pageLogoLabel: string;
  socialLinksTitle: string;
  facebookLinkLabel: string;
  tiktokLinkLabel: string;
  zaloLinkLabel: string;
  telegramLinkLabel: string;
  contactInfoTitle: string;
  hotlineLabel: string;
  storeAddressLabel: string;
  emailLabel: string;
  infoPackagesTitle: string;
  testimonialsPackagesTitle: string;
  packageLabel: string;
  testimonialLabel: string;
  viLabel: string;
  enLabel: string;
  bilingualValidationError: string;
  seoDescriptionLabel: string;
  publishLabel: string;
  showPriceLabel: string;
  showSalePriceLabel: string;
  showDepositLabel: string;
  showSuccessfulRentCountLabel: string;
  showShortlistLabel: string;
  saveAction: string;
  saveDraftAction: string;
  retryAction: string;
  inactiveTemplateSuffix: string;
  missingContextError: string;
  loading: string;
  loadError: string;
  successSaved: string;
}

const SHOWROOM_PAGES_COPY: Record<AppLocale, SettingsShowroomPagesCopy> = {
  vi: {
    title: "Cấu hình trang phòng trưng bày",
    subtitle:
      "Chọn template và cấu hình nội dung hiển thị cho trang phòng trưng bày theo chi nhánh + locale.",
    noPermission: "Chỉ Owner/Admin/Manager được phép chỉnh cấu hình trang phòng trưng bày.",
    scopeLabel: "Phạm vi",
    branchScopeOption: "Homepage chi nhánh",
    globalScopeOption: "Homepage chung (/product)",
    globalScopeHint: "Chỉ super admin được chỉnh homepage chung.",
    globalContextLabel: "Homepage chung",
    branchLabel: "Chi nhánh",
    localeLabel: "Locale",
    templateLabel: "Template",
    titleLabel: "Title",
    subtitleLabel: "Subtitle",
    heroBadgeLabel: "Hero badge",
    heroHeadingLabel: "Hero heading",
    heroSubheadingLabel: "Hero subheading",
    heroSearchPlaceholderLabel: "Placeholder ô tìm kiếm landing",
    featuredTitleLabel: "Featured section title",
    featuredShowMoreLabel: "Featured show more label",
    featuredProductsLabel: "Featured products",
    featuredProductsHint: "Chọn các sản phẩm nổi bật để hiển thị ở landing /product.",
    featuredProductsSearchPlaceholder: "Tìm theo mã, tên sản phẩm hoặc danh mục...",
    noProductsLabel: "Không có sản phẩm phù hợp.",
    bilingualRequiredHint: "Các trường bên dưới bắt buộc nhập đủ cả tiếng Việt và tiếng Anh.",
    pageNameLabel: "Tên trang",
    pageLogoLabel: "Logo trang (URL)",
    socialLinksTitle: "Liên kết mạng xã hội",
    facebookLinkLabel: "Link Facebook",
    tiktokLinkLabel: "Link TikTok",
    zaloLinkLabel: "Link Zalo",
    telegramLinkLabel: "Link Telegram",
    contactInfoTitle: "Thông tin liên hệ công khai",
    hotlineLabel: "Số hotline",
    storeAddressLabel: "Địa chỉ cửa hàng",
    emailLabel: "Email liên hệ",
    infoPackagesTitle: "3 gói thông tin lợi ích",
    testimonialsPackagesTitle: "3 gói khách hàng nói gì",
    packageLabel: "Gói",
    testimonialLabel: "Nhận xét",
    viLabel: "Tiếng Việt",
    enLabel: "Tiếng Anh",
    bilingualValidationError: "Vui lòng điền đầy đủ thông tin tiếng Việt và tiếng Anh cho tên trang + 6 gói thông tin.",
    seoDescriptionLabel: "SEO description",
    publishLabel: "Publish ngay",
    showPriceLabel: "Hiện giá tham khảo",
    showSalePriceLabel: "Hiện giá bán",
    showDepositLabel: "Hiện tiền cọc tham khảo",
    showSuccessfulRentCountLabel: "Hiện số lượt thuê thành công",
    showShortlistLabel: "Hiện CTA shortlist",
    saveAction: "Lưu & Publish",
    saveDraftAction: "Lưu draft",
    retryAction: "Thử lại",
    inactiveTemplateSuffix: " (không hoạt động)",
    missingContextError: "Thiếu ngữ cảnh chi nhánh/template",
    loading: "Đang tải cấu hình trang phòng trưng bày...",
    loadError: "Tải cấu hình trang phòng trưng bày thất bại.",
    successSaved: "Đã lưu cấu hình trang phòng trưng bày.",
  },
  en: {
    title: "Showroom page config",
    subtitle:
      "Select template and configure customer showroom content per branch + locale.",
    noPermission: "Only Owner/Admin/Manager can manage showroom page config.",
    scopeLabel: "Scope",
    branchScopeOption: "Branch homepage",
    globalScopeOption: "Global homepage (/product)",
    globalScopeHint: "Only super admin can edit global homepage.",
    globalContextLabel: "Global homepage",
    branchLabel: "Branch",
    localeLabel: "Locale",
    templateLabel: "Template",
    titleLabel: "Title",
    subtitleLabel: "Subtitle",
    heroBadgeLabel: "Hero badge",
    heroHeadingLabel: "Hero heading",
    heroSubheadingLabel: "Hero subheading",
    heroSearchPlaceholderLabel: "Landing search placeholder",
    featuredTitleLabel: "Featured section title",
    featuredShowMoreLabel: "Featured show more label",
    featuredProductsLabel: "Featured products",
    featuredProductsHint: "Pick featured products to render on the /product landing page.",
    featuredProductsSearchPlaceholder: "Search by product code, name, or category...",
    noProductsLabel: "No matching products.",
    bilingualRequiredHint: "The fields below require both Vietnamese and English values.",
    pageNameLabel: "Page name",
    pageLogoLabel: "Page logo (URL)",
    socialLinksTitle: "Social links",
    facebookLinkLabel: "Facebook URL",
    tiktokLinkLabel: "TikTok URL",
    zaloLinkLabel: "Zalo URL",
    telegramLinkLabel: "Telegram URL",
    contactInfoTitle: "Public contact info",
    hotlineLabel: "Hotline",
    storeAddressLabel: "Store address",
    emailLabel: "Contact email",
    infoPackagesTitle: "3 perks packages",
    testimonialsPackagesTitle: "3 testimonial packages",
    packageLabel: "Package",
    testimonialLabel: "Testimonial",
    viLabel: "Vietnamese",
    enLabel: "English",
    bilingualValidationError:
      "Please fill both Vietnamese and English for page name and all 6 information packages.",
    seoDescriptionLabel: "SEO description",
    publishLabel: "Publish now",
    showPriceLabel: "Show price reference",
    showSalePriceLabel: "Show sale price",
    showDepositLabel: "Show deposit reference",
    showSuccessfulRentCountLabel: "Show successful rent count",
    showShortlistLabel: "Show shortlist CTA",
    saveAction: "Save & publish",
    saveDraftAction: "Save draft",
    retryAction: "Retry",
    inactiveTemplateSuffix: " (inactive)",
    missingContextError: "Missing branch/template context",
    loading: "Loading showroom page config...",
    loadError: "Failed to load showroom page config.",
    successSaved: "Showroom page config saved.",
  },
};

function parseObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "boolean") return fallback;
  return value;
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

function normalizeFeaturedProductIdsByOptions(
  rawIds: string[],
  options: SettingsShowroomFeaturedProductOptionDto[]
): string[] {
  if (!Array.isArray(rawIds) || rawIds.length === 0) return [];

  const idsByCode = new Map<string, string>();
  const availableIds = new Set<string>();
  for (const entry of options) {
    availableIds.add(entry.id);
    const normalizedCode = entry.productCode.trim().toLowerCase();
    if (!normalizedCode || idsByCode.has(normalizedCode)) continue;
    idsByCode.set(normalizedCode, entry.id);
  }

  const resolvedIdSet = new Set<string>();
  const unresolvedTokens: string[] = [];
  const seenUnresolved = new Set<string>();
  for (const token of rawIds) {
    const normalizedToken = token.trim();
    if (!normalizedToken) continue;

    const resolvedId = availableIds.has(normalizedToken)
      ? normalizedToken
      : idsByCode.get(normalizedToken.toLowerCase()) ?? normalizedToken;
    if (availableIds.has(resolvedId)) {
      resolvedIdSet.add(resolvedId);
      continue;
    }

    const unresolvedKey = resolvedId.toLowerCase();
    if (seenUnresolved.has(unresolvedKey)) continue;
    seenUnresolved.add(unresolvedKey);
    unresolvedTokens.push(resolvedId);
  }

  const orderedResolved = options
    .map((entry) => entry.id)
    .filter((id) => resolvedIdSet.has(id));

  return [...orderedResolved, ...unresolvedTokens];
}

function readThemeConfigSchema(
  value: unknown,
  templateCode: string | null | undefined
): ProductLandingThemeConfigSchema {
  const schema = parseObject(value);
  const fallback = isProductLanding3DTemplateCode(templateCode)
    ? buildProductLanding3DThemeConfigSchema()
    : isProductLandingCharmTemplateCode(templateCode)
      ? buildProductLandingCharmThemeConfigSchema()
      : isProductLandingModernTemplateCode(templateCode)
        ? buildProductLandingModernThemeConfigSchema()
      : {
          version: 1 as const,
          themeCode: normalizeShowroomTemplateCode(templateCode),
          editor: "legacy" as const,
          title: "Legacy Product Home Config",
          fieldGroups: [],
        };

  const fieldGroups = Array.isArray(schema.fieldGroups)
    ? schema.fieldGroups
        .map((entry) => parseObject(entry))
        .map((entry) => ({
          key: readString(entry.key, ""),
          title: readString(entry.title, ""),
        }))
        .filter((entry) => entry.key && entry.title)
    : fallback.fieldGroups;

  const editorCandidate = readString(schema.editor, fallback.editor);
  const parsedEditor =
    editorCandidate === "theme-3d"
      ? "theme-3d"
      : editorCandidate === "theme-charm"
        ? "theme-charm"
        : editorCandidate === "theme-modern"
          ? "theme-modern"
        : "legacy";
  const editor =
    fallback.editor !== "legacy" && parsedEditor !== fallback.editor
      ? fallback.editor
      : parsedEditor;

  return {
    version: 1,
    themeCode: readString(schema.themeCode, fallback.themeCode),
    editor,
    title: readString(schema.title, fallback.title),
    fieldGroups,
  };
}

interface LandingPerkDraft {
  title: string;
  description: string;
}

interface LandingTestimonialDraft {
  name: string;
  text: string;
}

interface BilingualPerkDraft {
  viTitle: string;
  viDescription: string;
  enTitle: string;
  enDescription: string;
}

interface BilingualTestimonialDraft {
  viName: string;
  viText: string;
  enName: string;
  enText: string;
}

interface SocialLinksDraft {
  facebook: string;
  tiktok: string;
  zalo: string;
  telegram: string;
}

interface ContactInfoDraft {
  hotline: string;
  storeAddress: string;
  email: string;
}

const PACKAGE_COUNT = 3;

const DEFAULT_PAGE_NAME: Record<SettingLocale, string> = {
  vi: "Trang phục cao cấp cho mọi dịp đặc biệt",
  en: "Premium outfits for every special moment",
};

const DEFAULT_PERKS: Record<SettingLocale, LandingPerkDraft[]> = {
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

const DEFAULT_TESTIMONIALS: Record<SettingLocale, LandingTestimonialDraft[]> = {
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

function readPerks(value: unknown, fallback: LandingPerkDraft[]): LandingPerkDraft[] {
  if (!Array.isArray(value)) return fallback;
  const output: LandingPerkDraft[] = [];

  for (const entry of value) {
    const row = parseObject(entry);
    const title = readString(row.title, "").trim();
    const description = readString(row.description, "").trim();
    if (!title || !description) continue;
    output.push({ title, description });
  }

  return output.length > 0 ? output : fallback;
}

function readTestimonials(
  value: unknown,
  fallback: LandingTestimonialDraft[]
): LandingTestimonialDraft[] {
  if (!Array.isArray(value)) return fallback;
  const output: LandingTestimonialDraft[] = [];

  for (const entry of value) {
    const row = parseObject(entry);
    const name = readString(row.name, "").trim();
    const text = readString(row.text, "").trim();
    if (!name || !text) continue;
    output.push({ name, text });
  }

  return output.length > 0 ? output : fallback;
}

function normalizePerks(value: LandingPerkDraft[], fallback: LandingPerkDraft[]): LandingPerkDraft[] {
  return Array.from({ length: PACKAGE_COUNT }, (_, index) => {
    const row = value[index] ?? fallback[index] ?? { title: "", description: "" };
    return {
      title: row.title,
      description: row.description,
    };
  });
}

function normalizeTestimonials(
  value: LandingTestimonialDraft[],
  fallback: LandingTestimonialDraft[]
): LandingTestimonialDraft[] {
  return Array.from({ length: PACKAGE_COUNT }, (_, index) => {
    const row = value[index] ?? fallback[index] ?? { name: "", text: "" };
    return {
      name: row.name,
      text: row.text,
    };
  });
}

function defaultPerkBundles(): BilingualPerkDraft[] {
  return Array.from({ length: PACKAGE_COUNT }, (_, index) => ({
    viTitle: DEFAULT_PERKS.vi[index]?.title ?? "",
    viDescription: DEFAULT_PERKS.vi[index]?.description ?? "",
    enTitle: DEFAULT_PERKS.en[index]?.title ?? "",
    enDescription: DEFAULT_PERKS.en[index]?.description ?? "",
  }));
}

function defaultTestimonialBundles(): BilingualTestimonialDraft[] {
  return Array.from({ length: PACKAGE_COUNT }, (_, index) => ({
    viName: DEFAULT_TESTIMONIALS.vi[index]?.name ?? "",
    viText: DEFAULT_TESTIMONIALS.vi[index]?.text ?? "",
    enName: DEFAULT_TESTIMONIALS.en[index]?.name ?? "",
    enText: DEFAULT_TESTIMONIALS.en[index]?.text ?? "",
  }));
}

function toSocialLinksDraft(value: PublicSocialLinks): SocialLinksDraft {
  return {
    facebook: value.facebook ?? "",
    tiktok: value.tiktok ?? "",
    zalo: value.zalo ?? "",
    telegram: value.telegram ?? "",
  };
}

function toContactInfoDraft(value: PublicContactInfoValue): ContactInfoDraft {
  return {
    hotline: value.hotline ?? "",
    storeAddress: value.storeAddress ?? "",
    email: value.email ?? "",
  };
}

function mergeDisplayConfigWithPublicInfo(
  displayConfig: unknown,
  socialLinksDraft: SocialLinksDraft,
  contactInfoDraft: ContactInfoDraft
): Record<string, unknown> {
  const merged = { ...parseObject(displayConfig) };
  const normalizedLinks = parsePublicSocialLinks(socialLinksDraft);
  const payload = toPublicSocialLinksPayload(normalizedLinks);
  const normalizedContactInfo = parsePublicContactInfo(contactInfoDraft);
  const contactPayload = toPublicContactInfoPayload(normalizedContactInfo);
  // Only overwrite existing fields when we have an explicit payload.
  // Avoid deleting currently persisted social/contact info when the
  // draft inputs are empty or invalid (prevents accidental erase).
  if (payload) {
    merged.socialLinks = payload;
  }

  if (contactPayload) {
    merged.contactInfo = contactPayload;
  }

  return merged;
}

function clampMapPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

function normalizeMapPosition(position: GlobalHomepageMapMarkerPosition): GlobalHomepageMapMarkerPosition {
  return {
    leftPct: Number(clampMapPct(position.leftPct).toFixed(2)),
    topPct: Number(clampMapPct(position.topPct).toFixed(2)),
  };
}

function buildDraftMarkerId(branchId: string): string {
  const normalizedBranchId = branchId.replace(/[^a-zA-Z0-9_-]+/g, "-") || "branch";
  return `marker-${normalizedBranchId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeMarkerDisplayOrder(
  markers: GlobalHomepageMapMarkerCollection
): GlobalHomepageMapMarkerCollection {
  return markers.map((entry, index) => ({
    ...entry,
    displayOrder: index + 1,
  }));
}

interface UseSettingsShowroomPagesPageOptions {
  initialBranchId?: string | null;
  lockBranchId?: boolean;
}

export function useSettingsShowroomPagesPage(
  locale: AppLocale,
  options?: UseSettingsShowroomPagesPageOptions
) {
  const copy = SHOWROOM_PAGES_COPY[locale];
  const { can, role } = useAuthAccess();
  const canManageSettings = can("settings.manage");
  const canManageGlobalScope = role === "owner_admin";
  const initialBranchId = options?.initialBranchId ?? null;
  const lockedBranchId = options?.lockBranchId ? initialBranchId : null;
  const scopeLockedToBranch = Boolean(lockedBranchId);

  const [branchId, setBranchId] = useState<string | null>(initialBranchId);
  const [scope, setScope] = useState<SettingsShowroomPageScope>(
    canManageGlobalScope && !scopeLockedToBranch ? "global" : "branch"
  );
  const [pageLocale, setPageLocale] = useState<SettingLocale>("vi");

  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [heroBadge, setHeroBadge] = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubheading, setHeroSubheading] = useState("");
  const [heroSearchPlaceholder, setHeroSearchPlaceholder] = useState("");
  const [featuredTitle, setFeaturedTitle] = useState("");
  const [featuredShowMoreLabel, setFeaturedShowMoreLabel] = useState("");
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([]);
  const [pageNameVi, setPageNameVi] = useState(DEFAULT_PAGE_NAME.vi);
  const [pageNameEn, setPageNameEn] = useState(DEFAULT_PAGE_NAME.en);
  const [pageLogoUrl, setPageLogoUrl] = useState("");
  const [socialLinksDraft, setSocialLinksDraft] = useState<SocialLinksDraft>({
    facebook: "",
    tiktok: "",
    zalo: "",
    telegram: "",
  });
  const [contactInfoDraft, setContactInfoDraft] = useState<ContactInfoDraft>({
    hotline: "",
    storeAddress: "",
    email: "",
  });
  const [themeCharmDraft, setThemeCharmDraft] = useState<ProductLandingCharmThemeConfig>(() =>
    buildDefaultProductLandingCharmThemeConfig()
  );
  const [theme3dDraft, setTheme3dDraft] = useState<ProductLanding3DThemeConfig>(() =>
    buildDefaultProductLanding3DThemeConfig()
  );
  const [themeModernDraft, setThemeModernDraft] = useState<ProductLandingModernThemeConfig>(() =>
    buildDefaultProductLandingModernThemeConfig()
  );
  const [perkBundles, setPerkBundles] = useState<BilingualPerkDraft[]>(defaultPerkBundles);
  const [testimonialBundles, setTestimonialBundles] =
    useState<BilingualTestimonialDraft[]>(defaultTestimonialBundles);
  const [seoDescription, setSeoDescription] = useState("");
  const [showPriceReference, setShowPriceReference] = useState(true);
  const [showSalePriceReference, setShowSalePriceReference] = useState(true);
  const [showDepositReference, setShowDepositReference] = useState(true);
  const [showSuccessfulRentCount, setShowSuccessfulRentCount] = useState(true);
  const [showShortlist, setShowShortlist] = useState(true);
  const [publishNow, setPublishNow] = useState(true);
  const [globalMapMarkers, setGlobalMapMarkers] = useState<GlobalHomepageMapMarkerCollection>([]);
  const [selectedMapMarkerId, setSelectedMapMarkerId] = useState<string | null>(null);
  const [draggingMapMarkerId, setDraggingMapMarkerId] = useState<string | null>(null);
  const [isMapMarkerPositionDirty, setIsMapMarkerPositionDirty] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const effectiveBranchIdForQuery = scope === "global" ? null : branchId;
  const query = useSettingsShowroomPagesQuery(effectiveBranchIdForQuery, pageLocale, scope);
  useSettingsBranchesQuery(canManageSettings);
  const updateMutation = useUpdateSettingsShowroomPagesMutation();

  const showroomPages = query.data ?? null;
  const featuredProductOptions = showroomPages?.featuredProductOptions ?? [];
  const selectedTemplate =
    showroomPages?.templates.find((entry) => entry.id === templateId) ??
    showroomPages?.templates.find((entry) => entry.isDefault) ??
    showroomPages?.templates[0] ??
    null;
  const selectedTemplateSchema = readThemeConfigSchema(
    selectedTemplate?.configSchemaJson,
    selectedTemplate?.code
  );
  const isThemeCharmSelected =
    selectedTemplateSchema.editor === "theme-charm" ||
    isProductLandingCharmTemplateCode(selectedTemplate?.code);
  const isTheme3DSelected =
    selectedTemplateSchema.editor === "theme-3d" ||
    isProductLanding3DTemplateCode(selectedTemplate?.code);
  const isThemeModernSelected =
    selectedTemplateSchema.editor === "theme-modern" ||
    isProductLandingModernTemplateCode(selectedTemplate?.code);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (lockedBranchId) {
      setBranchId(lockedBranchId);
      return;
    }

    if (initialBranchId) {
      setBranchId(initialBranchId);
    }
  }, [initialBranchId, lockedBranchId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (scopeLockedToBranch || !canManageGlobalScope) {
      if (scope !== "branch") {
        setScope("branch");
      }
    }
  }, [canManageGlobalScope, scope, scopeLockedToBranch]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!showroomPages) return;
    const configLocale = showroomPages.locale;
    const nextBranchId = lockedBranchId ?? showroomPages.branchId;
    if (
      scope !== "global" &&
      branchId !== nextBranchId &&
      (lockedBranchId || branchId === null)
    ) {
      setBranchId(nextBranchId);
    }

    const templateFallback =
      showroomPages.templates.find((entry) => entry.isDefault && entry.isActive)?.id ??
      showroomPages.templates.find((entry) => entry.isActive)?.id ??
      showroomPages.templates[0]?.id ??
      "";

    const config = showroomPages.config;
    const heroConfig = parseObject(config?.heroConfigJson);
    const sectionsConfig = parseObject(config?.sectionsConfigJson);
    const heroI18n = parseObject(heroConfig.i18n);
    const sectionI18n = parseObject(sectionsConfig.i18n);
    const pageNameI18n = parseObject(heroI18n.pageName);
    const perksI18n = parseObject(sectionI18n.perks);
    const testimonialsI18n = parseObject(sectionI18n.testimonials);
    const seoConfig = parseObject(config?.seoConfigJson);
    const displayConfig = parseObject(config?.displayConfigJson);
    const effectiveTemplateId = config?.templateId ?? templateFallback;
    const effectiveTemplate =
      showroomPages.templates.find((entry) => entry.id === effectiveTemplateId) ?? null;

    setTemplateId(effectiveTemplateId);
    setTitle(config?.title ?? "");
    setSubtitle(config?.subtitle ?? "");
    setHeroBadge(readString(heroConfig.badge));
    setHeroHeading(readString(heroConfig.heading));
    setHeroSubheading(readString(heroConfig.subheading));
    setHeroSearchPlaceholder(readString(heroConfig.searchPlaceholder));
    setFeaturedTitle(readString(sectionsConfig.featuredTitle));
    setFeaturedShowMoreLabel(readString(sectionsConfig.featuredShowMoreLabel));
    setFeaturedProductIds(readStringArray(displayConfig.featuredProductIds));
    setPageLogoUrl(readString(heroConfig.pageLogoUrl));
    setSocialLinksDraft(toSocialLinksDraft(parsePublicSocialLinks(displayConfig)));
    setContactInfoDraft(toContactInfoDraft(parsePublicContactInfo(displayConfig)));
    setSeoDescription(readString(seoConfig.description));

    const localizedPageNameFallback = readString(
      heroConfig.pageName,
      readString(heroConfig.heading, readString(config?.title, DEFAULT_PAGE_NAME[configLocale]))
    );
    const pageNameViFallback =
      configLocale === "vi" ? localizedPageNameFallback : DEFAULT_PAGE_NAME.vi;
    const pageNameEnFallback =
      configLocale === "en" ? localizedPageNameFallback : DEFAULT_PAGE_NAME.en;

    setPageNameVi(readString(pageNameI18n.vi, pageNameViFallback));
    setPageNameEn(readString(pageNameI18n.en, pageNameEnFallback));

    const localizedPerksFallback = readPerks(sectionsConfig.perks, DEFAULT_PERKS[configLocale]);
    const localizedTestimonialsFallback = readTestimonials(
      sectionsConfig.testimonials,
      DEFAULT_TESTIMONIALS[configLocale]
    );

    const perksVi = normalizePerks(
      readPerks(
        perksI18n.vi,
        configLocale === "vi" ? localizedPerksFallback : DEFAULT_PERKS.vi
      ),
      DEFAULT_PERKS.vi
    );
    const perksEn = normalizePerks(
      readPerks(
        perksI18n.en,
        configLocale === "en" ? localizedPerksFallback : DEFAULT_PERKS.en
      ),
      DEFAULT_PERKS.en
    );

    const testimonialsVi = normalizeTestimonials(
      readTestimonials(
        testimonialsI18n.vi,
        configLocale === "vi" ? localizedTestimonialsFallback : DEFAULT_TESTIMONIALS.vi
      ),
      DEFAULT_TESTIMONIALS.vi
    );
    const testimonialsEn = normalizeTestimonials(
      readTestimonials(
        testimonialsI18n.en,
        configLocale === "en" ? localizedTestimonialsFallback : DEFAULT_TESTIMONIALS.en
      ),
      DEFAULT_TESTIMONIALS.en
    );

    setPerkBundles(
      Array.from({ length: PACKAGE_COUNT }, (_, index) => ({
        viTitle: perksVi[index]?.title ?? "",
        viDescription: perksVi[index]?.description ?? "",
        enTitle: perksEn[index]?.title ?? "",
        enDescription: perksEn[index]?.description ?? "",
      }))
    );

    setTestimonialBundles(
      Array.from({ length: PACKAGE_COUNT }, (_, index) => ({
        viName: testimonialsVi[index]?.name ?? "",
        viText: testimonialsVi[index]?.text ?? "",
        enName: testimonialsEn[index]?.name ?? "",
        enText: testimonialsEn[index]?.text ?? "",
      }))
    );

    setShowPriceReference(readBoolean(displayConfig.showPriceReference, true));
    setShowSalePriceReference(readBoolean(displayConfig.showSalePriceReference, true));
    setShowDepositReference(readBoolean(displayConfig.showDepositReference, true));
    setShowSuccessfulRentCount(readBoolean(displayConfig.showSuccessfulRentCount, true));
    setShowShortlist(readBoolean(displayConfig.showShortlist, true));
    setPublishNow(config?.isPublished ?? true);
    const nextGlobalMapMarkers = parseGlobalHomepageMapMarkers(config?.themeConfigJson);
    setGlobalMapMarkers(nextGlobalMapMarkers);
    setIsMapMarkerPositionDirty(false);

    if (!selectedMapMarkerId || !nextGlobalMapMarkers.some((entry) => entry.markerId === selectedMapMarkerId)) {
      const firstConfiguredMarkerId = nextGlobalMapMarkers[0]?.markerId ?? null;
      setSelectedMapMarkerId(firstConfiguredMarkerId);
    }
    setDraggingMapMarkerId(null);

    if (isProductLandingCharmTemplateCode(effectiveTemplate?.code)) {
      setThemeCharmDraft(
        migrateLegacyProductLandingCharmThemeConfig({
          locale: configLocale,
          title: config?.title ?? null,
          subtitle: config?.subtitle ?? null,
          heroConfigJson: config?.heroConfigJson,
          sectionsConfigJson: config?.sectionsConfigJson,
          displayConfigJson: config?.displayConfigJson,
          themeConfigJson: config?.themeConfigJson,
        })
      );
    } else if (isProductLandingModernTemplateCode(effectiveTemplate?.code)) {
      setThemeModernDraft(
        migrateLegacyProductLandingModernThemeConfig({
          locale: configLocale,
          title: config?.title ?? null,
          subtitle: config?.subtitle ?? null,
          heroConfigJson: config?.heroConfigJson,
          sectionsConfigJson: config?.sectionsConfigJson,
          seoConfigJson: config?.seoConfigJson,
          displayConfigJson: config?.displayConfigJson,
          themeConfigJson: config?.themeConfigJson,
        })
      );
    } else if (isProductLanding3DTemplateCode(effectiveTemplate?.code)) {
      setTheme3dDraft(
        migrateLegacyProductLanding3DThemeConfig({
          locale: configLocale,
          title: config?.title ?? null,
          subtitle: config?.subtitle ?? null,
          heroConfigJson: config?.heroConfigJson,
          sectionsConfigJson: config?.sectionsConfigJson,
          seoConfigJson: config?.seoConfigJson,
          displayConfigJson: config?.displayConfigJson,
          themeConfigJson: config?.themeConfigJson,
        })
      );
    } else if (!config?.themeConfigJson) {
      setThemeCharmDraft(buildDefaultProductLandingCharmThemeConfig());
      setTheme3dDraft(buildDefaultProductLanding3DThemeConfig());
      setThemeModernDraft(buildDefaultProductLandingModernThemeConfig());
    }
  }, [branchId, lockedBranchId, pageLocale, scope, showroomPages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!showroomPages || !isTheme3DSelected) return;

    const config = showroomPages.config;
    setTheme3dDraft((previous) =>
      normalizeProductLanding3DThemeConfig(
        config?.themeConfigJson ??
          migrateLegacyProductLanding3DThemeConfig({
            locale: pageLocale,
            title: config?.title ?? null,
            subtitle: config?.subtitle ?? null,
            heroConfigJson: config?.heroConfigJson,
            sectionsConfigJson: config?.sectionsConfigJson,
            seoConfigJson: config?.seoConfigJson,
            displayConfigJson: config?.displayConfigJson,
          }),
        previous
      )
    );
  }, [isTheme3DSelected, pageLocale, showroomPages, templateId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!showroomPages || !isThemeCharmSelected) return;

    const config = showroomPages.config;
    setThemeCharmDraft((previous) =>
      normalizeProductLandingCharmThemeConfig(
        config?.themeConfigJson ??
          migrateLegacyProductLandingCharmThemeConfig({
            locale: pageLocale,
            title: config?.title ?? null,
            subtitle: config?.subtitle ?? null,
            heroConfigJson: config?.heroConfigJson,
            sectionsConfigJson: config?.sectionsConfigJson,
            displayConfigJson: config?.displayConfigJson,
          }),
        previous
      )
    );
  }, [isThemeCharmSelected, pageLocale, showroomPages, templateId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!showroomPages || !isThemeModernSelected) return;

    const config = showroomPages.config;
    setThemeModernDraft((previous) =>
      normalizeProductLandingModernThemeConfig(
        config?.themeConfigJson ??
          migrateLegacyProductLandingModernThemeConfig({
            locale: pageLocale,
            title: config?.title ?? null,
            subtitle: config?.subtitle ?? null,
            heroConfigJson: config?.heroConfigJson,
            sectionsConfigJson: config?.sectionsConfigJson,
            seoConfigJson: config?.seoConfigJson,
            displayConfigJson: config?.displayConfigJson,
          }),
        previous
      )
    );
  }, [isThemeModernSelected, pageLocale, showroomPages, templateId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const generalBranches = settingsStore.general?.branches ?? [];
  const managedBranches = settingsStore.branches?.items ?? [];
  const branchById = new Map<string, string>();

  for (const entry of generalBranches) {
    branchById.set(entry.id, entry.name?.trim() || entry.id);
  }

  for (const entry of managedBranches) {
    if (!branchById.has(entry.id)) {
      branchById.set(entry.id, entry.name?.trim() || entry.id);
    }
  }

  if (branchId && !branchById.has(branchId)) {
    branchById.set(branchId, branchId);
  }

  const allBranchOptions = Array.from(branchById.entries()).map(([value, label]) => ({
    value,
    label,
  }));

  const branchOptions = lockedBranchId
    ? allBranchOptions.filter((entry) => entry.value === lockedBranchId)
    : allBranchOptions;
  const branchesForGlobalMapEditor = useMemo(() => {
    const mergedBranchDirectory = new Map<string, SettingsBranchDto>();
    for (const entry of generalBranches) {
      mergedBranchDirectory.set(entry.id, entry);
    }
    for (const entry of managedBranches) {
      if (!mergedBranchDirectory.has(entry.id)) {
        mergedBranchDirectory.set(entry.id, entry);
      }
    }

    return Array.from(mergedBranchDirectory.values())
      .filter((entry) => entry.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [generalBranches, managedBranches]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedMapMarkerId) return;
    const firstMarkerId = globalMapMarkers[0]?.markerId ?? null;
    if (!firstMarkerId) return;
    setSelectedMapMarkerId(firstMarkerId);
  }, [globalMapMarkers, selectedMapMarkerId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const voiceLanguage = pageLocale === "vi" ? "vi-VN" : "en-US";

  const toggleFeaturedProductId = (productId: string) => {
    setFeaturedProductIds((previous) => {
      if (previous.includes(productId)) {
        return previous.filter((entry) => entry !== productId);
      }
      return [productId, ...previous.filter((entry) => entry !== productId)];
    });
  };

  const updatePerkBundle = (
    index: number,
    patch: Partial<BilingualPerkDraft>
  ) => {
    setPerkBundles((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              ...patch,
            }
          : entry
      )
    );
  };

  const updateTestimonialBundle = (
    index: number,
    patch: Partial<BilingualTestimonialDraft>
  ) => {
    setTestimonialBundles((previous) =>
      previous.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              ...patch,
            }
          : entry
      )
    );
  };

  const updateSocialLink = (key: keyof SocialLinksDraft, value: string) => {
    setSocialLinksDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const updateContactInfo = (key: keyof ContactInfoDraft, value: string) => {
    setContactInfoDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const selectMapMarker = (nextMarkerId: string) => {
    const normalizedMarkerId = nextMarkerId.trim();
    if (!normalizedMarkerId) return;
    setSelectedMapMarkerId(normalizedMarkerId);
  };

  const updateMapMarkerPosition = (
    markerId: string,
    position: GlobalHomepageMapMarkerPosition
  ) => {
    const normalizedMarkerId = markerId.trim();
    if (!normalizedMarkerId) return;
    const nextPosition = normalizeMapPosition(position);

    setGlobalMapMarkers((previous) =>
      previous.map((entry) =>
        entry.markerId === normalizedMarkerId
          ? {
              ...entry,
              ...nextPosition,
            }
          : entry
      )
    );
    setSelectedMapMarkerId(normalizedMarkerId);
    setIsMapMarkerPositionDirty(true);
  };

  const addMapMarker = (
    branchIdCandidate?: string,
    seedPosition?: GlobalHomepageMapMarkerPosition
  ) => {
    const normalizedBranchId = (branchIdCandidate ?? "").trim();
    const fallbackBranchId =
      globalMapMarkers.find((entry) => entry.markerId === selectedMapMarkerId)?.branchId ??
      branchesForGlobalMapEditor[0]?.id ??
      "";
    const branchIdForInsert = normalizedBranchId || fallbackBranchId;
    if (!branchIdForInsert) return;

    setGlobalMapMarkers((previous) => {
      const markerFromSameBranch = [...previous]
        .reverse()
        .find((entry) => entry.branchId === branchIdForInsert);
      const baseline = seedPosition
        ? normalizeMapPosition(seedPosition)
        : markerFromSameBranch
          ? normalizeMapPosition({
              leftPct: markerFromSameBranch.leftPct + 2,
              topPct: markerFromSameBranch.topPct + 2,
            })
          : { leftPct: 50, topPct: 50 };

      const markerId = buildDraftMarkerId(branchIdForInsert);
      const next = normalizeMarkerDisplayOrder([
        ...previous,
        {
          markerId,
          branchId: branchIdForInsert,
          label: null,
          isActive: true,
          displayOrder: previous.length + 1,
          leftPct: baseline.leftPct,
          topPct: baseline.topPct,
        },
      ]);
      setSelectedMapMarkerId(markerId);
      return next;
    });
    setIsMapMarkerPositionDirty(true);
  };

  const removeMapMarker = (markerId: string) => {
    const normalizedMarkerId = markerId.trim();
    if (!normalizedMarkerId) return;

    setGlobalMapMarkers((previous) => {
      const next = normalizeMarkerDisplayOrder(
        previous.filter((entry) => entry.markerId !== normalizedMarkerId)
      );
      if (selectedMapMarkerId === normalizedMarkerId) {
        setSelectedMapMarkerId(next[0]?.markerId ?? null);
      }
      return next;
    });
    setIsMapMarkerPositionDirty(true);
  };

  const moveMapMarker = (markerId: string, direction: "up" | "down") => {
    const normalizedMarkerId = markerId.trim();
    if (!normalizedMarkerId) return;

    setGlobalMapMarkers((previous) => {
      const sorted = [...previous].sort((a, b) => a.displayOrder - b.displayOrder);
      const currentIndex = sorted.findIndex((entry) => entry.markerId === normalizedMarkerId);
      if (currentIndex < 0) return previous;

      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return previous;

      const swapped = [...sorted];
      const current = swapped[currentIndex]!;
      swapped[currentIndex] = swapped[targetIndex]!;
      swapped[targetIndex] = current;
      return normalizeMarkerDisplayOrder(swapped);
    });
    setSelectedMapMarkerId(normalizedMarkerId);
    setIsMapMarkerPositionDirty(true);
  };

  const updateMapMarkerBranch = (markerId: string, nextBranchId: string) => {
    const normalizedMarkerId = markerId.trim();
    const normalizedBranchId = nextBranchId.trim();
    if (!normalizedMarkerId || !normalizedBranchId) return;

    setGlobalMapMarkers((previous) =>
      previous.map((entry) =>
        entry.markerId === normalizedMarkerId
          ? {
              ...entry,
              branchId: normalizedBranchId,
            }
          : entry
      )
    );
    setSelectedMapMarkerId(normalizedMarkerId);
    setIsMapMarkerPositionDirty(true);
  };

  const updateMapMarkerLabel = (markerId: string, label: string) => {
    const normalizedMarkerId = markerId.trim();
    if (!normalizedMarkerId) return;
    const normalizedLabel = label.length > 0 ? label : null;

    setGlobalMapMarkers((previous) =>
      previous.map((entry) =>
        entry.markerId === normalizedMarkerId
          ? {
              ...entry,
              label: normalizedLabel,
            }
          : entry
      )
    );
    setSelectedMapMarkerId(normalizedMarkerId);
    setIsMapMarkerPositionDirty(true);
  };

  const resolveThemeConfigWithGlobalMapMarkers = (baseThemeConfig: unknown) => {
    if (scope !== "global") return baseThemeConfig;
    return mergeGlobalHomepageMapMarkers({
      themeConfigJson: baseThemeConfig,
      markers: globalMapMarkers,
    });
  };

  const onSave = async (publish: boolean) => {
    const branchIdForSave = scope === "branch" ? branchId : null;
    if (!templateId || (scope === "branch" && !branchIdForSave)) {
      setActionError(copy.missingContextError);
      toast.error(copy.missingContextError);
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      if (scope === "global") {
        const normalizedPageNameVi = pageNameVi.trim();
        const normalizedPageNameEn = pageNameEn.trim();
        const localizedPageName =
          (pageLocale === "vi" ? normalizedPageNameVi : normalizedPageNameEn) ||
          heroHeading.trim() ||
          title.trim();
        const normalizedHeroHeading = heroHeading.trim() || title.trim() || localizedPageName;
        const normalizedHeroSubheading = heroSubheading.trim() || subtitle.trim();
        const normalizedHeroBadge = heroBadge.trim();
        const normalizedSeoDescription = seoDescription.trim();

        await updateMutation.mutateAsync({
          branchId: null,
          scope,
          locale: pageLocale,
          templateId,
          title: normalizedHeroHeading || localizedPageName || null,
          subtitle: normalizedHeroSubheading || null,
          heroConfigJson: {
            badge: normalizedHeroBadge || null,
            heading: normalizedHeroHeading || null,
            subheading: normalizedHeroSubheading || null,
            pageName: localizedPageName || null,
            pageLogoUrl: pageLogoUrl.trim() || null,
            i18n: {
              pageName: {
                vi: normalizedPageNameVi,
                en: normalizedPageNameEn,
              },
            },
          },
          seoConfigJson: {
            title: localizedPageName || normalizedHeroHeading || null,
            description: normalizedSeoDescription || null,
          },
          themeConfigJson: resolveThemeConfigWithGlobalMapMarkers(
            showroomPages?.config?.themeConfigJson
          ),
          isActive: true,
          isPublished: publish,
        });

        setTitle(normalizedHeroHeading);
        setSubtitle(normalizedHeroSubheading);
        setPublishNow(publish);
        setIsMapMarkerPositionDirty(false);
        setActionSuccess(copy.successSaved);
        toast.success(copy.successSaved);
        return;
      }

      if (isThemeCharmSelected) {
        const normalizedThemeCharmDraft = normalizeProductLandingCharmThemeConfig(themeCharmDraft);
        const normalizedThemeCharmForSave: ProductLandingCharmThemeConfig = {
          ...normalizedThemeCharmDraft,
          featuredProductIds: normalizeFeaturedProductIdsByOptions(
            normalizedThemeCharmDraft.featuredProductIds,
            featuredProductOptions
          ),
        };
        const legacyFields = buildLegacyShowroomPageFieldsFromCharmThemeConfig(
          normalizedThemeCharmForSave,
          pageLocale
        );

        await updateMutation.mutateAsync({
          branchId: branchIdForSave,
          scope,
          locale: pageLocale,
          templateId,
          title: legacyFields.title,
          subtitle: legacyFields.subtitle,
          heroConfigJson: legacyFields.heroConfigJson,
          sectionsConfigJson: legacyFields.sectionsConfigJson,
          seoConfigJson: legacyFields.seoConfigJson,
          displayConfigJson: mergeDisplayConfigWithPublicInfo(
            legacyFields.displayConfigJson,
            socialLinksDraft,
            contactInfoDraft
          ),
          themeConfigJson: resolveThemeConfigWithGlobalMapMarkers(normalizedThemeCharmForSave),
          isActive: true,
          isPublished: publish,
        });

        setThemeCharmDraft(normalizedThemeCharmForSave);
        setFeaturedProductIds(normalizedThemeCharmForSave.featuredProductIds);
        setShowPriceReference(normalizedThemeCharmForSave.display.showPriceReference);
        setShowSalePriceReference(normalizedThemeCharmForSave.display.showSalePriceReference);
        setShowDepositReference(normalizedThemeCharmForSave.display.showDepositReference);
        setShowSuccessfulRentCount(normalizedThemeCharmForSave.display.showSuccessfulRentCount);
        setShowShortlist(normalizedThemeCharmForSave.display.showShortlist);
        setPublishNow(publish);
        setIsMapMarkerPositionDirty(false);
        setActionSuccess(copy.successSaved);
        toast.success(copy.successSaved);
        return;
      }

      if (isTheme3DSelected) {
        const normalizedTheme3dDraft = normalizeProductLanding3DThemeConfig(theme3dDraft);
        const normalizedTheme3dForSave: ProductLanding3DThemeConfig = {
          ...normalizedTheme3dDraft,
          featuredProductIds: normalizeFeaturedProductIdsByOptions(
            normalizedTheme3dDraft.featuredProductIds,
            featuredProductOptions
          ),
        };
        const legacyFields = buildLegacyShowroomPageFieldsFrom3DThemeConfig(
          normalizedTheme3dForSave,
          pageLocale
        );

        await updateMutation.mutateAsync({
          branchId: branchIdForSave,
          scope,
          locale: pageLocale,
          templateId,
          title: legacyFields.title,
          subtitle: legacyFields.subtitle,
          heroConfigJson: legacyFields.heroConfigJson,
          sectionsConfigJson: legacyFields.sectionsConfigJson,
          seoConfigJson: legacyFields.seoConfigJson,
          displayConfigJson: mergeDisplayConfigWithPublicInfo(
            legacyFields.displayConfigJson,
            socialLinksDraft,
            contactInfoDraft
          ),
          themeConfigJson: resolveThemeConfigWithGlobalMapMarkers(normalizedTheme3dForSave),
          isActive: true,
          isPublished: publish,
        });

        setTheme3dDraft(normalizedTheme3dForSave);
        setFeaturedProductIds(normalizedTheme3dForSave.featuredProductIds);
        setShowPriceReference(normalizedTheme3dForSave.display.showPriceReference);
        setShowSalePriceReference(normalizedTheme3dForSave.display.showSalePriceReference);
        setShowDepositReference(normalizedTheme3dForSave.display.showDepositReference);
        setShowSuccessfulRentCount(normalizedTheme3dForSave.display.showSuccessfulRentCount);
        setShowShortlist(normalizedTheme3dForSave.display.showShortlist);
        setPublishNow(publish);
        setIsMapMarkerPositionDirty(false);
        setActionSuccess(copy.successSaved);
        toast.success(copy.successSaved);
        return;
      }

      if (isThemeModernSelected) {
        const normalizedThemeModernDraft = normalizeProductLandingModernThemeConfig(themeModernDraft);
        const normalizedThemeModernForSave: ProductLandingModernThemeConfig = {
          ...normalizedThemeModernDraft,
          featuredProductIds: normalizeFeaturedProductIdsByOptions(
            normalizedThemeModernDraft.featuredProductIds,
            featuredProductOptions
          ),
        };
        const legacyFields = buildLegacyShowroomPageFieldsFromModernThemeConfig(
          normalizedThemeModernForSave,
          pageLocale
        );

        await updateMutation.mutateAsync({
          branchId: branchIdForSave,
          scope,
          locale: pageLocale,
          templateId,
          title: legacyFields.title,
          subtitle: legacyFields.subtitle,
          heroConfigJson: legacyFields.heroConfigJson,
          sectionsConfigJson: legacyFields.sectionsConfigJson,
          seoConfigJson: legacyFields.seoConfigJson,
          displayConfigJson: mergeDisplayConfigWithPublicInfo(
            legacyFields.displayConfigJson,
            socialLinksDraft,
            contactInfoDraft
          ),
          themeConfigJson: resolveThemeConfigWithGlobalMapMarkers(normalizedThemeModernForSave),
          isActive: true,
          isPublished: publish,
        });

        setThemeModernDraft(normalizedThemeModernForSave);
        setFeaturedProductIds(normalizedThemeModernForSave.featuredProductIds);
        setShowPriceReference(normalizedThemeModernForSave.display.showPriceReference);
        setShowSalePriceReference(normalizedThemeModernForSave.display.showSalePriceReference);
        setShowDepositReference(normalizedThemeModernForSave.display.showDepositReference);
        setShowSuccessfulRentCount(normalizedThemeModernForSave.display.showSuccessfulRentCount);
        setShowShortlist(normalizedThemeModernForSave.display.showShortlist);
        setPublishNow(publish);
        setIsMapMarkerPositionDirty(false);
        setActionSuccess(copy.successSaved);
        toast.success(copy.successSaved);
        return;
      }

      const normalizedPageNameVi = pageNameVi.trim();
      const normalizedPageNameEn = pageNameEn.trim();

      const perksVi: LandingPerkDraft[] = perkBundles.map((entry) => ({
        title: entry.viTitle.trim(),
        description: entry.viDescription.trim(),
      }));
      const perksEn: LandingPerkDraft[] = perkBundles.map((entry) => ({
        title: entry.enTitle.trim(),
        description: entry.enDescription.trim(),
      }));

      const testimonialsVi: LandingTestimonialDraft[] = testimonialBundles.map((entry) => ({
        name: entry.viName.trim(),
        text: entry.viText.trim(),
      }));
      const testimonialsEn: LandingTestimonialDraft[] = testimonialBundles.map((entry) => ({
        name: entry.enName.trim(),
        text: entry.enText.trim(),
      }));

      const hasMissingBilingualField =
        !normalizedPageNameVi ||
        !normalizedPageNameEn ||
        perksVi.some((entry) => !entry.title || !entry.description) ||
        perksEn.some((entry) => !entry.title || !entry.description) ||
        testimonialsVi.some((entry) => !entry.name || !entry.text) ||
        testimonialsEn.some((entry) => !entry.name || !entry.text);

      if (hasMissingBilingualField) {
        setActionError(copy.bilingualValidationError);
        toast.error(copy.bilingualValidationError);
        return;
      }

      const localizedPageName = pageLocale === "vi" ? normalizedPageNameVi : normalizedPageNameEn;
      const localizedPerks = pageLocale === "vi" ? perksVi : perksEn;
      const localizedTestimonials = pageLocale === "vi" ? testimonialsVi : testimonialsEn;
      const normalizedLegacyFeaturedProductIds = normalizeFeaturedProductIdsByOptions(
        featuredProductIds,
        featuredProductOptions
      );

      await updateMutation.mutateAsync({
        branchId: branchIdForSave,
        scope,
        locale: pageLocale,
        templateId,
        title: localizedPageName,
        subtitle,
        heroConfigJson: {
          badge: heroBadge,
          heading: heroHeading,
          subheading: heroSubheading,
          pageName: localizedPageName,
          pageLogoUrl: pageLogoUrl.trim() || null,
          i18n: {
            pageName: {
              vi: normalizedPageNameVi,
              en: normalizedPageNameEn,
            },
          },
          searchPlaceholder: heroSearchPlaceholder,
          showSearchBox: true,
          showShortlistCta: showShortlist,
        },
        sectionsConfigJson: {
          featuredTitle,
          featuredShowMoreLabel,
          perks: localizedPerks,
          testimonials: localizedTestimonials,
          i18n: {
            perks: {
              vi: perksVi,
              en: perksEn,
            },
            testimonials: {
              vi: testimonialsVi,
              en: testimonialsEn,
            },
          },
        },
        seoConfigJson: {
          title: localizedPageName,
          description: seoDescription,
        },
        displayConfigJson: {
          showPriceReference,
          showSalePriceReference,
          showDepositReference,
          showSuccessfulRentCount,
          showShortlist,
          featuredProductIds: normalizedLegacyFeaturedProductIds,
          socialLinks:
            toPublicSocialLinksPayload(parsePublicSocialLinks(socialLinksDraft)) ?? undefined,
          contactInfo:
            toPublicContactInfoPayload(parsePublicContactInfo(contactInfoDraft)) ?? undefined,
          cardVariant: "classic_grid_v1",
        },
        themeConfigJson: resolveThemeConfigWithGlobalMapMarkers(showroomPages?.config?.themeConfigJson),
        isActive: true,
        isPublished: publish,
      });

      setPublishNow(publish);
      setFeaturedProductIds(normalizedLegacyFeaturedProductIds);
      setIsMapMarkerPositionDirty(false);
      setActionSuccess(copy.successSaved);
      toast.success(copy.successSaved);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  return {
    copy,
    canManageSettings,
    query,
    updateMutation,
    showroomPages,
    actionError,
    actionSuccess,
    scope,
    setScope,
    canManageGlobalScope,
    scopeLockedToBranch,
    branchId,
    setBranchId,
    branchOptions,
    branchesForGlobalMapEditor,
    pageLocale,
    setPageLocale,
    templateId,
    setTemplateId,
    selectedTemplate,
    selectedTemplateSchema,
    isThemeCharmSelected,
    isTheme3DSelected,
    isThemeModernSelected,
    title,
    setTitle,
    subtitle,
    setSubtitle,
    heroBadge,
    setHeroBadge,
    heroHeading,
    setHeroHeading,
    heroSubheading,
    setHeroSubheading,
    heroSearchPlaceholder,
    setHeroSearchPlaceholder,
    featuredTitle,
    setFeaturedTitle,
    featuredShowMoreLabel,
    setFeaturedShowMoreLabel,
    featuredProductIds,
    setFeaturedProductIds,
    toggleFeaturedProductId,
    pageNameVi,
    setPageNameVi,
    pageNameEn,
    setPageNameEn,
    pageLogoUrl,
    setPageLogoUrl,
    socialLinksDraft,
    updateSocialLink,
    contactInfoDraft,
    updateContactInfo,
    themeCharmDraft,
    setThemeCharmDraft,
    theme3dDraft,
    setTheme3dDraft,
    themeModernDraft,
    setThemeModernDraft,
    perkBundles,
    updatePerkBundle,
    testimonialBundles,
    updateTestimonialBundle,
    seoDescription,
    setSeoDescription,
    showPriceReference,
    setShowPriceReference,
    showSalePriceReference,
    setShowSalePriceReference,
    showDepositReference,
    setShowDepositReference,
    showSuccessfulRentCount,
    setShowSuccessfulRentCount,
    showShortlist,
    setShowShortlist,
    publishNow,
    setPublishNow,
    globalMapMarkers,
    selectedMapMarkerId,
    setSelectedMapMarkerId: selectMapMarker,
    draggingMapMarkerId,
    setDraggingMapMarkerId,
    updateMapMarkerPosition,
    addMapMarker,
    removeMapMarker,
    moveMapMarker,
    updateMapMarkerBranch,
    updateMapMarkerLabel,
    isMapMarkerPositionDirty,
    featuredProductOptions,
    voiceLanguage,
    onSave,
  };
}
