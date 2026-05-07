"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  ITEM_STATUS_TRANSITIONS,
  MANAGER_ONLY_ITEM_TARGET_STATUSES,
  ORDER_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useInventoryItemDetailQuery,
  useUpdateInventoryItemStatusMutation,
} from "@/features/inventory/queries/useInventoryQueries";
import { inventoryClientService } from "@/features/inventory/services/inventoryClientService";
import { inventoryStore } from "@/features/inventory/stores/inventoryStore";
import {
  ITEM_STATUS_LABELS,
  isManagerPlusRole,
} from "@/features/inventory/utils/statusPresentation";
import type { ItemStatus, OrderStatus } from "@/types/domainPrimitives";
import { buildDomainLabels, formatDomainLabelFallback } from "@/utils/domainLabels";

interface InventoryDetailCopy {
  backAction: string;
  loading: string;
  notFound: string;
  statusFlowTitle: string;
  reasonLabel: string;
  reasonCodeLabel: string;
  orderRefLabel: string;
  applyStatusAction: string;
  statusLogTitle: string;
  rentalHistoryTitle: string;
  productInfoTitle: string;
  currentStateTitle: string;
  noLogs: string;
  noHistory: string;
  noCurrentOrder: string;
  managerOnlyHint: string;
  invalidTransitionHint: string;
  reasonPlaceholder: string;
  reasonCodePlaceholder: string;
}

const INVENTORY_DETAIL_COPY: Record<AppLocale, InventoryDetailCopy> = {
  vi: {
    backAction: "Quay lại tồn kho",
    loading: "Đang tải chi tiết item...",
    notFound: "Không tìm thấy item hoặc bạn không có quyền truy cập.",
    statusFlowTitle: "Chuyển trạng thái",
    reasonLabel: "Ghi chú lý do",
    reasonCodeLabel: "Mã lý do (tuỳ chọn)",
    orderRefLabel: "Order ID tham chiếu (tuỳ chọn)",
    applyStatusAction: "Áp dụng trạng thái",
    statusLogTitle: "Timeline trạng thái",
    rentalHistoryTitle: "Lịch sử thuê",
    productInfoTitle: "Thông tin sản phẩm",
    currentStateTitle: "Trạng thái hiện tại",
    noLogs: "Chưa có log trạng thái.",
    noHistory: "Chưa có lịch sử thuê.",
    noCurrentOrder: "Không có đơn thuê đang hoạt động.",
    managerOnlyHint: "Mất / Hư hỏng / Đã bán / Ngưng sử dụng yêu cầu quyền Manager+.",
    invalidTransitionHint: "Không có chuyển trạng thái hợp lệ từ trạng thái hiện tại.",
    reasonPlaceholder: "Nhập mô tả lý do chuyển trạng thái...",
    reasonCodePlaceholder: "VD: RETURNED_NORMAL / DAMAGE_CHECK",
  },
  en: {
    backAction: "Back to inventory",
    loading: "Loading item detail...",
    notFound: "Item not found or access denied.",
    statusFlowTitle: "Status transition",
    reasonLabel: "Reason note",
    reasonCodeLabel: "Reason code (optional)",
    orderRefLabel: "Order ID reference (optional)",
    applyStatusAction: "Apply status",
    statusLogTitle: "Status timeline",
    rentalHistoryTitle: "Rental history",
    productInfoTitle: "Product info",
    currentStateTitle: "Current state",
    noLogs: "No status logs yet.",
    noHistory: "No rental history yet.",
    noCurrentOrder: "No active order linked.",
    managerOnlyHint: "Lost / Damaged / Sold / Retired statuses require Manager+ role.",
    invalidTransitionHint: "No valid transitions from current status.",
    reasonPlaceholder: "Describe why this status transition is applied...",
    reasonCodePlaceholder: "e.g. RETURNED_NORMAL / DAMAGE_CHECK",
  },
};

export function useInventoryDetailPage(locale: AppLocale, itemId: string) {
  const copy = INVENTORY_DETAIL_COPY[locale];
  const { role } = useAuthAccess();
  const canUseManagerStatuses = isManagerPlusRole(role);

  const detailQuery = useInventoryItemDetailQuery(itemId);
  const statusMutation = useUpdateInventoryItemStatusMutation(itemId);
  const detail = inventoryStore.getDetailByItemId(itemId);

  const [selectedStatusState, setSelectedStatusState] = useState<ItemStatus | null>(null);
  const [reasonNote, setReasonNote] = useState("");
  const [reasonCode, setReasonCode] = useState("");
  const [orderReference, setOrderReference] = useState("");

  const availableTransitions = useMemo(() => {
    const currentStatus = detail?.item.status;
    if (!currentStatus) return [];

    const allTargets = ITEM_STATUS_TRANSITIONS[currentStatus] ?? [];
    return allTargets.filter((status) => {
      if (!MANAGER_ONLY_ITEM_TARGET_STATUSES.includes(status)) {
        return true;
      }

      return canUseManagerStatuses;
    });
  }, [canUseManagerStatuses, detail?.item.status]);

  const selectedStatus = selectedStatusState ?? availableTransitions[0] ?? null;

  const transitionOptions = useMemo(
    () =>
      availableTransitions.map((status) => ({
        value: status,
        label: ITEM_STATUS_LABELS[locale][status],
      })),
    [availableTransitions, locale]
  );
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );

  const coverImageUrl = useMemo(
    () => inventoryClientService.resolveCoverImageUrl(detail?.item.coverImagePath ?? null),
    [detail?.item.coverImagePath]
  );

  const applyStatusTransition = async () => {
    if (!selectedStatus) {
      throw new Error(copy.invalidTransitionHint);
    }

    const payload = inventoryClientService.toStatusPayload({
      toStatus: selectedStatus,
      reasonCode: reasonCode || null,
      reasonNote: reasonNote || null,
      orderId: orderReference || detail?.item.currentOrder?.orderId || null,
    });

    await statusMutation.mutateAsync(payload);
    setSelectedStatusState(null);
    setReasonCode("");
    setReasonNote("");
    setOrderReference("");
  };

  return {
    copy,
    detail,
    detailQuery,
    coverImageUrl,
    statusMutation,
    canUseManagerStatuses,
    transitionOptions,
    selectedStatus,
    setSelectedStatus: (value: ItemStatus) => setSelectedStatusState(value),
    reasonNote,
    setReasonNote,
    reasonCode,
    setReasonCode,
    orderReference,
    setOrderReference,
    applyStatusTransition,
    statusLabels: ITEM_STATUS_LABELS[locale],
    orderStatusLabels,
    resolveOrderStatusLabel: (status: string | null | undefined) => {
      if (status && status in orderStatusLabels) {
        return orderStatusLabels[status as OrderStatus];
      }
      return formatDomainLabelFallback(status, locale);
    },
  };
}
