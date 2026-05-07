"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { OrderWizardPage } from "@/features/orders/components/OrderWizardPage";
import { ReturnOrderModal } from "@/features/orders/components/ReturnOrderModal";
import { useOrdersListPage } from "@/features/orders/hooks/useOrdersListPage";
import type { OrderStatus } from "@/types/domainPrimitives";
import { cn } from "@/utils/className";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";

interface OrdersListPageProps {
  locale: AppLocale;
}

const PRE_PICKUP_EDITABLE_SET = new Set<OrderStatus>(["DRAFT", "RESERVED"]);
const QUICK_CANCEL_SET = new Set<OrderStatus>(["DRAFT", "RESERVED", "CONFIRMED"]);
const SALE_SOFT_DELETE_SET = new Set<OrderStatus>(["DRAFT", "CONFIRMED", "DEBT", "COMPLETED"]);
const EXCLUDED_SUMMARY_STATUSES = new Set<OrderStatus>(["CANCELLED"]);

type OrderActionKind = "neutral" | "primary" | "danger";

function resolveOrderActionClassName(kind: OrderActionKind): string {
  if (kind === "primary") {
    return "rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50";
  }

  if (kind === "danger") {
    return "rounded-xl border border-destructive/40 bg-destructive/5 px-2.5 py-1.5 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50";
  }

  return "rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-50";
}

