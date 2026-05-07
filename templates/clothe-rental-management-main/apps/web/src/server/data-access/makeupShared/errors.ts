export type MakeupDomainErrorCode =
  | "MISSING_BRANCH_CONTEXT"
  | "FORBIDDEN_BRANCH_SCOPE"
  | "FORBIDDEN_ROLE"
  | "FORBIDDEN_ARTIST_SCOPE"
  | "MODULE_DISABLED"
  | "INVALID_DATE"
  | "INVALID_DATETIME"
  | "INVALID_DATE_RANGE"
  | "INVALID_TIME_RANGE"
  | "INVALID_SESSION_SLOT"
  | "INVALID_EVENT_STATUS"
  | "INVALID_BOOKING_INPUT"
  | "INVALID_NON_NEGATIVE_NUMBER"
  | "INVALID_DURATION_MINUTES"
  | "ARTIST_NOT_FOUND"
  | "CUSTOMER_NOT_FOUND"
  | "EVENT_NOT_FOUND"
  | "PACKAGE_NOT_FOUND"
  | "PACKAGE_CODE_DUPLICATE"
  | "PACKAGE_TABLE_UNAVAILABLE"
  | "INVENTORY_ITEM_NOT_FOUND"
  | "INVALID_SHOPEE_URL"
  | "PURCHASE_INVOICE_NOT_FOUND"
  | "PURCHASE_INVOICE_CODE_DUPLICATE"
  | "INVALID_PURCHASE_INVOICE_STATUS"
  | "INVALID_PURCHASE_INVOICE_ITEM"
  | "CONFLICT_WARNING_REQUIRED";

interface MakeupDomainErrorContext {
  [key: string]: unknown;
}

export class MakeupDomainError extends Error {
  readonly code: MakeupDomainErrorCode;
  readonly context: MakeupDomainErrorContext;

  constructor(code: MakeupDomainErrorCode, context: MakeupDomainErrorContext = {}) {
    super(code);
    this.name = "MakeupDomainError";
    this.code = code;
    this.context = context;
  }
}
