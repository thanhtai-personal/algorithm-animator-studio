"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCheckSettingsBranchShopDomainMutation,
  useSettingsGeneralQuery,
  useSettingsPosPasskeyPolicyQuery,
  useUpdateSettingsBranchMutation,
  useUpdateSettingsGeneralMutation,
  useUpdateSettingsPosPasskeyMutation,
} from "@/features/settings/queries/useSettingsQueries";
import type {
  LateFeeMode,
  SettingsCustomerTagInput,
  SettingsGeneralUpdatePayload,
} from "@/types/settingsModule";
import { GENERAL_COPY } from "./copy";
import { normalizeShopDomainDraft } from "./utils";

export function useSettingsGeneralPage(locale: AppLocale) {
  const copy = GENERAL_COPY[locale];
  const { can, role, currentBranchId, branchAccess } = useAuthAccess();
  const canManageSettings = can("settings.manage");
  const normalizedRole = role?.trim().toLowerCase() ?? "";
  const canManageGlobalSettings =
    normalizedRole === "owner_admin" || normalizedRole === "admin";
  const isManager = normalizedRole === "manager";
  const canManageBranchMakeupModule = canManageGlobalSettings || isManager;

  const [branchId, setBranchId] = useState<string | null>(null);
  const [systemLateFeeMode, setSystemLateFeeMode] = useState<LateFeeMode>("fixed_per_day");
  const [systemLateFeeValue, setSystemLateFeeValue] = useState("0");
  const [systemLaundryTrackingEnabled, setSystemLaundryTrackingEnabled] = useState(true);
  const [systemShippingModuleEnabled, setSystemShippingModuleEnabled] = useState(false);
  const [systemMakeupModuleEnabled, setSystemMakeupModuleEnabled] = useState(true);
  const [systemZaloMiniAppEnabled, setSystemZaloMiniAppEnabled] = useState(false);
  const [siteLogoUrl, setSiteLogoUrl] = useState("");
  const [siteLogoDarkUrl, setSiteLogoDarkUrl] = useState("");
  const [posPasskeyEnabled, setPosPasskeyEnabled] = useState(false);
  const [posPasskeyInput, setPosPasskeyInput] = useState("");

  const [branchLateFeeMode, setBranchLateFeeMode] = useState<LateFeeMode>("fixed_per_day");
  const [branchLateFeeValue, setBranchLateFeeValue] = useState("0");
  const [branchShopDomain, setBranchShopDomain] = useState("");
  const [branchLaundryTrackingEnabled, setBranchLaundryTrackingEnabled] = useState(true);
  const [branchRentalModuleEnabled, setBranchRentalModuleEnabled] = useState(true);
  const [branchMakeupModuleEnabled, setBranchMakeupModuleEnabled] = useState(true);
  const [laundryStuckThresholdDays, setLaundryStuckThresholdDays] = useState("3");

  const [customerTags, setCustomerTags] = useState<SettingsCustomerTagInput[]>([]);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [shopDomainCheckMessage, setShopDomainCheckMessage] = useState<string | null>(null);
  const [shopDomainCheckTone, setShopDomainCheckTone] = useState<"success" | "error" | null>(null);
  const [hydratedGeneralKey, setHydratedGeneralKey] = useState<string | null>(null);

  const generalQuery = useSettingsGeneralQuery(branchId);
  const posPasskeyPolicyQuery = useSettingsPosPasskeyPolicyQuery(canManageGlobalSettings);
  const checkShopDomainMutation = useCheckSettingsBranchShopDomainMutation();
  const updateBranchMutation = useUpdateSettingsBranchMutation();
  const updateMutation = useUpdateSettingsGeneralMutation();
  const updatePosPasskeyMutation = useUpdateSettingsPosPasskeyMutation();

  const general = generalQuery.data ?? null;

  const managerLockedBranchId = useMemo(() => {
    if (!isManager) return null;

    return (
      branchAccess.find((entry) => entry.isDefault)?.branchId ??
      currentBranchId ??
      branchAccess[0]?.branchId ??
      null
    );
  }, [branchAccess, currentBranchId, isManager]);

  const accessibleBranches = useMemo(() => {
    const branches = general?.branches ?? [];
    if (!isManager) return branches;

    const lockedBranchId = managerLockedBranchId ?? branchId ?? null;
    if (!lockedBranchId) return branches.slice(0, 1);

    const matchedBranch = branches.find((entry) => entry.id === lockedBranchId);
    if (matchedBranch) return [matchedBranch];

    return branches.slice(0, 1);
  }, [branchId, general?.branches, isManager, managerLockedBranchId]);

  const currentGeneralKey = useMemo(() => {
    if (!general) return null;
    return [
      general.branchId,
      general.systemDefaults.updatedAt ?? "",
      general.branchPolicy.updatedAt ?? "",
    ].join("|");
  }, [general]);

  useEffect(() => {
    if (!canManageGlobalSettings) return;
    const policy = posPasskeyPolicyQuery.data;
    if (!policy) return;

    setPosPasskeyEnabled(policy.enabled);
    setPosPasskeyInput("");
  }, [canManageGlobalSettings, posPasskeyPolicyQuery.data?.enabled, posPasskeyPolicyQuery.data?.version]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!general) return;

    const resolvedBranchId = (() => {
      if (isManager) {
        return (
          general.branches.find((entry) => entry.id === managerLockedBranchId)?.id ??
          general.branches.find((entry) => entry.id === general.branchId)?.id ??
          general.branches[0]?.id ??
          null
        );
      }

      if (branchId && general.branches.some((entry) => entry.id === branchId)) {
        return branchId;
      }

      return (
        general.branches.find((entry) => entry.id === general.branchId)?.id ??
        general.branches[0]?.id ??
        null
      );
    })();

    if (branchId !== resolvedBranchId) {
      setBranchId(resolvedBranchId);
    }

    const resolvedBranch =
      general.branches.find((entry) => entry.id === resolvedBranchId) ??
      general.branches[0] ??
      null;

    setSystemLateFeeMode(general.systemDefaults.lateFeeMode);
    setSystemLateFeeValue(String(general.systemDefaults.lateFeeValue));
    setSystemLaundryTrackingEnabled(general.systemDefaults.laundryTrackingEnabled);
    setSystemShippingModuleEnabled(general.systemDefaults.isShippingModuleEnabled);
    setSystemMakeupModuleEnabled(general.systemDefaults.isMakeupModuleEnabled);
    setSystemZaloMiniAppEnabled(general.systemDefaults.isZaloMiniAppEnabled);
    setSiteLogoUrl(general.systemDefaults.siteLogoUrl ?? "");
    setSiteLogoDarkUrl(general.systemDefaults.siteLogoDarkUrl ?? "");

    setBranchLateFeeMode(general.branchPolicy.lateFeeMode);
    setBranchLateFeeValue(String(general.branchPolicy.lateFeeValue));
    setBranchShopDomain(resolvedBranch?.shopDomain ?? "");
    setBranchLaundryTrackingEnabled(general.branchPolicy.laundryTrackingEnabled);
    setBranchRentalModuleEnabled(general.branchPolicy.isRentalModuleEnabled);
    setBranchMakeupModuleEnabled(general.branchPolicy.isMakeupModuleEnabled);
    setLaundryStuckThresholdDays(String(general.branchPolicy.laundryStuckThresholdDays));

    setCustomerTags(
      general.customerTags.map((entry) => ({
        id: entry.id,
        code: entry.code,
        name: entry.name,
        color: entry.color,
        warnOnOrderCreate: entry.warnOnOrderCreate,
        blockOrderCreate: entry.blockOrderCreate,
        isActive: entry.isActive,
      }))
    );

    setHydratedGeneralKey(currentGeneralKey);
    setActionError(null);
  }, [branchId, currentGeneralKey, generalQuery.data, general, isManager, managerLockedBranchId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const branchOptions = useMemo(
    () =>
      accessibleBranches.map((entry) => ({
        value: entry.id,
        label: `${entry.code} - ${entry.name}`,
      })),
    [accessibleBranches]
  );

  const setCustomerTagValue = (
    tagId: string,
    patch: Partial<
      Pick<SettingsCustomerTagInput, "isActive" | "warnOnOrderCreate" | "blockOrderCreate">
    >
  ) => {
    setCustomerTags((previous) =>
      previous.map((entry) => {
        const entryId = entry.id ?? entry.code;
        if (entryId !== tagId) return entry;
        return {
          ...entry,
          ...patch,
        };
      })
    );
  };

  const resetShopDomainCheckState = () => {
    setShopDomainCheckMessage(null);
    setShopDomainCheckTone(null);
  };

  const onBranchIdChange = (nextBranchId: string | null) => {
    setBranchId(nextBranchId);
    resetShopDomainCheckState();
  };

  const onBranchShopDomainChange = (value: string) => {
    setBranchShopDomain(value);
    resetShopDomainCheckState();
  };

  const onCheckBranchShopDomain = async () => {
    if (!branchId) {
      setShopDomainCheckMessage(copy.missingBranchContext);
      setShopDomainCheckTone("error");
      toast.error(copy.missingBranchContext);
      return;
    }

    const normalizedCandidate = normalizeShopDomainDraft(branchShopDomain);
    if (!normalizedCandidate) {
      setShopDomainCheckMessage(copy.shopDomainRequired);
      setShopDomainCheckTone("error");
      toast.error(copy.shopDomainRequired);
      return;
    }

    try {
      const result = await checkShopDomainMutation.mutateAsync({
        branchId,
        shopDomain: normalizedCandidate,
      });

      if (result.available) {
        setShopDomainCheckMessage(copy.shopDomainAvailable);
        setShopDomainCheckTone("success");
        toast.success(copy.shopDomainAvailable);
        return;
      }

      if (result.reason === "duplicate") {
        const conflictLabel =
          result.conflictBranchCode && result.conflictBranchName
            ? `${result.conflictBranchCode} - ${result.conflictBranchName}`
            : null;
        const message = conflictLabel
          ? `${copy.shopDomainDuplicateWithBranch} ${conflictLabel}.`
          : copy.shopDomainDuplicate;
        setShopDomainCheckMessage(message);
        setShopDomainCheckTone("error");
        toast.error(message);
        return;
      }

      const message =
        result.reason === "reserved"
          ? copy.shopDomainReserved
          : result.reason === "invalid"
            ? copy.shopDomainInvalid
            : copy.shopDomainCheckFailed;
      setShopDomainCheckMessage(message);
      setShopDomainCheckTone("error");
      toast.error(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.shopDomainCheckFailed;
      setShopDomainCheckMessage(message);
      setShopDomainCheckTone("error");
      toast.error(message);
    }
  };

  const onSave = async () => {
    const isFormHydrating =
      generalQuery.isFetching ||
      !general ||
      !currentGeneralKey ||
      hydratedGeneralKey !== currentGeneralKey;
    if (isFormHydrating) return;

    if (!branchId) {
      setActionError(copy.missingBranchContext);
      toast.error(copy.missingBranchContext);
      return;
    }

    setActionError(null);
    setActionSuccess(null);

    try {
      const currentBranch = general.branches.find((entry) => entry.id === branchId) ?? null;
      if (!currentBranch) {
        const fallbackBranchId = general.branches[0]?.id ?? null;
        if (fallbackBranchId) {
          setBranchId(fallbackBranchId);
        }
        setActionError(copy.missingBranchContext);
        toast.error(copy.missingBranchContext);
        return;
      }
      const nextShopDomain = normalizeShopDomainDraft(branchShopDomain);
      const currentShopDomain = normalizeShopDomainDraft(currentBranch?.shopDomain ?? null);

      if (nextShopDomain !== currentShopDomain) {
        await updateBranchMutation.mutateAsync({
          branchId,
          payload: {
            shopDomain: nextShopDomain,
          },
        });
      }

      const branchPolicy: NonNullable<SettingsGeneralUpdatePayload["branchPolicy"]> = {
        lateFeeMode: branchLateFeeMode,
        lateFeeValue: Number(branchLateFeeValue),
        laundryTrackingEnabled: branchLaundryTrackingEnabled,
        laundryStuckThresholdDays: Number(laundryStuckThresholdDays),
      };

      if (canManageGlobalSettings) {
        branchPolicy.isRentalModuleEnabled = branchRentalModuleEnabled;
      }

      if (canManageBranchMakeupModule) {
        branchPolicy.isMakeupModuleEnabled = branchMakeupModuleEnabled;
      }

      const payload: SettingsGeneralUpdatePayload = {
        branchId,
        branchPolicy,
        customerTags,
      };

      if (canManageGlobalSettings) {
        payload.systemDefaults = {
          lateFeeMode: systemLateFeeMode,
          lateFeeValue: Number(systemLateFeeValue),
          laundryTrackingEnabled: systemLaundryTrackingEnabled,
          isShippingModuleEnabled: systemShippingModuleEnabled,
          isMakeupModuleEnabled: systemMakeupModuleEnabled,
          isZaloMiniAppEnabled: systemZaloMiniAppEnabled,
          siteLogoUrl: siteLogoUrl || null,
          siteLogoDarkUrl: siteLogoDarkUrl || null,
        };
      }

      const currentPosPasskeyPolicy = posPasskeyPolicyQuery.data;
      const nextPasskey = posPasskeyInput.trim();
      const shouldUpdatePosPasskey =
        canManageGlobalSettings &&
        (nextPasskey.length > 0 ||
          posPasskeyEnabled !== (currentPosPasskeyPolicy?.enabled ?? false));

      if (
        shouldUpdatePosPasskey &&
        posPasskeyEnabled &&
        !nextPasskey &&
        !currentPosPasskeyPolicy?.configured
      ) {
        setActionError(copy.posPasskeyRequired);
        toast.error(copy.posPasskeyRequired);
        return;
      }

      if (nextPasskey.length > 0 && nextPasskey.length < 4) {
        setActionError(copy.posPasskeyTooShort);
        toast.error(copy.posPasskeyTooShort);
        return;
      }

      await updateMutation.mutateAsync(payload);

      if (shouldUpdatePosPasskey) {
        await updatePosPasskeyMutation.mutateAsync({
          enabled: posPasskeyEnabled,
          newPasskey: nextPasskey || undefined,
        });
      }

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
    canManageGlobalSettings,
    general,
    generalQuery,
    checkShopDomainMutation,
    updateMutation,
    updateBranchMutation,
    actionError,
    actionSuccess,
    shopDomainCheckMessage,
    shopDomainCheckTone,
    isSaveDisabled:
      checkShopDomainMutation.isPending ||
      updateMutation.isPending ||
      updatePosPasskeyMutation.isPending ||
      updateBranchMutation.isPending ||
      generalQuery.isFetching ||
      !general ||
      !currentGeneralKey ||
      hydratedGeneralKey !== currentGeneralKey,
    branchId,
    setBranchId: onBranchIdChange,
    isBranchSelectorLocked: isManager,
    canManageBranchMakeupModule,
    branchOptions,
    systemLateFeeMode,
    setSystemLateFeeMode,
    systemLateFeeValue,
    setSystemLateFeeValue,
    systemLaundryTrackingEnabled,
    setSystemLaundryTrackingEnabled,
    systemShippingModuleEnabled,
    setSystemShippingModuleEnabled,
    systemMakeupModuleEnabled,
    setSystemMakeupModuleEnabled,
    systemZaloMiniAppEnabled,
    setSystemZaloMiniAppEnabled,
    posPasskeyPolicy: posPasskeyPolicyQuery.data ?? null,
    posPasskeyPolicyQuery,
    posPasskeyEnabled,
    setPosPasskeyEnabled,
    posPasskeyInput,
    setPosPasskeyInput,
    siteLogoUrl,
    setSiteLogoUrl,
    siteLogoDarkUrl,
    setSiteLogoDarkUrl,
    branchLateFeeMode,
    setBranchLateFeeMode,
    branchLateFeeValue,
    setBranchLateFeeValue,
    branchShopDomain,
    setBranchShopDomain: onBranchShopDomainChange,
    branchLaundryTrackingEnabled,
    setBranchLaundryTrackingEnabled,
    branchRentalModuleEnabled,
    setBranchRentalModuleEnabled,
    branchMakeupModuleEnabled,
    setBranchMakeupModuleEnabled,
    laundryStuckThresholdDays,
    setLaundryStuckThresholdDays,
    customerTags,
    setCustomerTagValue,
    onCheckBranchShopDomain,
    onSave,
  };
}