export const OrdersListPage = observer(function OrdersListPage({
  locale,
}: OrdersListPageProps) {
  const {
    copy,
    statusLabels,
    statusOptions,
    paymentStatusOptions,
    searchInput,
    setSearchInput,
    selectedStatuses,
    toggleStatus,
    dateRange,
    setDateRange,
    staffFilter,
    setStaffFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    resetFilters,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems,
    runQuickTransition,
    runQuickPickup,
    runQuickCancel,
    canCancelAny,
  } = useOrdersListPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraftVersion, setCreateDraftVersion] = useState(0);
  const [createReturnOpen, setCreateReturnOpen] = useState(false);
  const { confirm, prompt } = useAppModal();

  const summaryCards = useMemo(() => {
    let totalAmount = 0;
    let outstandingAmount = 0;
    let activeRentals = 0;
    let waitingPickup = 0;

    for (const order of listItems) {
      if (!EXCLUDED_SUMMARY_STATUSES.has(order.status)) {
        totalAmount += order.money.totalAmount;
        outstandingAmount += order.money.outstandingAmount;
      }

      if (order.orderType === "RENTAL" && order.status === "PICKED_UP") {
        activeRentals += 1;
      }

      if (order.orderType === "RENTAL" && order.status === "CONFIRMED") {
        waitingPickup += 1;
      }
    }

    return [
      {
        key: "visible",
        label: locale === "vi" ? "Đơn hiển thị" : "Visible orders",
        value: String(listItems.length),
      },
      {
        key: "active",
        label: locale === "vi" ? "Đang thuê" : "On rent",
        value: String(activeRentals),
      },
      {
        key: "pickup",
        label: locale === "vi" ? "Chờ nhận đồ" : "Awaiting pickup",
        value: String(waitingPickup),
      },
      {
        key: "outstanding",
        label: locale === "vi" ? "Còn thiếu" : "Outstanding",
        value: formatMoney(outstandingAmount, { locale, currency: "VND" }) || "-",
      },
      {
        key: "total",
        label: locale === "vi" ? "Tổng tiền thuê" : "Total rental value",
        value: formatMoney(totalAmount, { locale, currency: "VND" }) || "-",
      },
    ];
  }, [listItems, locale]);

  const tableRows = useMemo(
    () =>
      listItems.map((order) => {
        const isSaleOrder = order.orderType === "SALE";
        const statusLabelsForOrder =
          isSaleOrder && order.status === "CANCELLED"
            ? {
                ...statusLabels,
                CANCELLED: locale === "vi" ? "Đã xóa" : "Deleted",
              }
            : statusLabels;
        const canEdit = PRE_PICKUP_EDITABLE_SET.has(order.status);
        const canConfirm = order.status === "DRAFT" || order.status === "RESERVED";
        const canPickup =
          order.orderType === "RENTAL" &&
          (order.status === "RESERVED" || order.status === "CONFIRMED");
        const rentOutstanding = Math.max(0, order.money.rentAmount - order.money.rentPaid);
        const canCancel =
          canCancelAny &&
          (isSaleOrder
            ? SALE_SOFT_DELETE_SET.has(order.status)
            : QUICK_CANCEL_SET.has(order.status));

        return (
          <tr
            key={order.id}
            className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
          >
            <td className="px-4 py-3.5">
              <Link
                href={`/${locale}/orders/${order.id}`}
                className="font-mono text-xs font-semibold text-foreground underline-offset-2 hover:underline"
              >
                {order.orderCode}
              </Link>
            </td>
            <td className="px-4 py-3.5">
              <p className="text-sm font-semibold text-foreground">{order.customer.fullName || copy.noCustomer}</p>
              <p className="text-xs text-muted-foreground">{order.customer.phone ?? "-"}</p>
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              <p>
                {order.orderType === "SALE"
                  ? "-"
                  : `${formatDateLabel(order.startDate, { locale })} - ${formatDateLabel(order.endDate, { locale })}`}
              </p>
            </td>
            <td className="px-4 py-3.5">
              <StatusBadge kind="order" status={order.status} labels={statusLabelsForOrder} />
            </td>
            <td className="px-4 py-3.5 text-right text-xs font-medium text-foreground">
              {formatMoney(order.money.totalAmount, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3.5 text-right text-xs text-muted-foreground">
              {formatMoney(order.money.depositAmount, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3.5 text-right text-xs font-medium text-warning">
              {formatMoney(order.money.outstandingAmount, { locale, currency: "VND" }) || "-"}
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              {formatDateLabel(new Date(order.updatedAt), { locale })}
            </td>
            <td className="px-4 py-3.5">
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={`/${locale}/orders/${order.id}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent"
                  aria-label={copy.viewDetail}
                  title={copy.viewDetail}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{copy.viewDetail}</span>
                </Link>

                {canEdit ? (
                  <Link
                    href={`/${locale}/orders/${order.id}/edit`}
                    className={resolveOrderActionClassName("neutral")}
                  >
                    {copy.editAction}
                  </Link>
                ) : null}

                {canConfirm ? (
                  <button
                    type="button"
                    disabled={Boolean(runningActionKey)}
                    onClick={async () => {
                      try {
                        setActionError(null);
                        setRunningActionKey(`${order.id}:confirm`);
                        await runQuickTransition(order.id, { toStatus: "CONFIRMED" });
                        toast.success(
                          locale === "vi"
                            ? `Đơn ${order.orderCode} đã được xác nhận.`
                            : `Order ${order.orderCode} confirmed.`
                        );
                      } catch (error) {
                        const message = error instanceof Error ? error.message : copy.actionFailed;
                        setActionError(message);
                        toast.error(message);
                      } finally {
                        setRunningActionKey(null);
                      }
                    }}
                    className={resolveOrderActionClassName("primary")}
                  >
                    {copy.confirmAction}
                  </button>
                ) : null}

                {canPickup ? (
                  <button
                    type="button"
                    disabled={Boolean(runningActionKey)}
                    onClick={async () => {
                      try {
                        setActionError(null);
                        setRunningActionKey(`${order.id}:pickup`);
                        await runQuickPickup(order.id, true, rentOutstanding);
                        toast.success(
                          locale === "vi"
                            ? `Đơn ${order.orderCode} đã chuyển sang đang thuê.`
                            : `Order ${order.orderCode} marked as picked up.`
                        );
                      } catch (error) {
                        let message = error instanceof Error ? error.message : copy.actionFailed;
                        if (error instanceof Error && error.message.startsWith("PICKUP_NOT_ALLOWED")) {
                          const reason = error.message.split(":")[1] ?? "";
                          if (reason === "deposit-not-fully-paid") {
                            const depositPaidLabel =
                              formatMoney(order.money.depositPaid, { locale, currency: "VND" }) ||
                              String(order.money.depositPaid);
                            const depositRequiredLabel =
                              formatMoney(order.money.depositAmount, {
                                locale,
                                currency: "VND",
                              }) || String(order.money.depositAmount);
                            message =
                              locale === "vi"
                                ? `Không thể nhận đồ vì chưa thu đủ cọc (${depositPaidLabel}/${depositRequiredLabel}).`
                                : `Pickup is blocked because deposit is not fully paid (${depositPaidLabel}/${depositRequiredLabel}).`;
                          } else if (reason === "invalid-status-for-pickup") {
                            message =
                              locale === "vi"
                                ? "Không thể nhận đồ vì đơn chưa ở trạng thái hẹn ngày thuê hoặc đã xác nhận."
                                : "Pickup is blocked because the order is not scheduled or confirmed.";
                          } else if (reason === "rent-payment-required") {
                            message =
                              locale === "vi"
                                ? "Không thể nhận đồ vì chưa ghi nhận tiền thuê."
                                : "Pickup is blocked because rent payment is missing.";
                          } else if (reason === "pickup-only-supported-for-rental") {
                            message =
                              locale === "vi"
                                ? "Chỉ đơn thuê mới hỗ trợ thao tác nhận đồ."
                                : "Pickup is only supported for rental orders.";
                          } else {
                            message =
                              locale === "vi"
                                ? "Không thể nhận đồ ở trạng thái hiện tại. Vui lòng kiểm tra điều kiện cọc và trạng thái đơn."
                                : "Pickup is not allowed in the current state. Please check deposit and order conditions.";
                          }
                        }
                        setActionError(message);
                        toast.error(message);
                      } finally {
                        setRunningActionKey(null);
                      }
                    }}
                    className={resolveOrderActionClassName("primary")}
                  >
                    {copy.pickupAction}
                  </button>
                ) : null}

                {canCancel ? (
                  <button
                    type="button"
                    disabled={Boolean(runningActionKey)}
                    onClick={async () => {
                      const accepted = await confirm({
                        title:
                          isSaleOrder
                            ? locale === "vi"
                              ? "Bạn có chắc muốn xóa đơn bán này?"
                              : "Are you sure you want to delete this sale order?"
                            : copy.cancelConfirm,
                        tone: "danger",
                      });
                      if (!accepted) return;

                      const reason = await prompt({
                        title:
                          isSaleOrder
                            ? locale === "vi"
                              ? "Nhập lý do xóa (tùy chọn)"
                              : "Enter delete reason (optional)"
                            : copy.cancelReasonPrompt,
                      });

                      try {
                        setActionError(null);
                        setRunningActionKey(`${order.id}:cancel`);
                        await runQuickCancel(order.id, reason?.trim() ? reason : null);
                        toast.success(
                          locale === "vi"
                            ? isSaleOrder
                              ? `Đơn ${order.orderCode} đã được xóa.`
                              : `Đơn ${order.orderCode} đã được hủy.`
                            : isSaleOrder
                              ? `Order ${order.orderCode} has been deleted.`
                              : `Order ${order.orderCode} has been cancelled.`
                        );
                      } catch (error) {
                        const message = error instanceof Error ? error.message : copy.actionFailed;
                        setActionError(message);
                        toast.error(message);
                      } finally {
                        setRunningActionKey(null);
                      }
                    }}
                    className={resolveOrderActionClassName("danger")}
                  >
                    {isSaleOrder ? (locale === "vi" ? "Xóa đơn" : "Delete") : copy.cancelAction}
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        );
      }),
    [
      canCancelAny,
      copy.actionFailed,
      copy.cancelAction,
      copy.cancelConfirm,
      copy.cancelReasonPrompt,
      copy.confirmAction,
      copy.editAction,
      copy.noCustomer,
      copy.pickupAction,
      copy.viewDetail,
      listItems,
      locale,
      confirm,
      prompt,
      runQuickCancel,
      runQuickPickup,
      runQuickTransition,
      runningActionKey,
      statusLabels,
    ]
  );

  const closeCreatePanelAndDiscardDraft = () => {
    setCreateOpen(false);
    setCreateDraftVersion((previous) => previous + 1);
  };

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/orders/debt`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
            >
              {copy.debtOrdersAction}
            </Link>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm"
            >
              {copy.createAction}
            </button>
            <button
              type="button"
              onClick={() => setCreateReturnOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
            >
              {copy.createReturnAction}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card, index) => (
            <article
              key={card.key}
              className={cn(
                "rounded-2xl border border-border bg-muted/20 p-3",
                index === summaryCards.length - 1 ? "sm:col-span-2 xl:col-span-1" : ""
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1.5 text-sm font-bold text-foreground">{card.value}</p>
            </article>
          ))}
        </div>
      </header>

      <FilterBarShell
        locale={locale}
        onReset={resetFilters}
        resetLabel={copy.resetFilters}
        className="rounded-2xl shadow-sm"
      >
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
          />
        </div>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.dateRangeFilterLabel}</span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(event) =>
              setDateRange({
                ...dateRange,
                startDate: event.target.value,
              })
            }
            className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground"
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(event) =>
              setDateRange({
                ...dateRange,
                endDate: event.target.value,
              })
            }
            className="h-7 rounded border border-border bg-background px-2 text-xs text-foreground"
          />
        </label>

        <div className="inline-flex items-center gap-1 rounded-xl border border-border px-2 py-1.5">
          <span className="px-1 text-xs text-muted-foreground">{copy.statusFilterLabel}</span>
          {statusOptions.map((option) => {
            const active = selectedStatuses.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleStatus(option.value)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.staffFilterLabel}</span>
          <select
            value={staffFilter}
            onChange={(event) => setStaffFilter(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.staffFilterPlaceholder}</option>
          </select>
        </label>

        <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
          <span>{copy.paymentFilterLabel}</span>
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value)}
            className="bg-transparent text-xs outline-none"
          >
            <option value="">{copy.paymentFilterPlaceholder}</option>
            {paymentStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </FilterBarShell>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      {runningActionKey ? (
        <p className="text-xs text-muted-foreground">{copy.quickActionRunning}</p>
      ) : null}

      <DataTableShell
        locale={locale}
        title={copy.title}
        subtitle={copy.subtitle}
        className="rounded-3xl shadow-md"
        isLoading={listQuery.isFetching && listItems.length === 0}
        isEmpty={!listQuery.isFetching && listItems.length === 0}
        loadingState={copy.loading}
        emptyState={copy.empty}
        columns={[
          { key: "orderCode", header: copy.tableHeaders.orderCode },
          { key: "customer", header: copy.tableHeaders.customer },
          { key: "period", header: copy.tableHeaders.period },
          { key: "status", header: copy.tableHeaders.status },
          { key: "total", header: copy.tableHeaders.total, className: "text-right" },
          { key: "deposit", header: copy.tableHeaders.deposit, className: "text-right" },
          { key: "balance", header: copy.tableHeaders.balance, className: "text-right" },
          { key: "updatedAt", header: copy.tableHeaders.updatedAt },
          { key: "actions", header: copy.tableHeaders.actions },
        ]}
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.prevPage}
            </button>
            <span>
              {copy.pageLabel} {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.nextPage}
            </button>
          </div>
        }
      >
        {tableRows}
      </DataTableShell>

      <DrawerFormShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={copy.createPanelTitle}
        description={copy.createPanelDescription}
        widthClassName="max-w-[1200px]"
        persistOnClose
        headerActions={
          <button
            type="button"
            onClick={closeCreatePanelAndDiscardDraft}
            className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {copy.createPanelCancelAction}
          </button>
        }
      >
        <OrderWizardPage
          key={`create-order-wizard-${createDraftVersion}`}
          locale={locale}
          mode="create"
          variant="modal"
          onSubmitted={() => {
            setCreateOpen(false);
            setCreateDraftVersion((previous) => previous + 1);
          }}
        />
      </DrawerFormShell>

      <ReturnOrderModal
        locale={locale}
        open={createReturnOpen}
        onOpenChange={setCreateReturnOpen}
      />
    </section>
  );
});
