"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import { buildShowroomPageViewConfig } from "@/features/showroom/utils/showroomConfig";
import {
  normalizeBranchSlug,
  buildShowroomBasePath,
  buildShowroomDetailPath,
  buildShowroomShortlistPath,
  normalizeShopDomain,
  normalizeShowroomSlug,
} from "@/features/showroom/utils/paths";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

interface ShowroomShortlistCopy {
  title: string;
  subtitle: string;
  backToShowroom: string;
  emptyTitle: string;
  emptyHint: string;
  exploreAction: string;
  clearAction: string;
  removeAction: string;
  noteLabel: string;
  notePlaceholder: string;
  shareAction: string;
  shareSuccess: string;
  shareError: string;
  copyHint: string;
  countLabel: string;
  addedAtLabel: string;
  priceLabel: string;
  noImage: string;
}

const SHOWROOM_SHORTLIST_COPY: Record<AppLocale, ShowroomShortlistCopy> = {
  vi: {
    title: "Giỏ hàng của bạn",
    subtitle: "Lưu sẵn các mẫu bạn muốn thử trước khi đến phòng trưng bày.",
    backToShowroom: "Quay lại phòng trưng bày",
    emptyTitle: "Chưa có sản phẩm nào",
    emptyHint: "Thêm sản phẩm từ trang listing hoặc trang chi tiết vào giỏ hàng.",
    exploreAction: "Khám phá phòng trưng bày",
    clearAction: "Xóa tất cả",
    removeAction: "Xóa",
    noteLabel: "Ghi chú",
    notePlaceholder: "Thêm ghi chú cho stylist/phòng trưng bày...",
    shareAction: "Chia sẻ",
    shareSuccess: "Đã sao chép link giỏ hàng.",
    shareError: "Không thể sao chép link. Vui lòng thử lại.",
    copyHint: "Chia sẻ sẽ sao chép URL giỏ hàng hiện tại.",
    countLabel: "sản phẩm",
    addedAtLabel: "Thêm lúc",
    priceLabel: "Giá tham khảo",
    noImage: "Chưa có ảnh",
  },
  en: {
    title: "Your cart",
    subtitle: "Save outfits you want to try before visiting the showroom.",
    backToShowroom: "Back to showroom",
    emptyTitle: "No items in cart yet",
    emptyHint: "Add items from listing or detail page to your cart.",
    exploreAction: "Explore showroom",
    clearAction: "Clear all",
    removeAction: "Remove",
    noteLabel: "Note",
    notePlaceholder: "Add notes for stylist/showroom...",
    shareAction: "Share",
    shareSuccess: "Cart link copied.",
    shareError: "Unable to copy link. Please try again.",
    copyHint: "Sharing copies the current cart URL.",
    countLabel: "products",
    addedAtLabel: "Added at",
    priceLabel: "Price reference",
    noImage: "No image",
  },
};

async function copyText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard unavailable");
  }
}

export function useShowroomShortlistPage(
  locale: AppLocale,
  showroomSlug?: string | null,
  branchSlug?: string | null,
  shopDomain?: string | null,
  initialConfig?: PublicShowroomPageConfigDto | null
) {
  const copy = SHOWROOM_SHORTLIST_COPY[locale];
  const [shareFeedback, setShareFeedback] = useState<null | "success" | "error">(null);
  const normalizedShowroomSlug = normalizeShowroomSlug(showroomSlug);
  const normalizedBranchSlug = normalizeBranchSlug(branchSlug);
  const normalizedShopDomain = normalizeShopDomain(shopDomain);
  const resolvedConfig = initialConfig ?? showroomStore.config;
  const viewConfig = buildShowroomPageViewConfig({
    locale,
    config: resolvedConfig,
  });
  const activeBranchSlug = resolvedConfig?.branchSlug ?? normalizedBranchSlug;
  const activeShopDomain = resolvedConfig?.shopDomain ?? normalizedShopDomain;
  const activeShowroomSlug = resolvedConfig?.showroomSlug ?? normalizedShowroomSlug;
  const showroomPath = buildShowroomBasePath(
    locale,
    activeShowroomSlug,
    activeBranchSlug,
    activeShopDomain
  );
  const shortlistPath = buildShowroomShortlistPath(
    locale,
    activeShowroomSlug,
    activeBranchSlug,
    activeShopDomain
  );

  useLayoutEffect(() => {
    if (!initialConfig) return;
    showroomStore.hydrateConfig(initialConfig);
  }, [initialConfig]);

  useLayoutEffect(() => {
    showroomStore.ensureShortlistHydrated();
  }, []);

  useEffect(() => {
    if (!shareFeedback) return;
    const timer = window.setTimeout(() => setShareFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [shareFeedback]);

  const shortlistSnapshot = showroomStore.shortlistItems;
  const shortlistItems = useMemo(
    () =>
      shortlistSnapshot.map((entry) => ({
        ...entry,
        coverImageUrl: showroomClientService.resolveCoverImageUrl(entry.coverImagePath),
      })),
    [shortlistSnapshot]
  );

  const onUpdateNote = (productId: string, note: string) => {
    showroomStore.updateShortlistNote(productId, note);
  };

  const onRemove = (productId: string) => {
    showroomStore.removeShortlist(productId);
  };

  const onClear = () => {
    showroomStore.clearShortlist();
  };

  const onShare = async () => {
    try {
      const shareUrl =
        typeof window !== "undefined"
          ? window.location.href
          : shortlistPath;
      await copyText(shareUrl);
      setShareFeedback("success");
    } catch {
      setShareFeedback("error");
    }
  };

  return {
    copy,
    viewConfig,
    shortlistItems,
    shortlistCount: showroomStore.shortlistCount,
    shareFeedback,
    setShareFeedback,
    showroomPath,
    detailPath: (productId: string) =>
      buildShowroomDetailPath(
        locale,
        productId,
        activeShowroomSlug,
        activeBranchSlug,
        activeShopDomain
      ),
    onUpdateNote,
    onRemove,
    onClear,
    onShare,
  };
}
