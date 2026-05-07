import { rentalRevenueStore } from "@/features/rental-revenue/stores/rentalRevenueStore";
import {
  useRentalRevenueAccessQuery,
  useRentalRevenueOrdersQuery,
  useRentalRevenueOverviewQuery,
  useRentalRevenueReportQuery,
} from "@/features/rental-revenue/queries/useRentalRevenueQueries";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";

function parseDateTranscript(transcript: string): string {
  const normalized = transcript.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

  const slashMatch = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return normalized;
}

export function useRentalRevenuePage() {
  const accessToken = zaloMiniAppAuthStore.accessToken;
  const store = rentalRevenueStore;

  const accessQuery = useRentalRevenueAccessQuery(accessToken);
  const overviewQuery = useRentalRevenueOverviewQuery(accessToken, store.branchId);
  const reportQuery = useRentalRevenueReportQuery(
    accessToken,
    store.branchId,
    store.startDate,
    store.endDate,
    store.granularity
  );
  const ordersQuery = useRentalRevenueOrdersQuery(
    accessToken,
    store.branchId,
    store.managedOrderStatusFilter
  );

  const handleDateTranscript = (field: "startDate" | "endDate", transcript: string) => {
    store.openVoiceReview({
      field,
      transcript,
      suggestedValue: parseDateTranscript(transcript),
    });
  };

  return {
    store,
    accessQuery,
    overviewQuery,
    reportQuery,
    ordersQuery,
    handleDateTranscript,
  };
}
