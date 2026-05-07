"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileImage, Film, Loader2, Search, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { useMediaPickerModal } from "@/features/media/hooks/useMediaPickerModal";
import type { MediaAssetDto, MediaAssetType } from "@/types/mediaLibrary";

type MediaPickerSelectionMode = "single" | "multiple";

interface MediaPickerModalProps {
  locale: AppLocale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
  defaultMediaType?: MediaAssetType | null;
  selectionMode?: MediaPickerSelectionMode;
  onSelectAsset?: (asset: MediaAssetDto) => void;
  onSelectAssets?: (assets: MediaAssetDto[]) => void;
}

function formatBytes(sizeBytes: number, locale: AppLocale): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: unitIndex >= 2 ? 2 : 0,
  }).format(value)} ${units[unitIndex] ?? "B"}`;
}

function getDisplayName(asset: MediaAssetDto): string {
  if (asset.originalFileName?.trim()) return asset.originalFileName;
  const chunks = asset.storagePath.split("/");
  return chunks[chunks.length - 1] ?? asset.storagePath;
}

export function MediaPickerModal({
  locale,
  open,
  onOpenChange,
  branchId,
  defaultMediaType,
  selectionMode = "single",
  onSelectAsset,
  onSelectAssets,
}: MediaPickerModalProps) {
  const {
    copy,
    query,
    uploadMutation,
    searchInput,
    setSearchInput,
    mediaTypeFilter,
    setMediaTypeFilter,
    setDefaultMediaType,
    page,
    setPage,
    totalPages,
    items,
    usage,
    uploadProgress,
    uploadFiles,
    mapErrorToMessage,
  } = useMediaPickerModal({
    locale,
    branchId,
    defaultMediaType,
    enabled: open,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<MediaAssetDto[]>([]);
  const isMultiSelect = selectionMode === "multiple";
  const selectedAssetIds = useMemo(
    () => new Set(selectedAssets.map((entry) => entry.id)),
    [selectedAssets]
  );

  useEffect(() => {
    if (!open) return;
    setDefaultMediaType(defaultMediaType);
  }, [defaultMediaType, open, setDefaultMediaType]);

  useEffect(() => {
    if (open) return;
    setSelectedAssets([]);
  }, [open]);

  const uploadPercent =
    uploadProgress.totalFiles > 0
      ? Math.round((uploadProgress.completedFiles / uploadProgress.totalFiles) * 100)
      : 0;
  const isUploading = uploadProgress.isUploading && uploadProgress.totalFiles > 0;
  const selectedCount = selectedAssets.length;

  const toggleSelectedAsset = (asset: MediaAssetDto) => {
    setSelectedAssets((previous) => {
      const selectedIndex = previous.findIndex((entry) => entry.id === asset.id);
      if (selectedIndex >= 0) {
        return previous.filter((entry) => entry.id !== asset.id);
      }

      return [...previous, asset];
    });
  };

  const handleSingleSelect = (asset: MediaAssetDto) => {
    onSelectAsset?.(asset);
    if (!onSelectAsset && onSelectAssets) {
      onSelectAssets([asset]);
    }
    onOpenChange(false);
  };

  const handleConfirmMultiSelect = () => {
    if (selectedAssets.length === 0) return;

    if (onSelectAssets) {
      onSelectAssets(selectedAssets);
    } else if (onSelectAsset) {
      for (const asset of selectedAssets) {
        onSelectAsset(asset);
      }
    }

    onOpenChange(false);
  };

  return (
    <DrawerFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={copy.title}
      description={copy.description}
      widthClassName="max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isMultiSelect ? (
            <p className="mr-auto text-xs text-muted-foreground">
              {copy.selectedCountLabel}: {selectedCount}
            </p>
          ) : null}
          {isMultiSelect ? (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleConfirmMultiSelect}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition disabled:opacity-60"
            >
              {copy.confirmSelectionAction}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent"
          >
            {copy.closeAction}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setPage(1);
                setSearchInput(event.target.value);
              }}
              placeholder={copy.searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
            />
          </div>

          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-xs text-muted-foreground">
            <select
              value={mediaTypeFilter}
              onChange={(event) => {
                setPage(1);
                setMediaTypeFilter(event.target.value as typeof mediaTypeFilter);
              }}
              className="bg-transparent text-xs outline-none"
            >
              <option value="all">{copy.typeAll}</option>
              <option value="image">{copy.typeImage}</option>
              <option value="video">{copy.typeVideo}</option>
            </select>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={async (event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              if (files.length === 0) return;

              try {
                await uploadFiles(files);
                toast.success(copy.uploadAction);
              } catch (error) {
                toast.error(mapErrorToMessage(error));
              } finally {
                event.currentTarget.value = "";
              }
            }}
          />
          <div className="min-w-[14rem] space-y-1">
            <button
              type="button"
              disabled={uploadMutation.isPending || isUploading || usage.isFull}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {isUploading
                ? `${copy.uploadingAction} ${uploadProgress.completedFiles}/${uploadProgress.totalFiles}`
                : copy.uploadAction}
            </button>
            {isUploading ? (
              <div className="space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, uploadPercent))}%` }}
                  />
                </div>
                <p className="truncate text-[11px] text-muted-foreground" title={uploadProgress.currentFileName ?? ""}>
                  {uploadProgress.currentFileName}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {branchId ? null : (
          <p className="text-xs text-destructive">{copy.noBranchContext}</p>
        )}
        {usage.isFull ? (
          <p className="text-xs font-semibold text-destructive">{copy.quotaFull}</p>
        ) : null}

        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">{locale === "vi" ? "Đang tải media..." : "Loading media..."}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((asset) => {
            const isImage = asset.mediaType === "image";
            const isSelected = selectedAssetIds.has(asset.id);

            return (
              <article
                key={asset.id}
                className={`space-y-2 rounded-xl border p-2.5 ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                  {isImage ? (
                    <img
                      src={asset.publicUrl}
                      alt={getDisplayName(asset)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Film className="h-5 w-5" />
                      <span className="text-[11px]">{copy.typeVideo}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="truncate text-xs font-medium text-foreground" title={getDisplayName(asset)}>
                    {getDisplayName(asset)}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground" title={asset.storagePath}>
                    {asset.storagePath}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isImage ? <FileImage className="mr-1 inline h-3 w-3" /> : <Film className="mr-1 inline h-3 w-3" />}
                    {isImage ? copy.typeImage : copy.typeVideo} • {formatBytes(asset.sizeBytes, locale)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isMultiSelect) {
                      toggleSelectedAsset(asset);
                      return;
                    }
                    handleSingleSelect(asset);
                  }}
                  className={`inline-flex h-8 w-full items-center justify-center rounded-lg px-3 text-xs font-semibold ${
                    isMultiSelect
                      ? isSelected
                        ? "border border-primary bg-primary/10 text-primary"
                        : "border border-border bg-background text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isMultiSelect ? (isSelected ? copy.selectedAction : copy.selectAction) : copy.selectAction}
                </button>
              </article>
            );
          })}
        </div>

        {!query.isLoading && items.length === 0 ? (
          <p className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {copy.empty}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
            disabled={page <= 1 || query.isFetching}
            className="rounded-lg border border-border px-2.5 py-1.5 transition hover:bg-accent disabled:opacity-50"
          >
            {copy.prevPage}
          </button>
          <span>
            {copy.pageLabel} {page}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
            disabled={page >= totalPages || query.isFetching}
            className="rounded-lg border border-border px-2.5 py-1.5 transition hover:bg-accent disabled:opacity-50"
          >
            {copy.nextPage}
          </button>
        </div>
      </div>
    </DrawerFormShell>
  );
}
