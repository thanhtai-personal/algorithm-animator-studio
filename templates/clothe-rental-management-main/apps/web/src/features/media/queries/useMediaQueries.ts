"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mediaClientService } from "@/features/media/services/mediaClientService";
import { mediaStore } from "@/features/media/stores/mediaStore";
import type { MediaAssetType, MediaListQuery } from "@/types/mediaLibrary";

export const mediaQueryKeys = {
  all: ["media"] as const,
  lists: () => [...mediaQueryKeys.all, "list"] as const,
  list: (query: MediaListQuery) =>
    [
      ...mediaQueryKeys.lists(),
      query.branchId ?? "",
      query.search ?? "",
      query.mediaType ?? "",
      query.page ?? 1,
      query.pageSize ?? 24,
    ] as const,
};

export function useMediaLibraryQuery(query: MediaListQuery) {
  const queryResult = useQuery({
    queryKey: mediaQueryKeys.list(query),
    queryFn: () => mediaClientService.fetchMediaAssets(query),
    enabled: Boolean(query.branchId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!queryResult.data) return;
    mediaStore.hydrateList(queryResult.data, {
      search: query.search,
      mediaType: query.mediaType,
    });
  }, [query.mediaType, query.search, queryResult.data]);

  return queryResult;
}

export function useUploadMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      file,
      mediaType,
    }: {
      branchId?: string | null;
      file: File;
      mediaType?: MediaAssetType;
    }) => mediaClientService.uploadMediaFile({ branchId, file, mediaType }),
    onSuccess: async (payload) => {
      mediaStore.upsertAsset(payload.asset);
      mediaStore.setUsage(payload.usage);
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
    },
  });
}

export function useDeleteMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaAssetId: string) => mediaClientService.deleteMediaAsset(mediaAssetId),
    onSuccess: async (payload, mediaAssetId) => {
      mediaStore.removeAssetById(mediaAssetId);
      mediaStore.setUsage(payload.usage);
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
    },
  });
}
