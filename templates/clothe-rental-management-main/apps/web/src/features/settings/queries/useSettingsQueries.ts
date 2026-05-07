"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsClientService } from "@/features/settings/services/settingsClientService";
import { settingsStore } from "@/features/settings/stores/settingsStore";
import { authStore } from "@/store/authStore";
import type { SalesShiftListQuery } from "@/types/salesDesk";
import type {
  PosPasskeyUpdatePayload,
  SettingLocale,
  SettingsShowroomPageScope,
  SettingsBranchShopDomainCheckQuery,
  SettingsCreateBranchPayload,
  SettingsCreateProductCategoryPayload,
  SettingsCreateShowroomPayload,
  SettingsCreateUserPayload,
  SettingsGeneralUpdatePayload,
  SettingsResetUserPasswordPayload,
  SettingsShowroomPagesUpdatePayload,
  SettingsUpdateBranchPayload,
  SettingsUpdateProductCategoryPayload,
  SettingsUpdateShowroomPayload,
  SettingsUpdateUserPayload,
} from "@/types/settingsModule";

function resolveSettingsQueryScope(): string {
  return authStore.userId ?? authStore.anonId ?? "guest";
}

export const settingsQueryKeys = {
  all: ["settings"] as const,
  generalRoot: () =>
    [...settingsQueryKeys.all, "general", resolveSettingsQueryScope()] as const,
  general: (branchId: string | null) =>
    [...settingsQueryKeys.generalRoot(), branchId ?? ""] as const,
  posPasskeyPolicy: () => [...settingsQueryKeys.generalRoot(), "pos-passkey-policy"] as const,
  showroomPages: (
    branchId: string | null,
    locale: SettingLocale | null,
    scope: SettingsShowroomPageScope | null
  ) =>
    [...settingsQueryKeys.all, "showroom-pages", scope ?? "branch", branchId ?? "", locale ?? ""] as const,
  usersRoot: () => [...settingsQueryKeys.all, "users"] as const,
  users: (branchId: string | null) =>
    [...settingsQueryKeys.usersRoot(), branchId ?? ""] as const,
  branches: () => [...settingsQueryKeys.all, "branches"] as const,
  productCategoriesRoot: () => [...settingsQueryKeys.all, "product-categories"] as const,
  productCategories: (branchId: string | null) =>
    [...settingsQueryKeys.productCategoriesRoot(), branchId ?? ""] as const,
  showrooms: () => [...settingsQueryKeys.all, "showrooms"] as const,
  shiftsRoot: () => [...settingsQueryKeys.all, "shifts"] as const,
  shifts: (query: SalesShiftListQuery) =>
    [
      ...settingsQueryKeys.shiftsRoot(),
      query.branchId ?? "",
      query.staffId ?? "",
      query.status ?? "",
      query.fromDate ?? "",
      query.toDate ?? "",
      query.page ?? 1,
      query.pageSize ?? 20,
    ] as const,
  shiftDetail: (shiftId: string, branchId: string | null) =>
    [...settingsQueryKeys.shiftsRoot(), "detail", shiftId, branchId ?? ""] as const,
};

export function useSettingsGeneralQuery(branchId: string | null) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.general(branchId),
    queryFn: () => settingsClientService.fetchGeneral({ branchId }),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateGeneral(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useUpdateSettingsGeneralMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsGeneralUpdatePayload) =>
      settingsClientService.updateGeneral(payload),
    onSuccess: (payload) => {
      settingsStore.hydrateGeneral(payload);
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.general(payload.branchId),
      });
    },
  });
}

export function useSettingsShowroomPagesQuery(
  branchId: string | null,
  locale: SettingLocale | null,
  scope: SettingsShowroomPageScope | null
) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.showroomPages(branchId, locale, scope),
    queryFn: () => settingsClientService.fetchShowroomPages({ branchId, locale, scope }),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateShowroomPages(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useUpdateSettingsShowroomPagesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsShowroomPagesUpdatePayload) =>
      settingsClientService.updateShowroomPages(payload),
    onSuccess: (payload) => {
      settingsStore.hydrateShowroomPages(payload);
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.showroomPages(
          payload.branchId,
          payload.locale,
          payload.scope ?? "branch"
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: [...settingsQueryKeys.all, "showroom-pages"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["product-landing"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["showroom", "config"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["showroom", "list"],
      });
    },
  });
}

export function useSettingsPosPasskeyPolicyQuery(enabled = true) {
  return useQuery({
    queryKey: settingsQueryKeys.posPasskeyPolicy(),
    queryFn: () => settingsClientService.fetchPosPasskeyPolicy(),
    enabled,
    staleTime: 20_000,
  });
}

export function useUpdateSettingsPosPasskeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PosPasskeyUpdatePayload) =>
      settingsClientService.updatePosPasskey(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.posPasskeyPolicy(),
      });
    },
  });
}

