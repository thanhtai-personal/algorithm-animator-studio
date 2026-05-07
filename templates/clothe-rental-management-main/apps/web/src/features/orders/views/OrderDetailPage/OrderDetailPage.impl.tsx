"use client";

import Link from "next/link";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ArrowLeft, CalendarClock, PackageCheck, UserRound, Wallet } from "lucide-react";
import type { ItemStatus, OrderStatus } from "@/types/domainPrimitives";
import type {
  OrderPaymentMethod,
  OrderPaymentType,
  ReturnItemCondition,
  ReturnItemTargetStatus,
} from "@/types/ordersDomain";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { StatusBadge } from "@/components/feedback/StatusBadge";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { useOrderDetailPage } from "@/features/orders/hooks/useOrderDetailPage";
import { cn } from "@/utils/className";
import { buildDomainLabels } from "@/utils/domainLabels";
import { formatDateLabel } from "@/utils/format/date";
import { formatMoney } from "@/utils/format/money";
import { paginateItems } from "@/utils/pagination";

interface OrderDetailPageProps {
  locale: AppLocale;
  orderId: string;
}

type DetailTabKey = "summary" | "items" | "payments" | "incidents" | "activity";

type ReturnItemDraft = {
  condition: ReturnItemCondition;
  note: string;
  incidentAmount: string;
  applyToDeposit: boolean;
  targetStatus: ReturnItemTargetStatus;
};

const ITEM_STATUS_SET = new Set<ItemStatus>([
  "READY",
  "RESERVED",
  "ON_RENT",
  "LAUNDRY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
  "SOLD",
  "RETIRED",
]);

const ORDER_PAYMENT_TYPES: OrderPaymentType[] = ["RENT", "DEPOSIT", "FEE", "REFUND"];
const ORDER_PAYMENT_METHODS: OrderPaymentMethod[] = ["CASH", "BANK", "MOMO"];
const RETURN_ITEM_CONDITIONS: ReturnItemCondition[] = ["OK", "NEED_CLEAN", "DAMAGE", "LOST"];
const RETURN_ITEM_TARGET_STATUSES: ReturnItemTargetStatus[] = [
  "LAUNDRY",
  "READY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
];
const RETURN_CONDITION_LABEL_KEYS: Record<ReturnItemCondition, string> = {
  OK: "returnCondition.ok",
  NEED_CLEAN: "returnCondition.needClean",
  DAMAGE: "returnCondition.damage",
  LOST: "returnCondition.lost",
};
const RENTAL_PROGRESS_STEPS: OrderStatus[] = [
  "DRAFT",
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
  "RETURNED",
  "DEBT",
  "COMPLETED",
];
const SALE_PROGRESS_STEPS: OrderStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "DEBT",
  "COMPLETED",
];
const ORDER_DETAIL_ITEMS_PAGE_SIZE = 10;
const ORDER_DETAIL_PAYMENTS_PAGE_SIZE = 10;
const ORDER_DETAIL_INCIDENTS_PAGE_SIZE = 10;
const ORDER_DETAIL_ACTIVITY_PAGE_SIZE = 10;

