import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { getAuthenticatedSupabaseClient } from '../../../common/supabase/request-authenticated-client.util';

import {
  exportIncidentsCsvForAdmin,
  exportRevenueCsvForAdmin,
  exportUtilizationCsvForAdmin,
  getIncidentsReportForAdmin,
  getRevenueReportForAdmin,
  getUtilizationReportForAdmin,
  ReportsDomainError,
} from '../infrastructure/reports.data-access';
import type { OrderIncidentType } from '../../orders/types/orders-domain.type';
import type { RevenueReportGranularity } from '../types/reports-module.type';

const ORDER_INCIDENT_TYPE_SET = new Set<string>([
  'LATE',
  'DAMAGE',
  'LOST',
  'CLEANING',
]);
const REVENUE_GRANULARITY_SET = new Set<RevenueReportGranularity>([
  'day',
  'month',
  'year',
]);

export interface ReportsApiResult {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  isRaw?: boolean;
}

function jsonResult(
  body: unknown,
  init?: { status?: number },
): ReportsApiResult {
  return {
    status: init?.status ?? 200,
    body,
  };
}

function rawResult(
  body: string | ArrayBuffer,
  init?: { status?: number; headers?: Record<string, string> },
): ReportsApiResult {
  return {
    status: init?.status ?? 200,
    body,
    headers: init?.headers,
    isRaw: true,
  };
}

function getSearchParams(request: Request): URLSearchParams {
  const sourceUrl =
    (typeof request.originalUrl === 'string' && request.originalUrl) ||
    request.url ||
    '/';
  return new URL(sourceUrl, 'http://localhost').searchParams;
}

function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function parseIncidentType(value: unknown): OrderIncidentType | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!ORDER_INCIDENT_TYPE_SET.has(normalized)) return null;
  return normalized as OrderIncidentType;
}

function parseRevenueGranularity(
  value: unknown,
): RevenueReportGranularity | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!REVENUE_GRANULARITY_SET.has(normalized as RevenueReportGranularity))
    return null;
  return normalized as RevenueReportGranularity;
}

async function getAuthedClient(request: Request) {
  const { supabase, userId } = await getAuthenticatedSupabaseClient(request);
  return {
    supabase,
    profileId: userId,
  };
}

function unauthorizedResponse() {
  return jsonResult({ error: 'Unauthorized' }, { status: 401 });
}

function mapDomainError(error: unknown): ReportsApiResult {
  if (error instanceof ReportsDomainError) {
    const withContext =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'INVALID_DATE_RANGE' ||
      error.code === 'DATE_RANGE_TOO_LARGE' ||
      error.code === 'INVALID_INCIDENT_TYPE'
    ) {
      return jsonResult(withContext, { status: 400 });
    }

    if (
      error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
      error.code === 'FORBIDDEN_MANAGER_ACTION' ||
      error.code === 'FORBIDDEN_REPORT_EXPORT'
    ) {
      return jsonResult(withContext, { status: 403 });
    }

    if (error.code === 'MISSING_BRANCH_CONTEXT') {
      return jsonResult(withContext, { status: 409 });
    }

    return jsonResult(withContext, { status: 400 });
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return jsonResult({ error: message }, { status: 500 });
}

export async function handleGetRevenueReport(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const granularityRaw = searchParams.get('granularity');
    const granularity = granularityRaw
      ? parseRevenueGranularity(granularityRaw)
      : null;
    if (granularityRaw && !granularity) {
      return jsonResult(
        { error: 'granularity must be one of: day, month, year' },
        { status: 400 },
      );
    }

    const payload = await getRevenueReportForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        granularity,
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleExportRevenueCsv(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const granularityRaw = searchParams.get('granularity');
    const granularity = granularityRaw
      ? parseRevenueGranularity(granularityRaw)
      : null;
    if (granularityRaw && !granularity) {
      return jsonResult(
        { error: 'granularity must be one of: day, month, year' },
        { status: 400 },
      );
    }

    const csv = await exportRevenueCsvForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        granularity,
      },
    });

    const suffix = new Date().toISOString().slice(0, 10);

    return rawResult(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=reports-revenue-${suffix}.csv`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetUtilizationReport(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const payload = await getUtilizationReportForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleExportUtilizationCsv(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const csv = await exportUtilizationCsvForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
      },
    });

    const suffix = new Date().toISOString().slice(0, 10);

    return rawResult(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=reports-utilization-${suffix}.csv`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetIncidentsReport(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const typeRaw = searchParams.get('type');
    const type = typeRaw ? parseIncidentType(typeRaw) : null;
    if (typeRaw && !type) {
      return jsonResult(
        { error: 'Invalid incident type filter' },
        { status: 400 },
      );
    }

    const payload = await getIncidentsReportForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        type,
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleExportIncidentsCsv(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const startDateRaw = searchParams.get('startDate');
    const endDateRaw = searchParams.get('endDate');
    const startDate = startDateRaw ? parseDateString(startDateRaw) : null;
    const endDate = endDateRaw ? parseDateString(endDateRaw) : null;

    if ((startDateRaw && !startDate) || (endDateRaw && !endDate)) {
      return jsonResult(
        { error: 'startDate/endDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const typeRaw = searchParams.get('type');
    const type = typeRaw ? parseIncidentType(typeRaw) : null;
    if (typeRaw && !type) {
      return jsonResult(
        { error: 'Invalid incident type filter' },
        { status: 400 },
      );
    }

    const csv = await exportIncidentsCsvForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate,
        endDate,
        type,
      },
    });

    const suffix = new Date().toISOString().slice(0, 10);

    return rawResult(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=reports-incidents-${suffix}.csv`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

@Injectable()
export class ReportsService {
  getRevenueReport(request: Request): Promise<ReportsApiResult> {
    return handleGetRevenueReport(request);
  }

  exportRevenueCsv(request: Request): Promise<ReportsApiResult> {
    return handleExportRevenueCsv(request);
  }

  getUtilizationReport(request: Request): Promise<ReportsApiResult> {
    return handleGetUtilizationReport(request);
  }

  exportUtilizationCsv(request: Request): Promise<ReportsApiResult> {
    return handleExportUtilizationCsv(request);
  }

  getIncidentsReport(request: Request): Promise<ReportsApiResult> {
    return handleGetIncidentsReport(request);
  }

  exportIncidentsCsv(request: Request): Promise<ReportsApiResult> {
    return handleExportIncidentsCsv(request);
  }
}
