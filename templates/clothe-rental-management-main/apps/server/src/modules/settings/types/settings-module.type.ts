import type { ShowroomRole } from './showroom-auth.type';

export type SettingLocale = 'vi' | 'en';
export type LateFeeMode = 'fixed_per_day' | 'percent_per_day';
export type SettingsShowroomPageScope = 'branch' | 'global';

export interface SettingsBranchDto {
  id: string;
  code: string;
  name: string;
  shopDomain: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  currencyCode: string;
  isActive: boolean;
}

export interface SettingsSystemDefaultsDto {
  defaultLocale: SettingLocale;
  defaultCurrencyCode: string;
  lateFeeMode: LateFeeMode;
  lateFeeValue: number;
  laundryTrackingEnabled: boolean;
  isShippingModuleEnabled: boolean;
  isMakeupModuleEnabled: boolean;
  isZaloMiniAppEnabled: boolean;
  siteLogoUrl: string | null;
  siteLogoDarkUrl: string | null;
  updatedAt: string | null;
}

export interface SettingsBranchPolicyDto {
  branchId: string;
  locale: SettingLocale;
  currencyCode: string;
  lateFeeMode: LateFeeMode;
  lateFeeValue: number;
  laundryTrackingEnabled: boolean;
  isRentalModuleEnabled: boolean;
  isMakeupModuleEnabled: boolean;
  overdueReminderThresholdHours: number;
  laundryStuckThresholdDays: number;
  updatedAt: string | null;
}

export interface SettingsOpeningHourDto {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

export interface SettingsProductCategoryDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
}

export interface SettingsCustomerTagDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  color: string | null;
  isSystem: boolean;
  warnOnOrderCreate: boolean;
  blockOrderCreate: boolean;
  isActive: boolean;
}

export interface SettingsGeneralQuery {
  branchId?: string | null;
}

export interface SettingsGeneralResponse {
  branchId: string;
  branches: SettingsBranchDto[];
  systemDefaults: SettingsSystemDefaultsDto;
  branchPolicy: SettingsBranchPolicyDto;
  openingHours: SettingsOpeningHourDto[];
  productCategories: SettingsProductCategoryDto[];
  customerTags: SettingsCustomerTagDto[];
  selfServicePasswordPath: string;
  adminResetPasswordSupported: boolean;
}

