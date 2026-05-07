"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useDashboardFinancialRevenueReportQuery,
  useDashboardOverviewQuery,
  useQuickReturnOrderMutation,
} from "@/features/dashboard/queries/useDashboardOverviewQueries";
import { dashboardStore } from "@/features/dashboard/stores/dashboardStore";
import type { DateRangeValue } from "@/types/domainPrimitives";
import type { RevenueReportGranularity } from "@/types/reportsModule";
import { buildDomainLabels } from "@/utils/domainLabels";
import { createLocaleTranslator } from "@/utils/i18nMessages";

type DashboardSummaryPreset = "day" | "week" | "month" | "custom";
const DASHBOARD_DEFAULT_SUMMARY_PRESET: Exclude<DashboardSummaryPreset, "custom"> = "week";

interface DashboardOverviewCopy {
  title: string;
  subtitle: string;
  createOrder: string;
  soldItemsBadge: string;
  financialChartTitle: string;
  financialSummaryPresetLabel: string;
  financialSummaryPreset: Record<DashboardSummaryPreset, string>;
  financialDateRangeLabel: string;
  financialGranularityLabel: string;
  financialChartEmpty: string;
  financialChartError: string;
  granularity: Record<RevenueReportGranularity, string>;
  kpi: {
    revenueToday: string;
    grossProfitToday: string;
    profitMarginToday: string;
    salesProfitToday: string;
    realProfitToday: string;
    realInflowToday: string;
      realOutflowToday: string;
      depositCollectedToday: string;
      depositRefundedToday: string;
      initialCapitalNetTotal: string;
      importOrderExpenseTotal: string;
      ordersOnRent: string;
      ordersReserved: string;
      reservedPickupToday: string;
      reservedPickupOverdue: string;
    dueToday: string;
    overdue: string;
    itemsInLaundry: string;
    outstandingDebtTotal: string;
  };
  kpiFormula: {
    revenueToday: string;
    grossProfitToday: string;
    salesProfitToday: string;
    realProfitToday: string;
    realInflowToday: string;
      realOutflowToday: string;
      depositCollectedToday: string;
      depositRefundedToday: string;
      initialCapitalNetTotal: string;
      importOrderExpenseTotal: string;
      outstandingDebtTotal: string;
  };
  moduleMetrics: {
    title: string;
    all: string;
    rentalSale: string;
    makeup: string;
    revenue: string;
    profit: string;
    orderCount: string;
  };
  todayContext: string;
  dueTodayTitle: string;
  overdueTitle: string;
  recentActivitiesTitle: string;
  tableHeaders: {
    orderCode: string;
    customer: string;
    period: string;
    status: string;
    updatedAt: string;
    actions: string;
  };
  openAction: string;
  returnAction: string;
  actionFailed: string;
  dueTodayEmpty: string;
  overdueEmpty: string;
  activitiesEmpty: string;
  loading: string;
  retryAction: string;
  errorFallback: string;
  unknownActor: string;
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDateRangeFromSummaryPreset(
  preset: Exclude<DashboardSummaryPreset, "custom">
): DateRangeValue {
  const end = new Date();
  let start = new Date(end);

  if (preset === "day") {
    start = new Date(end);
  } else if (preset === "week") {
    start.setDate(start.getDate() - 6);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
}

const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  cancel: "dashboard.activity.orderCancelled",
  create: "dashboard.activity.created",
  update: "dashboard.activity.updated",
  ITEM_STATUS_CHANGED: "dashboard.activity.itemStatusChanged",
  ORDER_CANCELLED: "dashboard.activity.orderCancelled",
  ORDER_CREATED: "dashboard.activity.orderCreated",
  ORDER_ITEMS_CHANGED: "dashboard.activity.orderItemsChanged",
  ORDER_PRICE_ADJUSTED: "dashboard.activity.orderPriceAdjusted",
  ORDER_REFUND_RECORDED: "dashboard.activity.orderRefundRecorded",
  ORDER_STATUS_CHANGED: "dashboard.activity.orderStatusChanged",
  ORDER_UPDATED: "dashboard.activity.orderUpdated",
  PAYMENT_DETAILS_UPDATED: "dashboard.activity.paymentDetailsUpdated",
  PAYMENT_STATUS_UPDATED: "dashboard.activity.paymentStatusUpdated",
  PROCUREMENT_RECEIPT_CREATED: "dashboard.activity.procurementReceiptCreated",
  PROCUREMENT_RECEIPT_DELETED: "dashboard.activity.procurementReceiptDeleted",
  PROCUREMENT_RECEIPT_PRODUCTS_CREATED: "dashboard.activity.procurementReceiptProductsCreated",
  PROCUREMENT_RECEIPT_ROLLED_BACK: "dashboard.activity.procurementReceiptDeleted",
  PROCUREMENT_RECEIPT_UPDATED: "dashboard.activity.procurementReceiptUpdated",
  PRODUCT_ARCHIVED: "dashboard.activity.productArchived",
  PRODUCT_CREATED: "dashboard.activity.productCreated",
  PRODUCT_ITEMS_ADDED: "dashboard.activity.productItemsAdded",
  PRODUCT_ITEM_DELETED: "dashboard.activity.productItemDeleted",
  PRODUCT_ITEM_UPDATED: "dashboard.activity.productItemUpdated",
  PRODUCT_OVERVIEW_UPDATED: "dashboard.activity.productOverviewUpdated",
  PRODUCT_PRICING_UPDATED: "dashboard.activity.productPricingUpdated",
  SHIFT_CLOSED: "dashboard.activity.shiftClosed",
  SHIFT_OPENED: "dashboard.activity.shiftOpened",
  "settings.general.update": "dashboard.activity.settingsGeneralUpdated",
  "settings.showroom-pages.update": "dashboard.activity.settingsShowroomPagesUpdated",
};

const ACTIVITY_ENTITY_LABEL_KEYS: Record<string, string> = {
  payment: "dashboard.activity.entity.payment",
  product: "dashboard.activity.entity.product",
  PROCUREMENT_RECEIPT: "dashboard.activity.entity.procurementReceipt",
  rental_order: "dashboard.activity.entity.order",
  sales_shift: "dashboard.activity.entity.salesShift",
  settings: "dashboard.activity.entity.settings",
};

function normalizeActivityLabel(
  action: string,
  entityType: string,
  t: (key: string) => string
): string {
  const normalizedAction = action.trim();
  const upperAction = normalizedAction.toUpperCase();
  const key = ACTIVITY_LABEL_KEYS[normalizedAction] ?? ACTIVITY_LABEL_KEYS[upperAction];
  const label = key ? t(key) : "";
  if (label && label !== key) return label;

  const entityKey =
    ACTIVITY_ENTITY_LABEL_KEYS[entityType.trim()] ??
    ACTIVITY_ENTITY_LABEL_KEYS[entityType.trim().toUpperCase()];
  const entityLabel = entityKey ? t(entityKey) : entityType;
  const actionLabel = normalizedAction
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return [entityLabel, actionLabel].filter(Boolean).join(" - ");
}

function buildCopy(t: (key: string) => string): DashboardOverviewCopy {
  return {
    title: t("dashboard.overview.title"),
    subtitle: t("dashboard.overview.subtitle"),
    createOrder: t("dashboard.overview.createOrder"),
    soldItemsBadge: t("dashboard.overview.soldItemsBadge"),
    financialChartTitle: t("dashboard.overview.financialChartTitle"),
    financialSummaryPresetLabel: t("dashboard.overview.summaryPresetLabel"),
    financialSummaryPreset: {
      day: t("dashboard.overview.summaryPreset.day"),
      week: t("dashboard.overview.summaryPreset.week"),
      month: t("dashboard.overview.summaryPreset.month"),
      custom: t("dashboard.overview.summaryPreset.custom"),
    },
    financialDateRangeLabel: t("dashboard.overview.financialDateRangeLabel"),
    financialGranularityLabel: t("dashboard.overview.financialGranularityLabel"),
    financialChartEmpty: t("dashboard.overview.financialChartEmpty"),
    financialChartError: t("dashboard.overview.financialChartError"),
    granularity: {
      day: t("dashboard.overview.granularity.day"),
      month: t("dashboard.overview.granularity.month"),
      year: t("dashboard.overview.granularity.year"),
    },
    kpi: {
      revenueToday: t("dashboard.overview.kpi.revenueToday"),
      grossProfitToday: t("dashboard.overview.kpi.grossProfitToday"),
      profitMarginToday: t("dashboard.overview.kpi.profitMarginToday"),
      salesProfitToday: t("dashboard.overview.kpi.salesProfitToday"),
      realProfitToday: t("dashboard.overview.kpi.realProfitToday"),
      realInflowToday: t("dashboard.overview.kpi.realInflowToday"),
      realOutflowToday: t("dashboard.overview.kpi.realOutflowToday"),
      depositCollectedToday: t("dashboard.overview.kpi.depositCollectedToday"),
      depositRefundedToday: t("dashboard.overview.kpi.depositRefundedToday"),
      initialCapitalNetTotal: t("dashboard.overview.kpi.initialCapitalNetTotal"),
      importOrderExpenseTotal: t("dashboard.overview.kpi.importOrderExpenseTotal"),
      ordersOnRent: t("dashboard.overview.kpi.ordersOnRent"),
      ordersReserved: t("dashboard.overview.kpi.ordersReserved"),
      reservedPickupToday: t("dashboard.overview.kpi.reservedPickupToday"),
      reservedPickupOverdue: t("dashboard.overview.kpi.reservedPickupOverdue"),
      dueToday: t("dashboard.overview.kpi.dueToday"),
      overdue: t("dashboard.overview.kpi.overdue"),
      itemsInLaundry: t("dashboard.overview.kpi.itemsInLaundry"),
      outstandingDebtTotal: t("dashboard.overview.kpi.outstandingDebtTotal"),
    },
    kpiFormula: {
      revenueToday: t("dashboard.overview.kpiFormula.revenueToday"),
      grossProfitToday: t("dashboard.overview.kpiFormula.grossProfitToday"),
      salesProfitToday: t("dashboard.overview.kpiFormula.salesProfitToday"),
      realProfitToday: t("dashboard.overview.kpiFormula.realProfitToday"),
      realInflowToday: t("dashboard.overview.kpiFormula.realInflowToday"),
      realOutflowToday: t("dashboard.overview.kpiFormula.realOutflowToday"),
      depositCollectedToday: t("dashboard.overview.kpiFormula.depositCollectedToday"),
      depositRefundedToday: t("dashboard.overview.kpiFormula.depositRefundedToday"),
      initialCapitalNetTotal: t("dashboard.overview.kpiFormula.initialCapitalNetTotal"),
      importOrderExpenseTotal: t("dashboard.overview.kpiFormula.importOrderExpenseTotal"),
      outstandingDebtTotal: t("dashboard.overview.kpiFormula.outstandingDebtTotal"),
    },
    moduleMetrics: {
      title: t("dashboard.overview.moduleMetrics.title"),
      all: t("dashboard.overview.moduleMetrics.all"),
      rentalSale: t("dashboard.overview.moduleMetrics.rentalSale"),
      makeup: t("dashboard.overview.moduleMetrics.makeup"),
      revenue: t("dashboard.overview.moduleMetrics.revenue"),
      profit: t("dashboard.overview.moduleMetrics.profit"),
      orderCount: t("dashboard.overview.moduleMetrics.orderCount"),
    },
    todayContext: t("dashboard.overview.todayContext"),
    dueTodayTitle: t("dashboard.overview.dueTodayTitle"),
    overdueTitle: t("dashboard.overview.overdueTitle"),
    recentActivitiesTitle: t("dashboard.overview.recentActivitiesTitle"),
    tableHeaders: {
      orderCode: t("dashboard.overview.tableHeaders.orderCode"),
      customer: t("dashboard.overview.tableHeaders.customer"),
      period: t("dashboard.overview.tableHeaders.period"),
      status: t("dashboard.overview.tableHeaders.status"),
      updatedAt: t("dashboard.overview.tableHeaders.updatedAt"),
      actions: t("dashboard.overview.tableHeaders.actions"),
    },
    openAction: t("common.open"),
    returnAction: t("orders.actions.return"),
    actionFailed: t("dashboard.overview.actionFailed"),
    dueTodayEmpty: t("dashboard.overview.dueTodayEmpty"),
    overdueEmpty: t("dashboard.overview.overdueEmpty"),
    activitiesEmpty: t("dashboard.overview.activitiesEmpty"),
    loading: t("dashboard.overview.loading"),
    retryAction: t("common.retry"),
    errorFallback: t("dashboard.overview.errorFallback"),
    unknownActor: t("dashboard.overview.unknownActor"),
  };
}

export function useDashboardOverviewPage(locale: AppLocale) {
  const t = useMemo(() => createLocaleTranslator(locale), [locale]);
  const copy = useMemo(() => buildCopy(t), [t]);
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const { currentBranchId } = useAuthAccess();
  const [financialSummaryPreset, setFinancialSummaryPresetState] =
    useState<DashboardSummaryPreset>(DASHBOARD_DEFAULT_SUMMARY_PRESET);
  const [financialDateRange, setFinancialDateRangeState] = useState<DateRangeValue>(() =>
    createDateRangeFromSummaryPreset(DASHBOARD_DEFAULT_SUMMARY_PRESET)
  );
  const [financialGranularity, setFinancialGranularity] =
    useState<RevenueReportGranularity>("day");

  const setFinancialSummaryPreset = (preset: DashboardSummaryPreset) => {
    if (preset === "custom") {
      setFinancialSummaryPresetState("custom");
      return;
    }

    setFinancialSummaryPresetState(preset);
    setFinancialDateRangeState(createDateRangeFromSummaryPreset(preset));
  };

  const setFinancialDateRange = (value: DateRangeValue) => {
    setFinancialDateRangeState(value);
    setFinancialSummaryPresetState("custom");
  };

  const overviewQuery = useDashboardOverviewQuery({
    branchId: currentBranchId,
  });
  const financialReportQuery = useDashboardFinancialRevenueReportQuery({
    branchId: currentBranchId,
    startDate: financialDateRange.startDate,
    endDate: financialDateRange.endDate,
    granularity: financialGranularity,
  });

  const quickReturnMutation = useQuickReturnOrderMutation(currentBranchId);

  return {
    copy,
    overview: dashboardStore.overview,
    financialReport: dashboardStore.financialRevenueReport,
    overviewQuery,
    financialReportQuery,
    quickReturnMutation,
    orderStatusLabels,
    financialSummaryPreset,
    setFinancialSummaryPreset,
    financialDateRange,
    setFinancialDateRange,
    financialGranularity,
    setFinancialGranularity,
    activityLabelResolver: (action: string, entityType: string) =>
      normalizeActivityLabel(action, entityType, t),
    currentBranchId,
  };
}
