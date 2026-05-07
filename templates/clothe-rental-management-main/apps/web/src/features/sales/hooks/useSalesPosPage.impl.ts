"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateCustomerMutation,
  useCustomerTypeaheadQuery,
} from "@/features/customers/queries/useCustomersQueries";
import { customersStore } from "@/features/customers/stores/customersStore";
import {
  useCreateOrderMutation,
  useOrderAvailabilityQuery,
} from "@/features/orders/queries/useOrdersDomainQueries";
import { useProductsListQuery } from "@/features/products/queries/useProductsQueries";
import { productsClientService } from "@/features/products/services/productsClientService";
import { productsStore } from "@/features/products/stores/productsStore";
import { useOpenSalesShiftMutation } from "@/features/sales/queries/useSalesQueries";
import { salesStore } from "@/features/sales/stores/salesStore";
import { useDebouncedValue } from "@/features/sales/utils/useDebouncedValue";
import { authStore } from "@/store/authStore";
import type { CustomerDetailDto, CustomerTypeaheadItemDto } from "@/types/customersCrm";
import type { ProductSummaryDto } from "@/types/productsCatalog";
import type { CreateOrderPayload, OrderPaymentReceiptMethod } from "@/types/ordersDomain";
import { parseNonNegativeMoney } from "@/utils/format/money";
import {
  buildCreateOrderPayload,
  type CreateOrderContractValidationError,
  validateCreateOrderContractInput,
} from "@/utils/orders/createOrderContract";
import { validatePhoneNumber } from "@/utils/validation/phone";

interface SalesPosCopy {
  title: string;
  subtitle: string;
  productSearchPlaceholder: string;
  customerSearchPlaceholder: string;
  customerLabel: string;
  noCustomerHint: string;
  customerNoResult: string;
  customerPhoneMissHint: string;
  inlineCreateAction: string;
  inlineCreateTitle: string;
  inlineCreateHint: string;
  inlineFullNameLabel: string;
  inlinePhoneLabel: string;
  inlineCreateSubmit: string;
  inlineCreateCancel: string;
  customerRequired: string;
  customerNameRequired: string;
  customerPhoneRequired: string;
  customerPhoneInvalid: string;
  customerDuplicatePhone: string;
  customerCreateFailed: string;
  customerCreateSuccess: string;
  depositLabel: string;
  suggestDeposit: string;
  createOrderAction: string;
  shiftRequired: string;
  shiftRequiredHint: string;
  shiftAutoOpenFailed: string;
  branchMissing: string;
  noProductHint: string;
  noCartHint: string;
  itemRequired: string;
  itemUnavailable: string;
  dateInvalid: string;
  statusInvalid: string;
  paymentInvalid: string;
  createSuccess: string;
  createFailed: string;
  viewInvoice: string;
  subtotalLabel: string;
  balanceLabel: string;
  paymentReceiptTitle: string;
  paymentReceiptDescription: string;
  paymentReceiptAmountLabel: string;
  paymentReceiptMethodLabel: string;
  paymentReceiptNoteLabel: string;
  paymentReceiptConfirmAction: string;
  paymentReceiptCancelAction: string;
  paymentReceiptAmountInvalid: string;
  paymentReceiptAmountMismatch: string;
  paymentReceiptConfirmRequired: string;
  paymentReceiptMethodOptions: Record<OrderPaymentReceiptMethod, string>;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
}

interface SalesPosCartProduct {
  productId: string;
  productName: string;
  coverImageUrl: string | null;
  rentPrice: number;
  depositPerItem: number;
  quantity: number;
  maxQuantity: number;
  readyItemIds: string[];
}

interface SalesPosProductCardItem extends ProductSummaryDto {
  coverImageUrl: string | null;
  readyItemIds: string[];
  readyItemsCount: number;
}

interface InlineCustomerDraft {
  fullName: string;
  phone: string;
}

const INLINE_CUSTOMER_INITIAL: InlineCustomerDraft = {
  fullName: "",
  phone: "",
};

