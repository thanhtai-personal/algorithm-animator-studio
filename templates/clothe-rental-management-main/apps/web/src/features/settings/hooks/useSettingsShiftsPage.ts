"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import type { SalesShiftDetailDto, SalesShiftStatus } from "@/types/salesDesk";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useSettingsBranchesQuery,
  useSettingsShiftDetailQuery,
  useSettingsShiftsQuery,
  useSettingsUsersQuery,
} from "@/features/settings/queries/useSettingsQueries";
import { settingsStore } from "@/features/settings/stores/settingsStore";
import type { OrderStatus } from "@/types/domainPrimitives";
import { buildDomainLabels } from "@/utils/domainLabels";

interface SettingsShiftsCopy {
  title: string;
  subtitle: string;
  noPermission: string;
  loading: string;
  loadError: string;
  retryAction: string;
  filtersTitle: string;
  branchLabel: string;
  staffLabel: string;
  statusLabel: string;
  fromDateLabel: string;
  toDateLabel: string;
  allBranchesOption: string;
  allStaffOption: string;
  allStatusOption: string;
  statusOpenOption: string;
  statusClosedOption: string;
  listTitle: string;
  detailTitle: string;
  listEmpty: string;
  detailEmpty: string;
  openedByLabel: string;
  openedAtLabel: string;
  openingCashLabel: string;
  closedByLabel: string;
  closedAtLabel: string;
  closingCashLabel: string;
  noteLabel: string;
  orderCountLabel: string;
  totalReceivedLabel: string;
  totalDepositLabel: string;
  totalRentalLabel: string;
  totalSaleLabel: string;
  expectedCashLabel: string;
  cashNetLabel: string;
  varianceLabel: string;
  ordersTitle: string;
  orderCodeLabel: string;
  orderTypeLabel: string;
  customerLabel: string;
  orderStatusLabel: string;
  orderCreatedAtLabel: string;
  orderTotalLabel: string;
  orderDepositLabel: string;
  ordersEmpty: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
}

const SHIFTS_COPY: Record<AppLocale, SettingsShiftsCopy> = {
  vi: {
    title: "Quản lý ca nhân viên",
    subtitle:
      "Theo dõi mở ca/kết ca theo chi nhánh, nhân viên và thời gian; xem chi tiết số liệu và danh sách đơn trong ca.",
    noPermission: "Chỉ Owner/Admin/Manager được phép truy cập màn hình quản lý ca.",
    loading: "Đang tải dữ liệu ca...",
    loadError: "Tải dữ liệu ca thất bại.",
    retryAction: "Thử lại",
    filtersTitle: "Bộ lọc",
    branchLabel: "Chi nhánh",
    staffLabel: "Nhân viên",
    statusLabel: "Trạng thái ca",
    fromDateLabel: "Từ ngày",
    toDateLabel: "Đến ngày",
    allBranchesOption: "Tất cả chi nhánh",
    allStaffOption: "Tất cả nhân viên",
    allStatusOption: "Tất cả trạng thái",
    statusOpenOption: "Đang mở",
    statusClosedOption: "Đã kết",
    listTitle: "Danh sách ca",
    detailTitle: "Chi tiết ca",
    listEmpty: "Không có ca nào theo bộ lọc hiện tại.",
    detailEmpty: "Chọn một ca để xem chi tiết.",
    openedByLabel: "Mở bởi",
    openedAtLabel: "Thời gian mở",
    openingCashLabel: "Tiền mở ca",
    closedByLabel: "Kết bởi",
    closedAtLabel: "Thời gian kết",
    closingCashLabel: "Tiền kết ca",
    noteLabel: "Ghi chú",
    orderCountLabel: "Tổng số đơn",
    totalReceivedLabel: "Tổng tiền đã nhận",
    totalDepositLabel: "Tổng tiền cọc",
    totalRentalLabel: "Tổng tiền thuê",
    totalSaleLabel: "Tổng tiền bán",
    expectedCashLabel: "Tiền dự kiến",
    cashNetLabel: "Thu chi tiền mặt",
    varianceLabel: "Chênh lệch",
    ordersTitle: "Đơn trong ca",
    orderCodeLabel: "Mã đơn",
    orderTypeLabel: "Loại",
    customerLabel: "Khách hàng",
    orderStatusLabel: "Trạng thái",
    orderCreatedAtLabel: "Tạo lúc",
    orderTotalLabel: "Tổng tiền",
    orderDepositLabel: "Tiền cọc",
    ordersEmpty: "Không có đơn trong ca.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
  },
  en: {
    title: "Staff shift management",
    subtitle:
      "Track shift open/close by branch, staff and time; review summary and orders inside each shift.",
    noPermission: "Only Owner/Admin/Manager can access shift management.",
    loading: "Loading shifts...",
    loadError: "Failed to load shifts.",
    retryAction: "Retry",
    filtersTitle: "Filters",
    branchLabel: "Branch",
    staffLabel: "Staff",
    statusLabel: "Shift status",
    fromDateLabel: "From",
    toDateLabel: "To",
    allBranchesOption: "All branches",
    allStaffOption: "All staff",
    allStatusOption: "All statuses",
    statusOpenOption: "Open",
    statusClosedOption: "Closed",
    listTitle: "Shift list",
    detailTitle: "Shift detail",
    listEmpty: "No shifts found for current filters.",
    detailEmpty: "Select a shift to view details.",
    openedByLabel: "Opened by",
    openedAtLabel: "Opened at",
    openingCashLabel: "Opening cash",
    closedByLabel: "Closed by",
    closedAtLabel: "Closed at",
    closingCashLabel: "Closing cash",
    noteLabel: "Note",
    orderCountLabel: "Total orders",
    totalReceivedLabel: "Total received",
    totalDepositLabel: "Total deposit",
    totalRentalLabel: "Total rental",
    totalSaleLabel: "Total sale",
    expectedCashLabel: "Expected cash",
    cashNetLabel: "Cash movement",
    varianceLabel: "Variance",
    ordersTitle: "Shift orders",
    orderCodeLabel: "Order",
    orderTypeLabel: "Type",
    customerLabel: "Customer",
    orderStatusLabel: "Status",
    orderCreatedAtLabel: "Created",
    orderTotalLabel: "Total",
    orderDepositLabel: "Deposit",
    ordersEmpty: "No orders in this shift.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
  },
};

