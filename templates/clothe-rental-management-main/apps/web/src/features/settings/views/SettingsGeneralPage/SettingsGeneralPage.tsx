"use client";

import { useState } from "react";
import { observer } from "mobx-react-lite";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { SettingsAccessDenied } from "@/features/settings/components/SettingsAccessDenied";
import { useSettingsGeneralPage } from "@/features/settings/hooks/useSettingsGeneralPage";
import { SettingsGeneralAdvancedSection } from "./SettingsGeneralAdvancedSection";
import { SettingsGeneralBrandingSection } from "./SettingsGeneralBrandingSection";
import { SettingsGeneralBranchSelector } from "./SettingsGeneralBranchSelector";
import { SettingsGeneralPageHeader } from "./SettingsGeneralPageHeader";
import { SettingsGeneralErrorState, SettingsGeneralLoadingState } from "./SettingsGeneralPageStates";
import { SettingsGeneralPosPasskeySection } from "./SettingsGeneralPosPasskeySection";
import { SettingsGeneralStatusMessage } from "./SettingsGeneralStatusMessage";
import { parseMoneyFieldValue, stringifyMoneyFieldValue } from "./moneyField.utils";
import type { SettingsGeneralPageProps } from "./types";

export const SettingsGeneralPage = observer(function SettingsGeneralPage({
  locale,
}: SettingsGeneralPageProps) {
  const [logoPickerTarget, setLogoPickerTarget] = useState<"light" | "dark" | null>(null);
  const {
    copy,
    canManageSettings,
    canManageGlobalSettings,
    general,
    generalQuery,
    checkShopDomainMutation,
    updateMutation,
    actionError,
    actionSuccess,
    shopDomainCheckMessage,
    shopDomainCheckTone,
    isSaveDisabled,
    branchId,
    setBranchId,
    isBranchSelectorLocked,
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
    posPasskeyPolicy,
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
    setBranchShopDomain,
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
  } = useSettingsGeneralPage(locale);

  if (!canManageSettings) {
    return <SettingsAccessDenied locale={locale} message={copy.noPermission} />;
  }

  if (!general && generalQuery.isLoading) {
    return <SettingsGeneralLoadingState label={copy.loading} />;
  }

  if (!general && generalQuery.isError) {
    return (
      <SettingsGeneralErrorState
        label={copy.loadError}
        retryLabel={copy.retryAction}
        onRetry={() => void generalQuery.refetch()}
      />
    );
  }

  if (!general) {
    return null;
  }

  const chooseFromLibraryLabel = locale === "vi" ? "Chọn từ thư viện" : "Choose from library";
  const chooseFromLibraryBranchHint =
    locale === "vi"
      ? "Cần chọn chi nhánh trước khi mở thư viện media."
      : "Select a branch before opening media library.";
  const posPasskeyUpdatedAtLabel = (() => {
    if (!posPasskeyPolicy?.updatedAt) return "-";
    const parsed = new Date(posPasskeyPolicy.updatedAt);
    if (Number.isNaN(parsed.getTime())) return posPasskeyPolicy.updatedAt;
    return parsed.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");
  })();

  return (
    <section className="animate-fade-in space-y-5">
      <SettingsGeneralPageHeader locale={locale} title={copy.title} subtitle={copy.subtitle} />
      <SettingsGeneralStatusMessage message={actionError} tone="error" />
      <SettingsGeneralStatusMessage message={actionSuccess} tone="success" />
      <SettingsGeneralBranchSelector
        label={copy.branchLabel}
        value={branchId}
        options={branchOptions}
        disabled={isBranchSelectorLocked}
        onChange={setBranchId}
      />

      <section className={canManageGlobalSettings ? "grid gap-4 xl:grid-cols-2" : "grid gap-4"}>
        {canManageGlobalSettings ? (
          <article className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-foreground">{copy.systemDefaultsTitle}</h2>
              <p className="text-xs text-muted-foreground">{copy.systemDefaultsHint}</p>
            </div>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.lateFeeMode}</span>
              <select
                value={systemLateFeeMode}
                onChange={(event) =>
                  setSystemLateFeeMode(event.target.value as "fixed_per_day" | "percent_per_day")
                }
                className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="fixed_per_day">fixed_per_day</option>
                <option value="percent_per_day">percent_per_day</option>
              </select>
            </label>

            <MoneyInput
              value={parseMoneyFieldValue(systemLateFeeValue)}
              onValueChange={(value) => setSystemLateFeeValue(stringifyMoneyFieldValue(value))}
              locale={locale}
              currency="VND"
              label={copy.lateFeeValue}
              showPreview={false}
              inputClassName="h-9 rounded-xl"
            />

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.laundryTracking}</span>
                <input
                  type="checkbox"
                  checked={systemLaundryTrackingEnabled}
                  onChange={(event) => setSystemLaundryTrackingEnabled(event.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.shippingModule}</span>
                <input
                  type="checkbox"
                  checked={systemShippingModuleEnabled}
                  onChange={(event) => setSystemShippingModuleEnabled(event.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.makeupModule}</span>
                <input
                  type="checkbox"
                  checked={systemMakeupModuleEnabled}
                  onChange={(event) => setSystemMakeupModuleEnabled(event.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.zaloMiniAppModule}</span>
                <input
                  type="checkbox"
                  checked={systemZaloMiniAppEnabled}
                  onChange={(event) => setSystemZaloMiniAppEnabled(event.target.checked)}
                />
              </label>
            </div>
          </article>
        ) : null}

        <article className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">{copy.branchPolicyTitle}</h2>
            <p className="text-xs text-muted-foreground">{copy.branchPolicyHint}</p>
          </div>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.shopDomainLabel}</span>
            <input
              type="text"
              value={branchShopDomain}
              onChange={(event) => setBranchShopDomain(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
            <p>{copy.shopDomainHint}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void onCheckBranchShopDomain()}
                disabled={checkShopDomainMutation.isPending}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-60"
              >
                {checkShopDomainMutation.isPending
                  ? copy.checkingShopDomain
                  : copy.checkShopDomainAction}
              </button>
              {shopDomainCheckMessage ? (
                <span
                  className={`text-xs ${
                    shopDomainCheckTone === "success"
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  {shopDomainCheckMessage}
                </span>
              ) : null}
            </div>
          </label>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.lateFeeMode}</span>
            <select
              value={branchLateFeeMode}
              onChange={(event) =>
                setBranchLateFeeMode(event.target.value as "fixed_per_day" | "percent_per_day")
              }
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="fixed_per_day">fixed_per_day</option>
              <option value="percent_per_day">percent_per_day</option>
            </select>
          </label>

          <MoneyInput
            value={parseMoneyFieldValue(branchLateFeeValue)}
            onValueChange={(value) => setBranchLateFeeValue(stringifyMoneyFieldValue(value))}
            locale={locale}
            currency="VND"
            label={copy.lateFeeValue}
            showPreview={false}
            inputClassName="h-9 rounded-xl"
          />

          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
              <span>{copy.laundryTracking}</span>
              <input
                type="checkbox"
                checked={branchLaundryTrackingEnabled}
                onChange={(event) => setBranchLaundryTrackingEnabled(event.target.checked)}
              />
            </label>

            {canManageGlobalSettings ? (
              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.rentalModule}</span>
                <input
                  type="checkbox"
                  checked={branchRentalModuleEnabled}
                  onChange={(event) => setBranchRentalModuleEnabled(event.target.checked)}
                />
              </label>
            ) : null}

            {canManageBranchMakeupModule ? (
              <label className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span>{copy.makeupModule}</span>
                <input
                  type="checkbox"
                  checked={branchMakeupModuleEnabled}
                  onChange={(event) => setBranchMakeupModuleEnabled(event.target.checked)}
                />
              </label>
            ) : null}
          </div>

          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.laundryThreshold}</span>
            <input
              type="number"
              min={0}
              value={laundryStuckThresholdDays}
              onChange={(event) => setLaundryStuckThresholdDays(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </article>
      </section>

      {canManageGlobalSettings ? (
        <SettingsGeneralBrandingSection
          copy={copy}
          branchId={branchId}
          siteLogoUrl={siteLogoUrl}
          siteLogoDarkUrl={siteLogoDarkUrl}
          chooseFromLibraryLabel={chooseFromLibraryLabel}
          chooseFromLibraryBranchHint={chooseFromLibraryBranchHint}
          onSiteLogoUrlChange={setSiteLogoUrl}
          onSiteLogoDarkUrlChange={setSiteLogoDarkUrl}
          onOpenLogoPicker={setLogoPickerTarget}
        />
      ) : null}

      {canManageGlobalSettings ? (
        <SettingsGeneralPosPasskeySection
          copy={copy}
          posPasskeyPolicyQuery={posPasskeyPolicyQuery}
          posPasskeyEnabled={posPasskeyEnabled}
          posPasskeyInput={posPasskeyInput}
          posPasskeyUpdatedAtLabel={posPasskeyUpdatedAtLabel}
          onPosPasskeyEnabledChange={setPosPasskeyEnabled}
          onPosPasskeyInputChange={setPosPasskeyInput}
        />
      ) : null}

      <SettingsGeneralAdvancedSection
        copy={copy}
        customerTags={customerTags}
        onCustomerTagValueChange={setCustomerTagValue}
      />

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs text-muted-foreground">
          {copy.resetPasswordHint}: <code>{general.selfServicePasswordPath}</code>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.adminResetSupportHint}: {general.adminResetPasswordSupported ? "true" : "false"}
        </p>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={isSaveDisabled}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
        >
          {updateMutation.isPending ? copy.saving : copy.saveAction}
        </button>
      </div>

      <MediaPickerModal
        locale={locale}
        open={logoPickerTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLogoPickerTarget(null);
        }}
        branchId={branchId}
        defaultMediaType="image"
        onSelectAsset={(asset) => {
          if (!asset.publicUrl) return;
          if (logoPickerTarget === "dark") {
            setSiteLogoDarkUrl(asset.publicUrl);
          } else {
            setSiteLogoUrl(asset.publicUrl);
          }
          setLogoPickerTarget(null);
        }}
      />
    </section>
  );
});
