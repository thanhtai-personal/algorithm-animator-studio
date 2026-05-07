import type { AppLocale } from "@/constants/locale";
import {
  ITEM_STATUS_LABEL_KEYS,
  ORDER_STATUS_LABEL_KEYS,
} from "@/constants/domainPrimitives";
import type {
  OrderPaymentMethod,
  ReturnItemCondition,
  ReturnItemTargetStatus,
} from "@/types/ordersDomain";
import type {
  ReturnDepositRefundStatus,
  ReturnOrderStatus,
} from "@/types/returnOrdersDomain";
import type {
  OrderPaymentMethodLabelKeys,
  ReturnDepositRefundStatusLabelKeys,
  ReturnItemConditionLabelKeys,
  ReturnItemTargetStatusLabelKeys,
  ReturnOrderModalCopyRecord,
  ReturnOrderStatusLabelKeys,
} from "./types";

export const RETURN_ORDER_MODAL_COPY: ReturnOrderModalCopyRecord = {
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

export const ORDER_PAYMENT_METHODS: OrderPaymentMethod[] = ["CASH", "BANK", "MOMO"];
export const RETURN_ITEM_CONDITIONS: ReturnItemCondition[] = ["OK", "NEED_CLEAN", "DAMAGE", "LOST"];
export const RETURN_ITEM_TARGET_STATUSES: ReturnItemTargetStatus[] = [
  "LAUNDRY",
  "READY",
  "MAINTENANCE",
  "DAMAGED",
  "LOST",
];

export const ORDER_PAYMENT_METHOD_LABEL_KEYS: OrderPaymentMethodLabelKeys = {
  CASH: "paymentMethod.cash",
  BANK: "paymentMethod.bank",
  MOMO: "paymentMethod.momo",
};

export const RETURN_ITEM_CONDITION_LABEL_KEYS: ReturnItemConditionLabelKeys = {
  OK: "returnCondition.ok",
  NEED_CLEAN: "returnCondition.needClean",
  DAMAGE: "returnCondition.damage",
  LOST: "returnCondition.lost",
};

export const RETURN_ITEM_TARGET_STATUS_LABEL_KEYS: ReturnItemTargetStatusLabelKeys = {
  READY: ITEM_STATUS_LABEL_KEYS.READY,
  LAUNDRY: ITEM_STATUS_LABEL_KEYS.LAUNDRY,
  MAINTENANCE: ITEM_STATUS_LABEL_KEYS.MAINTENANCE,
  DAMAGED: ITEM_STATUS_LABEL_KEYS.DAMAGED,
  LOST: ITEM_STATUS_LABEL_KEYS.LOST,
};

export const RETURN_ORDER_STATUS_LABEL_KEYS: ReturnOrderStatusLabelKeys = {
  DRAFT: "returnOrderStatus.draft",
  CREATED: "returnOrderStatus.created",
  RETURN_SETTLED: "returnOrderStatus.returnSettled",
  COMPLETED: "returnOrderStatus.completed",
  CANCELLED: "returnOrderStatus.cancelled",
};

export const RETURN_DEPOSIT_REFUND_STATUS_LABEL_KEYS: ReturnDepositRefundStatusLabelKeys = {
  PENDING: "depositRefundStatus.pending",
  REFUNDED: "depositRefundStatus.refunded",
  NOT_REQUIRED: "depositRefundStatus.notRequired",
};
