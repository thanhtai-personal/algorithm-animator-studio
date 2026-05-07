"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { Stepper } from "@/components/forms/Stepper";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { DateRangeField } from "@/components/forms/DateRangeField";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import {
  type OrderWizardMode,
  useOrderWizardPage,
} from "@/features/orders/hooks/useOrderWizardPage";
import type { OrderType } from "@/types/domainPrimitives";
import { formatMoney } from "@/utils/format/money";

interface OrderWizardPageProps {
  locale: AppLocale;
  mode: OrderWizardMode;
  orderId?: string;
  variant?: "page" | "modal";
  onSubmitted?: (orderId: string) => void;
}

export const OrderWizardPage = observer(function OrderWizardPage({
  locale,
  mode,
  orderId,
  variant = "page",
  onSubmitted,
}: OrderWizardPageProps) {
  const wizard = useOrderWizardPage({
    locale,
    mode,
    orderId,
    redirectOnSuccess: variant !== "modal",
    onSubmitSuccess: onSubmitted,
  });
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(null);
  const isModal = variant === "modal";
  const subtotalLabel =
    wizard.orderType === "SALE"
      ? locale === "vi"
        ? "Tạm tính bán"
        : "Sale subtotal"
      : wizard.copy.review.subtotal;
  const totalLabel =
    wizard.orderType === "SALE"
      ? locale === "vi"
        ? "Tổng tiền bán"
        : "Sale total"
      : wizard.copy.review.totalRent;
  const itemPriceLabel =
    wizard.orderType === "SALE"
      ? locale === "vi"
        ? "Giá bán override"
        : "Sale price override"
      : wizard.copy.pricing.rentOverrideLabel;
  const processingLabel = locale === "vi" ? "Đang xử lý..." : "Processing...";
  const pageLabel = locale === "vi" ? "Trang" : "Page";
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";

  if (wizard.isEditLoading) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
        {wizard.copy.loadingEdit}
      </section>
    );
  }

  if (wizard.isEditMissing) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 text-sm text-destructive shadow-md">
        {wizard.copy.notFound}
      </section>
    );
  }

  if (!wizard.isEditableStatus) {
    return (
      <section className="animate-fade-in rounded-3xl border border-border bg-card p-6 text-sm text-destructive shadow-md">
        {wizard.copy.notEditable}
      </section>
    );
  }

  return (
    <section className={`${isModal ? "space-y-4" : "animate-fade-in space-y-5"}`}>
      {!isModal ? (
        <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <Link href={`/${locale}/orders`} className="text-xs font-semibold text-muted-foreground">
            {wizard.copy.actions.backToList}
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-foreground">
            {wizard.mode === "create" ? wizard.copy.titleCreate : wizard.copy.titleEdit}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {wizard.mode === "create" ? wizard.copy.subtitleCreate : wizard.copy.subtitleEdit}
          </p>
        </header>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5">
        <Stepper
          steps={wizard.steps}
          currentStepIndex={wizard.stepIndex}
          onStepChange={(index) => wizard.setStepIndex(index)}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md">
          {wizard.currentStepKey === "customer" ? (
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {wizard.copy.customer.searchLabel}
                </span>
                <input
                  type="search"
                  value={wizard.customerSearchInput}
                  onChange={(event) => wizard.setCustomerSearchInput(event.target.value)}
                  placeholder={wizard.copy.customer.searchPlaceholder}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>

              <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
                {wizard.customerTypeaheadItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{wizard.copy.customer.noResult}</p>
                ) : (
                  wizard.customerTypeaheadItems.map((customer) => {
                    const active = wizard.selectedCustomer?.id === customer.id;

                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => wizard.setSelectedCustomer(customer)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-foreground">{customer.fullName}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone ?? "-"}</p>
                      </button>
                    );
                  })
                )}
              </div>

              {wizard.selectedCustomer ? (
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">{wizard.copy.customer.selectedLabel}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {wizard.selectedCustomer.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">{wizard.selectedCustomer.phone ?? "-"}</p>
                </div>
              ) : null}

              {wizard.selectedCustomer?.isBlacklist || wizard.selectedCustomer?.warnOnOrderCreate ? (
                <p className="rounded-lg border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-warning">
                  {wizard.copy.customer.blacklistWarning}
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => wizard.setInlineCustomerOpen((previous) => !previous)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {wizard.copy.customer.createInlineAction}
                </button>
              </div>

              {wizard.inlineCustomerOpen ? (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {wizard.copy.customer.createInlineTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">{wizard.copy.customer.createInlineHint}</p>

                  <VoiceDictationField
                    locale={locale}
                    fieldType="input"
                    label={wizard.copy.customer.fullNameLabel}
                    value={wizard.inlineCustomerDraft.fullName}
                    onValueChange={(value) =>
                      wizard.setInlineCustomerDraft((previous) => ({
                        ...previous,
                        fullName: value,
                      }))
                    }
                    language={locale === "vi" ? "vi-VN" : "en-US"}
                  />

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {wizard.copy.customer.phoneLabel}
                    </span>
                    <input
                      type="tel"
                      value={wizard.inlineCustomerDraft.phone}
                      onChange={(event) =>
                        wizard.setInlineCustomerDraft((previous) => ({
                          ...previous,
                          phone: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {wizard.copy.customer.socialLinkLabel}
                    </span>
                    <input
                      type="text"
                      value={wizard.inlineCustomerDraft.socialLink}
                      onChange={(event) =>
                        wizard.setInlineCustomerDraft((previous) => ({
                          ...previous,
                          socialLink: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    />
                  </label>

                  <VoiceDictationField
                    locale={locale}
                    label={wizard.copy.customer.addressLabel}
                    value={wizard.inlineCustomerDraft.address}
                    onValueChange={(value) =>
                      wizard.setInlineCustomerDraft((previous) => ({
                        ...previous,
                        address: value,
                      }))
                    }
                    rows={3}
                    language={locale === "vi" ? "vi-VN" : "en-US"}
                  />

                  <VoiceDictationField
                    locale={locale}
                    label={wizard.copy.customer.noteLabel}
                    value={wizard.inlineCustomerDraft.note}
                    onValueChange={(value) =>
                      wizard.setInlineCustomerDraft((previous) => ({
                        ...previous,
                        note: value,
                      }))
                    }
                    rows={3}
                    language={locale === "vi" ? "vi-VN" : "en-US"}
                  />

                  {createCustomerError ? (
                    <p className="text-xs text-destructive">{createCustomerError}</p>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setCreateCustomerError(null);
                          await wizard.createInlineCustomer();
                        } catch (error) {
                          setCreateCustomerError(
                            error instanceof Error
                              ? error.message
                              : wizard.copy.customer.createFailed
                          );
                        }
                      }}
                      disabled={wizard.loading}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {wizard.copy.customer.createSubmit}
                    </button>
                    <button
                      type="button"
                      onClick={() => wizard.setInlineCustomerOpen(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      {wizard.copy.customer.createCancel}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {wizard.currentStepKey === "period" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{wizard.copy.period.title}</h3>

              {wizard.orderType === "RENTAL" ? (
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {wizard.copy.period.pricingModeLabel}
                  </span>
                  <select
                    value={wizard.rentalPricingMode}
                    onChange={(event) =>
                      wizard.setRentalPricingMode(
                        event.target.value === "QUICK" ? "QUICK" : "STANDARD"
                      )
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="STANDARD">
                      {wizard.copy.period.pricingModeOptions.STANDARD}
                    </option>
                    <option value="QUICK">
                      {wizard.copy.period.pricingModeOptions.QUICK}
                    </option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {wizard.copy.period.pricingModeHint}
                  </p>
                </label>
              ) : null}

              <DateRangeField
                locale={locale}
                value={{
                  startDate: wizard.startDate,
                  endDate: wizard.endDate,
                }}
                onChange={(value) => {
                  wizard.setStartDate(value.startDate);
                  wizard.setEndDate(value.endDate);
                }}
                disabled={wizard.orderType === "RENTAL"}
                allowSameDay={false}
                startLabel={wizard.copy.period.startLabel}
                endLabel={wizard.copy.period.endLabel}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {wizard.copy.period.pickupTimeLabel}
                  </span>
                  <input
                    type="time"
                    value={wizard.pickupTime}
                    onChange={(event) => wizard.setPickupTime(event.target.value)}
                    disabled={wizard.orderType === "RENTAL"}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {wizard.copy.period.returnTimeLabel}
                  </span>
                  <input
                    type="time"
                    value={wizard.returnTime}
                    onChange={(event) => wizard.setReturnTime(event.target.value)}
                    disabled={wizard.orderType === "RENTAL"}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>
            </div>
          ) : null}

          {wizard.currentStepKey === "items" ? (
            <div className="space-y-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {wizard.copy.customer.orderTypeLabel}
                </span>
                <select
                  value={wizard.orderType}
                  onChange={(event) =>
                    wizard.setOrderType(event.target.value as OrderType)
                  }
                  disabled={wizard.mode === "edit"}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-60"
                >
                  {Object.entries(wizard.copy.customer.orderTypeOptions).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
                <p className="text-xs text-muted-foreground">{wizard.copy.customer.orderTypeHint}</p>
              </label>

              <header>
                <h3 className="text-sm font-semibold text-foreground">{wizard.copy.items.title}</h3>
                <p className="text-xs text-muted-foreground">{wizard.copy.items.subtitle}</p>
              </header>

              <div className="flex flex-wrap gap-2">
                <input
                  type="search"
                  value={wizard.itemSearchInput}
                  onChange={(event) => wizard.setItemSearchInput(event.target.value)}
                  placeholder={wizard.copy.items.searchPlaceholder}
                  className="h-9 min-w-52 rounded-lg border border-border bg-background px-3 text-sm"
                />

                <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <span>{wizard.copy.items.categoryFilter}</span>
                  <select
                    value={wizard.itemProductCategoryId}
                    onChange={(event) => wizard.setItemProductCategoryId(event.target.value)}
                    className="bg-transparent text-xs outline-none"
                  >
                    <option value="">{wizard.copy.items.allCategories}</option>
                    {wizard.categories.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground">
                  <span>{wizard.copy.items.sizeFilter}</span>
                  <select
                    value={wizard.itemSizeFilter}
                    onChange={(event) => wizard.setItemSizeFilter(event.target.value)}
                    className="bg-transparent text-xs outline-none"
                  >
                    <option value="">{wizard.copy.items.allSizes}</option>
                    {wizard.sizes.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => void wizard.availabilityQuery.refetch()}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {wizard.copy.actions.recheckAvailability}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-border">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2">Variant</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wizard.availableInventoryItems.map((item) => {
                      const selected = wizard.selectedItems.some(
                        (entry) => entry.itemId === item.id
                      );

                      return (
                        <tr key={item.id} className="border-b border-border/70 last:border-0">
                          <td className="px-3 py-2 text-xs text-muted-foreground">{item.itemCode}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{item.productName}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {item.variantName}
                            {item.size ? ` · ${item.size}` : ""}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              disabled={selected}
                              onClick={() => wizard.addSelectedItem(item.id)}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground disabled:opacity-50"
                            >
                              {selected
                                ? wizard.copy.items.addedAction
                                : wizard.copy.items.addAction}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() =>
                    wizard.setInventoryPage(Math.max(1, wizard.inventoryPage - 1))
                  }
                  disabled={wizard.inventoryPage <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {wizard.inventoryPage}/{wizard.inventoryTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    wizard.setInventoryPage(
                      Math.min(wizard.inventoryTotalPages, wizard.inventoryPage + 1)
                    )
                  }
                  disabled={wizard.inventoryPage >= wizard.inventoryTotalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{wizard.copy.items.selectedTitle}</h4>

                {wizard.selectedItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{wizard.copy.items.selectedEmpty}</p>
                ) : (
                  wizard.selectedItems.map((item) => (
                    <div
                      key={item.itemId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.itemCode}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productName} · {item.variantName}
                        </p>
                        {wizard.unavailableSelectedItemIds.has(item.itemId) ? (
                          <p className="text-xs text-destructive">{wizard.copy.items.unavailable}</p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => wizard.removeSelectedItem(item.itemId)}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                      >
                        {wizard.copy.items.removeAction}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {wizard.currentStepKey === "pricing" ? (
            <div className="space-y-4">
              <header>
                <h3 className="text-sm font-semibold text-foreground">{wizard.copy.pricing.title}</h3>
                <p className="text-xs text-muted-foreground">{wizard.copy.pricing.subtitle}</p>
              </header>

              <div className="space-y-3">
                {wizard.selectedItems.map((item) => (
                  <div key={item.itemId} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold text-foreground">{item.itemCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.productName} · {item.variantName}
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {wizard.orderType === "RENTAL" ? (
                        <label className="space-y-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {wizard.copy.pricing.rentPlanLabel}
                          </span>
                          <select
                            value={wizard.rentalPricingMode === "QUICK" ? "1d" : "3d"}
                            disabled
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                          >
                            {wizard.rentPlanOptions.map((plan) => (
                              <option key={plan} value={plan}>
                                {wizard.copy.pricing.rentPlanOptions[plan]}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {wizard.canOverridePricing ? (
                        <MoneyInput
                          locale={locale}
                          label={itemPriceLabel}
                          value={item.rentPriceOverride}
                          onValueChange={(value) =>
                            wizard.updateSelectedItem(item.itemId, (previous) => ({
                              ...previous,
                              rentPriceOverride: value,
                            }))
                          }
                        />
                      ) : null}

                      {wizard.canOverridePricing && wizard.orderType === "RENTAL" ? (
                        <MoneyInput
                          locale={locale}
                          label={wizard.copy.pricing.depositOverrideLabel}
                          value={item.depositOverrideAmount}
                          onValueChange={(value) =>
                            wizard.updateSelectedItem(item.itemId, (previous) => ({
                              ...previous,
                              depositOverrideAmount: value,
                            }))
                          }
                        />
                      ) : null}

                      {!wizard.canOverridePricing ? (
                        <p className="text-xs text-muted-foreground">
                          {wizard.copy.pricing.autoPriceHint}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {wizard.copy.pricing.managerOverrideHint}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {wizard.copy.pricing.discountTypeLabel}
                  </span>
                  <select
                    value={wizard.discountType ?? ""}
                    onChange={(event) =>
                      wizard.setDiscountType(
                        event.target.value
                          ? (event.target.value as Exclude<typeof wizard.discountType, null>)
                          : null
                      )
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">{wizard.copy.pricing.discountTypeOptions.none}</option>
                    <option value="amount">{wizard.copy.pricing.discountTypeOptions.amount}</option>
                    <option value="percent">{wizard.copy.pricing.discountTypeOptions.percent}</option>
                  </select>
                </label>

                {wizard.discountType ? (
                  <MoneyInput
                    locale={locale}
                    label={wizard.copy.pricing.discountValueLabel}
                    value={wizard.discountValue}
                    onValueChange={wizard.setDiscountValue}
                  />
                ) : null}

                <MoneyInput
                  locale={locale}
                  label={wizard.copy.pricing.feesLabel}
                  value={wizard.feesAmount}
                  onValueChange={wizard.setFeesAmount}
                />

                {wizard.canOverridePricing && wizard.orderType === "RENTAL" ? (
                  <MoneyInput
                    locale={locale}
                    label={wizard.copy.pricing.depositOrderLabel}
                    value={wizard.orderDepositOverride}
                    onValueChange={wizard.setOrderDepositOverride}
                  />
                ) : null}
              </div>

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{wizard.copy.pricing.paymentTitle}</h4>
                  <button
                    type="button"
                    onClick={wizard.addPayment}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {wizard.copy.pricing.paymentAddAction}
                  </button>
                </div>

                {wizard.payments.map((payment) => (
                  <div key={payment.id} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 lg:grid-cols-4">
                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">{wizard.copy.pricing.paymentTypeLabel}</span>
                        <select
                          value={payment.type}
                          onChange={(event) =>
                            wizard.updatePayment(payment.id, (previous) => ({
                              ...previous,
                              type: event.target.value as typeof previous.type,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                        >
                          {wizard.paymentTypes.map((type) => (
                            <option key={type} value={type}>
                              {wizard.copy.pricing.paymentTypeOptions[type]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs text-muted-foreground">{wizard.copy.pricing.paymentMethodLabel}</span>
                        <select
                          value={payment.method}
                          onChange={(event) =>
                            wizard.updatePayment(payment.id, (previous) => ({
                              ...previous,
                              method: event.target.value as typeof previous.method,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                        >
                          {wizard.paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {wizard.copy.pricing.paymentMethodOptions[method]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <MoneyInput
                        locale={locale}
                        label={wizard.copy.pricing.paymentAmountLabel}
                        value={payment.amount}
                        onValueChange={(value) =>
                          wizard.updatePayment(payment.id, (previous) => ({
                            ...previous,
                            amount: value,
                          }))
                        }
                      />

                      <div className="space-y-1">
                        <span
                          aria-hidden="true"
                          className="hidden text-xs text-transparent select-none lg:block"
                        >
                          {wizard.copy.pricing.paymentAmountLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => wizard.removePayment(payment.id)}
                          disabled={wizard.mode === "create" && wizard.payments.length <= 1}
                          className="h-10 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {wizard.copy.pricing.paymentRemoveAction}
                        </button>
                      </div>
                    </div>

                    <VoiceDictationField
                      locale={locale}
                      label={wizard.copy.pricing.paymentNoteLabel}
                      value={payment.note}
                      onValueChange={(value) =>
                        wizard.updatePayment(payment.id, (previous) => ({
                          ...previous,
                          note: value,
                        }))
                      }
                      rows={3}
                      language={locale === "vi" ? "vi-VN" : "en-US"}
                    />
                  </div>
                ))}

                {wizard.hasUnfilledPaymentAmounts ? (
                  <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    {wizard.copy.pricing.paymentMissingAmountHint}
                  </p>
                ) : null}
              </div>

              <VoiceDictationField
                locale={locale}
                label={wizard.copy.pricing.noteLabel}
                value={wizard.orderNote}
                onValueChange={wizard.setOrderNote}
                rows={3}
                language={locale === "vi" ? "vi-VN" : "en-US"}
              />

              <VoiceDictationField
                locale={locale}
                label={wizard.copy.pricing.internalNoteLabel}
                value={wizard.internalNote}
                onValueChange={wizard.setInternalNote}
                rows={3}
                language={locale === "vi" ? "vi-VN" : "en-US"}
              />
            </div>
          ) : null}

          {wizard.currentStepKey === "review" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">{wizard.copy.review.title}</h3>

              <dl className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.customer}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {wizard.selectedCustomer?.fullName ?? "-"}
                  </dd>
                  <dd className="text-xs text-muted-foreground">
                    {wizard.selectedCustomer?.phone ?? "-"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.period}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {wizard.orderType === "SALE"
                      ? wizard.copy.customer.orderTypeOptions.SALE
                      : `${wizard.startDate} - ${wizard.endDate}`}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.itemCount}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">{wizard.selectedItems.length}</dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{subtotalLabel}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(wizard.subtotal, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.discount}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(wizard.discountAmount, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.fees}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(wizard.feesAmount, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{totalLabel}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(wizard.totalRent, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>

                {wizard.orderType === "RENTAL" ? (
                  <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{wizard.copy.review.depositRequired}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(wizard.depositRequired, { locale, currency: "VND" }) || "-"}
                    </dd>
                  </div>
                ) : null}

                {wizard.orderType === "RENTAL" ? (
                  <div className="rounded-lg border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{wizard.copy.review.depositPaid}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {formatMoney(wizard.depositPaid, { locale, currency: "VND" }) || "-"}
                    </dd>
                  </div>
                ) : null}

                <div className="rounded-lg border border-border p-3">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.rentPaid}</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {formatMoney(wizard.rentPaid, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>

                <div className="rounded-lg border border-border p-3 md:col-span-2">
                  <dt className="text-xs text-muted-foreground">{wizard.copy.review.balance}</dt>
                  <dd className="mt-1 text-lg font-bold text-foreground">
                    {formatMoney(wizard.balance, { locale, currency: "VND" }) || "-"}
                  </dd>
                </div>
              </dl>

              {wizard.orderNote ? (
                <p className="text-xs text-muted-foreground">
                  {wizard.copy.review.note}: {wizard.orderNote}
                </p>
              ) : null}
              {wizard.internalNote ? (
                <p className="text-xs text-muted-foreground">
                  {wizard.copy.review.internalNote}: {wizard.internalNote}
                </p>
              ) : null}

              {wizard.submitError ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {wizard.submitError}
                </p>
              ) : null}
              {wizard.submitSuccess ? (
                <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
                  {wizard.submitSuccess}
                </p>
              ) : null}
            </div>
          ) : null}

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={wizard.goPreviousStep}
              disabled={wizard.stepIndex <= 0 || wizard.loading}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground disabled:opacity-50"
            >
              {wizard.copy.actions.back}
            </button>

            {wizard.stepIndex < wizard.maxStepIndex ? (
              <button
                type="button"
                onClick={wizard.goNextStep}
                disabled={!wizard.canProceedCurrentStep || wizard.loading}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {wizard.copy.actions.next}
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void wizard.submitOrder("DRAFT")}
                  disabled={wizard.loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground disabled:opacity-50"
                >
                  {wizard.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>
                    {wizard.loading ? processingLabel : wizard.copy.actions.submitDraft}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void wizard.submitOrder("RESERVED")}
                  disabled={wizard.loading}
                  hidden={wizard.orderType === "SALE"}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground disabled:opacity-50"
                >
                  {wizard.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>
                    {wizard.loading ? processingLabel : wizard.copy.actions.submitReserved}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void wizard.submitOrder("CONFIRMED")}
                  disabled={wizard.loading}
                  hidden={wizard.orderType === "RENTAL"}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {wizard.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>
                    {wizard.loading ? processingLabel : wizard.copy.actions.submitConfirmed}
                  </span>
                </button>
              </div>
            )}
          </footer>
        </section>

        <aside className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-md xl:sticky xl:top-20 xl:self-start">
          <h4 className="text-sm font-semibold text-foreground">{wizard.copy.review.title}</h4>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{subtotalLabel}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(wizard.subtotal, { locale, currency: "VND" }) || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{wizard.copy.review.discount}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(wizard.discountAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{wizard.copy.review.fees}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(wizard.feesAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{totalLabel}</span>
              <span className="font-semibold text-foreground">
                {formatMoney(wizard.totalRent, { locale, currency: "VND" }) || "-"}
              </span>
            </div>
            {wizard.orderType === "RENTAL" ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{wizard.copy.review.depositRequired}</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(wizard.depositRequired, { locale, currency: "VND" }) || "-"}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{wizard.copy.review.balance}</span>
              <span className="text-lg font-bold text-foreground">
                {formatMoney(wizard.balance, { locale, currency: "VND" }) || "-"}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {wizard.paymentReceiptModalOpen ? (
        <div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-black/45 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={wizard.copy.paymentReceipt.title}
          onClick={wizard.closePaymentReceiptModal}
        >
          <form
            className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
            onSubmit={(event) => {
              event.preventDefault();
              void wizard.confirmPaymentReceiptAndSubmit();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4 overflow-y-auto p-4 sm:p-5">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {wizard.copy.paymentReceipt.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {wizard.copy.paymentReceipt.description}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatMoney(wizard.createPaymentsCollectedAmount, {
                  locale,
                  currency: "VND",
                }) || "0"}
              </p>
            </div>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">
                {wizard.copy.paymentReceipt.amountLabel}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={wizard.paymentReceiptAmountInput}
                onChange={(event) => wizard.setPaymentReceiptAmountInput(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wide">
                {wizard.copy.paymentReceipt.methodLabel}
              </span>
              <select
                value={wizard.paymentReceiptMethod}
                onChange={(event) =>
                  wizard.setPaymentReceiptMethod(event.target.value as "CASH" | "BANK")
                }
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="CASH">{wizard.copy.paymentReceipt.methodOptions.CASH}</option>
                <option value="BANK">{wizard.copy.paymentReceipt.methodOptions.BANK}</option>
              </select>
            </label>

            <VoiceDictationField
              locale={locale}
              label={wizard.copy.paymentReceipt.noteLabel}
              value={wizard.paymentReceiptNote}
              onValueChange={wizard.setPaymentReceiptNote}
              rows={2}
              language={locale === "vi" ? "vi-VN" : "en-US"}
            />

            {wizard.paymentReceiptError ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {wizard.paymentReceiptError}
              </p>
            ) : null}

            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-border bg-card/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={wizard.closePaymentReceiptModal}
                className="min-h-10 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted-foreground"
              >
                {wizard.copy.paymentReceipt.cancelAction}
              </button>
              <button
                type="submit"
                disabled={wizard.loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {wizard.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>
                  {wizard.loading ? processingLabel : wizard.copy.paymentReceipt.confirmAction}
                </span>
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
});
