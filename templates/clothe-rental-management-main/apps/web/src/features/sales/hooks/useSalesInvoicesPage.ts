"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useAddOrderPaymentMutation,
  useOrderDetailQuery,
  useOrdersListQuery,
  usePickupOrderAnyMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import type {
  OrderPaymentMethod,
  OrderPaymentType,
} from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface SalesInvoicesCopy {
  title: string;
  searchPlaceholder: string;
  selectHint: string;
  noOrderHint: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  paymentAction: string;
  paymentProcessing: string;
  printAction: string;
  pdfAction: string;
  paymentSuccess: string;
  paymentFailed: string;
  pickupAction: string;
  pickupSuccess: string;
  pickupFailed: string;
}

const SALES_INVOICES_COPY: Record<AppLocale, SalesInvoicesCopy> = {
  vi: {
    title: "Hóa đơn tại quầy",
    searchPlaceholder: "Tìm mã đơn / tên khách...",
    selectHint: "Chọn đơn để xem hóa đơn.",
    noOrderHint: "Không có đơn phù hợp.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    paymentAction: "Ghi nhận thanh toán",
    paymentProcessing: "Đang xử lý...",
    printAction: "In",
    pdfAction: "PDF",
    paymentSuccess: "Đã ghi nhận thanh toán.",
    paymentFailed: "Không thể ghi nhận thanh toán.",
    pickupAction: "Chuyển sang đã lấy",
    pickupSuccess: "Đã chuyển đơn sang đã lấy đồ và ghi nhận tiền thuê.",
    pickupFailed: "Không thể chuyển sang đã lấy.",
  },
  en: {
    title: "Desk invoices",
    searchPlaceholder: "Search order code / customer...",
    selectHint: "Select order to preview invoice.",
    noOrderHint: "No matching order found.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    paymentAction: "Record payment",
    paymentProcessing: "Processing...",
    printAction: "Print",
    pdfAction: "PDF",
    paymentSuccess: "Payment recorded.",
    paymentFailed: "Unable to record payment.",
    pickupAction: "Mark picked up",
    pickupSuccess: "Order marked as picked up and rent payment recorded.",
    pickupFailed: "Unable to mark picked up.",
  },
};

const ORDER_PAYMENT_TYPE_LABEL_KEYS: Record<OrderPaymentType, string> = {
  RENT: "paymentType.rent",
  DEPOSIT: "paymentType.deposit",
  FEE: "paymentType.fee",
  REFUND: "paymentType.refund",
  EXPENSE: "paymentType.expense",
};

const ORDER_PAYMENT_METHOD_LABEL_KEYS: Record<OrderPaymentMethod, string> = {
  CASH: "paymentMethod.cash",
  BANK: "paymentMethod.bank",
  MOMO: "paymentMethod.momo",
};
const SALES_INVOICES_PAGE_SIZE = 20;

function parseAmount(raw: string): number {
  if (!raw.trim()) return 0;
  const parsed = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function useSalesInvoicesPage(locale: AppLocale) {
  const copy = SALES_INVOICES_COPY[locale];
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId");
  const { currentBranchId, branchAccess } = useAuthAccess();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId);
  const [paymentType, setPaymentType] = useState<OrderPaymentType>("RENT");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  useOrdersListQuery({
    branchId: currentBranchId,
    statuses: ["RESERVED", "CONFIRMED", "PICKED_UP", "RETURNED", "DEBT", "COMPLETED"],
    search,
    page,
    pageSize: SALES_INVOICES_PAGE_SIZE,
  });

  useOrderDetailQuery(selectedOrderId ?? "");
  const paymentMutation = useAddOrderPaymentMutation(selectedOrderId ?? "");
  const pickupMutation = usePickupOrderAnyMutation();

  const orders = ordersStore.listItems;
  const totalPages = (() => {
    if (ordersStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(ordersStore.listTotal / ordersStore.listPageSize));
  })();
  const selectedDetail = selectedOrderId
    ? ordersStore.getDetailByOrderId(selectedOrderId)
    : null;

  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const paymentTypeLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_TYPE_LABEL_KEYS),
    [locale]
  );
  const paymentMethodLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_METHOD_LABEL_KEYS),
    [locale]
  );
  const branchDisplayName = useMemo(() => {
    const activeBranch =
      branchAccess.find((entry) => entry.branchId === currentBranchId) ??
      branchAccess.find((entry) => entry.isDefault) ??
      branchAccess[0] ??
      null;

    return activeBranch?.branchName?.trim() || "KATA";
  }, [branchAccess, currentBranchId]);

  const totalPaid = useMemo(() => {
    if (!selectedDetail) return 0;
    return selectedDetail.payments.reduce((sum, payment) => {
      if (payment.status === "VOIDED") return sum;
      return sum + (payment.type === "REFUND" ? -payment.amount : payment.amount);
    }, 0);
  }, [selectedDetail]);

  const submitPayment = async () => {
    if (!selectedOrderId) return;

    const amount = parseAmount(paymentAmount);
    if (amount <= 0) {
      toast.error(copy.paymentFailed);
      return;
    }

    try {
      await paymentMutation.mutateAsync({
        type: paymentType,
        method: paymentMethod,
        amount,
        note: paymentNote.trim() || null,
        source: "SALES_DESK",
      });

      setPaymentAmount("");
      setPaymentNote("");
      toast.success(copy.paymentSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.paymentFailed;
      toast.error(message);
    }
  };

  const canPickupSelected =
    selectedDetail?.summary.orderType === "RENTAL" &&
    (selectedDetail.summary.status === "RESERVED" ||
      selectedDetail.summary.status === "CONFIRMED");
  const rentOutstanding = selectedDetail
    ? Math.max(
        0,
        selectedDetail.summary.money.rentAmount - selectedDetail.summary.money.rentPaid
      )
    : 0;

  const submitPickup = async () => {
    if (!selectedOrderId || !selectedDetail || !canPickupSelected) return;

    if (rentOutstanding <= 0) {
      toast.error(copy.pickupFailed);
      return;
    }

    try {
      await pickupMutation.mutateAsync({
        orderId: selectedOrderId,
        payload: {
          requireDepositPaid: true,
          note: "SALES_DESK_PICKUP",
          rentalPayment: {
            type: "RENT",
            method: paymentMethod,
            amount: rentOutstanding,
            note: paymentNote.trim() || null,
            source: "SALES_DESK_PICKUP",
          },
        },
      });

      setPaymentAmount("");
      setPaymentNote("");
      toast.success(copy.pickupSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.pickupFailed;
      toast.error(message);
    }
  };

  const printInvoice = () => {
    window.print();
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
    paymentType,
    setPaymentType,
    paymentMethod,
    setPaymentMethod,
    paymentAmount,
    setPaymentAmount,
    paymentNote,
    setPaymentNote,
    paymentTypeLabels,
    paymentMethodLabels,
    branchDisplayName,
    totalPaid,
    canPickupSelected,
    rentOutstanding,
    submitPayment,
    submitPickup,
    submittingPayment: paymentMutation.isPending || pickupMutation.isPending,
    printInvoice,
  };
}
