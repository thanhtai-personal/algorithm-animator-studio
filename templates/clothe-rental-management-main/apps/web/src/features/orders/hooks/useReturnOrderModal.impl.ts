"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import {
  ITEM_STATUS_LABEL_KEYS,
  ORDER_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useOrderDetailQuery } from "@/features/orders/queries/useOrdersDomainQueries";
import {
  useCancelReturnOrderMutation,
  useCompleteReturnOrderMutation,
  useCreateReturnOrderMutation,
  useReturnOrderDetailQuery,
  useReturnOrderSourcesQuery,
  useSettleReturnOrderMutation,
  useTransitionReturnOrderStatusMutation,
} from "@/features/orders/queries/useReturnOrdersQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { returnOrdersStore } from "@/features/orders/stores/returnOrdersStore";
import { useDebouncedValue } from "@/features/orders/utils/useDebouncedValue";
import type {
  OrderPaymentMethod,
  ReturnItemCondition,
  ReturnItemTargetStatus,
} from "@/types/ordersDomain";
import type { OrderStatus } from "@/types/domainPrimitives";
import type {
  ReturnDepositRefundStatus,
  ReturnOrderStatus,
} from "@/types/returnOrdersDomain";
import {
  buildDomainLabels,
  formatDomainLabelFallback,
} from "@/utils/domainLabels";

interface ReturnOrderModalCopy {
  title: string;
  description: string;
  steps: {
    source: string;
    settlement: string;
    workflow: string;
  };
  source: {
    searchPlaceholder: string;
    empty: string;
    selected: string;
    expectedReturn: string;
    customer: string;
    total: string;
    depositPaid: string;
    refundableDeposit: string;
    outstanding: string;
  };
  settlement: {
    actualReturnDate: string;
    requiredDate: string;
    customFees: string;
    additionalCollectedAmount: string;
    additionalCollectionMethod: string;
    additionalCollectionNote: string;
    outstandingBeforeReturn: string;
    estimatedAdditionalCharge: string;
    estimatedOutstandingAfterReturn: string;
    estimatedHint: string;
    refundAmount: string;
    refundMethod: string;
    refundReason: string;
    refundNote: string;
    itemCondition: string;
    itemTargetStatus: string;
    itemIncident: string;
    itemApplyDeposit: string;
    itemNote: string;
  };
  workflow: {
    returnOrderStatus: string;
    depositRefundStatus: string;
    sourceOrderStatus: string;
    saveDraft: string;
    createOrder: string;
    markCreated: string;
    settle: string;
    complete: string;
    cancel: string;
    blockedByRefund: string;
  };
  actions: {
    close: string;
    back: string;
    next: string;
  };
  messages: {
    invalidNumber: string;
    selectSource: string;
    createSuccess: string;
    settleSuccess: string;
    completeSuccess: string;
    cancelSuccess: string;
    createdSuccess: string;
    failed: string;
  };
}

