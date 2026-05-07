"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useOrderDetailQuery,
  useOrdersListQuery,
  useProcessOrderReturnMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import type { ReturnItemCondition } from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface SalesReturnsCopy {
  title: string;
  searchPlaceholder: string;
  selectHint: string;
  noOrderHint: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  confirmAction: string;
  success: string;
  failed: string;
  notePlaceholder: string;
  amountPlaceholder: string;
}

const SALES_RETURNS_COPY: Record<AppLocale, SalesReturnsCopy> = {
  vi: {
    title: "Đơn đang thuê",
    searchPlaceholder: "Tìm mã đơn / tên khách...",
    selectHint: "Chọn đơn để xử lý trả hàng.",
    noOrderHint: "Không có đơn phù hợp.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    confirmAction: "Xác nhận trả hàng",
    success: "Đã xử lý trả hàng.",
    failed: "Không thể xử lý trả hàng.",
    notePlaceholder: "Ghi chú tình trạng...",
    amountPlaceholder: "Phí sự cố",
  },
  en: {
    title: "Active rentals",
    searchPlaceholder: "Search order code / customer...",
    selectHint: "Select an order to process return.",
    noOrderHint: "No matching order found.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    confirmAction: "Confirm return",
    success: "Return processed.",
    failed: "Unable to process return.",
    notePlaceholder: "Condition note...",
    amountPlaceholder: "Incident fee",
  },
};

const RETURN_CONDITIONS: ReturnItemCondition[] = ["OK", "NEED_CLEAN", "DAMAGE", "LOST"];
const SALES_RETURNS_PAGE_SIZE = 20;

function parseNonNegativeAmount(raw: string): number {
  if (!raw.trim()) return 0;
  const parsed = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

export function useSalesReturnsPage(locale: AppLocale) {
  const copy = SALES_RETURNS_COPY[locale];
  const { currentBranchId } = useAuthAccess();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [conditionByOrderItemId, setConditionByOrderItemId] = useState<
    Record<string, ReturnItemCondition>
  >({});
  const [noteByOrderItemId, setNoteByOrderItemId] = useState<Record<string, string>>({});
  const [incidentAmountByOrderItemId, setIncidentAmountByOrderItemId] = useState<
    Record<string, string>
  >({});

  useOrdersListQuery({
    branchId: currentBranchId,
    statuses: ["PICKED_UP"],
    search,
    page,
    pageSize: SALES_RETURNS_PAGE_SIZE,
  });

  useOrderDetailQuery(selectedOrderId ?? "");
  const returnMutation = useProcessOrderReturnMutation(selectedOrderId ?? "");

  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const orders = ordersStore.listItems;
  const totalPages = (() => {
    if (ordersStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(ordersStore.listTotal / ordersStore.listPageSize));
  })();
  const selectedDetail = selectedOrderId
    ? ordersStore.getDetailByOrderId(selectedOrderId)
    : null;

  const submitReturn = async () => {
    if (!selectedDetail) return;

    try {
      await returnMutation.mutateAsync({
        items: selectedDetail.items.map((item) => {
          const condition = conditionByOrderItemId[item.orderItemId] ?? "OK";
          const note = noteByOrderItemId[item.orderItemId] ?? null;
          const incidentAmountRaw = incidentAmountByOrderItemId[item.orderItemId] ?? "";
          return {
            orderItemId: item.orderItemId,
            condition,
            note,
            incidentAmount: parseNonNegativeAmount(incidentAmountRaw),
            applyToDeposit: true,
          };
        }),
        completeAfterReturn: false,
      });

      toast.success(copy.success);
      setSelectedOrderId(null);
      setConditionByOrderItemId({});
      setNoteByOrderItemId({});
      setIncidentAmountByOrderItemId({});
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.failed;
      toast.error(message);
    }
  };

  return {
    copy,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    selectedOrderId,
    setSelectedOrderId,
    selectedDetail,
    orders,
    orderStatusLabels,
    conditionByOrderItemId,
    setConditionByOrderItemId,
    noteByOrderItemId,
    setNoteByOrderItemId,
    incidentAmountByOrderItemId,
    setIncidentAmountByOrderItemId,
    returnConditions: RETURN_CONDITIONS,
    submitReturn,
    submitting: returnMutation.isPending,
  };
}