const SALES_POS_COPY: Record<AppLocale, SalesPosCopy> = {
  vi: {
    title: "Tạo đơn nhanh tại quầy",
    subtitle: "Chọn sản phẩm, khách hàng và tạo đơn thuê ngay.",
    productSearchPlaceholder: "Tìm sản phẩm...",
    customerSearchPlaceholder: "Tìm khách theo tên / số điện thoại...",
    customerLabel: "Khách hàng",
    noCustomerHint: "Chưa chọn khách hàng.",
    customerNoResult: "Không có khách hàng phù hợp.",
    customerPhoneMissHint: "Không tìm thấy khách theo số điện thoại này.",
    inlineCreateAction: "Tạo nhanh khách hàng",
    inlineCreateTitle: "Tạo khách hàng mới",
    inlineCreateHint: "Nhập số điện thoại và họ tên để tạo nhanh tại quầy.",
    inlineFullNameLabel: "Họ tên",
    inlinePhoneLabel: "Số điện thoại",
    inlineCreateSubmit: "Tạo khách",
    inlineCreateCancel: "Hủy",
    customerRequired: "Vui lòng chọn khách hàng.",
    customerNameRequired: "Họ tên khách hàng là bắt buộc.",
    customerPhoneRequired: "Số điện thoại là bắt buộc.",
    customerPhoneInvalid: "Số điện thoại chưa đúng định dạng VN (+84 hoặc 0...).",
    customerDuplicatePhone: "Số điện thoại này đã tồn tại trong chi nhánh.",
    customerCreateFailed: "Không thể tạo khách hàng mới.",
    customerCreateSuccess: "Đã tạo khách hàng mới và tự động chọn.",
    depositLabel: "Tiền cọc",
    suggestDeposit: "Gợi ý cọc",
    createOrderAction: "Tạo đơn thuê",
    shiftRequired: "Bạn cần mở ca bán hàng trước khi tạo đơn POS.",
    shiftRequiredHint: "Nếu chưa mở ca, hệ thống sẽ tự động mở ca khi bạn tạo đơn.",
    shiftAutoOpenFailed: "Không thể tự động mở ca. Vui lòng mở ca thủ công rồi thử lại.",
    branchMissing: "Bạn chưa có chi nhánh hoạt động để tạo đơn.",
    noProductHint: "Không có sản phẩm phù hợp.",
    noCartHint: "Chưa có sản phẩm trong giỏ.",
    itemRequired: "Cần ít nhất 1 item để tạo đơn.",
    itemUnavailable:
      "Một số sản phẩm không còn đủ item sẵn để tạo đơn. Vui lòng giảm số lượng và thử lại.",
    dateInvalid: "Thông tin ngày thuê chưa hợp lệ.",
    statusInvalid: "Trạng thái đơn không hợp lệ với loại đơn.",
    paymentInvalid:
      "Thông tin payment khởi tạo chưa hợp lệ (loại/phương thức/trạng thái/số tiền).",
    createSuccess: "Tạo đơn thành công.",
    createFailed: "Không thể tạo đơn thuê.",
    viewInvoice: "Xem hóa đơn",
    subtotalLabel: "Tạm tính",
    balanceLabel: "Còn lại",
    paymentReceiptTitle: "Xác nhận đã nhận tiền",
    paymentReceiptDescription:
      "Hệ thống chưa có thanh toán online. Vui lòng xác nhận đã nhận tiền trước khi tạo đơn.",
    paymentReceiptAmountLabel: "Số tiền đã nhận",
    paymentReceiptMethodLabel: "Phương thức nhận",
    paymentReceiptNoteLabel: "Ghi chú nhận tiền",
    paymentReceiptConfirmAction: "Xác nhận đã nhận tiền",
    paymentReceiptCancelAction: "Hủy",
    paymentReceiptAmountInvalid: "Số tiền xác nhận phải lớn hơn 0.",
    paymentReceiptAmountMismatch: "Số tiền xác nhận phải khớp tiền cọc đang thu.",
    paymentReceiptConfirmRequired: "Bạn cần xác nhận đã nhận tiền trước khi tạo đơn.",
    paymentReceiptMethodOptions: {
      CASH: "Tiền mặt",
      BANK: "Chuyển khoản",
    },
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
  },
  en: {
    title: "Quick POS Order",
    subtitle: "Select products and customer, then create the rental order.",
    productSearchPlaceholder: "Search products...",
    customerSearchPlaceholder: "Search customer by name / phone...",
    customerLabel: "Customer",
    noCustomerHint: "No customer selected.",
    customerNoResult: "No matching customers.",
    customerPhoneMissHint: "No customer found for this phone search.",
    inlineCreateAction: "Create quick customer",
    inlineCreateTitle: "Create customer",
    inlineCreateHint: "Use phone number and full name for quick POS creation.",
    inlineFullNameLabel: "Full name",
    inlinePhoneLabel: "Phone",
    inlineCreateSubmit: "Create customer",
    inlineCreateCancel: "Cancel",
    customerRequired: "Please select a customer.",
    customerNameRequired: "Customer full name is required.",
    customerPhoneRequired: "Phone number is required.",
    customerPhoneInvalid: "Phone format is invalid for VN-friendly validation.",
    customerDuplicatePhone: "This phone already exists in current branch.",
    customerCreateFailed: "Unable to create customer.",
    customerCreateSuccess: "Customer created and auto-selected.",
    depositLabel: "Deposit",
    suggestDeposit: "Suggest deposit",
    createOrderAction: "Create order",
    shiftRequired: "Open a sales shift before creating POS orders.",
    shiftRequiredHint: "If no shift is open, the system will auto-open one when you create an order.",
    shiftAutoOpenFailed: "Unable to auto-open shift. Please open shift manually and try again.",
    branchMissing: "No active branch selected for order creation.",
    noProductHint: "No matching products.",
    noCartHint: "No items in cart yet.",
    itemRequired: "At least 1 item is required.",
    itemUnavailable:
      "Some products do not have enough ready items. Please reduce quantity and try again.",
    dateInvalid: "Date range is invalid.",
    statusInvalid: "Order status is invalid for selected order type.",
    paymentInvalid:
      "Initial payment payload is invalid (type/method/status/amount).",
    createSuccess: "Order created successfully.",
    createFailed: "Unable to create order.",
    viewInvoice: "View invoice",
    subtotalLabel: "Subtotal",
    balanceLabel: "Balance",
    paymentReceiptTitle: "Confirm payment received",
    paymentReceiptDescription:
      "Online payment is not available. Please confirm payment received before creating order.",
    paymentReceiptAmountLabel: "Received amount",
    paymentReceiptMethodLabel: "Received method",
    paymentReceiptNoteLabel: "Receipt note",
    paymentReceiptConfirmAction: "Confirm payment received",
    paymentReceiptCancelAction: "Cancel",
    paymentReceiptAmountInvalid: "Confirmed amount must be greater than 0.",
    paymentReceiptAmountMismatch: "Confirmed amount must match deposit amount.",
    paymentReceiptConfirmRequired:
      "Payment receipt confirmation is required before order creation.",
    paymentReceiptMethodOptions: {
      CASH: "Cash",
      BANK: "Bank transfer",
    },
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
  },
};

