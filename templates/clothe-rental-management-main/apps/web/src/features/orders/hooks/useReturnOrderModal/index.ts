"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
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
import type { OrderStatus } from "@/types/domainPrimitives";
import {
  buildDomainLabels,
  formatDomainLabelFallback,
} from "@/utils/domainLabels";
import {
  RETURN_ORDER_MODAL_COPY,
  ORDER_PAYMENT_METHODS,
  RETURN_ITEM_CONDITIONS,
  RETURN_ITEM_TARGET_STATUSES,
  ORDER_PAYMENT_METHOD_LABEL_KEYS,
  RETURN_ITEM_CONDITION_LABEL_KEYS,
  RETURN_ITEM_TARGET_STATUS_LABEL_KEYS,
  RETURN_ORDER_STATUS_LABEL_KEYS,
  RETURN_DEPOSIT_REFUND_STATUS_LABEL_KEYS,
} from "./constants";
import type {
  UseReturnOrderModalOptions,
  ReturnItemDraft,
} from "./types";
import {
  toIsoDate,
  parseNonNegativeNumber,
  roundMoneyValue,
  defaultTargetStatus,
  buildDraftFromItemIds,
} from "./utils";

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
  const [additionalCollectionMethod, setAdditionalCollectionMethod] = useState("CASH" as const);
  const [additionalCollectionNote, setAdditionalCollectionNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("0");
  const [refundAmountEdited, setRefundAmountEdited] = useState(false);
  const [refundMethod, setRefundMethod] = useState("CASH" as const);
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

  const resolveSourceOrderStatusLabel = (status: string | null | undefined): string => {
    if (status && status in sourceOrderStatusLabels) {
      return sourceOrderStatusLabels[status as OrderStatus];
    }
    return formatDomainLabelFallback(status, locale);
  };
  const resolveReturnOrderStatusLabel = (status: string | null | undefined): string => {
    if (!status) return formatDomainLabelFallback(status, locale);
    return returnOrderStatusLabels[status as keyof typeof returnOrderStatusLabels] ?? formatDomainLabelFallback(status, locale);
  };
  const resolveDepositRefundStatusLabel = (status: string | null | undefined): string => {
    if (!status) return formatDomainLabelFallback(status, locale);
    return depositRefundStatusLabels[status as keyof typeof depositRefundStatusLabels] ?? formatDomainLabelFallback(status, locale);
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

export type UseReturnOrderModalReturn = ReturnType<typeof useReturnOrderModal>;
