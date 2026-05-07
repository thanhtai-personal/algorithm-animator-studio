"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsClientService } from "@/features/payments/services/paymentsClientService";
import { paymentsStore } from "@/features/payments/stores/paymentsStore";
import type {
  PaymentsListQuery,
  UpdateManualPaymentPayload,
  UpdatePaymentStatusPayload,
} from "@/types/paymentsDomain";

const paymentsQueryKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentsQueryKeys.all, "list"] as const,
  attachments: (paymentId: string) =>
    [...paymentsQueryKeys.all, "attachments", paymentId] as const,
  list: (query: PaymentsListQuery) =>
    [
      ...paymentsQueryKeys.lists(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.type ?? "",
      query.method ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
};

export function usePaymentsListQuery(query: PaymentsListQuery) {
  const queryResult = useQuery({
    queryKey: paymentsQueryKeys.list(query),
    queryFn: () => paymentsClientService.fetchPayments(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    paymentsStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useUpdatePaymentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: UpdatePaymentStatusPayload;
    }) => paymentsClientService.updatePaymentStatus(paymentId, payload),
    onSuccess: async (item) => {
      paymentsStore.upsertListItem(item);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: paymentsQueryKeys.attachments(item.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload,
    }: {
      paymentId: string;
      payload: UpdateManualPaymentPayload;
    }) => paymentsClientService.updatePayment(paymentId, payload),
    onSuccess: async (item) => {
      paymentsStore.upsertListItem(item);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: paymentsQueryKeys.attachments(item.id),
        }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
}

export function useUploadPaymentReceiptFilesMutation() {
  return useMutation({
    mutationFn: async ({
      branchId,
      files,
    }: {
      branchId?: string | null;
      files: File[];
    }) => {
      const uploaded = await Promise.all(
        files.map((file) =>
          paymentsClientService.uploadPaymentReceiptFile({
            branchId,
            file,
          }),
        ),
      );
      return uploaded.map((entry) => entry.uploadSessionId);
    },
  });
}

export function useExportPaymentsCsvMutation() {
  return useMutation({
    mutationFn: (query: PaymentsListQuery) => paymentsClientService.exportPaymentsCsv(query),
  });
}

export function usePaymentAttachmentsQuery(paymentId: string | null) {
  return useQuery({
    queryKey: paymentsQueryKeys.attachments(paymentId ?? ""),
    queryFn: () => paymentsClientService.fetchPaymentAttachments(paymentId ?? ""),
    enabled: Boolean(paymentId),
    staleTime: 60_000,
  });
}

export { paymentsQueryKeys };
