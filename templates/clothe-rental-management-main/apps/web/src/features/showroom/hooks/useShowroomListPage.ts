"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  SHOWROOM_DEFAULT_PAGE_SIZE,
  SHOWROOM_GENDER_OPTIONS,
} from "@/features/showroom/constants";
import { useShowroomConfigQuery, useShowroomProductsQuery } from "@/features/showroom/queries/useShowroomQueries";
import { showroomClientService } from "@/features/showroom/services/showroomClientService";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import { buildShowroomPageViewConfig } from "@/features/showroom/utils/showroomConfig";
import {
  buildShowroomBasePath,
  buildShowroomDetailPath,
  buildShowroomShortlistPath,
  normalizeBranchSlug,
  normalizeShopDomain,
  normalizeShowroomSlug,
} from "@/features/showroom/utils/paths";
import { useDebouncedValue } from "@/features/showroom/utils/useDebouncedValue";
import type { ProductGender } from "@/types/productsCatalog";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

interface ShowroomListCopy {
  localeSwitch: string;
  fallbackNotice: string;
  filtersTitle: string;
  openFilters: string;
  clearFilters: string;
  closeFilters: string;
  viewShortlist: string;
  resultsTitle: string;
  noProductsTitle: string;
  noProductsHint: string;
  perDayLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  allCategories: string;
  categorySearchPlaceholder: string;
  noCategoryMatches: string;
  allTags: string;
  allGenders: string;
  allSizes: string;
  allColors: string;
  priceLabel: string;
  salePriceLabel: string;
  successfulRentCountLabel: string;
  depositLabel: string;
  sizeLabel: string;
  colorLabel: string;
  categoryLabel: string;
  materialLabel: string;
  productCount: string;
  viewDetail: string;
  shortlistAdd: string;
  shortlistRemove: string;
  loading: string;
  empty: string;
  paginationPrevious: string;
  paginationNext: string;
  paginationPageLabel: string;
  retry: string;
  shortlistTitle: string;
  shortlistEmpty: string;
  shortlistHint: string;
  clearShortlist: string;
  noImage: string;
}

