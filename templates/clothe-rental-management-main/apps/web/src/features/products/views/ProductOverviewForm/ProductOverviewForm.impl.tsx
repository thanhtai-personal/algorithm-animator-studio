"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AppLocale } from "@/constants/locale";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { RichTextEditor } from "@/components/forms/RichTextEditor";
import { VoiceDictationField } from "@/components/voice/VoiceDictationField";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { productsClientService } from "@/features/products/services/productsClientService";
import type { ProductOverviewFormDraft } from "@/features/products/types/productOverviewForm";
import type { ProductCategoryDto, ProductGender, ProductTagDto } from "@/types/productsCatalog";
import { parseNonNegativeMoney } from "@/utils/format/money";

interface ProductOverviewFormLabels {
  productCode: string;
  name: string;
  category: string;
  gender: string;
  material: string;
  description: string;
  rentPricePerDay: string;
  quickRentPrice: string;
  rentDepositAmount: string;
  salePrice: string;
  purchasePrice: string;
  isRentable: string;
  isSaleable: string;
  tags: string;
  active: string;
  coverImage: string;
  galleryImages: string;
  videos: string;
}

interface GalleryPreviewItem {
  id: string;
  url: string;
}

interface PreviewImageState {
  url: string;
  alt: string;
}

type MediaPickerTarget = "cover" | "gallery" | "video";

interface ProductOverviewFormProps {
  locale: AppLocale;
  draft: ProductOverviewFormDraft;
  setDraft: Dispatch<SetStateAction<ProductOverviewFormDraft>>;
  labels: ProductOverviewFormLabels;
  categories: ProductCategoryDto[];
  tags: ProductTagDto[];
  genderOptions: Array<{ value: ProductGender; label: string }>;
  canEditPricing: boolean;
  allCategoriesLabel?: string;
  mediaUrlHint?: string;
  regenerateCodeLabel?: string;
  onRegenerateCode?: () => void;
  productCodeReadOnly?: boolean;
  successfulRentCountLabel?: string;
  successfulRentCount?: number;
  branchId?: string | null;
  layoutMode?: "single" | "twoColumn";
}

function parseMultilineMediaUrls(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolveMediaPreviewUrl(value: string): string {
  return productsClientService.resolveCoverImageUrl(value) ?? value;
}

function parseDraftMoneyValue(value: string): number | null {
  const parsed = parseNonNegativeMoney(value);
  return parsed.error ? null : parsed.value;
}

function appendMediaUrlLine(current: string, url: string): string {
  return appendMediaUrlLines(current, [url]);
}

function appendMediaUrlLines(current: string, urls: string[]): string {
  if (urls.length === 0) return current;

  const entries = parseMultilineMediaUrls(current);
  const seen = new Set(entries.map((entry) => entry.toLowerCase()));
  let hasChange = false;

  for (const rawUrl of urls) {
    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) continue;

    const normalizedUrl = trimmedUrl.toLowerCase();
    if (seen.has(normalizedUrl)) continue;
    seen.add(normalizedUrl);
    entries.push(trimmedUrl);
    hasChange = true;
  }

  if (!hasChange) return current;
  return entries.join("\n");
}

