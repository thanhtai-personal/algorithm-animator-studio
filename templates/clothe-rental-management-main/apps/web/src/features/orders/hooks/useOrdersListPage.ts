"use client";

import { useMemo, useState } from "react";
import {
  ORDER_STATUS_LABEL_KEYS,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { ORDERS_DEFAULT_PAGE_SIZE } from "@/features/orders/constants";
import {
  useCancelOrderAnyMutation,
  useOrdersListQuery,
  usePickupOrderAnyMutation,
  useTransitionOrderStatusAnyMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { useDebouncedValue } from "@/features/orders/utils/useDebouncedValue";
import type { OrderStatus } from "@/types/domainPrimitives";
import type { OrderStatusTransitionPayload } from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface OrdersListCopy {
  title: string;
  subtitle: string;
  createAction: string;
  createReturnAction: string;
  createPanelTitle: string;
  createPanelDescription: string;
  createPanelCancelAction: string;
  debtOrdersAction: string;
  searchPlaceholder: string;
  statusFilterLabel: string;
  dateRangeFilterLabel: string;
  customerFilterLabel: string;
  staffFilterLabel: string;
  staffFilterPlaceholder: string;
  paymentFilterLabel: string;
  paymentFilterPlaceholder: string;
  allStatuses: string;
  resetFilters: string;
  tableHeaders: {
    orderCode: string;
    customer: string;
    period: string;
    status: string;
    total: string;
    deposit: string;
    balance: string;
    updatedAt: string;
    actions: string;
  };
  loading: string;
  empty: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  viewDetail: string;
  editAction: string;
  confirmAction: string;
  pickupAction: string;
  returnAction: string;
  cancelAction: string;
  cancelConfirm: string;
  cancelReasonPrompt: string;
  actionFailed: string;
  clearFiltersAction: string;
  noCustomer: string;
  noPeriod: string;
  quickActionRunning: string;
}

interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

const ORDERS_LIST_COPY: Record<AppLocale, OrdersListCopy> = {
  vi: {
    title: "Đơn thuê & bán",
    subtitle: "Tra cứu đơn và thao tác nhanh theo trạng thái vận hành.",
    createAction: "Tạo đơn",
    createReturnAction: "Tạo đơn trả",
    createPanelTitle: "Tạo đơn thuê/bán",
    createPanelDescription: "Hoàn thành các bước tạo đơn trong cùng một modal.",
    createPanelCancelAction: "Hủy",
    debtOrdersAction: "Đơn nợ",
    searchPlaceholder: "Tìm mã đơn, tên khách, số điện thoại...",
    statusFilterLabel: "Trạng thái",
    dateRangeFilterLabel: "Khoảng ngày",
    customerFilterLabel: "Khách hàng",
    staffFilterLabel: "Nhân viên",
    staffFilterPlaceholder: "Tất cả nhân viên",
    paymentFilterLabel: "Thanh toán",
    paymentFilterPlaceholder: "Tất cả trạng thái thanh toán",
    allStatuses: "Tất cả trạng thái",
    resetFilters: "Xóa bộ lọc",
    tableHeaders: {
      orderCode: "Mã đơn",
      customer: "Khách hàng",
      period: "Thời gian thuê",
      status: "Trạng thái",
      total: "Tổng tiền thuê",
      deposit: "Cọc yêu cầu",
      balance: "Còn thiếu",
      updatedAt: "Cập nhật",
      actions: "Hành động",
    },
    loading: "Đang tải danh sách đơn thuê...",
    empty: "Không có đơn phù hợp bộ lọc hiện tại.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    viewDetail: "Chi tiết",
    editAction: "Sửa",
    confirmAction: "Xác nhận",
    pickupAction: "Nhận đồ",
    returnAction: "Trả đồ",
    cancelAction: "Hủy đơn",
    cancelConfirm: "Bạn có chắc muốn hủy đơn này?",
    cancelReasonPrompt: "Nhập lý do hủy (tùy chọn)",
    actionFailed: "Thao tác trạng thái thất bại.",
    clearFiltersAction: "Xóa bộ lọc",
    noCustomer: "Không có thông tin khách",
    noPeriod: "-",
    quickActionRunning: "Đang xử lý...",
  },
  en: {
    title: "Rental & sale orders",
    subtitle: "Search and run quick status actions for orders.",
    createAction: "Create order",
    createReturnAction: "Create return order",
    createPanelTitle: "Create rental/sale order",
    createPanelDescription: "Complete the full order wizard inside one modal.",
    createPanelCancelAction: "Cancel",
    debtOrdersAction: "Debt orders",
    searchPlaceholder: "Search by order code, customer, phone...",
    statusFilterLabel: "Status",
    dateRangeFilterLabel: "Date range",
    customerFilterLabel: "Customer",
    staffFilterLabel: "Staff",
    staffFilterPlaceholder: "All staff",
    paymentFilterLabel: "Payment",
    paymentFilterPlaceholder: "All payment statuses",
    allStatuses: "All statuses",
    resetFilters: "Reset filters",
    tableHeaders: {
      orderCode: "Order code",
      customer: "Customer",
      period: "Period",
      status: "Status",
      total: "Total",
      deposit: "Deposit",
      balance: "Balance",
      updatedAt: "Updated",
      actions: "Actions",
    },
    loading: "Loading orders...",
    empty: "No orders matched current filters.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    viewDetail: "Detail",
    editAction: "Edit",
    confirmAction: "Confirm",
    pickupAction: "Pick up",
    returnAction: "Return",
    cancelAction: "Cancel",
    cancelConfirm: "Are you sure you want to cancel this order?",
    cancelReasonPrompt: "Enter cancel reason (optional)",
    actionFailed: "Order action failed.",
    clearFiltersAction: "Clear filters",
    noCustomer: "N/A",
    noPeriod: "-",
    quickActionRunning: "Processing...",
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

export function useOrdersListPage(locale: AppLocale) {
  const copy = ORDERS_LIST_COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const statusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const paymentStatusLabels = useMemo(
    () => buildDomainLabels(locale, PAYMENT_STATUS_LABEL_KEYS),
    [locale]
  );

  const [searchInput, setSearchInput] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    startDate: "",
    endDate: "",
  });
  const [staffFilter, setStaffFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const listQuery = useOrdersListQuery({
    branchId: currentBranchId,
    statuses: selectedStatuses,
    startDate: dateRange.startDate || null,
    endDate: dateRange.endDate || null,
    search: debouncedSearch,
    staffId: staffFilter || null,
    paymentStatus: paymentStatusFilter || null,
    page,
    pageSize: ORDERS_DEFAULT_PAGE_SIZE,
  });

  const transitionAnyMutation = useTransitionOrderStatusAnyMutation();
  const pickupAnyMutation = usePickupOrderAnyMutation();
  const cancelAnyMutation = useCancelOrderAnyMutation();

  const totalPages = (() => {
    if (ordersStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(ordersStore.listTotal / ordersStore.listPageSize));
  })();

  const statusOptions = useMemo(
    () =>
      ORDER_STATUS_VALUES.map((value) => ({
        value,
        label: statusLabels[value],
      })),
    [statusLabels]
  );
  const paymentStatusOptions = useMemo(
    () => [
      {
        value: "POSTED",
        label: paymentStatusLabels.POSTED,
      },
      {
        value: "VOIDED",
        label: paymentStatusLabels.VOIDED,
      },
    ],
    [paymentStatusLabels.POSTED, paymentStatusLabels.VOIDED]
  );

  const toggleStatus = (value: OrderStatus) => {
    setSelectedStatuses((previous) => {
      if (previous.includes(value)) {
        return previous.filter((entry) => entry !== value);
      }
      return [...previous, value];
    });
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSelectedStatuses([]);
    setDateRange({
      startDate: "",
      endDate: "",
    });
    setStaffFilter("");
    setPaymentStatusFilter("");
    setPage(1);
  };

  const runQuickTransition = async (
    orderId: string,
    payload: OrderStatusTransitionPayload
  ) => {
    await transitionAnyMutation.mutateAsync({ orderId, payload });
  };

  const runQuickPickup = async (
    orderId: string,
    requireDepositPaid: boolean,
    rentOutstanding: number
  ) => {
    await pickupAnyMutation.mutateAsync({
      orderId,
      payload: {
        requireDepositPaid,
        note: "ORDERS_LIST_PICKUP",
        rentalPayment:
          rentOutstanding > 0
            ? {
                type: "RENT",
                method: "CASH",
                amount: rentOutstanding,
                source: "ORDERS_LIST_PICKUP",
              }
            : undefined,
      },
    });
  };

  const runQuickCancel = async (orderId: string, reason: string | null) => {
    await cancelAnyMutation.mutateAsync({
      orderId,
      payload: {
        reason,
      },
    });
  };

  return {
    copy,
    statusLabels,
    statusOptions,
    paymentStatusOptions,
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    selectedStatuses,
    toggleStatus,
    dateRange,
    setDateRange: (next: DateRangeFilter) => {
      setDateRange(next);
      setPage(1);
    },
    staffFilter,
    setStaffFilter: (value: string) => {
      setStaffFilter(value);
      setPage(1);
    },
    paymentStatusFilter,
    setPaymentStatusFilter: (value: string) => {
      setPaymentStatusFilter(value);
      setPage(1);
    },
    resetFilters,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems: ordersStore.listItems,
    listTotal: ordersStore.listTotal,
    runQuickTransition,
    runQuickPickup,
    runQuickCancel,
    transitionAnyMutation,
    pickupAnyMutation,
    cancelAnyMutation,
    canCancelAny: isManagerPlusRole(role),
  };
}