const SALES_POS_PRODUCTS_PAGE_SIZE = 24;

function resolveDefaultRentPrice(product: ProductSummaryDto): number {
  const standardPrice =
    typeof product.rentPricePerDay === "number" && Number.isFinite(product.rentPricePerDay)
      ? Math.max(0, product.rentPricePerDay)
      : null;
  if (standardPrice !== null && standardPrice > 0) {
    return standardPrice;
  }

  const quickPrice =
    typeof product.quickRentPrice === "number" && Number.isFinite(product.quickRentPrice)
      ? Math.max(0, product.quickRentPrice)
      : null;
  if (quickPrice !== null && quickPrice > 0) {
    return quickPrice;
  }

  return 0;
}

function resolveDefaultDepositPerItem(product: ProductSummaryDto): number {
  const directDeposit =
    typeof product.rentDepositAmount === "number" && Number.isFinite(product.rentDepositAmount)
      ? Math.max(0, product.rentDepositAmount)
      : null;
  if (directDeposit !== null) {
    return directDeposit;
  }

  return Math.max(0, product.pricePolicy.defaultDepositAmount ?? 0);
}

function extractReadyItemIds(product: ProductSummaryDto): string[] {
  const uniqueIds = new Set<string>();
  for (const entry of product.readyItemsDetail ?? []) {
    const itemId = typeof entry.id === "string" ? entry.id.trim() : "";
    if (!itemId) continue;
    uniqueIds.add(itemId);
  }
  return Array.from(uniqueIds);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(baseDate: Date, days: number): Date {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next;
}

function buildAvailabilityMap(
  items: Array<{ itemId: string; isAvailable: boolean }> | undefined
): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const item of items ?? []) {
    map.set(item.itemId, item.isAvailable);
  }
  return map;
}

function resolveOrderItemsFromCart(options: {
  cartProducts: SalesPosCartProduct[];
  readyItemIdsByProductId: Map<string, string[]>;
  availabilityByItemId?: Map<string, boolean>;
}): {
  items: Array<{
    itemId: string;
    rentPrice: number;
    depositOverrideAmount: number | null;
  }>;
  insufficientProducts: string[];
} {
  const items: Array<{
    itemId: string;
    rentPrice: number;
    depositOverrideAmount: number | null;
  }> = [];
  const insufficientProducts: string[] = [];

  for (const product of options.cartProducts) {
    const candidateIds = Array.from(
      new Set(options.readyItemIdsByProductId.get(product.productId) ?? [])
    );
    const availableCandidateIds = options.availabilityByItemId
      ? candidateIds.filter((itemId) => options.availabilityByItemId?.get(itemId) === true)
      : candidateIds;

    if (availableCandidateIds.length < product.quantity) {
      insufficientProducts.push(product.productName);
      continue;
    }

    for (let index = 0; index < product.quantity; index += 1) {
      const itemId = availableCandidateIds[index];
      if (!itemId) continue;

      items.push({
        itemId,
        rentPrice: Math.max(0, product.rentPrice),
        depositOverrideAmount:
          product.depositPerItem > 0 ? Math.max(0, product.depositPerItem) : null,
      });
    }
  }

  return {
    items,
    insufficientProducts,
  };
}

function parseMoneyInput(value: string): number {
  const parsed = parseNonNegativeMoney(value);
  if (parsed.error || parsed.value === null) {
    return 0;
  }

  return parsed.value;
}

function parsePositiveAmountInput(value: string): number | null {
  const parsed = parseNonNegativeMoney(value);
  if (parsed.error || parsed.value === null || parsed.value <= 0) {
    return null;
  }

  return parsed.value;
}

