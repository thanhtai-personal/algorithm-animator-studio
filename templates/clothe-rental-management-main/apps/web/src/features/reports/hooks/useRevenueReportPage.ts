"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { REPORTS_DEFAULT_RANGE_DAYS } from "@/features/reports/constants";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useExportRevenueCsvMutation,
  useRevenueReportQuery,
} from "@/features/reports/queries/useReportsQueries";
import { reportsStore } from "@/features/reports/stores/reportsStore";
import type { RevenueReportGranularity } from "@/types/reportsModule";

interface RevenueReportCopy {
  title: string;
  subtitle: string;
  exportAction: string;
  exportRestricted: string;
  resetFilters: string;
  dateRangeFilterLabel: string;
  branchFilterLabel: string;
  granularityFilterLabel: string;
  granularity: Record<RevenueReportGranularity, string>;
  allBranches: string;
  loading: string;
  errorFallback: string;
  retryAction: string;
  kpi: {
    revenueGross: string;
    refundEffective: string;
    revenueNet: string;
    cogs: string;
    grossProfit: string;
    profitMargin: string;
    salesProfit: string;
    realProfit: string;
    cashInflow: string;
    cashOutflow: string;
    depositCollectedTotal: string;
    depositRefundedTotal: string;
    outstandingDebt: string;
  };
  dailyTableTitle: string;
  dailyTableEmpty: string;
  topProductsTitle: string;
  topItemsTitle: string;
  topEmpty: string;
  topMetricLabel: string;
  tableHeaders: {
    date: string;
    revenueGross: string;
    refundEffective: string;
    revenueNet: string;
    cogs: string;
    grossProfit: string;
    realProfit: string;
    cashInflow: string;
    cashOutflow: string;
    product: string;
    category: string;
    itemCode: string;
    variant: string;
    bookingCount: string;
    rentalDays: string;
    rentAmount: string;
  };
}

