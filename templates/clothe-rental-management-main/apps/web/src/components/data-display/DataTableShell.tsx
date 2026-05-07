"use client";

import React from "react";
import type { ReactNode } from "react";
import type { AppLocale } from "@/constants/locale";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TableSkeleton } from "@/components/feedback/LoadingSkeleton";
import { cn } from "@/utils/className";

export interface DataTableColumn {
  key: string;
  header: ReactNode;
  className?: string;
}

interface DataTableShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  columns: DataTableColumn[];
  children?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  loadingState?: ReactNode;
  emptyState?: ReactNode;
  pagination?: ReactNode;
  locale?: AppLocale;
  className?: string;
  tableClassName?: string;
  disableTableInnerScroll?: boolean;
}

export function DataTableShell({
  title,
  subtitle,
  toolbar,
  columns,
  children,
  isLoading,
  isEmpty,
  loadingState,
  emptyState,
  pagination,
  locale = "vi",
  className,
  tableClassName = "",
  disableTableInnerScroll = false,
}: DataTableShellProps) {
  const loadingLabel = locale === "vi" ? "Đang tải dữ liệu..." : "Loading data...";
  const emptyLabel = locale === "vi" ? "Không có dữ liệu phù hợp." : "No data found.";

  const resolvedLoadingState = (() => {
    if (loadingState === undefined) {
      return <TableSkeleton cols={Math.max(columns.length, 3)} rows={5} className="border-0" />;
    }

    if (typeof loadingState === "string") {
      return <p className="text-sm text-muted-foreground">{loadingState}</p>;
    }

    return loadingState;
  })();

  const resolvedEmptyState = (() => {
    if (emptyState === undefined) {
      return (
        <EmptyState
          title={locale === "vi" ? "Bảng dữ liệu đang trống" : "No rows yet"}
          description={emptyLabel}
          className="border-0 bg-transparent py-8"
        />
      );
    }

    if (typeof emptyState === "string") {
      return (
        <EmptyState
          title={locale === "vi" ? "Bảng dữ liệu đang trống" : "No rows yet"}
          description={emptyState || emptyLabel}
          className="border-0 bg-transparent py-8"
        />
      );
    }

    if (React.isValidElement(emptyState)) {
      return emptyState;
    }

    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  })();

  const shouldShowTable = !isLoading && !isEmpty;
  const resolvedTableWrapperClassName = disableTableInnerScroll
    ? undefined
    : "overflow-x-auto";

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}>
      {title || subtitle || toolbar ? (
        <header className="flex min-w-0 flex-col gap-3 border-b border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {toolbar ? (
            <div className="flex w-full min-w-0 items-center gap-2 md:w-auto">{toolbar}</div>
          ) : null}
        </header>
      ) : null}

      {isLoading ? (
        <div className="px-4 py-4" aria-label={loadingLabel}>
          {resolvedLoadingState}
        </div>
      ) : isEmpty ? (
        <div className="px-4 py-3">{resolvedEmptyState}</div>
      ) : (
        <div className={resolvedTableWrapperClassName}>
          <table className={cn("min-w-full border-collapse text-sm", tableClassName)}>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
                      column.className
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={cn(shouldShowTable && "[&_tr]:transition-colors [&_tr:hover]:bg-muted/20")}>
              {children}
            </tbody>
          </table>
        </div>
      )}

      {pagination ? <footer className="border-t border-border px-4 py-3">{pagination}</footer> : null}
    </section>
  );
}
