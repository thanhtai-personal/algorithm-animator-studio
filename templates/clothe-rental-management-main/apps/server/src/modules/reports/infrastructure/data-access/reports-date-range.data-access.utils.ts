import type { RevenueReportGranularity } from '../../types/reports-module.type';
import {
  DEFAULT_REPORT_RANGE_DAYS,
  DateRange,
  DateRangeBoundaries,
  MAX_REPORT_RANGE_DAYS,
  ReportsDomainError,
} from './reports-common.data-access.utils';

const DEFAULT_REVENUE_GRANULARITY: RevenueReportGranularity = 'day';

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';

  return `${year}-${month}-${day}`;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  });

  const timeZoneName =
    formatter.formatToParts(date).find((part) => part.type === 'timeZoneName')
      ?.value ?? 'GMT+0';

  const match = timeZoneName.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hour = Number.parseInt(match[2] ?? '0', 10);
  const minute = Number.parseInt(match[3] ?? '0', 10);

  return sign * (hour * 60 + minute);
}

function zonedDateTimeToUtc(options: {
  date: string;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  timeZone: string;
}): Date {
  const { date, hours, minutes, seconds, milliseconds, timeZone } = options;

  const utcGuess = new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds,
    ).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}Z`,
  );

  let resolved = utcGuess;
  for (let index = 0; index < 2; index += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(resolved, timeZone);
    resolved = new Date(utcGuess.getTime() - offsetMinutes * 60_000);
  }

  return resolved;
}

export function addDaysToIsoDate(date: string, days: number): string {
  const [yearText, monthText, dayText] = date.split('-');
  const year = Number.parseInt(yearText ?? '0', 10);
  const month = Number.parseInt(monthText ?? '0', 10);
  const day = Number.parseInt(dayText ?? '0', 10);

  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);

  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffDaysBetweenIsoDates(
  fromDate: string,
  toDate: string,
): number {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime();
  const to = new Date(`${toDate}T00:00:00Z`).getTime();

  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

function assertValidDateRange(startDate: string, endDate: string): void {
  if (startDate > endDate) {
    throw new ReportsDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
    });
  }

  const rangeDays = diffDaysBetweenIsoDates(startDate, endDate) + 1;
  if (rangeDays > MAX_REPORT_RANGE_DAYS) {
    throw new ReportsDomainError('DATE_RANGE_TOO_LARGE', {
      maxDays: MAX_REPORT_RANGE_DAYS,
      requestedDays: rangeDays,
    });
  }
}

export function resolveDateRange(options: {
  startDate: string | null;
  endDate: string | null;
  today: string;
}): DateRange {
  let startDate = options.startDate;
  let endDate = options.endDate;

  if (!startDate && !endDate) {
    endDate = options.today;
    startDate = addDaysToIsoDate(endDate, -(DEFAULT_REPORT_RANGE_DAYS - 1));
  } else if (startDate && !endDate) {
    endDate = options.today;
  } else if (!startDate && endDate) {
    startDate = addDaysToIsoDate(endDate, -(DEFAULT_REPORT_RANGE_DAYS - 1));
  }

  if (!startDate || !endDate) {
    throw new ReportsDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
    });
  }

  assertValidDateRange(startDate, endDate);

  return {
    startDate,
    endDate,
  };
}

export function buildUtcBoundaries(options: {
  startDate: string;
  endDate: string;
  timeZone: string;
}): DateRangeBoundaries {
  const start = zonedDateTimeToUtc({
    date: options.startDate,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    timeZone: options.timeZone,
  });

  const nextDate = addDaysToIsoDate(options.endDate, 1);
  const endExclusive = zonedDateTimeToUtc({
    date: nextDate,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    timeZone: options.timeZone,
  });

  return {
    startIso: start.toISOString(),
    endExclusiveIso: endExclusive.toISOString(),
  };
}

function buildDateSeries(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }

  return dates;
}

function buildMonthSeries(startDate: string, endDate: string): string[] {
  const keys: string[] = [];
  let year = Number.parseInt(startDate.slice(0, 4), 10);
  let month = Number.parseInt(startDate.slice(5, 7), 10);
  const endYear = Number.parseInt(endDate.slice(0, 4), 10);
  const endMonth = Number.parseInt(endDate.slice(5, 7), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month)) return keys;
  if (!Number.isFinite(endYear) || !Number.isFinite(endMonth)) return keys;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

function buildYearSeries(startDate: string, endDate: string): string[] {
  const keys: string[] = [];
  const startYear = Number.parseInt(startDate.slice(0, 4), 10);
  const endYear = Number.parseInt(endDate.slice(0, 4), 10);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return keys;

  for (let year = startYear; year <= endYear; year += 1) {
    keys.push(String(year));
  }

  return keys;
}

export function normalizeRevenueGranularity(
  value: RevenueReportGranularity | null | undefined,
): RevenueReportGranularity {
  if (!value) return DEFAULT_REVENUE_GRANULARITY;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'month') return 'month';
  if (normalized === 'year') return 'year';
  return 'day';
}

export function buildRevenueSeriesKeys(options: {
  dateRange: DateRange;
  granularity: RevenueReportGranularity;
}): string[] {
  if (options.granularity === 'month') {
    return buildMonthSeries(
      options.dateRange.startDate,
      options.dateRange.endDate,
    );
  }

  if (options.granularity === 'year') {
    return buildYearSeries(
      options.dateRange.startDate,
      options.dateRange.endDate,
    );
  }

  return buildDateSeries(
    options.dateRange.startDate,
    options.dateRange.endDate,
  );
}

function toLocalIsoDate(isoDateTime: string, timeZone: string): string {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime.slice(0, 10);
  }

  return formatDateInTimeZone(parsed, timeZone);
}

export function toRevenueBucketKey(options: {
  isoDateTime: string;
  timeZone: string;
  granularity: RevenueReportGranularity;
}): string {
  const localDate = toLocalIsoDate(options.isoDateTime, options.timeZone);
  if (options.granularity === 'month') {
    return localDate.slice(0, 7);
  }

  if (options.granularity === 'year') {
    return localDate.slice(0, 4);
  }

  return localDate;
}
