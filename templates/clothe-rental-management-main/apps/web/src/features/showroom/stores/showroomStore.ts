import { makeAutoObservable } from "mobx";
import { SHOWROOM_DEFAULT_PAGE_SIZE, SHOWROOM_SHORTLIST_STORAGE_KEY } from "@/features/showroom/constants";
import type { ShowroomShortlistItem } from "@/features/showroom/types/showroom";
import type {
  ProductCategoryDto,
  ProductTagDto,
  ShowroomProductCardDto,
  ShowroomProductDetailDto,
  ShowroomProductsResponse,
} from "@/types/productsCatalog";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

function readShortlistFromStorage(): ShowroomShortlistItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SHOWROOM_SHORTLIST_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const output: ShowroomShortlistItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;

      const record = entry as Record<string, unknown>;
      const productId = typeof record.productId === "string" ? record.productId.trim() : "";
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const addedAt = typeof record.addedAt === "string" ? record.addedAt.trim() : "";
      if (!productId || !title || !addedAt) continue;

      output.push({
        productId,
        title,
        coverImagePath:
          typeof record.coverImagePath === "string" ? record.coverImagePath : null,
        categoryName:
          typeof record.categoryName === "string" ? record.categoryName : null,
        price1d:
          typeof record.price1d === "number" && Number.isFinite(record.price1d)
            ? record.price1d
            : null,
        note: typeof record.note === "string" ? record.note : "",
        addedAt,
      });
    }

    return output;
  } catch {
    return [];
  }
}

class ShowroomStore {
  private static _instance: ShowroomStore | null = null;

  private _config: PublicShowroomPageConfigDto | null = null;

  private _listItems: ShowroomProductCardDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = SHOWROOM_DEFAULT_PAGE_SIZE;
  private _categories: ProductCategoryDto[] = [];
  private _tags: ProductTagDto[] = [];

  private _detailByProductId = new Map<string, ShowroomProductDetailDto>();

  private _shortlistByProductId = new Map<string, ShowroomShortlistItem>();
  private _isShortlistHydrated = false;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ShowroomStore();
    }

    return this._instance;
  }

  get config(): PublicShowroomPageConfigDto | null {
    return this._config;
  }

  get listItems(): ShowroomProductCardDto[] {
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

  get shortlistItems(): ShowroomShortlistItem[] {
    return Array.from(this._shortlistByProductId.values()).sort((a, b) =>
      b.addedAt.localeCompare(a.addedAt)
    );
  }

  get shortlistCount(): number {
    return this._shortlistByProductId.size;
  }

  get isShortlistHydrated(): boolean {
    return this._isShortlistHydrated;
  }

  getDetailByProductId(productId: string): ShowroomProductDetailDto | null {
    return this._detailByProductId.get(productId) ?? null;
  }

  hydrateConfig(payload: PublicShowroomPageConfigDto | null): void {
    this._config = payload;
  }

  hydrateList(payload: ShowroomProductsResponse, options?: { append?: boolean }): void {
    const append = options?.append ?? false;

    if (append) {
      const byId = new Map(this._listItems.map((entry) => [entry.id, entry]));
      for (const item of payload.items) {
        byId.set(item.id, item);
      }
      this._listItems = Array.from(byId.values());
    } else {
      this._listItems = payload.items;
    }

    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
    this._categories = payload.categories;
    this._tags = payload.tags;
  }

  hydrateDetail(payload: ShowroomProductDetailDto): void {
    this._detailByProductId.set(payload.id, payload);
  }

  ensureShortlistHydrated(): void {
    if (this._isShortlistHydrated) return;

    const shortlist = readShortlistFromStorage();
    this._shortlistByProductId = new Map(
      shortlist.map((entry) => [entry.productId, entry])
    );
    this._isShortlistHydrated = true;
  }

  isShortlisted(productId: string): boolean {
    return this._shortlistByProductId.has(productId);
  }

  toggleShortlistFromCard(card: ShowroomProductCardDto): void {
    this.ensureShortlistHydrated();

    if (this._shortlistByProductId.has(card.id)) {
      this._shortlistByProductId.delete(card.id);
      this.persistShortlist();
      return;
    }

    this._shortlistByProductId.set(card.id, {
      productId: card.id,
      title: card.title,
      coverImagePath: card.coverImagePath,
      categoryName: card.categoryName,
      price1d:
        typeof card.rentPricePerDay === "number" && Number.isFinite(card.rentPricePerDay)
          ? card.rentPricePerDay
          : typeof card.pricePlan.pricePerDay === "number" && Number.isFinite(card.pricePlan.pricePerDay)
            ? card.pricePlan.pricePerDay
            : typeof card.pricePlan.price1d === "number" && Number.isFinite(card.pricePlan.price1d)
              ? card.pricePlan.price1d
          : null,
      note: "",
      addedAt: new Date().toISOString(),
    });
    this.persistShortlist();
  }

  toggleShortlistFromDetail(detail: ShowroomProductDetailDto): void {
    this.ensureShortlistHydrated();

    if (this._shortlistByProductId.has(detail.id)) {
      this._shortlistByProductId.delete(detail.id);
      this.persistShortlist();
      return;
    }

    this._shortlistByProductId.set(detail.id, {
      productId: detail.id,
      title: detail.title,
      coverImagePath: detail.coverImagePath,
      categoryName: detail.categoryName,
      price1d:
        typeof detail.rentPricePerDay === "number" && Number.isFinite(detail.rentPricePerDay)
          ? detail.rentPricePerDay
          : typeof detail.pricePlan.pricePerDay === "number" && Number.isFinite(detail.pricePlan.pricePerDay)
            ? detail.pricePlan.pricePerDay
            : typeof detail.pricePlan.price1d === "number" && Number.isFinite(detail.pricePlan.price1d)
              ? detail.pricePlan.price1d
          : null,
      note: "",
      addedAt: new Date().toISOString(),
    });
    this.persistShortlist();
  }

  updateShortlistNote(productId: string, note: string): void {
    this.ensureShortlistHydrated();

    const current = this._shortlistByProductId.get(productId);
    if (!current) return;

    this._shortlistByProductId.set(productId, {
      ...current,
      note,
    });

    this.persistShortlist();
  }

  removeShortlist(productId: string): void {
    this.ensureShortlistHydrated();
    this._shortlistByProductId.delete(productId);
    this.persistShortlist();
  }

  clearShortlist(): void {
    this.ensureShortlistHydrated();
    this._shortlistByProductId.clear();
    this.persistShortlist();
  }

  private persistShortlist(): void {
    if (typeof window === "undefined") return;

    const payload = JSON.stringify(Array.from(this._shortlistByProductId.values()));
    window.localStorage.setItem(SHOWROOM_SHORTLIST_STORAGE_KEY, payload);
  }
}

export const showroomStore = ShowroomStore.getInstance();
