"use client";

import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { FilterChips } from "@/components/filters/FilterChips";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { Stepper } from "@/components/forms/Stepper";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { DateRangeField } from "@/components/forms/DateRangeField";
import { ProductGrid } from "@/components/products/ProductGrid";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { formatMoney } from "@/utils/format/money";
import { formatDateRangeLabel } from "@/utils/format/date";
import { useSharedPrimitivesPlayground } from "@/features/dashboard/hooks/useSharedPrimitivesPlayground";

interface SharedPrimitivesPlaygroundProps {
  locale: AppLocale;
}

export function SharedPrimitivesPlayground({
  locale,
}: SharedPrimitivesPlaygroundProps) {
  const {
    copy,
    selectedFilterValues,
    toggleFilter,
    resetFilters,
    filterOptions,
    stepperSteps,
    currentStepIndex,
    setCurrentStepIndex,
    sampleOrders,
    products,
    paymentStatusSamples,
    moneyValue,
    setMoneyValue,
    moneyError,
    setMoneyError,
    dateRangeValue,
    setDateRangeValue,
    dateRangeValidation,
    phoneValue,
    setPhoneValue,
    phoneValidation,
    drawerOpen,
    setDrawerOpen,
    voiceNote,
    setVoiceNote,
  } = useSharedPrimitivesPlayground(locale);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header>
        <h2 className="text-xl font-semibold text-foreground">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </header>

      <FilterBarShell
        onApply={() => undefined}
        onReset={resetFilters}
        applyLabel={copy.filterApply}
        resetLabel={copy.filterReset}
      >
        <FilterChips
          options={filterOptions}
          selectedValues={selectedFilterValues}
          onToggle={toggleFilter}
        />
      </FilterBarShell>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">{copy.stepsTitle}</h3>
          <Stepper
            steps={stepperSteps}
            currentStepIndex={currentStepIndex}
            onStepChange={setCurrentStepIndex}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((previous) => Math.max(previous - 1, 0))}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {copy.stepPrevious}
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentStepIndex((previous) =>
                  Math.min(previous + 1, stepperSteps.length - 1)
                )
              }
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {copy.stepNext}
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">{copy.formTitle}</h3>

          <MoneyInput
            label={locale === "vi" ? "Tiền cọc" : "Deposit"}
            value={moneyValue}
            onValueChange={setMoneyValue}
            onValidationChange={setMoneyError}
            locale={locale}
            currency="VND"
          />
          {moneyError ? (
            <p className="text-xs text-destructive">
              {moneyError === "invalid-number" ? copy.moneyInvalid : copy.moneyNegative}
            </p>
          ) : null}

          <DateRangeField
            value={dateRangeValue}
            onChange={setDateRangeValue}
            locale={locale}
            allowSameDay={false}
            allowEmpty
          />

          {dateRangeValidation.isValid && dateRangeValue.startDate && dateRangeValue.endDate ? (
            <p className="text-xs text-muted-foreground">
              {formatDateRangeLabel(dateRangeValue, { locale })}
            </p>
          ) : null}

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.phoneLabel}
            </span>
            <input
              type="text"
              value={phoneValue}
              onChange={(event) => setPhoneValue(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            />
          </label>

          {phoneValue ? (
            <p
              className={`text-xs ${
                phoneValidation.isValid ? "text-success" : "text-destructive"
              }`}
            >
              {phoneValidation.isValid ? copy.phoneValid : copy.phoneInvalid}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            {copy.openDrawer}
          </button>
        </section>
      </div>

      <section className="space-y-3 rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground">{copy.statusBadgesTitle}</h3>
        <div className="flex flex-wrap gap-2">
          <StatusBadge kind="item" status="READY" />
          <StatusBadge kind="item" status="ON_RENT" />
          <StatusBadge kind="order" status="RESERVED" />
          <StatusBadge kind="order" status="PICKED_UP" />
          {paymentStatusSamples.map((status) => (
            <StatusBadge key={status} kind="payment" status={status} />
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-background p-4">
        <h3 className="text-sm font-semibold text-foreground">{copy.productsTitle}</h3>
        <p className="text-xs text-muted-foreground">{copy.productsSubtitle}</p>

        <ProductGrid
          items={products.map((product) => ({
            id: product.id,
            title: product.title,
            subtitle: product.subtitle,
            tags: product.tags,
            price: product.price,
            locale,
            currency: "VND",
            badge: <StatusBadge kind="item" status={product.itemStatus} />,
            primaryActionLabel: product.primaryActionLabel,
            secondaryActionLabel: product.secondaryActionLabel,
          }))}
        />
      </section>

      <DataTableShell
        title={copy.tableTitle}
        subtitle={copy.tableSubtitle}
        locale={locale}
        columns={[
          { key: "orderCode", header: copy.tableHeaders.orderCode },
          { key: "customer", header: copy.tableHeaders.customer },
          { key: "status", header: copy.tableHeaders.status },
          { key: "total", header: copy.tableHeaders.total, className: "text-right" },
        ]}
        pagination={
          <p className="text-xs text-muted-foreground">
            {copy.tablePagination}
          </p>
        }
      >
        {sampleOrders.map((order) => (
          <tr key={order.code} className="border-b border-border/70 last:border-0">
            <td className="px-4 py-3 text-foreground">{order.code}</td>
            <td className="px-4 py-3 text-muted-foreground">{order.customerName}</td>
            <td className="px-4 py-3">
              <StatusBadge kind="order" status={order.status} />
            </td>
            <td className="px-4 py-3 text-right text-foreground">
              {formatMoney(order.totalAmount, { locale, currency: "VND" })}
            </td>
          </tr>
        ))}
      </DataTableShell>

      <DrawerFormShell
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={copy.drawerTitle}
        description={copy.drawerDescription}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {copy.drawerCancel}
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              {copy.drawerSave}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <VoiceDictationField
            label={locale === "vi" ? "Ghi chú đơn" : "Order note"}
            value={voiceNote}
            onValueChange={setVoiceNote}
            language={locale === "vi" ? "vi-VN" : "en-US"}
            locale={locale}
            active={drawerOpen}
            placeholder={
              locale === "vi"
                ? "Nhập tay hoặc bấm voice để thêm ghi chú"
                : "Type or use voice to dictate note"
            }
            labels={
              locale === "vi"
                ? {
                    idleButton: "Bật voice",
                    listeningButton: "Dừng",
                    processingButton: "Đang xử lý...",
                    errorButton: "Thử lại",
                    unsupportedButton: "Không hỗ trợ",
                    idleHint: "Voice chỉ thêm nội dung vào field hiện tại, không tự submit.",
                    listeningHint: "Đang nghe...",
                    processingHint: "Đang nhận kết quả giọng nói...",
                    unsupportedHint: "Trình duyệt chưa hỗ trợ voice input.",
                    permissionDeniedHint: "Bạn đã từ chối quyền microphone.",
                    errorHint: "Voice input bị lỗi, hãy thử lại.",
                  }
                : undefined
            }
          />

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
          >
            {copy.closeDrawer}
          </button>
        </div>
      </DrawerFormShell>
    </section>
  );
}
