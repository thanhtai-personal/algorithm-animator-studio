"use client";

import { useMemo, useState } from "react";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { ORDERS_DEFAULT_PAGE_SIZE } from "@/features/orders/constants";
import {
  useOrdersListQuery,
  useSettleDebtOrderAnyMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { useDebouncedValue } from "@/features/orders/utils/useDebouncedValue";
import { buildDomainLabels } from "@/utils/domainLabels";

interface DebtOrdersCopy {
  title: string;
  subtitle: string;
  backToOrders: string;
  searchPlaceholder: string;
  loading: string;
  empty: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  settleAction: string;
  settleBlockedHint: string;
  settleFailed: string;
  tableHeaders: {
    orderCode: string;
    customer: string;
    debtAmount: string;
    updatedAt: string;
    actions: string;
  };
}

const COPY: Record<AppLocale, DebtOrdersCopy> = {
  vi: {
    title: "Đơn nợ",
    subtitle: "Theo dõi các đơn còn nợ và chốt hoàn tất sau khi đã thu đủ.",
    backToOrders: "Quay lại danh sách đơn",
    searchPlaceholder: "Tìm mã đơn, tên khách, số điện thoại...",
    loading: "Đang tải danh sách đơn nợ...",
    empty: "Không có đơn nợ.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    settleAction: "Hoàn tất nợ",
    settleBlockedHint: "Còn nợ, chưa thể hoàn tất.",
    settleFailed: "Không thể hoàn tất nợ.",
    tableHeaders: {
      orderCode: "Mã đơn",
      customer: "Khách hàng",
      debtAmount: "Số nợ còn lại",
      updatedAt: "Cập nhật",
      actions: "Thao tác",
    },
  },
  en: {
    title: "Debt orders",
    subtitle: "Track debt orders and close them after full collection.",
    backToOrders: "Back to orders",
    searchPlaceholder: "Search by order code, customer, phone...",
    loading: "Loading debt orders...",
    empty: "No debt orders.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    settleAction: "Settle debt",
    settleBlockedHint: "Outstanding amount must be zero.",
    settleFailed: "Failed to settle debt order.",
    tableHeaders: {
      orderCode: "Order code",
      customer: "Customer",
      debtAmount: "Outstanding debt",
      updatedAt: "Updated",
      actions: "Actions",
    },
  },
};

export function useDebtOrdersPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId } = useAuthAccess();
  const statusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );

  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const listQuery = useOrdersListQuery({
    branchId: currentBranchId,
    statuses: ["DEBT"],
    search: debouncedSearch,
    page,
    pageSize: ORDERS_DEFAULT_PAGE_SIZE,
  });

  const settleDebtMutation = useSettleDebtOrderAnyMutation();
  const totalPages = (() => {
    if (ordersStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(ordersStore.listTotal / ordersStore.listPageSize));
  })();

  return {
    copy,
    statusLabels,
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    listQuery,
    listItems: ordersStore.listItems,
    settleDebtMutation,
    page,
    setPage,
    totalPages,
  };
}
