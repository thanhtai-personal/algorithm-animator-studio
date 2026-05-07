"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { DrawerFormShell } from "@/components/layout/DrawerFormShell";
import { ProductLandingTemplateRenderer } from "@/features/product-landing/components/ProductLandingTemplateRenderer";
import { MediaPickerModal } from "@/features/media/components/MediaPickerModal";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import {
  parseFooterLinkListValue,
  serializeFooterLinkList,
  type FooterLinkEntry,
} from "@/lib/footerLinkEntries";
import type { SettingLocale } from "@/types/settingsModule";
import type { SettingsShowroomVisualEditorModel } from "@/features/settings/hooks/useSettingsShowroomVisualEditor";

interface SettingsShowroomVisualEditorProps {
  locale: AppLocale;
  pageLocale: SettingLocale;
  branchId: string | null;
  isSaving: boolean;
  model: SettingsShowroomVisualEditorModel;
}

const COPY = {
  vi: {
    previewTitle: "Visual editor (in-place)",
    previewHint:
      "Click icon bút chì trực tiếp trên preview để mở drawer chỉnh đúng vị trí.",
    nodeListTitle: "Vị trí có thể chỉnh sửa",
    nodeListHint: "Chọn nhanh vị trí cần edit",
    currentValueLabel: "Giá trị hiện tại",
    localeEditingLabel: "Đang chỉnh locale",
    imageUrlLabel: "URL hình ảnh",
    chooseImageLabel: "Chọn từ thư viện media",
    imagePreviewLabel: "Xem trước",
    productSearchLabel: "Tìm sản phẩm",
    productSearchPlaceholder: "Tìm theo mã, tên sản phẩm hoặc danh mục...",
    featuredHint: "Tick để chọn/bỏ chọn sản phẩm featured trong preview.",
    socialLinksHint:
      "Cập nhật link Facebook/TikTok/Zalo/Telegram, icon trên preview sẽ đổi realtime.",
    socialFacebookLabel: "Link Facebook",
    socialTiktokLabel: "Link TikTok",
    socialZaloLabel: "Link Zalo",
    socialTelegramLabel: "Link Telegram",
    textListInputLabel: "Danh sách nội dung",
    textListHint: "Mỗi item gồm label + link, preview sẽ cập nhật ngay.",
    textListLabelField: "Label hiển thị",
    textListLinkField: "Link đích",
    textListLinkPlaceholder: "https://...",
    textListAddItem: "Thêm item",
    textListRemoveItem: "Xóa",
    contactInfoHint:
      "Cập nhật hotline, email và địa chỉ footer. Preview sẽ cập nhật ngay.",
    contactHotlineField: "Hotline",
    contactEmailField: "Email",
    contactAddressField: "Địa chỉ",
    noProductsLabel: "Không có sản phẩm phù hợp.",
    heroProductPickerHint:
      "Chọn 1 sản phẩm tiêu biểu cho hero. Hệ thống tự lấy ảnh chính, tên và giá thuê.",
    heroProductSelectedLabel: "Sản phẩm đang áp dụng",
    heroProductNotSelected: "Chưa chọn sản phẩm.",
    noImageLabel: "Chưa có ảnh",
    noRentPriceLabel: "Chưa có giá thuê",
    chooseProductLabel: "Chọn sản phẩm",
    paginationPrevLabel: "Trước",
    paginationNextLabel: "Sau",
    paginationPageLabel: "Trang",
    paginationOfLabel: "trên",
    paginationTotalProductsLabel: "sản phẩm",
    closeLabel: "Đóng",
    drawerTitleFallback: "Chỉnh sửa nội dung",
    drawerDescriptionFallback:
      "Nội dung cập nhật realtime trên preview, dùng nút Lưu bên dưới để lưu cấu hình.",
    textInputLabel: "Nội dung",
  },
  en: {
    previewTitle: "Visual editor (in-place)",
    previewHint:
      "Click the pencil icon directly on the preview to open the right drawer and edit at that position.",
    nodeListTitle: "Editable slots",
    nodeListHint: "Quick select editable target",
    currentValueLabel: "Current value",
    localeEditingLabel: "Editing locale",
    imageUrlLabel: "Image URL",
    chooseImageLabel: "Choose from media library",
    imagePreviewLabel: "Preview",
    productSearchLabel: "Search products",
    productSearchPlaceholder: "Search by code, name, or category...",
    featuredHint: "Tick to include/exclude featured products in the preview.",
    socialLinksHint:
      "Update Facebook/TikTok/Zalo/Telegram URLs; icons in preview change in realtime.",
    socialFacebookLabel: "Facebook URL",
    socialTiktokLabel: "TikTok URL",
    socialZaloLabel: "Zalo URL",
    socialTelegramLabel: "Telegram URL",
    textListInputLabel: "List content",
    textListHint: "Each item has a label + link. Preview updates instantly.",
    textListLabelField: "Label",
    textListLinkField: "Link",
    textListLinkPlaceholder: "https://...",
    textListAddItem: "Add item",
    textListRemoveItem: "Remove",
    contactInfoHint:
      "Update footer hotline, email, and address. Preview updates instantly.",
    contactHotlineField: "Hotline",
    contactEmailField: "Email",
    contactAddressField: "Address",
    noProductsLabel: "No matching products.",
    heroProductPickerHint:
      "Pick one hero product. The hero card will auto-use the product main image, name, and rental price.",
    heroProductSelectedLabel: "Current hero product",
    heroProductNotSelected: "No product selected.",
    noImageLabel: "No image",
    noRentPriceLabel: "No rent price",
    chooseProductLabel: "Select product",
    paginationPrevLabel: "Prev",
    paginationNextLabel: "Next",
    paginationPageLabel: "Page",
    paginationOfLabel: "of",
    paginationTotalProductsLabel: "products",
    closeLabel: "Close",
    drawerTitleFallback: "Edit content",
    drawerDescriptionFallback:
      "Changes update preview in realtime. Use Save below to persist configuration.",
    textInputLabel: "Content",
  },
} as const;