export interface SettingsProductCategoryInput {
  id?: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface SettingsCustomerTagInput {
  id?: string;
  code: string;
  name: string;
  color?: string | null;
  warnOnOrderCreate?: boolean;
  blockOrderCreate?: boolean;
  isActive: boolean;
}

export interface SettingsGeneralUpdatePayload {
  branchId: string;
  systemDefaults?: Partial<
    Pick<
      SettingsSystemDefaultsDto,
      | 'defaultLocale'
      | 'defaultCurrencyCode'
      | 'lateFeeMode'
      | 'lateFeeValue'
      | 'laundryTrackingEnabled'
      | 'isShippingModuleEnabled'
      | 'isMakeupModuleEnabled'
      | 'isZaloMiniAppEnabled'
      | 'siteLogoUrl'
      | 'siteLogoDarkUrl'
    >
  >;
  branchPolicy?: Partial<
    Pick<
      SettingsBranchPolicyDto,
      | 'locale'
      | 'currencyCode'
      | 'lateFeeMode'
      | 'lateFeeValue'
      | 'laundryTrackingEnabled'
      | 'isRentalModuleEnabled'
      | 'isMakeupModuleEnabled'
      | 'overdueReminderThresholdHours'
      | 'laundryStuckThresholdDays'
    >
  >;
  openingHours?: SettingsOpeningHourDto[];
  productCategories?: SettingsProductCategoryInput[];
  customerTags?: SettingsCustomerTagInput[];
}

export interface PosPasskeyPolicyDto {
  enabled: boolean;
  configured: boolean;
  version: number;
  updatedAt: string | null;
}

export interface PosPasskeyVerifyPayload {
  passkey: string;
}

export interface PosPasskeyVerifyResponse {
  success: true;
  policy: PosPasskeyPolicyDto;
}

export interface PosPasskeyUpdatePayload {
  enabled?: boolean;
  newPasskey?: string;
}

export interface SettingsShowroomTemplateDto {
  id: string;
  code: string;
  pageKey: string;
  name: string;
  description: string | null;
  previewImagePath: string | null;
  configSchemaJson?: unknown;
  templateVersion: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface SettingsShowroomPageConfigDto {
  id: string;
  branchId: string;
  locale: SettingLocale;
  pageKey: 'PRODUCT_HOME' | 'GLOBAL_PRODUCT_HOME';
  scope?: SettingsShowroomPageScope;
  templateId: string;
  title: string | null;
  subtitle: string | null;
  heroImagePath: string | null;
  heroConfigJson: unknown;
  sectionsConfigJson: unknown;
  filtersConfigJson: unknown;
  seoConfigJson: unknown;
  displayConfigJson: unknown;
  themeConfigJson?: unknown;
  isActive: boolean;
  isPublished: boolean;
  updatedAt: string;
}

export interface SettingsShowroomPagesQuery {
  branchId?: string | null;
  locale?: SettingLocale | null;
  scope?: SettingsShowroomPageScope | null;
}

export interface SettingsShowroomPagesResponse {
  scope: SettingsShowroomPageScope;
  branchId: string;
  locale: SettingLocale;
  templates: SettingsShowroomTemplateDto[];
  featuredProductOptions: SettingsShowroomFeaturedProductOptionDto[];
  config: SettingsShowroomPageConfigDto | null;
}

export interface SettingsShowroomFeaturedProductOptionDto {
  id: string;
  productCode: string;
  name: string;
  coverImagePath: string | null;
  categoryName: string | null;
  rentPricePerDay: number | null;
}

export interface SettingsShowroomPagesUpdatePayload {
  branchId?: string | null;
  scope?: SettingsShowroomPageScope;
  locale: SettingLocale;
  templateId: string;
  title?: string | null;
  subtitle?: string | null;
  heroImagePath?: string | null;
  heroConfigJson?: unknown;
  sectionsConfigJson?: unknown;
  filtersConfigJson?: unknown;
  seoConfigJson?: unknown;
  displayConfigJson?: unknown;
  themeConfigJson?: unknown;
  isActive?: boolean;
  isPublished?: boolean;
}

export interface SettingsShowroomDto {
  id: string;
  name: string;
  slug: string;
  branchId: string;
  branchCode: string;
  branchName: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsShowroomsResponse {
  items: SettingsShowroomDto[];
  branches: SettingsBranchDto[];
}

export interface SettingsManagedProductCategoryDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  productCount: number;
}

export interface SettingsProductCategoriesQuery {
  branchId?: string | null;
}

export interface SettingsProductCategoriesResponse {
  branchId: string;
  branches: SettingsBranchDto[];
  items: SettingsManagedProductCategoryDto[];
}

export interface SettingsCreateProductCategoryPayload {
  branchId?: string | null;
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SettingsUpdateProductCategoryPayload {
  code?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SettingsCreateShowroomPayload {
  name: string;
  slug?: string | null;
  branchId: string;
  isActive?: boolean;
}

export interface SettingsUpdateShowroomPayload {
  name?: string;
  slug?: string;
  branchId?: string;
  isActive?: boolean;
}

export interface SettingsUsersQuery {
  branchId?: string | null;
}

export interface SettingsUserRowDto {
  profileId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: ShowroomRole;
  defaultBranchId: string | null;
  locale: SettingLocale;
  isActive: boolean;
  disabledAt: string | null;
  branchIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUsersResponse {
  items: SettingsUserRowDto[];
  branches: SettingsBranchDto[];
}

export interface SettingsCreateUserPayload {
  email: string;
  password?: string | null;
  fullName?: string | null;
  phone?: string | null;
  role: ShowroomRole;
  defaultBranchId?: string | null;
  branchIds: string[];
  locale?: SettingLocale;
  redirectTo?: string | null;
}

export interface SettingsUpdateUserPayload {
  fullName?: string | null;
  phone?: string | null;
  role?: ShowroomRole;
  defaultBranchId?: string | null;
  branchIds?: string[];
  locale?: SettingLocale;
  isActive?: boolean;
}

export interface SettingsResetUserPasswordPayload {
  newPassword: string;
}

export interface SettingsBranchesResponse {
  items: SettingsBranchDto[];
}

export type SettingsBranchShopDomainCheckReason =
  | 'available'
  | 'invalid'
  | 'reserved'
  | 'duplicate';

export interface SettingsBranchShopDomainCheckQuery {
  branchId: string;
  shopDomain: string;
}

export interface SettingsBranchShopDomainCheckResponse {
  branchId: string;
  requestedShopDomain: string;
  normalizedShopDomain: string | null;
  available: boolean;
  reason: SettingsBranchShopDomainCheckReason;
  conflictBranchId: string | null;
  conflictBranchCode: string | null;
  conflictBranchName: string | null;
}

export interface SettingsCreateBranchPayload {
  code: string;
  name: string;
  shopDomain?: string | null;
  address?: string | null;
  phone?: string | null;
  timezone?: string | null;
  currencyCode?: string | null;
}

export interface SettingsUpdateBranchPayload {
  name?: string;
  shopDomain?: string | null;
  address?: string | null;
  phone?: string | null;
  timezone?: string | null;
  currencyCode?: string | null;
  isActive?: boolean;
}

export interface PublicShowroomPageConfigDto {
  showroomId: string | null;
  showroomSlug: string | null;
  showroomName: string | null;
  isDefaultShowroom: boolean;
  branchId: string;
  branchSlug?: string | null;
  shopDomain?: string | null;
  branchName?: string | null;
  locale: SettingLocale;
  pageKey: 'PRODUCT_HOME' | 'GLOBAL_PRODUCT_HOME';
  scope?: SettingsShowroomPageScope;
  templateCode: string;
  templateVersion: number;
  title: string | null;
  subtitle: string | null;
  heroImagePath: string | null;
  heroConfigJson: unknown;
  sectionsConfigJson: unknown;
  filtersConfigJson: unknown;
  seoConfigJson: unknown;
  displayConfigJson: unknown;
  themeConfigJson?: unknown;
}

export interface PublicShowroomPageConfigQuery {
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  locale: SettingLocale;
  scope?: SettingsShowroomPageScope | null;
}

export interface PublicBranchContextQuery {
  showroomSlug?: string | null;
  branchId?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
}

export interface PublicBranchContextDto {
  branchId: string;
  branchCode: string;
  branchSlug: string;
  branchName: string;
  shopDomain: string | null;
  showroomId: string | null;
  showroomSlug: string | null;
  showroomName: string | null;
  isDefaultShowroom: boolean;
  resolvedBy:
    | 'showroomSlug'
    | 'branchId'
    | 'branchSlug'
    | 'shopDomain'
    | 'default';
}

export interface PublicBranchMapItemDto {
  branchId: string;
  branchName: string;
  branchDomain: string;
  isActive: boolean;
  mapLat: number | null;
  mapLng: number | null;
  mapLabel: string | null;
  displayOrder: number | null;
}

export interface PublicSiteBrandingDto {
  siteLogoUrl: string | null;
  siteLogoDarkUrl: string | null;
  isMakeupModuleEnabled: boolean;
}