const SHOWROOM_LIST_COPY: Record<AppLocale, ShowroomListCopy> = {
  vi: {
    localeSwitch: "Đổi ngôn ngữ",
    fallbackNotice: "Đang hiển thị cấu hình mặc định do chưa có bản publish.",
    filtersTitle: "Bộ lọc",
    openFilters: "Mở bộ lọc",
    clearFilters: "Xóa bộ lọc",
    closeFilters: "Đóng",
    viewShortlist: "Giỏ hàng",
    resultsTitle: "Danh sách sản phẩm",
    noProductsTitle: "Không tìm thấy sản phẩm",
    noProductsHint: "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.",
    perDayLabel: "/ ngày",
    searchLabel: "Tìm theo tên, chất liệu",
    searchPlaceholder: "Nhập tên sản phẩm hoặc chất liệu...",
    allCategories: "Tất cả danh mục",
    categorySearchPlaceholder: "Tìm danh mục...",
    noCategoryMatches: "Không có danh mục phù hợp.",
    allTags: "Tất cả thẻ",
    allGenders: "Tất cả giới tính",
    allSizes: "Tất cả size",
    allColors: "Tất cả màu",
    priceLabel: "Giá tham khảo",
    salePriceLabel: "Giá bán",
    successfulRentCountLabel: "Đã được thuê",
    depositLabel: "Đặt cọc tham khảo",
    sizeLabel: "Size",
    colorLabel: "Màu",
    categoryLabel: "Danh mục",
    materialLabel: "Chất liệu",
    productCount: "sản phẩm",
    viewDetail: "Xem chi tiết",
    shortlistAdd: "Thêm vào giỏ hàng",
    shortlistRemove: "Bỏ khỏi giỏ hàng",
    loading: "Đang tải phòng trưng bày...",
    empty: "Chưa có sản phẩm phù hợp bộ lọc hiện tại.",
    paginationPrevious: "Trước",
    paginationNext: "Sau",
    paginationPageLabel: "Trang",
    retry: "Thử lại",
    shortlistTitle: "Giỏ hàng của bạn",
    shortlistEmpty: "Bạn chưa chọn sản phẩm nào.",
    shortlistHint: "Danh sách này được lưu cục bộ trên trình duyệt hiện tại.",
    clearShortlist: "Xóa giỏ hàng",
    noImage: "Chưa có ảnh",
  },
  en: {
    localeSwitch: "Switch language",
    fallbackNotice: "Fallback config is shown because no published config was found.",
    filtersTitle: "Filters",
    openFilters: "Open filters",
    clearFilters: "Clear filters",
    closeFilters: "Close",
    viewShortlist: "Cart",
    resultsTitle: "Product listing",
    noProductsTitle: "No products found",
    noProductsHint: "Try adjusting your filters or search term.",
    perDayLabel: "/ day",
    searchLabel: "Search by name, material",
    searchPlaceholder: "Type product name or material...",
    allCategories: "All categories",
    categorySearchPlaceholder: "Search categories...",
    noCategoryMatches: "No matching categories.",
    allTags: "All tags",
    allGenders: "All genders",
    allSizes: "All sizes",
    allColors: "All colors",
    priceLabel: "Price reference",
    salePriceLabel: "Sale price",
    successfulRentCountLabel: "Successful rents",
    depositLabel: "Deposit reference",
    sizeLabel: "Size",
    colorLabel: "Color",
    categoryLabel: "Category",
    materialLabel: "Material",
    productCount: "products",
    viewDetail: "View detail",
    shortlistAdd: "Add to cart",
    shortlistRemove: "Remove from cart",
    loading: "Loading showroom...",
    empty: "No products matched the current filters.",
    paginationPrevious: "Previous",
    paginationNext: "Next",
    paginationPageLabel: "Page",
    retry: "Retry",
    shortlistTitle: "Your cart",
    shortlistEmpty: "No products in cart yet.",
    shortlistHint: "This list is stored locally in your browser.",
    clearShortlist: "Clear cart",
    noImage: "No image",
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

function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

export function useShowroomListPage(
  locale: AppLocale,
  options?: {
    initialSearch?: string;
    showroomSlug?: string | null;
    branchSlug?: string | null;
    shopDomain?: string | null;
    initialConfig?: PublicShowroomPageConfigDto | null;
  }
) {
  const copy = SHOWROOM_LIST_COPY[locale];
  const initialSearch = options?.initialSearch?.trim() ?? "";
  const requestedShowroomSlug = normalizeShowroomSlug(options?.showroomSlug);
  const requestedBranchSlug = normalizeBranchSlug(options?.branchSlug);
  const requestedShopDomain = normalizeShopDomain(options?.shopDomain);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [productCategoryIds, setProductCategoryIds] = useState<string[]>([]);
  const [tagId, setTagId] = useState("");
  const [genders, setGenders] = useState<ProductGender[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 350);

  useEffect(() => {
    showroomStore.ensureShortlistHydrated();
  }, []);

  const configQuery = useShowroomConfigQuery({
    locale,
    showroomSlug: requestedShowroomSlug,
    branchSlug: requestedBranchSlug,
    shopDomain: requestedShopDomain,
    initialData: options?.initialConfig ?? undefined,
  });
  const resolvedConfig =
    configQuery.data ?? options?.initialConfig ?? showroomStore.config ?? null;

  const activeBranchId = resolvedConfig?.branchId ?? null;
  const activeBranchSlug = resolvedConfig?.branchSlug ?? requestedBranchSlug ?? null;
  const activeShopDomain = resolvedConfig?.shopDomain ?? requestedShopDomain ?? null;
  const activeShowroomSlug = resolvedConfig?.showroomSlug ?? requestedShowroomSlug ?? null;

  const listQuery = useShowroomProductsQuery(
    {
      showroomSlug: activeShowroomSlug,
      branchId: activeBranchId,
      branchSlug: activeBranchSlug,
      shopDomain: activeShopDomain,
      search: debouncedSearch || undefined,
      productCategoryId: productCategoryIds[0] ?? null,
      productCategoryIds,
      tagId: tagId || null,
      gender: genders[0] ?? null,
      genders,
      size: sizes[0] ?? null,
      sizes,
      page,
      pageSize: SHOWROOM_DEFAULT_PAGE_SIZE,
    },
    {
      append: false,
    }
  );

  const viewConfig = buildShowroomPageViewConfig({
    locale,
    config: resolvedConfig,
  });

  const listEntries = showroomStore.listItems;
  const shortlistSnapshot = showroomStore.shortlistItems;
  const listItems = useMemo(
    () => {
      const shortlistedProductIdSet = new Set(
        shortlistSnapshot.map((shortlistEntry) => shortlistEntry.productId)
      );
      return listEntries.map((entry) => ({
        ...entry,
        coverImageUrl: showroomClientService.resolveCoverImageUrl(entry.coverImagePath),
        isShortlisted: shortlistedProductIdSet.has(entry.id),
      }));
    },
    [listEntries, shortlistSnapshot]
  );

  const sizeOptions = useMemo(
    () => uniqueValues([...sizes, ...listEntries.flatMap((entry) => entry.sizes)]),
    [listEntries, sizes]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(showroomStore.listTotal / SHOWROOM_DEFAULT_PAGE_SIZE)
  );
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  const alternateLocale: AppLocale = locale === "vi" ? "en" : "vi";
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
  const alternateShowroomPath = buildShowroomBasePath(
    alternateLocale,
    activeShowroomSlug,
    activeBranchSlug,
    activeShopDomain
  );

  const genderOptions = useMemo(
    () =>
      SHOWROOM_GENDER_OPTIONS.map((entry) => ({
        value: entry,
        label: GENDER_LABELS[locale][entry],
      })),
    [locale]
  );

  return {
    copy,
    configQuery,
    listQuery,
    viewConfig,
    listItems,
    listTotal: showroomStore.listTotal,
    categories: showroomStore.categories,
    tags: showroomStore.tags,
    shortlistCount: showroomStore.shortlistCount,
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    productCategoryIds,
    toggleProductCategoryId: (value: string) => {
      setProductCategoryIds((previous) => {
        const next = previous.includes(value)
          ? previous.filter((entry) => entry !== value)
          : [...previous, value];
        return next;
      });
      setPage(1);
    },
    tagId,
    setTagId: (value: string) => {
      setTagId(value);
      setPage(1);
    },
    genders,
    toggleGender: (value: ProductGender) => {
      setGenders((previous) => {
        const next = previous.includes(value)
          ? previous.filter((entry) => entry !== value)
          : [...previous, value];
        return next;
      });
      setPage(1);
    },
    sizes,
    toggleSize: (value: string) => {
      setSizes((previous) => {
        const next = previous.includes(value)
          ? previous.filter((entry) => entry !== value)
          : [...previous, value];
        return next;
      });
      setPage(1);
    },
    sizeOptions,
    page,
    totalPages,
    hasPreviousPage,
    hasNextPage,
    goToPage: (nextPage: number) => {
      const safePage = Math.max(1, Math.min(totalPages, Math.trunc(nextPage)));
      if (!Number.isFinite(safePage) || safePage === page) return;
      setPage(safePage);
    },
    goToPreviousPage: () => {
      if (!hasPreviousPage) return;
      setPage((previous) => Math.max(1, previous - 1));
    },
    goToNextPage: () => {
      if (!hasNextPage) return;
      setPage((previous) => Math.min(totalPages, previous + 1));
    },
    toggleShortlist: (productId: string) => {
      const matched = showroomStore.listItems.find((entry) => entry.id === productId);
      if (!matched) return;
      showroomStore.toggleShortlistFromCard(matched);
    },
    removeShortlist: (productId: string) => {
      showroomStore.removeShortlist(productId);
    },
    clearShortlist: () => {
      showroomStore.clearShortlist();
    },
    clearFilters: () => {
      setSearchInput("");
      setProductCategoryIds([]);
      setTagId("");
      setGenders([]);
      setSizes([]);
      setPage(1);
    },
    showroomSlug: activeShowroomSlug,
    branchSlug: activeBranchSlug,
    showroomPath,
    shortlistPath,
    alternateShowroomPath,
    detailPath: (productId: string) =>
      buildShowroomDetailPath(
        locale,
        productId,
        activeShowroomSlug,
        activeBranchSlug,
        activeShopDomain
      ),
    genderOptions,
    alternateLocale,
  };
}
