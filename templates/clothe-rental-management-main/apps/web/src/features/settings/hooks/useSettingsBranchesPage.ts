"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateSettingsBranchMutation,
  useSettingsBranchesQuery,
  useUpdateSettingsBranchMutation,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";

interface SettingsBranchesCopy {
  title: string;
  subtitle: string;
  noPermission: string;
  managerScopeHint: string;
  createTitle: string;
  codeLabel: string;
  nameLabel: string;
  shopDomainLabel: string;
  shopDomainHint: string;
  addressLabel: string;
  phoneLabel: string;
  timezoneLabel: string;
  currencyLabel: string;
  createAction: string;
  listTitle: string;
  activeLabel: string;
  saveAction: string;
  retryAction: string;
  loading: string;
  loadError: string;
  successCreate: string;
  successUpdate: string;
  invalidShopDomain: string;
  reservedShopDomain: string;
  invalidPhone: string;
  unsupportedCurrency: string;
  currencyHint: string;
}

const BRANCHES_COPY: Record<AppLocale, SettingsBranchesCopy> = {
  vi: {
    title: "Branches",
    subtitle: "Quản lý chi nhánh và domain public theo từng branch.",
    noPermission: "Bạn không có quyền quản lý cài đặt chi nhánh.",
    managerScopeHint: "Manager chỉ được cập nhật domain public cho branch được phân quyền.",
    createTitle: "Tạo chi nhánh mới",
    codeLabel: "Mã chi nhánh",
    nameLabel: "Tên chi nhánh",
    shopDomainLabel: "Public domain",
    shopDomainHint: "Dùng cho route /{locale}/{domain}/...; không được trùng route hệ thống.",
    addressLabel: "Địa chỉ",
    phoneLabel: "Số điện thoại",
    timezoneLabel: "Timezone",
    currencyLabel: "Currency",
    createAction: "Tạo chi nhánh",
    listTitle: "Danh sách chi nhánh",
    activeLabel: "Hoạt động",
    saveAction: "Lưu",
    retryAction: "Thử lại",
    loading: "Đang tải chi nhánh...",
    loadError: "Tải chi nhánh thất bại.",
    successCreate: "Đã tạo chi nhánh.",
    successUpdate: "Đã cập nhật chi nhánh.",
    invalidShopDomain: "Public domain không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch ngang.",
    reservedShopDomain: "Public domain này trùng route hệ thống, vui lòng chọn tên khác.",
    invalidPhone: "Số điện thoại không đúng định dạng Việt Nam.",
    unsupportedCurrency: "Hiện hệ thống chỉ hỗ trợ VND cho chi nhánh.",
    currencyHint: "FX/tỷ giá cho chi nhánh quốc tế sẽ xử lý bằng task riêng; hiện chỉ lưu VND.",
  },
  en: {
    title: "Branches",
    subtitle: "Manage branches and branch-level public domains.",
    noPermission: "You do not have permission to manage branch settings.",
    managerScopeHint: "Managers can only update the public domain for accessible branches.",
    createTitle: "Create branch",
    codeLabel: "Branch code",
    nameLabel: "Branch name",
    shopDomainLabel: "Public domain",
    shopDomainHint: "Used for /{locale}/{domain}/... routes and must not collide with system routes.",
    addressLabel: "Address",
    phoneLabel: "Phone",
    timezoneLabel: "Timezone",
    currencyLabel: "Currency",
    createAction: "Create branch",
    listTitle: "Branches",
    activeLabel: "Active",
    saveAction: "Save",
    retryAction: "Retry",
    loading: "Loading branches...",
    loadError: "Failed to load branches.",
    successCreate: "Branch created.",
    successUpdate: "Branch updated.",
    invalidShopDomain: "Public domain is invalid. Use lowercase letters, numbers, and hyphens only.",
    reservedShopDomain: "This public domain collides with a system route. Choose another name.",
    invalidPhone: "Phone number must be a valid Vietnamese phone number.",
    unsupportedCurrency: "Only VND is currently supported for branches.",
    currencyHint: "FX/rates for international branches will be handled by a separate task; only VND is saved now.",
  },
};

const RESERVED_PUBLIC_BRANCH_ROUTE_SEGMENTS = new Set([
  "admin",
  "api",
  "auth",
  "b",
  "booking",
  "calendar",
  "categories",
  "customers",
  "dashboard",
  "inventory",
  "makeup",
  "media",
  "orders",
  "payments",
  "procurement",
  "product",
  "products",
  "reports",
  "sales",
  "search",
  "settings",
  "shifts",
  "showroom",
  "users",
  "offline",
  "pos",
]);

function normalizeBranchPublicDomain(value: string): string | null {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) return null;
  return normalized;
}

function normalizeVietnamesePhoneNumber(value: string): string | null {
  const text = value.trim();
  if (!text) return "";
  if (!/^[+\d\s.-]+$/.test(text)) return null;

  const compact = text.replace(/[\s.-]/g, "");
  if (/^0[35789]\d{8}$/.test(compact)) {
    return `+84${compact.slice(1)}`;
  }
  if (/^\+84[35789]\d{8}$/.test(compact)) {
    return compact;
  }
  if (/^84[35789]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }
  return null;
}

function normalizeSupportedCurrencyCode(value: string): string | null {
  return value.trim().toUpperCase() === "VND" ? "VND" : null;
}

interface BranchRowDraft {
  name: string;
  shopDomain: string;
  address: string;
  phone: string;
  timezone: string;
  currencyCode: string;
  isActive: boolean;
}