function stringifyDraftMoneyValue(value: number | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function ProductOverviewForm({
  locale,
  draft,
  setDraft,
  labels,
  categories,
  tags,
  genderOptions,
  canEditPricing,
  allCategoriesLabel,
  mediaUrlHint,
  regenerateCodeLabel,
  onRegenerateCode,
  productCodeReadOnly = false,
  successfulRentCountLabel,
  successfulRentCount,
  branchId = null,
  layoutMode = "single",
}: ProductOverviewFormProps) {
  const [previewImage, setPreviewImage] = useState<PreviewImageState | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<MediaPickerTarget | null>(null);

  const resolvedAllCategories = allCategoriesLabel ?? (locale === "vi" ? "Tất cả danh mục" : "All categories");
  const resolvedMediaUrlHint =
    mediaUrlHint ?? (locale === "vi" ? "Mỗi dòng một URL." : "One URL per line.");
  const chooseMediaLabel = locale === "vi" ? "Chọn từ thư viện" : "Choose from library";
  const missingBranchHint =
    locale === "vi" ? "Cần chọn chi nhánh trước khi mở thư viện media." : "Select a branch before opening media library.";
  const sectionCopy =
    locale === "vi"
      ? {
          coreTitle: "Thông tin cốt lõi",
          coreHint: "Mã, tên và phân loại sản phẩm.",
          pricingTitle: "Giá và vận hành",
          pricingHint: "Thiết lập giá và trạng thái kinh doanh.",
          contentTitle: "Mô tả và gắn thẻ",
          contentHint: "Bổ sung thông tin để tìm kiếm và quản lý tốt hơn.",
          mediaTitle: "Hình ảnh và video",
          mediaHint: "Thêm media để hiển thị đẹp hơn trên danh sách và chi tiết.",
        }
      : {
          coreTitle: "Core Information",
          coreHint: "Set product identity and classification first.",
          pricingTitle: "Pricing and Operations",
          pricingHint: "Configure prices and selling/renting flags.",
          contentTitle: "Description and Tags",
          contentHint: "Add searchable content and management tags.",
          mediaTitle: "Images and Videos",
          mediaHint: "Attach media for list and detail presentation.",
        };

  const coverPreviewUrl = useMemo(() => {
    const rawUrl = draft.coverImageUrl.trim();
    if (!rawUrl) return null;
    return resolveMediaPreviewUrl(rawUrl);
  }, [draft.coverImageUrl]);

  const galleryPreviewItems = useMemo<GalleryPreviewItem[]>(() => {
    const items: GalleryPreviewItem[] = [];
    const urlEntries = parseMultilineMediaUrls(draft.galleryImageUrlsText);
    for (const [index, entry] of urlEntries.entries()) {
      const resolvedUrl = resolveMediaPreviewUrl(entry);
      items.push({
        id: `url-${index}-${resolvedUrl}`,
        url: resolvedUrl,
      });
    }

    return items;
  }, [draft.galleryImageUrlsText]);

  const isTwoColumnLayout = layoutMode === "twoColumn";
  const formLayoutClassName = isTwoColumnLayout
    ? "grid gap-4 lg:grid-cols-2 lg:items-start"
    : "space-y-4";
  const sectionClassName = "space-y-3 rounded-2xl border border-border/70 bg-card/30 p-3 sm:p-4";

  return (
    <div className={formLayoutClassName}>
      <section className={sectionClassName}>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{sectionCopy.coreTitle}</h3>
          <p className="text-xs text-muted-foreground">{sectionCopy.coreHint}</p>
        </div>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {labels.productCode}
          </span>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={draft.productCode}
              disabled={productCodeReadOnly}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  productCode: event.target.value.toUpperCase(),
                }))
              }
              className={`h-10 w-full min-w-0 rounded-lg border border-border px-3 text-sm ${
                productCodeReadOnly ? "bg-muted text-muted-foreground" : "bg-background"
              }`}
            />
            {regenerateCodeLabel && onRegenerateCode ? (
              <button
                type="button"
                onClick={onRegenerateCode}
                className="h-10 w-full rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground sm:w-auto sm:shrink-0"
              >
                {regenerateCodeLabel}
              </button>
            ) : null}
          </div>
        </label>

        <VoiceDictationField
          locale={locale}
          label={labels.name}
          fieldType="input"
          value={draft.name}
          onValueChange={(value) =>
            setDraft((previous) => ({
              ...previous,
              name: value,
            }))
          }
          language={locale === "vi" ? "vi-VN" : "en-US"}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.category}
            </span>
            <select
              value={draft.productCategoryId}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  productCategoryId: event.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">{resolvedAllCategories}</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.gender}
            </span>
            <select
              value={draft.gender}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  gender: event.target.value as typeof previous.gender,
                }))
              }
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">-</option>
              {genderOptions.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{sectionCopy.pricingTitle}</h3>
          <p className="text-xs text-muted-foreground">{sectionCopy.pricingHint}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput
            value={parseDraftMoneyValue(draft.rentPricePerDay)}
            onValueChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                rentPricePerDay: stringifyDraftMoneyValue(value),
              }))
            }
            locale={locale}
            currency="VND"
            label={labels.rentPricePerDay}
            showPreview={false}
          />

          <MoneyInput
            value={parseDraftMoneyValue(draft.quickRentPrice)}
            onValueChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                quickRentPrice: stringifyDraftMoneyValue(value),
              }))
            }
            locale={locale}
            currency="VND"
            label={labels.quickRentPrice}
            showPreview={false}
          />

          <MoneyInput
            value={parseDraftMoneyValue(draft.rentDepositAmount)}
            onValueChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                rentDepositAmount: stringifyDraftMoneyValue(value),
              }))
            }
            locale={locale}
            currency="VND"
            label={labels.rentDepositAmount}
            showPreview={false}
          />

          <MoneyInput
            value={parseDraftMoneyValue(draft.salePrice)}
            onValueChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                salePrice: stringifyDraftMoneyValue(value),
              }))
            }
            locale={locale}
            currency="VND"
            label={labels.salePrice}
            showPreview={false}
          />

          {canEditPricing ? (
            <MoneyInput
              value={parseDraftMoneyValue(draft.purchasePrice)}
              onValueChange={(value) =>
                setDraft((previous) => ({
                  ...previous,
                  purchasePrice: stringifyDraftMoneyValue(value),
                }))
              }
              locale={locale}
              currency="VND"
              label={labels.purchasePrice}
              showPreview={false}
              className="md:col-span-2"
            />
          ) : null}
        </div>

        {successfulRentCountLabel && typeof successfulRentCount === "number" ? (
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {successfulRentCountLabel}
            </span>
            <input
              type="text"
              value={String(successfulRentCount)}
              disabled
              className="h-10 w-full rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
            />
          </label>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.isRentable}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  isRentable: event.target.checked,
                }))
              }
            />
            {labels.isRentable}
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.isSaleable}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  isSaleable: event.target.checked,
                }))
              }
            />
            {labels.isSaleable}
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
            />
            {labels.active}
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{sectionCopy.contentTitle}</h3>
          <p className="text-xs text-muted-foreground">{sectionCopy.contentHint}</p>
        </div>

        <VoiceDictationField
          locale={locale}
          label={labels.material}
          fieldType="input"
          value={draft.material}
          onValueChange={(value) =>
            setDraft((previous) => ({
              ...previous,
              material: value,
            }))
          }
          language={locale === "vi" ? "vi-VN" : "en-US"}
        />

        <RichTextEditor
          label={labels.description}
          value={draft.description}
          onValueChange={(value) =>
            setDraft((previous) => ({
              ...previous,
              description: value,
            }))
          }
          placeholder={locale === "vi" ? "Nhập mô tả sản phẩm..." : "Enter product description..."}
        />

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.tags}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((entry) => {
              const checked = draft.tagIds.includes(entry.id);
              return (
                <label
                  key={entry.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                    checked ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setDraft((previous) => {
                        if (previous.tagIds.includes(entry.id)) {
                          return {
                            ...previous,
                            tagIds: previous.tagIds.filter((tagId) => tagId !== entry.id),
                          };
                        }

                        return {
                          ...previous,
                          tagIds: [...previous.tagIds, entry.id],
                        };
                      })
                    }
                  />
                  {entry.name}
                </label>
              );
            })}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{sectionCopy.mediaTitle}</h3>
          <p className="text-xs text-muted-foreground">{sectionCopy.mediaHint}</p>
        </div>

        <div className="space-y-2 rounded-xl border border-border/70 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.coverImage}
            </p>
            <button
              type="button"
              disabled={!branchId}
              onClick={() => setMediaPickerTarget("cover")}
              title={!branchId ? missingBranchHint : undefined}
              className="min-h-8 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chooseMediaLabel}
            </button>
          </div>
          <input
            type="url"
            value={draft.coverImageUrl}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                coverImageUrl: event.target.value,
              }))
            }
            placeholder="https://..."
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
          {coverPreviewUrl ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                {locale === "vi" ? "Xem trước" : "Preview"}
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-md border border-border/60 bg-muted/20 p-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage({
                      url: coverPreviewUrl,
                      alt: locale === "vi" ? "Ảnh đại diện xem trước" : "Cover preview",
                    })
                  }
                  className="relative aspect-square overflow-hidden rounded-md border border-border/70 bg-muted transition hover:border-primary/60"
                >
                  <img
                    src={coverPreviewUrl}
                    alt={locale === "vi" ? "Ảnh đại diện xem trước" : "Cover preview"}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-border/70 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.galleryImages}
            </p>
            <button
              type="button"
              disabled={!branchId}
              onClick={() => setMediaPickerTarget("gallery")}
              title={!branchId ? missingBranchHint : undefined}
              className="min-h-8 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chooseMediaLabel}
            </button>
          </div>
          <textarea
            rows={3}
            value={draft.galleryImageUrlsText}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                galleryImageUrlsText: event.target.value,
              }))
            }
            placeholder={"https://image-1...\nhttps://image-2..."}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">{resolvedMediaUrlHint}</p>
          {galleryPreviewItems.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                {locale === "vi" ? "Thumbnail" : "Thumbnails"}
              </p>
              <div className="grid max-h-56 grid-cols-2 gap-2 overflow-auto rounded-md border border-border/60 bg-muted/20 p-2 sm:grid-cols-3">
                {galleryPreviewItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        url: item.url,
                        alt: locale === "vi" ? `Ảnh bổ sung ${index + 1}` : `Gallery image ${index + 1}`,
                      })
                    }
                    className="relative aspect-square overflow-hidden rounded-md border border-border/70 bg-muted"
                  >
                    <img
                      src={item.url}
                      alt={locale === "vi" ? `Ảnh bổ sung ${index + 1}` : `Gallery image ${index + 1}`}
                      className="h-full w-full object-contain p-1"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-2 rounded-xl border border-border/70 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {labels.videos}
            </p>
            <button
              type="button"
              disabled={!branchId}
              onClick={() => setMediaPickerTarget("video")}
              title={!branchId ? missingBranchHint : undefined}
              className="min-h-8 rounded-lg border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chooseMediaLabel}
            </button>
          </div>
          <textarea
            rows={3}
            value={draft.videoUrlsText}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                videoUrlsText: event.target.value,
              }))
            }
            placeholder="https://video-1..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">{resolvedMediaUrlHint}</p>
        </div>
      </section>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "vi" ? "Xem trước ảnh" : "Image preview"}
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex h-full w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-2 top-2 z-10 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold text-foreground"
            >
              {locale === "vi" ? "Đóng" : "Close"}
            </button>
            <div className="relative h-full max-h-[85vh] w-full">
              <img
                src={previewImage.url}
                alt={previewImage.alt}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}

      <MediaPickerModal
        locale={locale}
        open={Boolean(mediaPickerTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMediaPickerTarget(null);
          }
        }}
        branchId={branchId}
        defaultMediaType={mediaPickerTarget === "video" ? "video" : "image"}
        selectionMode={
          mediaPickerTarget === "gallery" || mediaPickerTarget === "video"
            ? "multiple"
            : "single"
        }
        onSelectAsset={(asset) => {
          const selectedUrl = asset.publicUrl;
          if (!selectedUrl) return;

          if (mediaPickerTarget === "cover") {
            setDraft((previous) => ({
              ...previous,
              coverImageUrl: selectedUrl,
            }));
            return;
          }

          if (mediaPickerTarget === "gallery") {
            setDraft((previous) => ({
              ...previous,
              galleryImageUrlsText: appendMediaUrlLine(previous.galleryImageUrlsText, selectedUrl),
            }));
            return;
          }

          if (mediaPickerTarget === "video") {
            setDraft((previous) => ({
              ...previous,
              videoUrlsText: appendMediaUrlLine(previous.videoUrlsText, selectedUrl),
            }));
          }
        }}
        onSelectAssets={(assets) => {
          const selectedUrls = assets
            .map((asset) => asset.publicUrl?.trim() ?? "")
            .filter((entry) => entry.length > 0);
          if (selectedUrls.length === 0) return;

          if (mediaPickerTarget === "gallery") {
            setDraft((previous) => ({
              ...previous,
              galleryImageUrlsText: appendMediaUrlLines(
                previous.galleryImageUrlsText,
                selectedUrls
              ),
            }));
            return;
          }

          if (mediaPickerTarget === "video") {
            setDraft((previous) => ({
              ...previous,
              videoUrlsText: appendMediaUrlLines(previous.videoUrlsText, selectedUrls),
            }));
            return;
          }

          if (mediaPickerTarget === "cover") {
            const firstUrl = selectedUrls[0];
            if (!firstUrl) return;
            setDraft((previous) => ({
              ...previous,
              coverImageUrl: firstUrl,
            }));
          }
        }}
      />
    </div>
  );
}
