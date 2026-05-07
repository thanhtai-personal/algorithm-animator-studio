import { requestJson } from "@/lib/httpClient";
import type {
  CustomerTypeaheadItemDto,
  CreateRentalCustomerPayload,
  CreateRentalCustomerResponse,
  CreateRentalOrderPayload,
  CreatePosManualPaymentPayload,
  CustomersTypeaheadResponse,
  OrderDetailDto,
  OrderStatusTransitionPayload,
  OrdersListResponse,
  PaymentListItemDto,
  ProductDetailDto,
  ProductsListResponse,
  ZaloMiniAppRentalAccessDto,
  ZaloMiniAppRentalAccessResponse,
  ZaloMiniAppRentalOrderCreateResponse,
} from "@/lib/contracts";

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

interface CreateCustomerApiResponse {
  customer: {
    id: string;
    branchId: string;
    fullName: string;
    phone: string | null;
    phoneNormalized: string | null;
    isActive: boolean;
    tags: Array<{
      id: string;
      branchId: string;
      code: string;
      name: string;
      color: string | null;
      isSystem: boolean;
      warnOnOrderCreate: boolean;
      blockOrderCreate: boolean;
      isActive: boolean;
    }>;
  };
}

function mapCustomerDetailToTypeahead(
  customer: CreateCustomerApiResponse["customer"]
): CustomerTypeaheadItemDto {
  const tags = customer.tags;
  return {
    id: customer.id,
    branchId: customer.branchId,
    fullName: customer.fullName,
    phone: customer.phone,
    phoneNormalized: customer.phoneNormalized,
    isActive: customer.isActive,
    tags,
    warnOnOrderCreate: tags.some((tag) => tag.warnOnOrderCreate),
    blockOrderCreate: tags.some((tag) => tag.blockOrderCreate),
    isVip: tags.some((tag) => tag.code.toLowerCase().includes("vip")),
    isBlacklist: tags.some((tag) => tag.code.toLowerCase().includes("blacklist")),
  };
}

export const rentalOrderApiService = {
  fetchAccess(accessToken: string) {
    return requestJson<unknown>(
      "/api/v1/auth/rental-access?app=order",
      { authorizationToken: accessToken }
    ).then((payload) => {
      const value =
        payload && typeof payload === "object" && "access" in payload
          ? (payload as { access?: unknown }).access
          : payload;

      if (!value || typeof value !== "object") {
        throw new Error("Access payload không hợp lệ");
      }

      const access = value as Partial<ZaloMiniAppRentalAccessDto>;
      if (!Array.isArray(access.branches)) {
        throw new Error("Access payload không có danh sách chi nhánh");
      }

      return { access: access as ZaloMiniAppRentalAccessDto } satisfies ZaloMiniAppRentalAccessResponse;
    });
  },

  searchCustomers(accessToken: string, branchId: string, search: string) {
    return requestJson<CustomersTypeaheadResponse>(
      `/api/v1/customers/typeahead${buildQuery({ branchId, search, limit: 8 })}`,
      { authorizationToken: accessToken }
    );
  },

  createCustomer(accessToken: string, payload: CreateRentalCustomerPayload) {
    return requestJson<CreateCustomerApiResponse>("/api/v1/customers", {
      method: "POST",
      body: payload,
      authorizationToken: accessToken,
    }).then((response) => ({
      customer: mapCustomerDetailToTypeahead(response.customer),
    }) satisfies CreateRentalCustomerResponse);
  },

  fetchProducts(accessToken: string, branchId: string, search: string) {
    return requestJson<ProductsListResponse>(
      `/api/v1/products${buildQuery({
        branchId,
        search,
        hasReadyItems: true,
        page: 1,
        pageSize: 24,
      })}`,
      { authorizationToken: accessToken }
    );
  },

  fetchProductDetail(accessToken: string, branchId: string, productId: string) {
    return requestJson<ProductDetailDto>(
      `/api/v1/products/${productId}${buildQuery({ branchId })}`,
      { authorizationToken: accessToken }
    );
  },

  createOrder(accessToken: string, payload: CreateRentalOrderPayload) {
    return requestJson<ZaloMiniAppRentalOrderCreateResponse>(
      "/api/v1/orders/mini-app/create",
      {
        method: "POST",
        body: payload,
        authorizationToken: accessToken,
      }
    );
  },

  createManualPayment(accessToken: string, payload: CreatePosManualPaymentPayload) {
    return requestJson<PaymentListItemDto>(
      "/api/v1/payments",
      {
        method: "POST",
        body: payload,
        authorizationToken: accessToken,
      }
    );
  },

  createReturnOrder(accessToken: string, payload: {
    sourceRentalOrderId: string;
    actualReturnDate: string;
    note?: string | null;
    internalNote?: string | null;
    status?: "DRAFT" | "CREATED";
  }) {
    return requestJson<unknown>(
      "/api/v1/return-orders",
      {
        method: "POST",
        body: payload,
        authorizationToken: accessToken,
      }
    );
  },

  fetchActiveOrders(
    accessToken: string,
    branchId: string,
    search: string,
    page = 1,
    pageSize = 24,
  ) {
    const statuses = ["DRAFT", "RESERVED", "CONFIRMED", "PICKED_UP", "DEBT"];
    return requestJson<OrdersListResponse>(
      `/api/v1/orders${buildQuery({
        branchId,
        status: statuses.join(","),
        search,
        page,
        pageSize,
      })}`,
      { authorizationToken: accessToken }
    );
  },

  transitionOrderStatus(
    accessToken: string,
    orderId: string,
    payload: OrderStatusTransitionPayload
  ) {
    return requestJson<OrderDetailDto>(
      `/api/v1/orders/${orderId}/status`,
      {
        method: "PATCH",
        body: payload,
        authorizationToken: accessToken,
      }
    );
  },

  fetchOrderDetail(accessToken: string, orderId: string) {
    return requestJson<OrderDetailDto>(
      `/api/v1/orders/${orderId}`,
      { authorizationToken: accessToken }
    );
  },
};