function hasNumericChar(value: string): boolean {
  return /\d/.test(value);
}

function toCustomerTypeaheadSelection(detail: CustomerDetailDto): CustomerTypeaheadItemDto {
  const tags = detail.customer.tags;

  return {
    id: detail.customer.id,
    branchId: detail.customer.branchId,
    fullName: detail.customer.fullName,
    phone: detail.customer.phone,
    phoneNormalized: detail.customer.phoneNormalized,
    isActive: detail.customer.isActive,
    tags,
    warnOnOrderCreate: tags.some((tag) => tag.warnOnOrderCreate),
    blockOrderCreate: tags.some((tag) => tag.blockOrderCreate),
    isVip: tags.some((tag) => tag.code.toLowerCase().includes("vip")),
    isBlacklist: tags.some((tag) => tag.code.toLowerCase().includes("blacklist")),
  };
}

function mapCreateOrderContractErrorMessage(
  errorCode: CreateOrderContractValidationError,
  copy: SalesPosCopy
): string {
  if (errorCode === "branch-required") {
    return copy.branchMissing;
  }

  if (errorCode === "customer-required") {
    return copy.customerRequired;
  }

  if (errorCode === "date-invalid") {
    return copy.dateInvalid;
  }

  if (errorCode === "status-invalid") {
    return copy.statusInvalid;
  }

  return copy.itemRequired;
}

function mapCreateCustomerErrorMessage(copy: SalesPosCopy, error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("already exists") || normalized.includes("duplicate")) {
    return copy.customerDuplicatePhone;
  }

  if (normalized.includes("phone") && normalized.includes("invalid")) {
    return copy.customerPhoneInvalid;
  }

  if (normalized.includes("phone") && normalized.includes("required")) {
    return copy.customerPhoneRequired;
  }

  if (normalized.includes("name") && normalized.includes("required")) {
    return copy.customerNameRequired;
  }

  return message || copy.customerCreateFailed;
}

function mapCreateOrderSubmitErrorMessage(copy: SalesPosCopy, error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (
    message === "INVALID_PAYMENT_TYPE" ||
    message === "INVALID_PAYMENT_METHOD" ||
    message === "INVALID_PAYMENT_STATUS" ||
    message === "PAYMENT_AMOUNT_INVALID"
  ) {
    return copy.paymentInvalid;
  }

  if (message === "INVALID_ORDER_STATUS") {
    return copy.statusInvalid;
  }

  if (
    message === "ITEM_UNAVAILABLE" ||
    message === "ITEM_ALREADY_IN_ORDER" ||
    message === "RESERVATION_OVERLAP_CONFLICT"
  ) {
    return copy.itemUnavailable;
  }

  if (message === "ORDER_REQUIRES_ITEMS_FOR_STATUS") {
    return copy.itemRequired;
  }

  if (message === "INVALID_DATE_RANGE") {
    return copy.dateInvalid;
  }

  if (message === "PAYMENT_RECEIPT_CONFIRM_REQUIRED") {
    return copy.paymentReceiptConfirmRequired;
  }

  if (message === "PAYMENT_RECEIPT_AMOUNT_MISMATCH") {
    return copy.paymentReceiptAmountMismatch;
  }

  if (message === "PAYMENT_RECEIPT_METHOD_INVALID") {
    return copy.paymentInvalid;
  }

  return message || copy.createFailed;
}

interface UseSalesPosPageOptions {
  forcedBranch?: {
    branchId: string;
    branchCode: string;
    branchName: string;
    branchSlug: string;
  } | null;
}

