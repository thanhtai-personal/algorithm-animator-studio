import type { DashboardDomainErrorCode, DashboardDomainErrorContext } from "./types";

export class DashboardDomainError extends Error {
  readonly code: DashboardDomainErrorCode;
  readonly context: DashboardDomainErrorContext;

  constructor(
    code: DashboardDomainErrorCode,
    context: DashboardDomainErrorContext = {},
  ) {
    super(code);
    this.name = "DashboardDomainError";
    this.code = code;
    this.context = context;
  }
}