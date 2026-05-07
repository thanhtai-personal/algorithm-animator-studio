import { makeAutoObservable } from "mobx";
import type {
  CustomerDetailDto,
  CustomerListItemDto,
  CustomerTagDto,
  CustomersListResponse,
  CustomerTypeaheadItemDto,
  CustomersTypeaheadResponse,
} from "@/types/customersCrm";

class CustomersStore {
  private static _instance: CustomersStore | null = null;

  private _listItems: CustomerListItemDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 20;
  private _tags: CustomerTagDto[] = [];
  private _detailByCustomerId = new Map<string, CustomerDetailDto>();
  private _typeaheadItems: CustomerTypeaheadItemDto[] = [];

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new CustomersStore();
    }

    return this._instance;
  }

  get listItems(): CustomerListItemDto[] {
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

  get tags(): CustomerTagDto[] {
    return this._tags;
  }

  get typeaheadItems(): CustomerTypeaheadItemDto[] {
    return this._typeaheadItems;
  }

  getDetailByCustomerId(customerId: string): CustomerDetailDto | null {
    return this._detailByCustomerId.get(customerId) ?? null;
  }

  hydrateList(payload: CustomersListResponse): void {
    this._listItems = payload.items;
    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
    this._tags = payload.tags;
  }

  hydrateDetail(payload: CustomerDetailDto): void {
    this._detailByCustomerId.set(payload.customer.id, payload);

    if (payload.availableTags.length > 0) {
      this._tags = payload.availableTags;
    }

    this.upsertListItem(payload.customer);
  }

  hydrateTypeahead(payload: CustomersTypeaheadResponse): void {
    this._typeaheadItems = payload.items;
  }

  upsertListItem(item: CustomerListItemDto): void {
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
    this._tags = [];
    this._detailByCustomerId.clear();
    this._typeaheadItems = [];
  }
}

export const customersStore = CustomersStore.getInstance();
