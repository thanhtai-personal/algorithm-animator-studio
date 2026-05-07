import { makeAutoObservable } from "mobx";
import type {
  IncidentsReportResponse,
  RevenueReportResponse,
  UtilizationReportResponse,
} from "@/types/reportsModule";

class ReportsStore {
  private static _instance: ReportsStore | null = null;

  private _revenueReport: RevenueReportResponse | null = null;
  private _utilizationReport: UtilizationReportResponse | null = null;
  private _incidentsReport: IncidentsReportResponse | null = null;

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new ReportsStore();
    }

    return this._instance;
  }

  get revenueReport(): RevenueReportResponse | null {
    return this._revenueReport;
  }

  get utilizationReport(): UtilizationReportResponse | null {
    return this._utilizationReport;
  }

  get incidentsReport(): IncidentsReportResponse | null {
    return this._incidentsReport;
  }

  hydrateRevenueReport(payload: RevenueReportResponse): void {
    this._revenueReport = payload;
  }

  hydrateUtilizationReport(payload: UtilizationReportResponse): void {
    this._utilizationReport = payload;
  }

  hydrateIncidentsReport(payload: IncidentsReportResponse): void {
    this._incidentsReport = payload;
  }

  clear(): void {
    this._revenueReport = null;
    this._utilizationReport = null;
    this._incidentsReport = null;
  }
}

export const reportsStore = ReportsStore.getInstance();