export function useSettingsUsersQuery(branchId: string | null, enabled = true) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.users(branchId),
    queryFn: () => settingsClientService.fetchUsers({ branchId }),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateUsers(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateSettingsUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsCreateUserPayload) => settingsClientService.createUser(payload),
    onSuccess: (payload) => {
      settingsStore.upsertUser(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.usersRoot() });
    },
  });
}

export function useUpdateSettingsUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { userId: string; payload: SettingsUpdateUserPayload }) =>
      settingsClientService.updateUser(options.userId, options.payload),
    onSuccess: (payload) => {
      settingsStore.upsertUser(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.usersRoot() });
    },
  });
}

export function useResetSettingsUserPasswordMutation() {
  return useMutation({
    mutationFn: (options: { userId: string; payload: SettingsResetUserPasswordPayload }) =>
      settingsClientService.resetUserPassword(options.userId, options.payload),
  });
}

export function useSettingsBranchesQuery(enabled = true) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.branches(),
    queryFn: () => settingsClientService.fetchBranches(),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateBranches(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateSettingsBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsCreateBranchPayload) =>
      settingsClientService.createBranch(payload),
    onSuccess: (payload) => {
      settingsStore.upsertBranch(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.branches() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.general(null) });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.usersRoot() });
    },
  });
}

export function useUpdateSettingsBranchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { branchId: string; payload: SettingsUpdateBranchPayload }) =>
      settingsClientService.updateBranch(options.branchId, options.payload),
    onSuccess: (payload) => {
      settingsStore.upsertBranch(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.branches() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.general(payload.id) });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.usersRoot() });
    },
  });
}

export function useCheckSettingsBranchShopDomainMutation() {
  return useMutation({
    mutationFn: (query: SettingsBranchShopDomainCheckQuery) =>
      settingsClientService.checkBranchShopDomain(query),
  });
}

export function useSettingsProductCategoriesQuery(branchId: string | null) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.productCategories(branchId),
    queryFn: () => settingsClientService.fetchProductCategories({ branchId }),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateProductCategories(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateSettingsProductCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsCreateProductCategoryPayload) =>
      settingsClientService.createProductCategory(payload),
    onSuccess: (payload) => {
      settingsStore.upsertProductCategory(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.productCategoriesRoot() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.generalRoot() });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["showroom"] });
    },
  });
}

export function useUpdateSettingsProductCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: {
      productCategoryId: string;
      payload: SettingsUpdateProductCategoryPayload;
    }) => settingsClientService.updateProductCategory(options.productCategoryId, options.payload),
    onSuccess: (payload) => {
      settingsStore.upsertProductCategory(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.productCategoriesRoot() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.generalRoot() });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["showroom"] });
    },
  });
}

export function useDeleteSettingsProductCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productCategoryId: string) => settingsClientService.deleteProductCategory(productCategoryId),
    onSuccess: (_payload, productCategoryId) => {
      settingsStore.removeProductCategory(productCategoryId);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.productCategoriesRoot() });
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.generalRoot() });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["showroom"] });
    },
  });
}

export function useSettingsShowroomsQuery(enabled = true) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.showrooms(),
    queryFn: () => settingsClientService.fetchShowrooms(),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateShowrooms(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateSettingsShowroomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SettingsCreateShowroomPayload) =>
      settingsClientService.createShowroom(payload),
    onSuccess: (payload) => {
      settingsStore.upsertShowroom(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.showrooms() });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.showroomPages(null, null, null),
      });
    },
  });
}

export function useUpdateSettingsShowroomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { showroomId: string; payload: SettingsUpdateShowroomPayload }) =>
      settingsClientService.updateShowroom(options.showroomId, options.payload),
    onSuccess: (payload) => {
      settingsStore.upsertShowroom(payload);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.showrooms() });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.showroomPages(null, null, null),
      });
    },
  });
}

export function useDeleteSettingsShowroomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (showroomId: string) => settingsClientService.deleteShowroom(showroomId),
    onSuccess: (_payload, showroomId) => {
      settingsStore.removeShowroom(showroomId);
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.showrooms() });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.showroomPages(null, null, null),
      });
    },
  });
}

export function useSettingsShiftsQuery(query: SalesShiftListQuery) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.shifts(query),
    queryFn: () => settingsClientService.fetchShifts(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateShifts(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useSettingsShiftDetailQuery(
  shiftId: string,
  branchId: string | null,
  enabled = true
) {
  const queryResult = useQuery({
    queryKey: settingsQueryKeys.shiftDetail(shiftId, branchId),
    queryFn: () => settingsClientService.fetchShiftDetail(shiftId, branchId),
    enabled: enabled && Boolean(shiftId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    settingsStore.hydrateShiftDetail(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}
