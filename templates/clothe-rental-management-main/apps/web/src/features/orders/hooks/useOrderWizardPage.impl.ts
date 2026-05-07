"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { validateDateRange } from "@/utils/validation/dateRange";
import type { AppLocale } from "@/constants/locale";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateCustomerMutation,
  useCustomerTypeaheadQuery,
} from "@/features/customers/queries/useCustomersQueries";
import { customersStore } from "@/features/customers/stores/customersStore";
import { useInventoryListQuery } from "@/features/inventory/queries/useInventoryQueries";
import { inventoryStore } from "@/features/inventory/stores/inventoryStore";
import {
  useAddOrderItemMutation,
  useCreateOrderMutation,
  useOrderAvailabilityQuery,
  useOrderDetailQuery,
  useRemoveOrderItemMutation,
  useTransitionOrderStatusMutation,
  useUpdateOrderItemPricingMutation,
  useUpdateOrderMutation,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { ordersStore } from "@/features/orders/stores/ordersStore";
import { useDebouncedValue } from "@/features/orders/utils/useDebouncedValue";
import type {
  CreateOrderPayload,
  OrderDiscountType,
  OrderPaymentMethod,
  OrderPaymentReceiptMethod,
  OrderPricingMode,
  OrderRentPlanType,
  OrderStatusTransitionPayload,
} from "@/types/ordersDomain";
import type {
  OrderStatus,
  OrderType,
  PaymentType,
} from "@/types/domainPrimitives";
import type { ProductPricePlanDto } from "@/types/productsCatalog";
import {
  buildCreateOrderPayload,
  type CreateOrderContractValidationError,
  validateCreateOrderContractInput,
} from "@/utils/orders/createOrderContract";
import { validatePhoneNumber } from "@/utils/validation/phone";

export type OrderWizardMode = "create" | "edit";
type OrderRentPlanOption = Exclude<OrderRentPlanType, null>;
type RentalPricingMode = OrderPricingMode;
type OrderWizardStepKey = "items" | "period" | "customer" | "pricing" | "review";

type PaymentWizardType = Extract<PaymentType, "RENT" | "DEPOSIT" | "FEE">;

interface OrderWizardCopy {
  titleCreate: string;
  titleEdit: string;
  subtitleCreate: string;
  subtitleEdit: string;
  loadingEdit: string;
  notFound: string;
  notEditable: string;
  stepLabels: {
    customer: string;
    period: string;
    items: string;
    pricing: string;
    review: string;
  };
  actions: {
    backToList: string;
    back: string;
    next: string;
    submitDraft: string;
    submitReserved: string;
    submitConfirmed: string;
    saveChanges: string;
    recheckAvailability: string;
  };
  customer: {
    orderTypeLabel: string;
    orderTypeHint: string;
    orderTypeOptions: Record<OrderType, string>;
    searchLabel: string;
    searchPlaceholder: string;
    noResult: string;
    selectedLabel: string;
    switchCustomer: string;
    createInlineAction: string;
    createInlineTitle: string;
    createInlineHint: string;
    fullNameLabel: string;
    phoneLabel: string;
    socialLinkLabel: string;
    noteLabel: string;
    addressLabel: string;
    createSubmit: string;
    createCancel: string;
    customerRequired: string;
    phoneRequired: string;
    phoneInvalid: string;
    nameRequired: string;
    createFailed: string;
    blacklistWarning: string;
  };
  period: {
    title: string;
    pricingModeLabel: string;
    pricingModeHint: string;
    pricingModeOptions: Record<RentalPricingMode, string>;
    startLabel: string;
    endLabel: string;
    pickupTimeLabel: string;
    returnTimeLabel: string;
    saleHint: string;
  };
  items: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    categoryFilter: string;
    allCategories: string;
    sizeFilter: string;
    allSizes: string;
    addAction: string;
    addedAction: string;
    removeAction: string;
    selectedTitle: string;
    selectedEmpty: string;
    unavailable: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    rentPlanLabel: string;
    customDaysLabel: string;
    rentOverrideLabel: string;
    depositOverrideLabel: string;
    discountTypeLabel: string;
    discountValueLabel: string;
    feesLabel: string;
    depositOrderLabel: string;
    noteLabel: string;
    internalNoteLabel: string;
    rentPlanOptions: Record<OrderRentPlanOption, string>;
    discountTypeOptions: {
      none: string;
      amount: string;
      percent: string;
    };
    paymentTitle: string;
    paymentAddAction: string;
    paymentRemoveAction: string;
    paymentTypeLabel: string;
    paymentMethodLabel: string;
    paymentAmountLabel: string;
    paymentNoteLabel: string;
    paymentMissingAmountHint: string;
    paymentTypeOptions: Record<PaymentWizardType, string>;
    paymentMethodOptions: Record<OrderPaymentMethod, string>;
    autoPriceHint: string;
    managerOverrideHint: string;
  };
  review: {
    title: string;
    customer: string;
    period: string;
    itemCount: string;
    subtotal: string;
    discount: string;
    fees: string;
    totalRent: string;
    depositRequired: string;
    depositPaid: string;
    rentPaid: string;
    balance: string;
    note: string;
    internalNote: string;
  };
  paymentReceipt: {
    title: string;
    description: string;
    amountLabel: string;
    methodLabel: string;
    noteLabel: string;
    methodOptions: Record<OrderPaymentReceiptMethod, string>;
    confirmAction: string;
    cancelAction: string;
    amountInvalid: string;
    amountMismatch: string;
    requiredConfirm: string;
  };
  validation: {
    dateInvalid: string;
    pricingModeRequired: string;
    itemRequired: string;
    itemUnavailable: string;
    statusInvalid: string;
    discountExceeded: string;
    paymentInvalid: string;
    branchRequired: string;
    reserveWithoutDeposit: string;
  };
  submitFailed: string;
  saveSuccess: string;
}

interface OrderCustomerSelection {
  id: string;
  fullName: string;
  phone: string | null;
  isBlacklist: boolean;
  warnOnOrderCreate: boolean;
}

interface InlineCustomerDraft {
  fullName: string;
  phone: string;
  socialLink: string;
  address: string;
  note: string;
}

interface OrderItemWizardDraft {
  itemId: string;
  itemCode: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string | null;
  color: string | null;
  pricePlan: ProductPricePlanDto;
  quickRentPrice: number | null;
  rentPlanType: OrderRentPlanOption;
  rentPlanDays: number | null;
  rentPriceOverride: number | null;
  depositOverrideAmount: number | null;
}

interface OrderPaymentDraft {
  id: string;
  type: PaymentWizardType;
  method: OrderPaymentMethod;
  amount: number | null;
  note: string;
}

interface UseOrderWizardPageOptions {
  locale: AppLocale;
  mode: OrderWizardMode;
  orderId?: string;
  redirectOnSuccess?: boolean;
  onSubmitSuccess?: (orderId: string) => void;
}

const PAYMENT_METHODS: OrderPaymentMethod[] = ["CASH", "BANK", "MOMO"];
const RENT_PLAN_OPTIONS: OrderRentPlanOption[] = ["1d", "3d", "7d", "custom"];
const PAYMENT_TYPES: PaymentWizardType[] = ["DEPOSIT", "RENT", "FEE"];
const EDIT_ALLOWED_STATUS = new Set<OrderStatus>(["DRAFT", "RESERVED"]);
const RENTAL_WIZARD_STEPS: OrderWizardStepKey[] = [
  "items",
  "period",
  "customer",
  "pricing",
  "review",
];
const SALE_WIZARD_STEPS: OrderWizardStepKey[] = [
  "items",
  "customer",
  "pricing",
  "review",
];

