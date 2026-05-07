export interface ZaloMiniAppConfigDto {
  enabled: boolean;
}

export interface ZaloMiniAppIdentityDto {
  id: string;
  zaloUserId: string;
  profileId: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  consentScopes: string[];
  consentRevokedAt: string | null;
  lastLoginAt: string;
}

export interface ZaloMiniAppSessionDto {
  sessionToken: string;
  expiresAt: string;
  identity: ZaloMiniAppIdentityDto;
}

export interface ZaloMiniAppCreateSessionPayload {
  zaloUserId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  consentScopes?: string[];
  zaloAccessToken?: string | null;
}

export interface SettingsBranchDto {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string;
  currencyCode: string;
  isActive: boolean;
}

export interface ZaloMiniAppRentalAccessDto {
  profileId: string;
  role: string;
  branchId: string;
  displayName: string | null;
  branches: SettingsBranchDto[];
}

export interface ZaloMiniAppRentalAccessResponse {
  access: ZaloMiniAppRentalAccessDto;
}

export interface CustomerTagDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  color: string | null;
  isSystem: boolean;
  warnOnOrderCreate: boolean;
  blockOrderCreate: boolean;
  isActive: boolean;
}

export interface CustomerTypeaheadItemDto {
  id: string;
  branchId: string;
  fullName: string;
  phone: string | null;
  phoneNormalized: string | null;
  isActive: boolean;
  tags: CustomerTagDto[];
  warnOnOrderCreate: boolean;
  blockOrderCreate: boolean;
  isVip: boolean;
  isBlacklist: boolean;
}

export interface CustomersTypeaheadResponse {
  items: CustomerTypeaheadItemDto[];
}

export interface ProductCategoryDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ProductTagDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  color: string | null;
  isActive: boolean;
}

export interface ProductPricePlanDto {
  defaultDepositAmount: number | null;
  price1d: number | null;
  price3d: number | null;
  price7d: number | null;
  pricePerDay: number | null;
}

export interface ProductSummaryDto {
  id: string;
  branchId: string | null;
  productCode: string;
  name: string;
  productCategoryId: string | null;
  categoryName: string | null;
  gender: string | null;
  material: string | null;
  coverImagePath: string | null;
  isActive: boolean;
  isArchived: boolean;
  rentPricePerDay: number | null;
  rentDepositAmount: number | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  tags: ProductTagDto[];
  totalItems: number;
  readyItems: number;
  variantCount: number;
  pricePolicy: ProductPricePlanDto;
  updatedAt: string;
}

export interface ProductsListResponse {
  items: ProductSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
}

