import type { DashboardStats } from "@/features/transactions/types";

export interface StatsSummary {
  current: DashboardStats;
  previous: DashboardStats;
}