const INLINE_CUSTOMER_INITIAL: InlineCustomerDraft = {
  fullName: "",
  phone: "",
  socialLink: "",
  address: "",
  note: "",
};

const ORDER_WIZARD_COPY: Record<AppLocale, OrderWizardCopy> = {
  vi: {
    titleCreate: "Tạo đơn mới",
    titleEdit: "Chỉnh sửa đơn",
    subtitleCreate: "MVP wizard: item, thời gian, khách hàng, giá/thu tiền, xác nhận.",
    subtitleEdit: "Chỉ hỗ trợ chỉnh đơn ở trạng thái DRAFT/RESERVED trong flow này.",
    loadingEdit: "Đang tải dữ liệu đơn...",
    notFound: "Không tìm thấy đơn hoặc bạn không có quyền truy cập.",
    notEditable: "Đơn này không còn ở trạng thái cho phép chỉnh sửa trong wizard.",
    stepLabels: {
      customer: "Khách hàng",
      period: "Thời gian thuê",
      items: "Items",
      pricing: "Giá & thanh toán",
      review: "Xác nhận",
    },
    actions: {
      backToList: "Quay lại danh sách đơn",
      back: "Quay lại",
      next: "Tiếp theo",
      submitDraft: "Lưu nháp",
      submitReserved: "Giữ chỗ",
      submitConfirmed: "Xác nhận",
      saveChanges: "Lưu thay đổi",
      recheckAvailability: "Kiểm tra khả dụng",
    },
    customer: {
      orderTypeLabel: "Loại đơn",
      orderTypeHint: "Chọn loại đơn trước khi nhập thông tin chi tiết.",
      orderTypeOptions: {
        RENTAL: "Đơn thuê",
        SALE: "Đơn bán",
      },
      searchLabel: "Tìm khách hàng",
      searchPlaceholder: "Tìm theo tên hoặc số điện thoại...",
      noResult: "Không có kết quả phù hợp.",
      selectedLabel: "Khách đã chọn",
      switchCustomer: "Đổi khách",
      createInlineAction: "Tạo khách hàng mới",
      createInlineTitle: "Tạo khách hàng inline",
      createInlineHint: "Hỗ trợ cảnh báo khách blacklist (không chặn cứng).",
      fullNameLabel: "Họ tên",
      phoneLabel: "Số điện thoại",
      socialLinkLabel: "Liên kết social",
      noteLabel: "Ghi chú",
      addressLabel: "Địa chỉ",
      createSubmit: "Lưu khách hàng",
      createCancel: "Đóng",
      customerRequired: "Vui lòng chọn khách hàng trước khi tiếp tục.",
      phoneRequired: "Số điện thoại là bắt buộc.",
      phoneInvalid: "Số điện thoại chưa đúng định dạng VN (+84 hoặc 0...).",
      nameRequired: "Họ tên khách hàng là bắt buộc.",
      createFailed: "Tạo khách hàng thất bại.",
      blacklistWarning:
        "Khách hàng này đang có cờ cảnh báo blacklist. Bạn vẫn có thể tiếp tục nhưng cần kiểm tra kỹ điều kiện thuê.",
    },
    period: {
      title: "Khoảng thời gian thuê",
      pricingModeLabel: "Loại giá thuê",
      pricingModeHint:
        "Tiêu chuẩn: hôm nay -> +2 ngày (3 ngày). Nhanh: hôm nay -> +24h.",
      pricingModeOptions: {
        STANDARD: "Giá thuê tiêu chuẩn (3 ngày)",
        QUICK: "Giá thuê nhanh (24h)",
      },
      startLabel: "Ngày bắt đầu",
      endLabel: "Ngày trả dự kiến",
      pickupTimeLabel: "Giờ nhận đồ (tùy chọn)",
      returnTimeLabel: "Giờ trả đồ (tùy chọn)",
      saleHint:
        "Đơn bán không yêu cầu thời gian thuê. Hệ thống vẫn giữ mốc ngày mặc định để tương thích dữ liệu.",
    },
    items: {
      title: "Chọn item khả dụng",
      subtitle: "MVP: chỉ hiển thị item trạng thái READY.",
      searchPlaceholder: "Tìm item code hoặc tên sản phẩm...",
      categoryFilter: "Danh mục",
      allCategories: "Tất cả danh mục",
      sizeFilter: "Size",
      allSizes: "Tất cả size",
      addAction: "Thêm",
      addedAction: "Đã chọn",
      removeAction: "Bỏ",
      selectedTitle: "Items đã chọn",
      selectedEmpty: "Chưa có item nào được chọn.",
      unavailable: "Không khả dụng trong khoảng ngày đã chọn",
    },
    pricing: {
      title: "Giá thuê, cọc và ghi nhận thanh toán thủ công",
      subtitle: "Giá mặc định lấy từ biến thể; Manager+ có thể override giá/cọc.",
      rentPlanLabel: "Gói thuê",
      customDaysLabel: "Số ngày custom",
      rentOverrideLabel: "Giá thuê override",
      depositOverrideLabel: "Cọc override",
      discountTypeLabel: "Loại giảm giá",
      discountValueLabel: "Giá trị giảm giá",
      feesLabel: "Phụ phí (MVP)",
      depositOrderLabel: "Cọc cấp đơn (override)",
      noteLabel: "Ghi chú đơn",
      internalNoteLabel: "Ghi chú nội bộ",
      rentPlanOptions: {
        "1d": "1 ngày",
        "3d": "3 ngày",
        "7d": "7 ngày",
        custom: "Custom theo ngày",
      },
      discountTypeOptions: {
        none: "Không giảm giá",
        amount: "Giảm theo tiền",
        percent: "Giảm theo %",
      },
      paymentTitle: "Thanh toán thủ công (phase 1)",
      paymentAddAction: "Thêm payment",
      paymentRemoveAction: "Xóa",
      paymentTypeLabel: "Loại",
      paymentMethodLabel: "Phương thức",
      paymentAmountLabel: "Số tiền",
      paymentNoteLabel: "Payment note",
      paymentMissingAmountHint:
        "Một số dòng payment chưa nhập số tiền. Bạn có thể để trống và bổ sung sau.",
      paymentTypeOptions: {
        DEPOSIT: "Tiền cọc",
        RENT: "Tiền thuê",
        FEE: "Phụ phí",
      },
      paymentMethodOptions: {
        CASH: "Tiền mặt",
        BANK: "Chuyển khoản",
        MOMO: "Momo",
      },
      autoPriceHint: "Giá/cọc tự tính theo cấu hình biến thể nếu không override.",
      managerOverrideHint: "Bạn có quyền Manager+ để chỉnh override giá/cọc.",
    },
    review: {
      title: "Review trước khi submit",
      customer: "Khách hàng",
      period: "Khoảng thuê",
      itemCount: "Số items",
      subtotal: "Tạm tính tiền thuê",
      discount: "Giảm giá",
      fees: "Phụ phí",
      totalRent: "Tổng tiền thuê",
      depositRequired: "Cọc yêu cầu",
      depositPaid: "Cọc đã thu (manual)",
      rentPaid: "Tiền thuê đã thu (manual)",
      balance: "Còn phải thu",
      note: "Ghi chú đơn",
      internalNote: "Ghi chú nội bộ",
    },
    paymentReceipt: {
      title: "Xác nhận đã nhận tiền",
      description:
        "Hệ thống chưa hỗ trợ thanh toán online. Vui lòng xác nhận đã nhận tiền trước khi tạo đơn.",
      amountLabel: "Số tiền đã nhận",
      methodLabel: "Phương thức nhận",
      noteLabel: "Ghi chú nhận tiền",
      methodOptions: {
        CASH: "Tiền mặt",
        BANK: "Chuyển khoản",
      },
      confirmAction: "Xác nhận đã nhận tiền",
      cancelAction: "Hủy",
      amountInvalid: "Số tiền xác nhận phải lớn hơn 0.",
      amountMismatch: "Số tiền xác nhận phải khớp với tổng payment đã nhập.",
      requiredConfirm: "Bạn cần xác nhận đã nhận tiền trước khi tạo đơn.",
    },
    validation: {
      dateInvalid: "Khoảng ngày thuê chưa hợp lệ.",
      pricingModeRequired: "Vui lòng chọn loại giá thuê.",
      itemRequired: "Reserve/Confirm yêu cầu ít nhất 1 item.",
      itemUnavailable: "Có item đang conflict availability, vui lòng đổi item hoặc đổi ngày.",
      statusInvalid: "Trạng thái đơn không hợp lệ với loại đơn đã chọn.",
      discountExceeded: "Giảm giá không được vượt quá tiền thuê tạm tính.",
      paymentInvalid:
        "Thông tin payment khởi tạo chưa hợp lệ (loại/phương thức/trạng thái/số tiền).",
      branchRequired: "Không có chi nhánh mặc định để tạo/sửa đơn.",
      reserveWithoutDeposit:
        "Đơn đang Reserve/Confirm nhưng chưa có payment cọc. Bạn có muốn tiếp tục với cảnh báo này không?",
    },
    submitFailed: "Lưu đơn thất bại.",
    saveSuccess: "Đã lưu đơn thành công.",
  },
  en: {
    titleCreate: "Create order",
    titleEdit: "Edit order",
    subtitleCreate: "MVP wizard: items, period, customer, pricing, review.",
    subtitleEdit: "Only DRAFT/RESERVED orders are editable in this wizard.",
    loadingEdit: "Loading order data...",
    notFound: "Order not found or access denied.",
    notEditable: "This order is not editable in wizard mode.",
    stepLabels: {
      customer: "Customer",
      period: "Rental period",
      items: "Items",
      pricing: "Pricing & payment",
      review: "Review",
    },
    actions: {
      backToList: "Back to orders",
      back: "Back",
      next: "Next",
      submitDraft: "Save draft",
      submitReserved: "Reserve",
      submitConfirmed: "Confirm",
      saveChanges: "Save changes",
      recheckAvailability: "Recheck availability",
    },
    customer: {
      orderTypeLabel: "Order type",
      orderTypeHint: "Choose rental or sale before filling order details.",
      orderTypeOptions: {
        RENTAL: "Rental order",
        SALE: "Sale order",
      },
      searchLabel: "Search customer",
      searchPlaceholder: "Search by name or phone...",
      noResult: "No matching customers.",
      selectedLabel: "Selected customer",
      switchCustomer: "Change",
      createInlineAction: "Create customer",
      createInlineTitle: "Inline customer create",
      createInlineHint: "Blacklist warning is soft and non-blocking in phase 1.",
      fullNameLabel: "Full name",
      phoneLabel: "Phone",
      socialLinkLabel: "Social link",
      noteLabel: "Note",
      addressLabel: "Address",
      createSubmit: "Save customer",
      createCancel: "Close",
      customerRequired: "Please select a customer.",
      phoneRequired: "Phone number is required.",
      phoneInvalid: "Phone format is invalid for VN-friendly validation.",
      nameRequired: "Customer full name is required.",
      createFailed: "Create customer failed.",
      blacklistWarning:
        "This customer is flagged as blacklist. You can continue, but review rental conditions carefully.",
    },
    period: {
      title: "Rental period",
      pricingModeLabel: "Rental pricing mode",
      pricingModeHint:
        "Standard: today -> +2 days (3-day rental). Quick: today -> +24h.",
      pricingModeOptions: {
        STANDARD: "Standard rent (3 days)",
        QUICK: "Quick rent (24h)",
      },
      startLabel: "Start date",
      endLabel: "Expected return date",
      pickupTimeLabel: "Pickup time (optional)",
      returnTimeLabel: "Return time (optional)",
      saleHint:
        "Sale orders do not require rental period fields. Default dates are kept only for data compatibility.",
    },
    items: {
      title: "Select available items",
      subtitle: "MVP: READY items only.",
      searchPlaceholder: "Search item code or product...",
      categoryFilter: "Category",
      allCategories: "All categories",
      sizeFilter: "Size",
      allSizes: "All sizes",
      addAction: "Add",
      addedAction: "Selected",
      removeAction: "Remove",
      selectedTitle: "Selected items",
      selectedEmpty: "No selected items yet.",
      unavailable: "Unavailable in selected date range",
    },
    pricing: {
      title: "Pricing and manual payment",
      subtitle: "Variant price/deposit is default; Manager+ can override.",
      rentPlanLabel: "Rent plan",
      customDaysLabel: "Custom days",
      rentOverrideLabel: "Rent override",
      depositOverrideLabel: "Deposit override",
      discountTypeLabel: "Discount type",
      discountValueLabel: "Discount value",
      feesLabel: "Fees (MVP)",
      depositOrderLabel: "Order-level deposit override",
      noteLabel: "Order note",
      internalNoteLabel: "Internal note",
      rentPlanOptions: {
        "1d": "1-day",
        "3d": "3-day",
        "7d": "7-day",
        custom: "Custom",
      },
      discountTypeOptions: {
        none: "No discount",
        amount: "Amount",
        percent: "Percent",
      },
      paymentTitle: "Manual payments (phase 1)",
      paymentAddAction: "Add payment",
      paymentRemoveAction: "Remove",
      paymentTypeLabel: "Type",
      paymentMethodLabel: "Method",
      paymentAmountLabel: "Amount",
      paymentNoteLabel: "Payment note",
      paymentMissingAmountHint:
        "Some payment rows are missing amount. You can leave them empty and update later.",
      paymentTypeOptions: {
        DEPOSIT: "Deposit",
        RENT: "Rent",
        FEE: "Fee",
      },
      paymentMethodOptions: {
        CASH: "Cash",
        BANK: "Bank transfer",
        MOMO: "Momo",
      },
      autoPriceHint: "Price/deposit is auto-derived if override is empty.",
      managerOverrideHint: "You have Manager+ access for price/deposit override.",
    },
    review: {
      title: "Review",
      customer: "Customer",
      period: "Period",
      itemCount: "Items",
      subtotal: "Rent subtotal",
      discount: "Discount",
      fees: "Fees",
      totalRent: "Total rent",
      depositRequired: "Deposit required",
      depositPaid: "Deposit paid (manual)",
      rentPaid: "Rent paid (manual)",
      balance: "Balance",
      note: "Order note",
      internalNote: "Internal note",
    },
    paymentReceipt: {
      title: "Confirm payment received",
      description:
        "Online payment is not available. Please confirm the amount and method received before creating order.",
      amountLabel: "Received amount",
      methodLabel: "Received method",
      noteLabel: "Receipt note",
      methodOptions: {
        CASH: "Cash",
        BANK: "Bank transfer",
      },
      confirmAction: "Confirm payment received",
      cancelAction: "Cancel",
      amountInvalid: "Confirmed amount must be greater than 0.",
      amountMismatch: "Confirmed amount must match the total payment amount.",
      requiredConfirm: "Payment receipt confirmation is required before order creation.",
    },
    validation: {
      dateInvalid: "Date range is invalid.",
      pricingModeRequired: "Please select rental pricing mode.",
      itemRequired: "Reserve/Confirm requires at least one item.",
      itemUnavailable: "Some selected items are unavailable in the selected date range.",
      statusInvalid: "Order status is invalid for selected order type.",
      discountExceeded: "Discount cannot exceed rent subtotal.",
      paymentInvalid:
        "Initial payment payload is invalid (type/method/status/amount).",
      branchRequired: "No default branch context available.",
      reserveWithoutDeposit:
        "Reserve/Confirm without a posted deposit payment. Do you want to continue?",
    },
    submitFailed: "Save order failed.",
    saveSuccess: "Order saved successfully.",
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

function createPaymentDraft(defaultType: PaymentWizardType = "DEPOSIT"): OrderPaymentDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: defaultType,
    method: "CASH",
    amount: null,
    note: "",
  };
}

