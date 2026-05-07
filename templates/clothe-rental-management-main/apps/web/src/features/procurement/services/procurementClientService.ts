"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import { getSupabaseAuthHeaders } from "@/lib/supabase/client";
import type {
  ProcurementCategoriesQuery,
  ProcurementCategoriesResponse,
  CreateProcurementReceiptPayload,
  ProcurementImportCommitPayload,
  ProcurementImportCommitResponse,
  ProcurementImportIncompleteExportPayload,
  ProcurementImportValidatePayload,
  ProcurementImportValidationResponse,
  ProcurementListQuery,
  ProcurementListResponse,
  ProcurementProductsQuery,
  ProcurementProductsResponse,
  ProcurementReceiptDetailDto,
  ProcurementReceiptCreateProductsResultDto,
  ProcurementReceiptRollbackResultDto,
  RollbackProcurementReceiptPayload,
  UpdateProcurementReceiptPayload,
} from "@/types/procurement";

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

async function parseFileResponse(response: Response): Promise<{ blob: Blob; fileName: string }> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "Request failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fallbackFileName = `procurement-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const match = disposition.match(/filename="?([^\";]+)"?/i);
  const fileName = match?.[1]?.trim() ?? fallbackFileName;

  return { blob, fileName };
}

async function buildRequestInit(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
  options?: { isFormData?: boolean }
): Promise<RequestInit> {
  const authHeaders = await getSupabaseAuthHeaders();
  const headers: Record<string, string> = {
    ...authHeaders,
  };

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (options?.isFormData && body instanceof FormData) {
      requestBody = body;
    } else {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  return {
    method,
    headers,
    credentials: "same-origin",
    cache: "no-store",
    body: requestBody,
  };
}

function appendImportContext(
  formData: FormData,
  context: ProcurementImportValidatePayload["context"] | ProcurementImportCommitPayload["context"]
) {
  if (!context) return;

  if (context.defaultCategoryCode) {
    formData.append("defaultCategoryCode", context.defaultCategoryCode);
  }
  if (typeof context.defaultIsRentable === "boolean") {
    formData.append("defaultIsRentable", String(context.defaultIsRentable));
  }
  if (typeof context.defaultIsSaleable === "boolean") {
    formData.append("defaultIsSaleable", String(context.defaultIsSaleable));
  }
}

export const procurementClientService = {
  async fetchReceipts(query: ProcurementListQuery): Promise<ProcurementListResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      intakeChannel: query.intakeChannel,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/procurement${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ProcurementListResponse>(response);
  },

  async fetchProducts(query: ProcurementProductsQuery): Promise<ProcurementProductsResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/procurement/products${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ProcurementProductsResponse>(response);
  },

  async fetchCategories(
    query: ProcurementCategoriesQuery
  ): Promise<ProcurementCategoriesResponse> {
    const queryString = toQueryString({
      branchId: query.branchId,
      search: query.search,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/procurement/categories${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ProcurementCategoriesResponse>(response);
  },

  async createReceipt(payload: CreateProcurementReceiptPayload): Promise<ProcurementReceiptDetailDto> {
    const response = await fetch(buildNestApiUrl("/api/v1/procurement"),
      await buildRequestInit("POST", payload)
    );

    return parseJsonResponse<ProcurementReceiptDetailDto>(response);
  },

  async rollbackReceipt(
    receiptId: string,
    payload?: RollbackProcurementReceiptPayload
  ): Promise<ProcurementReceiptRollbackResultDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/procurement/${receiptId}`),
      await buildRequestInit("DELETE", payload ?? {})
    );

    return parseJsonResponse<ProcurementReceiptRollbackResultDto>(response);
  },

  async updateReceipt(
    receiptId: string,
    payload: UpdateProcurementReceiptPayload
  ): Promise<ProcurementReceiptDetailDto> {
    const response = await fetch(buildNestApiUrl(`/api/v1/procurement/${receiptId}`),
      await buildRequestInit("PATCH", payload)
    );

    return parseJsonResponse<ProcurementReceiptDetailDto>(response);
  },

  async createProductsFromReceipt(
    receiptId: string
  ): Promise<ProcurementReceiptCreateProductsResultDto> {
    const response = await fetch(
      buildNestApiUrl(`/api/v1/procurement/${receiptId}/products`),
      await buildRequestInit("POST", {})
    );

    return parseJsonResponse<ProcurementReceiptCreateProductsResultDto>(response);
  },

  async fetchReceiptDetail(
    receiptId: string,
    branchId?: string | null
  ): Promise<ProcurementReceiptDetailDto> {
    const queryString = toQueryString({
      branchId,
    });

    const response = await fetch(
      buildNestApiUrl(`/api/v1/procurement/${receiptId}${queryString}`),
      await buildRequestInit("GET")
    );

    return parseJsonResponse<ProcurementReceiptDetailDto>(response);
  },

  async validateImportXlsx(
    payload: ProcurementImportValidatePayload
  ): Promise<ProcurementImportValidationResponse> {
    const formData = new FormData();
    if (payload.branchId) {
      formData.append("branchId", payload.branchId);
    }
    formData.append("file", payload.file);
    appendImportContext(formData, payload.context);

    const response = await fetch(buildNestApiUrl("/api/v1/procurement/import/validate"),
      await buildRequestInit("POST", formData, { isFormData: true })
    );

    return parseJsonResponse<ProcurementImportValidationResponse>(response);
  },

  async commitImportXlsx(
    payload: ProcurementImportCommitPayload
  ): Promise<ProcurementImportCommitResponse> {
    const formData = new FormData();
    if (payload.branchId) {
      formData.append("branchId", payload.branchId);
    }
    formData.append("file", payload.file);
    appendImportContext(formData, payload.context);

    if (payload.intakeSourceFileName) {
      formData.append("intakeSourceFileName", payload.intakeSourceFileName);
    }
    if (payload.supplierName) {
      formData.append("supplierName", payload.supplierName);
    }
    if (payload.supplierPhone) {
      formData.append("supplierPhone", payload.supplierPhone);
    }
    if (payload.note) {
      formData.append("note", payload.note);
    }
    if (payload.expensePayment) {
      formData.append("expensePayment", JSON.stringify(payload.expensePayment));
    }

    const response = await fetch(buildNestApiUrl("/api/v1/procurement/import/commit"),
      await buildRequestInit("POST", formData, { isFormData: true })
    );

    return parseJsonResponse<ProcurementImportCommitResponse>(response);
  },

  async exportTemplateXlsx(payload?: {
    branchId?: string | null;
    locale?: "vi" | "en";
  }): Promise<{ blob: Blob; fileName: string }> {
    const queryString = toQueryString({
      branchId: payload?.branchId,
      locale: payload?.locale,
    });

    const response = await fetch(buildNestApiUrl(`/api/v1/procurement/template${queryString}`),
      await buildRequestInit("GET")
    );

    return parseFileResponse(response);
  },

  async exportIncompleteRowsXlsx(
    payload: ProcurementImportIncompleteExportPayload
  ): Promise<{ blob: Blob; fileName: string }> {
    const response = await fetch(buildNestApiUrl("/api/v1/procurement/import/incomplete/export"),
      await buildRequestInit("POST", payload)
    );

    return parseFileResponse(response);
  },
};
