"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { REPORTS_DEFAULT_RANGE_DAYS, REPORTS_INCIDENT_TYPE_FILTERS } from "@/features/reports/constants";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useExportIncidentsCsvMutation,
  useIncidentsReportQuery,
} from "@/features/reports/queries/useReportsQueries";
import { reportsStore } from "@/features/reports/stores/reportsStore";
import type { OrderIncidentStatus, OrderIncidentType } from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface IncidentsReportCopy {
  title: string;
  subtitle: string;
  exportAction: string;
  exportRestricted: string;
  resetFilters: string;
  dateRangeFilterLabel: string;
  typeFilterLabel: string;
  branchFilterLabel: string;
  allTypes: string;
  allBranches: string;
  loading: string;
  errorFallback: string;
  retryAction: string;
  summary: {
    totalIncidents: string;
    totalAmount: string;
    byTypeAmount: string;
    byStatusCount: string;
  };
  tableTitle: string;
  tableEmpty: string;
  tableHeaders: {
    createdAt: string;
    orderCode: string;
    itemCode: string;
    customer: string;
    type: string;
    status: string;
    amount: string;
    applyToDeposit: string;
    description: string;
  };
  applyDepositYes: string;
  applyDepositNo: string;
  unknownCustomer: string;
}

const INCIDENT_TYPE_LABEL_KEYS: Record<OrderIncidentType, string> = {
  LATE: "incidentType.late",
  DAMAGE: "incidentType.damage",
  LOST: "incidentType.lost",
  CLEANING: "incidentType.cleaning",
};

const INCIDENT_STATUS_LABEL_KEYS: Record<OrderIncidentStatus, string> = {
  OPEN: "incidentStatus.open",
  SETTLED: "incidentStatus.settled",
  WAIVED: "incidentStatus.waived",
};

const INCIDENTS_REPORT_COPY: Record<AppLocale, IncidentsReportCopy> = {
  vi: {
    title: "Báo cáo sự cố",
    subtitle: "Theo dõi incident theo thời gian, loại sự cố và tổng amount để đối soát xử lý đơn trả.",
    exportAction: "Export CSV",
    exportRestricted: "Chỉ Manager trở lên mới export CSV.",
    resetFilters: "Đặt lại bộ lọc",
    dateRangeFilterLabel: "Khoảng ngày",
    typeFilterLabel: "Loại sự cố",
    branchFilterLabel: "Chi nhánh",
    allTypes: "Tất cả loại",
    allBranches: "Tất cả chi nhánh",
    loading: "Đang tải báo cáo sự cố...",
    errorFallback: "Tải báo cáo sự cố thất bại.",
    retryAction: "Thử lại",
    summary: {
      totalIncidents: "Tổng incidents",
      totalAmount: "Tổng amount",
      byTypeAmount: "Amount theo loại",
      byStatusCount: "Số lượng theo trạng thái",
    },
    tableTitle: "Danh sách incidents",
    tableEmpty: "Không có incidents phù hợp bộ lọc.",
    tableHeaders: {
      createdAt: "Thời gian",
      orderCode: "Mã đơn",
      itemCode: "Mã item",
      customer: "Khách hàng",
      type: "Loại",
      status: "Trạng thái",
      amount: "Amount",
      applyToDeposit: "Trừ cọc",
      description: "Mô tả",
    },
    applyDepositYes: "Có",
    applyDepositNo: "Không",
    unknownCustomer: "Khách lẻ",
  },
  en: {
    title: "Incidents Report",
    subtitle:
      "Track incidents by date range/type and aggregated amount for return-flow reconciliation.",
    exportAction: "Export CSV",
    exportRestricted: "Only Manager+ can export CSV.",
    resetFilters: "Reset filters",
    dateRangeFilterLabel: "Date range",
    typeFilterLabel: "Incident type",
    branchFilterLabel: "Branch",
    allTypes: "All types",
    allBranches: "All branches",
    loading: "Loading incidents report...",
    errorFallback: "Failed to load incidents report.",
    retryAction: "Retry",
    summary: {
      totalIncidents: "Total incidents",
      totalAmount: "Total amount",
      byTypeAmount: "Amount by type",
      byStatusCount: "Count by status",
    },
    tableTitle: "Incident rows",
    tableEmpty: "No incidents matched current filters.",
    tableHeaders: {
      createdAt: "Created at",
      orderCode: "Order",
      itemCode: "Item",
      customer: "Customer",
      type: "Type",
      status: "Status",
      amount: "Amount",
      applyToDeposit: "Apply to deposit",
      description: "Description",
    },
    applyDepositYes: "Yes",
    applyDepositNo: "No",
    unknownCustomer: "Walk-in",
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

export function useIncidentsReportPage(locale: AppLocale) {
  const copy = INCIDENTS_REPORT_COPY[locale];
  const { role, currentBranchId, branchAccess } = useAuthAccess();
  const typeLabels = useMemo(
    () => buildDomainLabels(locale, INCIDENT_TYPE_LABEL_KEYS),
    [locale]
  );
  const statusLabels = useMemo(
    () => buildDomainLabels(locale, INCIDENT_STATUS_LABEL_KEYS),
    [locale]
  );

  const [dateRange, setDateRange] = useState(createDefaultDateRange);
  const [typeFilter, setTypeFilter] = useState<OrderIncidentType | "">("");
  const [branchFilter, setBranchFilter] = useState("");

  const canExport = isManagerPlusRole(role);
  const roleIsStaff = isStaffRole(role);

  const resolvedBranchId = roleIsStaff
    ? currentBranchId ?? null
    : branchFilter || currentBranchId || null;

  const branchFilterValue = roleIsStaff
    ? currentBranchId ?? ""
    : branchFilter || currentBranchId || "";

  const reportQuery = useIncidentsReportQuery({
    branchId: resolvedBranchId,
    startDate: dateRange.startDate || null,
    endDate: dateRange.endDate || null,
    type: typeFilter || null,
  });

  const exportCsvMutation = useExportIncidentsCsvMutation();

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
    setTypeFilter("");
    setBranchFilter("");
  };

  const exportCsv = async () => {
    const result = await exportCsvMutation.mutateAsync({
      branchId: resolvedBranchId,
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
      type: typeFilter || null,
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
    typeFilter,
    setTypeFilter,
    typeOptions: REPORTS_INCIDENT_TYPE_FILTERS,
    typeLabels,
    statusLabels,
    branchFilter,
    setBranchFilter,
    branchFilterValue,
    branchOptions,
    resetFilters,
    canExport,
    canSelectBranch: !roleIsStaff,
    reportQuery,
    report: reportsStore.incidentsReport,
    exportCsv,
    exportCsvMutation,
  };
}
