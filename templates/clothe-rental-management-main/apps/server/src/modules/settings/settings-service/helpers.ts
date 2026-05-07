import {
  SHOWROOM_ROLE_VALUES,
  type ShowroomRole,
} from '../types/showroom-auth.type';
import type {
  LateFeeMode,
  SettingLocale,
  SettingsCustomerTagInput,
  SettingsGeneralUpdatePayload,
  SettingsOpeningHourDto,
  SettingsProductCategoryInput,
  SettingsShowroomPageScope,
} from '../types/settings-module.type';
export const SETTING_LOCALE_SET = new Set<SettingLocale>(['vi', 'en']);
export const LATE_FEE_MODE_SET = new Set<LateFeeMode>([
  'fixed_per_day',
  'percent_per_day',
]);
export const SHOWROOM_ROLE_SET = new Set<ShowroomRole>(SHOWROOM_ROLE_VALUES);
export const SHOWROOM_PAGE_SCOPE_SET = new Set<SettingsShowroomPageScope>([
  'branch',
  'global',
]);

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseSettingLocale(value: unknown): SettingLocale | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !SETTING_LOCALE_SET.has(text as SettingLocale)) return null;
  return text as SettingLocale;
}

export function parseLateFeeMode(value: unknown): LateFeeMode | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !LATE_FEE_MODE_SET.has(text as LateFeeMode)) return null;
  return text as LateFeeMode;
}

export function parseShowroomRole(value: unknown): ShowroomRole | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !SHOWROOM_ROLE_SET.has(text as ShowroomRole)) return null;
  return text as ShowroomRole;
}

export function parseShowroomPageScope(
  value: unknown,
): SettingsShowroomPageScope | null {
  const text = parseString(value)?.toLowerCase() ?? null;
  if (!text || !SHOWROOM_PAGE_SCOPE_SET.has(text as SettingsShowroomPageScope))
    return null;
  return text as SettingsShowroomPageScope;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const output: string[] = [];
  const seen = new Set<string>();

  for (const entry of value) {
    const text = parseString(entry);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }

  return output;
}

export function parseOpeningHours(
  value: unknown,
): SettingsOpeningHourDto[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsOpeningHourDto[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const dayOfWeek = parseNumber(row.dayOfWeek);
    const isOpen = parseBoolean(row.isOpen);

    if (dayOfWeek === undefined || isOpen === undefined) {
      return null;
    }

    output.push({
      dayOfWeek,
      isOpen,
      openTime: row.openTime === null ? null : parseString(row.openTime),
      closeTime: row.closeTime === null ? null : parseString(row.closeTime),
      breakStartTime:
        row.breakStartTime === null ? null : parseString(row.breakStartTime),
      breakEndTime:
        row.breakEndTime === null ? null : parseString(row.breakEndTime),
    });
  }

  return output;
}

export function parseProductCategories(
  value: unknown,
): SettingsProductCategoryInput[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsProductCategoryInput[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const code = parseString(row.code);
    const name = parseString(row.name);
    const isActive = parseBoolean(row.isActive);

    if (!code || !name || isActive === undefined) {
      return null;
    }

    output.push({
      id: parseString(row.id) ?? undefined,
      code,
      name,
      isActive,
    });
  }

  return output;
}

export function parseCustomerTags(
  value: unknown,
): SettingsCustomerTagInput[] | null {
  if (!Array.isArray(value)) return null;

  const output: SettingsCustomerTagInput[] = [];

  for (const entry of value) {
    const row = parseRecord(entry);
    if (!row) return null;

    const code = parseString(row.code);
    const name = parseString(row.name);
    const isActive = parseBoolean(row.isActive);
    if (!code || !name || isActive === undefined) {
      return null;
    }

    output.push({
      id: parseString(row.id) ?? undefined,
      code,
      name,
      color: row.color === null ? null : parseString(row.color),
      warnOnOrderCreate: parseBoolean(row.warnOnOrderCreate),
      blockOrderCreate: parseBoolean(row.blockOrderCreate),
      isActive,
    });
  }

  return output;
}

