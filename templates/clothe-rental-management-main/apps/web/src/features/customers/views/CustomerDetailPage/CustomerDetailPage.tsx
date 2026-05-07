"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { useCustomerDetailPage } from "@/features/customers/hooks/useCustomerDetailPage";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface CustomerDetailPageProps {
  locale: AppLocale;
  customerId: string;
}

const CUSTOMER_ORDERS_HISTORY_PAGE_SIZE = 10;

function resolveTagIntent(tagName: string): "vip" | "blacklist" | null {
  const normalized = tagName.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("vip")) return "vip";
  if (
    normalized.includes("blacklist") ||
    normalized.includes("black list") ||
    normalized.includes("black-listed") ||
    normalized.includes("den") ||
    normalized.includes("đen") ||
    normalized.includes("cam")
  ) {
    return "blacklist";
  }

  return null;
}

export const CustomerDetailPage = observer(function CustomerDetailPage({
  locale,
  customerId,
}: CustomerDetailPageProps) {
  const {
    copy,
    detail,
    detailQuery,
    draft,
    setDraft,
    saveCustomer,
    updateMutation,
    saveMessage,
    setSaveMessage,
    orderStatusFilter,
    setOrderStatusFilter,
    orderStatusOptions,
    filteredOrders,
    draftPhoneValidation,
    toggleTag,
    orderStatusLabels,
  } = useCustomerDetailPage(locale, customerId);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const vipTag = detail?.customer.tags.find((tag) => resolveTagIntent(tag.name) === "vip");
  const blacklistTag = detail?.customer.tags.find(
    (tag) => resolveTagIntent(tag.name) === "blacklist"
  );

  if (detailQuery.isLoading && !detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {copy.loading}
      </section>
    );
  }

  if (!detail || !draft) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
        {copy.notFound}
      </section>
    );
  }

  const ordersPagination = paginateItems(
    filteredOrders,
    ordersPage,
    CUSTOMER_ORDERS_HISTORY_PAGE_SIZE
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <Link href={`/${locale}/customers`} className="text-xs font-semibold text-muted-foreground">
          {copy.backAction}
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{detail.customer.fullName}</h1>
          {vipTag ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {vipTag.name}
            </span>
          ) : null}
          {blacklistTag ? (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive">
              {blacklistTag.name}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{detail.customer.phone ?? "-"}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{copy.stats.totalOrders}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{detail.customer.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{copy.stats.totalSpent}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {formatMoney(detail.customer.totalSpent, { locale, currency: "VND" }) || "-"}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{copy.stats.lastOrderDate}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {detail.customer.lastOrderDate
              ? formatDateLabel(detail.customer.lastOrderDate, { locale })
              : "-"}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{copy.stats.totalIncidents}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {detail.incidentsSummary.totalCount}
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">{copy.stats.openIncidents}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {detail.incidentsSummary.openCount}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h2 className="text-lg font-semibold text-foreground">{copy.contactInfoTitle}</h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <VoiceDictationField
            locale={locale}
            label={copy.fullNameLabel}
            fieldType="input"
            value={draft.fullName}
            onValueChange={(value) =>
              setDraft((previous) =>
                previous
                  ? {
                      ...previous,
                      fullName: value,
                    }
                  : previous
              )
            }
            language={locale === "vi" ? "vi-VN" : "en-US"}
          />

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.phoneLabel}
            </span>
            <input
              type="tel"
              value={draft.phone}
              onChange={(event) =>
                setDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        phone: event.target.value,
                      }
                    : previous
                )
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
            {draft.phone ? (
              <p
                className={`text-xs ${draftPhoneValidation.isValid ? "text-success" : "text-destructive"}`}
              >
                {draftPhoneValidation.isValid ? draft.phone.trim() : copy.phoneInvalid}
              </p>
            ) : null}
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.socialLinkLabel}
            </span>
            <input
              type="text"
              value={draft.socialLink}
              onChange={(event) =>
                setDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        socialLink: event.target.value,
                      }
                    : previous
                )
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>

          <div className="md:col-span-2">
            <VoiceDictationField
              locale={locale}
              label={copy.addressLabel}
              value={draft.address}
              onValueChange={(value) =>
                setDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        address: value,
                      }
                    : previous
                )
              }
              rows={3}
              language={locale === "vi" ? "vi-VN" : "en-US"}
            />
          </div>

          <div className="md:col-span-2">
            <VoiceDictationField
              locale={locale}
              label={copy.noteLabel}
              value={draft.note}
              onValueChange={(value) =>
                setDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        note: value,
                      }
                    : previous
                )
              }
              rows={4}
              language={locale === "vi" ? "vi-VN" : "en-US"}
            />
          </div>

          <fieldset className="space-y-2 md:col-span-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.tagsTitle}
            </legend>
            <div className="flex flex-wrap gap-2">
              {detail.availableTags.length === 0 ? (
                <span className="text-xs text-muted-foreground">-</span>
              ) : (
                detail.availableTags.map((tag) => {
                  const active = draft.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </fieldset>

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground md:col-span-2">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((previous) =>
                  previous
                    ? {
                        ...previous,
                        isActive: event.target.checked,
                      }
                    : previous
                )
              }
            />
            {copy.isActiveLabel}
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {saveMessage ? <p className="text-xs text-success">{saveMessage}</p> : null}
          {saveError ? <p className="text-xs text-destructive">{saveError}</p> : null}
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={async () => {
              try {
                setSaveError(null);
                setSaveMessage(null);
                await saveCustomer();
              } catch (error) {
                setSaveError(error instanceof Error ? error.message : copy.saveFailed);
              }
            }}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {copy.saveAction}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <h2 className="text-lg font-semibold text-foreground">{copy.incidentsSummaryTitle}</h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{copy.stats.late}</p>
            <p className="mt-1 font-semibold text-foreground">{detail.incidentsSummary.lateCount}</p>
          </article>
          <article className="rounded-2xl border border-border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{copy.stats.damage}</p>
            <p className="mt-1 font-semibold text-foreground">{detail.incidentsSummary.damageCount}</p>
          </article>
          <article className="rounded-2xl border border-border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{copy.stats.lost}</p>
            <p className="mt-1 font-semibold text-foreground">{detail.incidentsSummary.lostCount}</p>
          </article>
          <article className="rounded-2xl border border-border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{copy.stats.cleaning}</p>
            <p className="mt-1 font-semibold text-foreground">{detail.incidentsSummary.cleaningCount}</p>
          </article>
          <article className="rounded-2xl border border-border p-3 text-sm sm:col-span-2 lg:col-span-2">
            <p className="text-xs text-muted-foreground">{copy.stats.incidentAmount}</p>
            <p className="mt-1 font-semibold text-foreground">
              {formatMoney(detail.incidentsSummary.totalAmount, {
                locale,
                currency: "VND",
              }) || "-"}
            </p>
          </article>
        </div>
      </section>

      <DataTableShell
        locale={locale}
        title={copy.ordersHistoryTitle}
        className="rounded-3xl shadow-md"
        isEmpty={filteredOrders.length === 0}
        emptyState={copy.emptyOrders}
        toolbar={
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span>{copy.orderStatusFilter}</span>
            <select
              value={orderStatusFilter}
              onChange={(event) => {
                setOrderStatusFilter(event.target.value as typeof orderStatusFilter);
                setOrdersPage(1);
              }}
              className="h-8 rounded border border-border bg-background px-2 text-xs"
            >
              <option value="">{copy.allOrderStatuses}</option>
              {orderStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
        }
        columns={[
          { key: "code", header: copy.orderTableHeaders.code },
          { key: "status", header: copy.orderTableHeaders.status },
          { key: "period", header: copy.orderTableHeaders.period },
          { key: "total", header: copy.orderTableHeaders.total },
          { key: "deposit", header: copy.orderTableHeaders.deposit },
          { key: "createdAt", header: copy.orderTableHeaders.createdAt },
        ]}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setOrdersPage(Math.max(1, ordersPagination.page - 1))}
              disabled={ordersPagination.page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Trước" : "Prev"}
            </button>
            <span>
              {locale === "vi" ? "Trang" : "Page"} {ordersPagination.page}/
              {ordersPagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setOrdersPage(
                  Math.min(ordersPagination.totalPages, ordersPagination.page + 1)
                )
              }
              disabled={ordersPagination.page >= ordersPagination.totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {locale === "vi" ? "Sau" : "Next"}
            </button>
          </div>
        }
      >
        {ordersPagination.items.map((order) => (
          <tr
            key={order.orderId}
            className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
          >
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.orderCode}</td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              <StatusBadge kind="order" status={order.status} labels={orderStatusLabels} />
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {formatDateLabel(order.startDate, { locale })} - {formatDateLabel(order.endDate, { locale })}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {formatMoney(order.totalAmount, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {formatMoney(order.depositAmount, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3 text-xs text-muted-foreground">
              {formatDateLabel(order.createdAt.slice(0, 10), { locale })}
            </td>
          </tr>
        ))}
      </DataTableShell>
    </section>
  );
});
