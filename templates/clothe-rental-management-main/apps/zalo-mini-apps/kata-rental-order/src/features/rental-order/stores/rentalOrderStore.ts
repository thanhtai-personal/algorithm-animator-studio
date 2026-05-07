import { makeAutoObservable } from "mobx";
import type {
  CustomerTypeaheadItemDto,
  OrderDetailDto,
  OrderSummaryDto,
  ProductDetailDto,
  PaymentListItemDto,
  PosManualPaymentType,
  RentalOrderPricingMode,
  ProductSummaryDto,
  RentalOrderPaymentMethod,
  RentalOrderType,
  ZaloMiniAppRentalAccessDto,
} from "@/lib/contracts";

const STORAGE_KEY = "kata-rental-order-draft";

export interface SelectedRentalItem {
  itemId: string;
  itemCode: string;
  productId: string;
  productName: string;
  productCode: string;
  variantId: string;
  variantName: string;
  coverImagePath: string | null;
  rentPrice: number;
  unitPrice: number;
  quickUnitPrice: number | null;
  depositAmount: number;
  salePrice: number;
  maxQuantity: number;
}

export interface VoiceReviewDraft {
  field:
    | "startDate"
    | "endDate"
    | "pickupTime"
    | "returnTime"
    | "depositAmount"
    | "collectedAmount"
    | "receiptMethod";
  transcript: string;
  suggestedValue: string;
}

interface PersistedDraft {
  currentStep: 1 | 2;
  branchId: string | null;
  orderType: RentalOrderType;
  pricingMode: RentalOrderPricingMode;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  depositAmount: string;
  depositAmountTouched: boolean;
  collectedAmount: string;
  collectedAmountTouched: boolean;
  receiptMethod: RentalOrderPaymentMethod;
  note: string;
  customerSearch: string;
  productSearch: string;
  selectedCustomer: CustomerTypeaheadItemDto | null;
  selectedItems: SelectedRentalItem[];
  quickCustomerOpen: boolean;
  quickCustomerFullName: string;
  quickCustomerPhone: string;
  manualPaymentType: PosManualPaymentType;
  manualPaymentAmount: string;
  manualPaymentMethod: RentalOrderPaymentMethod;
  manualPaymentReason: string;
  manualPaymentNote: string;
  manualPaymentIsImportOrder: boolean;
  manualPaymentIsInitialCapital: boolean;
}