const RETURN_ORDER_MODAL_COPY: Record<AppLocale, ReturnOrderModalCopy> = {
  vi: {
    title: "Đơn trả hàng",
    description: "Tạo và xử lý đơn trả trong cùng một modal nhiều bước.",
    steps: {
      source: "Đơn nguồn",
      settlement: "Thông tin trả",
      workflow: "Trạng thái đơn trả",
    },
    source: {
      searchPlaceholder: "Tìm mã đơn thuê hoặc khách hàng...",
      empty: "Không có đơn thuê hợp lệ để tạo đơn trả.",
      selected: "Đơn nguồn đã chọn",
      expectedReturn: "Ngày trả dự kiến",
      customer: "Khách hàng",
      total: "Tổng tiền",
      depositPaid: "Cọc đã thu",
      refundableDeposit: "Cọc có thể hoàn",
      outstanding: "Còn thiếu",
    },
    settlement: {
      actualReturnDate: "Ngày trả thực tế",
      requiredDate: "Bắt buộc nhập ngày trả thực tế.",
      customFees: "Phụ phí phát sinh",
      additionalCollectedAmount: "Thu thêm khi trả hàng",
      additionalCollectionMethod: "Phương thức thu thêm",
      additionalCollectionNote: "Ghi chú thu thêm",
      outstandingBeforeReturn: "Còn thiếu trước khi trả",
      estimatedAdditionalCharge: "Phát sinh dự kiến",
      estimatedOutstandingAfterReturn: "Còn thiếu ước tính sau trả",
      estimatedHint: "Ước tính chưa gồm phí trễ tự động (nếu có).",
      refundAmount: "Số tiền hoàn cọc",
      refundMethod: "Phương thức hoàn cọc",
      refundReason: "Lý do hoàn cọc",
      refundNote: "Ghi chú hoàn cọc",
      itemCondition: "Tình trạng",
      itemTargetStatus: "Trạng thái item sau trả",
      itemIncident: "Phí sự cố",
      itemApplyDeposit: "Trừ vào cọc",
      itemNote: "Ghi chú item",
    },
    workflow: {
      returnOrderStatus: "Trạng thái đơn trả",
      depositRefundStatus: "Trạng thái hoàn cọc",
      sourceOrderStatus: "Trạng thái đơn thuê nguồn",
      saveDraft: "Lưu nháp",
      createOrder: "Tạo đơn trả",
      markCreated: "Xác nhận đã tạo đơn",
      settle: "Xác nhận đã thanh toán và trả hàng",
      complete: "Hoàn tất đơn trả",
      cancel: "Hủy đơn trả",
      blockedByRefund:
        "Không thể hoàn tất khi trạng thái hoàn cọc còn chờ xử lý. Hoàn cọc hoặc xác nhận không cần hoàn cọc trước.",
    },
    actions: {
      close: "Đóng",
      back: "Quay lại",
      next: "Tiếp theo",
    },
    messages: {
      invalidNumber: "Vui lòng nhập số tiền hợp lệ (>= 0).",
      selectSource: "Vui lòng chọn đơn thuê nguồn hợp lệ.",
      createSuccess: "Đã tạo đơn trả.",
      settleSuccess: "Đã xác nhận thanh toán và trả hàng.",
      completeSuccess: "Đơn trả đã hoàn tất.",
      cancelSuccess: "Đã hủy đơn trả.",
      createdSuccess: "Đã chuyển đơn trả sang trạng thái Đã tạo đơn.",
      failed: "Không thể xử lý đơn trả.",
    },
  },
  en: {
    title: "Return order",
    description: "Create and process return orders in one multi-step modal.",
    steps: {
      source: "Source rental",
      settlement: "Return data",
      workflow: "Return workflow",
    },
    source: {
      searchPlaceholder: "Search rental order or customer...",
      empty: "No eligible rental orders for return creation.",
      selected: "Selected source order",
      expectedReturn: "Expected return date",
      customer: "Customer",
      total: "Total",
      depositPaid: "Deposit paid",
      refundableDeposit: "Refundable deposit",
      outstanding: "Outstanding",
    },
    settlement: {
      actualReturnDate: "Actual return date",
      requiredDate: "Actual return date is required.",
      customFees: "Additional fees",
      additionalCollectedAmount: "Additional collection",
      additionalCollectionMethod: "Collection method",
      additionalCollectionNote: "Collection note",
      outstandingBeforeReturn: "Outstanding before return",
      estimatedAdditionalCharge: "Estimated additional charge",
      estimatedOutstandingAfterReturn: "Estimated outstanding after return",
      estimatedHint: "Estimate excludes any auto late-fee calculation.",
      refundAmount: "Deposit refund amount",
      refundMethod: "Deposit refund method",
      refundReason: "Deposit refund reason",
      refundNote: "Deposit refund note",
      itemCondition: "Condition",
      itemTargetStatus: "Target item status",
      itemIncident: "Incident fee",
      itemApplyDeposit: "Apply to deposit",
      itemNote: "Item note",
    },
    workflow: {
      returnOrderStatus: "Return order status",
      depositRefundStatus: "Deposit refund status",
      sourceOrderStatus: "Source rental status",
      saveDraft: "Save draft",
      createOrder: "Create return order",
      markCreated: "Mark as created",
      settle: "Confirm settlement & return",
      complete: "Complete return order",
      cancel: "Cancel return order",
      blockedByRefund:
        "Completion is blocked while deposit refund status is PENDING.",
    },
    actions: {
      close: "Close",
      back: "Back",
      next: "Next",
    },
    messages: {
      invalidNumber: "Please enter a valid amount (>= 0).",
      selectSource: "Please select an eligible source rental order.",
      createSuccess: "Return order created.",
      settleSuccess: "Return settlement confirmed.",
      completeSuccess: "Return order completed.",
      cancelSuccess: "Return order cancelled.",
      createdSuccess: "Return order moved to created state.",
      failed: "Unable to process return order.",
    },
  },
};

