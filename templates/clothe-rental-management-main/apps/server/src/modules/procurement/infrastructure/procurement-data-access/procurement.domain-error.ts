export type ProcurementDomainErrorCode =
  | 'FORBIDDEN_PROCUREMENT_ACCESS'
  | 'FORBIDDEN_PROCUREMENT_ROLLBACK'
  | 'MISSING_BRANCH_CONTEXT'
  | 'FORBIDDEN_BRANCH_SCOPE'
  | 'INVALID_DATE_RANGE'
  | 'INVALID_INTAKE_CHANNEL'
  | 'INVALID_PAYMENT_METHOD'
  | 'INVALID_PAYMENT_AMOUNT'
  | 'INVALID_LINE_PAYLOAD'
  | 'PRODUCT_NOT_FOUND'
  | 'RECEIPT_NOT_FOUND'
  | 'IMPORT_FILE_EMPTY'
  | 'IMPORT_FILE_INVALID'
  | 'IMPORT_SHEET_MISSING'
  | 'IMPORT_TEMPLATE_INVALID'
  | 'IMPORT_VALIDATION_FAILED'
  | 'CATEGORY_NOT_FOUND'
  | 'PROCUREMENT_RECEIPT_IMMUTABLE'
  | 'PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK'
  | 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH'
  | 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED'
  | 'PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE';

export interface ProcurementDomainErrorContext {
  [key: string]: unknown;
}

export class ProcurementDomainError extends Error {
  readonly code: ProcurementDomainErrorCode;
  readonly context: ProcurementDomainErrorContext;

  constructor(
    code: ProcurementDomainErrorCode,
    context: ProcurementDomainErrorContext = {},
  ) {
    super(code);
    this.name = 'ProcurementDomainError';
    this.code = code;
    this.context = context;
  }
}

export function toErrorRecord(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== 'object') return null;
  return error as Record<string, unknown>;
}

export function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  const record = toErrorRecord(error);
  if (!record) return null;
  const message = record.message;
  return typeof message === 'string' && message.trim().length > 0
    ? message
    : null;
}
