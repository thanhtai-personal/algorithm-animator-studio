"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useMakeupAdminOverviewQuery } from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";
import { formatMoney } from "@/utils/format/money";

const COPY = {
  vi: {
    title: "Tổng quan makeup",
    subtitle: "KPI đơn makeup, hóa đơn nhập hàng và xu hướng doanh thu theo thời gian.",
    loading: "Đang tải tổng quan makeup...",
    loadError: "Tải dữ liệu tổng quan makeup thất bại.",
    retryAction: "Thử lại",
    granularityDay: "Theo ngày",
    granularityMonth: "Theo tháng",
    makeupOrderCount: "Số đơn makeup",
    makeupPurchaseInvoiceCount: "Số hóa đơn nhập hàng",
    revenue: "Doanh thu",
    cost: "Chi phí",
    profit: "Lợi nhuận",
    chartTitle: "Biểu đồ doanh thu/cost/profit",
    chartEmpty: "Không có dữ liệu trong khoảng thời gian đã chọn.",
  },
  en: {
    title: "Makeup overview",
    subtitle: "Track makeup orders, purchase invoices and revenue trend.",
    loading: "Loading makeup overview...",
    loadError: "Failed to load makeup overview.",
    retryAction: "Retry",
    granularityDay: "By day",
    granularityMonth: "By month",
    makeupOrderCount: "Makeup orders",
    makeupPurchaseInvoiceCount: "Purchase invoices",
    revenue: "Revenue",
    cost: "Cost",
    profit: "Profit",
    chartTitle: "Revenue/Cost/Profit trend",
    chartEmpty: "No data in selected date range.",
  },
} as const;

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useMakeupAdminOverviewPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canManage = role === "owner_admin" || role === "manager" || role === "staff";

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return toIsoDate(date);
  });
  const [endDate, setEndDate] = useState(() => toIsoDate(new Date()));
  const [granularity, setGranularity] = useState<"day" | "month">("day");

  const query = useMakeupAdminOverviewQuery(
    {
      branchId: currentBranchId,
      startDate,
      endDate,
      granularity,
    },
    canManage
  );

  const overview = makeupStore.adminOverview;
  const formatCurrency = (value: number) =>
    formatMoney(value, { locale, currency: "VND", maximumFractionDigits: 0 });

  const cards = useMemo(
    () =>
      overview
        ? [
            { key: "orders", label: copy.makeupOrderCount, value: String(overview.makeupOrderCount) },
            {
              key: "invoices",
              label: copy.makeupPurchaseInvoiceCount,
              value: String(overview.makeupPurchaseInvoiceCount),
            },
            { key: "revenue", label: copy.revenue, value: formatCurrency(overview.revenue) },
            { key: "cost", label: copy.cost, value: formatCurrency(overview.cost) },
            { key: "profit", label: copy.profit, value: formatCurrency(overview.profit) },
          ]
        : [],
    [copy.cost, copy.makeupOrderCount, copy.makeupPurchaseInvoiceCount, copy.profit, copy.revenue, formatCurrency, overview]
  );

  return {
    copy,
    canManage,
    query,
    overview,
    cards,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    granularity,
    setGranularity,
    formatCurrency,
  };
}
