import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalOrderApiService } from "@/features/rental-order/services/rentalOrderApiService";
import { rentalOrderStore } from "@/features/rental-order/stores/rentalOrderStore";
import { ApiClientError } from "@/lib/httpClient";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

export const rentalOrderQueryKeys = {
  access: (accessToken: string | null) => ["rental-order", "access", accessToken ?? ""] as const,
  customers: (accessToken: string | null, branchId: string | null, search: string) =>
    ["rental-order", "customers", accessToken ?? "", branchId ?? "", search] as const,
  products: (accessToken: string | null, branchId: string | null, search: string) =>
    ["rental-order", "products", accessToken ?? "", branchId ?? "", search] as const,
  productDetail: (accessToken: string | null, branchId: string | null, productId: string | null) =>
    ["rental-order", "product-detail", accessToken ?? "", branchId ?? "", productId ?? ""] as const,
  orderDetail: (accessToken: string | null, orderId: string | null) =>
    ["rental-order", "order-detail", accessToken ?? "", orderId ?? ""] as const,
  activeOrders: (
    accessToken: string | null,
    branchId: string | null,
    search: string,
    page: number
  ) => ["rental-order", "active-orders", accessToken ?? "", branchId ?? "", search, page] as const,
};

export function fetchRentalProductDetailQuery(options: {
  queryClient: QueryClient;
  accessToken: string;
  branchId: string;
  productId: string;
}) {
  return options.queryClient.fetchQuery({
    queryKey: rentalOrderQueryKeys.productDetail(
      options.accessToken,
      options.branchId,
      options.productId
    ),
    queryFn: () =>
      rentalOrderApiService.fetchProductDetail(
        options.accessToken,
        options.branchId,
        options.productId
      ),
    staleTime: 10_000,
  });
}

export function useRentalOrderAccessQuery(accessToken: string | null) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.access(accessToken),
    queryFn: () => rentalOrderApiService.fetchAccess(accessToken as string),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    if (!query.data?.access) return;
    rentalOrderStore.hydrateAccess(query.data.access);
  }, [query.data]);

  useEffect(() => {
    if (!(query.error instanceof ApiClientError) || query.error.status !== 401) return;
    const message = import.meta.env.PROD
      ? "Đăng nhập thành công nhưng không lấy được quyền truy cập. Vui lòng thử lại."
      : "Đăng nhập thành công nhưng không lấy được quyền truy cập. API access?app=order trả 401. Hãy đăng nhập lại; nếu vẫn lỗi, kiểm tra bearer token có được gửi từ webview Zalo hay không.";

    zaloMiniAppAuthStore.setErrorMessage(message);
    zaloMiniAppAuthStore.setSession(null);
  }, [query.error]);

  return query;
}

export function useRentalCustomersQuery(
  accessToken: string | null,
  branchId: string | null,
  search: string
) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.customers(accessToken, branchId, search),
    queryFn: () =>
      rentalOrderApiService.searchCustomers(accessToken as string, branchId as string, search),
    enabled: Boolean(accessToken && branchId && search.trim().length >= 2),
    staleTime: 10_000,
  });

  useEffect(() => {
    rentalOrderStore.hydrateCustomerResults(query.data?.items ?? []);
  }, [query.data]);

  return query;
}

export function useRentalProductsQuery(
  accessToken: string | null,
  branchId: string | null,
  search: string
) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.products(accessToken, branchId, search),
    queryFn: () =>
      rentalOrderApiService.fetchProducts(accessToken as string, branchId as string, search),
    enabled: Boolean(accessToken && branchId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!query.data) return;
    rentalOrderStore.hydrateProductResults(query.data.items ?? []);
  }, [query.data, query.dataUpdatedAt]);

  return query;
}

export function useRentalProductDetailQuery(
  accessToken: string | null,
  branchId: string | null,
  productId: string | null
) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.productDetail(accessToken, branchId, productId),
    queryFn: () =>
      rentalOrderApiService.fetchProductDetail(
        accessToken as string,
        branchId as string,
        productId as string
      ),
    enabled: Boolean(accessToken && branchId && productId),
    staleTime: 10_000,
  });

  useEffect(() => {
    rentalOrderStore.hydrateActiveProductDetail(query.data ?? null);
  }, [query.data]);

  return query;
}

export function useRentalOrderDetailQuery(accessToken: string | null, orderId: string | null) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.orderDetail(accessToken, orderId),
    queryFn: () => rentalOrderApiService.fetchOrderDetail(accessToken as string, orderId as string),
    enabled: Boolean(accessToken && orderId),
    staleTime: 10_000,
  });

  return query;
}

export function useCreateRentalOrderMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof rentalOrderApiService.createOrder>[1]) =>
      rentalOrderApiService.createOrder(accessToken as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["rental-order", "products"],
      });
    },
  });
}

export function useCreateRentalPosManualPaymentMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof rentalOrderApiService.createManualPayment>[1]) =>
      rentalOrderApiService.createManualPayment(accessToken as string, payload),
  });
}

export function useCreateReturnOrderMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof rentalOrderApiService.createReturnOrder>[1]) =>
      rentalOrderApiService.createReturnOrder(accessToken as string, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-order", "active-orders"] });
    },
  });
}

export function useCreateRentalCustomerMutation(accessToken: string | null) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof rentalOrderApiService.createCustomer>[1]) =>
      rentalOrderApiService.createCustomer(accessToken as string, payload),
    onSuccess: (response) => {
      rentalOrderStore.selectCustomer(response.customer);
      rentalOrderStore.hydrateCustomerResults([response.customer]);
      rentalOrderStore.closeQuickCustomerCreate();
    },
  });
}

export function useRentalActiveOrdersQuery(
  accessToken: string | null,
  branchId: string | null,
  search: string,
  page: number
) {
  const query = useQuery({
    queryKey: rentalOrderQueryKeys.activeOrders(accessToken, branchId, search, page),
    queryFn: () =>
      rentalOrderApiService.fetchActiveOrders(
        accessToken as string,
        branchId as string,
        search,
        page
      ),
    enabled: Boolean(accessToken && branchId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!query.data) return;
    rentalOrderStore.hydrateActiveOrders(query.data.items ?? []);
  }, [query.data]);

  return query;
}

export function useOrderStatusTransitionMutation(accessToken: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      payload: Parameters<typeof rentalOrderApiService.transitionOrderStatus>[2];
    }) =>
      rentalOrderApiService.transitionOrderStatus(
        accessToken as string,
        input.orderId,
        input.payload
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["rental-order", "active-orders"] });
    },
  });
}
