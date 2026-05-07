import { makeAutoObservable } from "mobx";
import type {
  OrderAvailabilityResponse,
  OrderDetailDto,
  OrderSummaryDto,
  OrdersListResponse,
} from "@/types/ordersDomain";

class OrdersStore {
  private static _instance: OrdersStore | null = null;

  private _listItems: OrderSummaryDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 20;
  private _detailByOrderId = new Map<string, OrderDetailDto>();
  private _lastAvailability: OrderAvailabilityResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new OrdersStore();
    }

    return this._instance;
  }

  get listItems(): OrderSummaryDto[] {
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

  getDetailByOrderId(orderId: string): OrderDetailDto | null {
    return this._detailByOrderId.get(orderId) ?? null;
  }

  get lastAvailability(): OrderAvailabilityResponse | null {
    return this._lastAvailability;
  }

  hydrateList(payload: OrdersListResponse): void {
    this._listItems = payload.items;
    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
  }

  hydrateDetail(payload: OrderDetailDto): void {
    this._detailByOrderId.set(payload.summary.id, payload);
    this.upsertSummary(payload.summary);
  }

  hydrateAvailability(payload: OrderAvailabilityResponse): void {
    this._lastAvailability = payload;
  }

  upsertSummary(summary: OrderSummaryDto): void {
    const index = this._listItems.findIndex((entry) => entry.id === summary.id);
    if (index >= 0) {
      const next = [...this._listItems];
      next[index] = summary;
      this._listItems = next;
      return;
    }

    this._listItems = [summary, ...this._listItems];
    this._listTotal += 1;
  }

  clear(): void {
    this._listItems = [];
    this._listTotal = 0;
    this._listPage = 1;
    this._listPageSize = 20;
    this._detailByOrderId.clear();
    this._lastAvailability = null;
  }
}

export const ordersStore = OrdersStore.getInstance();
