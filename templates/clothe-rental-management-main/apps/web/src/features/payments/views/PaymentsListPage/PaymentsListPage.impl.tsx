"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { ReceiptMediaPickerDrawer } from "@/components/media/ReceiptMediaPickerDrawer";
import { usePaymentsListPage } from "@/features/payments/hooks/usePaymentsListPage";
import { usePaymentAttachmentsQuery } from "@/features/payments/queries/usePaymentsQueries";
import type {
  OrderPaymentMethod,
  OrderPaymentType,
} from "@/types/ordersDomain";
import type { PaymentListItemDto } from "@/types/paymentsDomain";
import { cn } from "@/utils/className";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface PaymentsListPageProps {
  locale: AppLocale;
}

const PAYMENTS_CASHBOOK_PAGE_SIZE = 15;
const RECEIPT_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RECEIPT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const RECEIPT_MAX_FILES = 3;

interface PendingEditReceiptFile {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
}

function formatDateTimeLabel(value: string | null, locale: AppLocale): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export const PaymentsListPage = observer(function PaymentsListPage({
  locale,
}: PaymentsListPageProps) {
  const {
    copy,
    paymentTypeLabels,
    paymentMethodLabels,
    paymentStatusLabels,
    typeOptions,
    methodOptions,
    branchOptions,
    dateRange,
    setDateRange,
    typeFilter,
    setTypeFilter,
    methodFilter,
    setMethodFilter,
    branchFilterValue,
    setBranchFilter,
    resetFilters,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems,
    totals,
    dailyCashbook,
    canExport,
    canEditPayments,
    canManagePaymentStatus,
    canSelectBranch,
    updateStatusMutation,
    updatePaymentMutation,
    uploadReceiptFilesMutation,
    exportCsv,
    exportCsvMutation,
  } = usePaymentsListPage(locale);

  const [actionError, setActionError] = useState<string | null>(null);
  const [runningActionKey, setRunningActionKey] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] =
    useState<PaymentListItemDto | null>(null);
  const [editType, setEditType] =
    useState<Extract<OrderPaymentType, "FEE" | "EXPENSE">>("FEE");
  const [editMethod, setEditMethod] = useState<OrderPaymentMethod>("CASH");
  const [editAmount, setEditAmount] = useState<number | null>(null);
  const [editReason, setEditReason] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editReferenceCode, setEditReferenceCode] = useState("");
  const [editIsInitialCapital, setEditIsInitialCapital] = useState(false);
  const [editReceiptFiles, setEditReceiptFiles] = useState<PendingEditReceiptFile[]>([]);
  const [editValidationError, setEditValidationError] = useState<string | null>(
    null,
  );
  const [cashbookPage, setCashbookPage] = useState(1);
  const [attachmentPayment, setAttachmentPayment] =
    useState<PaymentListItemDto | null>(null);
  const { prompt } = useAppModal();
  const attachmentQuery = usePaymentAttachmentsQuery(attachmentPayment?.id ?? null);
  const attachmentCopy = useMemo(
    () =>
      locale === "vi"
        ? {
            action: "Chứng từ",
            title: "Ảnh chứng từ",
            loading: "Đang tải chứng từ...",
            empty: "Payment này chưa có ảnh chứng từ.",
            close: "Đóng",
          }
        : {
            action: "Receipts",
            title: "Receipt photos",
            loading: "Loading receipts...",
            empty: "This payment has no receipt photos.",
            close: "Close",
          },
    [locale],
  );
  const formatReceiptFileSize = (sizeBytes: number) =>
    `${(sizeBytes / 1024 / 1024).toFixed(2)} MB`;
  const addEditReceiptFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const selectedFiles = Array.from(fileList);
      const existingCount = editingPayment?.attachmentCount ?? 0;
      if (existingCount + editReceiptFiles.length + selectedFiles.length > RECEIPT_MAX_FILES) {
        toast.error(copy.receiptTooMany);
        return;
      }

      const accepted: PendingEditReceiptFile[] = [];
      for (const file of selectedFiles) {
        if (!RECEIPT_ALLOWED_MIME_TYPES.has(file.type)) {
          toast.error(copy.receiptInvalidType);
          continue;
        }
        if (file.size > RECEIPT_MAX_FILE_SIZE_BYTES) {
          toast.error(copy.receiptTooLarge);
          continue;
        }
        accepted.push({
          id: `${Date.now()}-${file.name}-${file.size}`,
          file,
          name: file.name,
          sizeBytes: file.size,
        });
      }

      if (accepted.length === 0) return;
      setEditReceiptFiles((current) => [...current, ...accepted]);
    },
    [
      copy.receiptInvalidType,
      copy.receiptTooLarge,
      copy.receiptTooMany,
      editReceiptFiles.length,
      editingPayment?.attachmentCount,
    ],
  );
  const removeEditReceiptFile = useCallback((id: string) => {
    setEditReceiptFiles((current) => current.filter((entry) => entry.id !== id));
  }, []);
  const cashbookPagination = useMemo(
    () =>
      paginateItems(dailyCashbook, cashbookPage, PAYMENTS_CASHBOOK_PAGE_SIZE),
    [cashbookPage, dailyCashbook],
  );

  const columns = useMemo(
    () => [
      {
        key: "createdAt",
        header: copy.tableHeaders.createdAt,
        className: "min-w-[150px]",
      },
      {
        key: "details",
        header: copy.tableHeaders.details,
        className: "min-w-[340px]",
      },
      {
        key: "status",
        header: copy.tableHeaders.status,
        className: "min-w-[140px]",
      },
      {
        key: "amount",
        header: copy.tableHeaders.amount,
        className: "min-w-[140px] text-right",
      },
      {
        key: "createdBy",
        header: copy.tableHeaders.createdBy,
        className: "min-w-[160px]",
      },
      {
        key: "reason",
        header: copy.tableHeaders.reason,
        className: "w-[240px] min-w-[240px]",
      },
      {
        key: "note",
        header: copy.tableHeaders.note,
        className: "w-[300px] min-w-[300px]",
      },
      {
        key: "actions",
        header: copy.tableHeaders.actions,
        className: "min-w-[120px]",
      },
    ],
    [copy.tableHeaders],
  );

  const openEditDrawer = useCallback(
    (item: PaymentListItemDto) => {
      if (!canEditPayments) return;

      setEditingPayment(item);
      setEditType(item.type === "EXPENSE" ? "EXPENSE" : "FEE");
      setEditMethod(item.method);
      setEditAmount(item.amount);
      setEditReason(item.reason ?? "");
      setEditNote(item.note ?? "");
      setEditReferenceCode(item.referenceCode ?? "");
      setEditIsInitialCapital(item.isInitialCapital);
      setEditReceiptFiles([]);
      setEditValidationError(null);
    },
    [canEditPayments],
  );

  const closeEditDrawer = useCallback(() => {
    setEditingPayment(null);
    setEditReceiptFiles([]);
    setEditValidationError(null);
  }, []);

  const summaryCards = useMemo(
    () => [
      {
        key: "postedCount",
        label: copy.postedCount,
        value: String(totals.postedCount),
      },
      {
        key: "grossInflow",
        label: copy.grossInflow,
        value:
          formatMoney(totals.grossInflow, { locale, currency: "VND" }) || "-",
      },
      {
        key: "grossRefund",
        label: copy.grossRefund,
        value:
          formatMoney(totals.grossRefund, { locale, currency: "VND" }) || "-",
      },
      {
        key: "netTotal",
        label: copy.netTotal,
        value: formatMoney(totals.netTotal, { locale, currency: "VND" }) || "-",
      },
    ],
    [
      copy.grossInflow,
      copy.grossRefund,
      copy.netTotal,
      copy.postedCount,
      locale,
      totals,
    ],
  );

  const rows = useMemo(
    () =>
      listItems.map((item) => {
        const canEditItem = canEditPayments && !item.orderId;
        const amountLabel =
          formatMoney(item.signedAmount, {
            locale,
            currency: "VND",
          }) || "-";

        return (
          <tr
            key={item.id}
            className={cn(
              "border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0",
              canEditItem ? "cursor-pointer" : undefined,
            )}
            onClick={() => {
              if (!canEditItem) return;
              openEditDrawer(item);
            }}
          >
            <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
              {formatDateTimeLabel(item.createdAt, locale)}
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              <div className="space-y-1">
                <p>
                  <span className="font-semibold text-foreground">
                    {copy.detailLabels.orderCode}:{" "}
                  </span>
                  {item.orderId ? (
                    <Link
                      href={`/${locale}/orders/${item.orderId}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-mono text-xs font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      {item.orderCode ?? copy.viewOrder}
                    </Link>
                  ) : (
                    copy.noOrder
                  )}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    {copy.detailLabels.customer}:{" "}
                  </span>
                  {[item.customerName ?? copy.noCustomer, item.customerPhone]
                    .filter((value): value is string => Boolean(value))
                    .join(" • ")}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    {copy.detailLabels.type}:{" "}
                  </span>
                  {paymentTypeLabels[item.type]}
                </p>
                <p>
                  <span className="font-semibold text-foreground">
                    {copy.detailLabels.method}:{" "}
                  </span>
                  {paymentMethodLabels[item.method]}
                </p>
                {item.isImportOrder || item.isInitialCapital ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.isImportOrder ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {copy.importOrderLabel}
                      </span>
                    ) : null}
                    {item.isInitialCapital ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        {copy.initialCapitalLabel}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </td>
            <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
              <StatusBadge
                kind="payment"
                status={item.status}
                labels={paymentStatusLabels}
              />
            </td>
            <td
              className={cn(
                "whitespace-nowrap px-4 py-3.5 text-right text-xs font-semibold",
                item.signedAmount < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {amountLabel}
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              {item.createdByName ?? copy.noCreator}
            </td>
            <td className="max-w-[240px] whitespace-normal break-words px-4 py-3.5 text-xs text-muted-foreground">
              {item.reason ?? item.voidReason ?? "-"}
            </td>
            <td className="max-w-[300px] whitespace-normal break-words px-4 py-3.5 text-xs text-muted-foreground">
              {item.note ?? "-"}
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                {canEditItem ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditDrawer(item);
                    }}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent"
                  >
                    {copy.editAction}
                  </button>
                ) : null}

                {canManagePaymentStatus ? (
                  <button
                    type="button"
                    disabled={
                      Boolean(runningActionKey) ||
                      updateStatusMutation.isPending
                    }
                    onClick={async (event) => {
                      event.stopPropagation();
                      try {
                        setActionError(null);
                        setRunningActionKey(item.id);

                        if (item.status === "POSTED") {
                          const reason = await prompt({
                            title: copy.voidReasonPrompt,
                          });

                          await updateStatusMutation.mutateAsync({
                            paymentId: item.id,
                            payload: {
                              status: "VOIDED",
                              voidReason: reason?.trim() ? reason : null,
                            },
                          });
                          toast.success(
                            locale === "vi"
                              ? "Đã xóa payment."
                              : "Payment deleted.",
                          );
                        } else {
                          await updateStatusMutation.mutateAsync({
                            paymentId: item.id,
                            payload: {
                              status: "POSTED",
                            },
                          });
                          toast.success(
                            locale === "vi"
                              ? "Đã khôi phục payment."
                              : "Payment restored.",
                          );
                        }
                      } catch (error) {
                        const message =
                          error instanceof Error
                            ? error.message
                            : copy.actionFailed;
                        setActionError(message);
                        toast.error(message);
                      } finally {
                        setRunningActionKey(null);
                      }
                    }}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-50"
                  >
                    {item.status === "POSTED"
                      ? copy.voidAction
                      : copy.repostAction}
                  </button>
                ) : null}

                {item.attachmentCount > 0 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAttachmentPayment(item);
                    }}
                    className="rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent"
                  >
                    {attachmentCopy.action} ({item.attachmentCount})
                  </button>
                ) : null}

                {!canEditItem &&
                !canManagePaymentStatus &&
                item.attachmentCount === 0
                  ? "-"
                  : null}
              </div>
            </td>
          </tr>
        );
      }),
    [
      attachmentCopy.action,
      canEditPayments,
      canManagePaymentStatus,
      copy.actionFailed,
      copy.editAction,
      copy.detailLabels.customer,
      copy.detailLabels.method,
      copy.detailLabels.orderCode,
      copy.detailLabels.type,
      copy.importOrderLabel,
      copy.initialCapitalLabel,
      copy.noCreator,
      copy.noCustomer,
      copy.noOrder,
      copy.repostAction,
      copy.viewOrder,
      copy.voidAction,
      copy.voidReasonPrompt,
      listItems,
      locale,
      paymentMethodLabels,
      paymentStatusLabels,
      paymentTypeLabels,
      prompt,
      openEditDrawer,
      updateStatusMutation,
      runningActionKey,
    ],
  );

  return (
    <section className="animate-fade-in space-y-5">
      <header className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.subtitle}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {copy.netTotal}:{" "}
              <span className="font-semibold text-foreground">
                {summaryCards[3]?.value}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!canExport) return;
              try {
                setActionError(null);
                await exportCsv();
                toast.success(
                  locale === "vi"
                    ? "Đã xuất CSV thành công."
                    : "CSV exported successfully.",
                );
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : copy.actionFailed;
                setActionError(message);
                toast.error(message);
              }
            }}
            disabled={!canExport || exportCsvMutation.isPending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-50 sm:w-auto"
          >
            <Download className="h-4 w-4" />
            {copy.exportAction}
          </button>
        </div>

        {!canExport ? (
          <p className="text-xs text-muted-foreground">
            {copy.exportRestricted}
          </p>
        ) : null}

        {!canManagePaymentStatus ? (
          <p className="text-xs text-muted-foreground">
            {copy.canEditStatusHint}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article
              key={card.key}
              className="rounded-2xl border border-border bg-muted/20 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1.5 text-sm font-bold text-foreground">
                {card.value}
              </p>
            </article>
          ))}
        </div>

      </header>

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}
      {!canEditPayments ? (
        <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {copy.editNotAllowedHint}
        </p>
      ) : null}

      <FilterBarShell
        locale={locale}
        onReset={resetFilters}
        resetLabel={copy.resetFilters}
        className="rounded-2xl shadow-sm"
      >
        <label className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground md:w-auto md:flex-row md:items-center">
          <span className="shrink-0">{copy.dateRangeFilterLabel}</span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(event) =>
              setDateRange({
                ...dateRange,
                startDate: event.target.value,
              })
            }
            className="h-9 w-full rounded border border-border bg-background px-2 text-xs text-foreground md:h-7 md:w-auto"
          />
          <span className="hidden md:inline">-</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(event) =>
              setDateRange({
                ...dateRange,
                endDate: event.target.value,
              })
            }
            className="h-9 w-full rounded border border-border bg-background px-2 text-xs text-foreground md:h-7 md:w-auto"
          />
        </label>

        <label className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <span className="shrink-0">{copy.typeFilterLabel}</span>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as OrderPaymentType | "")
            }
            className="min-w-0 flex-1 bg-transparent text-xs outline-none md:flex-none"
          >
            <option value="">{copy.allTypes}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {paymentTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <span className="shrink-0">{copy.methodFilterLabel}</span>
          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(event.target.value as OrderPaymentMethod | "")
            }
            className="min-w-0 flex-1 bg-transparent text-xs outline-none md:flex-none"
          >
            <option value="">{copy.allMethods}</option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabels[method]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground md:w-auto">
          <span className="shrink-0">{copy.branchFilterLabel}</span>
          <select
            value={branchFilterValue}
            disabled={!canSelectBranch}
            onChange={(event) => setBranchFilter(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none disabled:opacity-60 md:flex-none"
          >
            {branchOptions.length > 0 ? (
              branchOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))
            ) : (
              <option value="">{copy.allBranches}</option>
            )}
          </select>
        </label>
      </FilterBarShell>

      <DataTableShell
        locale={locale}
        className="rounded-3xl shadow-md"
        tableClassName="w-[1510px]"
        columns={columns}
        isLoading={listQuery.isLoading || listQuery.isFetching}
        isEmpty={
          !listQuery.isLoading &&
          !listQuery.isFetching &&
          listItems.length === 0
        }
        loadingState={copy.loading}
        emptyState={copy.empty}
        pagination={
          <div className="grid gap-2 text-xs text-muted-foreground sm:flex sm:items-center sm:justify-between">
            <p className="text-center sm:text-left">
              {copy.pageLabel} {page}/{totalPages}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {copy.prevPage}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {copy.nextPage}
              </button>
            </div>
          </div>
        }
      >
        {rows}
      </DataTableShell>

      <DrawerFormShell
        open={Boolean(editingPayment)}
        onOpenChange={(open) => {
          if (!open) closeEditDrawer();
        }}
        title={copy.editDrawerTitle}
        description={copy.editDrawerDescription}
        footer={
          <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={closeEditDrawer}
              className="min-h-10 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            >
              {copy.cancelAction}
            </button>
            <button
              type="button"
              disabled={
                !editingPayment ||
                updatePaymentMutation.isPending ||
                uploadReceiptFilesMutation.isPending
              }
              onClick={async () => {
                if (!editingPayment) return;
                if (!editAmount || editAmount <= 0) {
                  setEditValidationError(copy.amountRequired);
                  return;
                }
                if (!editReason.trim()) {
                  setEditValidationError(copy.reasonRequired);
                  return;
                }

                try {
                  setEditValidationError(null);
                  setActionError(null);
                  const receiptUploadSessionIds = editReceiptFiles.length
                    ? await uploadReceiptFilesMutation.mutateAsync({
                        branchId: editingPayment.branchId,
                        files: editReceiptFiles.map((entry) => entry.file),
                      })
                    : [];
                  await updatePaymentMutation.mutateAsync({
                    paymentId: editingPayment.id,
                    payload: {
                      type: editType,
                      method: editMethod,
                      amount: editAmount,
                      reason: editReason.trim(),
                      note: editNote.trim() ? editNote.trim() : null,
                      referenceCode: editReferenceCode.trim()
                        ? editReferenceCode.trim()
                        : null,
                      isInitialCapital: editIsInitialCapital,
                      receiptUploadSessionIds,
                    },
                  });
                  toast.success(
                    locale === "vi"
                      ? "Đã cập nhật payment."
                      : "Payment updated.",
                  );
                  closeEditDrawer();
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : copy.actionFailed;
                  setEditValidationError(message);
                  toast.error(message);
                }
              }}
              className="min-h-10 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {copy.saveAction}
            </button>
          </div>
        }
      >
        {editingPayment ? (
          <div className="space-y-4">
            {editValidationError ? (
              <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {editValidationError}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.detailLabels.type}
                </span>
                <select
                  value={editType}
                  onChange={(event) =>
                    setEditType(
                      event.target.value as Extract<
                        OrderPaymentType,
                        "FEE" | "EXPENSE"
                      >,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="FEE">{paymentTypeLabels.FEE}</option>
                  <option value="EXPENSE">{paymentTypeLabels.EXPENSE}</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {copy.detailLabels.method}
                </span>
                <select
                  value={editMethod}
                  onChange={(event) =>
                    setEditMethod(event.target.value as OrderPaymentMethod)
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                >
                  <option value="CASH">{paymentMethodLabels.CASH}</option>
                  <option value="BANK">{paymentMethodLabels.BANK}</option>
                  <option value="MOMO">{paymentMethodLabels.MOMO}</option>
                </select>
              </label>
            </div>

            <MoneyInput
              locale={locale}
              currency="VND"
              label={copy.tableHeaders.amount}
              value={editAmount}
              onValueChange={setEditAmount}
              onValidationChange={(error) => {
                if (!error) return;
                setEditValidationError(copy.amountRequired);
              }}
            />

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.tableHeaders.reason}
              </span>
              <input
                type="text"
                value={editReason}
                onChange={(event) => setEditReason(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.referenceCodeLabel}
              </span>
              <input
                type="text"
                value={editReferenceCode}
                onChange={(event) => setEditReferenceCode(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.tableHeaders.note}
              </span>
              <textarea
                rows={3}
                value={editNote}
                onChange={(event) => setEditNote(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={editIsInitialCapital}
                onChange={(event) =>
                  setEditIsInitialCapital(event.target.checked)
                }
                className="h-4 w-4 rounded border-border"
              />
              <span>{copy.initialCapitalLabel}</span>
            </label>

            <section className="space-y-3 rounded-xl border border-border bg-background p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {copy.receiptLabel}
                  </p>
                  {editingPayment.attachmentCount > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {attachmentCopy.action}: {editingPayment.attachmentCount}/{RECEIPT_MAX_FILES}
                    </p>
                  ) : null}
                </div>
                <ReceiptMediaPickerDrawer
                  title={copy.receiptPickerTitle}
                  description={copy.receiptPickerDescription}
                  triggerLabel={copy.receiptSelectAction}
                  cameraLabel={copy.receiptCameraAction}
                  uploadLabel={copy.receiptUploadAction}
                  closeLabel={copy.receiptPickerCloseAction}
                  onFilesSelected={addEditReceiptFiles}
                />
              </div>

              {editReceiptFiles.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {copy.receiptPendingLabel}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {editReceiptFiles.map((entry) => (
                      <article
                        key={entry.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{entry.name}</p>
                          <p className="text-muted-foreground">
                            {formatReceiptFileSize(entry.sizeBytes)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditReceiptFile(entry.id)}
                          className="shrink-0 rounded-lg border border-border px-2 py-1 font-semibold text-muted-foreground transition hover:bg-accent"
                        >
                          {copy.receiptRemoveAction}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </DrawerFormShell>

      <DrawerFormShell
        open={Boolean(attachmentPayment)}
        onOpenChange={(open) => {
          if (!open) setAttachmentPayment(null);
        }}
        title={attachmentCopy.title}
        description={attachmentPayment?.reason ?? attachmentPayment?.id ?? ""}
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAttachmentPayment(null)}
              className="min-h-10 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent"
            >
              {attachmentCopy.close}
            </button>
          </div>
        }
      >
        {attachmentQuery.isLoading || attachmentQuery.isFetching ? (
          <p className="text-sm text-muted-foreground">
            {attachmentCopy.loading}
          </p>
        ) : attachmentQuery.data?.attachments.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {attachmentQuery.data.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="overflow-hidden rounded-xl border border-border bg-card transition hover:bg-accent/30"
              >
                <img
                  src={attachment.signedUrl}
                  alt={attachment.originalFileName ?? attachment.id}
                  className="h-48 w-full object-cover"
                />
                <div className="space-y-1 p-2 text-xs text-muted-foreground">
                  <p className="truncate font-semibold text-foreground">
                    {attachment.originalFileName ?? attachment.id}
                  </p>
                  <p>{formatDateTimeLabel(attachment.createdAt, locale)}</p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{attachmentCopy.empty}</p>
        )}
      </DrawerFormShell>

      <section className="grid gap-3 lg:grid-cols-3">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {copy.totalsByMethod}
          </p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              {paymentMethodLabels.CASH}:{" "}
              {formatMoney(totals.byMethod.CASH, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {paymentMethodLabels.BANK}:{" "}
              {formatMoney(totals.byMethod.BANK, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {paymentMethodLabels.MOMO}:{" "}
              {formatMoney(totals.byMethod.MOMO, { locale, currency: "VND" }) ||
                "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {copy.totalsByType}
          </p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              {paymentTypeLabels.RENT}:{" "}
              {formatMoney(totals.byType.RENT, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {paymentTypeLabels.DEPOSIT}:{" "}
              {formatMoney(totals.byType.DEPOSIT, {
                locale,
                currency: "VND",
              }) || "-"}
            </p>
            <p>
              {paymentTypeLabels.FEE}:{" "}
              {formatMoney(totals.byType.FEE, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {paymentTypeLabels.REFUND}:{" "}
              {formatMoney(totals.byType.REFUND, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {paymentTypeLabels.EXPENSE}:{" "}
              {formatMoney(totals.byType.EXPENSE, {
                locale,
                currency: "VND",
              }) || "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {copy.totalsTitle}
          </p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <p>
              {copy.postedCount}: {totals.postedCount}
            </p>
            <p>
              {copy.grossInflow}:{" "}
              {formatMoney(totals.grossInflow, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p>
              {copy.grossRefund}:{" "}
              {formatMoney(totals.grossRefund, { locale, currency: "VND" }) ||
                "-"}
            </p>
            <p className="font-semibold text-foreground">
              {copy.netTotal}:{" "}
              {formatMoney(totals.netTotal, { locale, currency: "VND" }) || "-"}
            </p>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">
          {copy.cashbookTitle}
        </h2>

        {dailyCashbook.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {copy.cashbookEmpty}
          </p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">{copy.cashbookDate}</th>
                    <th className="px-3 py-2">{paymentMethodLabels.CASH}</th>
                    <th className="px-3 py-2">{paymentMethodLabels.BANK}</th>
                    <th className="px-3 py-2">{paymentMethodLabels.MOMO}</th>
                    <th className="px-3 py-2">{copy.grossInflow}</th>
                    <th className="px-3 py-2">{copy.grossRefund}</th>
                    <th className="px-3 py-2">{copy.netTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {cashbookPagination.items.map((row) => (
                    <tr
                      key={row.date}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {row.date}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatMoney(row.byMethod.CASH, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatMoney(row.byMethod.BANK, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatMoney(row.byMethod.MOMO, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatMoney(row.grossInflow, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatMoney(row.grossRefund, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-foreground">
                        {formatMoney(row.netTotal, {
                          locale,
                          currency: "VND",
                        }) || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:flex sm:items-center sm:justify-end">
              <button
                type="button"
                disabled={cashbookPagination.page <= 1}
                onClick={() =>
                  setCashbookPage(Math.max(1, cashbookPagination.page - 1))
                }
                className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {copy.prevPage}
              </button>
              <span className="order-first text-center sm:order-none">
                {copy.pageLabel} {cashbookPagination.page}/
                {cashbookPagination.totalPages}
              </span>
              <button
                type="button"
                disabled={
                  cashbookPagination.page >= cashbookPagination.totalPages
                }
                onClick={() =>
                  setCashbookPage(
                    Math.min(
                      cashbookPagination.totalPages,
                      cashbookPagination.page + 1,
                    ),
                  )
                }
                className="min-h-9 rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {copy.nextPage}
              </button>
            </div>
          </>
        )}
      </section>
    </section>
  );
});
