import { makeAutoObservable } from "mobx";
import type {
  DashboardOrderRowDto,
  DashboardOverviewResponse,
  RevenueReportGranularity,
  RevenueReportResponse,
  ZaloMiniAppRentalAccessDto,
} from "@/lib/contracts";

const STORAGE_KEY = "kata-rental-revenue-filter";
const ALL_ORDER_STATUS_VALUE = "__ALL__";

export interface RevenueVoiceReviewDraft {
  field: "startDate" | "endDate";
  transcript: string;
  suggestedValue: string;
}

interface PersistedRevenueFilter {
  branchId: string | null;
  startDate: string;
  endDate: string;
  granularity: RevenueReportGranularity;
}

function todayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonthValue(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

class RentalRevenueStore {
  access: ZaloMiniAppRentalAccessDto | null = null;
  branchId: string | null = null;
  startDate = startOfMonthValue();
  endDate = todayValue();
  granularity: RevenueReportGranularity = "day";
  overview: DashboardOverviewResponse | null = null;
  report: RevenueReportResponse | null = null;
  managedOrders: DashboardOrderRowDto[] = [];
  managedOrderStatusFilter = ALL_ORDER_STATUS_VALUE;
  voiceReview: RevenueVoiceReviewDraft | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.hydrateFromStorage();
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    const payload: PersistedRevenueFilter = {
      branchId: this.branchId,
      startDate: this.startDate,
      endDate: this.endDate,
      granularity: this.granularity,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  private hydrateFromStorage(): void {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<PersistedRevenueFilter>;
      this.branchId = parsed.branchId ?? null;
      this.startDate = parsed.startDate ?? this.startDate;
      this.endDate = parsed.endDate ?? this.endDate;
      this.granularity =
        parsed.granularity === "month" || parsed.granularity === "year"
          ? parsed.granularity
          : "day";
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  hydrateAccess(access: ZaloMiniAppRentalAccessDto): void {
    const previousProfileId = this.access?.profileId ?? null;
    const hasCurrentBranch =
      this.branchId !== null && access.branches.some((branch) => branch.id === this.branchId);

    this.access = access;
    if (previousProfileId !== access.profileId || !hasCurrentBranch) {
      this.branchId = access.branchId;
      this.overview = null;
      this.report = null;
      this.managedOrders = [];
    }
    this.persist();
  }

  hydrateOverview(overview: DashboardOverviewResponse | null): void {
    this.overview = overview;
  }

  hydrateReport(report: RevenueReportResponse | null): void {
    this.report = report;
  }

  hydrateManagedOrders(items: DashboardOrderRowDto[]): void {
    this.managedOrders = items;
  }

  setManagedOrderStatusFilter(value: string): void {
    this.managedOrderStatusFilter = value;
    this.managedOrders = [];
  }

  setBranchId(branchId: string): void {
    this.branchId = branchId;
    this.overview = null;
    this.report = null;
    this.managedOrders = [];
    this.persist();
  }

  setStartDate(value: string): void {
    this.startDate = value;
    this.report = null;
    this.persist();
  }

  setEndDate(value: string): void {
    this.endDate = value;
    this.report = null;
    this.persist();
  }

  setGranularity(value: RevenueReportGranularity): void {
    this.granularity = value;
    this.report = null;
    this.persist();
  }

  openVoiceReview(review: RevenueVoiceReviewDraft): void {
    this.voiceReview = review;
  }

  dismissVoiceReview(): void {
    this.voiceReview = null;
  }

  applyVoiceReview(): void {
    if (!this.voiceReview) return;
    if (this.voiceReview.field === "startDate") {
      this.startDate = this.voiceReview.suggestedValue;
    }
    if (this.voiceReview.field === "endDate") {
      this.endDate = this.voiceReview.suggestedValue;
    }
    this.report = null;
    this.voiceReview = null;
    this.persist();
  }
}

export const rentalRevenueStore = new RentalRevenueStore();
