import type { InventoryListViewMode } from "@/types/inventoryItems";
import type { ProductInitialItemStatus } from "@/types/productsCatalog";

export type AddItemFieldErrorKey = "branchId" | "productId" | "itemCodesText" | "initialStatus";
export type AddItemFieldErrors = Partial<Record<AddItemFieldErrorKey, string>>;

export interface AddItemDraft {
  productId: string;
  itemCodesText: string;
  initialStatus: ProductInitialItemStatus;
  itemSize: string;
}

export interface InventoryListCopy {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  statusFilter: string;
  categoryFilter: string;
  sizeFilter: string;
  branchFilter: string;
  viewModeLabel: string;
  viewModes: Record<InventoryListViewMode, string>;
  allStatuses: string;
  allCategories: string;
  allSizes: string;
  allBranches: string;
  addItemAction: string;
  addItemPanelTitle: string;
  addItemPanelDescription: string;
  addItemSubmit: string;
  addItemCancel: string;
  addItemSearchPlaceholder: string;
  addItemProductsLoading: string;
  addItemProductsEmpty: string;
  addItemCodesHint: string;
  addItemSizePlaceholder: string;
  addItemSuccess: string;
  addItemFailed: string;
  addItemBranchRequiredError: string;
  addItemRequiredProductError: string;
  addItemRequiredItemCodesError: string;
  addItemDuplicatePayloadError: string;
  addItemDuplicateCodeExistsError: string;
  addItemForbiddenSoldError: string;
  addItemInvalidPayloadError: string;
  tableHeaders: {
    code: string;
    productVariant: string;
    status: string;
    currentOrder: string;
    lastMovement: string;
    actions: string;
  };
  productTableHeaders: {
    product: string;
    itemCount: string;
    readyItemCount: string;
    actions: string;
  };
  addItemFields: {
    productSearch: string;
    product: string;
    itemCodes: string;
    initialStatus: string;
    itemSize: string;
  };
  viewDetail: string;
  changeStatus: string;
  retire: string;
  viewProduct: string;
  scanAction: string;
  loading: string;
  loadingProducts: string;
  empty: string;
  emptyProducts: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  bulkSelectedLabel: string;
  bulkSelectAll: string;
  bulkClearSelection: string;
  bulkMarkReady: string;
}
