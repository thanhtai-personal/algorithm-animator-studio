import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ALL_ORDER_STATUS_VALUE,
  rentalRevenueApiService,
} from "@/features/rental-revenue/services/rentalRevenueApiService";
import { rentalRevenueStore } from "@/features/rental-revenue/stores/rentalRevenueStore";
import type { RevenueReportGranularity } from "@/lib/contracts";
import { ApiClientError } from "@/lib/httpClient";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

export const rentalRevenueQueryKeys = {
  access: (accessToken: string | null) =>
    ["rental-revenue", "access", accessToken ?? ""] as const,
  overview: (accessToken: string | null, branchId: string | null) =>
    ["rental-revenue", "overview", accessToken ?? "", branchId ?? ""] as const,
  report: (
    accessToken: string | null,
    branchId: string | null,
    startDate: string,
    endDate: string,
    granularity: RevenueReportGranularity
  ) =>
    [
      "rental-revenue",
      "report",
      accessToken ?? "",
      branchId ?? "",
      startDate,
      endDate,
      granularity,
    ] as const,
  orders: (
    accessToken: string | null,
    branchId: string | null,
    status: string
  ) => ["rental-revenue", "orders", accessToken ?? "", branchId ?? "", status] as const,
};

function handleUnauthorizedAuthError(error: unknown, message: string) {
  if (!(error instanceof ApiClientError) || error.status !== 401) return;
  zaloMiniAppAuthStore.setErrorMessage(message);
  zaloMiniAppAuthStore.setSession(null);
}

export function useRentalRevenueAccessQuery(accessToken: string | null) {
  const query = useQuery({
    queryKey: rentalRevenueQueryKeys.access(accessToken),
    queryFn: () => rentalRevenueApiService.fetchAccess(accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!query.data?.access) return;
    rentalRevenueStore.hydrateAccess(query.data.access);
  }, [query.data]);

  useEffect(() => {
    handleUnauthorizedAuthError(
      query.error,
      "Đăng nhập thành công nhưng không lấy được quyền truy cập. API `access?app=revenue` trả về 401. Hãy đăng nhập lại; nếu vẫn lỗi, kiểm tra token đăng nhập có được gửi từ webview Zalo hay không."
    );
  }, [query.error]);

  return query;
}

export function useRentalRevenueOverviewQuery(
  accessToken: string | null,
  branchId: string | null
) {
  const query = useQuery({
    queryKey: rentalRevenueQueryKeys.overview(accessToken, branchId),
    queryFn: () =>
      rentalRevenueApiService.fetchOverview(accessToken as string, branchId as string),
    enabled: Boolean(accessToken && branchId),
    staleTime: 15_000,
  });

  useEffect(() => {
    rentalRevenueStore.hydrateOverview(query.data ?? null);
  }, [query.data]);

  useEffect(() => {
    handleUnauthorizedAuthError(
      query.error,
      "Phiên đăng nhập doanh thu đã hết hạn trong lúc tải tổng quan bảng điều hành. Hãy đăng nhập lại."
    );
  }, [query.error]);

  return query;
}

export function useRentalRevenueReportQuery(
  accessToken: string | null,
  branchId: string | null,
  startDate: string,
  endDate: string,
  granularity: RevenueReportGranularity
) {
  const query = useQuery({
    queryKey: rentalRevenueQueryKeys.report(
      accessToken,
      branchId,
      startDate,
      endDate,
      granularity
    ),
    queryFn: () =>
      rentalRevenueApiService.fetchRevenue(
        accessToken as string,
        branchId as string,
        startDate,
        endDate,
        granularity
      ),
    enabled: Boolean(accessToken && branchId),
    staleTime: 15_000,
  });

  useEffect(() => {
    rentalRevenueStore.hydrateReport(query.data?.report ?? null);
  }, [query.data]);

  useEffect(() => {
    handleUnauthorizedAuthError(
      query.error,
      "Phiên đăng nhập doanh thu đã hết hạn trong lúc tải báo cáo tài chính. Hãy đăng nhập lại."
    );
  }, [query.error]);

  return query;
}

export function useRentalRevenueOrdersQuery(
  accessToken: string | null,
  branchId: string | null,
  status: string
) {
  const query = useQuery({
    queryKey: rentalRevenueQueryKeys.orders(accessToken, branchId, status),
    queryFn: () =>
      rentalRevenueApiService.fetchOrders(
        accessToken as string,
        branchId as string,
        status || ALL_ORDER_STATUS_VALUE
      ),
    enabled: Boolean(accessToken && branchId),
    staleTime: 15_000,
  });

  useEffect(() => {
    rentalRevenueStore.hydrateManagedOrders(query.data ?? []);
  }, [query.data]);

  useEffect(() => {
    handleUnauthorizedAuthError(
      query.error,
      "Phiên đăng nhập đã hết hạn trong lúc tải danh sách đơn quản lý. Hãy đăng nhập lại."
    );
  }, [query.error]);

  return query;
}