const PAGE_COPY = {
  vi: {
    tabs: {
      summary: "Tổng quan",
      items: "Items",
      payments: "Thanh toán",
      incidents: "Sự cố",
      activity: "Lịch sử",
    },
    summary: {
      customer: "Khách hàng",
      period: "Khoảng thuê",
      total: "Tổng tiền",
      deposit: "Tiền cọc",
      rentSubtotal: "Tiền thuê gốc",
      discount: "Giảm giá",
      fees: "Phụ phí",
      outstanding: "Còn thiếu",
      revenueGross: "Doanh thu gộp",
      revenueNet: "Doanh thu thuần",
      cogs: "Giá vốn hàng bán (COGS)",
      grossProfit: "Lợi nhuận gộp",
      profitMargin: "Biên lợi nhuận",
      depositRequired: "Cọc yêu cầu",
      depositPaid: "Đã thu cọc",
      depositApplied: "Đã trừ cọc",
      depositRefunded: "Đã hoàn cọc",
      refundableDeposit: "Cọc còn hoàn",
      refundPaid: "Hoàn tiền đã ghi nhận",
      note: "Ghi chú đơn",
      internalNote: "Ghi chú nội bộ",
      reservationWindows: "Reservation windows",
      noReservationWindow: "Không có reservation window.",
    },
    items: {
      title: "Danh sách items",
      itemCode: "Mã item",
      product: "Sản phẩm",
      variant: "Biến thể",
      status: "Trạng thái",
      rent: "Tiền thuê",
      deposit: "Phần cọc",
      conditionOut: "Ghi chú khi giao",
      conditionIn: "Ghi chú khi nhận lại",
      empty: "Đơn chưa có item.",
    },
    payments: {
      title: "Thanh toán thủ công",
      date: "Thời gian",
      type: "Loại",
      method: "Phương thức",
      status: "Trạng thái",
      amount: "Số tiền",
      note: "Ghi chú",
      actions: "Thao tác",
      addTitle: "Thêm giao dịch",
      addAction: "Thêm payment",
      reason: "Lý do",
      referenceCode: "Mã tham chiếu",
      noData: "Chưa có payment.",
      voidAction: "Xóa",
      repostAction: "Khôi phục",
      voidReasonPrompt: "Nhập lý do xóa (tùy chọn)",
    },
    incidents: {
      title: "Sự cố",
      date: "Thời gian",
      item: "Item",
      type: "Loại",
      status: "Trạng thái",
      amount: "Chi phí",
      applyToDeposit: "Trừ cọc",
      description: "Mô tả",
      addTitle: "Tạo incident",
      addAction: "Lưu incident",
      noData: "Chưa có incident.",
      yes: "Có",
      no: "Không",
    },
    activity: {
      title: "Audit log",
      when: "Thời gian",
      action: "Hành động",
      reason: "Lý do",
      actor: "Người thao tác",
      detail: "Chi tiết",
      noData: "Chưa có activity.",
    },
    pickup: {
      title: "Pick up checklist",
      description: "Xác nhận giao đồ và khóa trạng thái ON_RENT.",
      verifyItems: "Đã kiểm tra đủ item thực tế",
      verifyDeposit: "Yêu cầu đã thu đủ cọc trước khi pick up",
      noteLabel: "Ghi chú pick up",
      confirmAction: "Xác nhận Pick up",
    },
    returnFlow: {
      title: "Trả đồ",
      description: "Checklist tình trạng, phí phát sinh và settlement cọc.",
      condition: "Tình trạng",
      itemNote: "Ghi chú item",
      incidentAmount: "Phí incident",
      applyToDeposit: "Trừ vào cọc",
      targetStatus: "Trạng thái item sau trả",
      customFeesAmount: "Phí thêm (không gắn item)",
      additionalCollectedAmount: "Thu thêm khi trả hàng",
      additionalCollectionMethod: "Phương thức thu thêm",
      additionalCollectionNote: "Ghi chú thu thêm",
      outstandingBeforeReturn: "Còn thiếu trước khi trả",
      estimatedAdditionalCharge: "Phát sinh dự kiến",
      estimatedOutstandingAfterReturn: "Còn thiếu ước tính sau trả",
      estimatedHint: "Ước tính chưa gồm phí trễ tự động (nếu có).",
      refundAmount: "Tiền hoàn cọc",
      refundMethod: "Phương thức hoàn",
      refundReason: "Lý do hoàn",
      refundNote: "Ghi chú hoàn",
      completeAfterReturn: "Tự chuyển COMPLETED sau khi return",
      submitAction: "Xác nhận Return",
    },
    cancel: {
      title: "Hủy đơn",
      description: "Hủy đơn, giải phóng reservation lock và tùy chọn hoàn cọc.",
      reason: "Lý do hủy",
      refundAmount: "Tiền hoàn",
      refundMethod: "Phương thức hoàn",
      refundReason: "Lý do hoàn",
      refundNote: "Ghi chú hoàn",
      submitAction: "Xác nhận hủy đơn",
    },
    common: {
      save: "Lưu",
      close: "Đóng",
      cancel: "Hủy",
      requiredNumber: "Giá trị số không hợp lệ.",
      running: "Đang xử lý...",
    },
  },
  en: {
    tabs: {
      summary: "Summary",
      items: "Items",
      payments: "Payments",
      incidents: "Incidents",
      activity: "Activity",
    },
    summary: {
      customer: "Customer",
      period: "Period",
      total: "Total",
      deposit: "Deposit",
      rentSubtotal: "Rent subtotal",
      discount: "Discount",
      fees: "Fees",
      outstanding: "Outstanding",
      revenueGross: "Revenue gross",
      revenueNet: "Revenue net",
      cogs: "Cost of Goods Sold (COGS)",
      grossProfit: "Gross profit",
      profitMargin: "Profit margin",
      depositRequired: "Deposit required",
      depositPaid: "Deposit paid",
      depositApplied: "Deposit applied",
      depositRefunded: "Deposit refunded",
      refundableDeposit: "Refundable deposit",
      refundPaid: "Refund paid",
      note: "Order note",
      internalNote: "Internal note",
      reservationWindows: "Reservation windows",
      noReservationWindow: "No reservation windows.",
    },
    items: {
      title: "Order items",
      itemCode: "Item code",
      product: "Product",
      variant: "Variant",
      status: "Status",
      rent: "Rent",
      deposit: "Deposit share",
      conditionOut: "Condition out",
      conditionIn: "Condition in",
      empty: "No items in this order.",
    },
    payments: {
      title: "Manual payments",
      date: "Date",
      type: "Type",
      method: "Method",
      status: "Status",
      amount: "Amount",
      note: "Note",
      actions: "Actions",
      addTitle: "Add payment",
      addAction: "Add payment",
      reason: "Reason",
      referenceCode: "Reference code",
      noData: "No payments yet.",
      voidAction: "Delete",
      repostAction: "Re-post",
      voidReasonPrompt: "Enter delete reason (optional)",
    },
    incidents: {
      title: "Incidents",
      date: "Date",
      item: "Item",
      type: "Type",
      status: "Status",
      amount: "Amount",
      applyToDeposit: "Apply to deposit",
      description: "Description",
      addTitle: "Create incident",
      addAction: "Save incident",
      noData: "No incidents yet.",
      yes: "Yes",
      no: "No",
    },
    activity: {
      title: "Activity log",
      when: "When",
      action: "Action",
      reason: "Reason",
      actor: "Actor",
      detail: "Detail",
      noData: "No activity yet.",
    },
    pickup: {
      title: "Pick up checklist",
      description: "Confirm handover and switch items to ON_RENT.",
      verifyItems: "I verified physical items",
      verifyDeposit: "Require full deposit before pickup",
      noteLabel: "Pickup note",
      confirmAction: "Confirm pickup",
    },
    returnFlow: {
      title: "Return wizard",
      description: "Checklist conditions, extra fees, and deposit settlement.",
      condition: "Condition",
      itemNote: "Item note",
      incidentAmount: "Incident amount",
      applyToDeposit: "Apply to deposit",
      targetStatus: "Target item status",
      customFeesAmount: "Extra fees (not linked to item)",
      additionalCollectedAmount: "Additional collection",
      additionalCollectionMethod: "Collection method",
      additionalCollectionNote: "Collection note",
      outstandingBeforeReturn: "Outstanding before return",
      estimatedAdditionalCharge: "Estimated additional charge",
      estimatedOutstandingAfterReturn: "Estimated outstanding after return",
      estimatedHint: "Estimate excludes any auto late-fee calculation.",
      refundAmount: "Refund amount",
      refundMethod: "Refund method",
      refundReason: "Refund reason",
      refundNote: "Refund note",
      completeAfterReturn: "Auto-complete after return",
      submitAction: "Confirm return",
    },
    cancel: {
      title: "Cancel order",
      description: "Cancel order, release reservation locks, and optionally refund.",
      reason: "Cancel reason",
      refundAmount: "Refund amount",
      refundMethod: "Refund method",
      refundReason: "Refund reason",
      refundNote: "Refund note",
      submitAction: "Confirm cancel",
    },
    common: {
      save: "Save",
      close: "Close",
      cancel: "Cancel",
      requiredNumber: "Invalid numeric input.",
      running: "Processing...",
    },
  },
} as const;

function isItemStatus(value: string | null): value is ItemStatus {
  if (!value) return false;
  return ITEM_STATUS_SET.has(value as ItemStatus);
}

function parseNonNegativeNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function roundMoneyValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function formatDateTimeLabel(value: string | null, locale: AppLocale): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function resolvePaymentAmountClassName(
  paymentType: OrderPaymentType,
  paymentStatus: "POSTED" | "VOIDED"
): string {
  if (paymentStatus !== "POSTED") return "text-muted-foreground";
  if (paymentType === "REFUND" || paymentType === "EXPENSE") return "text-destructive";
  return "text-success";
}

function resolveSignedProfitClassName(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "text-foreground";
}

function defaultTargetStatus(condition: ReturnItemCondition): ReturnItemTargetStatus {
  if (condition === "LOST") return "LOST";
  if (condition === "DAMAGE") return "MAINTENANCE";
  return "LAUNDRY";
}

function buildReturnDraftMap(orderItemIds: string[]): Record<string, ReturnItemDraft> {
  const next: Record<string, ReturnItemDraft> = {};
  for (const orderItemId of orderItemIds) {
    next[orderItemId] = {
      condition: "OK",
      note: "",
      incidentAmount: "0",
      applyToDeposit: true,
      targetStatus: "LAUNDRY",
    };
  }
  return next;
}

