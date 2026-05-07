"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FaCloudUploadAlt } from "react-icons/fa";
import type { AppLocale } from "@/constants/locale";
import { formatMoney } from "@/utils/format/money";
import type {
  AppModalConfirm,
  ProductSelectionState,
  ProductsListPageState,
} from "./types";

interface ProductsTableRowsProps {
  locale: AppLocale;
  copy: ProductsListPageState["copy"];
  listItems: ProductsListPageState["listItems"];
  selectedProductIds: Set<string>;
  setSelectedProductIds: ProductSelectionState;
  setMediaPickerProductId: (productId: string) => void;
  setListActionError: (message: string | null) => void;
  setDeletingProductId: (productId: string | null | ((previous: string | null) => string | null)) => void;
  confirm: AppModalConfirm;
  canDeleteProduct: boolean;
  isDeleteBusy: boolean;
  deletingProductId: string | null;
  handleDeleteProduct: ProductsListPageState["handleDeleteProduct"];
  toggleRowSelection: (productId: string) => void;
  updateProductOverviewByIdMutation: ProductsListPageState["updateProductOverviewByIdMutation"];
}

export function ProductsTableRows({
  locale,
  copy,
  listItems,
  selectedProductIds,
  setSelectedProductIds,
  setMediaPickerProductId,
  setListActionError,
  setDeletingProductId,
  confirm,
  canDeleteProduct,
  isDeleteBusy,
  deletingProductId,
  handleDeleteProduct,
  toggleRowSelection,
  updateProductOverviewByIdMutation,
}: ProductsTableRowsProps) {
  return (
    <>
      {listItems.map((item) => {
        const isRowDeleting = deletingProductId === item.id;
        return (
          <tr
            key={item.id}
            className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
          >
            <td className="px-4 py-3.5">
              <input
                type="checkbox"
                aria-label={`${copy.selectAll}: ${item.name}`}
                checked={selectedProductIds.has(item.id)}
                disabled={isDeleteBusy}
                onChange={() => toggleRowSelection(item.id)}
              />
            </td>
            <td className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border bg-muted">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        {copy.noImage}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={updateProductOverviewByIdMutation.isPending}
                    onClick={() => setMediaPickerProductId(item.id)}
                    className="w-full rounded-md text-center text-[10px] font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-60"
                  >
                    <FaCloudUploadAlt className="mx-auto h-6 w-6" />
                  </button>
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{item.productCode}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3.5 text-sm text-muted-foreground">{item.categoryName ?? "-"}</td>
            <td className="px-4 py-3.5">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.length > 0 ? (
                  item.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                {locale === "vi" ? "Thuê/3 ngày: " : "Rent/3 days: "}
                {formatMoney(item.rentPricePerDay, { locale, currency: "VND" }) || "-"}
              </p>
              <p>
                {locale === "vi" ? "Thuê nhanh (24h): " : "Quick rent (24h): "}
                {formatMoney(item.quickRentPrice, { locale, currency: "VND" }) || "-"}
              </p>
              <p>
                {locale === "vi" ? "Giá cọc: " : "Deposit: "}
                {formatMoney(item.rentDepositAmount, { locale, currency: "VND" }) || "-"}
              </p>
              <p>
                {locale === "vi" ? "Giá bán: " : "Sale: "}
                {formatMoney(item.salePrice, { locale, currency: "VND" }) || "-"}
              </p>
            </td>
            <td className="px-4 py-3.5 text-xs text-muted-foreground">
              <p className="font-semibold text-success">{item.readyItems}</p>
            </td>
            <td className="px-4 py-3.5">
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/products/${item.id}`}
                  aria-label={copy.viewDetail}
                  title={copy.viewDetail}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent/70 hover:text-foreground"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{copy.viewDetail}</span>
                </Link>
                <Link
                  href={`/${locale}/products/${item.id}`}
                  aria-label={copy.editOverview}
                  title={copy.editOverview}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{copy.editOverview}</span>
                </Link>
                {canDeleteProduct ? (
                  <button
                    type="button"
                    disabled={isDeleteBusy}
                    onClick={async () => {
                      const accepted = await confirm({
                        title: copy.deleteProductConfirm,
                        tone: "danger",
                      });
                      if (!accepted) return;

                      try {
                        setDeletingProductId(item.id);
                        setListActionError(null);
                        await handleDeleteProduct(item.id);
                        setSelectedProductIds((previous) => {
                          if (!previous.has(item.id)) return previous;
                          const next = new Set(previous);
                          next.delete(item.id);
                          return next;
                        });
                        toast.success(copy.deleteSuccess);
                      } catch (error) {
                        const message =
                          error instanceof Error ? error.message : copy.deleteFailed;
                        setListActionError(message);
                        toast.error(message);
                      } finally {
                        setDeletingProductId((previous) => (previous === item.id ? null : previous));
                      }
                    }}
                    aria-label={isRowDeleting ? copy.deleteProductLoading : copy.deleteProduct}
                    title={isRowDeleting ? copy.deleteProductLoading : copy.deleteProduct}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/70 text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {isRowDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">{copy.deleteProduct}</span>
                  </button>
                ) : null}
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}
