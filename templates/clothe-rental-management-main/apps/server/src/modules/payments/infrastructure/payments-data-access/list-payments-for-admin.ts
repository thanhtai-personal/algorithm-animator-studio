import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PaymentsListQuery,
  PaymentsListResponse,
} from '../../types/payments-domain.type';
import {
  assertValidDateRange,
  fetchActorBranchAccessIds,
  fetchActorProfile,
  normalizePage,
  normalizePageSize,
  normalizePaymentMethod,
  normalizePaymentType,
  PaymentsDomainError,
  resolveBranchScope,
  sanitizeText,
} from './shared-core';
import {
  computeDailyCashbook,
  computeTotals,
  enrichPayments,
  fetchPaymentRowsForList,
  fetchPostedRowsForSummary,
} from './shared-enrichment';

export async function listPaymentsForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: PaymentsListQuery;
  },
): Promise<PaymentsListResponse> {
  const actor = await fetchActorProfile(supabase, options.actorProfileId);
  if (!actor) {
    throw new PaymentsDomainError('FORBIDDEN_MANAGER_ACTION', {
      reason: 'missing-actor-profile',
    });
  }

  const normalizedType =
    options.query.type === null || options.query.type === undefined
      ? null
      : normalizePaymentType(options.query.type);
  if (
    options.query.type !== null &&
    options.query.type !== undefined &&
    !normalizedType
  ) {
    throw new PaymentsDomainError('INVALID_PAYMENT_TYPE', {
      type: options.query.type,
    });
  }

  const normalizedMethod =
    options.query.method === null || options.query.method === undefined
      ? null
      : normalizePaymentMethod(options.query.method);
  if (
    options.query.method !== null &&
    options.query.method !== undefined &&
    !normalizedMethod
  ) {
    throw new PaymentsDomainError('INVALID_PAYMENT_METHOD', {
      method: options.query.method,
    });
  }

  const startDate = sanitizeText(options.query.startDate ?? null);
  const endDate = sanitizeText(options.query.endDate ?? null);
  assertValidDateRange(startDate, endDate);

  const allowedBranchIds = await fetchActorBranchAccessIds(
    supabase,
    actor.id,
    actor.default_branch_id,
  );

  const branchIds = resolveBranchScope({
    actor,
    allowedBranchIds,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);

  const [paged, postedRows] = await Promise.all([
    fetchPaymentRowsForList(supabase, {
      branchIds,
      startDate,
      endDate,
      type: normalizedType,
      method: normalizedMethod,
      page,
      pageSize,
    }),
    fetchPostedRowsForSummary(supabase, {
      branchIds,
      startDate,
      endDate,
      type: normalizedType,
      method: normalizedMethod,
    }),
  ]);

  const items = await enrichPayments(supabase, paged.rows, branchIds);

  return {
    items,
    total: paged.total,
    page,
    pageSize,
    totals: computeTotals(postedRows),
    dailyCashbook: computeDailyCashbook(postedRows),
  };
}
