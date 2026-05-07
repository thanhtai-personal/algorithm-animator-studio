import type { MakeupAdminOverviewChartPointDto } from './makeup-module.type';

export interface MakeupAdminOverviewResponse {
  branchId: string;
  timezone: string;
  startDate: string;
  endDate: string;
  makeupOrderCount: number;
  makeupPurchaseInvoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
  chart: MakeupAdminOverviewChartPointDto[];
}
