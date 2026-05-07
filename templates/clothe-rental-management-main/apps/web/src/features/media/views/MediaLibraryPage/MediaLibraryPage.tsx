"use client";

import { observer } from "mobx-react-lite";
import { useRef } from "react";
import { FileImage, Film, Loader2, Search, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { DataTableShell } from "@/components/data-display/DataTableShell";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { FilterBarShell } from "@/components/filters/FilterBarShell";
import { useMediaLibraryPage } from "@/features/media/hooks/useMediaLibraryPage";
import type { MediaAssetDto } from "@/types/mediaLibrary";

interface MediaLibraryPageProps {
  locale: AppLocale;
}

function formatBytes(sizeBytes: number, locale: AppLocale): string {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    maximumFractionDigits: unitIndex >= 2 ? 2 : 0,
  });

  return `${formatter.format(value)} ${units[unitIndex] ?? "B"}`;
}

function formatDate(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getAssetDisplayName(asset: MediaAssetDto): string {
  if (asset.originalFileName?.trim()) return asset.originalFileName;
  const pathChunks = asset.storagePath.split("/");
  return pathChunks[pathChunks.length - 1] ?? asset.storagePath;
}

export const MediaLibraryPage = observer(function MediaLibraryPage({ locale }: MediaLibraryPageProps) {
  const {
    copy,
    currentBranchId,
    canAccessMedia,
    query,
    uploadMutation,
    deleteMutation,
    searchInput,
    setSearchInput,
    mediaTypeFilter,
    setMediaTypeFilter,
    page,
    setPage,
    totalPages,
    items,
    usage,
    uploadProgress,
    uploadFiles,
    deleteMediaAsset,
    mapErrorToMessage,
  } = useMediaLibraryPage(locale);

  const { confirm } = useAppModal();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadFromInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      await uploadFiles(Array.from(files));
      toast.success(copy.uploadSuccess);
    } catch (error) {
      toast.error(mapErrorToMessage(error));
    }
  };

  const usagePercent = Math.min(100, Math.max(0, Math.round(usage.usageRatio * 100)));
  const uploadPercent =
    uploadProgress.totalFiles > 0
      ? Math.round((uploadProgress.completedFiles / uploadProgress.totalFiles) * 100)
      : 0;
  const isUploading = uploadProgress.isUploading && uploadProgress.totalFiles > 0;

  if (!canAccessMedia) {
    return (
      <section className="animate-fade-in rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.noPermission}</p>
      </section>
    );
  }

  if (!currentBranchId) {
    return (
      <section className="animate-fade-in rounded-3xl border border-destructive/40 bg-destructive/5 p-6 shadow-md">
        <p className="text-sm text-destructive">{copy.noBranchContext}</p>
      </section>
    );
  }

  return (
    <section className="animate-fade-in space-y-5">
      <header className="rounded-3xl border border-border bg-card p-5 shadow-md md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="min-w-[15rem] space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={async (event) => {
                await handleUploadFromInput(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploadMutation.isPending || isUploading || usage.isFull}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
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
      </header>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">{copy.quotaTitle}</h2>
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${usage.isFull ? "bg-destructive" : usage.warning ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-4">
            <p>
              {copy.quotaLimit}: <span className="font-semibold text-foreground">{formatBytes(usage.limitBytes, locale)}</span>
            </p>
            <p>
              {copy.quotaUsed}: <span className="font-semibold text-foreground">{formatBytes(usage.usedBytes, locale)}</span>
            </p>
            <p>
              {copy.quotaReserved}: <span className="font-semibold text-foreground">{formatBytes(usage.reservedBytes, locale)}</span>
            </p>
            <p>
              {copy.quotaRemaining}: <span className="font-semibold text-foreground">{formatBytes(usage.remainingBytes, locale)}</span>
            </p>
          </div>
          {usage.isFull ? (
            <p className="text-xs font-semibold text-destructive">{copy.quotaFull}</p>
          ) : usage.warning ? (
            <p className="text-xs font-semibold text-amber-600">{copy.quotaWarning}</p>
          ) : null}
        </div>
      </section>

      <FilterBarShell locale={locale} className="rounded-2xl shadow-sm">
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
          <span>{copy.typeFilterLabel}</span>
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
      </FilterBarShell>

      <DataTableShell
        locale={locale}
        title={copy.title}
        columns={[
          { key: "file", header: copy.tableFile },
          { key: "type", header: copy.tableType },
          { key: "size", header: copy.tableSize },
          { key: "uploadedAt", header: copy.tableUploadedAt },
          { key: "actions", header: copy.tableActions },
        ]}
        isLoading={query.isFetching && items.length === 0}
        isEmpty={!query.isFetching && items.length === 0}
        loadingState={copy.loading}
        emptyState={copy.empty}
        className="rounded-3xl shadow-md"
        pagination={
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setPage((previous) => Math.max(previous - 1, 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.prevPage}
            </button>
            <span>
              {copy.pageLabel} {page}/{totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((previous) => Math.min(previous + 1, totalPages))}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-2.5 py-1.5 disabled:opacity-50"
            >
              {copy.nextPage}
            </button>
          </div>
        }
      >
        {items.map((asset) => {
          const isImage = asset.mediaType === "image";
          return (
            <tr key={asset.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {isImage ? (
                      <img
                        src={asset.publicUrl}
                        alt={getAssetDisplayName(asset)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Film className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">{getAssetDisplayName(asset)}</p>
                    <p className="max-w-[26rem] truncate font-mono text-[11px] text-muted-foreground">
                      {asset.storagePath}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]">
                  {isImage ? <FileImage className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                  {isImage ? copy.typeImage : copy.typeVideo}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatBytes(asset.sizeBytes, locale)}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(asset.createdAt, locale)}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    const accepted = await confirm({
                      title: copy.deleteConfirmTitle,
                      description: copy.deleteConfirmDesc,
                      tone: "danger",
                      confirmText: copy.deleteAction,
                      cancelText: locale === "vi" ? "Hủy" : "Cancel",
                    });
                    if (!accepted) return;

                    try {
                      await deleteMediaAsset(asset.id);
                      toast.success(copy.deleteSuccess);
                    } catch (error) {
                      toast.error(mapErrorToMessage(error) || copy.deleteFailed);
                    }
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/50 px-2.5 text-xs text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {copy.deleteAction}
                </button>
              </td>
            </tr>
          );
        })}
      </DataTableShell>
    </section>
  );
});
