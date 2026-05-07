import { makeAutoObservable } from "mobx";
import type {
  InventoryItemDetailDto,
  InventoryProductListItemDto,
  InventoryProductListResponse,
  InventoryListItemDto,
  InventoryListResponse,
} from "@/types/inventoryItems";
import type { ProductCategoryDto } from "@/types/productsCatalog";

class InventoryStore {
  private static _instance: InventoryStore | null = null;

  private _listItems: InventoryListItemDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 20;
  private _productListItems: InventoryProductListItemDto[] = [];
  private _productListTotal = 0;
  private _productListPage = 1;
  private _productListPageSize = 20;
  private _categories: ProductCategoryDto[] = [];
  private _sizes: string[] = [];
  private _branchOptions: string[] = [];
  private _detailByItemId = new Map<string, InventoryItemDetailDto>();

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new InventoryStore();
    }

    return this._instance;
  }

  get listItems(): InventoryListItemDto[] {
    return this._listItems;
  }

  get listTotal(): number {
    return this._listTotal;
  }

  get listPage(): number {
    return this._listPage;
  }

  get listPageSize(): number {
    return this._listPageSize;
  }

  get productListItems(): InventoryProductListItemDto[] {
    return this._productListItems;
  }

  get productListTotal(): number {
    return this._productListTotal;
  }

  get productListPage(): number {
    return this._productListPage;
  }

  get productListPageSize(): number {
    return this._productListPageSize;
  }

  get categories(): ProductCategoryDto[] {
    return this._categories;
  }

  get sizes(): string[] {
    return this._sizes;
  }

  get branchOptions(): string[] {
    return this._branchOptions;
  }

  getDetailByItemId(itemId: string): InventoryItemDetailDto | null {
    return this._detailByItemId.get(itemId) ?? null;
  }

  hydrateList(payload: InventoryListResponse): void {
    this._listItems = payload.items;
    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
    this._categories = payload.categories;
    this._sizes = payload.sizes;
    this._branchOptions = payload.branchOptions;
  }

  hydrateProductList(payload: InventoryProductListResponse): void {
    this._productListItems = payload.items;
    this._productListTotal = payload.total;
    this._productListPage = payload.page;
    this._productListPageSize = payload.pageSize;
    this._categories = payload.categories;
    this._sizes = payload.sizes;
    this._branchOptions = payload.branchOptions;
  }

  hydrateDetail(payload: InventoryItemDetailDto): void {
    this._detailByItemId.set(payload.item.id, payload);
    this.upsertListItem(payload.item);
  }

  upsertListItem(item: InventoryListItemDto): void {
    const index = this._listItems.findIndex((entry) => entry.id === item.id);
    if (index >= 0) {
      const next = [...this._listItems];
      next[index] = item;
      this._listItems = next;
      return;
    }

    this._listItems = [item, ...this._listItems];
    this._listTotal += 1;
  }

  clear(): void {
    this._listItems = [];
    this._listTotal = 0;
    this._listPage = 1;
    this._listPageSize = 20;
    this._productListItems = [];
    this._productListTotal = 0;
    this._productListPage = 1;
    this._productListPageSize = 20;
    this._categories = [];
    this._sizes = [];
    this._branchOptions = [];
    this._detailByItemId.clear();
  }
}

export const inventoryStore = InventoryStore.getInstance();
