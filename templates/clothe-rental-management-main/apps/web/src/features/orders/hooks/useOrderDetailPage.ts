"use client";

import { useMemo } from "react";
import {
  ITEM_STATUS_LABEL_KEYS,
  ORDER_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useAddOrderIncidentMutation,
  useAddOrderPaymentMutation,
  useCancelOrderMutation,
  useCompleteOrderMutation,
  useOrderDetailQuery,
  usePickupOrderMutation,
  useProcessOrderReturnMutation,
  useTransitionOrderStatusMutation,
  useUpdateOrderPaymentStatusMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import type {
  OrderIncidentStatus,
  OrderIncidentType,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
} from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface OrderDetailCopy {
  loading: string;
  notFound: string;
  backAction: string;
  editAction: string;
  confirmAction: string;
  pickupAction: string;
  returnAction: string;
  completeAction: string;
  cancelAction: string;
  cancelConfirm: string;
  cancelReasonPrompt: string;
  actionFailed: string;
}

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

const ORDER_PAYMENT_STATUS_LABEL_KEYS: Record<OrderPaymentStatus, string> = {
  POSTED: "paymentStatus.posted",
  VOIDED: "paymentStatus.voided",
};

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

const ORDER_DETAIL_COPY: Record<AppLocale, OrderDetailCopy> = {
  vi: {
    loading: "Đang tải chi tiết đơn thuê...",
    notFound: "Không tìm thấy đơn thuê hoặc bạn không có quyền truy cập.",
    backAction: "Quay lại danh sách đơn",
    editAction: "Sửa đơn",
    confirmAction: "Xác nhận",
    pickupAction: "Nhận đồ",
    returnAction: "Trả đồ",
    completeAction: "Hoàn tất",
    cancelAction: "Hủy đơn",
    cancelConfirm: "Bạn có chắc muốn hủy đơn này?",
    cancelReasonPrompt: "Nhập lý do hủy (tùy chọn)",
    actionFailed: "Thao tác đơn hàng thất bại.",
  },
  en: {
    loading: "Loading order detail...",
    notFound: "Order not found or access denied.",
    backAction: "Back to orders",
    editAction: "Edit order",
    confirmAction: "Confirm",
    pickupAction: "Pick up",
    returnAction: "Return",
    completeAction: "Complete",
    cancelAction: "Cancel order",
    cancelConfirm: "Are you sure you want to cancel this order?",
    cancelReasonPrompt: "Enter cancel reason (optional)",
    actionFailed: "Order action failed.",
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

export function useOrderDetailPage(locale: AppLocale, orderId: string) {
  const copy = ORDER_DETAIL_COPY[locale];
  const { role, can } = useAuthAccess();
  const statusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const itemStatusLabels = useMemo(
    () => buildDomainLabels(locale, ITEM_STATUS_LABEL_KEYS),
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
  const paymentStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_STATUS_LABEL_KEYS),
    [locale]
  );
  const incidentTypeLabels = useMemo(
    () => buildDomainLabels(locale, INCIDENT_TYPE_LABEL_KEYS),
    [locale]
  );
  const incidentStatusLabels = useMemo(
    () => buildDomainLabels(locale, INCIDENT_STATUS_LABEL_KEYS),
    [locale]
  );

  const detailQuery = useOrderDetailQuery(orderId);
  const detail = ordersStore.getDetailByOrderId(orderId);

  const transitionMutation = useTransitionOrderStatusMutation(orderId);
  const pickupMutation = usePickupOrderMutation(orderId);
  const returnMutation = useProcessOrderReturnMutation(orderId);
  const completeMutation = useCompleteOrderMutation(orderId);
  const cancelMutation = useCancelOrderMutation(orderId);
  const addPaymentMutation = useAddOrderPaymentMutation(orderId);
  const updatePaymentStatusMutation = useUpdateOrderPaymentStatusMutation(orderId);
  const addIncidentMutation = useAddOrderIncidentMutation(orderId);

  const canEdit = detail
    ? detail.summary.status === "DRAFT" || detail.summary.status === "RESERVED"
    : false;

  const canCancel = detail
    ? isManagerPlusRole(role) &&
      (detail.summary.orderType === "SALE"
        ? detail.summary.status === "DRAFT" ||
          detail.summary.status === "CONFIRMED" ||
          detail.summary.status === "DEBT" ||
          detail.summary.status === "COMPLETED"
        : detail.summary.status === "DRAFT" ||
          detail.summary.status === "RESERVED" ||
          detail.summary.status === "CONFIRMED")
    : false;

  const canManagePaymentStatus = can("payments.update_status_manual");

  return {
    copy,
    statusLabels,
    itemStatusLabels,
    paymentTypeLabels,
    paymentMethodLabels,
    paymentStatusLabels,
    incidentTypeLabels,
    incidentStatusLabels,
    detail,
    detailQuery,
    canEdit,
    canCancel,
    canManagePaymentStatus,
    transitionMutation,
    pickupMutation,
    returnMutation,
    completeMutation,
    cancelMutation,
    addPaymentMutation,
    updatePaymentStatusMutation,
    addIncidentMutation,
  };
}
