"use client";

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { useProcurementPage } from "@/features/procurement/hooks/useProcurementPage";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface ProcurementPageProps {
  locale: AppLocale;
}

const IMPORT_ERRORS_PAGE_SIZE = 20;
const IMPORT_NORMALIZED_ROWS_PAGE_SIZE = 20;
const IMPORT_INCOMPLETE_ROWS_PAGE_SIZE = 20;
const PRODUCT_OPTIONS_PAGE_SIZE = 20;
const RECEIPT_DETAIL_LINES_PAGE_SIZE = 20;

function formatDateTimeLabel(value: string, locale: AppLocale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export const ProcurementPage = observer(function ProcurementPage({ locale }: ProcurementPageProps) {
  const model = useProcurementPage(locale);
  const { confirm, prompt } = useAppModal();
  const [importErrorsPage, setImportErrorsPage] = useState(1);
  const [importNormalizedRowsPage, setImportNormalizedRowsPage] = useState(1);
  const [importIncompleteRowsPage, setImportIncompleteRowsPage] = useState(1);
  const [productOptionsPage, setProductOptionsPage] = useState(1);
  const [receiptDetailLinesPage, setReceiptDetailLinesPage] = useState(1);
  const pageLabel = locale === "vi" ? "Trang" : "Page";
  const detailCopy = {
    title: locale === "vi" ? "Chi tiết phiếu nhập" : "Receipt detail",
    subtitle:
      locale === "vi"
        ? "Nội dung phiếu nhập theo từng dòng (dạng bảng như file Excel)."
        : "Receipt rows in an Excel-like table format.",
    receiptCode: locale === "vi" ? "Mã phiếu" : "Receipt code",
    supplier: locale === "vi" ? "Nhà cung cấp" : "Supplier",
    createdAt: locale === "vi" ? "Ngày tạo" : "Created at",
    itemRows: locale === "vi" ? "Dòng hàng" : "Rows",
    emptyLines: locale === "vi" ? "Phiếu nhập chưa có dòng chi tiết." : "No line items in this receipt.",
    loadFailed:
      locale === "vi" ? "Không tải được chi tiết phiếu nhập." : "Unable to load receipt detail.",
    close: locale === "vi" ? "Đóng" : "Close",
  } as const;
  const validationErrorsPagination = useMemo(
    () =>
      paginateItems(
        model.lastImportValidation?.errors ?? [],
        importErrorsPage,
        IMPORT_ERRORS_PAGE_SIZE
      ),
    [importErrorsPage, model.lastImportValidation?.errors]
  );
  const normalizedRowsPagination = useMemo(
    () =>
      paginateItems(
        model.lastImportValidation?.normalizedRows ?? [],
        importNormalizedRowsPage,
        IMPORT_NORMALIZED_ROWS_PAGE_SIZE
      ),
    [importNormalizedRowsPage, model.lastImportValidation?.normalizedRows]
  );
  const incompleteRowsPagination = useMemo(
    () =>
      paginateItems(
        model.lastImportCommitResult?.incompleteRows ?? [],
        importIncompleteRowsPage,
        IMPORT_INCOMPLETE_ROWS_PAGE_SIZE
      ),
    [importIncompleteRowsPage, model.lastImportCommitResult?.incompleteRows]
  );
  const productOptionsPagination = useMemo(
    () => paginateItems(model.productOptions, productOptionsPage, PRODUCT_OPTIONS_PAGE_SIZE),
    [model.productOptions, productOptionsPage]
  );
  const receiptDetailLinesPagination = useMemo(
    () =>
      paginateItems(
        model.receiptDetailQuery.data?.lines ?? [],
        receiptDetailLinesPage,
        RECEIPT_DETAIL_LINES_PAGE_SIZE
      ),
    [model.receiptDetailQuery.data?.lines, receiptDetailLinesPage]
  );
  const detailLineRowOffset =
    (receiptDetailLinesPagination.page - 1) * receiptDetailLinesPagination.pageSize;
  const isEditingReceiptDetail = Boolean(
    model.isEditingReceipt &&
      model.selectedHistoryReceiptId &&
      model.selectedHistoryReceiptId === model.editingReceiptId
  );

  useEffect(() => {
    setReceiptDetailLinesPage(1);
  }, [model.selectedHistoryReceiptId]);

  if (!model.currentBranchId) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">{model.copy.branchMissing}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">{model.copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{model.copy.subtitle}</p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{model.copy.sectionImport}</h2>
          <button
            type="button"
            disabled={model.exportTemplateMutation.isPending}
            onClick={async () => {
              try {
                await model.exportTemplate();
                toast.success(locale === "vi" ? "Đã tải template .xlsx." : "Template downloaded.");
              } catch (error) {
                const message = error instanceof Error ? error.message : model.copy.errors.templateExportFailed;
                toast.error(message);
              }
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
          >
            {model.copy.downloadTemplateAction}
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{model.copy.importHint}</p>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fields.importBranch}
            </span>
            <select
              value={model.importBranchId ?? ""}
              onChange={(event) => model.onImportBranchChange(event.target.value || null)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {model.branchAccess.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName ?? branch.branchId}
                </option>
              ))}
            </select>
          </label>

	          <div className="min-w-0 space-y-1">
	            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
	              {model.copy.fields.defaultIsRentable}
	            </span>
	            <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm">
	              <input
	                type="checkbox"
	                checked={model.defaultIsRentableFlag === "TRUE"}
	                onChange={(event) =>
	                  model.setDefaultIsRentableFlag(event.target.checked ? "TRUE" : "FALSE")
	                }
	                className="h-4 w-4 rounded border-border"
	              />
	              <span>
	                {model.defaultIsRentableFlag === "TRUE"
	                  ? model.copy.booleanSelect.yes
	                  : model.copy.booleanSelect.no}
	              </span>
	            </label>
	          </div>

	          <div className="min-w-0 space-y-1">
	            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
	              {model.copy.fields.defaultIsSaleable}
	            </span>
	            <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm">
	              <input
	                type="checkbox"
	                checked={model.defaultIsSaleableFlag === "TRUE"}
	                onChange={(event) =>
	                  model.setDefaultIsSaleableFlag(event.target.checked ? "TRUE" : "FALSE")
	                }
	                className="h-4 w-4 rounded border-border"
	              />
	              <span>
	                {model.defaultIsSaleableFlag === "TRUE"
	                  ? model.copy.booleanSelect.yes
	                  : model.copy.booleanSelect.no}
	              </span>
	            </label>
	          </div>
        </div>

        <datalist id="procurement-default-categories">
          {model.categoryOptions.map((category) => (
            <option key={category.id} value={`${category.code} - ${category.name}`} />
          ))}
        </datalist>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr,auto,auto] md:items-end">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {model.copy.fields.fileUpload}
            </span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void model.onImportFileSelected(file);
              }}
              className="block w-full text-xs"
            />
            {model.importFileName ? (
              <p className="text-xs text-muted-foreground">{model.importFileName}</p>
            ) : null}
          </label>

          <button
            type="button"
            disabled={model.validateImportMutation.isPending}
            onClick={async () => {
              try {
                await model.validateImport();
                toast.success(locale === "vi" ? "Validate file thành công." : "Import file validated.");
              } catch (error) {
                const message = model.resolveActionErrorMessage(
                  error,
                  model.copy.errors.fileRequired
                );
                toast.error(message);
              }
            }}
            className="h-10 rounded-lg border border-border px-3 text-xs font-semibold"
          >
            {model.validateImportMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {model.copy.validatingAction ?? model.copy.validateImportAction}
              </span>
            ) : (
              model.copy.validateImportAction
            )}
          </button>

          <button
            type="button"
            disabled={model.commitImportMutation.isPending}
            onClick={async () => {
              try {
                const result = await model.commitImport();
                toast.success(locale === "vi" ? "Commit import thành công." : "Import committed.");

                const receiptId = result.receipt?.summary.id ?? null;
                if (receiptId) {
                  try {
                    await model.startEditingReceipt(receiptId);
                  } catch (openEditError) {
                    const message = model.resolveActionErrorMessage(
                      openEditError,
                      locale === "vi"
                        ? "Không mở được form sửa phiếu nhập vừa tạo."
                        : "Unable to open edit form for the new receipt."
                    );
                    toast.error(message);
                  }
                }
              } catch (error) {
                const message = model.resolveActionErrorMessage(
                  error,
                  model.copy.errors.importCommitFailed
                );
                toast.error(message);
              }
            }}
            className="h-10 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            {model.commitImportMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {model.copy.committingAction ?? model.copy.commitImportAction}
              </span>
            ) : (
              model.copy.commitImportAction
            )}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {!model.lastImportValidation ? (
            <p className="text-xs text-muted-foreground">{model.copy.emptyValidation}</p>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                {model.copy.summary.totalRows}: {model.lastImportValidation.summary.totalRows} |{" "}
                {model.copy.summary.validRows}: {model.lastImportValidation.summary.validRows} |{" "}
                {model.copy.summary.invalidRows}: {model.lastImportValidation.summary.invalidRows}
              </div>

              {model.lastImportValidation.errors.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl border border-destructive/30">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-destructive/30 bg-destructive/5 text-left text-destructive">
                          <th className="px-3 py-2">{model.copy.table.sheet}</th>
                          <th className="px-3 py-2">{model.copy.table.row}</th>
                          <th className="px-3 py-2">{model.copy.table.column}</th>
                          <th className="px-3 py-2">{model.copy.table.code}</th>
                          <th className="px-3 py-2">{model.copy.table.message}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationErrorsPagination.items.map((error) => (
                          <tr key={`${error.sheetName}-${error.rowNumber}-${error.column}-${error.code}`} className="border-b border-destructive/20 last:border-0">
                            <td className="px-3 py-2">{error.sheetName}</td>
                            <td className="px-3 py-2">{error.rowNumber}</td>
                            <td className="px-3 py-2">{error.column}</td>
                            <td className="px-3 py-2">{error.code}</td>
                            <td className="px-3 py-2">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      disabled={validationErrorsPagination.page <= 1}
                      onClick={() =>
                        setImportErrorsPage(Math.max(1, validationErrorsPagination.page - 1))
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.prev}
                    </button>
                    <span>
                      {pageLabel} {validationErrorsPagination.page}/{validationErrorsPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={validationErrorsPagination.page >= validationErrorsPagination.totalPages}
                      onClick={() =>
                        setImportErrorsPage(
                          Math.min(
                            validationErrorsPagination.totalPages,
                            validationErrorsPagination.page + 1
                          )
                        )
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.next}
                    </button>
                  </div>
                </>
              ) : null}

              {model.lastImportValidation.normalizedRows.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                          <th className="px-3 py-2">{model.copy.table.sheet}</th>
                          <th className="px-3 py-2">{model.copy.table.row}</th>
                          <th className="px-3 py-2">{model.copy.table.action}</th>
                          <th className="px-3 py-2">{model.copy.fields.productCode}</th>
                          <th className="px-3 py-2">{model.copy.fields.productName}</th>
                          <th className="px-3 py-2">{model.copy.fields.quantity}</th>
                          <th className="px-3 py-2">{model.copy.fields.unitCost}</th>
                          <th className="px-3 py-2">{model.copy.fields.lineTotal}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {normalizedRowsPagination.items.map((row) => (
                          <tr key={`${row.sheetName}-${row.rowNumber}`} className="border-b border-border/70 last:border-0">
                            <td className="px-3 py-2">{row.sheetName}</td>
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">
                              {row.resolvedAction === "UPDATE_EXISTING"
                                ? model.copy.rowAction.update
                                : model.copy.rowAction.create}
                            </td>
                            <td className="px-3 py-2">{row.productCode ?? (row.willGenerateProductCode ? model.copy.rowAction.generateCode : "-")}</td>
                            <td className="px-3 py-2">{row.productName ?? "-"}</td>
                            <td className="px-3 py-2">{row.quantity}</td>
                            <td className="px-3 py-2">{formatMoney(row.unitCostAmount, { locale, currency: "VND" }) || "-"}</td>
                            <td className="px-3 py-2">{formatMoney(row.lineTotalAmount, { locale, currency: "VND" }) || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      disabled={normalizedRowsPagination.page <= 1}
                      onClick={() =>
                        setImportNormalizedRowsPage(Math.max(1, normalizedRowsPagination.page - 1))
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.prev}
                    </button>
                    <span>
                      {pageLabel} {normalizedRowsPagination.page}/{normalizedRowsPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={normalizedRowsPagination.page >= normalizedRowsPagination.totalPages}
                      onClick={() =>
                        setImportNormalizedRowsPage(
                          Math.min(normalizedRowsPagination.totalPages, normalizedRowsPagination.page + 1)
                        )
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.next}
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}

          {model.lastImportCommitResult ? (
            <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">
                {model.copy.summary.commitSummary}: {model.lastImportCommitResult.summary.totalRows} /{" "}
                {model.copy.summary.successRows} {model.lastImportCommitResult.summary.successRows} /{" "}
                {model.copy.summary.incompleteRows} {model.lastImportCommitResult.summary.incompleteRows}
              </div>

              {model.lastImportCommitResult.incompleteRows.length > 0 ? (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={model.exportIncompleteMutation.isPending}
                      onClick={async () => {
                        try {
                          await model.exportIncompleteRows();
                          toast.success(
                            locale === "vi"
                              ? "Đã export file dòng lỗi .xlsx"
                              : "Incomplete rows exported."
                          );
                        } catch (error) {
                          const message =
                            error instanceof Error ? error.message : model.copy.errors.incompleteRowsMissing;
                          toast.error(message);
                        }
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      {model.copy.exportIncompleteAction}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-destructive/20">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b border-destructive/30 bg-destructive/5 text-left text-destructive">
                          <th className="px-3 py-2">{model.copy.table.sheet}</th>
                          <th className="px-3 py-2">{model.copy.table.row}</th>
                          <th className="px-3 py-2">{model.copy.table.code}</th>
                          <th className="px-3 py-2">{model.copy.table.name}</th>
                          <th className="px-3 py-2">{model.copy.table.reason}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incompleteRowsPagination.items.map((row) => (
                          <tr key={`${row.sheetName}-${row.rowNumber}-${row.reason}`} className="border-b border-destructive/20 last:border-0">
                            <td className="px-3 py-2">{row.sheetName}</td>
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.generatedProductCode ?? row.productCode ?? "-"}</td>
                            <td className="px-3 py-2">{row.productName ?? "-"}</td>
                            <td className="px-3 py-2">{row.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <button
                      type="button"
                      disabled={incompleteRowsPagination.page <= 1}
                      onClick={() =>
                        setImportIncompleteRowsPage(Math.max(1, incompleteRowsPagination.page - 1))
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.prev}
                    </button>
                    <span>
                      {pageLabel} {incompleteRowsPagination.page}/{incompleteRowsPagination.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={incompleteRowsPagination.page >= incompleteRowsPagination.totalPages}
                      onClick={() =>
                        setImportIncompleteRowsPage(
                          Math.min(
                            incompleteRowsPagination.totalPages,
                            incompleteRowsPagination.page + 1
                          )
                        )
                      }
                      className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                    >
                      {model.copy.pagination.next}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{model.copy.sectionHistory}</h2>
          <input
            value={model.search}
            onChange={(event) => {
              model.setSearch(event.target.value);
              model.setPage(1);
            }}
            placeholder={model.copy.searchPlaceholder}
            className="h-10 w-72 rounded-lg border border-border bg-background px-3 text-sm"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">{model.copy.table.code}</th>
                <th className="px-3 py-2">{model.copy.fields.supplierName}</th>
                <th className="px-3 py-2">{model.copy.table.channel}</th>
                <th className="px-3 py-2">{model.copy.table.quantityShort}</th>
                <th className="px-3 py-2">{model.copy.table.costShort}</th>
                <th className="px-3 py-2">{model.copy.table.expenseShort}</th>
                <th className="px-3 py-2">{locale === "vi" ? "Trạng thái" : "Status"}</th>
                <th className="px-3 py-2">{model.copy.table.created}</th>
                <th className="px-3 py-2">{model.copy.table.action}</th>
              </tr>
            </thead>
            <tbody>
              {model.listItems.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-xs text-muted-foreground" colSpan={9}>
                    {model.copy.emptyHistory}
                  </td>
                </tr>
              ) : (
                model.listItems.map((entry) => (
                  <tr
                    key={entry.id}
                    className="cursor-pointer border-b border-border/70 transition-colors hover:bg-muted/20 last:border-0"
                    onClick={() => model.openHistoryReceiptDetail(entry.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        model.openHistoryReceiptDetail(entry.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      locale === "vi"
                        ? `Mở chi tiết phiếu ${entry.receiptCode}`
                        : `Open receipt ${entry.receiptCode} detail`
                    }
                  >
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{entry.receiptCode}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{entry.supplierName ?? "-"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {entry.intakeChannel === "EXCEL" ? model.copy.intakeChannel.excel : model.copy.intakeChannel.manual}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{entry.totalQuantity}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-destructive">
                      {formatMoney(entry.totalCostAmount, { locale, currency: "VND" }) || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold text-destructive">
                      {formatMoney(entry.paymentExpenseAmount, { locale, currency: "VND" }) || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {entry.isRolledBack
                        ? locale === "vi"
                          ? "Đã hoàn tác"
                          : "Rolled back"
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDateTimeLabel(entry.createdAt, locale)}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={entry.isRolledBack || model.updateMutation.isPending}
                          onClick={(event) => {
                            event.stopPropagation();
                            void model.startEditingReceipt(entry.id).catch((error) => {
                              const message = model.resolveActionErrorMessage(
                                error,
                                model.copy.errors.updateFailed
                              );
                              toast.error(message);
                            });
                          }}
                          className="rounded-lg border border-border px-2 py-1 font-semibold text-foreground disabled:opacity-50"
                        >
                          {model.copy.editAction}
                        </button>
                        <button
                          type="button"
                          disabled={entry.isRolledBack || model.rollbackMutation.isPending}
                          onClick={async (event) => {
                            event.stopPropagation();
                            const accepted = await confirm({
                              title:
                                locale === "vi"
                                  ? `Hoàn tác phiếu ${entry.receiptCode}?`
                                  : `Rollback receipt ${entry.receiptCode}?`,
                              description:
                                locale === "vi"
                                  ? "Thao tác này sẽ ngừng sử dụng các món đồ đã tạo và hủy các khoản thanh toán liên quan."
                                  : "This action will retire generated items and void linked payments.",
                              confirmText: model.copy.rollbackAction,
                              tone: "danger",
                            });
                            if (!accepted) return;

                            const reason = await prompt({
                              title:
                                locale === "vi"
                                  ? "Nhập lý do hoàn tác (không bắt buộc)"
                                  : "Provide rollback reason (optional)",
                              description:
                                locale === "vi"
                                  ? `Phiếu: ${entry.receiptCode}`
                                  : `Receipt: ${entry.receiptCode}`,
                              inputLabel: locale === "vi" ? "Lý do" : "Reason",
                              placeholder:
                                locale === "vi"
                                  ? "Ví dụ: nhập sai số lượng/giá nhập..."
                                  : "Example: incorrect quantity/purchase price...",
                              defaultValue: entry.rollbackReason ?? "",
                              confirmText: model.copy.rollbackAction,
                              tone: "danger",
                            });
                            if (reason === null) return;

                            try {
                              const result = await model.rollbackReceipt(entry.id, reason);
                              toast.success(
                                locale === "vi"
                                  ? `Đã hoàn tác ${result.receiptCode} (${result.retiredItemCount} món đồ ngừng sử dụng, ${result.voidedPaymentCount} khoản thanh toán đã hủy).`
                                  : `Rolled back ${result.receiptCode} (${result.retiredItemCount} items, ${result.voidedPaymentCount} payments voided).`
                              );
                            } catch (error) {
                              const message = model.resolveActionErrorMessage(
                                error,
                                model.copy.errors.rollbackFailed
                              );
                              toast.error(message);
                            }
                          }}
                          className="rounded-lg border border-border px-2 py-1 font-semibold text-foreground disabled:opacity-50"
                        >
                          {model.rollbackMutation.isPending
                            ? model.copy.rollingBackAction
                            : model.copy.rollbackAction}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            disabled={model.page <= 1}
            onClick={() => model.setPage(Math.max(1, model.page - 1))}
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.pagination.prev}
          </button>
          <span>
            {model.page} / {model.totalPages}
          </span>
          <button
            type="button"
            disabled={model.page >= model.totalPages}
            onClick={() => model.setPage(Math.min(model.totalPages, model.page + 1))}
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.pagination.next}
          </button>
        </div>
      </section>

      <DrawerFormShell
        open={Boolean(model.selectedHistoryReceiptId)}
        onOpenChange={(open) => {
          if (!open) {
            model.closeHistoryReceiptDetail();
          }
        }}
        title={detailCopy.title}
        description={detailCopy.subtitle}
        widthClassName="max-w-5xl"
        footer={
          <div className="flex justify-end gap-2">
            {isEditingReceiptDetail ? (
              <>
                <button
                  type="button"
                  onClick={() => model.cancelEditingReceipt()}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground"
                >
                  {model.copy.cancelEditAction}
                </button>
                <button
                  type="button"
                  disabled={model.updateMutation.isPending}
                  onClick={async () => {
                    try {
                      await model.saveReceiptEdit();
                      toast.success(
                        locale === "vi"
                          ? "Đã cập nhật phiếu nhập."
                          : "Receipt updated."
                      );
                    } catch (error) {
                      const message = model.resolveActionErrorMessage(
                        error,
                        model.copy.errors.updateFailed
                      );
                      toast.error(message);
                    }
                  }}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {model.updateMutation.isPending
                    ? model.copy.savingEditAction
                    : model.copy.saveEditAction}
                </button>
              </>
            ) : null}
            {model.selectedHistoryReceiptId ? (
              <button
                type="button"
                disabled={
                  model.createProductsMutation.isPending ||
                  model.updateMutation.isPending ||
                  Boolean(model.receiptDetailQuery.data?.summary.isRolledBack)
                }
                onClick={async () => {
                  if (!model.selectedHistoryReceiptId) return;
                  try {
                    if (isEditingReceiptDetail) {
                      await model.saveReceiptEdit();
                    }

                    const result = await model.createProductsFromReceipt(
                      model.selectedHistoryReceiptId
                    );
                    toast.success(
                      locale === "vi"
                        ? `Đã tạo/link ${result.createdProductCount + result.linkedExistingProductCount} sản phẩm và ${result.createdItemCount} món đồ.`
                        : `Created/linked ${result.createdProductCount + result.linkedExistingProductCount} products and ${result.createdItemCount} items.`
                    );
                  } catch (error) {
                    const message = model.resolveActionErrorMessage(
                      error,
                      model.copy.errors.createProductsFailed
                    );
                    toast.error(message);
                  }
                }}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {model.createProductsMutation.isPending
                  ? model.copy.creatingProductsAction
                  : model.copy.createProductsAction}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => model.closeHistoryReceiptDetail()}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground"
            >
              {detailCopy.close}
            </button>
          </div>
        }
      >
        {model.receiptDetailQuery.isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {locale === "vi" ? "Đang tải chi tiết..." : "Loading detail..."}
          </div>
        ) : model.receiptDetailQuery.isError ? (
          <p className="py-8 text-sm text-destructive">{detailCopy.loadFailed}</p>
        ) : model.receiptDetailQuery.data ? (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 text-xs md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {detailCopy.receiptCode}
                </p>
                <p className="mt-1 font-mono text-foreground">
                  {model.receiptDetailQuery.data.summary.receiptCode}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {detailCopy.supplier}
                </p>
                {isEditingReceiptDetail ? (
                  <input
                    value={model.editSupplierName}
                    onChange={(event) => model.setEditSupplierName(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-foreground">
                    {model.receiptDetailQuery.data.summary.supplierName ?? "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {detailCopy.createdAt}
                </p>
                <p className="mt-1 text-foreground">
                  {formatDateTimeLabel(model.receiptDetailQuery.data.summary.createdAt, locale)}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {detailCopy.itemRows}
                </p>
                <p className="mt-1 text-foreground">
                  {model.receiptDetailQuery.data.lines.length}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.fields.supplierPhone}
                </p>
                {isEditingReceiptDetail ? (
                  <input
                    value={model.editSupplierPhone}
                    onChange={(event) => model.setEditSupplierPhone(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-foreground">
                    {model.receiptDetailQuery.data.summary.supplierPhone ?? "-"}
                  </p>
                )}
              </div>
              <div className="md:col-span-2 xl:col-span-4">
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.fields.note}
                </p>
                {isEditingReceiptDetail ? (
                  <input
                    value={model.editNote}
                    onChange={(event) => model.setEditNote(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-foreground">
                    {model.receiptDetailQuery.data.summary.note ?? "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.fields.paymentAmount}
                </p>
                {isEditingReceiptDetail ? (
                  <input
                    value={model.editExpenseAmountInput}
                    onChange={(event) => model.setEditExpenseAmountInput(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-foreground">
                    {formatMoney(model.receiptDetailQuery.data.summary.paymentExpenseAmount, {
                      locale,
                      currency: "VND",
                    }) || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.fields.paymentMethod}
                </p>
                {isEditingReceiptDetail ? (
                  <select
                    value={model.editExpenseMethod}
                    onChange={(event) =>
                      model.setEditExpenseMethod(event.target.value as "CASH" | "BANK" | "MOMO")
                    }
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="CASH">{model.copy.paymentMethods.CASH}</option>
                    <option value="BANK">{model.copy.paymentMethods.BANK}</option>
                    <option value="MOMO">{model.copy.paymentMethods.MOMO}</option>
                  </select>
                ) : (
                  <p className="mt-1 text-foreground">
                    {model.receiptDetailQuery.data.summary.paymentMethod
                      ? model.copy.paymentMethods[model.receiptDetailQuery.data.summary.paymentMethod]
                      : "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  {model.copy.fields.paymentNote}
                </p>
                {isEditingReceiptDetail ? (
                  <input
                    value={model.editExpenseNote}
                    onChange={(event) => model.setEditExpenseNote(event.target.value)}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-xs text-foreground"
                  />
                ) : (
                  <p className="mt-1 text-foreground">
                    {model.receiptDetailQuery.data.summary.paymentNote ?? "-"}
                  </p>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                    <th className="px-3 py-2">{model.copy.table.row}</th>
                    <th className="px-3 py-2">{model.copy.fields.productCode}</th>
                    <th className="px-3 py-2">{model.copy.fields.productName}</th>
                    <th className="px-3 py-2">{model.copy.fields.quantity}</th>
                    <th className="px-3 py-2">{model.copy.fields.unitCost}</th>
                    <th className="px-3 py-2">{model.copy.fields.lineTotal}</th>
                    <th className="px-3 py-2">{model.copy.fields.itemSize}</th>
                    <th className="px-3 py-2">{model.copy.fields.note}</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptDetailLinesPagination.items.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-xs text-muted-foreground" colSpan={8}>
                        {detailCopy.emptyLines}
                      </td>
                    </tr>
                  ) : (
                    receiptDetailLinesPagination.items.map((line, index) => (
                      <tr key={line.id} className="border-b border-border/70 last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{detailLineRowOffset + index + 1}</td>
                        <td className="px-3 py-2 font-mono text-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.productCode ??
                                (line.productCodeSnapshot ?? "")
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { productCode: event.target.value })
                              }
                              className="h-8 w-32 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            line.productCodeSnapshot ?? "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.productName ??
                                (line.productNameSnapshot ?? "")
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { productName: event.target.value })
                              }
                              className="h-8 w-44 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            line.productNameSnapshot ?? "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.quantityInput ??
                                String(line.quantity)
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { quantityInput: event.target.value })
                              }
                              className="h-8 w-20 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            line.quantity
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.unitCostInput ??
                                String(line.unitCostAmount)
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { unitCostInput: event.target.value })
                              }
                              className="h-8 w-32 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            formatMoney(line.unitCostAmount, { locale, currency: "VND" }) || "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditingReceiptDetail
                            ? "-"
                            : formatMoney(line.lineTotalAmount, { locale, currency: "VND" }) || "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.itemSizeInput ??
                                (line.itemSize ?? "")
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { itemSizeInput: event.target.value })
                              }
                              className="h-8 w-24 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            line.itemSize ?? "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {isEditingReceiptDetail ? (
                            <input
                              value={
                                model.editLines.find((entry) => entry.id === line.id)?.noteInput ??
                                (line.note ?? "")
                              }
                              onChange={(event) =>
                                model.updateEditLine(line.id, { noteInput: event.target.value })
                              }
                              className="h-8 w-44 rounded border border-border bg-background px-2 text-xs text-foreground"
                            />
                          ) : (
                            line.note ?? "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={receiptDetailLinesPagination.page <= 1}
                onClick={() =>
                  setReceiptDetailLinesPage(Math.max(1, receiptDetailLinesPagination.page - 1))
                }
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {model.copy.pagination.prev}
              </button>
              <span>
                {pageLabel} {receiptDetailLinesPagination.page}/{receiptDetailLinesPagination.totalPages}
              </span>
              <button
                type="button"
                disabled={
                  receiptDetailLinesPagination.page >= receiptDetailLinesPagination.totalPages
                }
                onClick={() =>
                  setReceiptDetailLinesPage(
                    Math.min(
                      receiptDetailLinesPagination.totalPages,
                      receiptDetailLinesPagination.page + 1
                    )
                  )
                }
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {model.copy.pagination.next}
              </button>
            </div>
          </div>
        ) : null}
      </DrawerFormShell>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={model.productSearch}
            onChange={(event) => model.setProductSearch(event.target.value)}
            placeholder={model.copy.productSearchPlaceholder}
            className="h-10 w-72 rounded-lg border border-border bg-background px-3 text-sm"
          />
          <span className="text-xs text-muted-foreground">
            {model.copy.summary.productsCount}: {model.productOptions.length}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-3 py-2">{model.copy.table.code}</th>
                <th className="px-3 py-2">{model.copy.table.name}</th>
                <th className="px-3 py-2">{model.copy.table.stock}</th>
                <th className="px-3 py-2">{model.copy.table.purchase}</th>
              </tr>
            </thead>
            <tbody>
              {productOptionsPagination.items.map((entry) => (
                <tr key={entry.id} className="border-b border-border/70 last:border-0">
                  <td className="px-3 py-2 font-mono text-foreground">{entry.productCode}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.stockTotal}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {formatMoney(entry.purchasePrice ?? 0, { locale, currency: "VND" }) || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            disabled={productOptionsPagination.page <= 1}
            onClick={() =>
              setProductOptionsPage(Math.max(1, productOptionsPagination.page - 1))
            }
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.pagination.prev}
          </button>
          <span>
            {pageLabel} {productOptionsPagination.page}/{productOptionsPagination.totalPages}
          </span>
          <button
            type="button"
            disabled={productOptionsPagination.page >= productOptionsPagination.totalPages}
            onClick={() =>
              setProductOptionsPage(
                Math.min(productOptionsPagination.totalPages, productOptionsPagination.page + 1)
              )
            }
            className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
          >
            {model.copy.pagination.next}
          </button>
        </div>
      </section>
    </section>
  );
});