function defaultDateValue(offsetDays = 0): string {
  const value = new Date();
  if (offsetDays !== 0) {
    value.setDate(value.getDate() + offsetDays);
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultTimeValue(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeDateValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

function normalizeTimeValue(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function resolvePricingModeDurationDays(mode: RentalOrderPricingMode): number {
  return mode === "QUICK" ? 1 : 2;
}

class RentalOrderStore {
  currentStep: 1 | 2 = 1;
  access: ZaloMiniAppRentalAccessDto | null = null;
  branchId: string | null = null;
  orderType: RentalOrderType = "RENTAL";
  pricingMode: RentalOrderPricingMode = "STANDARD";
  customerSearch = "";
  productSearch = "";
  startDate = defaultDateValue(0);
  endDate = defaultDateValue(resolvePricingModeDurationDays(this.pricingMode));
  pickupTime = defaultTimeValue();
  returnTime = this.pickupTime;
  depositAmount = "";
  depositAmountTouched = false;
  collectedAmount = "";
  collectedAmountTouched = false;
  receiptMethod: RentalOrderPaymentMethod = "CASH";
  note = "";
  selectedCustomer: CustomerTypeaheadItemDto | null = null;
  customerResults: CustomerTypeaheadItemDto[] = [];
  productResults: ProductSummaryDto[] = [];
  activeProductId: string | null = null;
  activeProductDetail: ProductDetailDto | null = null;
  selectedItems: SelectedRentalItem[] = [];
  createdOrder: OrderDetailDto | null = null;
  createOrderSuccessMessage: string | null = null;
  createOrderSuccessSummary: OrderSummaryDto | null = null;
  activeOrders: OrderSummaryDto[] = [];
  activeOrdersSearch = "";
  voiceReview: VoiceReviewDraft | null = null;
  quickCustomerOpen = false;
  quickCustomerFullName = "";
  quickCustomerPhone = "";
  manualPaymentType: PosManualPaymentType = "FEE";
  manualPaymentAmount = "";
  manualPaymentMethod: RentalOrderPaymentMethod = "CASH";
  manualPaymentReason = "";
  manualPaymentNote = "";
  manualPaymentIsImportOrder = false;
  manualPaymentIsInitialCapital = false;
  latestManualPayment: PaymentListItemDto | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hydrateFromStorage();
  }

  private recalculateSelectedItemsForDateRange(): void {
    if (this.orderType !== "RENTAL" || this.selectedItems.length === 0) return;
    this.selectedItems = this.selectedItems.map((item) => ({
      ...item,
      rentPrice:
        this.pricingMode === "QUICK"
          ? (item.quickUnitPrice ?? item.unitPrice)
          : item.unitPrice,
    }));
  }

  private applyRentalScheduleForPricingMode(): void {
    const durationDays = resolvePricingModeDurationDays(this.pricingMode);
    const nextStartDate = defaultDateValue(0);
    const nextEndDate = defaultDateValue(durationDays);
    const nextPickupTime = defaultTimeValue();
    this.startDate = nextStartDate;
    this.endDate = nextEndDate;
    this.pickupTime = nextPickupTime;
    this.returnTime = nextPickupTime;
  }

  private resolvePreferredBranchId(access: ZaloMiniAppRentalAccessDto): string | null {
    return access.branches[0]?.id ?? null;
  }

  private persist(): void {
    if (typeof window === "undefined") return;

    const payload: PersistedDraft = {
      currentStep: this.currentStep,
      branchId: this.branchId,
      orderType: this.orderType,
      pricingMode: this.pricingMode,
      startDate: this.startDate,
      endDate: this.endDate,
      pickupTime: this.pickupTime,
      returnTime: this.returnTime,
      depositAmount: this.depositAmount,
      depositAmountTouched: this.depositAmountTouched,
      collectedAmount: this.collectedAmount,
      collectedAmountTouched: this.collectedAmountTouched,
      receiptMethod: this.receiptMethod,
      note: this.note,
      customerSearch: this.customerSearch,
      productSearch: this.productSearch,
      selectedCustomer: this.selectedCustomer,
      selectedItems: this.selectedItems,
      quickCustomerOpen: this.quickCustomerOpen,
      quickCustomerFullName: this.quickCustomerFullName,
      quickCustomerPhone: this.quickCustomerPhone,
      manualPaymentType: this.manualPaymentType,
      manualPaymentAmount: this.manualPaymentAmount,
      manualPaymentMethod: this.manualPaymentMethod,
      manualPaymentReason: this.manualPaymentReason,
      manualPaymentNote: this.manualPaymentNote,
      manualPaymentIsImportOrder: this.manualPaymentIsImportOrder,
      manualPaymentIsInitialCapital: this.manualPaymentIsInitialCapital,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private hydrateFromStorage(): void {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<PersistedDraft>;
      this.currentStep = parsed.currentStep === 2 ? 2 : 1;
      this.branchId = parsed.branchId ?? null;
      this.orderType = parsed.orderType === "SALE" ? "SALE" : "RENTAL";
      this.pricingMode = parsed.pricingMode === "QUICK" ? "QUICK" : "STANDARD";
      const fallbackStartDate = defaultDateValue(0);
      const fallbackEndDate = defaultDateValue(
        resolvePricingModeDurationDays(this.pricingMode)
      );
      const fallbackPickupTime = defaultTimeValue();
      const fallbackReturnTime = fallbackPickupTime;

      this.startDate = normalizeDateValue(parsed.startDate, fallbackStartDate);
      this.endDate = normalizeDateValue(parsed.endDate, fallbackEndDate);
      this.pickupTime = normalizeTimeValue(parsed.pickupTime, fallbackPickupTime);
      this.returnTime = normalizeTimeValue(parsed.returnTime, fallbackReturnTime);
      this.depositAmount = parsed.depositAmount ?? "";
      this.depositAmountTouched = parsed.depositAmountTouched === true;
      this.collectedAmount = parsed.collectedAmount ?? "";
      this.collectedAmountTouched = parsed.collectedAmountTouched === true;
      this.receiptMethod =
        parsed.receiptMethod === "BANK"
          ? "BANK"
          : parsed.receiptMethod === "MOMO"
            ? "MOMO"
            : "CASH";
      this.note = parsed.note ?? "";
      this.customerSearch = parsed.customerSearch ?? "";
      this.productSearch = parsed.productSearch ?? "";
      this.selectedCustomer = parsed.selectedCustomer ?? null;
      this.selectedItems = Array.isArray(parsed.selectedItems) ? parsed.selectedItems : [];
      this.quickCustomerOpen = parsed.quickCustomerOpen === true;
      this.quickCustomerFullName = parsed.quickCustomerFullName ?? "";
      this.quickCustomerPhone = parsed.quickCustomerPhone ?? "";
      this.manualPaymentType = parsed.manualPaymentType === "EXPENSE" ? "EXPENSE" : "FEE";
      this.manualPaymentAmount = parsed.manualPaymentAmount ?? "";
      this.manualPaymentMethod =
        parsed.manualPaymentMethod === "BANK"
          ? "BANK"
          : parsed.manualPaymentMethod === "MOMO"
            ? "MOMO"
            : "CASH";
      this.manualPaymentReason = parsed.manualPaymentReason ?? "";
      this.manualPaymentNote = parsed.manualPaymentNote ?? "";
      this.manualPaymentIsImportOrder = parsed.manualPaymentIsImportOrder === true;
      this.manualPaymentIsInitialCapital = parsed.manualPaymentIsInitialCapital === true;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  hydrateAccess(access: ZaloMiniAppRentalAccessDto): void {
    const previousProfileId = this.access?.profileId ?? null;
    const nextBranchId = this.resolvePreferredBranchId(access);
    const hasCurrentBranch =
      this.branchId !== null &&
      this.branchId.trim().length > 0 &&
      access.branches.some((branch) => branch.id === this.branchId);

    this.access = access;
    if (previousProfileId !== access.profileId || !hasCurrentBranch) {
      this.currentStep = 1;
      this.branchId = nextBranchId;
      this.selectedCustomer = null;
      this.customerSearch = "";
      this.selectedItems = [];
      this.depositAmount = "";
      this.depositAmountTouched = false;
      this.collectedAmount = "";
      this.collectedAmountTouched = false;
      this.activeOrders = [];
      this.closeQuickCustomerCreate();
      this.createdOrder = null;
    }
    this.persist();
  }

  hydrateCustomerResults(items: CustomerTypeaheadItemDto[]): void {
    this.customerResults = items;
  }

  hydrateProductResults(items: ProductSummaryDto[]): void {
    this.productResults = items;
  }

  hydrateActiveOrders(items: OrderSummaryDto[]): void {
    this.activeOrders = items;
  }

  setActiveOrdersSearch(value: string): void {
    this.activeOrdersSearch = value;
  }

  clearActiveOrders(): void {
    this.activeOrders = [];
  }

  hydrateActiveProductDetail(detail: ProductDetailDto | null): void {
    this.activeProductDetail = detail;
  }

  hydrateCreatedOrder(order: OrderDetailDto | null): void {
    this.createdOrder = order;
  }

  setCreateOrderSuccess(
    payload: { message: string; summary: OrderSummaryDto | null } | null
  ): void {
    if (!payload) {
      this.createOrderSuccessMessage = null;
      this.createOrderSuccessSummary = null;
      return;
    }

    this.createOrderSuccessMessage = payload.message;
    this.createOrderSuccessSummary = payload.summary;
  }

  setBranchId(branchId: string): void {
    this.branchId = branchId;
    this.selectedCustomer = null;
    this.customerSearch = "";
    this.selectedItems = [];
    this.depositAmount = "";
    this.depositAmountTouched = false;
    this.collectedAmount = "";
    this.collectedAmountTouched = false;
    this.activeOrders = [];
    this.closeQuickCustomerCreate();
    this.persist();
  }

  setOrderType(orderType: RentalOrderType): void {
    this.orderType = orderType;
    if (orderType === "RENTAL") {
      this.pricingMode = "STANDARD";
      this.applyRentalScheduleForPricingMode();
      this.recalculateSelectedItemsForDateRange();
    }
    this.selectedItems = [];
    this.depositAmount = "";
    this.depositAmountTouched = false;
    this.collectedAmount = "";
    this.collectedAmountTouched = false;
    this.persist();
  }

  setPricingMode(mode: RentalOrderPricingMode): void {
    this.pricingMode = mode;
    if (this.orderType === "RENTAL") {
      this.applyRentalScheduleForPricingMode();
      this.recalculateSelectedItemsForDateRange();
      this.depositAmount = "";
      this.depositAmountTouched = false;
      this.collectedAmount = "";
      this.collectedAmountTouched = false;
    }
    this.persist();
  }

  setCustomerSearch(value: string): void {
    this.customerSearch = value;
    this.persist();
  }

  setProductSearch(value: string): void {
    this.productSearch = value;
    this.persist();
  }

  setCurrentStep(step: 1 | 2): void {
    this.currentStep = step;
    this.persist();
  }

  selectCustomer(customer: CustomerTypeaheadItemDto): void {
    this.selectedCustomer = customer;
    this.customerSearch = customer.fullName;
    this.closeQuickCustomerCreate();
    this.persist();
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearch = "";
    this.persist();
  }

  setStartDate(value: string, options?: { preserveSelection?: boolean }): void {
    this.startDate = value;
    if (this.orderType === "RENTAL") {
      const rentalDays = resolvePricingModeDurationDays(this.pricingMode);
      const end = new Date(`${value}T00:00:00`);
      if (!Number.isNaN(end.getTime())) {
        end.setDate(end.getDate() + rentalDays);
        const year = end.getFullYear();
        const month = String(end.getMonth() + 1).padStart(2, "0");
        const day = String(end.getDate()).padStart(2, "0");
        this.endDate = `${year}-${month}-${day}`;
      }
      this.returnTime = this.pickupTime;
    }
    if (options?.preserveSelection) {
      this.recalculateSelectedItemsForDateRange();
      this.persist();
      return;
    }
    this.selectedItems = [];
    this.depositAmount = "";
    this.depositAmountTouched = false;
    this.collectedAmount = "";
    this.collectedAmountTouched = false;
    this.persist();
  }

  setEndDate(value: string, options?: { preserveSelection?: boolean }): void {
    if (this.orderType === "RENTAL") {
      this.recalculateSelectedItemsForDateRange();
      this.persist();
      return;
    }

    this.endDate = value;
    if (options?.preserveSelection) {
      this.recalculateSelectedItemsForDateRange();
      this.persist();
      return;
    }
    this.selectedItems = [];
    this.depositAmount = "";
    this.depositAmountTouched = false;
    this.persist();
  }

  setPickupTime(value: string): void {
    this.pickupTime = value;
    if (this.orderType === "RENTAL") {
      this.returnTime = value;
    }
    this.persist();
  }

  setReturnTime(value: string): void {
    this.returnTime = this.orderType === "RENTAL" ? this.pickupTime : value;
    this.persist();
  }

  setDepositAmount(value: string, options?: { markManual?: boolean }): void {
    this.depositAmount = value;
    if (options?.markManual !== false) {
      this.depositAmountTouched = true;
    }
    this.persist();
  }

  syncSuggestedDepositAmount(value: number): void {
    const normalized = String(Math.max(0, value));
    if (this.depositAmountTouched && this.depositAmount.trim().length > 0) return;
    this.depositAmount = normalized;
    this.depositAmountTouched = false;
    this.persist();
  }

  setCollectedAmount(value: string, options?: { markManual?: boolean }): void {
    this.collectedAmount = value;
    if (options?.markManual !== false) {
      this.collectedAmountTouched = true;
    }
    this.persist();
  }

  syncSuggestedCollectedAmount(value: number): void {
    const normalized = String(Math.max(0, value));
    if (this.collectedAmountTouched && this.collectedAmount.trim().length > 0) return;
    this.collectedAmount = normalized;
    this.collectedAmountTouched = false;
    this.persist();
  }

  setReceiptMethod(value: RentalOrderPaymentMethod): void {
    this.receiptMethod = value;
    this.persist();
  }

  setManualPaymentType(value: PosManualPaymentType): void {
    this.manualPaymentType = value;
    if (value !== "EXPENSE") {
      this.manualPaymentIsImportOrder = false;
    }
    this.persist();
  }

  setManualPaymentAmount(value: string): void {
    this.manualPaymentAmount = value;
    this.persist();
  }

  setManualPaymentMethod(value: RentalOrderPaymentMethod): void {
    this.manualPaymentMethod = value;
    this.persist();
  }

  setManualPaymentReason(value: string): void {
    this.manualPaymentReason = value;
    this.persist();
  }

  setManualPaymentNote(value: string): void {
    this.manualPaymentNote = value;
    this.persist();
  }

  setManualPaymentIsImportOrder(value: boolean): void {
    this.manualPaymentIsImportOrder =
      this.manualPaymentType === "EXPENSE" ? value : false;
    this.persist();
  }

  setManualPaymentIsInitialCapital(value: boolean): void {
    this.manualPaymentIsInitialCapital = value;
    this.persist();
  }

  setLatestManualPayment(payment: PaymentListItemDto | null): void {
    this.latestManualPayment = payment;
  }

  resetManualPaymentDraft(): void {
    this.manualPaymentAmount = "";
    this.manualPaymentReason = "";
    this.manualPaymentNote = "";
    this.manualPaymentIsImportOrder = false;
    this.manualPaymentIsInitialCapital = false;
    this.persist();
  }

  setNote(value: string): void {
    this.note = value;
    this.persist();
  }

  setActiveProductId(productId: string | null): void {
    this.activeProductId = productId;
  }

  openQuickCustomerCreate(): void {
    this.quickCustomerOpen = true;
    this.quickCustomerFullName = this.selectedCustomer?.fullName ?? "";
    this.quickCustomerPhone = this.customerSearch.trim();
    this.persist();
  }

  closeQuickCustomerCreate(): void {
    this.quickCustomerOpen = false;
    this.quickCustomerFullName = "";
    this.quickCustomerPhone = "";
    this.persist();
  }

  setQuickCustomerFullName(value: string): void {
    this.quickCustomerFullName = value;
    this.persist();
  }

  setQuickCustomerPhone(value: string): void {
    this.quickCustomerPhone = value;
    this.persist();
  }

  toggleSelectedItem(item: SelectedRentalItem): void {
    const existing = this.selectedItems.find((entry) => entry.itemId === item.itemId);
    if (existing) {
      this.selectedItems = this.selectedItems.filter((entry) => entry.itemId !== item.itemId);
    } else {
      this.selectedItems = [...this.selectedItems, item];
    }
    this.persist();
  }

  removeSelectedItem(itemId: string): void {
    this.selectedItems = this.selectedItems.filter((entry) => entry.itemId !== itemId);
    this.persist();
  }

  removeLastSelectedItemForProduct(productId: string): void {
    const nextItems = [...this.selectedItems];
    const index = nextItems.map((entry) => entry.productId).lastIndexOf(productId);
    if (index < 0) return;
    nextItems.splice(index, 1);
    this.selectedItems = nextItems;
    this.persist();
  }

  clearSelectedProduct(productId: string): void {
    this.selectedItems = this.selectedItems.filter((entry) => entry.productId !== productId);
    this.persist();
  }

  resetDraftKeepingAccess(): void {
    const nextStartDate = defaultDateValue(0);
    const nextPricingMode: RentalOrderPricingMode = "STANDARD";
    const nextEndDate = defaultDateValue(resolvePricingModeDurationDays(nextPricingMode));
    const nextPickupTime = defaultTimeValue();

    this.currentStep = 1;
    this.orderType = "RENTAL";
    this.pricingMode = nextPricingMode;
    this.customerSearch = "";
    this.productSearch = "";
    this.startDate = nextStartDate;
    this.endDate = nextEndDate;
    this.pickupTime = nextPickupTime;
    this.returnTime = nextPickupTime;
    this.depositAmount = "";
    this.depositAmountTouched = false;
    this.collectedAmount = "";
    this.collectedAmountTouched = false;
    this.receiptMethod = "CASH";
    this.note = "";
    this.selectedCustomer = null;
    this.customerResults = [];
    this.activeProductId = null;
    this.activeProductDetail = null;
    this.selectedItems = [];
    this.createdOrder = null;
    this.voiceReview = null;
    this.quickCustomerOpen = false;
    this.quickCustomerFullName = "";
    this.quickCustomerPhone = "";
    this.persist();
  }

  openVoiceReview(review: VoiceReviewDraft): void {
    this.voiceReview = review;
  }

  dismissVoiceReview(): void {
    this.voiceReview = null;
  }

  applyVoiceReview(): void {
    if (!this.voiceReview) return;
    const { field, suggestedValue } = this.voiceReview;
    if (field === "startDate") this.startDate = suggestedValue;
    if (field === "endDate") this.endDate = suggestedValue;
    if (field === "pickupTime") this.pickupTime = suggestedValue;
    if (field === "returnTime") this.returnTime = suggestedValue;
    if (field === "depositAmount") {
      this.depositAmount = suggestedValue;
      this.depositAmountTouched = true;
    }
    if (field === "collectedAmount") this.collectedAmount = suggestedValue;
    if (field === "receiptMethod") {
      this.receiptMethod = suggestedValue.toUpperCase() === "BANK" ? "BANK" : "CASH";
    }
    this.voiceReview = null;
    this.persist();
  }

  isSelectedItem(itemId: string): boolean {
    return this.selectedItems.some((entry) => entry.itemId === itemId);
  }

  getSelectedCountForProduct(productId: string): number {
    return this.selectedItems.filter((entry) => entry.productId === productId).length;
  }

  get canProceedToCustomerStep(): boolean {
    return this.selectedItems.length > 0;
  }
}

export const rentalOrderStore = new RentalOrderStore();
