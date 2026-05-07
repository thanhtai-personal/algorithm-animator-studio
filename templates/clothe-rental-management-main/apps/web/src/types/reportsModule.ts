import type {
  OrderIncidentStatus,
  OrderIncidentType,
} from "@/types/ordersDomain";

export type RevenueReportGranularity = "day" | "month" | "year";

export interface RevenueReportQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  granularity?: RevenueReportGranularity | null;
}

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

export interface UtilizationReportQuery {
  branchId?: string | null;
}

export interface UtilizationKpiDto {
  totalActiveItems: number;
  onRentItems: number;
  utilizationRate: number;
}

export interface UtilizationCategoryRowDto {
  productCategoryId: string | null;
  categoryName: string;
  totalActiveItems: number;
  onRentItems: number;
  utilizationRate: number;
}

export interface UtilizationProductRowDto {
  productId: string;
  productName: string;
  productCategoryId: string | null;
  categoryName: string | null;
  totalActiveItems: number;
  onRentItems: number;
  utilizationRate: number;
}

export interface UtilizationReportResponse {
  branchId: string;
  timezone: string;
  currencyCode: string;
  asOfDate: string;
  kpi: UtilizationKpiDto;
  byCategory: UtilizationCategoryRowDto[];
  byProduct: UtilizationProductRowDto[];
}

export interface IncidentsReportQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type?: OrderIncidentType | null;
}

export interface IncidentsSummaryDto {
  totalIncidents: number;
  totalAmount: number;
  byTypeCount: Record<OrderIncidentType, number>;
  byTypeAmount: Record<OrderIncidentType, number>;
  byStatusCount: Record<OrderIncidentStatus, number>;
}

export interface IncidentReportRowDto {
  incidentId: string;
  createdAt: string;
  orderId: string;
  orderCode: string;
  itemId: string | null;
  itemCode: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  type: OrderIncidentType;
  status: OrderIncidentStatus;
  amount: number;
  applyToDeposit: boolean;
  description: string | null;
}

export interface IncidentsReportResponse {
  branchId: string;
  timezone: string;
  currencyCode: string;
  startDate: string;
  endDate: string;
  summary: IncidentsSummaryDto;
  items: IncidentReportRowDto[];
}
