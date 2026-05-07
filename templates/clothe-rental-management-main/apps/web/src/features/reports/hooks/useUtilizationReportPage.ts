"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useExportUtilizationCsvMutation,
  useUtilizationReportQuery,
} from "@/features/reports/queries/useReportsQueries";
import { reportsStore } from "@/features/reports/stores/reportsStore";

interface UtilizationReportCopy {
  title: string;
  subtitle: string;
  exportAction: string;
  exportRestricted: string;
  branchFilterLabel: string;
  allBranches: string;
  resetFilters: string;
  loading: string;
  errorFallback: string;
  retryAction: string;
  kpi: {
    totalActiveItems: string;
    onRentItems: string;
    utilizationRate: string;
    asOfDate: string;
  };
  categoryTitle: string;
  categoryEmpty: string;
  productTitle: string;
  productEmpty: string;
  tableHeaders: {
    category: string;
    product: string;
    totalActive: string;
    onRent: string;
    utilization: string;
  };
}

const UTILIZATION_REPORT_COPY: Record<AppLocale, UtilizationReportCopy> = {
  vi: {
    title: "Báo cáo công suất",
    subtitle: "Công thức KPI: % item ON_RENT trên tổng item active (không tính RETIRED).",
    exportAction: "Export CSV",
    exportRestricted: "Chỉ Manager trở lên mới export CSV.",
    branchFilterLabel: "Chi nhánh",
    allBranches: "Tất cả chi nhánh",
    resetFilters: "Đặt lại bộ lọc",
    loading: "Đang tải báo cáo công suất...",
    errorFallback: "Tải báo cáo công suất thất bại.",
    retryAction: "Thử lại",
    kpi: {
      totalActiveItems: "Tổng item active",
      onRentItems: "Item ON_RENT",
      utilizationRate: "% Utilization",
      asOfDate: "As of",
    },
    categoryTitle: "Theo danh mục",
    categoryEmpty: "Không có dữ liệu theo danh mục.",
    productTitle: "Theo sản phẩm",
    productEmpty: "Không có dữ liệu theo sản phẩm.",
    tableHeaders: {
      category: "Danh mục",
      product: "Sản phẩm",
      totalActive: "Active",
      onRent: "ON_RENT",
      utilization: "Utilization (%)",
    },
  },
  en: {
    title: "Utilization Report",
    subtitle: "KPI formula: % ON_RENT items over total active items (excluding RETIRED).",
    exportAction: "Export CSV",
    exportRestricted: "Only Manager+ can export CSV.",
    branchFilterLabel: "Branch",
    allBranches: "All branches",
    resetFilters: "Reset filters",
    loading: "Loading utilization report...",
    errorFallback: "Failed to load utilization report.",
    retryAction: "Retry",
    kpi: {
      totalActiveItems: "Total active items",
      onRentItems: "ON_RENT items",
      utilizationRate: "Utilization %",
      asOfDate: "As of",
    },
    categoryTitle: "By category",
    categoryEmpty: "No category rows.",
    productTitle: "By product",
    productEmpty: "No product rows.",
    tableHeaders: {
      category: "Category",
      product: "Product",
      totalActive: "Active",
      onRent: "ON_RENT",
      utilization: "Utilization (%)",
    },
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

function isStaffRole(role: string | null | undefined): boolean {
  return role === "staff";
}

export function useUtilizationReportPage(locale: AppLocale) {
  const copy = UTILIZATION_REPORT_COPY[locale];
  const { role, currentBranchId, branchAccess } = useAuthAccess();

  const [branchFilter, setBranchFilter] = useState("");

  const canExport = isManagerPlusRole(role);
  const roleIsStaff = isStaffRole(role);

  const resolvedBranchId = roleIsStaff
    ? currentBranchId ?? null
    : branchFilter || currentBranchId || null;

  const branchFilterValue = roleIsStaff
    ? currentBranchId ?? ""
    : branchFilter || currentBranchId || "";

  const reportQuery = useUtilizationReportQuery({
    branchId: resolvedBranchId,
  });

  const exportCsvMutation = useExportUtilizationCsvMutation();

  const branchOptions = useMemo(
    () =>
      branchAccess.map((entry) => ({
        value: entry.branchId,
        label: entry.branchName?.trim() || entry.branchId,
      })),
    [branchAccess]
  );

  const resetFilters = () => {
    setBranchFilter("");
  };

  const exportCsv = async () => {
    const result = await exportCsvMutation.mutateAsync({
      branchId: resolvedBranchId,
    });

    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return {
    copy,
    branchFilter,
    setBranchFilter,
    branchFilterValue,
    branchOptions,
    resetFilters,
    canExport,
    canSelectBranch: !roleIsStaff,
    reportQuery,
    report: reportsStore.utilizationReport,
    exportCsv,
    exportCsvMutation,
  };
}
