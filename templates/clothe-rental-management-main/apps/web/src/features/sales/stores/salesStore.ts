import { makeAutoObservable } from "mobx";
import type { SalesShiftDto } from "@/types/salesDesk";
import type { ProductDetailDto } from "@/types/productsCatalog";
import type { SalesProductsCatalogResponse } from "@/types/salesProductEntry";

class SalesStore {
  private static _instance: SalesStore | null = null;

  private _currentShift: SalesShiftDto | null = null;
  private _productEntryCatalog: SalesProductsCatalogResponse | null = null;
  private _lastCreatedProductDetail: ProductDetailDto | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new SalesStore();
    }

    return this._instance;
  }

  get currentShift(): SalesShiftDto | null {
    return this._currentShift;
  }

  get productEntryCatalog(): SalesProductsCatalogResponse | null {
    return this._productEntryCatalog;
  }

  get lastCreatedProductDetail(): ProductDetailDto | null {
    return this._lastCreatedProductDetail;
  }

  hydrateCurrentShift(shift: SalesShiftDto | null): void {
    this._currentShift = shift;
  }

  hydrateProductEntryCatalog(payload: SalesProductsCatalogResponse): void {
    this._productEntryCatalog = payload;
  }

  hydrateLastCreatedProductDetail(detail: ProductDetailDto | null): void {
    this._lastCreatedProductDetail = detail;
  }

  clear(): void {
    this._currentShift = null;
    this._productEntryCatalog = null;
    this._lastCreatedProductDetail = null;
  }
}

export const salesStore = SalesStore.getInstance();
