"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customerAccountClientService } from "@/features/product-landing/services/customerAccountClientService";
import { customerAccountStore } from "@/features/product-landing/stores/customerAccountStore";
import type { UpdateCustomerAccountProfilePayload } from "@/types/customerAccount";

const customerAccountQueryKeys = {
  all: ["customer-account"] as const,
  profile: () => [...customerAccountQueryKeys.all, "profile"] as const,
};

export function useCustomerAccountProfileQuery(options: { enabled: boolean }) {
  const query = useQuery({
    queryKey: customerAccountQueryKeys.profile(),
    queryFn: customerAccountClientService.fetchProfile,
    enabled: options.enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!options.enabled) {
      customerAccountStore.clear();
      return;
    }

    if (!query.data) return;
    customerAccountStore.hydrateProfile(query.data);
  }, [options.enabled, query.data]);

  return query;
}

export function useUpdateCustomerAccountProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCustomerAccountProfilePayload) =>
      customerAccountClientService.updateProfile(payload),
    onSuccess: async (profile) => {
      customerAccountStore.hydrateProfile(profile);
      await queryClient.invalidateQueries({
        queryKey: customerAccountQueryKeys.profile(),
      });
    },
  });
}

export { customerAccountQueryKeys };