interface ReturnItemDraft {
  condition: ReturnItemCondition;
  targetStatus: ReturnItemTargetStatus;
  incidentAmount: string;
  applyToDeposit: boolean;
  note: string;
}

interface UseReturnOrderModalOptions {
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ORDER_PAYMENT_METHODS: OrderPaymentMethod[] = ["CASH", "BANK", "MOMO"];
const RETURN_ITEM_CONDITIONS: ReturnItemCondition[] = ["OK", "NEED_CLEAN", "DAMAGE", "LOST"];
const RETURN_ITEM_TARGET_STATUSES: ReturnItemTargetStatus[] = [
  "LAUNDRY",
  "READY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
];

const ORDER_PAYMENT_METHOD_LABEL_KEYS: Record<OrderPaymentMethod, string> = {
  CASH: "paymentMethod.cash",
  BANK: "paymentMethod.bank",
  MOMO: "paymentMethod.momo",
};

const RETURN_ITEM_CONDITION_LABEL_KEYS: Record<ReturnItemCondition, string> = {
  OK: "returnCondition.ok",
  NEED_CLEAN: "returnCondition.needClean",
  DAMAGE: "returnCondition.damage",
  LOST: "returnCondition.lost",
};

const RETURN_ITEM_TARGET_STATUS_LABEL_KEYS: Record<ReturnItemTargetStatus, string> = {
  READY: ITEM_STATUS_LABEL_KEYS.READY,
  LAUNDRY: ITEM_STATUS_LABEL_KEYS.LAUNDRY,
  MAINTENANCE: ITEM_STATUS_LABEL_KEYS.MAINTENANCE,
  DAMAGED: ITEM_STATUS_LABEL_KEYS.DAMAGED,
  LOST: ITEM_STATUS_LABEL_KEYS.LOST,
};

const RETURN_ORDER_STATUS_LABEL_KEYS: Record<ReturnOrderStatus, string> = {
  DRAFT: "returnOrderStatus.draft",
  CREATED: "returnOrderStatus.created",
  RETURN_SETTLED: "returnOrderStatus.returnSettled",
  COMPLETED: "returnOrderStatus.completed",
  CANCELLED: "returnOrderStatus.cancelled",
};

const RETURN_DEPOSIT_REFUND_STATUS_LABEL_KEYS: Record<ReturnDepositRefundStatus, string> = {
  PENDING: "depositRefundStatus.pending",
  REFUNDED: "depositRefundStatus.refunded",
  NOT_REQUIRED: "depositRefundStatus.notRequired",
};

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseNonNegativeNumber(raw: string): number | null {
  if (!raw.trim()) return 0;
  const parsed = Number(raw.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function roundMoneyValue(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function defaultTargetStatus(condition: ReturnItemCondition): ReturnItemTargetStatus {
  if (condition === "LOST") return "LOST";
  if (condition === "DAMAGE") return "MAINTENANCE";
  return "LAUNDRY";
}

function buildDraftFromItemIds(itemIds: string[]): Record<string, ReturnItemDraft> {
  return itemIds.reduce<Record<string, ReturnItemDraft>>((acc, itemId) => {
    acc[itemId] = {
      condition: "OK",
      targetStatus: "LAUNDRY",
      incidentAmount: "0",
      applyToDeposit: true,
      note: "",
    };
    return acc;
  }, {});
}

export function useReturnOrderModal({
  locale,
  open,
  onOpenChange,
}: UseReturnOrderModalOptions) {
  const copy = RETURN_ORDER_MODAL_COPY[locale];
  const { currentBranchId } = useAuthAccess();

  const [stepIndex, setStepIndex] = useState(0);
  const [sourceSearchInput, setSourceSearchInput] = useState("");
  const [selectedSourceOrderId, setSelectedSourceOrderId] = useState("");
  const [activeReturnOrderId, setActiveReturnOrderId] = useState("");
  const [actualReturnDate, setActualReturnDate] = useState(() => toIsoDate(new Date()));
  const [customFeesAmount, setCustomFeesAmount] = useState("0");
  const [additionalCollectedAmount, setAdditionalCollectedAmount] = useState("0");
  const [additionalCollectionMethod, setAdditionalCollectionMethod] =
    useState<OrderPaymentMethod>("CASH");
  const [additionalCollectionNote, setAdditionalCollectionNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("0");
  const [refundAmountEdited, setRefundAmountEdited] = useState(false);
  const [refundMethod, setRefundMethod] = useState<OrderPaymentMethod>("CASH");
  const [refundReason, setRefundReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [returnItemsDraft, setReturnItemsDraft] = useState<Record<string, ReturnItemDraft>>({});
  const [lastHydratedSourceId, setLastHydratedSourceId] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(sourceSearchInput, 250);

  useReturnOrderSourcesQuery({
    branchId: currentBranchId,
    search: debouncedSearch || undefined,
    page,
    pageSize: 12,
  });

  useOrderDetailQuery(selectedSourceOrderId);
  const sourceDetail = selectedSourceOrderId
    ? ordersStore.getDetailByOrderId(selectedSourceOrderId)
    : null;

  useReturnOrderDetailQuery(activeReturnOrderId);
  const activeReturnOrder = activeReturnOrderId
    ? returnOrdersStore.getDetailById(activeReturnOrderId)
    : null;

  const createMutation = useCreateReturnOrderMutation();
  const transitionMutation = useTransitionReturnOrderStatusMutation(activeReturnOrderId || "");
  const settleMutation = useSettleReturnOrderMutation(activeReturnOrderId || "");
  const completeMutation = useCompleteReturnOrderMutation(activeReturnOrderId || "");
  const cancelMutation = useCancelReturnOrderMutation(activeReturnOrderId || "");

  const isBusy =
    createMutation.isPending ||
    transitionMutation.isPending ||
    settleMutation.isPending ||
    completeMutation.isPending ||
    cancelMutation.isPending;

  const sourceOrderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const paymentMethodLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_METHOD_LABEL_KEYS),
    [locale]
  );
  const returnConditionLabels = useMemo(
    () => buildDomainLabels(locale, RETURN_ITEM_CONDITION_LABEL_KEYS),
    [locale]
  );
  const returnTargetStatusLabels = useMemo(
    () => buildDomainLabels(locale, RETURN_ITEM_TARGET_STATUS_LABEL_KEYS),
    [locale]
  );
  const returnOrderStatusLabels = useMemo(
    () => buildDomainLabels(locale, RETURN_ORDER_STATUS_LABEL_KEYS),
    [locale]
  );
  const depositRefundStatusLabels = useMemo(
    () => buildDomainLabels(locale, RETURN_DEPOSIT_REFUND_STATUS_LABEL_KEYS),
    [locale]
  );

  const returnConditionOptions = useMemo(
    () =>
      RETURN_ITEM_CONDITIONS.map((value) => ({
        value,
        label: returnConditionLabels[value],
      })),
    [returnConditionLabels]
  );
  const returnTargetStatusOptions = useMemo(
    () =>
      RETURN_ITEM_TARGET_STATUSES.map((value) => ({
        value,
        label: returnTargetStatusLabels[value],
      })),
    [returnTargetStatusLabels]
  );
  const refundMethodOptions = useMemo(
    () =>
      ORDER_PAYMENT_METHODS.map((value) => ({
        value,
        label: paymentMethodLabels[value],
      })),
    [paymentMethodLabels]
  );

  const resolveSourceOrderStatusLabel = (
    status: string | null | undefined
  ): string => {
    if (status && status in sourceOrderStatusLabels) {
      return sourceOrderStatusLabels[status as OrderStatus];
    }
    return formatDomainLabelFallback(status, locale);
  };
  const resolveReturnOrderStatusLabel = (
    status: ReturnOrderStatus | null | undefined
  ): string => {
    if (!status) return formatDomainLabelFallback(status, locale);
    return returnOrderStatusLabels[status];
  };
  const resolveDepositRefundStatusLabel = (
    status: ReturnDepositRefundStatus | null | undefined
  ): string => {
    if (!status) return formatDomainLabelFallback(status, locale);
    return depositRefundStatusLabels[status];
  };

  const sources = returnOrdersStore.sources;
  const returnEstimatedIncidentAmount = useMemo(() => {
    if (!sourceDetail) return 0;

    return roundMoneyValue(
      sourceDetail.items.reduce((sum, item) => {
        const parsedIncident = parseNonNegativeNumber(
          returnItemsDraft[item.orderItemId]?.incidentAmount ?? "0"
        );
        return sum + (parsedIncident ?? 0);
      }, 0)
    );
  }, [returnItemsDraft, sourceDetail]);
  const returnEstimatedCustomFees = parseNonNegativeNumber(customFeesAmount) ?? 0;
  const returnEstimatedAdditionalCharge = roundMoneyValue(
    returnEstimatedIncidentAmount + returnEstimatedCustomFees
  );
  const returnCollectedAmountParsed = parseNonNegativeNumber(additionalCollectedAmount) ?? 0;
  const returnOutstandingBefore = roundMoneyValue(sourceDetail?.summary.money.outstandingAmount ?? 0);
  const returnEstimatedOutstandingAfter = roundMoneyValue(
    Math.max(
      0,
      returnOutstandingBefore +
        returnEstimatedAdditionalCharge -
        returnCollectedAmountParsed
    )
  );

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setSourceSearchInput("");
    setSelectedSourceOrderId("");
    setActiveReturnOrderId("");
    setActualReturnDate(toIsoDate(new Date()));
    setCustomFeesAmount("0");
    setAdditionalCollectedAmount("0");
    setAdditionalCollectionMethod("CASH");
    setAdditionalCollectionNote("");
    setRefundAmount("0");
    setRefundAmountEdited(false);
    setRefundMethod("CASH");
    setRefundReason("");
    setRefundNote("");
    setReturnItemsDraft({});
    setLastHydratedSourceId("");
    setSubmitError(null);
    setPage(1);
  }, [open]);

  useEffect(() => {
    if (!sourceDetail) return;
    if (lastHydratedSourceId === sourceDetail.summary.id) return;

    setReturnItemsDraft(buildDraftFromItemIds(sourceDetail.items.map((item) => item.orderItemId)));
    setRefundAmount(String(sourceDetail.summary.money.refundableDeposit || 0));
    setRefundAmountEdited(false);
    setLastHydratedSourceId(sourceDetail.summary.id);
  }, [lastHydratedSourceId, sourceDetail]);

  const setReturnItemDraft = (orderItemId: string, patch: Partial<ReturnItemDraft>) => {
    setReturnItemsDraft((previous) => ({
      ...previous,
      [orderItemId]: {
        ...(previous[orderItemId] ?? {
          condition: "OK",
          targetStatus: "LAUNDRY",
          incidentAmount: "0",
          applyToDeposit: true,
          note: "",
        }),
        ...patch,
      },
    }));
  };

  const goNextStep = () => {
    if (stepIndex === 0 && !selectedSourceOrderId) {
      setSubmitError(copy.messages.selectSource);
      return;
    }
    if (stepIndex === 1 && !actualReturnDate) {
      setSubmitError(copy.settlement.requiredDate);
      return;
    }
    setSubmitError(null);
    setStepIndex((previous) => Math.min(previous + 1, 2));
  };

  const goPreviousStep = () => {
    setStepIndex((previous) => Math.max(previous - 1, 0));
  };

  const handleCreate = async (status: "DRAFT" | "CREATED") => {
    try {
      if (!selectedSourceOrderId) {
        throw new Error(copy.messages.selectSource);
      }
      if (!actualReturnDate) {
        throw new Error(copy.settlement.requiredDate);
      }

      setSubmitError(null);
      const detail = await createMutation.mutateAsync({
        sourceRentalOrderId: selectedSourceOrderId,
        actualReturnDate,
        status,
      });
      setActiveReturnOrderId(detail.summary.id);
      setStepIndex(2);
      toast.success(copy.messages.createSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.messages.failed;
      setSubmitError(message);
      toast.error(message);
    }
  };

  const handleMarkCreated = async () => {
    if (!activeReturnOrderId) return;
    try {
      setSubmitError(null);
      await transitionMutation.mutateAsync({
        toStatus: "CREATED",
      });
      toast.success(copy.messages.createdSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.messages.failed;
      setSubmitError(message);
      toast.error(message);
    }
  };

  const handleSettle = async () => {
    if (!activeReturnOrderId || !sourceDetail) return;
    const parsedCustomFees = parseNonNegativeNumber(customFeesAmount);
    const parsedAdditionalCollected = parseNonNegativeNumber(additionalCollectedAmount);
    const shouldSendManualRefundAmount =
      refundAmountEdited && refundAmount.trim().length > 0;
    const parsedRefundAmount = shouldSendManualRefundAmount
      ? parseNonNegativeNumber(refundAmount)
      : null;

    if (
      parsedCustomFees === null ||
      parsedAdditionalCollected === null ||
      (shouldSendManualRefundAmount && parsedRefundAmount === null)
    ) {
      const message = copy.messages.invalidNumber;
      setSubmitError(message);
      toast.error(message);
      return;
    }

    const manualRefundAmount =
      shouldSendManualRefundAmount && parsedRefundAmount !== null
        ? parsedRefundAmount
        : undefined;

    try {
      setSubmitError(null);
      await settleMutation.mutateAsync({
        actualReturnDate,
        items: sourceDetail.items.map((item) => {
          const draft = returnItemsDraft[item.orderItemId];
          const condition = draft?.condition ?? "OK";
          return {
            orderItemId: item.orderItemId,
            itemId: item.itemId,
            condition,
            note: draft?.note || null,
            incidentAmount: parseNonNegativeNumber(draft?.incidentAmount ?? "0") ?? 0,
            applyToDeposit: draft?.applyToDeposit ?? true,
            targetStatus: draft?.targetStatus ?? defaultTargetStatus(condition),
          };
        }),
        customFeesAmount: parsedCustomFees,
        additionalCollectedAmount: parsedAdditionalCollected,
        additionalCollectionMethod:
          (parsedAdditionalCollected ?? 0) > 0
            ? additionalCollectionMethod
            : undefined,
        additionalCollectionNote:
          (parsedAdditionalCollected ?? 0) > 0
            ? additionalCollectionNote || null
            : undefined,
        refundAmount: manualRefundAmount,
        refundMethod,
        refundReason: refundReason || null,
        refundNote: refundNote || null,
      });
      toast.success(copy.messages.settleSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.messages.failed;
      setSubmitError(message);
      toast.error(message);
    }
  };

  const handleComplete = async () => {
    if (!activeReturnOrderId) return;
    if (activeReturnOrder?.summary.depositRefundStatus === "PENDING") {
      const message = copy.workflow.blockedByRefund;
      setSubmitError(message);
      toast.error(message);
      return;
    }

    try {
      setSubmitError(null);
      await completeMutation.mutateAsync();
      toast.success(copy.messages.completeSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.messages.failed;
      setSubmitError(message);
      toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!activeReturnOrderId) return;
    try {
      setSubmitError(null);
      await cancelMutation.mutateAsync(null);
      toast.success(copy.messages.cancelSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.messages.failed;
      setSubmitError(message);
      toast.error(message);
    }
  };

  const activeReturnStatus = activeReturnOrder?.summary.status ?? null;
  const canSettle = activeReturnStatus === "CREATED";
  const canComplete = activeReturnStatus === "RETURN_SETTLED";
  const canCancel =
    activeReturnStatus === "DRAFT" || activeReturnStatus === "CREATED";

  const canMoveNext =
    (stepIndex === 0 && Boolean(selectedSourceOrderId)) ||
    (stepIndex === 1 && Boolean(actualReturnDate));

  const sourceSummary = useMemo(() => {
    if (!sourceDetail) return null;
    return {
      customerName: sourceDetail.summary.customer.fullName,
      customerPhone: sourceDetail.summary.customer.phone,
      expectedReturnDate: sourceDetail.summary.endDate,
      totalAmount: sourceDetail.summary.money.totalAmount,
      depositPaid: sourceDetail.summary.money.depositPaid,
      refundableDeposit: sourceDetail.summary.money.refundableDeposit,
      outstandingAmount: sourceDetail.summary.money.outstandingAmount,
    };
  }, [sourceDetail]);

  return {
    copy,
    stepIndex,
    setStepIndex,
    goNextStep,
    goPreviousStep,
    canMoveNext,
    sourceSearchInput,
    setSourceSearchInput: (value: string) => {
      setSourceSearchInput(value);
      setPage(1);
    },
    sources,
    page,
    setPage,
    sourcesTotal: returnOrdersStore.sourcesTotal,
    sourcesPageSize: returnOrdersStore.sourcesPageSize,
    selectedSourceOrderId,
    setSelectedSourceOrderId: (orderId: string) => {
      setSelectedSourceOrderId(orderId);
      setActiveReturnOrderId("");
      setSubmitError(null);
    },
    sourceDetail,
    sourceSummary,
    actualReturnDate,
    setActualReturnDate,
    customFeesAmount,
    setCustomFeesAmount,
    additionalCollectedAmount,
    setAdditionalCollectedAmount,
    additionalCollectionMethod,
    setAdditionalCollectionMethod,
    additionalCollectionNote,
    setAdditionalCollectionNote,
    returnEstimatedIncidentAmount,
    returnEstimatedAdditionalCharge,
    returnOutstandingBefore,
    returnEstimatedOutstandingAfter,
    refundAmount,
    setRefundAmount: (value: string) => {
      setRefundAmountEdited(true);
      setRefundAmount(value);
    },
    refundMethod,
    setRefundMethod,
    refundReason,
    setRefundReason,
    refundNote,
    setRefundNote,
    orderPaymentMethods: ORDER_PAYMENT_METHODS,
    refundMethodOptions,
    paymentMethodLabels,
    returnConditionLabels,
    returnTargetStatusLabels,
    returnOrderStatusLabels,
    depositRefundStatusLabels,
    returnConditionOptions,
    returnTargetStatusOptions,
    resolveSourceOrderStatusLabel,
    resolveReturnOrderStatusLabel,
    resolveDepositRefundStatusLabel,
    returnItemsDraft,
    setReturnItemDraft,
    activeReturnOrder,
    activeReturnStatus,
    handleCreate,
    handleMarkCreated,
    handleSettle,
    handleComplete,
    handleCancel,
    canSettle,
    canComplete,
    canCancel,
    isBusy,
    submitError,
    onClose: () => onOpenChange(false),
  };
}