function renderActivityAction(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const OrderDetailPage = observer(function OrderDetailPage({
  locale,
  orderId,
}: OrderDetailPageProps) {
  const { prompt } = useAppModal();
  const {
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
  } = useOrderDetailPage(locale, orderId);

  const text = PAGE_COPY[locale];
  const [activeTab, setActiveTab] = useState<DetailTabKey>("summary");
  const [actionError, setActionError] = useState<string | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const [pickupOpen, setPickupOpen] = useState(false);
  const [pickupVerifiedItems, setPickupVerifiedItems] = useState(false);
  const [pickupRequireDepositPaid, setPickupRequireDepositPaid] = useState(true);
  const [pickupNote, setPickupNote] = useState("");

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnCustomFeesAmount, setReturnCustomFeesAmount] = useState("0");
  const [returnRefundAmount, setReturnRefundAmount] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<OrderPaymentMethod>("CASH");
  const [returnRefundReason, setReturnRefundReason] = useState("");
  const [returnRefundNote, setReturnRefundNote] = useState("");
  const [returnAdditionalCollectedAmount, setReturnAdditionalCollectedAmount] = useState("0");
  const [returnAdditionalCollectionMethod, setReturnAdditionalCollectionMethod] =
    useState<OrderPaymentMethod>("CASH");
  const [returnAdditionalCollectionNote, setReturnAdditionalCollectionNote] = useState("");
  const [returnCompleteAfter, setReturnCompleteAfter] = useState(false);
  const [returnItemsDraft, setReturnItemsDraft] = useState<Record<string, ReturnItemDraft>>({});

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundAmount, setCancelRefundAmount] = useState("");
  const [cancelRefundMethod, setCancelRefundMethod] = useState<OrderPaymentMethod>("CASH");
  const [cancelRefundReason, setCancelRefundReason] = useState("");
  const [cancelRefundNote, setCancelRefundNote] = useState("");

  const [paymentType, setPaymentType] = useState<OrderPaymentType>("DEPOSIT");
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>("CASH");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentReferenceCode, setPaymentReferenceCode] = useState("");

  const [incidentOrderItemId, setIncidentOrderItemId] = useState("");
  const [incidentType, setIncidentType] = useState<"LATE" | "DAMAGE" | "LOST" | "CLEANING">("DAMAGE");
  const [incidentAmount, setIncidentAmount] = useState("0");
  const [incidentApplyToDeposit, setIncidentApplyToDeposit] = useState(true);
  const [incidentDescription, setIncidentDescription] = useState("");
  const returnConditionLabels = useMemo(
    () => buildDomainLabels(locale, RETURN_CONDITION_LABEL_KEYS),
    [locale]
  );

  const pendingAction =
    transitionMutation.isPending ||
    pickupMutation.isPending ||
    returnMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending ||
    addPaymentMutation.isPending ||
    updatePaymentStatusMutation.isPending ||
    addIncidentMutation.isPending;

  const hasItems = Boolean(detail?.items.length);
  const defaultPaymentAmount =
    detail &&
    Number.isFinite(detail.summary.money.outstandingAmount) &&
    detail.summary.money.outstandingAmount > 0
      ? String(detail.summary.money.outstandingAmount)
      : detail &&
          detail.payments.length === 0 &&
          Number.isFinite(detail.summary.money.totalAmount)
        ? String(detail.summary.money.totalAmount)
        : "0";
  const returnEstimatedIncidentAmount = useMemo(() => {
    if (!detail) return 0;

    return roundMoneyValue(
      detail.items.reduce((sum, item) => {
        const parsed = parseNonNegativeNumber(
          returnItemsDraft[item.orderItemId]?.incidentAmount ?? "0"
        );
        return sum + (parsed ?? 0);
      }, 0)
    );
  }, [detail, returnItemsDraft]);
  const returnEstimatedCustomFees = parseNonNegativeNumber(returnCustomFeesAmount) ?? 0;
  const returnEstimatedAdditionalCharge = roundMoneyValue(
    returnEstimatedIncidentAmount + returnEstimatedCustomFees
  );
  const returnCollectedAmountParsed =
    parseNonNegativeNumber(returnAdditionalCollectedAmount) ?? 0;
  const returnOutstandingBefore = roundMoneyValue(
    detail?.summary.money.outstandingAmount ?? 0
  );
  const returnEstimatedOutstandingAfter = roundMoneyValue(
    Math.max(
      0,
      returnOutstandingBefore +
        returnEstimatedAdditionalCharge -
        returnCollectedAmountParsed
    )
  );

  const tabItems = useMemo(
    () => [
      { key: "summary" as const, label: text.tabs.summary },
      { key: "items" as const, label: text.tabs.items },
      { key: "payments" as const, label: text.tabs.payments },
      { key: "incidents" as const, label: text.tabs.incidents },
      { key: "activity" as const, label: text.tabs.activity },
    ],
    [text]
  );

  useEffect(() => {
    if (!defaultPaymentAmount) return;
    setPaymentAmount((previous) => (previous.trim() ? previous : defaultPaymentAmount));
  }, [defaultPaymentAmount]);

  if (detailQuery.isLoading && !detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {copy.loading}
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-sm text-destructive">
        {copy.notFound}
      </section>
    );
  }

  const openPickupDrawer = () => {
    setPickupVerifiedItems(false);
    setPickupRequireDepositPaid(true);
    setPickupNote("");
    setActionError(null);
    setPickupOpen(true);
  };

  const openReturnDrawer = () => {
    const draftByItemId = buildReturnDraftMap(detail.items.map((item) => item.orderItemId));
    setReturnItemsDraft(draftByItemId);
    setReturnCustomFeesAmount("0");
    setReturnRefundAmount(String(detail.summary.money.refundableDeposit || 0));
    setReturnRefundMethod("CASH");
    setReturnRefundReason("");
    setReturnRefundNote("");
    setReturnAdditionalCollectedAmount("0");
    setReturnAdditionalCollectionMethod("CASH");
    setReturnAdditionalCollectionNote("");
    setReturnCompleteAfter(false);
    setActionError(null);
    setReturnOpen(true);
  };

  const openCancelDrawer = () => {
    setCancelReason("");
    setCancelRefundAmount(String(detail.summary.money.refundableDeposit || 0));
    setCancelRefundMethod("CASH");
    setCancelRefundReason("");
    setCancelRefundNote("");
    setActionError(null);
    setCancelOpen(true);
  };

  const setReturnItemDraft = (orderItemId: string, patch: Partial<ReturnItemDraft>) => {
    setReturnItemsDraft((previous) => ({
      ...previous,
      [orderItemId]: {
        ...(previous[orderItemId] ?? {
          condition: "OK",
          note: "",
          incidentAmount: "0",
          applyToDeposit: true,
          targetStatus: "LAUNDRY",
        }),
        ...patch,
      },
    }));
  };

  const activeOrderStatus = detail.summary.status;
  const progressSteps =
    detail.summary.orderType === "SALE" ? SALE_PROGRESS_STEPS : RENTAL_PROGRESS_STEPS;
  const activeStepIndex = progressSteps.indexOf(activeOrderStatus);
  const itemsPagination = paginateItems(detail.items, itemsPage, ORDER_DETAIL_ITEMS_PAGE_SIZE);
  const paymentsPagination = paginateItems(
    detail.payments,
    paymentsPage,
    ORDER_DETAIL_PAYMENTS_PAGE_SIZE
  );
  const incidentsPagination = paginateItems(
    detail.incidents,
    incidentsPage,
    ORDER_DETAIL_INCIDENTS_PAGE_SIZE
  );
  const activityPagination = paginateItems(
    detail.activity,
    activityPage,
    ORDER_DETAIL_ACTIVITY_PAGE_SIZE
  );
  const pageLabel = locale === "vi" ? "Trang" : "Page";
  const prevLabel = locale === "vi" ? "Trước" : "Prev";
  const nextLabel = locale === "vi" ? "Sau" : "Next";

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}/orders`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {copy.backAction}
          </Link>

          <StatusBadge kind="order" status={detail.summary.status} labels={statusLabels} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{detail.summary.orderCode}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.summary.customer.fullName} · {detail.summary.itemCount} items
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {canEdit ? (
                <Link
                  href={`/${locale}/orders/${detail.summary.id}/edit`}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent"
                >
                  {copy.editAction}
                </Link>
              ) : null}

              {(activeOrderStatus === "DRAFT" ||
                (detail.summary.orderType === "RENTAL" &&
                  activeOrderStatus === "RESERVED")) ? (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={async () => {
                    try {
                      setActionError(null);
                      await transitionMutation.mutateAsync({ toStatus: "CONFIRMED" });
                      toast.success(
                        locale === "vi"
                          ? `Đơn ${detail.summary.orderCode} đã được xác nhận.`
                          : `Order ${detail.summary.orderCode} confirmed.`
                      );
                    } catch (error) {
                      const message = error instanceof Error ? error.message : copy.actionFailed;
                      setActionError(message);
                      toast.error(message);
                    }
                  }}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {copy.confirmAction}
                </button>
              ) : null}

              {detail.summary.orderType === "RENTAL" &&
              (activeOrderStatus === "RESERVED" || activeOrderStatus === "CONFIRMED") ? (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={openPickupDrawer}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {copy.pickupAction}
                </button>
              ) : null}

              {detail.summary.orderType === "RENTAL" && activeOrderStatus === "PICKED_UP" ? (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={openReturnDrawer}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {copy.returnAction}
                </button>
              ) : null}

              {((detail.summary.orderType === "RENTAL" && activeOrderStatus === "RETURNED") ||
                (detail.summary.orderType === "SALE" && activeOrderStatus === "CONFIRMED")) ? (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={async () => {
                    try {
                      setActionError(null);
                      const nextDetail = await completeMutation.mutateAsync();
                      const nextStatus = nextDetail.summary.status;

                      if (nextStatus === "DEBT") {
                        toast.success(
                          locale === "vi"
                            ? `Đơn ${detail.summary.orderCode} còn nợ và đã chuyển sang trạng thái Đơn nợ.`
                            : `Order ${detail.summary.orderCode} still has debt and moved to debt status.`
                        );
                      } else {
                        toast.success(
                          locale === "vi"
                            ? `Đơn ${detail.summary.orderCode} đã hoàn tất.`
                            : `Order ${detail.summary.orderCode} completed.`
                        );
                      }
                    } catch (error) {
                      const message = error instanceof Error ? error.message : copy.actionFailed;
                      setActionError(message);
                      toast.error(message);
                    }
                  }}
                  className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {copy.completeAction}
                </button>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  disabled={pendingAction}
                  onClick={openCancelDrawer}
                  className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                >
                  {copy.cancelAction}
                </button>
              ) : null}
            </div>
          </div>

          <article className="grid gap-2 rounded-2xl border border-border bg-muted/20 p-3">
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              {text.summary.customer}
            </p>
            <p className="text-sm font-semibold text-foreground">{detail.summary.customer.fullName}</p>
            <p className="text-xs text-muted-foreground">{detail.summary.customer.phone ?? "-"}</p>

            <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {text.summary.period}
            </p>
            <p className="text-xs font-semibold text-foreground">
              {detail.summary.orderType === "SALE"
                ? "-"
                : `${formatDateLabel(detail.summary.startDate, { locale })} - ${formatDateLabel(detail.summary.endDate, { locale })}`}
            </p>

            <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              {text.summary.total}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatMoney(detail.summary.money.totalAmount, { locale, currency: "VND" }) || "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {text.summary.outstanding}:{" "}
              <span className="font-semibold text-warning">
                {formatMoney(detail.summary.money.outstandingAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <PackageCheck className="h-3.5 w-3.5" />
              {detail.summary.itemCount} items
            </p>
          </article>
        </div>
      </header>

      {activeOrderStatus === "CANCELLED" ? (
        <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            {statusLabels.CANCELLED}
          </p>
          <p className="mt-1 text-sm text-foreground">{detail.summary.cancelReason ?? "-"}</p>
        </section>
      ) : (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <ol
            className={cn(
              "grid gap-3",
              progressSteps.length === 4 ? "md:grid-cols-4" : "md:grid-cols-7"
            )}
          >
            {progressSteps.map((step, index) => {
              const isActive = index === activeStepIndex;
              const isCompleted = activeStepIndex >= 0 && index < activeStepIndex;
              const isUpcoming = activeStepIndex >= 0 ? index > activeStepIndex : true;

              return (
                <li
                  key={step}
                  className={cn(
                    "rounded-2xl border p-3",
                    isActive && "border-primary/40 bg-primary/5",
                    isCompleted && "border-success/40 bg-success/5",
                    isUpcoming && "border-border bg-muted/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-success text-success-foreground",
                      isUpcoming && "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                    {statusLabels[step]}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {actionError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {actionError}
        </p>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabItems.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-xl px-3.5 py-2 text-xs font-semibold transition",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "summary" ? (
        <section className="space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{text.summary.customer}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{detail.summary.customer.fullName}</p>
              <p className="text-xs text-muted-foreground">{detail.summary.customer.phone ?? "-"}</p>
            </article>

            <article className="rounded-2xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{text.summary.period}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {detail.summary.orderType === "SALE"
                  ? "-"
                  : `${formatDateLabel(detail.summary.startDate, { locale })} - ${formatDateLabel(detail.summary.endDate, { locale })}`}
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{text.summary.total}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatMoney(detail.summary.money.totalAmount, { locale, currency: "VND" }) || "-"}
              </p>
            </article>

            <article className="rounded-2xl border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{text.summary.deposit}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {formatMoney(detail.summary.money.depositAmount, { locale, currency: "VND" }) || "-"}
              </p>
            </article>
          </div>

          <div className="grid gap-2 rounded-2xl border border-border bg-muted/10 p-3 md:grid-cols-2">
            <p className="text-sm text-muted-foreground">
              {text.summary.rentSubtotal}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.rentAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.discount}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.discountAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.fees}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.feesAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.outstanding}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.outstandingAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.revenueGross}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.revenueGross, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.revenueNet}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.revenueNet, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.cogs}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.cogs, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.grossProfit}: {" "}
              <span
                className={cn(
                  "font-semibold",
                  resolveSignedProfitClassName(detail.summary.money.grossProfit)
                )}
              >
                {formatMoney(detail.summary.money.grossProfit, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.profitMargin}: {" "}
              <span
                className={cn(
                  "font-semibold",
                  resolveSignedProfitClassName(detail.summary.money.profitMargin)
                )}
              >
                {(detail.summary.money.profitMargin * 100).toFixed(2)}%
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.depositRequired}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.depositAmount, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.depositPaid}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.depositPaid, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.depositApplied}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.depositAppliedAmount, {
                  locale,
                  currency: "VND",
                }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.depositRefunded}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.depositRefundedAmount, {
                  locale,
                  currency: "VND",
                }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.refundableDeposit}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.refundableDeposit, {
                  locale,
                  currency: "VND",
                }) || "-"}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {text.summary.refundPaid}: {" "}
              <span className="font-semibold text-foreground">
                {formatMoney(detail.summary.money.refundPaid, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-border bg-muted/10 p-3 text-sm text-muted-foreground">
            <p>
              {text.summary.note}: {detail.summary.note ?? "-"}
            </p>
            <p>
              {text.summary.internalNote}: {detail.summary.internalNote ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-3">
            <h3 className="text-sm font-semibold text-foreground">{text.summary.reservationWindows}</h3>
            {detail.reservationWindows.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{text.summary.noReservationWindow}</p>
            ) : (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {detail.reservationWindows.map((windowEntry) => (
                  <p key={windowEntry.id}>
                    {windowEntry.itemId} | {windowEntry.startDate} - {windowEntry.endDate} | {" "}
                    {windowEntry.isActive ? "active" : "released"}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "items" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-md">
          <h2 className="text-lg font-semibold text-foreground">{text.items.title}</h2>

          {detail.items.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{text.items.empty}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">{text.items.itemCode}</th>
                      <th className="px-3 py-2">{text.items.product}</th>
                      <th className="px-3 py-2">{text.items.variant}</th>
                      <th className="px-3 py-2">{text.items.status}</th>
                      <th className="px-3 py-2">{text.items.rent}</th>
                      <th className="px-3 py-2">{text.items.deposit}</th>
                      <th className="px-3 py-2">{text.items.conditionOut}</th>
                      <th className="px-3 py-2">{text.items.conditionIn}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsPagination.items.map((item) => (
                      <tr
                        key={item.orderItemId}
                        className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">{item.itemCode ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{item.productName ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{item.variantName ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {isItemStatus(item.itemStatus) ? (
                            <StatusBadge kind="item" status={item.itemStatus} labels={itemStatusLabels} />
                          ) : (
                            item.itemStatus ?? "-"
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatMoney(item.rentPrice, { locale, currency: "VND" }) || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatMoney(item.depositEffectiveAmount ?? 0, {
                            locale,
                            currency: "VND",
                          }) || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{item.conditionOutNote ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{item.conditionInNote ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setItemsPage(Math.max(1, itemsPagination.page - 1))}
                  disabled={itemsPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {itemsPagination.page}/{itemsPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setItemsPage(Math.min(itemsPagination.totalPages, itemsPagination.page + 1))
                  }
                  disabled={itemsPagination.page >= itemsPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "payments" ? (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md">
          <h2 className="text-lg font-semibold text-foreground">{text.payments.title}</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">{text.payments.date}</th>
                  <th className="px-3 py-2">{text.payments.type}</th>
                  <th className="px-3 py-2">{text.payments.method}</th>
                  <th className="px-3 py-2">{text.payments.status}</th>
                  <th className="px-3 py-2">{text.payments.amount}</th>
                  <th className="px-3 py-2">{text.payments.note}</th>
                  <th className="px-3 py-2">{text.payments.actions}</th>
                </tr>
              </thead>
              <tbody>
                {detail.payments.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-xs text-muted-foreground" colSpan={7}>
                      {text.payments.noData}
                    </td>
                  </tr>
                ) : (
                  paymentsPagination.items.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {formatDateTimeLabel(payment.createdAt, locale)}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {paymentTypeLabels[payment.type]}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {paymentMethodLabels[payment.method]}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        <StatusBadge
                          kind="payment"
                          status={payment.status}
                          labels={paymentStatusLabels}
                        />
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-xs font-semibold",
                          resolvePaymentAmountClassName(payment.type, payment.status)
                        )}
                      >
                        {formatMoney(payment.amount, { locale, currency: "VND" }) || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{payment.note ?? "-"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {canManagePaymentStatus ? (
                          <button
                            type="button"
                            disabled={pendingAction}
                            onClick={async () => {
                              try {
                                setActionError(null);
                                if (payment.status === "POSTED") {
                                  const reason = await prompt({
                                    title: text.payments.voidReasonPrompt,
                                  });
                                  await updatePaymentStatusMutation.mutateAsync({
                                    paymentId: payment.id,
                                    payload: {
                                      status: "VOIDED",
                                      voidReason: reason?.trim() ? reason : null,
                                    },
                                  });
                                  toast.success(
                                    locale === "vi"
                                      ? "Đã xóa payment."
                                      : "Payment deleted."
                                  );
                                  return;
                                }

                                await updatePaymentStatusMutation.mutateAsync({
                                  paymentId: payment.id,
                                  payload: {
                                    status: "POSTED",
                                  },
                                });
                                toast.success(
                                  locale === "vi"
                                    ? "Đã khôi phục payment."
                                    : "Payment restored."
                                );
                              } catch (error) {
                                const message = error instanceof Error ? error.message : copy.actionFailed;
                                setActionError(message);
                                toast.error(message);
                              }
                            }}
                            className="rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground disabled:opacity-50"
                          >
                            {payment.status === "POSTED"
                              ? text.payments.voidAction
                              : text.payments.repostAction}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {detail.payments.length > 0 ? (
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() =>
                  setPaymentsPage(Math.max(1, paymentsPagination.page - 1))
                }
                disabled={paymentsPagination.page <= 1}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {prevLabel}
              </button>
              <span>
                {pageLabel} {paymentsPagination.page}/{paymentsPagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPaymentsPage(
                    Math.min(paymentsPagination.totalPages, paymentsPagination.page + 1)
                  )
                }
                disabled={paymentsPagination.page >= paymentsPagination.totalPages}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {nextLabel}
              </button>
            </div>
          ) : null}

          <form
            className="grid gap-3 rounded-xl border border-border p-3"
            onSubmit={async (event) => {
              event.preventDefault();

              const parsedAmount = parseNonNegativeNumber(paymentAmount);
              if (parsedAmount === null || parsedAmount <= 0) {
                const message = text.common.requiredNumber;
                setActionError(message);
                toast.error(message);
                return;
              }

              try {
                setActionError(null);
                await addPaymentMutation.mutateAsync({
                  type: paymentType,
                  method: paymentMethod,
                  amount: parsedAmount,
                  reason: paymentReason || null,
                  note: paymentNote || null,
                  referenceCode: paymentReferenceCode || null,
                });
                toast.success(
                  locale === "vi" ? "Đã thêm payment thành công." : "Payment added successfully."
                );

                setPaymentAmount("");
                setPaymentReason("");
                setPaymentNote("");
                setPaymentReferenceCode("");
              } catch (error) {
                const message = error instanceof Error ? error.message : copy.actionFailed;
                setActionError(message);
                toast.error(message);
              }
            }}
          >
            <h3 className="text-sm font-semibold text-foreground">{text.payments.addTitle}</h3>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">{text.payments.type}</span>
                <select
                  value={paymentType}
                  onChange={(event) => setPaymentType(event.target.value as OrderPaymentType)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {ORDER_PAYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {paymentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">{text.payments.method}</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as OrderPaymentMethod)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  {ORDER_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">{text.payments.amount}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{text.payments.reason}</span>
              <input
                type="text"
                value={paymentReason}
                onChange={(event) => setPaymentReason(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{text.payments.referenceCode}</span>
              <input
                type="text"
                value={paymentReferenceCode}
                onChange={(event) => setPaymentReferenceCode(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>

            <VoiceDictationField
              locale={locale}
              label={text.payments.note}
              value={paymentNote}
              onValueChange={setPaymentNote}
              language={locale === "vi" ? "vi-VN" : "en-US"}
              rows={2}
            />

            <div>
              <button
                type="submit"
                disabled={pendingAction}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
              >
                {pendingAction ? text.common.running : text.payments.addAction}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "incidents" ? (
        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-md">
          <h2 className="text-lg font-semibold text-foreground">{text.incidents.title}</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">{text.incidents.date}</th>
                  <th className="px-3 py-2">{text.incidents.item}</th>
                  <th className="px-3 py-2">{text.incidents.type}</th>
                  <th className="px-3 py-2">{text.incidents.status}</th>
                  <th className="px-3 py-2">{text.incidents.amount}</th>
                  <th className="px-3 py-2">{text.incidents.applyToDeposit}</th>
                  <th className="px-3 py-2">{text.incidents.description}</th>
                </tr>
              </thead>
              <tbody>
                {detail.incidents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-xs text-muted-foreground" colSpan={7}>
                      {text.incidents.noData}
                    </td>
                  </tr>
                ) : (
                  incidentsPagination.items.map((incident) => {
                    const linkedItem = detail.items.find(
                      (item) => item.orderItemId === incident.orderItemId
                    );

                    return (
                      <tr
                        key={incident.id}
                        className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDateTimeLabel(incident.createdAt, locale)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {linkedItem?.itemCode ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {incidentTypeLabels[incident.type]}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {incidentStatusLabels[incident.status]}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatMoney(incident.amount, { locale, currency: "VND" }) || "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {incident.applyToDeposit ? text.incidents.yes : text.incidents.no}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {incident.description ?? "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {detail.incidents.length > 0 ? (
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() =>
                  setIncidentsPage(Math.max(1, incidentsPagination.page - 1))
                }
                disabled={incidentsPagination.page <= 1}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {prevLabel}
              </button>
              <span>
                {pageLabel} {incidentsPagination.page}/{incidentsPagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setIncidentsPage(
                    Math.min(incidentsPagination.totalPages, incidentsPagination.page + 1)
                  )
                }
                disabled={incidentsPagination.page >= incidentsPagination.totalPages}
                className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
              >
                {nextLabel}
              </button>
            </div>
          ) : null}

          <form
            className="grid gap-3 rounded-xl border border-border p-3"
            onSubmit={async (event) => {
              event.preventDefault();

              const parsedAmount = parseNonNegativeNumber(incidentAmount);
              if (!incidentOrderItemId || parsedAmount === null) {
                const message = text.common.requiredNumber;
                setActionError(message);
                toast.error(message);
                return;
              }

              const selectedItem = detail.items.find((item) => item.orderItemId === incidentOrderItemId);
              if (!selectedItem) {
                setActionError(copy.actionFailed);
                toast.error(copy.actionFailed);
                return;
              }

              try {
                setActionError(null);
                await addIncidentMutation.mutateAsync({
                  orderItemId: selectedItem.orderItemId,
                  itemId: selectedItem.itemId,
                  type: incidentType,
                  amount: parsedAmount,
                  applyToDeposit: incidentApplyToDeposit,
                  description: incidentDescription || null,
                });
                toast.success(
                  locale === "vi" ? "Đã thêm incident thành công." : "Incident added successfully."
                );

                setIncidentAmount("0");
                setIncidentDescription("");
              } catch (error) {
                const message = error instanceof Error ? error.message : copy.actionFailed;
                setActionError(message);
                toast.error(message);
              }
            }}
          >
            <h3 className="text-sm font-semibold text-foreground">{text.incidents.addTitle}</h3>

            <div className="grid gap-3 md:grid-cols-4">
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs text-muted-foreground">{text.incidents.item}</span>
                <select
                  value={incidentOrderItemId}
                  onChange={(event) => setIncidentOrderItemId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">-</option>
                  {detail.items.map((item) => (
                    <option key={item.orderItemId} value={item.orderItemId}>
                      {item.itemCode ?? item.orderItemId}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">{text.incidents.type}</span>
                <select
                  value={incidentType}
                  onChange={(event) =>
                    setIncidentType(
                      event.target.value as "LATE" | "DAMAGE" | "LOST" | "CLEANING"
                    )
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="LATE">{incidentTypeLabels.LATE}</option>
                  <option value="DAMAGE">{incidentTypeLabels.DAMAGE}</option>
                  <option value="LOST">{incidentTypeLabels.LOST}</option>
                  <option value="CLEANING">{incidentTypeLabels.CLEANING}</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">{text.incidents.amount}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={incidentAmount}
                  onChange={(event) => setIncidentAmount(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={incidentApplyToDeposit}
                onChange={(event) => setIncidentApplyToDeposit(event.target.checked)}
              />
              {text.incidents.applyToDeposit}
            </label>

            <VoiceDictationField
              locale={locale}
              label={text.incidents.description}
              value={incidentDescription}
              onValueChange={setIncidentDescription}
              language={locale === "vi" ? "vi-VN" : "en-US"}
              rows={2}
            />

            <div>
              <button
                type="submit"
                disabled={pendingAction}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
              >
                {pendingAction ? text.common.running : text.incidents.addAction}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeTab === "activity" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-md">
          <h2 className="text-lg font-semibold text-foreground">{text.activity.title}</h2>

          {detail.activity.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{text.activity.noData}</p>
          ) : (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-2">{text.activity.when}</th>
                      <th className="px-3 py-2">{text.activity.action}</th>
                      <th className="px-3 py-2">{text.activity.reason}</th>
                      <th className="px-3 py-2">{text.activity.actor}</th>
                      <th className="px-3 py-2">{text.activity.detail}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityPagination.items.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-border/70 transition-colors hover:bg-accent/40 last:border-0"
                      >
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {formatDateTimeLabel(entry.createdAt, locale)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {renderActivityAction(entry.action)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{entry.reason ?? "-"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {entry.actorProfileId ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {entry.meta ? JSON.stringify(entry.meta) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setActivityPage(Math.max(1, activityPagination.page - 1))}
                  disabled={activityPagination.page <= 1}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {prevLabel}
                </button>
                <span>
                  {pageLabel} {activityPagination.page}/{activityPagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActivityPage(
                      Math.min(activityPagination.totalPages, activityPagination.page + 1)
                    )
                  }
                  disabled={activityPagination.page >= activityPagination.totalPages}
                  className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      <DrawerFormShell
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        title={text.pickup.title}
        description={text.pickup.description}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPickupOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {text.common.close}
            </button>
            <button
              type="button"
              disabled={pendingAction || !pickupVerifiedItems}
              onClick={async () => {
                const depositPaid = detail.summary.money.depositPaid ?? 0;
                const depositRequired = detail.summary.money.depositAmount ?? 0;
                const depositNotFullyPaid = depositPaid + 0.001 < depositRequired;

                if (pickupRequireDepositPaid && depositNotFullyPaid) {
                  const depositPaidLabel =
                    formatMoney(depositPaid, { locale, currency: "VND" }) || String(depositPaid);
                  const depositRequiredLabel =
                    formatMoney(depositRequired, { locale, currency: "VND" }) ||
                    String(depositRequired);
                  const message =
                    locale === "vi"
                      ? `Chưa thu đủ cọc để nhận đồ (${depositPaidLabel}/${depositRequiredLabel}). Vui lòng thêm payment cọc hoặc bỏ chọn yêu cầu thu đủ cọc trước khi pick up.`
                      : `Deposit is not fully paid for pickup (${depositPaidLabel}/${depositRequiredLabel}). Add a deposit payment or uncheck the full-deposit requirement.`;
                  setActionError(message);
                  toast.error(message);
                  return;
                }

                try {
                  setActionError(null);
                  const rentOutstanding = Math.max(
                    0,
                    detail.summary.money.rentAmount - detail.summary.money.rentPaid
                  );
                  await pickupMutation.mutateAsync({
                    note: pickupNote || null,
                    requireDepositPaid: pickupRequireDepositPaid,
                    rentalPayment:
                      rentOutstanding > 0
                        ? {
                            type: "RENT",
                            method: paymentMethod,
                            amount: rentOutstanding,
                            source: "ORDER_DETAIL_PICKUP",
                            note: pickupNote || null,
                          }
                        : undefined,
                  });
                  setPickupOpen(false);
                  toast.success(
                    locale === "vi"
                      ? `Đơn ${detail.summary.orderCode} đã được pick up.`
                      : `Order ${detail.summary.orderCode} picked up.`
                  );
                } catch (error) {
                  let message = error instanceof Error ? error.message : copy.actionFailed;
                  if (error instanceof Error && error.message.startsWith("PICKUP_NOT_ALLOWED")) {
                    const reason = error.message.split(":")[1] ?? "";
                    if (reason === "deposit-not-fully-paid") {
                      const depositPaidLabel =
                        formatMoney(depositPaid, { locale, currency: "VND" }) || String(depositPaid);
                      const depositRequiredLabel =
                        formatMoney(depositRequired, { locale, currency: "VND" }) ||
                        String(depositRequired);
                      message =
                        locale === "vi"
                          ? `Không thể nhận đồ vì chưa thu đủ cọc (${depositPaidLabel}/${depositRequiredLabel}).`
                          : `Pickup is blocked because deposit is not fully paid (${depositPaidLabel}/${depositRequiredLabel}).`;
                    } else if (reason === "invalid-status-for-pickup") {
                      message =
                        locale === "vi"
                          ? "Không thể nhận đồ vì đơn chưa ở trạng thái đã xác nhận."
                          : "Pickup is blocked because the order is not in confirmed status.";
                    } else if (reason === "pickup-only-supported-for-rental") {
                      message =
                        locale === "vi"
                          ? "Chỉ đơn thuê mới hỗ trợ thao tác nhận đồ."
                          : "Pickup is only supported for rental orders.";
                    } else {
                      message =
                        locale === "vi"
                          ? "Không thể nhận đồ ở trạng thái hiện tại. Vui lòng kiểm tra trạng thái đơn và điều kiện cọc."
                          : "Pickup is not allowed in the current state. Please check order status and deposit conditions.";
                    }
                  }
                  setActionError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              {pendingAction ? text.common.running : text.pickup.confirmAction}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={pickupVerifiedItems}
              onChange={(event) => setPickupVerifiedItems(event.target.checked)}
            />
            {text.pickup.verifyItems}
          </label>

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={pickupRequireDepositPaid}
              onChange={(event) => setPickupRequireDepositPaid(event.target.checked)}
            />
            {text.pickup.verifyDeposit}
          </label>

          <VoiceDictationField
            locale={locale}
            label={text.pickup.noteLabel}
            value={pickupNote}
            onValueChange={setPickupNote}
            language={locale === "vi" ? "vi-VN" : "en-US"}
            rows={3}
          />
        </div>
      </DrawerFormShell>

      <DrawerFormShell
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title={text.returnFlow.title}
        description={text.returnFlow.description}
        widthClassName="max-w-2xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReturnOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {text.common.close}
            </button>
            <button
              type="button"
              disabled={pendingAction || !hasItems}
              onClick={async () => {
                try {
                  const returnItemsPayload = detail.items.map((item) => {
                    const draft = returnItemsDraft[item.orderItemId];
                    const parsedIncident = parseNonNegativeNumber(draft?.incidentAmount ?? "0") ?? 0;

                    return {
                      orderItemId: item.orderItemId,
                      itemId: item.itemId,
                      condition: (draft?.condition ?? "OK") as ReturnItemCondition,
                      note: draft?.note || null,
                      incidentAmount: parsedIncident,
                      applyToDeposit: draft?.applyToDeposit ?? true,
                      targetStatus: (draft?.targetStatus ?? defaultTargetStatus(draft?.condition ?? "OK")) as ReturnItemTargetStatus,
                    };
                  });

                  const parsedCustomFees = parseNonNegativeNumber(returnCustomFeesAmount);
                  const parsedRefundAmount = parseNonNegativeNumber(returnRefundAmount);
                  const parsedAdditionalCollected = parseNonNegativeNumber(
                    returnAdditionalCollectedAmount
                  );

                  if (parsedCustomFees === null) {
                    const message = text.common.requiredNumber;
                    setActionError(message);
                    toast.error(message);
                    return;
                  }

                  if (returnRefundAmount.trim() && parsedRefundAmount === null) {
                    const message = text.common.requiredNumber;
                    setActionError(message);
                    toast.error(message);
                    return;
                  }

                  if (
                    returnAdditionalCollectedAmount.trim() &&
                    parsedAdditionalCollected === null
                  ) {
                    const message = text.common.requiredNumber;
                    setActionError(message);
                    toast.error(message);
                    return;
                  }

                  setActionError(null);
                  await returnMutation.mutateAsync({
                    items: returnItemsPayload,
                    customFeesAmount: parsedCustomFees,
                    additionalCollectedAmount: parsedAdditionalCollected ?? undefined,
                    additionalCollectionMethod:
                      (parsedAdditionalCollected ?? 0) > 0
                        ? returnAdditionalCollectionMethod
                        : undefined,
                    additionalCollectionNote:
                      (parsedAdditionalCollected ?? 0) > 0
                        ? returnAdditionalCollectionNote || null
                        : undefined,
                    refundAmount: parsedRefundAmount ?? undefined,
                    refundMethod: returnRefundMethod,
                    refundReason: returnRefundReason || null,
                    refundNote: returnRefundNote || null,
                    completeAfterReturn: returnCompleteAfter,
                  });

                  setReturnOpen(false);
                  toast.success(
                    locale === "vi"
                      ? `Đơn ${detail.summary.orderCode} đã được return.`
                      : `Order ${detail.summary.orderCode} returned.`
                  );
                } catch (error) {
                  const message = error instanceof Error ? error.message : copy.actionFailed;
                  setActionError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50"
            >
              {pendingAction ? text.common.running : text.returnFlow.submitAction}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {detail.items.map((item) => {
            const draft = returnItemsDraft[item.orderItemId] ?? {
              condition: "OK",
              note: "",
              incidentAmount: "0",
              applyToDeposit: true,
              targetStatus: "LAUNDRY",
            };

            return (
              <article key={item.orderItemId} className="space-y-2 rounded-xl border border-border p-3">
                <p className="text-sm font-semibold text-foreground">{item.itemCode ?? item.orderItemId}</p>

                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">{text.returnFlow.condition}</span>
                    <select
                      value={draft.condition}
                      onChange={(event) => {
                        const nextCondition = event.target.value as ReturnItemCondition;
                        setReturnItemDraft(item.orderItemId, {
                          condition: nextCondition,
                          targetStatus: defaultTargetStatus(nextCondition),
                        });
                      }}
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                    >
                      {RETURN_ITEM_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {returnConditionLabels[condition]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">{text.returnFlow.targetStatus}</span>
                    <select
                      value={draft.targetStatus}
                      onChange={(event) =>
                        setReturnItemDraft(item.orderItemId, {
                          targetStatus: event.target.value as ReturnItemTargetStatus,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                    >
                      {RETURN_ITEM_TARGET_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {itemStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs text-muted-foreground">{text.returnFlow.incidentAmount}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.incidentAmount}
                      onChange={(event) =>
                        setReturnItemDraft(item.orderItemId, {
                          incidentAmount: event.target.value,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs"
                    />
                  </label>

                  <label className="flex items-center gap-2 self-end text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={draft.applyToDeposit}
                      onChange={(event) =>
                        setReturnItemDraft(item.orderItemId, {
                          applyToDeposit: event.target.checked,
                        })
                      }
                    />
                    {text.returnFlow.applyToDeposit}
                  </label>
                </div>

                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">{text.returnFlow.itemNote}</span>
                  <textarea
                    rows={2}
                    value={draft.note}
                    onChange={(event) =>
                      setReturnItemDraft(item.orderItemId, {
                        note: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
                  />
                </label>
              </article>
            );
          })}

          <div className="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{text.returnFlow.customFeesAmount}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={returnCustomFeesAmount}
                onChange={(event) => setReturnCustomFeesAmount(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                {text.returnFlow.additionalCollectedAmount}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={returnAdditionalCollectedAmount}
                onChange={(event) => setReturnAdditionalCollectedAmount(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{text.returnFlow.refundAmount}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={returnRefundAmount}
                onChange={(event) => setReturnRefundAmount(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">
                {text.returnFlow.additionalCollectionMethod}
              </span>
              <select
                value={returnAdditionalCollectionMethod}
                onChange={(event) =>
                  setReturnAdditionalCollectionMethod(event.target.value as OrderPaymentMethod)
                }
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {ORDER_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {paymentMethodLabels[method]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">{text.returnFlow.refundMethod}</span>
              <select
                value={returnRefundMethod}
                onChange={(event) => setReturnRefundMethod(event.target.value as OrderPaymentMethod)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
              >
                {ORDER_PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {paymentMethodLabels[method]}
                  </option>
                ))}
              </select>
            </label>

            <VoiceDictationField
              locale={locale}
              label={text.returnFlow.additionalCollectionNote}
              value={returnAdditionalCollectionNote}
              onValueChange={setReturnAdditionalCollectionNote}
              fieldType="input"
              language={locale === "vi" ? "vi-VN" : "en-US"}
            />

            <VoiceDictationField
              locale={locale}
              label={text.returnFlow.refundReason}
              value={returnRefundReason}
              onValueChange={setReturnRefundReason}
              fieldType="input"
              language={locale === "vi" ? "vi-VN" : "en-US"}
            />

            <div className="md:col-span-2">
              <VoiceDictationField
                locale={locale}
                label={text.returnFlow.refundNote}
                value={returnRefundNote}
                onValueChange={setReturnRefundNote}
                language={locale === "vi" ? "vi-VN" : "en-US"}
                rows={2}
              />
            </div>

            <label className="md:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={returnCompleteAfter}
                onChange={(event) => setReturnCompleteAfter(event.target.checked)}
              />
              {text.returnFlow.completeAfterReturn}
            </label>
          </div>

          <article className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-3">
            <p className="text-xs text-muted-foreground">
              {text.returnFlow.outstandingBeforeReturn}:{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(returnOutstandingBefore, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {text.returnFlow.estimatedAdditionalCharge}:{" "}
              <span className="font-semibold text-warning">
                {formatMoney(returnEstimatedAdditionalCharge, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {text.returnFlow.estimatedOutstandingAfterReturn}:{" "}
              <span className="font-semibold text-warning">
                {formatMoney(returnEstimatedOutstandingAfter, { locale, currency: "VND" }) || "-"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground md:col-span-3">
              {text.returnFlow.estimatedHint}
            </p>
          </article>
        </div>
      </DrawerFormShell>

      <DrawerFormShell
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={text.cancel.title}
        description={text.cancel.description}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            >
              {text.common.close}
            </button>
            <button
              type="button"
              disabled={pendingAction}
              onClick={async () => {
                const parsedRefundAmount = parseNonNegativeNumber(cancelRefundAmount);
                if (cancelRefundAmount.trim() && parsedRefundAmount === null) {
                  const message = text.common.requiredNumber;
                  setActionError(message);
                  toast.error(message);
                  return;
                }

                try {
                  setActionError(null);
                  await cancelMutation.mutateAsync({
                    reason: cancelReason || null,
                    refundAmount: parsedRefundAmount ?? undefined,
                    refundMethod: cancelRefundMethod,
                    refundReason: cancelRefundReason || null,
                    refundNote: cancelRefundNote || null,
                  });
                  setCancelOpen(false);
                  toast.success(
                    locale === "vi"
                      ? `Đơn ${detail.summary.orderCode} đã được hủy.`
                      : `Order ${detail.summary.orderCode} cancelled.`
                  );
                } catch (error) {
                  const message = error instanceof Error ? error.message : copy.actionFailed;
                  setActionError(message);
                  toast.error(message);
                }
              }}
              className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive disabled:opacity-50"
            >
              {pendingAction ? text.common.running : text.cancel.submitAction}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <VoiceDictationField
            locale={locale}
            label={text.cancel.reason}
            value={cancelReason}
            onValueChange={setCancelReason}
            language={locale === "vi" ? "vi-VN" : "en-US"}
            rows={2}
          />

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">{text.cancel.refundAmount}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cancelRefundAmount}
              onChange={(event) => setCancelRefundAmount(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs text-muted-foreground">{text.cancel.refundMethod}</span>
            <select
              value={cancelRefundMethod}
              onChange={(event) => setCancelRefundMethod(event.target.value as OrderPaymentMethod)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              {ORDER_PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </option>
              ))}
            </select>
          </label>

          <VoiceDictationField
            locale={locale}
            label={text.cancel.refundReason}
            value={cancelRefundReason}
            onValueChange={setCancelRefundReason}
            language={locale === "vi" ? "vi-VN" : "en-US"}
            fieldType="input"
          />

          <VoiceDictationField
            locale={locale}
            label={text.cancel.refundNote}
            value={cancelRefundNote}
            onValueChange={setCancelRefundNote}
            language={locale === "vi" ? "vi-VN" : "en-US"}
            rows={2}
          />
        </div>
      </DrawerFormShell>
    </section>
  );
});
