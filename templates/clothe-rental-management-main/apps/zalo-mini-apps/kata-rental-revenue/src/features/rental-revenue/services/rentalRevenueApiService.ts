import { requestJson } from "@/lib/httpClient";
import type {
  DashboardOrderRowDto,
  DashboardOverviewResponse,
  OrdersListResponse,
  OrderSummaryDto,
  RevenueReportResponse,
  RevenueReportGranularity,
  ZaloMiniAppRentalAccessResponse,
  ZaloMiniAppRentalRevenueResponse,
} from "@/lib/contracts";

export const ALL_ORDER_STATUS_VALUE = "__ALL__";

function buildQuery(params: Record<string, string | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    query.set(key, value);
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

function mapSummaryToDashboardRow(summary: OrderSummaryDto): DashboardOrderRowDto {
  return {
    orderId: summary.id,
    orderCode: summary.orderCode,
    customerName: summary.customer.fullName,
    customerPhone: summary.customer.phone,
    status: summary.status,
    startDate: summary.startDate,
    endDate: summary.endDate,
    updatedAt: summary.updatedAt,
  };
}

export const rentalRevenueApiService = {
  fetchAccess(accessToken: string) {
    return requestJson<ZaloMiniAppRentalAccessResponse>(
      "/api/v1/auth/rental-access?app=revenue",
      { authorizationToken: accessToken }
    );
  },

  fetchOverview(accessToken: string, branchId: string) {
    return requestJson<DashboardOverviewResponse>(
      `/api/v1/reports/dashboard/overview${buildQuery({ branchId })}`,
      { authorizationToken: accessToken }
    );
  },

  fetchRevenue(
    accessToken: string,
    branchId: string,
    startDate: string,
    endDate: string,
    granularity: RevenueReportGranularity
  ) {
    return requestJson<RevenueReportResponse>(
      `/api/v1/reports/revenue${buildQuery({
        branchId,
        startDate,
        endDate,
        granularity,
      })}`,
      { authorizationToken: accessToken }
    ).then((report) => ({ report }) satisfies ZaloMiniAppRentalRevenueResponse);
  },

  fetchOrders(
    accessToken: string,
    branchId: string,
    status: string
  ): Promise<DashboardOrderRowDto[]> {
    const statusValue = status === ALL_ORDER_STATUS_VALUE ? null : status;

    return requestJson<OrdersListResponse>(
      `/api/v1/orders${buildQuery({
        branchId,
        orderType: "RENTAL",
        status: statusValue,
        page: "1",
        pageSize: "80",
      })}`,
      { authorizationToken: accessToken }
    ).then((response) => response.items.map(mapSummaryToDashboardRow));
  },
};