function createDefaultPaymentsForOrderType(orderType: OrderType): OrderPaymentDraft[] {
  if (orderType === "SALE") {
    return [createPaymentDraft("RENT")];
  }

  return [createPaymentDraft("DEPOSIT"), createPaymentDraft("RENT")];
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoTime(value: Date): string {
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function computeRentalScheduleByPricingMode(mode: RentalPricingMode): {
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
} {
  const now = new Date();
  const startDate = toIsoDate(now);
  const pickupTime = toIsoTime(now);
  const endDate = toIsoDate(addDays(now, mode === "QUICK" ? 1 : 2));
  return {
    startDate,
    endDate,
    pickupTime,
    returnTime: pickupTime,
  };
}

function computeAutoRentPrice(
  pricePlan: ProductPricePlanDto,
  planType: OrderRentPlanOption,
  planDays: number | null
): number {
  const price1d = pricePlan.price1d ?? pricePlan.pricePerDay ?? 0;
  const price3d = pricePlan.price3d ?? ((pricePlan.pricePerDay ?? price1d) * 3);
  const price7d = pricePlan.price7d ?? ((pricePlan.pricePerDay ?? price1d) * 7);

  if (planType === "1d") return Math.max(0, price1d);
  if (planType === "3d") return Math.max(0, price3d);
  if (planType === "7d") return Math.max(0, price7d);

  const days = Math.max(1, planDays ?? 1);
  const perDay = pricePlan.pricePerDay ?? pricePlan.price1d ?? 0;
  return Math.max(0, perDay * days);
}

function computeDiscountAmount(options: {
  subtotal: number;
  discountType: OrderDiscountType;
  discountValue: number | null;
}): number {
  if (!options.discountType || options.discountValue === null) return 0;

  if (options.discountType === "amount") {
    return Math.max(0, Math.min(options.discountValue, options.subtotal));
  }

  const clampedPercent = Math.max(0, Math.min(options.discountValue, 100));
  return Math.max(0, Math.min((options.subtotal * clampedPercent) / 100, options.subtotal));
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function parsePositiveAmountInput(value: string): number | null {
  const parsed = Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundMoney(parsed);
}

function toCustomerSelection(input: {
  id: string;
  fullName: string;
  phone: string | null;
  isBlacklist: boolean;
  warnOnOrderCreate: boolean;
}): OrderCustomerSelection {
  return {
    id: input.id,
    fullName: input.fullName,
    phone: input.phone,
    isBlacklist: input.isBlacklist,
    warnOnOrderCreate: input.warnOnOrderCreate,
  };
}

function mapCreateOrderContractErrorMessage(
  errorCode: CreateOrderContractValidationError,
  copy: OrderWizardCopy
): string {
  if (errorCode === "branch-required") {
    return copy.validation.branchRequired;
  }

  if (errorCode === "customer-required") {
    return copy.customer.customerRequired;
  }

  if (errorCode === "pricing-mode-required") {
    return copy.validation.pricingModeRequired;
  }

  if (errorCode === "date-invalid") {
    return copy.validation.dateInvalid;
  }

  if (errorCode === "status-invalid") {
    return copy.validation.statusInvalid;
  }

  return copy.validation.itemRequired;
}

function mapCreateOrderSubmitErrorMessage(error: unknown, copy: OrderWizardCopy): string {
  const message = error instanceof Error ? error.message : "";

  if (
    message === "INVALID_PAYMENT_TYPE" ||
    message === "INVALID_PAYMENT_METHOD" ||
    message === "INVALID_PAYMENT_STATUS" ||
    message === "PAYMENT_AMOUNT_INVALID"
  ) {
    return copy.validation.paymentInvalid;
  }

  if (message === "PAYMENT_RECEIPT_CONFIRM_REQUIRED") {
    return copy.paymentReceipt.requiredConfirm;
  }

  if (message === "PAYMENT_RECEIPT_METHOD_INVALID") {
    return copy.validation.paymentInvalid;
  }

  if (message === "PAYMENT_RECEIPT_AMOUNT_MISMATCH") {
    return copy.paymentReceipt.amountMismatch;
  }

  if (message === "INVALID_ORDER_STATUS") {
    return copy.validation.statusInvalid;
  }

  if (message === "INVALID_PRICING_MODE") {
    return copy.validation.pricingModeRequired;
  }

  if (message === "INVALID_DATE_RANGE") {
    return copy.validation.dateInvalid;
  }

  if (message === "ORDER_REQUIRES_ITEMS_FOR_STATUS") {
    return copy.validation.itemRequired;
  }

  return message || copy.submitFailed;
}

export function useOrderWizardPage({
  locale,
  mode,
  orderId,
  redirectOnSuccess = true,
  onSubmitSuccess,
}: UseOrderWizardPageOptions) {
  const copy = ORDER_WIZARD_COPY[locale];
  const router = useRouter();
  const { currentBranchId, role } = useAuthAccess();
  const { confirm } = useAppModal();
  const canOverridePricing = isManagerPlusRole(role);

  const [stepIndexState, setStepIndexState] = useState(0);

  const [customerSearchInput, setCustomerSearchInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<OrderCustomerSelection | null>(null);
  const [inlineCustomerOpen, setInlineCustomerOpen] = useState(false);
  const [inlineCustomerDraft, setInlineCustomerDraft] =
    useState<InlineCustomerDraft>(INLINE_CUSTOMER_INITIAL);
  const [orderType, setOrderType] = useState<OrderType>("RENTAL");
  const [rentalPricingMode, setRentalPricingMode] = useState<RentalPricingMode>("STANDARD");

  const createDefaultRentalSchedule = () => computeRentalScheduleByPricingMode("STANDARD");
  const initialRentalSchedule = createDefaultRentalSchedule();

  const [startDate, setStartDate] = useState(() =>
    mode === "create" ? initialRentalSchedule.startDate : ""
  );
  const [endDate, setEndDate] = useState(() =>
    mode === "create" ? initialRentalSchedule.endDate : ""
  );
  const [pickupTime, setPickupTime] = useState(() =>
    mode === "create" ? initialRentalSchedule.pickupTime : ""
  );
  const [returnTime, setReturnTime] = useState(() =>
    mode === "create" ? initialRentalSchedule.returnTime : ""
  );

  const [itemSearchInput, setItemSearchInput] = useState("");
  const [itemProductCategoryId, setItemProductCategoryId] = useState("");
  const [itemSizeFilter, setItemSizeFilter] = useState("");
  const [inventoryPage, setInventoryPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<OrderItemWizardDraft[]>([]);

  const [discountType, setDiscountType] = useState<OrderDiscountType>(null);
  const [discountValue, setDiscountValue] = useState<number | null>(null);
  const [feesAmount, setFeesAmount] = useState<number | null>(0);
  const [orderDepositOverride, setOrderDepositOverride] = useState<number | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const [payments, setPayments] = useState<OrderPaymentDraft[]>(() =>
    mode === "create" ? createDefaultPaymentsForOrderType("RENTAL") : []
  );
  const [paymentReceiptModalOpen, setPaymentReceiptModalOpen] = useState(false);
  const [paymentReceiptAmountInput, setPaymentReceiptAmountInput] = useState("0");
  const [paymentReceiptMethod, setPaymentReceiptMethod] =
    useState<OrderPaymentReceiptMethod>("CASH");
  const [paymentReceiptNote, setPaymentReceiptNote] = useState("");
  const [paymentReceiptError, setPaymentReceiptError] = useState<string | null>(null);
  const [pendingSubmitStatus, setPendingSubmitStatus] = useState<OrderStatus | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [initializedEditState, setInitializedEditState] = useState(false);

  const debouncedCustomerSearch = useDebouncedValue(customerSearchInput, 250);
  const debouncedItemSearch = useDebouncedValue(itemSearchInput, 300);

  const detailQuery = useOrderDetailQuery(mode === "edit" ? orderId ?? "" : "");
  const detail = mode === "edit" && orderId ? ordersStore.getDetailByOrderId(orderId) : null;

  useCustomerTypeaheadQuery({
    branchId: currentBranchId,
    search: debouncedCustomerSearch,
    limit: 8,
  });

  useInventoryListQuery({
    branchId: currentBranchId,
    status: "READY",
    productCategoryId: itemProductCategoryId || null,
    size: itemSizeFilter || null,
    search: debouncedItemSearch,
    page: inventoryPage,
    pageSize: 24,
  });

  const createCustomerMutation = useCreateCustomerMutation();
  const createOrderMutation = useCreateOrderMutation();
  const updateOrderMutation = useUpdateOrderMutation(orderId ?? "");
  const addItemMutation = useAddOrderItemMutation(orderId ?? "");
  const updateItemPricingMutation = useUpdateOrderItemPricingMutation(orderId ?? "");
  const removeItemMutation = useRemoveOrderItemMutation(orderId ?? "");
  const transitionMutation = useTransitionOrderStatusMutation(orderId ?? "");

  useEffect(() => {
    if (mode !== "edit") return;
    if (!detail || initializedEditState) return;

    setSelectedCustomer(
      toCustomerSelection({
        id: detail.summary.customer.customerId,
        fullName: detail.summary.customer.fullName,
        phone: detail.summary.customer.phone,
        isBlacklist: false,
        warnOnOrderCreate: false,
      })
    );

    setOrderType(detail.summary.orderType);
    setRentalPricingMode(detail.summary.pricingMode ?? "STANDARD");
    setStartDate(detail.summary.startDate);
    setEndDate(detail.summary.endDate);
    setPickupTime(detail.summary.pickupTime ?? "");
    setReturnTime(detail.summary.returnTime ?? "");
    setDiscountType(detail.summary.discountType);
    setDiscountValue(detail.summary.discountValue);
    setFeesAmount(detail.summary.money.feesAmount);
    setOrderDepositOverride(
      detail.summary.orderType === "SALE" ? null : detail.summary.money.depositAmount
    );
    setOrderNote(detail.summary.note ?? "");
    setInternalNote(detail.summary.internalNote ?? "");

    setSelectedItems(
      detail.items.map((item) => {
        const fallbackPerDay =
          item.rentPlanType === "custom" && (item.rentPlanDays ?? 0) > 0
            ? item.rentPrice / Math.max(1, item.rentPlanDays ?? 1)
            : item.rentPrice;

        return {
          itemId: item.itemId,
          itemCode: item.itemCode ?? item.itemId,
          productId: item.productId,
          productName: item.productName ?? "-",
          variantId: item.variantId,
          variantName: item.variantName ?? "-",
          size: null,
          color: null,
          pricePlan: {
            defaultDepositAmount:
              item.depositEffectiveAmount ?? item.depositOverrideAmount ?? 0,
            price1d: item.rentPrice,
            price3d: item.rentPrice,
            price7d: item.rentPrice,
            pricePerDay: fallbackPerDay,
          },
          quickRentPrice: null,
          rentPlanType: (item.rentPlanType ?? "1d") as OrderRentPlanOption,
          rentPlanDays: item.rentPlanDays,
          rentPriceOverride: canOverridePricing ? item.rentPrice : null,
          depositOverrideAmount: canOverridePricing
            ? item.depositOverrideAmount
            : null,
        };
      })
    );

    setInitializedEditState(true);
  }, [canOverridePricing, detail, initializedEditState, mode]);

  useEffect(() => {
    if (orderType === "SALE") {
      setPickupTime("");
      setReturnTime("");
      return;
    }

    if (mode !== "create") return;
    const schedule = computeRentalScheduleByPricingMode(rentalPricingMode);
    setStartDate(schedule.startDate);
    setEndDate(schedule.endDate);
    setPickupTime(schedule.pickupTime);
    setReturnTime(schedule.returnTime);
  }, [mode, orderType, rentalPricingMode]);

  useEffect(() => {
    if (mode !== "create") return;

    if (orderType === "SALE") {
      setOrderDepositOverride(null);
      setPayments((previous) => {
        const filtered = previous.filter((entry) => entry.type !== "DEPOSIT");
        return filtered.length > 0 ? filtered : createDefaultPaymentsForOrderType("SALE");
      });
      return;
    }

    setPayments((previous) => {
      if (previous.length === 0) {
        return createDefaultPaymentsForOrderType("RENTAL");
      }

      const hasDeposit = previous.some((entry) => entry.type === "DEPOSIT");
      const hasRent = previous.some((entry) => entry.type === "RENT");
      if (hasDeposit && hasRent) {
        return previous;
      }

      const next = [...previous];
      if (!hasDeposit) {
        next.unshift(createPaymentDraft("DEPOSIT"));
      }
      if (!hasRent) {
        next.push(createPaymentDraft("RENT"));
      }
      return next;
    });
  }, [mode, orderType]);

  const selectedItemIds = useMemo(
    () => selectedItems.map((entry) => entry.itemId),
    [selectedItems]
  );

  const availabilityQuery = useOrderAvailabilityQuery({
    branchId: currentBranchId,
    itemIds: selectedItemIds,
    startDate,
    endDate,
    excludeOrderId: mode === "edit" ? orderId ?? null : null,
  });

  const dateValidation = useMemo(
    () => validateDateRange({ startDate, endDate }, { allowSameDay: false }),
    [endDate, startDate]
  );

  const selectedItemsComputed = useMemo(
    () =>
      selectedItems.map((item) => {
        const standardRentPrice = computeAutoRentPrice(
          item.pricePlan,
          item.rentPlanType,
          item.rentPlanDays
        );
        const quickRentPrice = item.quickRentPrice ?? standardRentPrice;
        const effectiveRentPrice =
          item.rentPriceOverride ??
          (orderType === "RENTAL"
            ? rentalPricingMode === "QUICK"
              ? quickRentPrice
              : standardRentPrice
            : standardRentPrice);
        const effectiveDeposit =
          item.depositOverrideAmount ?? item.pricePlan.defaultDepositAmount ?? 0;

        return {
          ...item,
          effectiveRentPrice,
          effectiveDeposit,
        };
      }),
    [orderType, rentalPricingMode, selectedItems]
  );

  const availabilityByItemId = useMemo(() => {
    const map = new Map<string, { isAvailable: boolean; reasons: string[] }>();
    for (const entry of availabilityQuery.data?.items ?? []) {
      map.set(entry.itemId, {
        isAvailable: entry.isAvailable,
        reasons: entry.reasons,
      });
    }
    return map;
  }, [availabilityQuery.data?.items]);

  const unavailableSelectedItemIds = useMemo(() => {
    const set = new Set<string>();
    for (const item of selectedItemsComputed) {
      const availability = availabilityByItemId.get(item.itemId);
      if (availability && !availability.isAvailable) {
        set.add(item.itemId);
      }
    }
    return set;
  }, [availabilityByItemId, selectedItemsComputed]);

  const subtotal = useMemo(
    () =>
      selectedItemsComputed.reduce(
        (sum, item) => sum + Math.max(0, item.effectiveRentPrice),
        0
      ),
    [selectedItemsComputed]
  );

  const discountAmount = useMemo(
    () =>
      computeDiscountAmount({
        subtotal,
        discountType,
        discountValue,
      }),
    [discountType, discountValue, subtotal]
  );

  const totalRent = useMemo(
    () => Math.max(0, subtotal - discountAmount + Math.max(0, feesAmount ?? 0)),
    [discountAmount, feesAmount, subtotal]
  );

  const depositSuggested = useMemo(
    () =>
      selectedItemsComputed.reduce(
        (sum, item) => sum + Math.max(0, item.effectiveDeposit),
        0
      ),
    [selectedItemsComputed]
  );

  const depositRequired =
    orderType === "SALE"
      ? 0
      : orderDepositOverride === null
        ? depositSuggested
        : Math.max(0, orderDepositOverride);

  const depositPaid = useMemo(
    () =>
      payments
        .filter((entry) => entry.type === "DEPOSIT")
        .reduce((sum, entry) => sum + Math.max(0, entry.amount ?? 0), 0),
    [payments]
  );

  const rentPaid = useMemo(
    () =>
      payments
        .filter((entry) => entry.type === "RENT" || entry.type === "FEE")
        .reduce((sum, entry) => sum + Math.max(0, entry.amount ?? 0), 0),
    [payments]
  );

  const balance = Math.max(0, totalRent + depositRequired - (depositPaid + rentPaid));
  const createPaymentsDraft = useMemo(() => {
    const output: NonNullable<CreateOrderPayload["payments"]> = [];
    for (const entry of payments) {
      if (entry.amount === null) continue;
      const amount = Math.max(0, entry.amount);
      if (amount <= 0) continue;

      if (orderType === "RENTAL" && entry.type !== "DEPOSIT") continue;

      output.push({
        type: entry.type,
        method: entry.method,
        amount,
        status: "POSTED",
        note: entry.note || null,
        source: "ORDER_CREATE_WIZARD",
      });
    }

    return output;
  }, [orderType, payments]);
  const createPaymentsCollectedAmount = useMemo(
    () =>
      roundMoney(
        createPaymentsDraft.reduce((sum, entry) => {
          if ((entry.status ?? "POSTED") !== "POSTED" || entry.type === "REFUND") {
            return sum;
          }
          return sum + entry.amount;
        }, 0)
      ),
    [createPaymentsDraft]
  );
  const hasUnfilledPaymentAmounts = useMemo(
    () => payments.some((entry) => entry.amount === null),
    [payments]
  );
  const paymentTypes =
    orderType === "SALE"
      ? PAYMENT_TYPES.filter((type) => type !== "DEPOSIT")
      : PAYMENT_TYPES.filter((type) => type === "DEPOSIT");

  const customerTypeaheadItems = customersStore.typeaheadItems.map((entry) =>
    toCustomerSelection({
      id: entry.id,
      fullName: entry.fullName,
      phone: entry.phone,
      isBlacklist: entry.isBlacklist,
      warnOnOrderCreate: entry.warnOnOrderCreate,
    })
  );

  const availableInventoryItems = inventoryStore.listItems;
  const inventoryTotalPages = (() => {
    if (inventoryStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(inventoryStore.listTotal / inventoryStore.listPageSize));
  })();

  const wizardStepKeys = useMemo(
    () => (orderType === "SALE" ? SALE_WIZARD_STEPS : RENTAL_WIZARD_STEPS),
    [orderType]
  );
  const steps = useMemo(
    () =>
      wizardStepKeys.map((key) => ({
        key,
        label: copy.stepLabels[key],
      })),
    [copy.stepLabels, wizardStepKeys]
  );
  const maxStepIndex = Math.max(0, steps.length - 1);
  const currentStepKey = (steps[stepIndexState]?.key ?? "items") as OrderWizardStepKey;

  useEffect(() => {
    setStepIndexState((previous) => Math.min(previous, maxStepIndex));
  }, [maxStepIndex]);

  const hasSelectedItems = selectedItems.length > 0;
  const hasSelectedCustomer = Boolean(selectedCustomer);
  const hasValidPeriod = orderType === "SALE" ? true : dateValidation.isValid;

  const canEnterStep = (stepKey: OrderWizardStepKey): boolean => {
    if (stepKey === "items") return true;
    if (stepKey === "period") return hasSelectedItems;
    if (stepKey === "customer") return hasSelectedItems && hasValidPeriod;
    if (stepKey === "pricing") {
      return hasSelectedItems && hasValidPeriod && hasSelectedCustomer;
    }
    return hasSelectedItems && hasValidPeriod && hasSelectedCustomer;
  };

  const setStepIndex = (nextIndex: number) => {
    const normalizedIndex = Math.max(0, Math.min(Math.trunc(nextIndex), maxStepIndex));
    const targetStep = steps[normalizedIndex];
    if (!targetStep) return;
    if (!canEnterStep(targetStep.key as OrderWizardStepKey)) return;
    setStepIndexState(normalizedIndex);
  };

  const canProceedCurrentStep = (() => {
    if (currentStepKey === "items") {
      return hasSelectedItems;
    }

    if (currentStepKey === "period") {
      return hasValidPeriod;
    }

    if (currentStepKey === "customer") {
      return hasSelectedCustomer;
    }

    if (currentStepKey === "pricing") {
      return true;
    }

    return true;
  })();

  const loading =
    createOrderMutation.isPending ||
    updateOrderMutation.isPending ||
    addItemMutation.isPending ||
    updateItemPricingMutation.isPending ||
    removeItemMutation.isPending ||
    transitionMutation.isPending ||
    createCustomerMutation.isPending;

  const isEditMode = mode === "edit";
  const isEditLoading = isEditMode && detailQuery.isLoading && !detail;
  const isEditMissing = isEditMode && !isEditLoading && !detail;
  const isEditableStatus =
    !isEditMode || (detail ? EDIT_ALLOWED_STATUS.has(detail.summary.status) : false);

  const createInlineCustomer = async () => {
    if (!currentBranchId) {
      throw new Error(copy.validation.branchRequired);
    }

    const fullName = inlineCustomerDraft.fullName.trim();
    if (!fullName) {
      throw new Error(copy.customer.nameRequired);
    }

    const phone = inlineCustomerDraft.phone.trim();
    if (!phone) {
      throw new Error(copy.customer.phoneRequired);
    }

    const phoneValidation = validatePhoneNumber(phone, { allowEmpty: false });
    if (!phoneValidation.isValid) {
      throw new Error(copy.customer.phoneInvalid);
    }

    const detail = await createCustomerMutation.mutateAsync({
      branchId: currentBranchId,
      fullName,
      phone,
      socialLink: inlineCustomerDraft.socialLink || null,
      address: inlineCustomerDraft.address || null,
      note: inlineCustomerDraft.note || null,
      tagIds: [],
      isActive: true,
    });

    const hasBlacklist = detail.customer.tags.some((tag) =>
      tag.code.toLowerCase().includes("blacklist")
    );

    const hasWarningTag = detail.customer.tags.some((tag) =>
      tag.warnOnOrderCreate || tag.code.toLowerCase().includes("warn")
    );

    setSelectedCustomer(
      toCustomerSelection({
        id: detail.customer.id,
        fullName: detail.customer.fullName,
        phone: detail.customer.phone,
        isBlacklist: hasBlacklist,
        warnOnOrderCreate: hasWarningTag,
      })
    );

    setInlineCustomerDraft(INLINE_CUSTOMER_INITIAL);
    setInlineCustomerOpen(false);
    setCustomerSearchInput(detail.customer.fullName);
  };

  const addSelectedItem = (itemId: string) => {
    const source = availableInventoryItems.find((entry) => entry.id === itemId);
    if (!source) return;

    setSelectedItems((previous) => {
      if (previous.some((entry) => entry.itemId === itemId)) {
        return previous;
      }

      return [
        ...previous,
        {
          itemId: source.id,
          itemCode: source.itemCode,
          productId: source.productId,
          productName: source.productName,
          variantId: source.variantId,
          variantName: source.variantName,
          size: source.size,
          color: source.color,
          pricePlan: source.pricePlan,
          quickRentPrice: source.quickRentPrice ?? null,
          rentPlanType: "1d",
          rentPlanDays: null,
          rentPriceOverride: null,
          depositOverrideAmount: null,
        },
      ];
    });
  };

  const removeSelectedItem = (itemId: string) => {
    setSelectedItems((previous) =>
      previous.filter((entry) => entry.itemId !== itemId)
    );
  };

  const updateSelectedItem = (
    itemId: string,
    updater: (item: OrderItemWizardDraft) => OrderItemWizardDraft
  ) => {
    setSelectedItems((previous) =>
      previous.map((entry) => (entry.itemId === itemId ? updater(entry) : entry))
    );
  };

  const addPayment = () => {
    const defaultType: PaymentWizardType = orderType === "SALE" ? "RENT" : "DEPOSIT";
    setPayments((previous) => [...previous, createPaymentDraft(defaultType)]);
  };

  const updatePayment = (
    paymentId: string,
    updater: (previous: OrderPaymentDraft) => OrderPaymentDraft
  ) => {
    setPayments((previous) =>
      previous.map((entry) => (entry.id === paymentId ? updater(entry) : entry))
    );
  };

  const removePayment = (paymentId: string) => {
    setPayments((previous) => previous.filter((entry) => entry.id !== paymentId));
  };

  const goNextStep = () => {
    if (!canProceedCurrentStep) return;
    setStepIndex(stepIndexState + 1);
  };

  const goPreviousStep = () => {
    setStepIndexState((previous) => Math.max(previous - 1, 0));
  };

  const validateBeforeSubmit = async (targetStatus: OrderStatus): Promise<void> => {
    const contractValidation = validateCreateOrderContractInput({
      branchId: currentBranchId,
      customerId: selectedCustomer?.id ?? null,
      orderType,
      pricingMode: orderType === "RENTAL" ? rentalPricingMode : null,
      status: targetStatus as CreateOrderPayload["status"],
      startDate,
      endDate,
      itemCount: selectedItemsComputed.length,
    });
    if (!contractValidation.isValid && contractValidation.error) {
      throw new Error(
        mapCreateOrderContractErrorMessage(contractValidation.error, copy)
      );
    }

    if (orderType === "RENTAL" && selectedItemsComputed.length > 0) {
      const latestAvailability = await availabilityQuery.refetch();
      const unavailableFromLatest = new Set<string>();
      for (const item of latestAvailability.data?.items ?? []) {
        if (!item.isAvailable) {
          unavailableFromLatest.add(item.itemId);
        }
      }

      const hasUnavailable = selectedItemsComputed.some((item) =>
        unavailableFromLatest.has(item.itemId)
      );
      if (hasUnavailable) {
        throw new Error(copy.validation.itemUnavailable);
      }
    } else if (unavailableSelectedItemIds.size > 0) {
      throw new Error(copy.validation.itemUnavailable);
    }

    if (discountAmount > subtotal) {
      throw new Error(copy.validation.discountExceeded);
    }

    if (
      orderType === "RENTAL" &&
      (targetStatus === "RESERVED" || targetStatus === "CONFIRMED") &&
      depositPaid <= 0
    ) {
      const accepted = await confirm({
        title: copy.validation.reserveWithoutDeposit,
      });
      if (!accepted) {
        throw new Error(copy.validation.reserveWithoutDeposit);
      }
    }
  };

  const buildItemPayload = (item: OrderItemWizardDraft) => {
    const payload: {
      itemId: string;
      rentPlanType?: OrderRentPlanType;
      rentPlanDays?: number;
      rentPrice?: number;
      depositOverrideAmount?: number;
    } = {
      itemId: item.itemId,
    };

    if (orderType === "RENTAL") {
      payload.rentPlanType = rentalPricingMode === "QUICK" ? "1d" : "3d";
      payload.rentPlanDays = rentalPricingMode === "QUICK" ? 1 : 3;
    }

    if (canOverridePricing && item.rentPriceOverride !== null) {
      payload.rentPrice = Math.max(0, item.rentPriceOverride);
    }

    if (orderType === "RENTAL" && canOverridePricing && item.depositOverrideAmount !== null) {
      payload.depositOverrideAmount = Math.max(0, item.depositOverrideAmount);
    }

    return payload;
  };

  const closePaymentReceiptModal = () => {
    setPaymentReceiptModalOpen(false);
    setPendingSubmitStatus(null);
    setPaymentReceiptError(null);
    setPaymentReceiptNote("");
  };

  const submitOrderWithPaymentReceipt = async (
    targetStatus: OrderStatus,
    paymentReceiptConfirmation?: CreateOrderPayload["paymentReceiptConfirmation"]
  ) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);

      await validateBeforeSubmit(targetStatus);

      const itemPayload = selectedItemsComputed.map((item) => buildItemPayload(item));
      const discountValuePayload =
        discountType && discountValue !== null ? Math.max(0, discountValue) : undefined;
      const feesPayload = feesAmount === null ? undefined : Math.max(0, feesAmount);
      const depositPayload =
        orderType === "RENTAL" && canOverridePricing && orderDepositOverride !== null
          ? Math.max(0, orderDepositOverride)
          : undefined;
      const preferredReceiptMethod = (createPaymentsDraft.find(
        (entry) => entry.method === "CASH" || entry.method === "BANK"
      )?.method ?? "CASH") as OrderPaymentReceiptMethod;

      if (
        mode === "create" &&
        createPaymentsCollectedAmount > 0 &&
        !paymentReceiptConfirmation
      ) {
        setPendingSubmitStatus(targetStatus);
        setPaymentReceiptAmountInput(String(createPaymentsCollectedAmount));
        setPaymentReceiptMethod(preferredReceiptMethod);
        setPaymentReceiptNote("");
        setPaymentReceiptError(null);
        setPaymentReceiptModalOpen(true);
        return;
      }

      if (
        mode === "create" &&
        createPaymentsCollectedAmount > 0 &&
        paymentReceiptConfirmation &&
        Math.abs(paymentReceiptConfirmation.amount - createPaymentsCollectedAmount) > 0.01
      ) {
        throw new Error(copy.paymentReceipt.amountMismatch);
      }

      const createPayments =
        mode === "create" && createPaymentsCollectedAmount > 0 && paymentReceiptConfirmation
          ? createPaymentsDraft.map((entry) =>
              (entry.status ?? "POSTED") === "POSTED" && entry.type !== "REFUND"
                ? {
                    ...entry,
                    method: paymentReceiptConfirmation.method,
                  }
                : entry
            )
          : createPaymentsDraft;
      const createStatus = targetStatus as CreateOrderPayload["status"];

      if (mode === "create") {
        const created = await createOrderMutation.mutateAsync(
          buildCreateOrderPayload({
            branchId: currentBranchId,
            orderType,
            pricingMode: orderType === "RENTAL" ? rentalPricingMode : null,
            customerId: selectedCustomer!.id,
            status: createStatus,
            startDate,
            endDate,
            pickupTime,
            returnTime,
            discountType,
            discountValue: discountValuePayload,
            feesAmount: feesPayload,
            depositAmount: depositPayload,
            note: orderNote,
            internalNote,
            items: itemPayload,
            payments: createPayments,
            paymentReceiptConfirmation:
              createPaymentsCollectedAmount > 0 ? paymentReceiptConfirmation : undefined,
          })
        );

        closePaymentReceiptModal();
        setSubmitSuccess(copy.saveSuccess);
        toast.success(copy.saveSuccess);
        onSubmitSuccess?.(created.summary.id);
        if (redirectOnSuccess) {
          router.push(`/${locale}/orders/${created.summary.id}`);
        }
        return;
      }

      if (!orderId || !detail) {
        throw new Error(copy.notFound);
      }

      if (!EDIT_ALLOWED_STATUS.has(detail.summary.status)) {
        throw new Error(copy.notEditable);
      }

      let latestDetail = await updateOrderMutation.mutateAsync({
        startDate,
        endDate,
        pickupTime: orderType === "SALE" ? null : pickupTime || null,
        returnTime: orderType === "SALE" ? null : returnTime || null,
        discountType,
        discountValue: discountValuePayload,
        feesAmount: feesPayload,
        depositAmount: depositPayload,
        note: orderNote || null,
        internalNote: internalNote || null,
      });

      const existingByItemId = new Map(
        detail.items.map((entry) => [entry.itemId, entry.orderItemId])
      );

      const selectedIdSet = new Set(selectedItemsComputed.map((entry) => entry.itemId));

      for (const existing of detail.items) {
        if (!selectedIdSet.has(existing.itemId)) {
          latestDetail = await removeItemMutation.mutateAsync(existing.orderItemId);
        }
      }

      for (const selected of selectedItemsComputed) {
        const existingOrderItemId = existingByItemId.get(selected.itemId);

        if (!existingOrderItemId) {
          latestDetail = await addItemMutation.mutateAsync(buildItemPayload(selected));
          continue;
        }

        const pricingPayload: {
          rentPlanType?: OrderRentPlanType;
          rentPlanDays?: number;
          rentPrice?: number;
          depositOverrideAmount?: number;
        } = {};

        if (orderType === "RENTAL") {
          pricingPayload.rentPlanType = rentalPricingMode === "QUICK" ? "1d" : "3d";
          pricingPayload.rentPlanDays = rentalPricingMode === "QUICK" ? 1 : 3;
        }

        if (canOverridePricing && selected.rentPriceOverride !== null) {
          pricingPayload.rentPrice = Math.max(0, selected.rentPriceOverride);
        }

        if (orderType === "RENTAL" && canOverridePricing && selected.depositOverrideAmount !== null) {
          pricingPayload.depositOverrideAmount = Math.max(
            0,
            selected.depositOverrideAmount
          );
        }

        latestDetail = await updateItemPricingMutation.mutateAsync({
          orderItemId: existingOrderItemId,
          payload: pricingPayload,
        });
      }

      if (latestDetail.summary.status !== targetStatus) {
        latestDetail = await transitionMutation.mutateAsync({
          toStatus: targetStatus,
          reason: mode === "edit" ? "WIZARD_EDIT" : "WIZARD_CREATE",
        } as OrderStatusTransitionPayload);
      }

      setSubmitSuccess(copy.saveSuccess);
      onSubmitSuccess?.(latestDetail.summary.id);
      if (redirectOnSuccess) {
        router.push(`/${locale}/orders/${latestDetail.summary.id}`);
      }
    } catch (error) {
      const message = mapCreateOrderSubmitErrorMessage(error, copy);
      setSubmitError(message);
      if (paymentReceiptModalOpen) {
        setPaymentReceiptError(message);
      }
    }
  };

  const submitOrder = async (targetStatus: OrderStatus) => {
    await submitOrderWithPaymentReceipt(targetStatus);
  };

  const confirmPaymentReceiptAndSubmit = async () => {
    if (!pendingSubmitStatus) return;

    const amount = parsePositiveAmountInput(paymentReceiptAmountInput);
    if (amount === null) {
      setPaymentReceiptError(copy.paymentReceipt.amountInvalid);
      return;
    }

    if (Math.abs(amount - createPaymentsCollectedAmount) > 0.01) {
      setPaymentReceiptError(copy.paymentReceipt.amountMismatch);
      return;
    }

    setPaymentReceiptError(null);
    await submitOrderWithPaymentReceipt(pendingSubmitStatus, {
      confirmed: true,
      amount,
      method: paymentReceiptMethod,
      note: paymentReceiptNote.trim() || null,
    });
  };

  return {
    copy,
    locale,
    mode,
    loading,
    isEditLoading,
    isEditMissing,
    isEditableStatus,
    stepIndex: stepIndexState,
    currentStepKey,
    steps,
    maxStepIndex,
    setStepIndex,
    canProceedCurrentStep,
    goNextStep,
    goPreviousStep,
    customerSearchInput,
    setCustomerSearchInput,
    customerTypeaheadItems,
    selectedCustomer,
    setSelectedCustomer,
    inlineCustomerOpen,
    setInlineCustomerOpen,
    inlineCustomerDraft,
    setInlineCustomerDraft,
    createInlineCustomer,
    createCustomerMutation,
    orderType,
    setOrderType,
    rentalPricingMode,
    setRentalPricingMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    pickupTime,
    setPickupTime,
    returnTime,
    setReturnTime,
    dateValidation,
    itemSearchInput,
    setItemSearchInput: (value: string) => {
      setItemSearchInput(value);
      setInventoryPage(1);
    },
    itemProductCategoryId,
    setItemProductCategoryId: (value: string) => {
      setItemProductCategoryId(value);
      setInventoryPage(1);
    },
    itemSizeFilter,
    setItemSizeFilter: (value: string) => {
      setItemSizeFilter(value);
      setInventoryPage(1);
    },
    inventoryPage,
    setInventoryPage,
    inventoryTotalPages,
    availableInventoryItems,
    selectedItems: selectedItemsComputed,
    addSelectedItem,
    removeSelectedItem,
    updateSelectedItem,
    availabilityQuery,
    unavailableSelectedItemIds,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    feesAmount,
    setFeesAmount,
    orderDepositOverride,
    setOrderDepositOverride,
    orderNote,
    setOrderNote,
    internalNote,
    setInternalNote,
    payments,
    addPayment,
    updatePayment,
    removePayment,
    subtotal,
    discountAmount,
    totalRent,
    depositRequired,
    depositPaid,
    rentPaid,
    balance,
    hasUnfilledPaymentAmounts,
    canOverridePricing,
    submitOrder,
    createPaymentsCollectedAmount,
    paymentReceiptModalOpen,
    paymentReceiptAmountInput,
    setPaymentReceiptAmountInput,
    paymentReceiptMethod,
    setPaymentReceiptMethod,
    paymentReceiptNote,
    setPaymentReceiptNote,
    paymentReceiptError,
    closePaymentReceiptModal,
    confirmPaymentReceiptAndSubmit,
    submitError,
    submitSuccess,
    categories: inventoryStore.categories,
    sizes: inventoryStore.sizes,
    rentPlanOptions: RENT_PLAN_OPTIONS,
    paymentTypes,
    paymentMethods: PAYMENT_METHODS,
  };
}
