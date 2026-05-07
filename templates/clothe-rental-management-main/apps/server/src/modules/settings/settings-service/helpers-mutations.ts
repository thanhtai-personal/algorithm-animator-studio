import type { Request } from 'express';
import type {
  SettingLocale,
  SettingsCreateProductCategoryPayload,
  SettingsCreateShowroomPayload,
  SettingsCreateUserPayload,
  SettingsResetUserPasswordPayload,
  SettingsShowroomPagesUpdatePayload,
  SettingsUpdateBranchPayload,
  SettingsUpdateProductCategoryPayload,
  SettingsUpdateShowroomPayload,
  SettingsUpdateUserPayload,
} from '../types/settings-module.type';
import {
  parseBoolean,
  parseNumber,
  parseSettingLocale,
  parseShowroomPageScope,
  parseShowroomRole,
  parseString,
  parseStringArray,
} from './helpers';
export function parseShowroomPagesUpdatePayload(
  body: Record<string, unknown>,
): SettingsShowroomPagesUpdatePayload | null {
  const branchId = parseString(body.branchId);
  const scope = parseShowroomPageScope(body.scope);
  if (Object.prototype.hasOwnProperty.call(body, 'scope') && !scope) {
    return null;
  }
  const locale = parseSettingLocale(body.locale);
  const templateId = parseString(body.templateId);
  const resolvedScope = scope ?? 'branch';

  if ((resolvedScope === 'branch' && !branchId) || !locale || !templateId) {
    return null;
  }

  const payload: SettingsShowroomPagesUpdatePayload = {
    branchId: resolvedScope === 'branch' ? branchId : null,
    scope: resolvedScope,
    locale,
    templateId,
  };

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    payload.title = body.title === null ? null : parseString(body.title);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'subtitle')) {
    payload.subtitle =
      body.subtitle === null ? null : parseString(body.subtitle);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'heroImagePath')) {
    payload.heroImagePath =
      body.heroImagePath === null ? null : parseString(body.heroImagePath);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'heroConfigJson')) {
    payload.heroConfigJson = body.heroConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sectionsConfigJson')) {
    payload.sectionsConfigJson = body.sectionsConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'filtersConfigJson')) {
    payload.filtersConfigJson = body.filtersConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'seoConfigJson')) {
    payload.seoConfigJson = body.seoConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'displayConfigJson')) {
    payload.displayConfigJson = body.displayConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'themeConfigJson')) {
    payload.themeConfigJson = body.themeConfigJson;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isPublished')) {
    const isPublished = parseBoolean(body.isPublished);
    if (isPublished === undefined) return null;
    payload.isPublished = isPublished;
  }

  return payload;
}

export function parseCreateUserPayload(
  body: Record<string, unknown>,
): SettingsCreateUserPayload | null {
  const email = parseString(body.email)?.toLowerCase() ?? null;
  const role = parseShowroomRole(body.role);
  const branchIds = parseStringArray(body.branchIds);

  if (!email || !role || !branchIds) return null;

  let locale: SettingLocale | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'locale')) {
    const parsedLocale = parseSettingLocale(body.locale);
    if (!parsedLocale) return null;
    locale = parsedLocale;
  }

  return {
    email,
    password:
      body.password === undefined ? undefined : parseString(body.password),
    fullName:
      body.fullName === undefined ? undefined : parseString(body.fullName),
    phone: body.phone === undefined ? undefined : parseString(body.phone),
    role,
    defaultBranchId:
      body.defaultBranchId === undefined
        ? undefined
        : parseString(body.defaultBranchId),
    branchIds,
    locale,
    redirectTo:
      body.redirectTo === undefined ? undefined : parseString(body.redirectTo),
  };
}

