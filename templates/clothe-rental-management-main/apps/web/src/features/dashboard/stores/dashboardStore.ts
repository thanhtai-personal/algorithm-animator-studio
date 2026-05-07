import { makeAutoObservable } from "mobx";
import type { DashboardOverviewResponse } from "@/types/dashboardOverview";
import type { RevenueReportResponse } from "@/types/reportsModule";

class DashboardStore {
  private static _instance: DashboardStore | null = null;

  private _overview: DashboardOverviewResponse | null = null;
  private _financialRevenueReport: RevenueReportResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new DashboardStore();
    }

    return this._instance;
  }

  get overview(): DashboardOverviewResponse | null {
    return this._overview;
  }

  get financialRevenueReport(): RevenueReportResponse | null {
    return this._financialRevenueReport;
  }

  hydrateOverview(payload: DashboardOverviewResponse): void {
    this._overview = payload;
  }

  hydrateFinancialRevenueReport(payload: RevenueReportResponse): void {
    this._financialRevenueReport = payload;
  }

  clear(): void {
    this._overview = null;
    this._financialRevenueReport = null;
  }
}

export const dashboardStore = DashboardStore.getInstance();
