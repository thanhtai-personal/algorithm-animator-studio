"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { procurementClientService } from "@/features/procurement/services/procurementClientService";
import { procurementStore } from "@/features/procurement/stores/procurementStore";
import type {
  CreateProcurementReceiptPayload,
  ProcurementCategoriesQuery,
  ProcurementImportCommitPayload,
  ProcurementImportIncompleteExportPayload,
  ProcurementImportValidatePayload,
  ProcurementListQuery,
  ProcurementProductsQuery,
  RollbackProcurementReceiptPayload,
  UpdateProcurementReceiptPayload,
} from "@/types/procurement";

const procurementQueryKeys = {
  all: ["procurement"] as const,
  receipts: () => [...procurementQueryKeys.all, "receipts"] as const,
  receiptList: (query: ProcurementListQuery) =>
    [
      ...procurementQueryKeys.receipts(),
      query.branchId ?? "",
      query.search ?? "",
      query.intakeChannel ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  receiptDetail: (receiptId: string, branchId?: string | null) =>
    [...procurementQueryKeys.receipts(), "detail", receiptId, branchId ?? ""] as const,
  products: () => [...procurementQueryKeys.all, "products"] as const,
  productList: (query: ProcurementProductsQuery) =>
    [
      ...procurementQueryKeys.products(),
      query.branchId ?? "",
      query.search ?? "",
      query.page ?? 1,
      query.pageSize ?? 100,
    ] as const,
  categories: () => [...procurementQueryKeys.all, "categories"] as const,
  categoryList: (query: ProcurementCategoriesQuery) =>
    [
      ...procurementQueryKeys.categories(),
      query.branchId ?? "",
      query.search ?? "",
    ] as const,
};

export function useProcurementReceiptsQuery(query: ProcurementListQuery) {
  const queryResult = useQuery({
    queryKey: procurementQueryKeys.receiptList(query),
    queryFn: () => procurementClientService.fetchReceipts(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    procurementStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useProcurementReceiptDetailQuery(
  receiptId: string | null,
  branchId?: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: procurementQueryKeys.receiptDetail(receiptId ?? "", branchId),
    queryFn: () => procurementClientService.fetchReceiptDetail(receiptId ?? "", branchId),
    enabled: enabled && Boolean(receiptId),
    staleTime: 20_000,
  });
}

export async function fetchProcurementReceiptDetailById(
  queryClient: QueryClient,
  options: {
    receiptId: string;
    branchId?: string | null;
  }
) {
  return queryClient.fetchQuery({
    queryKey: procurementQueryKeys.receiptDetail(options.receiptId, options.branchId),
    queryFn: () =>
      procurementClientService.fetchReceiptDetail(options.receiptId, options.branchId),
    staleTime: 20_000,
  });
}

export function useProcurementProductsQuery(query: ProcurementProductsQuery) {
  const queryResult = useQuery({
    queryKey: procurementQueryKeys.productList(query),
    queryFn: () => procurementClientService.fetchProducts(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    procurementStore.hydrateProductOptions(queryResult.data.items);
  }, [queryResult.data]);

  return queryResult;
}

export function useProcurementCategoriesQuery(query: ProcurementCategoriesQuery) {
  const queryResult = useQuery({
    queryKey: procurementQueryKeys.categoryList(query),
    queryFn: () => procurementClientService.fetchCategories(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) {
      procurementStore.hydrateCategoryOptions([]);
      return;
    }
    procurementStore.hydrateCategoryOptions(queryResult.data.items);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateProcurementReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProcurementReceiptPayload) =>
      procurementClientService.createReceipt(payload),
    onSuccess: async (detail) => {
      procurementStore.hydrateLastCreatedReceipt(detail);
      procurementStore.hydrateImportValidation(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.receipts() }),
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}

export function useRollbackProcurementReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      payload,
    }: {
      receiptId: string;
      payload?: RollbackProcurementReceiptPayload;
    }) => procurementClientService.rollbackReceipt(receiptId, payload),
    onSuccess: async () => {
      procurementStore.hydrateLastCreatedReceipt(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.receipts() }),
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}

export function useUpdateProcurementReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      receiptId,
      payload,
    }: {
      receiptId: string;
      payload: UpdateProcurementReceiptPayload;
    }) => procurementClientService.updateReceipt(receiptId, payload),
    onSuccess: async (detail) => {
      procurementStore.hydrateLastCreatedReceipt(detail);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.receipts() }),
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}

export function useCreateProductsFromProcurementReceiptMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiptId: string) =>
      procurementClientService.createProductsFromReceipt(receiptId),
    onSuccess: async (result) => {
      procurementStore.hydrateLastCreatedReceipt(result.receipt);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.receipts() }),
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}

export function useValidateProcurementImportMutation() {
  return useMutation({
    mutationFn: (payload: ProcurementImportValidatePayload) =>
      procurementClientService.validateImportXlsx(payload),
    onSuccess: (validation) => {
      procurementStore.hydrateImportValidation(validation);
      procurementStore.hydrateImportCommitResult(null);
    },
  });
}

export function useCommitProcurementImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcurementImportCommitPayload) =>
      procurementClientService.commitImportXlsx(payload),
    onSuccess: async (result) => {
      procurementStore.hydrateLastCreatedReceipt(result.receipt);
      procurementStore.hydrateImportCommitResult(result);
      procurementStore.hydrateImportValidation(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.receipts() }),
        queryClient.invalidateQueries({ queryKey: procurementQueryKeys.products() }),
        queryClient.invalidateQueries({ queryKey: ["payments"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["reports"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
}

export function useExportProcurementTemplateMutation() {
  return useMutation({
    mutationFn: (payload?: { branchId?: string | null; locale?: "vi" | "en" }) =>
      procurementClientService.exportTemplateXlsx(payload),
  });
}

export function useExportProcurementIncompleteRowsMutation() {
  return useMutation({
    mutationFn: (payload: ProcurementImportIncompleteExportPayload) =>
      procurementClientService.exportIncompleteRowsXlsx(payload),
  });
}

export { procurementQueryKeys };