const PAGE_SIZE = 12;
const SHIFT_STATUS_LABEL_KEYS: Record<SalesShiftStatus, string> = {
  OPEN: "shiftStatus.open",
  CLOSED: "shiftStatus.closed",
};

function toShiftStatusFilter(value: string): SalesShiftStatus | null {
  if (value === "OPEN" || value === "CLOSED") {
    return value;
  }
  return null;
}

export function useSettingsShiftsPage(locale: AppLocale) {
  const copy = SHIFTS_COPY[locale];
  const { role, branchAccess, currentBranchId } = useAuthAccess();
  const canManageShifts = role === "owner_admin" || role === "manager";
  const canLoadSettingsMetadata = role === "owner_admin";
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const shiftStatusLabels = useMemo(
    () => buildDomainLabels(locale, SHIFT_STATUS_LABEL_KEYS),
    [locale]
  );

  const [branchFilter, setBranchFilter] = useState<string>("");
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");

  const branchesQuery = useSettingsBranchesQuery(canLoadSettingsMetadata);
  const usersQuery = useSettingsUsersQuery(
    branchFilter || currentBranchId || null,
    canLoadSettingsMetadata
  );

  const branchesPayload = settingsStore.branches;
  const usersPayload = settingsStore.users;

  const branchOptions = useMemo(
    () => {
      if (canLoadSettingsMetadata) {
        return (branchesPayload?.items ?? []).map((entry) => ({
          value: entry.id,
          label: `${entry.code} - ${entry.name}`,
        }));
      }

      return branchAccess.map((entry) => ({
        value: entry.branchId,
        label: entry.branchName?.trim() || entry.branchId,
      }));
    },
    [branchAccess, branchesPayload?.items, canLoadSettingsMetadata]
  );

  const staffOptions = useMemo(
    () => {
      if (!canLoadSettingsMetadata) {
        return [];
      }

      return (usersPayload?.items ?? []).map((entry) => ({
        value: entry.profileId,
        label: `${entry.fullName ?? entry.email ?? entry.profileId}`,
      }));
    },
    [canLoadSettingsMetadata, usersPayload?.items]
  );

  const effectiveStaffFilter = staffOptions.some((entry) => entry.value === staffFilter)
    ? staffFilter
    : "";

  const shiftsQueryInput = useMemo(
    () => ({
      branchId: branchFilter || null,
      staffId: effectiveStaffFilter || null,
      status: toShiftStatusFilter(statusFilter),
      fromDate: fromDate || null,
      toDate: toDate || null,
      page,
      pageSize: PAGE_SIZE,
    }),
    [branchFilter, effectiveStaffFilter, statusFilter, fromDate, toDate, page]
  );

  const shiftsQuery = useSettingsShiftsQuery(shiftsQueryInput);
  const shiftsPayload = settingsStore.shifts;
  const shiftListItems = shiftsPayload?.items ?? [];
  const effectiveSelectedShiftId = shiftListItems.some((entry) => entry.id === selectedShiftId)
    ? selectedShiftId
    : shiftListItems[0]?.id ?? "";

  const selectedShiftQuery = useSettingsShiftDetailQuery(
    effectiveSelectedShiftId,
    branchFilter || null,
    Boolean(effectiveSelectedShiftId)
  );

  const shiftDetail: SalesShiftDetailDto | null =
    selectedShiftQuery.data?.shift ??
    shiftListItems.find((entry) => entry.id === effectiveSelectedShiftId) ??
    null;

  const updateBranchFilter = (value: string) => {
    setBranchFilter(value);
    setPage(1);
  };

  const updateStaffFilter = (value: string) => {
    setStaffFilter(value);
    setPage(1);
  };

  const updateStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const updateFromDate = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const updateToDate = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  return {
    copy,
    canManageShifts,
    shiftsQuery,
    branchesQuery,
    usersQuery,
    selectedShiftQuery,
    shiftsPayload,
    shiftDetail,
    branchOptions,
    staffOptions,
    branchFilter,
    setBranchFilter: updateBranchFilter,
    staffFilter: effectiveStaffFilter,
    setStaffFilter: updateStaffFilter,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    fromDate,
    setFromDate: updateFromDate,
    toDate,
    setToDate: updateToDate,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    selectedShiftId: effectiveSelectedShiftId,
    setSelectedShiftId,
    orderStatusLabels,
    shiftStatusLabels,
    resolveOrderStatusLabel: (status: OrderStatus) => orderStatusLabels[status],
    resolveShiftStatusLabel: (status: SalesShiftStatus) => shiftStatusLabels[status],
  };
}
