import { makeAutoObservable } from "mobx";
import type {
  PaymentDailyCashbookRowDto,
  PaymentListItemDto,
  PaymentsListResponse,
  PaymentsTotalsDto,
} from "@/types/paymentsDomain";

function createEmptyTotals(): PaymentsTotalsDto {
  return {
    postedCount: 0,
    byMethod: {
      CASH: 0,
      BANK: 0,
      MOMO: 0,
    },
    byType: {
      RENT: 0,
      DEPOSIT: 0,
      FEE: 0,
      REFUND: 0,
      EXPENSE: 0,
    },
    grossInflow: 0,
    grossRefund: 0,
    netTotal: 0,
  };
}

class PaymentsStore {
  private static _instance: PaymentsStore | null = null;

  private _listItems: PaymentListItemDto[] = [];
  private _listTotal = 0;
  private _listPage = 1;
  private _listPageSize = 20;
  private _totals: PaymentsTotalsDto = createEmptyTotals();
  private _dailyCashbook: PaymentDailyCashbookRowDto[] = [];

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new PaymentsStore();
    }

    return this._instance;
  }

  get listItems(): PaymentListItemDto[] {
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

  get totals(): PaymentsTotalsDto {
    return this._totals;
  }

  get dailyCashbook(): PaymentDailyCashbookRowDto[] {
    return this._dailyCashbook;
  }

  hydrateList(payload: PaymentsListResponse): void {
    this._listItems = payload.items;
    this._listTotal = payload.total;
    this._listPage = payload.page;
    this._listPageSize = payload.pageSize;
    this._totals = payload.totals;
    this._dailyCashbook = payload.dailyCashbook;
  }

  upsertListItem(item: PaymentListItemDto): void {
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
    this._totals = createEmptyTotals();
    this._dailyCashbook = [];
  }
}

export const paymentsStore = PaymentsStore.getInstance();
