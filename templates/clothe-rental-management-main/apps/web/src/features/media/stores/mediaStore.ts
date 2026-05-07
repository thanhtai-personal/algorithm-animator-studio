import { makeAutoObservable } from "mobx";
import type { MediaAssetDto, MediaAssetType, MediaListResponse, MediaUsageDto } from "@/types/mediaLibrary";

interface MediaStoreListScope {
  search?: string | null;
  mediaType?: MediaAssetType | null;
}

class MediaStore {
  private static _instance: MediaStore | null = null;

  private _branchId: string | null = null;
  private _items: MediaAssetDto[] = [];
  private _total = 0;
  private _page = 1;
  private _pageSize = 24;
  private _search: string | null = null;
  private _mediaType: MediaAssetType | null = null;
  private _usage: MediaUsageDto | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new MediaStore();
    }

    return this._instance;
  }

  get branchId(): string | null {
    return this._branchId;
  }

  get items(): MediaAssetDto[] {
    return this._items;
  }

  get total(): number {
    return this._total;
  }

  get page(): number {
    return this._page;
  }

  get pageSize(): number {
    return this._pageSize;
  }

  get search(): string | null {
    return this._search;
  }

  get mediaType(): MediaAssetType | null {
    return this._mediaType;
  }

  get usage(): MediaUsageDto | null {
    return this._usage;
  }

  hydrateList(payload: MediaListResponse, scope: MediaStoreListScope = {}): void {
    this._branchId = payload.branchId;
    this._items = payload.items;
    this._total = payload.total;
    this._page = payload.page;
    this._pageSize = payload.pageSize;
    this._search = scope.search?.trim() || null;
    this._mediaType = scope.mediaType ?? null;
    this._usage = payload.usage;
  }

  upsertAsset(asset: MediaAssetDto): void {
    const index = this._items.findIndex((entry) => entry.id === asset.id);
    if (index >= 0) {
      const next = [...this._items];
      next[index] = asset;
      this._items = next;
      return;
    }

    this._items = [asset, ...this._items];
    this._total += 1;
  }

  removeAssetById(mediaAssetId: string): void {
    const next = this._items.filter((entry) => entry.id !== mediaAssetId);
    if (next.length === this._items.length) return;

    this._items = next;
    this._total = Math.max(0, this._total - 1);
  }

  setUsage(usage: MediaUsageDto): void {
    this._usage = usage;
  }

  clear(): void {
    this._branchId = null;
    this._items = [];
    this._total = 0;
    this._page = 1;
    this._pageSize = 24;
    this._search = null;
    this._mediaType = null;
    this._usage = null;
  }
}

export const mediaStore = MediaStore.getInstance();
