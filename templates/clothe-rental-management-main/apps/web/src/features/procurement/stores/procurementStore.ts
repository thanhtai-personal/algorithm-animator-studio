import { makeAutoObservable } from "mobx";
import type {
  ProcurementCategoryOptionDto,
  ProcurementImportCommitResponse,
  ProcurementImportValidationResponse,
  ProcurementListResponse,
  ProcurementProductOptionDto,
  ProcurementReceiptDetailDto,
  ProcurementReceiptSummaryDto,
} from "@/types/procurement";

class ProcurementStore {
  private static _instance: ProcurementStore | null = null;

  private _listItems: ProcurementReceiptSummaryDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 20;

  private _productOptions: ProcurementProductOptionDto[] = [];
  private _categoryOptions: ProcurementCategoryOptionDto[] = [];
  private _lastCreatedReceipt: ProcurementReceiptDetailDto | null = null;
  private _lastImportValidation: ProcurementImportValidationResponse | null = null;
  private _lastImportCommitResult: ProcurementImportCommitResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ProcurementStore();
    }

    return this._instance;
  }

  get listItems() {
    return this._listItems;
  }

  get listTotal() {
    return this._listTotal;
  }

  get listPage() {
    return this._listPage;
  }

  get listPageSize() {
    return this._listPageSize;
  }

  get productOptions() {
    return this._productOptions;
  }

  get categoryOptions() {
    return this._categoryOptions;
  }

  get lastCreatedReceipt() {
    return this._lastCreatedReceipt;
  }

  get lastImportValidation() {
    return this._lastImportValidation;
  }

  get lastImportCommitResult() {
    return this._lastImportCommitResult;
  }

  hydrateList(payload: ProcurementListResponse) {
    this._listItems = payload.items;
    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
  }

  hydrateProductOptions(items: ProcurementProductOptionDto[]) {
    this._productOptions = items;
  }

  hydrateCategoryOptions(items: ProcurementCategoryOptionDto[]) {
    this._categoryOptions = items;
  }

  hydrateLastCreatedReceipt(payload: ProcurementReceiptDetailDto | null) {
    this._lastCreatedReceipt = payload;
  }

  hydrateImportValidation(payload: ProcurementImportValidationResponse | null) {
    this._lastImportValidation = payload;
  }

  hydrateImportCommitResult(payload: ProcurementImportCommitResponse | null) {
    this._lastImportCommitResult = payload;
  }

  clear() {
    this._listItems = [];
    this._listTotal = 0;
    this._listPage = 1;
    this._listPageSize = 20;
    this._productOptions = [];
    this._categoryOptions = [];
    this._lastCreatedReceipt = null;
    this._lastImportValidation = null;
    this._lastImportCommitResult = null;
  }
}

export const procurementStore = ProcurementStore.getInstance();