export function useSettingsBranchesPage(locale: AppLocale) {
  const copy = BRANCHES_COPY[locale];
  const { can, role } = useAuthAccess();
  const normalizedRole = role?.trim().toLowerCase() ?? "";
  const isGlobalSettingsAdmin =
    normalizedRole === "owner_admin" || normalizedRole === "admin";
  const isManager = normalizedRole === "manager";
  const canManageSettings =
    can("settings.manage") && (isGlobalSettingsAdmin || isManager);

  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createShopDomain, setCreateShopDomain] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createTimezone, setCreateTimezone] = useState("Asia/Ho_Chi_Minh");
  const [createCurrencyCode, setCreateCurrencyCode] = useState("VND");

  const [rowDraftById, setRowDraftById] = useState<Record<string, BranchRowDraft>>({});

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const query = useSettingsBranchesQuery(canManageSettings);
  const createMutation = useCreateSettingsBranchMutation();
  const updateMutation = useUpdateSettingsBranchMutation();

  const branchesPayload = settingsStore.branches;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!branchesPayload) return;

    const nextDraftById: Record<string, BranchRowDraft> = {};

    for (const branch of branchesPayload.items) {
      nextDraftById[branch.id] = {
        name: branch.name,
        shopDomain: branch.shopDomain ?? "",
        address: branch.address ?? "",
        phone: branch.phone ?? "",
        timezone: branch.timezone,
        currencyCode: branch.currencyCode,
        isActive: branch.isActive,
      };
    }

    setRowDraftById(nextDraftById);
  }, [query.data, branchesPayload]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setRowDraft = (branchId: string, patch: Partial<BranchRowDraft>) => {
    setRowDraftById((previous) => ({
      ...previous,
      [branchId]: {
        ...previous[branchId],
        ...patch,
      },
    }));
  };

  const onCreateBranch = async () => {
    if (!isGlobalSettingsAdmin) return;

    setActionError(null);
    setActionSuccess(null);
    const normalizedShopDomain = createShopDomain.trim()
      ? normalizeBranchPublicDomain(createShopDomain)
      : "";
    if (createShopDomain.trim() && !normalizedShopDomain) {
      setActionError(copy.invalidShopDomain);
      toast.error(copy.invalidShopDomain);
      return;
    }
    if (normalizedShopDomain && RESERVED_PUBLIC_BRANCH_ROUTE_SEGMENTS.has(normalizedShopDomain)) {
      setActionError(copy.reservedShopDomain);
      toast.error(copy.reservedShopDomain);
      return;
    }
    const normalizedPhone = normalizeVietnamesePhoneNumber(createPhone);
    if (normalizedPhone === null) {
      setActionError(copy.invalidPhone);
      toast.error(copy.invalidPhone);
      return;
    }
    const normalizedCurrencyCode = normalizeSupportedCurrencyCode(createCurrencyCode);
    if (!normalizedCurrencyCode) {
      setActionError(copy.unsupportedCurrency);
      toast.error(copy.unsupportedCurrency);
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: createCode,
        name: createName,
        shopDomain: normalizedShopDomain,
        address: createAddress,
        phone: normalizedPhone || null,
        timezone: createTimezone,
        currencyCode: normalizedCurrencyCode,
      });

      setCreateCode("");
      setCreateName("");
      setCreateShopDomain("");
      setCreateAddress("");
      setCreatePhone("");
      setActionSuccess(copy.successCreate);
      toast.success(copy.successCreate);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  const onUpdateBranch = async (branchId: string) => {
    const draft = rowDraftById[branchId];
    if (!draft) return;

    setActionError(null);
    setActionSuccess(null);
    const normalizedShopDomain = draft.shopDomain.trim()
      ? normalizeBranchPublicDomain(draft.shopDomain)
      : "";
    if (draft.shopDomain.trim() && !normalizedShopDomain) {
      setActionError(copy.invalidShopDomain);
      toast.error(copy.invalidShopDomain);
      return;
    }
    if (normalizedShopDomain && RESERVED_PUBLIC_BRANCH_ROUTE_SEGMENTS.has(normalizedShopDomain)) {
      setActionError(copy.reservedShopDomain);
      toast.error(copy.reservedShopDomain);
      return;
    }
    const normalizedPhone = normalizeVietnamesePhoneNumber(draft.phone);
    if (isGlobalSettingsAdmin && normalizedPhone === null) {
      setActionError(copy.invalidPhone);
      toast.error(copy.invalidPhone);
      return;
    }
    const normalizedCurrencyCode = normalizeSupportedCurrencyCode(draft.currencyCode);
    if (isGlobalSettingsAdmin && !normalizedCurrencyCode) {
      setActionError(copy.unsupportedCurrency);
      toast.error(copy.unsupportedCurrency);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        branchId,
        payload: isGlobalSettingsAdmin
          ? {
              name: draft.name,
              shopDomain: normalizedShopDomain,
              address: draft.address,
              phone: normalizedPhone || null,
              timezone: draft.timezone,
              currencyCode: normalizedCurrencyCode,
              isActive: draft.isActive,
            }
          : {
              shopDomain: normalizedShopDomain,
            },
      });

      setActionSuccess(copy.successUpdate);
      toast.success(copy.successUpdate);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadError;
      setActionError(message);
      toast.error(message);
    }
  };

  return {
    copy,
    canManageSettings,
    isGlobalSettingsAdmin,
    isManager,
    query,
    createMutation,
    updateMutation,
    branchesPayload,
    createCode,
    setCreateCode,
    createName,
    setCreateName,
    createShopDomain,
    setCreateShopDomain,
    createAddress,
    setCreateAddress,
    createPhone,
    setCreatePhone,
    createTimezone,
    setCreateTimezone,
    createCurrencyCode,
    setCreateCurrencyCode,
    rowDraftById,
    setRowDraft,
    onCreateBranch,
    onUpdateBranch,
    actionError,
    actionSuccess,
  };
}
