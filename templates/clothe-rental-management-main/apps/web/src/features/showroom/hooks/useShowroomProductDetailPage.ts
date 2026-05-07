"use client";

import { useEffect, useMemo } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  SHOWROOM_GENDER_OPTIONS,
} from "@/features/showroom/constants";
import {
  useShowroomConfigQuery,
  useShowroomProductDetailQuery,
} from "@/features/showroom/queries/useShowroomQueries";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import { buildShowroomPageViewConfig } from "@/features/showroom/utils/showroomConfig";
import { toYouTubeEmbedUrl } from "@/features/showroom/utils/youtube";
import {
  buildShowroomBasePath,
  buildShowroomShortlistPath,
  normalizeBranchSlug,
  normalizeShopDomain,
  normalizeShowroomSlug,
} from "@/features/showroom/utils/paths";
import type { ProductGender } from "@/types/productsCatalog";

interface ShowroomDetailCopy {
  backToShowroom: string;
  viewShortlist: string;
  loading: string;
  notFound: string;
  priceLabel: string;
  salePriceLabel: string;
  remainingItemsLabel: string;
  depositLabel: string;
  categoryLabel: string;
  materialLabel: string;
  genderLabel: string;
  sizeLabel: string;
  unassignedSizeLabel: string;
  colorLabel: string;
  descriptionTitle: string;
  shortlistAdd: string;
  shortlistRemove: string;
  noDescription: string;
  noImage: string;
  videosTitle: string;
  tagsTitle: string;
  perDayLabel: string;
  retry: string;
}

const SHOWROOM_DETAIL_COPY: Record<AppLocale, ShowroomDetailCopy> = {
  vi: {
    backToShowroom: "Quay lại phòng trưng bày",
    viewShortlist: "Giỏ hàng",
    loading: "Đang tải chi tiết sản phẩm...",
    notFound: "Không tìm thấy sản phẩm hoặc sản phẩm không còn hiển thị trong phòng trưng bày.",
    priceLabel: "Giá tham khảo",
    salePriceLabel: "Giá bán",
    remainingItemsLabel: "Số lượng còn lại",
    depositLabel: "Đặt cọc tham khảo",
    categoryLabel: "Danh mục",
    materialLabel: "Chất liệu",
    genderLabel: "Giới tính",
    sizeLabel: "Size",
    unassignedSizeLabel: "Chưa gán size",
    colorLabel: "Màu",
    descriptionTitle: "Mô tả",
    shortlistAdd: "Thêm vào giỏ hàng",
    shortlistRemove: "Bỏ khỏi giỏ hàng",
    noDescription: "Sản phẩm chưa có mô tả.",
    noImage: "Chưa có ảnh",
    videosTitle: "Video",
    tagsTitle: "Tags",
    perDayLabel: "/ ngày",
    retry: "Thử lại",
  },
  en: {
    backToShowroom: "Back to showroom",
    viewShortlist: "Cart",
    loading: "Loading product detail...",
    notFound: "Product was not found or is no longer visible in showroom.",
    priceLabel: "Price reference",
    salePriceLabel: "Sale price",
    remainingItemsLabel: "Remaining quantity",
    depositLabel: "Deposit reference",
    categoryLabel: "Category",
    materialLabel: "Material",
    genderLabel: "Gender",
    sizeLabel: "Size",
    unassignedSizeLabel: "Unassigned size",
    colorLabel: "Color",
    descriptionTitle: "Description",
    shortlistAdd: "Add to cart",
    shortlistRemove: "Remove from cart",
    noDescription: "No description available yet.",
    noImage: "No image",
    videosTitle: "Videos",
    tagsTitle: "Tags",
    perDayLabel: "/ day",
    retry: "Retry",
  },
};

const GENDER_LABELS: Record<AppLocale, Record<ProductGender, string>> = {
  vi: {
    female: "Nữ",
    male: "Nam",
    nam: "Nam",
    nu: "Nữ",
    unisex: "Unisex",
    other: "Khác",
  },
  en: {
    female: "Female",
    male: "Male",
    nam: "Male",
    nu: "Female",
    unisex: "Unisex",
    other: "Other",
  },
};

export function useShowroomProductDetailPage(
  locale: AppLocale,
  productId: string,
  showroomSlug?: string | null,
  branchSlug?: string | null,
  shopDomain?: string | null
) {
  const copy = SHOWROOM_DETAIL_COPY[locale];
  const requestedShowroomSlug = normalizeShowroomSlug(showroomSlug);
  const requestedBranchSlug = normalizeBranchSlug(branchSlug);
  const requestedShopDomain = normalizeShopDomain(shopDomain);

  useEffect(() => {
    showroomStore.ensureShortlistHydrated();
  }, []);

  const configQuery = useShowroomConfigQuery({
    locale,
    showroomSlug: requestedShowroomSlug,
    branchSlug: requestedBranchSlug,
    shopDomain: requestedShopDomain,
  });

  const activeBranchId = showroomStore.config?.branchId ?? null;
  const activeBranchSlug = showroomStore.config?.branchSlug ?? requestedBranchSlug ?? null;
  const activeShopDomain = showroomStore.config?.shopDomain ?? requestedShopDomain ?? null;
  const activeShowroomSlug = showroomStore.config?.showroomSlug ?? requestedShowroomSlug ?? null;

  const detailQuery = useShowroomProductDetailQuery(productId, {
    showroomSlug: activeShowroomSlug,
    branchId: activeBranchId,
    branchSlug: activeBranchSlug,
    shopDomain: activeShopDomain,
  });

  const detail = showroomStore.getDetailByProductId(productId);

  const viewConfig = buildShowroomPageViewConfig({
    locale,
    config: showroomStore.config,
  });

  const coverImageUrl = showroomClientService.resolveCoverImageUrl(detail?.coverImagePath ?? null);

  const galleryImageUrls = useMemo(() => {
    if (!detail) return [];

    const output: string[] = [];
    for (const path of detail.galleryImagePaths) {
      const resolved = showroomClientService.resolveCoverImageUrl(path);
      if (!resolved) continue;
      output.push(resolved);
    }

    return output;
  }, [detail]);

  const youtubeVideoEmbedUrls = useMemo(() => {
    if (!detail) return [];

    const output: string[] = [];
    const seen = new Set<string>();
    for (const url of detail.videoUrls) {
      const embedUrl = toYouTubeEmbedUrl(url);
      if (!embedUrl || seen.has(embedUrl)) continue;
      seen.add(embedUrl);
      output.push(embedUrl);
    }

    return output;
  }, [detail]);

  return {
    copy,
    configQuery,
    detailQuery,
    detail,
    viewConfig,
    coverImageUrl,
    galleryImageUrls,
    youtubeVideoEmbedUrls,
    showroomPath: buildShowroomBasePath(
      locale,
      activeShowroomSlug,
      activeBranchSlug,
      activeShopDomain
    ),
    shortlistPath: buildShowroomShortlistPath(
      locale,
      activeShowroomSlug,
      activeBranchSlug,
      activeShopDomain
    ),
    isShortlisted: showroomStore.isShortlisted(productId),
    toggleShortlist: () => {
      const currentDetail = showroomStore.getDetailByProductId(productId);
      if (!currentDetail) return;
      showroomStore.toggleShortlistFromDetail(currentDetail);
    },
    genderOptions: SHOWROOM_GENDER_OPTIONS.map((entry) => ({
      value: entry,
      label: GENDER_LABELS[locale][entry],
    })),
  };
}
