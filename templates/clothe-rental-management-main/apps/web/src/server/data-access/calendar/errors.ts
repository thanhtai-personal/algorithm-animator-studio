// filepath: apps/web/src/server/data-access/calendar/errors.ts
import type { CalendarDomainErrorCode, CalendarDomainErrorContext } from "./types";

export class CalendarDomainError extends Error {
  readonly code: CalendarDomainErrorCode;
  readonly context: CalendarDomainErrorContext;

  constructor(code: CalendarDomainErrorCode, context: CalendarDomainErrorContext = {}) {
    super(code);
    this.name = "CalendarDomainError";
    this.code = code;
    this.context = context;
  }
}