export interface ProductVariantDto extends ProductPricePlanDto {
  id: string;
  productId: string;
  variantCode: string;
  skuCode: string | null;
  name: string;
  size: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
  readyItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItemDto {
  id: string;
  variantId: string;
  variantName: string;
  itemCode: string;
  size: string | null;
  status: string;
  branchId: string;
  lastRentDate: string | null;
}

export interface ProductOverviewDto {
  id: string;
  branchId: string | null;
  productCode: string;
  name: string;
  productCategoryId: string | null;
  categoryName: string | null;
  gender: string | null;
  material: string | null;
  description: string | null;
  coverImagePath: string | null;
  galleryImagePaths: string[];
  videoUrls: string[];
  isActive: boolean;
  isArchived: boolean;
  rentPricePerDay: number | null;
  rentDepositAmount: number | null;
  salePrice: number | null;
  purchasePrice: number | null;
  isRentable: boolean;
  isSaleable: boolean;
  successfulRentCount: number;
  tags: ProductTagDto[];
  updatedAt: string;
}

export interface ProductDetailDto {
  overview: ProductOverviewDto;
  variants: ProductVariantDto[];
  items: ProductItemDto[];
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
  activity: Array<Record<string, unknown>>;
}

export type RentalOrderType = "RENTAL" | "SALE";
export type RentalOrderPaymentMethod = "CASH" | "BANK";
export type RentalOrderRentPlanType = "1d" | "3d" | "7d" | "custom";

export interface RentalOrderItemInputPayload {
  itemId: string;
  rentPlanType?: RentalOrderRentPlanType;
  rentPlanDays?: number | null;
  rentPrice?: number | null;
  depositOverrideAmount?: number | null;
}

export interface CreateRentalOrderPaymentInputPayload {
  type: "RENT" | "DEPOSIT";
  method: "CASH" | "BANK" | "MOMO";
  amount: number;
  status?: "POSTED" | "VOIDED";
  reason?: string | null;
  source?: string | null;
  note?: string | null;
  referenceCode?: string | null;
}

export interface CreateRentalOrderPayload {
  branchId?: string | null;
  orderType: RentalOrderType;
  customerId: string;
  status?: "DRAFT" | "RESERVED" | "CONFIRMED";
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  discountType?: "amount" | "percent" | null;
  discountValue?: number | null;
  feesAmount?: number | null;
  depositAmount?: number | null;
  note?: string | null;
  internalNote?: string | null;
  items?: RentalOrderItemInputPayload[];
  payments?: CreateRentalOrderPaymentInputPayload[];
  paymentReceiptConfirmation?:
    | {
        confirmed: true;
        amount: number;
        method: RentalOrderPaymentMethod;
        note?: string | null;
      }
    | null;
}

export interface OrderCustomerRefDto {
  customerId: string;
  fullName: string;
  phone: string | null;
}

export interface OrderMoneySummaryDto {
  rentAmount: number;
  discountAmount: number;
  feesAmount: number;
  totalAmount: number;
  depositAmount: number;
  depositAppliedAmount: number;
  depositRefundedAmount: number;
  depositPaid: number;
  rentPaid: number;
  feePaid: number;
  refundPaid: number;
  revenueGross: number;
  refundEffective: number;
  revenueNet: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  depositCollectedTotal: number;
  depositRefundedTotal: number;
  receivableCollectedTotal: number;
  refundableDeposit: number;
  outstandingAmount: number;
}

export interface OrderSummaryDto {
  id: string;
  branchId: string;
  orderCode: string;
  orderType: RentalOrderType;
  status: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  note: string | null;
  internalNote: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  customer: OrderCustomerRefDto;
  itemCount: number;
  discountType: "amount" | "percent" | null;
  discountValue: number | null;
  money: OrderMoneySummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersListResponse {
  items: OrderSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderItemDto {
  orderItemId: string;
  itemId: string;
  itemCode: string | null;
  itemStatus: string | null;
  productId: string;
  productName: string | null;
  variantId: string;
  variantName: string | null;
  rentPlanType: RentalOrderRentPlanType | null;
  rentPlanDays: number | null;
  rentPrice: number;
  depositOverrideAmount: number | null;
  depositEffectiveAmount: number | null;
  cogsSnapshotAmount: number | null;
  conditionOutNote: string | null;
  conditionInNote: string | null;
  createdAt: string;
}

export interface OrderDetailDto {
  summary: OrderSummaryDto;
  items: OrderItemDto[];
  payments: Array<Record<string, unknown>>;
  incidents: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  reservationWindows: Array<Record<string, unknown>>;
  auditWritePoints: string[];
}

export interface ZaloMiniAppRentalOrderCreateResponse {
  access: ZaloMiniAppRentalAccessDto;
  order: OrderDetailDto;
}

export type DashboardModuleMetricKey =
  | "ALL_MODULES"
  | "RENTAL_SALE_MODULE"
  | "MAKEUP_MODULE";

export interface DashboardModuleMetricDto {
  module: DashboardModuleMetricKey;
  revenue: number;
  profit: number;
  orderCount: number;
}

export interface DashboardKpiDto {
  branchId: string;
  timezone: string;
  currencyCode: string;
  today: string;
  revenueToday: number;
  revenueGrossToday: number;
  refundEffectiveToday: number;
  cogsToday: number;
  grossProfitToday: number;
  profitMarginToday: number;
  salesProfitToday: number;
  realProfitToday: number;
  realInflowToday: number;
  realOutflowToday: number;
  depositCollectedToday: number;
  depositRefundedToday: number;
  initialCapitalInflowTotal: number;
  initialCapitalOutflowTotal: number;
  initialCapitalNetTotal: number;
  importOrderExpenseTotal: number;
  outstandingDebtTotal: number;
  financialFormulaVersion: string;
  soldItemsTotal: number;
  ordersOnRent: number;
  dueToday: number;
  overdue: number;
  itemsInLaundry: number;
  moduleMetrics: DashboardModuleMetricDto[];
}

export interface DashboardOrderRowDto {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  status: string;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

export interface DashboardActivityRowDto {
  id: string;
  createdAt: string;
  actorProfileId: string | null;
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  reason: string | null;
}

export interface DashboardOverviewResponse {
  kpi: DashboardKpiDto;
  dueTodayOrders: DashboardOrderRowDto[];
  overdueOrders: DashboardOrderRowDto[];
  recentActivities: DashboardActivityRowDto[];
}

export type RevenueReportGranularity = "day" | "month" | "year";

export interface RevenueKpiDto {
  revenueGross: number;
  refundEffective: number;
  revenueNet: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  salesProfit: number;
  realProfit: number;
  cashInflow: number;
  cashOutflow: number;
  depositCollectedTotal: number;
  depositRefundedTotal: number;
  outstandingDebt: number;
  totalRevenue: number;
  totalDepositCollected: number;
  totalDepositRefunded: number;
  totalRefunds: number;
  netRevenue: number;
}

export interface RevenueDailyRowDto {
  date: string;
  revenueGross: number;
  refundEffective: number;
  revenueNet: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  realProfit: number;
  cashInflow: number;
  cashOutflow: number;
  depositCollectedTotal: number;
  depositRefundedTotal: number;
  totalRevenue: number;
  depositCollected: number;
  depositRefunded: number;
  refunds: number;
  net: number;
}

export interface TopRentalProductRowDto {
  productId: string;
  productName: string;
  categoryName: string | null;
  bookingCount: number;
  rentalDays: number;
  rentAmount: number;
}

export interface TopRentalItemRowDto {
  itemId: string;
  itemCode: string;
  productId: string;
  productName: string;
  variantName: string | null;
  bookingCount: number;
  rentalDays: number;
  rentAmount: number;
}

export interface RevenueReportResponse {
  branchId: string;
  timezone: string;
  currencyCode: string;
  startDate: string;
  endDate: string;
  granularity: RevenueReportGranularity;
  formulaVersion: string;
  formulaNote: string;
  kpi: RevenueKpiDto;
  dailyRows: RevenueDailyRowDto[];
  topRentalsMetric: string;
  topProducts: TopRentalProductRowDto[];
  topItems: TopRentalItemRowDto[];
}

export interface ZaloMiniAppRentalRevenueResponse {
  access?: ZaloMiniAppRentalAccessDto;
  report: RevenueReportResponse;
}
