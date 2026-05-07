"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersClientService } from "@/features/customers/services/customersClientService";
import { customersStore } from "@/features/customers/stores/customersStore";
import type {
  CreateCustomerPayload,
  CustomersListQuery,
  CustomersTypeaheadQuery,
  UpdateCustomerPayload,
} from "@/types/customersCrm";

const customersQueryKeys = {
  all: ["customers"] as const,
  lists: () => [...customersQueryKeys.all, "list"] as const,
  list: (query: CustomersListQuery) =>
    [
      ...customersQueryKeys.lists(),
      query.branchId ?? "",
      query.search ?? "",
      query.tagId ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  details: () => [...customersQueryKeys.all, "detail"] as const,
  detail: (customerId: string) => [...customersQueryKeys.details(), customerId] as const,
  typeaheads: () => [...customersQueryKeys.all, "typeahead"] as const,
  typeahead: (query: CustomersTypeaheadQuery) =>
    [
      ...customersQueryKeys.typeaheads(),
      query.branchId ?? "",
      query.search ?? "",
      query.limit ?? 8,
    ] as const,
};

export function useCustomersListQuery(query: CustomersListQuery) {
  const queryResult = useQuery({
    queryKey: customersQueryKeys.list(query),
    queryFn: () => customersClientService.fetchCustomers(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    customersStore.hydrateList(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCustomerDetailQuery(customerId: string) {
  const queryResult = useQuery({
    queryKey: customersQueryKeys.detail(customerId),
    queryFn: () => customersClientService.fetchCustomerDetail(customerId),
    enabled: Boolean(customerId),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    customersStore.hydrateDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomerPayload) =>
      customersClientService.createCustomer(payload),
    onSuccess: async (detail) => {
      customersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.typeaheads() }),
      ]);
    },
  });
}

export function useUpdateCustomerMutation(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCustomerPayload) =>
      customersClientService.updateCustomer(customerId, payload),
    onSuccess: async (detail) => {
      customersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.detail(customerId) }),
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.typeaheads() }),
      ]);
    },
  });
}

export function useUpdateCustomerAnyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      payload,
    }: {
      customerId: string;
      payload: UpdateCustomerPayload;
    }) => customersClientService.updateCustomer(customerId, payload),
    onSuccess: async (detail) => {
      customersStore.hydrateDetail(detail);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: customersQueryKeys.detail(detail.customer.id),
        }),
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: customersQueryKeys.typeaheads() }),
      ]);
    },
  });
}

export function useCustomerTypeaheadQuery(query: CustomersTypeaheadQuery) {
  const normalizedSearch = query.search.trim();

  const queryResult = useQuery({
    queryKey: customersQueryKeys.typeahead({
      ...query,
      search: normalizedSearch,
    }),
    queryFn: () =>
      customersClientService.fetchCustomersTypeahead({
        ...query,
        search: normalizedSearch,
      }),
    enabled: normalizedSearch.length >= 2,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    customersStore.hydrateTypeahead(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export { customersQueryKeys };
