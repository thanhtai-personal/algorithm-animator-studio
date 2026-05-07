"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  CheckMakeupConflictsQuery,
  CreateMakeupEventPayload,
  CreateMakeupInventoryItemPayload,
  CreateMakeupOrderPayload,
  CreateMakeupPackagePayload,
  CreateMakeupPurchaseInvoicePayload,
  MakeupAdminOverviewQuery,
  MakeupAdminOverviewResponse,
  MakeupArtistsResponse,
  MakeupConflictsResponse,
  MakeupEventMutationResponse,
  MakeupEventsQuery,
  MakeupEventsResponse,
  MakeupInventoryQuery,
  MakeupInventoryResponse,
  MakeupMyStatsQuery,
  MakeupMyStatsResponse,
  MakeupOrdersQuery,
  MakeupOrdersResponse,
  MakeupPackageDto,
  MakeupPackagesQuery,
  MakeupPackagesResponse,
  MakeupParsedBookingDraft,
  MakeupPurchaseInvoicesQuery,
  MakeupPurchaseInvoicesResponse,
  ParseMakeupBookingInputPayload,
  UpdateMakeupEventPayload,
  UpdateMakeupInventoryItemPayload,
  UpdateMakeupOrderPayload,
  UpdateMakeupPackagePayload,
  UpdateMakeupPurchaseInvoicePayload,
} from "@/types/makeupModule";

interface ApiErrorPayload {
  error?: string;
  context?: Record<string, unknown>;
}

export class MakeupApiError extends Error {
  readonly status: number;
  readonly context: Record<string, unknown> | null;

  constructor(message: string, status: number, context: Record<string, unknown> | null) {
    super(message);
    this.name = "MakeupApiError";
    this.status = status;
    this.context = context;
  }
}

function toQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload & T;

  if (!response.ok) {
    throw new MakeupApiError(
      payload.error ?? "Request failed",
      response.status,
      payload.context ?? null
    );
  }

  return payload;
}

async function buildRequestInit(
  method: "GET" | "POST" | "PATCH",
  body?: unknown
): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export const makeupClientService = {
  async fetchEvents(query: MakeupEventsQuery): Promise<MakeupEventsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      artistProfileId: query.artistProfileId,
      customerId: query.customerId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/events${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupEventsResponse>(response);
  },

  async checkConflicts(query: CheckMakeupConflictsQuery): Promise<MakeupConflictsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      eventDate: query.eventDate,
      sessionSlot: query.sessionSlot,
      startAt: query.startAt,
      endAt: query.endAt,
      artistProfileId: query.artistProfileId,
      customerId: query.customerId,
      customerPhone: query.customerPhone,
      excludeEventId: query.excludeEventId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/events/conflicts${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupConflictsResponse>(response);
  },

  async createEvent(payload: CreateMakeupEventPayload): Promise<MakeupEventMutationResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/events"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<MakeupEventMutationResponse>(response);
  },

  async parseBookingInput(
    payload: ParseMakeupBookingInputPayload
  ): Promise<MakeupParsedBookingDraft> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/events/parse"),
      await buildRequestInit("POST", payload)
    );

    const parsed = await parseJsonResponse<{ draft: MakeupParsedBookingDraft }>(response);
    return parsed.draft;
  },

  async updateEvent(
    eventId: string,
    payload: UpdateMakeupEventPayload
  ): Promise<MakeupEventMutationResponse> {
    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/events/${eventId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<MakeupEventMutationResponse>(response);
  },

  async fetchArtists(branchId?: string | null): Promise<MakeupArtistsResponse> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/artists${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupArtistsResponse>(response);
  },

  async fetchArtistSchedule(
    artistProfileId: string,
    query: { branchId?: string | null; startDate?: string | null; endDate?: string | null }
  ): Promise<MakeupEventsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/artists/${artistProfileId}/schedule${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupEventsResponse>(response);
  },

  async fetchPackages(query: MakeupPackagesQuery): Promise<MakeupPackagesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      activeOnly: query.activeOnly,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/packages${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupPackagesResponse>(response);
  },

  async createPackage(payload: CreateMakeupPackagePayload): Promise<MakeupPackageDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/packages"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<MakeupPackageDto>(response);
  },

  async updatePackage(
    packageId: string,
    payload: UpdateMakeupPackagePayload
  ): Promise<MakeupPackageDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/packages/${packageId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<MakeupPackageDto>(response);
  },

  async fetchMyStats(query: MakeupMyStatsQuery): Promise<MakeupMyStatsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/stats/my${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupMyStatsResponse>(response);
  },

  async fetchAdminOverview(query: MakeupAdminOverviewQuery): Promise<MakeupAdminOverviewResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/admin/overview${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupAdminOverviewResponse>(response);
  },

  async fetchInventory(query: MakeupInventoryQuery): Promise<MakeupInventoryResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      packageId: query.packageId,
      artistProfileId: query.artistProfileId,
      isActive: query.isActive,
      search: query.search,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/inventory${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupInventoryResponse>(response);
  },

  async createInventoryItem(
    payload: CreateMakeupInventoryItemPayload
  ): Promise<MakeupInventoryResponse["items"][number]> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/inventory"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<MakeupInventoryResponse["items"][number]>(response);
  },

  async updateInventoryItem(
    itemId: string,
    payload: UpdateMakeupInventoryItemPayload
  ): Promise<MakeupInventoryResponse["items"][number]> {
    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/inventory/${itemId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<MakeupInventoryResponse["items"][number]>(response);
  },

  async fetchOrders(query: MakeupOrdersQuery): Promise<MakeupOrdersResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
      search: query.search,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/orders${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupOrdersResponse>(response);
  },

  async createOrder(payload: CreateMakeupOrderPayload): Promise<MakeupEventMutationResponse> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/orders"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<MakeupEventMutationResponse>(response);
  },

  async updateOrder(
    orderId: string,
    payload: UpdateMakeupOrderPayload
  ): Promise<MakeupEventMutationResponse> {
    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/orders/${orderId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<MakeupEventMutationResponse>(response);
  },

  async fetchPurchaseInvoices(
    query: MakeupPurchaseInvoicesQuery
  ): Promise<MakeupPurchaseInvoicesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
      search: query.search,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/purchase-invoices${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<MakeupPurchaseInvoicesResponse>(response);
  },

  async createPurchaseInvoice(
    payload: CreateMakeupPurchaseInvoicePayload
  ): Promise<MakeupPurchaseInvoicesResponse["items"][number]> {
    const response = await fetch(buildNestApiUrl("/api/v1/makeup/purchase-invoices"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<MakeupPurchaseInvoicesResponse["items"][number]>(response);
  },

  async updatePurchaseInvoice(
    invoiceId: string,
    payload: UpdateMakeupPurchaseInvoicePayload
  ): Promise<MakeupPurchaseInvoicesResponse["items"][number]> {
    const response = await fetch(buildNestApiUrl(`/api/v1/makeup/purchase-invoices/${invoiceId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<MakeupPurchaseInvoicesResponse["items"][number]>(response);
  },
};
