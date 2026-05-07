import { makeAutoObservable } from "mobx";
import type {
  MakeupAdminOverviewResponse,
  MakeupArtistsResponse,
  MakeupEventsResponse,
  MakeupInventoryResponse,
  MakeupMyStatsResponse,
  MakeupOrdersResponse,
  MakeupPackagesResponse,
  MakeupPurchaseInvoicesResponse,
} from "@/types/makeupModule";

class MakeupStore {
  private static _instance: MakeupStore | null = null;

  private _events: MakeupEventsResponse | null = null;
  private _artists: MakeupArtistsResponse | null = null;
  private _packages: MakeupPackagesResponse | null = null;
  private _myStats: MakeupMyStatsResponse | null = null;
  private _inventory: MakeupInventoryResponse | null = null;
  private _orders: MakeupOrdersResponse | null = null;
  private _purchaseInvoices: MakeupPurchaseInvoicesResponse | null = null;
  private _adminOverview: MakeupAdminOverviewResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new MakeupStore();
    }
    return this._instance;
  }

  get events(): MakeupEventsResponse | null {
    return this._events;
  }

  get artists(): MakeupArtistsResponse | null {
    return this._artists;
  }

  get packages(): MakeupPackagesResponse | null {
    return this._packages;
  }

  get myStats(): MakeupMyStatsResponse | null {
    return this._myStats;
  }

  get inventory(): MakeupInventoryResponse | null {
    return this._inventory;
  }

  get orders(): MakeupOrdersResponse | null {
    return this._orders;
  }

  get purchaseInvoices(): MakeupPurchaseInvoicesResponse | null {
    return this._purchaseInvoices;
  }

  get adminOverview(): MakeupAdminOverviewResponse | null {
    return this._adminOverview;
  }

  hydrateEvents(payload: MakeupEventsResponse) {
    this._events = payload;
  }

  hydrateArtists(payload: MakeupArtistsResponse) {
    this._artists = payload;
  }

  hydratePackages(payload: MakeupPackagesResponse) {
    this._packages = payload;
  }

  hydrateMyStats(payload: MakeupMyStatsResponse) {
    this._myStats = payload;
  }

  hydrateInventory(payload: MakeupInventoryResponse) {
    this._inventory = payload;
  }

  hydrateOrders(payload: MakeupOrdersResponse) {
    this._orders = payload;
  }

  hydratePurchaseInvoices(payload: MakeupPurchaseInvoicesResponse) {
    this._purchaseInvoices = payload;
  }

  hydrateAdminOverview(payload: MakeupAdminOverviewResponse) {
    this._adminOverview = payload;
  }

  clear() {
    this._events = null;
    this._artists = null;
    this._packages = null;
    this._myStats = null;
    this._inventory = null;
    this._orders = null;
    this._purchaseInvoices = null;
    this._adminOverview = null;
  }
}

export const makeupStore = MakeupStore.getInstance();
