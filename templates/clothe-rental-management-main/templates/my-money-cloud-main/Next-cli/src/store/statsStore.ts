import { makeAutoObservable } from "mobx";
import type { DateRange } from "react-day-picker";
import type { StatsSummary } from "@/types/stats";
import type { DashboardStats, Transaction } from "@/features/transactions/types";

export type PeriodMode = "day" | "month" | "year";
export type CategoryChartMode = "pie" | "bar";

class StatsStore {
  current: DashboardStats | null = null;
  previous: DashboardStats | null = null;
  loading = false;
  error: string | null = null;
  lastUpdated: number | null = null;
  summaryRange: DateRange | undefined = undefined;
  periodRange: DateRange | undefined = undefined;
  categoryRange: DateRange | undefined = undefined;
  periodMode: PeriodMode = "day";
  categoryChartMode: CategoryChartMode = "pie";
  listRange: DateRange | undefined = undefined;
  selectedCategoryIds: string[] = ["all"];
  listPage = 1;
  detailTransaction: Transaction | null = null;

  private static _instance: StatsStore | null = null;
  private constructor() {
    makeAutoObservable(this);
  }
  static getInstance(): StatsStore {
    if (!StatsStore._instance) {
      StatsStore._instance = new StatsStore();
    }
    return StatsStore._instance;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setSummary(summary: StatsSummary) {
    this.current = summary.current;
    this.previous = summary.previous;
    this.loading = false;
    this.error = null;
    this.lastUpdated = Date.now();
  }

  setError(message: string) {
    this.error = message;
    this.loading = false;
  }

  setSummaryRange(range: DateRange | undefined) {
    this.summaryRange = range;
  }

  setPeriodRange(range: DateRange | undefined) {
    this.periodRange = range;
  }

  setCategoryRange(range: DateRange | undefined) {
    this.categoryRange = range;
  }

  setPeriodMode(mode: PeriodMode) {
    this.periodMode = mode;
  }

  setCategoryChartMode(mode: CategoryChartMode) {
    this.categoryChartMode = mode;
  }

  setListRange(range: DateRange | undefined) {
    this.listRange = range;
    this.listPage = 1;
  }

  setSelectedCategoryIds(ids: string[]) {
    this.selectedCategoryIds = ids.length ? ids : ["all"];
    this.listPage = 1;
  }

  setListPage(page: number) {
    this.listPage = page;
  }

  setDetailTransaction(transaction: Transaction | null) {
    this.detailTransaction = transaction;
  }

  clear() {
    this.current = null;
    this.previous = null;
    this.error = null;
    this.loading = false;
    this.lastUpdated = null;
    this.summaryRange = undefined;
    this.periodRange = undefined;
    this.categoryRange = undefined;
    this.periodMode = "day";
    this.categoryChartMode = "pie";
    this.listRange = undefined;
    this.selectedCategoryIds = ["all"];
    this.listPage = 1;
    this.detailTransaction = null;
  }
}

export const statsStore = StatsStore.getInstance();
export type { StatsSummary };