const PRODUCT_PICKER_PAGE_SIZE = 12;

interface SlotAnchorPosition {
  topPercent: number;
  leftPercent: number;
}

interface CommonListFormProps {
  addItemLabel: string;
  allowAddRemove?: boolean;
  disabled: boolean;
  entries: FooterLinkEntry[];
  hint: string;
  linkFieldLabel: string;
  linkPlaceholder: string;
  onCommit: (entries: FooterLinkEntry[]) => void;
  removeItemLabel: string;
  rowValueLabels?: string[];
  setEntries: (entries: FooterLinkEntry[]) => void;
  showLinkField?: boolean;
  valueFieldLabel: string;
}

function formatRentPriceLabel(
  value: number | string | null | undefined,
  locale: SettingLocale,
): string {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    return locale === "vi" ? "Chưa có giá thuê" : "No rent price";
  }

  const formatLocale = locale === "vi" ? "vi-VN" : "en-US";
  const amount = new Intl.NumberFormat(formatLocale).format(Math.round(parsed));
  return locale === "vi" ? `${amount}đ / ngày` : `${amount} VND / day`;
}

function CommonListForm({
  addItemLabel,
  allowAddRemove = true,
  disabled,
  entries,
  hint,
  linkFieldLabel,
  linkPlaceholder,
  onCommit,
  removeItemLabel,
  rowValueLabels,
  setEntries,
  showLinkField = true,
  valueFieldLabel,
}: CommonListFormProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="max-h-[58vh] space-y-2 overflow-auto rounded-xl border border-border bg-background p-2">
        {entries.map((entry, index) => (
          <div key={`common-list-entry-${index}`} className="space-y-2 rounded-lg border border-border bg-card p-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{rowValueLabels?.[index] ?? valueFieldLabel}</span>
              <input
                type="text"
                disabled={disabled}
                value={entry.label}
                onChange={(event) => {
                  const nextEntries = [...entries];
                  nextEntries[index] = { ...nextEntries[index], label: event.target.value };
                  setEntries(nextEntries);
                }}
                onBlur={() => onCommit(entries)}
                onKeyDownCapture={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            {showLinkField ? (
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>{linkFieldLabel}</span>
                <input
                  type="url"
                  disabled={disabled}
                  value={entry.href ?? ""}
                  placeholder={linkPlaceholder}
                  onChange={(event) => {
                    const nextEntries = [...entries];
                    nextEntries[index] = {
                      ...nextEntries[index],
                      href: event.target.value || null,
                    };
                    setEntries(nextEntries);
                  }}
                  onBlur={() => onCommit(entries)}
                  onKeyDownCapture={(event) => event.stopPropagation()}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </label>
            ) : null}

            {allowAddRemove ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    const nextEntries = entries.filter((_, entryIndex) => entryIndex !== index);
                    setEntries(nextEntries);
                    onCommit(nextEntries);
                  }}
                  className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-60"
                >
                  {removeItemLabel}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {allowAddRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const nextEntries = [...entries, { label: "", href: null }];
            setEntries(nextEntries);
            onCommit(nextEntries);
          }}
          className="h-10 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:opacity-60"
        >
          {addItemLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SettingsShowroomVisualEditor({
  locale,
  pageLocale,
  branchId,
  isSaving,
  model,
}: SettingsShowroomVisualEditorProps) {
  const copy = COPY[locale];
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [productPickerPage, setProductPickerPage] = useState(1);
  const [slotAnchorPositions, setSlotAnchorPositions] = useState<
    Record<string, SlotAnchorPosition>
  >({});
  const previewViewportRef = useRef<HTMLDivElement | null>(null);
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const previewSceneRef = useRef<HTMLDivElement | null>(null);

  const selectedNode = model.selectedNode;
  const selectedNodeLabel = selectedNode
    ? selectedNode.label[locale]
    : copy.drawerTitleFallback;
  const selectedNodeDescription = selectedNode
    ? selectedNode.description[locale]
    : copy.drawerDescriptionFallback;
  const selectedNodeType = selectedNode?.type ?? null;
  const is3dHeroImageNode =
    selectedNode?.id === "3d.hero.image" && model.activeTemplateKind === "theme-3d";
  const selectedImagePreview = useMemo(() => {
    if (selectedNodeType !== "image" || is3dHeroImageNode) return null;
    const trimmed = model.selectedNodeValue.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, [is3dHeroImageNode, model.selectedNodeValue, selectedNodeType]);
  const textListEntries = useMemo(() => {
    if (selectedNodeType !== "textList") return [];
    return parseFooterLinkListValue(model.selectedNodeValue);
  }, [model.selectedNodeValue, selectedNodeType]);
  const contactEntries = useMemo<FooterLinkEntry[]>(
    () => [
      { label: model.contactInfoDraft.hotline, href: null },
      { label: model.contactInfoDraft.email, href: null },
      { label: model.contactInfoDraft.storeAddress, href: null },
    ],
    [
      model.contactInfoDraft.email,
      model.contactInfoDraft.hotline,
      model.contactInfoDraft.storeAddress,
    ]
  );

  const [localTextListEntries, setLocalTextListEntries] = useState<FooterLinkEntry[] | null>(
    null
  );
  const [localContactEntries, setLocalContactEntries] = useState<FooterLinkEntry[] | null>(null);
  const totalProductPages = useMemo(() => {
    if (model.filteredFeaturedProductOptions.length === 0) return 1;
    return Math.ceil(model.filteredFeaturedProductOptions.length / PRODUCT_PICKER_PAGE_SIZE);
  }, [model.filteredFeaturedProductOptions.length]);
  const productOptionsOnPage = useMemo(() => {
    const safePage = Math.max(1, Math.min(productPickerPage, totalProductPages));
    const start = (safePage - 1) * PRODUCT_PICKER_PAGE_SIZE;
    return model.filteredFeaturedProductOptions.slice(start, start + PRODUCT_PICKER_PAGE_SIZE);
  }, [model.filteredFeaturedProductOptions, productPickerPage, totalProductPages]);

  const resolvedTextListEntries = useMemo(() => {
    const source = localTextListEntries ?? textListEntries;
    return source.length > 0 ? source : [{ label: "", href: null }];
  }, [localTextListEntries, textListEntries]);
  const resolvedContactEntries = useMemo(() => {
    const source = localContactEntries ?? contactEntries;
    const normalized = [...source];
    while (normalized.length < 3) {
      normalized.push({ label: "", href: null });
    }
    return normalized.slice(0, 3);
  }, [contactEntries, localContactEntries]);

  useEffect(() => {
    if (selectedNode && selectedNode.type === "textList") {
      setLocalTextListEntries(parseFooterLinkListValue(model.selectedNodeValue));
      setLocalContactEntries(null);
    } else if (selectedNode && selectedNode.type === "contactInfo") {
      setLocalContactEntries(contactEntries);
      setLocalTextListEntries(null);
    } else {
      setLocalTextListEntries(null);
      setLocalContactEntries(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode?.id]);

  useEffect(() => {
    setProductPickerPage(1);
  }, [model.featuredSearch, selectedNode?.id]);

  useEffect(() => {
    if (productPickerPage <= totalProductPages) return;
    setProductPickerPage(totalProductPages);
  }, [productPickerPage, totalProductPages]);

  const recomputeSlotAnchors = useCallback(() => {
    const previewScene = previewSceneRef.current;
    if (!previewScene) {
      setSlotAnchorPositions({});
      return;
    }

    const contentRect = previewScene.getBoundingClientRect();
    if (contentRect.width <= 0 || contentRect.height <= 0) {
      setSlotAnchorPositions({});
      return;
    }

    const nextPositions: Record<string, SlotAnchorPosition> = {};
    for (const entry of model.visualNodes) {
      const selector = `[data-edit-slot="${entry.id.replace(/"/g, '\\"')}"]`;
      const anchorNode = previewScene.querySelector<HTMLElement>(selector);
      if (!anchorNode) continue;

      const anchorRect = anchorNode.getBoundingClientRect();
      const topRaw = ((anchorRect.top - contentRect.top + 8) / contentRect.height) * 100;
      const leftRaw = ((anchorRect.left - contentRect.left + 8) / contentRect.width) * 100;
      const topPercent = Math.max(1, Math.min(99, topRaw));
      const leftPercent = Math.max(1, Math.min(99, leftRaw));
      nextPositions[entry.id] = {
        topPercent,
        leftPercent,
      };
    }

    setSlotAnchorPositions((previous) => {
      const prevKeys = Object.keys(previous);
      const nextKeys = Object.keys(nextPositions);
      if (prevKeys.length !== nextKeys.length) return nextPositions;

      for (const key of nextKeys) {
        const prevEntry = previous[key];
        const nextEntry = nextPositions[key];
        if (!prevEntry || !nextEntry) return nextPositions;
        if (prevEntry.topPercent !== nextEntry.topPercent) return nextPositions;
        if (prevEntry.leftPercent !== nextEntry.leftPercent) return nextPositions;
      }

      return previous;
    });
  }, [model.visualNodes]);

  useEffect(() => {
    const previewViewport = previewViewportRef.current;
    const previewScene = previewSceneRef.current;
    if (!previewScene) return;

    let mounted = true;
    const runSafeRecompute = () => {
      if (!mounted) return;
      recomputeSlotAnchors();
    };

    const rafId = window.requestAnimationFrame(runSafeRecompute);
    const timeoutA = window.setTimeout(runSafeRecompute, 220);
    const timeoutB = window.setTimeout(runSafeRecompute, 720);

    if (previewViewport) {
      previewViewport.addEventListener("scroll", runSafeRecompute, { passive: true });
    }
    window.addEventListener("resize", runSafeRecompute);

    const resizeObserver = new ResizeObserver(runSafeRecompute);
    resizeObserver.observe(previewScene);
    if (previewViewport) {
      resizeObserver.observe(previewViewport);
    }

    const mutationObserver = new MutationObserver(runSafeRecompute);
    mutationObserver.observe(previewScene, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => {
      mounted = false;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      if (previewViewport) {
        previewViewport.removeEventListener("scroll", runSafeRecompute);
      }
      window.removeEventListener("resize", runSafeRecompute);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [model.visualNodes, pageLocale, recomputeSlotAnchors, selectedNodeType]);

  return (
    <>
      <section className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <header className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{copy.previewTitle}</h3>
          <p className="text-xs text-muted-foreground">{copy.previewHint}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {copy.localeEditingLabel}: {pageLocale.toUpperCase()}
          </p>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/10">
              <div ref={previewViewportRef} className="max-h-[62vh] overflow-auto sm:max-h-[70vh] xl:max-h-[78vh]">
                <div ref={previewContentRef} className="relative overflow-x-hidden">
                  <div ref={previewSceneRef}>
                    <ProductLandingTemplateRenderer
                      locale={pageLocale}
                      model={model.previewModel}
                      bookingPath="#"
                      bookingActionLabel={model.bookingActionLabel}
                      hideTemplateHeader
                    />
                  </div>

                  <div className="pointer-events-none absolute inset-0 z-20 hidden md:block">
                    {model.visualNodes.map((entry) => {
                      const isActive = selectedNode?.id === entry.id && model.drawerOpen;
                      const anchorPosition = slotAnchorPositions[entry.id] ?? entry.position;
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          disabled={isSaving}
                          onClick={() => model.openNode(entry.id)}
                          className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border bg-card p-2 shadow-sm transition hover:scale-105 ${
                            isActive
                              ? "border-primary text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                          style={{
                            top: `${anchorPosition.topPercent}%`,
                            left: `${anchorPosition.leftPercent}%`,
                          }}
                          title={entry.label[locale]}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:hidden">
              {model.visualNodes.map((entry) => {
                const isActive = selectedNode?.id === entry.id && model.drawerOpen;
                return (
                  <button
                    key={`mobile-${entry.id}`}
                    type="button"
                    disabled={isSaving}
                    onClick={() => model.openNode(entry.id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <span>{entry.label[locale]}</span>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="hidden space-y-3 overflow-hidden rounded-2xl border border-border bg-muted/10 p-3 xl:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.nodeListTitle} ({model.visualNodes.length})
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{copy.nodeListHint}</p>
            </div>

            <div className="max-h-[68vh] space-y-2 overflow-x-hidden overflow-y-auto pr-1">
              {model.visualNodes.map((entry) => {
                const isActive = selectedNode?.id === entry.id && model.drawerOpen;
                const currentValue = model.getNodeDisplayValue(entry.id);
                return (
                  <button
                    key={`desktop-${entry.id}`}
                    type="button"
                    disabled={isSaving}
                    onClick={() => model.openNode(entry.id)}
                    className={`min-w-0 w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-xs transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 break-words pr-2 font-medium">
                        {entry.label[locale]}
                      </span>
                      <Pencil className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <p className="mt-1 break-words text-[11px] text-muted-foreground">
                      {entry.description[locale]}
                    </p>
                    <p className="mt-1 break-all text-[11px] text-foreground/80">
                      {copy.currentValueLabel}: {currentValue}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <DrawerFormShell
        open={model.drawerOpen}
        onOpenChange={(open) => {
          model.setDrawerOpen(open);
          if (!open) {
            model.setSelectedNodeId(null);
          }
        }}
        title={selectedNodeLabel}
        description={selectedNodeDescription}
        widthClassName="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                model.closeDrawer();
                model.setSelectedNodeId(null);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              {copy.closeLabel}
            </button>
          </div>
        }
      >
        {selectedNodeType === "text" && selectedNode ? (
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.textInputLabel}</span>
            <input
              type="text"
              disabled={isSaving}
              value={model.selectedNodeValue}
              onChange={(event) => model.setNodeValue(selectedNode.id, event.target.value)}
              onBlur={(event) => model.setNodeValue(selectedNode.id, event.target.value.trim())}
              onKeyDownCapture={(event) => event.stopPropagation()}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        ) : null}

        {selectedNodeType === "textarea" && selectedNode ? (
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{copy.textInputLabel}</span>
            <textarea
              rows={4}
              disabled={isSaving}
              value={model.selectedNodeValue}
              onChange={(event) => model.setNodeValue(selectedNode.id, event.target.value)}
              onBlur={(event) => model.setNodeValue(selectedNode.id, event.target.value.trim())}
              onKeyDownCapture={(event) => event.stopPropagation()}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        ) : null}

        {is3dHeroImageNode ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{copy.heroProductPickerHint}</p>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.productSearchLabel}</span>
              <input
                type="search"
                disabled={isSaving}
                value={model.featuredSearch}
                onChange={(event) => model.setFeaturedSearch(event.target.value)}
                onKeyDownCapture={(event) => event.stopPropagation()}
                placeholder={copy.productSearchPlaceholder}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <div className="max-h-[58vh] space-y-2 overflow-auto rounded-xl border border-border bg-background p-2">
              {model.filteredFeaturedProductOptions.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">{copy.noProductsLabel}</p>
              ) : (
                productOptionsOnPage.map((entry) => {
                  const selected = model.selected3dHeroProductId === entry.id;
                  const coverImageSrc =
                    showroomClientService.resolveCoverImageUrl(entry.coverImagePath) ??
                    entry.coverImagePath;
                  return (
                    <button
                      key={`hero-product-${entry.id}`}
                      type="button"
                      disabled={isSaving}
                      onClick={() => model.apply3dHeroFeaturedProduct(entry.id)}
                      className={`w-full rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {coverImageSrc ? (
                          <img
                            src={coverImageSrc}
                            alt={entry.name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                            {copy.noImageLabel}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 leading-relaxed">
                          <p className="truncate font-semibold">
                            {entry.productCode} - {entry.name}
                          </p>
                          {entry.categoryName ? (
                            <p className="truncate text-[11px] text-muted-foreground">
                              {entry.categoryName}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] font-medium">
                            {formatRentPriceLabel(entry.rentPricePerDay, pageLocale)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] font-semibold">
                        {selected ? copy.heroProductSelectedLabel : copy.chooseProductLabel}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {model.filteredFeaturedProductOptions.length > 0 ? (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <p>
                  {copy.paginationPageLabel} {productPickerPage} {copy.paginationOfLabel} {totalProductPages} (
                  {model.filteredFeaturedProductOptions.length} {copy.paginationTotalProductsLabel})
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isSaving || productPickerPage <= 1}
                    onClick={() => setProductPickerPage((previous) => Math.max(1, previous - 1))}
                    className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.paginationPrevLabel}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || productPickerPage >= totalProductPages}
                    onClick={() =>
                      setProductPickerPage((previous) => Math.min(totalProductPages, previous + 1))
                    }
                    className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.paginationNextLabel}
                  </button>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {copy.heroProductSelectedLabel}:{" "}
              {selectedNode ? model.getNodeDisplayValue(selectedNode.id) : copy.heroProductNotSelected}
            </p>
          </div>
        ) : null}

        {selectedNodeType === "image" && selectedNode && !is3dHeroImageNode ? (
          <div className="space-y-3">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.imageUrlLabel}</span>
              <input
                type="url"
                placeholder="https://..."
                disabled={isSaving}
                value={model.selectedNodeValue}
                onChange={(event) => model.setNodeValue(selectedNode.id, event.target.value)}
                onBlur={(event) => model.setNodeValue(selectedNode.id, event.target.value.trim())}
                onKeyDownCapture={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <button
              type="button"
              disabled={!branchId || isSaving}
              onClick={() => setMediaPickerOpen(true)}
              className="h-10 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.chooseImageLabel}
            </button>

            {selectedImagePreview ? (
              <div>
                <p className="text-xs text-muted-foreground">{copy.imagePreviewLabel}</p>
                <div className="mt-1 w-48 overflow-hidden rounded-xl border border-border bg-muted/20 p-1">
                  <img
                    src={selectedImagePreview}
                    alt={selectedNodeLabel}
                    className="h-28 w-full object-cover"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedNodeType === "featuredProducts" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{copy.featuredHint}</p>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.productSearchLabel}</span>
              <input
                type="search"
                disabled={isSaving}
                value={model.featuredSearch}
                onChange={(event) => model.setFeaturedSearch(event.target.value)}
                onKeyDownCapture={(event) => event.stopPropagation()}
                placeholder={copy.productSearchPlaceholder}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <div className="max-h-[58vh] space-y-2 overflow-auto rounded-xl border border-border bg-background p-2">
              {model.filteredFeaturedProductOptions.length === 0 ? (
                <p className="px-2 py-1 text-xs text-muted-foreground">{copy.noProductsLabel}</p>
              ) : (
                productOptionsOnPage.map((entry) => {
                  const checked = model.selectedFeaturedProductIds.includes(entry.id);
                  const coverImageSrc =
                    showroomClientService.resolveCoverImageUrl(entry.coverImagePath) ??
                    entry.coverImagePath;
                  return (
                    <label
                      key={entry.id}
                      className="flex items-start gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground"
                    >
                      <input
                        type="checkbox"
                        disabled={isSaving}
                        checked={checked}
                        onChange={() => model.toggleFeaturedProductId(entry.id)}
                        className="mt-0.5"
                      />
                      {coverImageSrc ? (
                        <img
                          src={coverImageSrc}
                          alt={entry.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : null}
                      <span className="leading-relaxed">
                        <span className="font-semibold">{entry.productCode}</span> - {entry.name}
                        {entry.categoryName ? (
                          <span className="text-muted-foreground"> ({entry.categoryName})</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            {model.filteredFeaturedProductOptions.length > 0 ? (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <p>
                  {copy.paginationPageLabel} {productPickerPage} {copy.paginationOfLabel} {totalProductPages} (
                  {model.filteredFeaturedProductOptions.length} {copy.paginationTotalProductsLabel})
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isSaving || productPickerPage <= 1}
                    onClick={() => setProductPickerPage((previous) => Math.max(1, previous - 1))}
                    className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.paginationPrevLabel}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || productPickerPage >= totalProductPages}
                    onClick={() =>
                      setProductPickerPage((previous) => Math.min(totalProductPages, previous + 1))
                    }
                    className="h-8 rounded-lg border border-border px-2.5 text-[11px] font-semibold text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.paginationNextLabel}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedNodeType === "socialLinks" ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{copy.socialLinksHint}</p>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.socialFacebookLabel}</span>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                disabled={isSaving}
                value={model.socialLinksDraft.facebook}
                onChange={(event) => model.updateSocialLink("facebook", event.target.value)}
                onBlur={(event) => model.updateSocialLink("facebook", event.target.value.trim())}
                onKeyDownCapture={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.socialTiktokLabel}</span>
              <input
                type="url"
                placeholder="https://www.tiktok.com/@..."
                disabled={isSaving}
                value={model.socialLinksDraft.tiktok}
                onChange={(event) => model.updateSocialLink("tiktok", event.target.value)}
                onBlur={(event) => model.updateSocialLink("tiktok", event.target.value.trim())}
                onKeyDownCapture={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.socialZaloLabel}</span>
              <input
                type="url"
                placeholder="https://zalo.me/..."
                disabled={isSaving}
                value={model.socialLinksDraft.zalo}
                onChange={(event) => model.updateSocialLink("zalo", event.target.value)}
                onBlur={(event) => model.updateSocialLink("zalo", event.target.value.trim())}
                onKeyDownCapture={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-xs text-muted-foreground">
              <span>{copy.socialTelegramLabel}</span>
              <input
                type="url"
                placeholder="https://t.me/..."
                disabled={isSaving}
                value={model.socialLinksDraft.telegram}
                onChange={(event) => model.updateSocialLink("telegram", event.target.value)}
                onBlur={(event) => model.updateSocialLink("telegram", event.target.value.trim())}
                onKeyDown={(event) => event.stopPropagation()}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>
        ) : null}

        {selectedNodeType === "textList" && selectedNode ? (
          <CommonListForm
            addItemLabel={copy.textListAddItem}
            disabled={isSaving}
            entries={resolvedTextListEntries}
            hint={copy.textListHint}
            linkFieldLabel={copy.textListLinkField}
            linkPlaceholder={copy.textListLinkPlaceholder}
            onCommit={(entries) => {
              model.setNodeValue(selectedNode.id, serializeFooterLinkList(entries));
            }}
            removeItemLabel={copy.textListRemoveItem}
            setEntries={(entries) => setLocalTextListEntries(entries)}
            valueFieldLabel={copy.textListLabelField}
          />
        ) : null}

        {selectedNodeType === "contactInfo" ? (
          <CommonListForm
            addItemLabel={copy.textListAddItem}
            allowAddRemove={false}
            disabled={isSaving}
            entries={resolvedContactEntries}
            hint={copy.contactInfoHint}
            linkFieldLabel={copy.textListLinkField}
            linkPlaceholder={copy.textListLinkPlaceholder}
            onCommit={(entries) => {
              model.updateContactInfo("hotline", entries[0]?.label.trim() ?? "");
              model.updateContactInfo("email", entries[1]?.label.trim() ?? "");
              model.updateContactInfo("storeAddress", entries[2]?.label.trim() ?? "");
            }}
            removeItemLabel={copy.textListRemoveItem}
            rowValueLabels={[
              copy.contactHotlineField,
              copy.contactEmailField,
              copy.contactAddressField,
            ]}
            setEntries={(entries) => setLocalContactEntries(entries)}
            showLinkField={false}
            valueFieldLabel={copy.textInputLabel}
          />
        ) : null}
      </DrawerFormShell>

      <MediaPickerModal
        locale={locale}
        open={mediaPickerOpen}
        onOpenChange={setMediaPickerOpen}
        branchId={branchId}
        defaultMediaType="image"
        onSelectAsset={(asset) => {
          if (!selectedNode || selectedNode.type !== "image" || is3dHeroImageNode) return;
          if (!asset.publicUrl) return;
          model.setNodeValue(selectedNode.id, asset.publicUrl);
          setMediaPickerOpen(false);
        }}
      />
    </>
  );
}
