"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { makeupClientService } from "@/features/makeup/services/makeupClientService";
import { makeupStore } from "@/features/makeup/stores/makeupStore";
import type {
  CheckMakeupConflictsQuery,
  CreateMakeupEventPayload,
  CreateMakeupInventoryItemPayload,
  CreateMakeupOrderPayload,
  CreateMakeupPackagePayload,
  CreateMakeupPurchaseInvoicePayload,
  MakeupAdminOverviewQuery,
  MakeupArtistScheduleQuery,
  MakeupEventsQuery,
  MakeupInventoryQuery,
  MakeupMyStatsQuery,
  MakeupOrdersQuery,
  MakeupPackagesQuery,
  MakeupPurchaseInvoicesQuery,
  ParseMakeupBookingInputPayload,
  UpdateMakeupEventPayload,
  UpdateMakeupInventoryItemPayload,
  UpdateMakeupOrderPayload,
  UpdateMakeupPackagePayload,
  UpdateMakeupPurchaseInvoicePayload,
} from "@/types/makeupModule";

export const makeupQueryKeys = {
  all: ["makeup"] as const,
  eventsRoot: () => [...makeupQueryKeys.all, "events"] as const,
  events: (query: MakeupEventsQuery) =>
    [
      ...makeupQueryKeys.eventsRoot(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.artistProfileId ?? "",
      query.customerId ?? "",
    ] as const,
  artistsRoot: () => [...makeupQueryKeys.all, "artists"] as const,
  artists: (branchId: string | null | undefined) =>
    [...makeupQueryKeys.artistsRoot(), branchId ?? ""] as const,
  artistSchedule: (artistProfileId: string, query: MakeupArtistScheduleQuery) =>
    [
      ...makeupQueryKeys.eventsRoot(),
      "artist",
      artistProfileId,
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
    ] as const,
  conflicts: (query: CheckMakeupConflictsQuery) =>
    [
      ...makeupQueryKeys.all,
      "conflicts",
      query.branchId ?? "",
      query.eventDate,
      query.sessionSlot,
      query.artistProfileId ?? "",
      query.customerId ?? "",
      query.excludeEventId ?? "",
    ] as const,
  packagesRoot: () => [...makeupQueryKeys.all, "packages"] as const,
  packages: (query: MakeupPackagesQuery) =>
    [...makeupQueryKeys.packagesRoot(), query.branchId ?? "", query.activeOnly ? "1" : "0"] as const,
  myStats: (query: MakeupMyStatsQuery) =>
    [
      ...makeupQueryKeys.all,
      "my-stats",
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
    ] as const,
  adminOverviewRoot: () => [...makeupQueryKeys.all, "admin-overview"] as const,
  adminOverview: (query: MakeupAdminOverviewQuery) =>
    [
      ...makeupQueryKeys.adminOverviewRoot(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.granularity ?? "day",
    ] as const,
  inventoryRoot: () => [...makeupQueryKeys.all, "inventory"] as const,
  inventory: (query: MakeupInventoryQuery) =>
    [
      ...makeupQueryKeys.inventoryRoot(),
      query.branchId ?? "",
      query.packageId ?? "",
      query.artistProfileId ?? "",
      query.isActive === null || query.isActive === undefined ? "" : query.isActive ? "1" : "0",
      query.search ?? "",
    ] as const,
  ordersRoot: () => [...makeupQueryKeys.all, "orders"] as const,
  orders: (query: MakeupOrdersQuery) =>
    [
      ...makeupQueryKeys.ordersRoot(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.status ?? "",
      query.search ?? "",
    ] as const,
  purchaseInvoicesRoot: () => [...makeupQueryKeys.all, "purchase-invoices"] as const,
  purchaseInvoices: (query: MakeupPurchaseInvoicesQuery) =>
    [
      ...makeupQueryKeys.purchaseInvoicesRoot(),
      query.branchId ?? "",
      query.startDate ?? "",
      query.endDate ?? "",
      query.status ?? "",
      query.search ?? "",
    ] as const,
};

export function useMakeupEventsQuery(query: MakeupEventsQuery, enabled = true) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.events(query),
    queryFn: () => makeupClientService.fetchEvents(query),
    enabled,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateEvents(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useMakeupConflictsQuery(query: CheckMakeupConflictsQuery, enabled = true) {
  return useQuery({
    queryKey: makeupQueryKeys.conflicts(query),
    queryFn: () => makeupClientService.checkConflicts(query),
    enabled,
    staleTime: 0,
  });
}

export function useCreateMakeupEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMakeupEventPayload) => makeupClientService.createEvent(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.eventsRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.ordersRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useParseMakeupBookingInputMutation() {
  return useMutation({
    mutationFn: (payload: ParseMakeupBookingInputPayload) =>
      makeupClientService.parseBookingInput(payload),
  });
}

export function useCheckMakeupConflictsMutation() {
  return useMutation({
    mutationFn: (query: CheckMakeupConflictsQuery) =>
      makeupClientService.checkConflicts(query),
  });
}

export function useUpdateMakeupEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { eventId: string; payload: UpdateMakeupEventPayload }) =>
      makeupClientService.updateEvent(options.eventId, options.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.eventsRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.ordersRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMakeupArtistsQuery(branchId: string | null | undefined, enabled = true) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.artists(branchId),
    queryFn: () => makeupClientService.fetchArtists(branchId),
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateArtists(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useMakeupArtistScheduleQuery(
  artistProfileId: string,
  query: MakeupArtistScheduleQuery,
  enabled = true
) {
  return useQuery({
    queryKey: makeupQueryKeys.artistSchedule(artistProfileId, query),
    queryFn: () => makeupClientService.fetchArtistSchedule(artistProfileId, query),
    enabled,
    staleTime: 10_000,
  });
}

export function useMakeupPackagesQuery(query: MakeupPackagesQuery) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.packages(query),
    queryFn: () => makeupClientService.fetchPackages(query),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydratePackages(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateMakeupPackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMakeupPackagePayload) => makeupClientService.createPackage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.packagesRoot() });
    },
  });
}

