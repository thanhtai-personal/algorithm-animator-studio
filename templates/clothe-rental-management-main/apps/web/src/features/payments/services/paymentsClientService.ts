"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import {
  getSupabaseAuthHeaders,
  getSupabaseBrowserClient,
} from "@/lib/supabase/client";
import type {
  PaymentAttachmentListResponse,
  PaymentListItemDto,
  PaymentsListQuery,
  PaymentsListResponse,
  PreparePaymentReceiptUploadResponse,
  UpdateManualPaymentPayload,
  UpdatePaymentStatusPayload,
} from "@/types/paymentsDomain";

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
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

async function parseCsvResponse(response: Response): Promise<{ blob: Blob; fileName: string }> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fallbackFileName = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
  const match = disposition.match(/filename=([^;]+)/i);
  const fileName = match?.[1]?.trim() ?? fallbackFileName;

  return { blob, fileName };
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
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}

export const paymentsClientService = {
  async fetchPayments(query: PaymentsListQuery): Promise<PaymentsListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
      method: query.method,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/payments${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<PaymentsListResponse>(response);
  },

  async exportPaymentsCsv(query: PaymentsListQuery): Promise<{ blob: Blob; fileName: string }> {
    const queryString = toQueryString({
      branchId: query.branchId,
      startDate: query.startDate,
      endDate: query.endDate,
      type: query.type,
      method: query.method,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/payments/export${queryString}`),
      await buildRequestInit("GET")
    );

    return parseCsvResponse(response);
  },

  async updatePaymentStatus(
    paymentId: string,
    payload: UpdatePaymentStatusPayload
  ): Promise<PaymentListItemDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/payments/${paymentId}/status`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<PaymentListItemDto>(response);
  },

  async updatePayment(
    paymentId: string,
    payload: UpdateManualPaymentPayload
  ): Promise<PaymentListItemDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/payments/${paymentId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<PaymentListItemDto>(response);
  },

  async uploadPaymentReceiptFile(options: {
    branchId?: string | null;
    file: File;
  }): Promise<PreparePaymentReceiptUploadResponse> {
    const file = options.file;
    const response = await fetch(buildNestApiUrl("/api/v1/payments/receipt-upload"),
      await buildRequestInit("POST", {
        branchId: options.branchId ?? null,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      })
    );
    const prepared = await parseJsonResponse<PreparePaymentReceiptUploadResponse>(response);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(prepared.bucket)
      .upload(prepared.storagePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) throw error;
    return prepared;
  },

  async fetchPaymentAttachments(paymentId: string): Promise<PaymentAttachmentListResponse> {
    const response = await fetch(buildNestApiUrl(`/api/v1/payments/${paymentId}/attachments`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<PaymentAttachmentListResponse>(response);
  },
};
