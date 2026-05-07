import { makeAutoObservable } from "mobx";
import type {
  ProductCategoryDto,
  ProductDetailDto,
  ProductPricePlanDto,
  ProductSummaryDto,
  ProductTagDto,
  ProductsListResponse,
} from "@/types/productsCatalog";

function pickPricePolicyFromDetail(detail: ProductDetailDto): ProductPricePlanDto {
  const preferredVariant = detail.variants.find((entry) => entry.isActive) ?? detail.variants[0] ?? null;

  return {
    defaultDepositAmount: preferredVariant?.defaultDepositAmount ?? null,
    price1d: preferredVariant?.price1d ?? null,
    price3d: preferredVariant?.price3d ?? null,
    price7d: preferredVariant?.price7d ?? null,
    pricePerDay: preferredVariant?.pricePerDay ?? null,
  };
}

class ProductsStore {
  private static _instance: ProductsStore | null = null;

  private _listItems: ProductSummaryDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 12;
  private _categories: ProductCategoryDto[] = [];
  private _tags: ProductTagDto[] = [];
  private _detailByProductId = new Map<string, ProductDetailDto>();

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ProductsStore();
    }
    return this._instance;
  }

  get listItems(): ProductSummaryDto[] {
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

  get categories(): ProductCategoryDto[] {
    return this._categories;
  }

  get tags(): ProductTagDto[] {
    return this._tags;
  }

  getDetailByProductId(productId: string): ProductDetailDto | null {
    return this._detailByProductId.get(productId) ?? null;
  }

  hydrateList(response: ProductsListResponse): void {
    this._listItems = response.items;
    this._listTotal = response.total;
    this._listPage = response.page;
    this._listPageSize = response.pageSize;
    this._categories = response.categories;
    this._tags = response.tags;
  }

  hydrateDetail(detail: ProductDetailDto): void {
    this._detailByProductId.set(detail.overview.id, detail);
    if (detail.categories.length > 0) {
      this._categories = detail.categories;
    }
    if (detail.tags.length > 0) {
      this._tags = detail.tags;
    }
    this.upsertSummaryFromDetail(detail);
  }

  upsertSummaryFromDetail(detail: ProductDetailDto): void {
    const totalItems = detail.items.filter((entry) => entry.status !== "SOLD").length;
    const readyItems = detail.items.filter((entry) => entry.status === "READY").length;
    const nextSummary: ProductSummaryDto = {
      id: detail.overview.id,
      branchId: detail.overview.branchId,
      productCode: detail.overview.productCode,
      name: detail.overview.name,
      productCategoryId: detail.overview.productCategoryId,
      categoryName: detail.overview.categoryName,
      gender: detail.overview.gender,
      material: detail.overview.material,
      coverImagePath: detail.overview.coverImagePath,
      isActive: detail.overview.isActive,
      isArchived: detail.overview.isArchived,
      rentPricePerDay: detail.overview.rentPricePerDay,
      quickRentPrice: detail.overview.quickRentPrice,
      rentDepositAmount: detail.overview.rentDepositAmount,
      salePrice: detail.overview.salePrice,
      purchasePrice: detail.overview.purchasePrice,
      isRentable: detail.overview.isRentable,
      isSaleable: detail.overview.isSaleable,
      successfulRentCount: detail.overview.successfulRentCount,
      tags: detail.overview.tags,
      totalItems,
      readyItems,
      variantCount: detail.variants.length,
      pricePolicy: pickPricePolicyFromDetail(detail),
      updatedAt: detail.overview.updatedAt,
    };

    const index = this._listItems.findIndex((entry) => entry.id === detail.overview.id);
    if (index >= 0) {
      const next = [...this._listItems];
      next[index] = nextSummary;
      this._listItems = next;
      return;
    }

    this._listItems = [nextSummary, ...this._listItems];
    this._listTotal += 1;
  }

  removeVariantFromDetail(productId: string, variantId: string): void {
    const detail = this._detailByProductId.get(productId);
    if (!detail) return;

    const nextDetail: ProductDetailDto = {
      ...detail,
      variants: detail.variants.filter((entry) => entry.id !== variantId),
      items: detail.items.filter((entry) => entry.variantId !== variantId),
    };

    this._detailByProductId.set(productId, nextDetail);
    this.upsertSummaryFromDetail(nextDetail);
  }

  removeProductById(productId: string): void {
    const nextItems = this._listItems.filter((entry) => entry.id !== productId);
    if (nextItems.length !== this._listItems.length) {
      this._listItems = nextItems;
      this._listTotal = Math.max(0, this._listTotal - 1);
    }

    this._detailByProductId.delete(productId);
  }

  clearAll(): void {
    this._listItems = [];
    this._listTotal = 0;
    this._listPage = 1;
    this._listPageSize = 12;
    this._categories = [];
    this._tags = [];
    this._detailByProductId.clear();
  }
}

export const productsStore = ProductsStore.getInstance();