export function useUpdateMakeupPackageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { packageId: string; payload: UpdateMakeupPackagePayload }) =>
      makeupClientService.updatePackage(options.packageId, options.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.packagesRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.eventsRoot() });
    },
  });
}

export function useMakeupMyStatsQuery(query: MakeupMyStatsQuery, enabled = true) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.myStats(query),
    queryFn: () => makeupClientService.fetchMyStats(query),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateMyStats(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useMakeupAdminOverviewQuery(
  query: MakeupAdminOverviewQuery,
  enabled = true
) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.adminOverview(query),
    queryFn: () => makeupClientService.fetchAdminOverview(query),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateAdminOverview(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useMakeupInventoryQuery(query: MakeupInventoryQuery, enabled = true) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.inventory(query),
    queryFn: () => makeupClientService.fetchInventory(query),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateInventory(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateMakeupInventoryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMakeupInventoryItemPayload) =>
      makeupClientService.createInventoryItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.inventoryRoot() });
    },
  });
}

export function useUpdateMakeupInventoryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { itemId: string; payload: UpdateMakeupInventoryItemPayload }) =>
      makeupClientService.updateInventoryItem(options.itemId, options.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.inventoryRoot() });
    },
  });
}

export function useMakeupOrdersQuery(query: MakeupOrdersQuery, enabled = true) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.orders(query),
    queryFn: () => makeupClientService.fetchOrders(query),
    enabled,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydrateOrders(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateMakeupOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMakeupOrderPayload) => makeupClientService.createOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.ordersRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.eventsRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateMakeupOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { orderId: string; payload: UpdateMakeupOrderPayload }) =>
      makeupClientService.updateOrder(options.orderId, options.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.ordersRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.eventsRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useMakeupPurchaseInvoicesQuery(
  query: MakeupPurchaseInvoicesQuery,
  enabled = true
) {
  const queryResult = useQuery({
    queryKey: makeupQueryKeys.purchaseInvoices(query),
    queryFn: () => makeupClientService.fetchPurchaseInvoices(query),
    enabled,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    makeupStore.hydratePurchaseInvoices(queryResult.data);
  }, [queryResult.data]);

  return queryResult;
}

export function useCreateMakeupPurchaseInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMakeupPurchaseInvoicePayload) =>
      makeupClientService.createPurchaseInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.purchaseInvoicesRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
    },
  });
}

export function useUpdateMakeupPurchaseInvoiceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: { invoiceId: string; payload: UpdateMakeupPurchaseInvoicePayload }) =>
      makeupClientService.updatePurchaseInvoice(options.invoiceId, options.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.purchaseInvoicesRoot() });
      await queryClient.invalidateQueries({ queryKey: makeupQueryKeys.adminOverviewRoot() });
    },
  });
}