const REVENUE_REPORT_COPY: Record<AppLocale, RevenueReportCopy> = {
  vi: {
    title: "Báo cáo doanh thu",
    subtitle:
      "Doanh thu được tính từ payment hợp lệ (POSTED), loại trừ VOIDED. Hoàn cọc không làm giảm doanh thu, chỉ hoàn thuộc doanh thu mới trừ vào net.",
    exportAction: "Export CSV",
    exportRestricted: "Chỉ Manager trở lên mới export CSV.",
    resetFilters: "Đặt lại bộ lọc",
    dateRangeFilterLabel: "Khoảng ngày",
    branchFilterLabel: "Chi nhánh",
    granularityFilterLabel: "Mức gộp",
    granularity: {
      day: "Ngày",
      month: "Tháng",
      year: "Năm",
    },
    allBranches: "Tất cả chi nhánh",
    loading: "Đang tải báo cáo doanh thu...",
    errorFallback: "Tải báo cáo doanh thu thất bại.",
    retryAction: "Thử lại",
    kpi: {
      revenueGross: "Doanh thu gộp",
      refundEffective: "Hoàn giảm doanh thu",
      revenueNet: "Doanh thu thuần",
      cogs: "Giá vốn hàng bán (COGS)",
      grossProfit: "Lợi nhuận gộp",
      profitMargin: "Biên lợi nhuận",
      salesProfit: "Lợi nhuận bán hàng",
      realProfit: "Lợi nhuận thực tế",
      cashInflow: "Tổng thu thực tế",
      cashOutflow: "Tổng chi thực tế",
      depositCollectedTotal: "Tổng cọc thu",
      depositRefundedTotal: "Tổng cọc hoàn",
      outstandingDebt: "Công nợ đang mở",
    },
    dailyTableTitle: "Bảng doanh thu theo kỳ",
    dailyTableEmpty: "Không có dữ liệu doanh thu trong khoảng đã chọn.",
    topProductsTitle: "Top sản phẩm thuê nhiều",
    topItemsTitle: "Top item thuê nhiều",
    topEmpty: "Không có dữ liệu top rentals.",
    topMetricLabel: "Metric top rentals",
    tableHeaders: {
      date: "Kỳ",
      revenueGross: "Doanh thu gộp",
      refundEffective: "Hoàn doanh thu",
      revenueNet: "Doanh thu thuần",
      cogs: "Giá vốn hàng bán (COGS)",
      grossProfit: "Lợi nhuận gộp",
      realProfit: "Lợi nhuận thực tế",
      cashInflow: "Tổng thu thực tế",
      cashOutflow: "Tổng chi thực tế",
      product: "Sản phẩm",
      category: "Danh mục",
      itemCode: "Mã item",
      variant: "Biến thể",
      bookingCount: "Số lượt thuê",
      rentalDays: "Số ngày thuê",
      rentAmount: "Doanh thu thuê",
    },
  },
  en: {
    title: "Revenue Report",
    subtitle:
      "Revenue is based on valid posted payments. Deposit refunds are tracked separately and do not reduce revenue net.",
    exportAction: "Export CSV",
    exportRestricted: "Only Manager+ can export CSV.",
    resetFilters: "Reset filters",
    dateRangeFilterLabel: "Date range",
    branchFilterLabel: "Branch",
    granularityFilterLabel: "Granularity",
    granularity: {
      day: "Day",
      month: "Month",
      year: "Year",
    },
    allBranches: "All branches",
    loading: "Loading revenue report...",
    errorFallback: "Failed to load revenue report.",
    retryAction: "Retry",
    kpi: {
      revenueGross: "Revenue gross",
      refundEffective: "Revenue refunds",
      revenueNet: "Revenue net",
      cogs: "Cost of Goods Sold (COGS)",
      grossProfit: "Gross profit",
      profitMargin: "Profit margin",
      salesProfit: "Sales profit",
      realProfit: "Real profit",
      cashInflow: "Real cash inflow",
      cashOutflow: "Real cash outflow",
      depositCollectedTotal: "Total deposit collected",
      depositRefundedTotal: "Total deposit refunded",
      outstandingDebt: "Outstanding debt",
    },
    dailyTableTitle: "Revenue time-series table",
    dailyTableEmpty: "No revenue rows in current range.",
    topProductsTitle: "Top rented products",
    topItemsTitle: "Top rented items",
    topEmpty: "No top rentals available.",
    topMetricLabel: "Top rentals metric",
    tableHeaders: {
      date: "Period",
      revenueGross: "Revenue gross",
      refundEffective: "Refund effective",
      revenueNet: "Revenue net",
      cogs: "Cost of Goods Sold (COGS)",
      grossProfit: "Gross profit",
      realProfit: "Real profit",
      cashInflow: "Real cash inflow",
      cashOutflow: "Real cash outflow",
      product: "Product",
      category: "Category",
      itemCode: "Item code",
      variant: "Variant",
      bookingCount: "Bookings",
      rentalDays: "Rental days",
      rentAmount: "Rent amount",
    },
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

function isStaffRole(role: string | null | undefined): boolean {
  return role === "staff";
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (REPORTS_DEFAULT_RANGE_DAYS - 1));

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

export function useRevenueReportPage(locale: AppLocale) {
  const copy = REVENUE_REPORT_COPY[locale];
  const { role, currentBranchId, branchAccess } = useAuthAccess();

  const [dateRange, setDateRange] = useState(createDefaultDateRange);
  const [branchFilter, setBranchFilter] = useState("");
  const [granularity, setGranularity] = useState<RevenueReportGranularity>("day");

  const canExport = isManagerPlusRole(role);
  const roleIsStaff = isStaffRole(role);

  const resolvedBranchId = roleIsStaff
    ? currentBranchId ?? null
    : branchFilter || currentBranchId || null;

  const branchFilterValue = roleIsStaff
    ? currentBranchId ?? ""
    : branchFilter || currentBranchId || "";

  const reportQuery = useRevenueReportQuery({
    branchId: resolvedBranchId,
    startDate: dateRange.startDate || null,
    endDate: dateRange.endDate || null,
    granularity,
  });

  const exportCsvMutation = useExportRevenueCsvMutation();

  const branchOptions = useMemo(
    () =>
      branchAccess.map((entry) => ({
        value: entry.branchId,
        label: entry.branchName?.trim() || entry.branchId,
      })),
    [branchAccess]
  );

  const resetFilters = () => {
    setDateRange(createDefaultDateRange());
    setBranchFilter("");
    setGranularity("day");
  };

  const exportCsv = async () => {
    const result = await exportCsvMutation.mutateAsync({
      branchId: resolvedBranchId,
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
      granularity,
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
    dateRange,
    setDateRange,
    branchFilter,
    setBranchFilter,
    granularity,
    setGranularity,
    branchFilterValue,
    branchOptions,
    resetFilters,
    canExport,
    canSelectBranch: !roleIsStaff,
    reportQuery,
    report: reportsStore.revenueReport,
    exportCsv,
    exportCsvMutation,
  };
}
