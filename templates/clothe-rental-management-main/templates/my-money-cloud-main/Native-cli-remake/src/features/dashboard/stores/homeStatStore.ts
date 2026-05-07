import { makeAutoObservable } from "mobx";

export class HomeStatStore {
  categoryStats: Record<string, any> = {};
  allStats: Record<string, any> = {};
  selectedMonth: Date = new Date();
  loading = false;
  balanceLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setCategoryStats(stats: Record<string, any>) {
    this.categoryStats = stats;
  }

  setAllStats(stats: Record<string, any>) {
    this.allStats = stats;
  }

  setSelectedMonth(month: Date) {
    this.selectedMonth = month;
  }

  setLoading(val: boolean) {
    this.loading = val;
  }

  setBalanceLoading(val: boolean) {
    this.balanceLoading = val;
  }
}

export const homeStatStore = new HomeStatStore();
