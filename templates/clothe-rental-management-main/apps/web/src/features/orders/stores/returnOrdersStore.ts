import { makeAutoObservable } from "mobx";
import type {
  ReturnOrderDetailDto,
  ReturnOrderSourceItemDto,
  ReturnOrderSourcesResponse,
} from "@/types/returnOrdersDomain";

class ReturnOrdersStore {
  private static _instance: ReturnOrdersStore | null = null;

  private _sources: ReturnOrderSourceItemDto[] = [];
  private _sourcesTotal = 0;
  private _sourcesPage = 1;
  private _sourcesPageSize = 20;
  private _detailById = new Map<string, ReturnOrderDetailDto>();

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ReturnOrdersStore();
    }

    return this._instance;
  }

  get sources(): ReturnOrderSourceItemDto[] {
    return this._sources;
  }

  get sourcesTotal(): number {
    return this._sourcesTotal;
  }

  get sourcesPage(): number {
    return this._sourcesPage;
  }

  get sourcesPageSize(): number {
    return this._sourcesPageSize;
  }

  getDetailById(returnOrderId: string): ReturnOrderDetailDto | null {
    return this._detailById.get(returnOrderId) ?? null;
  }

  hydrateSources(payload: ReturnOrderSourcesResponse): void {
    this._sources = payload.items;
    this._sourcesTotal = payload.total;
    this._sourcesPage = payload.page;
    this._sourcesPageSize = payload.pageSize;
  }

  hydrateDetail(payload: ReturnOrderDetailDto): void {
    this._detailById.set(payload.summary.id, payload);
  }

  clear(): void {
    this._sources = [];
    this._sourcesTotal = 0;
    this._sourcesPage = 1;
    this._sourcesPageSize = 20;
    this._detailById.clear();
  }
}

export const returnOrdersStore = ReturnOrdersStore.getInstance();