export function parseUpdateUserPayload(
  body: Record<string, unknown>,
): SettingsUpdateUserPayload | null {
  const payload: SettingsUpdateUserPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
    payload.fullName =
      body.fullName === null ? null : parseString(body.fullName);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    payload.phone = body.phone === null ? null : parseString(body.phone);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'role')) {
    const role = parseShowroomRole(body.role);
    if (!role) return null;
    payload.role = role;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'defaultBranchId')) {
    payload.defaultBranchId =
      body.defaultBranchId === null ? null : parseString(body.defaultBranchId);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'branchIds')) {
    const branchIds = parseStringArray(body.branchIds);
    if (!branchIds) return null;
    payload.branchIds = branchIds;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'locale')) {
    const locale = parseSettingLocale(body.locale);
    if (!locale) return null;
    payload.locale = locale;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

export function parseResetUserPasswordPayload(
  body: Record<string, unknown>,
): SettingsResetUserPasswordPayload | null {
  const newPassword = parseString(body.newPassword);
  if (!newPassword) return null;

  return { newPassword };
}

export function parseCreateBranchPayload(body: Record<string, unknown>) {
  const code = parseString(body.code);
  const name = parseString(body.name);
  if (!code || !name) return null;

  return {
    code,
    name,
    shopDomain:
      body.shopDomain === undefined ? undefined : parseString(body.shopDomain),
    address: body.address === undefined ? undefined : parseString(body.address),
    phone: body.phone === undefined ? undefined : parseString(body.phone),
    timezone:
      body.timezone === undefined ? undefined : parseString(body.timezone),
    currencyCode:
      body.currencyCode === undefined
        ? undefined
        : parseString(body.currencyCode),
  };
}

export function parseUpdateBranchPayload(
  body: Record<string, unknown>,
): SettingsUpdateBranchPayload | null {
  const payload: SettingsUpdateBranchPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'shopDomain')) {
    payload.shopDomain =
      body.shopDomain === null ? null : parseString(body.shopDomain);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'address')) {
    payload.address = body.address === null ? null : parseString(body.address);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    payload.phone = body.phone === null ? null : parseString(body.phone);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'timezone')) {
    payload.timezone =
      body.timezone === null ? null : parseString(body.timezone);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'currencyCode')) {
    payload.currencyCode =
      body.currencyCode === null ? null : parseString(body.currencyCode);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

export function parseCreateShowroomPayload(
  body: Record<string, unknown>,
): SettingsCreateShowroomPayload | null {
  const name = parseString(body.name);
  const branchId = parseString(body.branchId);
  if (!name || !branchId) return null;

  const payload: SettingsCreateShowroomPayload = { name, branchId };
  if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
    payload.slug = body.slug === null ? null : parseString(body.slug);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

export function parseUpdateShowroomPayload(
  body: Record<string, unknown>,
): SettingsUpdateShowroomPayload | null {
  const payload: SettingsUpdateShowroomPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
    const slug = parseString(body.slug);
    if (!slug) return null;
    payload.slug = slug;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'branchId')) {
    const branchId = parseString(body.branchId);
    if (!branchId) return null;
    payload.branchId = branchId;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

export function parseCreateProductCategoryPayload(
  body: Record<string, unknown>,
): SettingsCreateProductCategoryPayload | null {
  const code = parseString(body.code);
  const name = parseString(body.name);
  if (!code || !name) return null;

  const payload: SettingsCreateProductCategoryPayload = { code, name };
  if (Object.prototype.hasOwnProperty.call(body, 'branchId')) {
    payload.branchId =
      body.branchId === null ? null : parseString(body.branchId);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
    const sortOrder = parseNumber(body.sortOrder);
    if (sortOrder === undefined) return null;
    payload.sortOrder = sortOrder;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return payload;
}

export function parseUpdateProductCategoryPayload(
  body: Record<string, unknown>,
): SettingsUpdateProductCategoryPayload | null {
  const payload: SettingsUpdateProductCategoryPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'code')) {
    const code = parseString(body.code);
    if (!code) return null;
    payload.code = code;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sortOrder')) {
    const sortOrder = parseNumber(body.sortOrder);
    if (sortOrder === undefined) return null;
    payload.sortOrder = sortOrder;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  if (Object.keys(payload).length === 0) return null;
  return payload;
}

export function searchParamsFromRequest(request: Request): URLSearchParams {
  const url = new URL(request.originalUrl ?? request.url, 'http://localhost');
  return url.searchParams;
}