export function useSalesPosPage(
  locale: AppLocale,
  options?: UseSalesPosPageOptions
) {
  const copy = SALES_POS_COPY[locale];
  const { currentBranchId, branchAccess } = useAuthAccess();
  const forcedBranchId = options?.forcedBranch?.branchId ?? null;
  const hasForcedBranchAccess = forcedBranchId
    ? branchAccess.some((entry) => entry.branchId === forcedBranchId)
    : false;
  const activeBranchId =
    forcedBranchId && hasForcedBranchAccess ? forcedBranchId : currentBranchId;
  const createOrderMutation = useCreateOrderMutation();
  const openShiftMutation = useOpenSalesShiftMutation();
  const createCustomerMutation = useCreateCustomerMutation();

  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerTypeaheadItemDto | null>(null);
  const [inlineCustomerOpen, setInlineCustomerOpen] = useState(false);
  const [inlineCustomerDraft, setInlineCustomerDraft] =
    useState<InlineCustomerDraft>(INLINE_CUSTOMER_INITIAL);
  const [cartProducts, setCartProducts] = useState<SalesPosCartProduct[]>([]);
  const [depositInput, setDepositInput] = useState("0");
  const [depositTouched, setDepositTouched] = useState(false);
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string | null>(null);
  const [paymentReceiptModalOpen, setPaymentReceiptModalOpen] = useState(false);
  const [paymentReceiptAmountInput, setPaymentReceiptAmountInput] = useState("0");
  const [paymentReceiptMethod, setPaymentReceiptMethod] =
    useState<OrderPaymentReceiptMethod>("CASH");
  const [paymentReceiptNote, setPaymentReceiptNote] = useState("");
  const [paymentReceiptError, setPaymentReceiptError] = useState<string | null>(null);
  const debouncedProductSearch = useDebouncedValue(productSearch, 350);
  const debouncedCustomerSearch = useDebouncedValue(customerSearch, 350);

  useEffect(() => {
    if (!forcedBranchId || !hasForcedBranchAccess) return;
    if (authStore.currentBranchId === forcedBranchId) return;
    authStore.currentBranchId = forcedBranchId;
  }, [forcedBranchId, hasForcedBranchAccess]);

  useProductsListQuery(
    {
      branchId: activeBranchId,
      search: debouncedProductSearch,
      hasReadyItems: true,
      page: productPage,
      pageSize: SALES_POS_PRODUCTS_PAGE_SIZE,
    },
    {
      enabled: Boolean(activeBranchId),
    }
  );

  const customerTypeaheadQuery = useCustomerTypeaheadQuery({
    branchId: activeBranchId,
    search: debouncedCustomerSearch,
    limit: 10,
  });

  const products = productsStore.listItems;
  const productCards = useMemo<SalesPosProductCardItem[]>(
    () =>
      products.map((product) => ({
        ...product,
        coverImageUrl: productsClientService.resolveCoverImageUrl(product.coverImagePath),
        readyItemIds: extractReadyItemIds(product),
        readyItemsCount: Math.max(0, Math.floor(product.readyItems ?? 0)),
      })),
    [products]
  );
  const customerOptions = customersStore.typeaheadItems;

  const productTotalPages =
    productsStore.listTotal <= 0
      ? 1
      : Math.max(1, Math.ceil(productsStore.listTotal / productsStore.listPageSize));

  const trimmedCustomerSearch = customerSearch.trim();
  const trimmedDebouncedCustomerSearch = debouncedCustomerSearch.trim();
  const isCustomerSearchInSync = trimmedDebouncedCustomerSearch === trimmedCustomerSearch;
  const customerSearchLooksLikePhone = useMemo(
    () => hasNumericChar(trimmedCustomerSearch),
    [trimmedCustomerSearch]
  );

  const canInlineCreateCustomer = useMemo(
    () =>
      customerSearchLooksLikePhone &&
      trimmedCustomerSearch.length >= 2 &&
      isCustomerSearchInSync &&
      !customerTypeaheadQuery.isFetching &&
      customerOptions.length === 0,
    [
      customerOptions.length,
      customerSearchLooksLikePhone,
      customerTypeaheadQuery.isFetching,
      isCustomerSearchInSync,
      trimmedCustomerSearch.length,
    ]
  );

  const availableCountByProductId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of productCards) {
      counts.set(product.id, product.readyItemsCount);
    }

    for (const product of cartProducts) {
      if (!counts.has(product.productId)) {
        counts.set(product.productId, product.maxQuantity);
      }
    }

    return counts;
  }, [cartProducts, productCards]);

  const readyItemIdsByProductId = useMemo(() => {
    const byProduct = new Map<string, string[]>();

    for (const product of productCards) {
      byProduct.set(product.id, product.readyItemIds);
    }

    for (const product of cartProducts) {
      if (!byProduct.has(product.productId)) {
        byProduct.set(product.productId, product.readyItemIds);
      }
    }

    return byProduct;
  }, [cartProducts, productCards]);

  const effectiveCartProducts = useMemo(() => {
    const normalized: SalesPosCartProduct[] = [];
    for (const entry of cartProducts) {
      const nextReadyItemIds = readyItemIdsByProductId.get(entry.productId) ?? entry.readyItemIds;
      const nextMaxQuantity = nextReadyItemIds.length;
      const nextQuantity = Math.min(entry.quantity, nextMaxQuantity);
      if (nextQuantity <= 0) {
        continue;
      }

      normalized.push({
        ...entry,
        readyItemIds: nextReadyItemIds,
        maxQuantity: nextMaxQuantity,
        quantity: nextQuantity,
      });
    }
    return normalized;
  }, [cartProducts, readyItemIdsByProductId]);

  const rentalDateRange = useMemo(() => {
    const startDate = new Date();
    const endDate = addDays(startDate, 2);

    return {
      startDateIso: toIsoDate(startDate),
      endDateIso: toIsoDate(endDate),
    };
  }, []);

  const cartCandidateItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const product of effectiveCartProducts) {
      for (const itemId of product.readyItemIds) {
        ids.add(itemId);
      }
    }

    return Array.from(ids);
  }, [effectiveCartProducts]);

  const availabilityQuery = useOrderAvailabilityQuery(
    {
      branchId: activeBranchId,
      itemIds: cartCandidateItemIds,
      startDate: rentalDateRange.startDateIso,
      endDate: rentalDateRange.endDateIso,
    },
    {
      enabled: false,
    }
  );

  const availabilityByItemId = useMemo(
    () => buildAvailabilityMap(availabilityQuery.data?.items),
    [availabilityQuery.data?.items]
  );

  const resolvedOrderItems = useMemo(() => {
    return resolveOrderItemsFromCart({
      cartProducts: effectiveCartProducts,
      readyItemIdsByProductId,
      availabilityByItemId:
        availabilityQuery.data?.items !== undefined ? availabilityByItemId : undefined,
    });
  }, [availabilityByItemId, availabilityQuery.data?.items, effectiveCartProducts, readyItemIdsByProductId]);

  const cartItemCount = useMemo(
    () => effectiveCartProducts.reduce((sum, product) => sum + product.quantity, 0),
    [effectiveCartProducts]
  );

  const suggestedDeposit = useMemo(() => {
    return effectiveCartProducts.reduce(
      (sum, product) => sum + product.depositPerItem * product.quantity,
      0
    );
  }, [effectiveCartProducts]);

  const resolvedDepositInput = depositTouched
    ? depositInput
    : String(Math.max(0, suggestedDeposit));
  const depositAmount = parseMoneyInput(resolvedDepositInput);

  const subtotal = useMemo(() => {
    return effectiveCartProducts.reduce(
      (sum, product) => sum + product.rentPrice * product.quantity,
      0
    );
  }, [effectiveCartProducts]);

  const balance = Math.max(0, subtotal - depositAmount);
  const hasOpenShift = Boolean(salesStore.currentShift);

  const selectCustomer = (customer: CustomerTypeaheadItemDto) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setInlineCustomerOpen(false);
  };

  const toggleInlineCustomerCreate = () => {
    if (
      !inlineCustomerOpen &&
      canInlineCreateCustomer &&
      !inlineCustomerDraft.phone.trim()
    ) {
      setInlineCustomerDraft((previous) => ({
        ...previous,
        phone: trimmedCustomerSearch,
      }));
    }

    setInlineCustomerOpen((previous) => !previous);
  };

  const addProductToCart = (product: SalesPosProductCardItem) => {
    const maxQuantity = Math.max(
      0,
      Math.floor(product.readyItemIds.length)
    );
    if (maxQuantity <= 0) {
      toast.error(locale === "vi" ? "Sản phẩm không còn item." : "No item available.");
      return;
    }

    setCartProducts((previous) => {
      const existingIndex = previous.findIndex((entry) => entry.productId === product.id);
      if (existingIndex < 0) {
        return [
          ...previous,
          {
            productId: product.id,
            productName: product.name,
            coverImageUrl: productsClientService.resolveCoverImageUrl(product.coverImagePath),
            rentPrice: resolveDefaultRentPrice(product),
            depositPerItem: resolveDefaultDepositPerItem(product),
            quantity: 1,
            maxQuantity,
            readyItemIds: product.readyItemIds,
          },
        ];
      }

      const next = [...previous];
      const current = next[existingIndex];
      const nextMaxQuantity = maxQuantity;
      const nextQuantity = Math.min(current.quantity + 1, nextMaxQuantity);
      next[existingIndex] = {
        ...current,
        maxQuantity: nextMaxQuantity,
        quantity: nextQuantity,
        readyItemIds: product.readyItemIds,
      };
      return next;
    });
  };

  const removeCartProduct = (productId: string) => {
    setCartProducts((previous) => previous.filter((entry) => entry.productId !== productId));
  };

  const setCartProductQuantity = (productId: string, nextQuantity: number) => {
    setCartProducts((previous) =>
      previous.flatMap((entry) => {
        if (entry.productId !== productId) {
          return [entry];
        }

        const maxQuantity = Math.max(
          0,
          Math.floor(availableCountByProductId.get(entry.productId) ?? entry.maxQuantity)
        );
        const parsedQuantity = Number.isFinite(nextQuantity) ? Math.floor(nextQuantity) : 0;
        const normalizedQuantity = Math.max(0, Math.min(maxQuantity, parsedQuantity));
        if (normalizedQuantity <= 0) {
          return [];
        }

        return [
          {
            ...entry,
            maxQuantity,
            quantity: normalizedQuantity,
          },
        ];
      })
    );
  };

  const increaseCartProductQuantity = (productId: string) => {
    setCartProducts((previous) =>
      previous.map((entry) => {
        if (entry.productId !== productId) {
          return entry;
        }

        const maxQuantity = Math.max(
          0,
          Math.floor(availableCountByProductId.get(entry.productId) ?? entry.maxQuantity)
        );
        return {
          ...entry,
          maxQuantity,
          quantity: Math.min(maxQuantity, entry.quantity + 1),
        };
      })
    );
  };

  const decreaseCartProductQuantity = (productId: string) => {
    setCartProducts((previous) =>
      previous.flatMap((entry) => {
        if (entry.productId !== productId) {
          return [entry];
        }

        const nextQuantity = entry.quantity - 1;
        if (nextQuantity <= 0) {
          return [];
        }

        return [
          {
            ...entry,
            quantity: nextQuantity,
          },
        ];
      })
    );
  };

  const setCartProductRentPrice = (productId: string, nextRentPriceInput: string) => {
    const nextRentPrice = parseMoneyInput(nextRentPriceInput);
    setCartProducts((previous) =>
      previous.map((entry) =>
        entry.productId === productId ? { ...entry, rentPrice: nextRentPrice } : entry
      )
    );
  };

  const setCartProductDepositPerItem = (
    productId: string,
    nextDepositPerItemInput: string
  ) => {
    const nextDepositPerItem = parseMoneyInput(nextDepositPerItemInput);
    setCartProducts((previous) =>
      previous.map((entry) =>
        entry.productId === productId
          ? { ...entry, depositPerItem: nextDepositPerItem }
          : entry
      )
    );
  };

  const applySuggestedDeposit = () => {
    setDepositTouched(true);
    setDepositInput(String(Math.max(0, suggestedDeposit)));
  };

  const createInlineCustomer = async () => {
    if (!activeBranchId) {
      throw new Error(copy.branchMissing);
    }

    const fullName = inlineCustomerDraft.fullName.trim();
    if (!fullName) {
      throw new Error(copy.customerNameRequired);
    }

    const phone = inlineCustomerDraft.phone.trim();
    if (!phone) {
      throw new Error(copy.customerPhoneRequired);
    }

    const phoneValidation = validatePhoneNumber(phone, { allowEmpty: false });
    if (!phoneValidation.isValid) {
      throw new Error(copy.customerPhoneInvalid);
    }

    try {
      const detail = await createCustomerMutation.mutateAsync({
        branchId: activeBranchId,
        fullName,
        phone,
        socialLink: null,
        address: null,
        note: null,
        tagIds: [],
        isActive: true,
      });

      const createdCustomer = toCustomerTypeaheadSelection(detail);
      setSelectedCustomer(createdCustomer);
      setCustomerSearch(createdCustomer.phone ?? createdCustomer.fullName);
      setInlineCustomerDraft(INLINE_CUSTOMER_INITIAL);
      setInlineCustomerOpen(false);
      toast.success(copy.customerCreateSuccess);
    } catch (error) {
      throw new Error(mapCreateCustomerErrorMessage(copy, error));
    }
  };

  const closePaymentReceiptModal = () => {
    setPaymentReceiptModalOpen(false);
    setPaymentReceiptError(null);
    setPaymentReceiptNote("");
  };

  const submitCreateOrder = async (
    paymentReceiptConfirmation?: CreateOrderPayload["paymentReceiptConfirmation"]
  ) => {
    let canProceedWithShift = hasOpenShift;

    if (!canProceedWithShift) {
      if (!activeBranchId) {
        toast.error(copy.shiftRequired);
        return;
      }

      try {
        await openShiftMutation.mutateAsync({
          branchId: activeBranchId,
          openingCash: 0,
          note: "AUTO_OPEN_FROM_POS_CREATE_ORDER",
        });
        canProceedWithShift = true;
      } catch (error) {
        const errorCode = error instanceof Error ? error.message : "";
        if (errorCode === "SHIFT_ALREADY_OPEN") {
          canProceedWithShift = true;
        } else {
          toast.error(copy.shiftAutoOpenFailed);
          return;
        }
      }
    }

    if (!canProceedWithShift) {
      toast.error(copy.shiftRequired);
      return;
    }

    const startDateIso = rentalDateRange.startDateIso;
    const endDateIso = rentalDateRange.endDateIso;

    const contractValidation = validateCreateOrderContractInput({
      branchId: activeBranchId,
      customerId: selectedCustomer?.id ?? null,
      orderType: "RENTAL",
      pricingMode: "STANDARD",
      status: "RESERVED",
      startDate: startDateIso,
      endDate: endDateIso,
      itemCount: cartItemCount,
    });

    if (!contractValidation.isValid && contractValidation.error) {
      toast.error(mapCreateOrderContractErrorMessage(contractValidation.error, copy));
      return;
    }

    if (!selectedCustomer) {
      toast.error(copy.customerRequired);
      return;
    }

    let resolvedOrderItemsForSubmit = resolvedOrderItems;
    const latestAvailability = await availabilityQuery.refetch();
    if (latestAvailability.data?.items) {
      resolvedOrderItemsForSubmit = resolveOrderItemsFromCart({
        cartProducts: effectiveCartProducts,
        readyItemIdsByProductId,
        availabilityByItemId: buildAvailabilityMap(latestAvailability.data.items),
      });
    }

    if (resolvedOrderItemsForSubmit.insufficientProducts.length > 0) {
      toast.error(copy.itemUnavailable);
      return;
    }

    if (depositAmount > 0 && !paymentReceiptConfirmation) {
      setPaymentReceiptAmountInput(String(depositAmount));
      setPaymentReceiptError(null);
      setPaymentReceiptModalOpen(true);
      return;
    }

    if (
      depositAmount > 0 &&
      paymentReceiptConfirmation &&
      Math.abs(paymentReceiptConfirmation.amount - depositAmount) > 0.01
    ) {
      setPaymentReceiptError(copy.paymentReceiptAmountMismatch);
      return;
    }

    try {
      const createPayments: CreateOrderPayload["payments"] =
        depositAmount > 0 && paymentReceiptConfirmation
          ? [
              {
                type: "DEPOSIT",
                method: paymentReceiptConfirmation.method,
                amount: depositAmount,
                status: "POSTED",
                source: "POS_QUICK_CREATE",
                note: paymentReceiptConfirmation.note ?? null,
              },
            ]
          : undefined;

      const created = await createOrderMutation.mutateAsync(
        buildCreateOrderPayload({
          branchId: activeBranchId,
          orderType: "RENTAL",
          pricingMode: "STANDARD",
          customerId: selectedCustomer.id,
          status: "RESERVED",
          startDate: startDateIso,
          endDate: endDateIso,
          depositAmount,
          note: "POS_QUICK_CREATE",
          items: resolvedOrderItemsForSubmit.items.map((item) => ({
            itemId: item.itemId,
            rentPrice: item.rentPrice,
            depositOverrideAmount: item.depositOverrideAmount,
          })),
          payments: createPayments,
          paymentReceiptConfirmation: depositAmount > 0 ? paymentReceiptConfirmation : undefined,
        })
      );

      closePaymentReceiptModal();
      setLastCreatedOrderId(created.summary.id);
      setCartProducts([]);
      setSelectedCustomer(null);
      setCustomerSearch("");
      setDepositInput("0");
      setDepositTouched(false);
      setInlineCustomerOpen(false);
      setInlineCustomerDraft(INLINE_CUSTOMER_INITIAL);
      toast.success(copy.createSuccess);
    } catch (error) {
      const message = mapCreateOrderSubmitErrorMessage(copy, error);
      if (paymentReceiptModalOpen) {
        setPaymentReceiptError(message);
      }
      toast.error(message);
    }
  };

  const createOrder = async () => {
    await submitCreateOrder();
  };

  const confirmPaymentReceiptAndCreate = async () => {
    const amount = parsePositiveAmountInput(paymentReceiptAmountInput);
    if (amount === null) {
      setPaymentReceiptError(copy.paymentReceiptAmountInvalid);
      return;
    }

    if (Math.abs(amount - depositAmount) > 0.01) {
      setPaymentReceiptError(copy.paymentReceiptAmountMismatch);
      return;
    }

    setPaymentReceiptError(null);
    await submitCreateOrder({
      confirmed: true,
      amount,
      method: paymentReceiptMethod,
      note: paymentReceiptNote.trim() || null,
    });
  };

  return {
    copy,
    currentBranchId: activeBranchId,
    productSearch,
    setProductSearch: (value: string) => {
      setProductSearch(value);
      setProductPage(1);
    },
    productPage,
    setProductPage,
    productTotalPages,
    customerSearch,
    setCustomerSearch,
    selectedCustomer,
    setSelectedCustomer,
    selectCustomer,
    customerOptions,
    customerTypeaheadLoading: customerTypeaheadQuery.isFetching,
    canInlineCreateCustomer,
    toggleInlineCustomerCreate,
    inlineCustomerOpen,
    setInlineCustomerOpen,
    inlineCustomerDraft,
    setInlineCustomerDraft,
    createInlineCustomer,
    creatingCustomer: createCustomerMutation.isPending,
    products: productCards,
    availableCountByProductId,
    cartProducts: effectiveCartProducts,
    cartItemCount,
    subtotal,
    depositAmount,
    depositInput: resolvedDepositInput,
    setDepositInput,
    setDepositTouched,
    suggestedDeposit,
    applySuggestedDeposit,
    balance,
    lastCreatedOrderId,
    addProductToCart,
    removeCartProduct,
    setCartProductQuantity,
    increaseCartProductQuantity,
    decreaseCartProductQuantity,
    setCartProductRentPrice,
    setCartProductDepositPerItem,
    createOrder,
    creating: createOrderMutation.isPending || openShiftMutation.isPending,
    hasOpenShift,
    paymentReceiptModalOpen,
    paymentReceiptAmountInput,
    setPaymentReceiptAmountInput,
    paymentReceiptMethod,
    setPaymentReceiptMethod,
    paymentReceiptNote,
    setPaymentReceiptNote,
    paymentReceiptError,
    closePaymentReceiptModal,
    confirmPaymentReceiptAndCreate,
  };
}
