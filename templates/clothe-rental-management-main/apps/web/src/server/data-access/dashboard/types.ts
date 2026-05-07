export type DashboardDomainErrorCode =
  | "MISSING_BRANCH_CONTEXT"
  | "FORBIDDEN_BRANCH_SCOPE"
  | "FORBIDDEN_MANAGER_ACTION";

export interface DashboardDomainErrorContext {
  [key: string]: unknown;
}