import type { OrderIncidentType } from "@/types/ordersDomain";

export const REPORTS_FEATURE_KEY = "reports";
export const REPORTS_DEFAULT_RANGE_DAYS = 30;

export const REPORTS_INCIDENT_TYPE_FILTERS: OrderIncidentType[] = [
  "LATE",
  "DAMAGE",
  "LOST",
  "CLEANING",
];
