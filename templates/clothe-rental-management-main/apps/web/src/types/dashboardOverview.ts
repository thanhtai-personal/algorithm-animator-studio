import type { OrderStatus } from "@/types/domainPrimitives";

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
  ordersReserved: number;
  reservedPickupToday: number;
  reservedPickupOverdue: number;
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
  status: OrderStatus;
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

export interface DashboardOverviewQuery {
  branchId?: string | null;
}