export function parseSettingsGeneralUpdatePayload(
  body: Record<string, unknown>,
): SettingsGeneralUpdatePayload | null {
  const branchId = parseString(body.branchId);
  if (!branchId) return null;

  const payload: SettingsGeneralUpdatePayload = {
    branchId,
  };

  const systemDefaults = parseRecord(body.systemDefaults);
  if (systemDefaults) {
    const patch: SettingsGeneralUpdatePayload['systemDefaults'] = {};

    if (Object.prototype.hasOwnProperty.call(systemDefaults, 'defaultLocale')) {
      const defaultLocale = parseSettingLocale(systemDefaults.defaultLocale);
      if (!defaultLocale) return null;
      patch.defaultLocale = defaultLocale;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        systemDefaults,
        'defaultCurrencyCode',
      )
    ) {
      const defaultCurrencyCode = parseString(
        systemDefaults.defaultCurrencyCode,
      );
      if (!defaultCurrencyCode) return null;
      patch.defaultCurrencyCode = defaultCurrencyCode;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, 'lateFeeMode')) {
      const lateFeeMode = parseLateFeeMode(systemDefaults.lateFeeMode);
      if (!lateFeeMode) return null;
      patch.lateFeeMode = lateFeeMode;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, 'lateFeeValue')) {
      const lateFeeValue = parseNumber(systemDefaults.lateFeeValue);
      if (lateFeeValue === undefined) return null;
      patch.lateFeeValue = lateFeeValue;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        systemDefaults,
        'laundryTrackingEnabled',
      )
    ) {
      const laundryTrackingEnabled = parseBoolean(
        systemDefaults.laundryTrackingEnabled,
      );
      if (laundryTrackingEnabled === undefined) return null;
      patch.laundryTrackingEnabled = laundryTrackingEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        systemDefaults,
        'isShippingModuleEnabled',
      )
    ) {
      const isShippingModuleEnabled = parseBoolean(
        systemDefaults.isShippingModuleEnabled,
      );
      if (isShippingModuleEnabled === undefined) return null;
      patch.isShippingModuleEnabled = isShippingModuleEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        systemDefaults,
        'isMakeupModuleEnabled',
      )
    ) {
      const isMakeupModuleEnabled = parseBoolean(
        systemDefaults.isMakeupModuleEnabled,
      );
      if (isMakeupModuleEnabled === undefined) return null;
      patch.isMakeupModuleEnabled = isMakeupModuleEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        systemDefaults,
        'isZaloMiniAppEnabled',
      )
    ) {
      const isZaloMiniAppEnabled = parseBoolean(
        systemDefaults.isZaloMiniAppEnabled,
      );
      if (isZaloMiniAppEnabled === undefined) return null;
      patch.isZaloMiniAppEnabled = isZaloMiniAppEnabled;
    }

    if (Object.prototype.hasOwnProperty.call(systemDefaults, 'siteLogoUrl')) {
      patch.siteLogoUrl =
        systemDefaults.siteLogoUrl === null
          ? null
          : parseString(systemDefaults.siteLogoUrl);
    }

    if (
      Object.prototype.hasOwnProperty.call(systemDefaults, 'siteLogoDarkUrl')
    ) {
      patch.siteLogoDarkUrl =
        systemDefaults.siteLogoDarkUrl === null
          ? null
          : parseString(systemDefaults.siteLogoDarkUrl);
    }

    payload.systemDefaults = patch;
  }

  const branchPolicy = parseRecord(body.branchPolicy);
  if (branchPolicy) {
    const patch: SettingsGeneralUpdatePayload['branchPolicy'] = {};

    if (Object.prototype.hasOwnProperty.call(branchPolicy, 'locale')) {
      const locale = parseSettingLocale(branchPolicy.locale);
      if (!locale) return null;
      patch.locale = locale;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, 'currencyCode')) {
      const currencyCode = parseString(branchPolicy.currencyCode);
      if (!currencyCode) return null;
      patch.currencyCode = currencyCode;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, 'lateFeeMode')) {
      const lateFeeMode = parseLateFeeMode(branchPolicy.lateFeeMode);
      if (!lateFeeMode) return null;
      patch.lateFeeMode = lateFeeMode;
    }

    if (Object.prototype.hasOwnProperty.call(branchPolicy, 'lateFeeValue')) {
      const lateFeeValue = parseNumber(branchPolicy.lateFeeValue);
      if (lateFeeValue === undefined) return null;
      patch.lateFeeValue = lateFeeValue;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        branchPolicy,
        'laundryTrackingEnabled',
      )
    ) {
      const laundryTrackingEnabled = parseBoolean(
        branchPolicy.laundryTrackingEnabled,
      );
      if (laundryTrackingEnabled === undefined) return null;
      patch.laundryTrackingEnabled = laundryTrackingEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        branchPolicy,
        'isRentalModuleEnabled',
      )
    ) {
      const isRentalModuleEnabled = parseBoolean(
        branchPolicy.isRentalModuleEnabled,
      );
      if (isRentalModuleEnabled === undefined) return null;
      patch.isRentalModuleEnabled = isRentalModuleEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        branchPolicy,
        'isMakeupModuleEnabled',
      )
    ) {
      const isMakeupModuleEnabled = parseBoolean(
        branchPolicy.isMakeupModuleEnabled,
      );
      if (isMakeupModuleEnabled === undefined) return null;
      patch.isMakeupModuleEnabled = isMakeupModuleEnabled;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        branchPolicy,
        'overdueReminderThresholdHours',
      )
    ) {
      const overdueReminderThresholdHours = parseNumber(
        branchPolicy.overdueReminderThresholdHours,
      );
      if (overdueReminderThresholdHours === undefined) return null;
      patch.overdueReminderThresholdHours = overdueReminderThresholdHours;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        branchPolicy,
        'laundryStuckThresholdDays',
      )
    ) {
      const laundryStuckThresholdDays = parseNumber(
        branchPolicy.laundryStuckThresholdDays,
      );
      if (laundryStuckThresholdDays === undefined) return null;
      patch.laundryStuckThresholdDays = laundryStuckThresholdDays;
    }

    payload.branchPolicy = patch;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'openingHours')) {
    const openingHours = parseOpeningHours(body.openingHours);
    if (!openingHours) return null;
    payload.openingHours = openingHours;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'productCategories')) {
    const productCategories = parseProductCategories(body.productCategories);
    if (!productCategories) return null;
    payload.productCategories = productCategories;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'customerTags')) {
    const customerTags = parseCustomerTags(body.customerTags);
    if (!customerTags) return null;
    payload.customerTags = customerTags;
  }

  return payload;
}
