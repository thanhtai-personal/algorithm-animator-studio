import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProcurementListQuery,
  ProcurementListResponse,
  ProcurementReceiptDetailDto,
} from '../../types/procurement-module.type';
import {
  assertDateRange,
  buildDateFromBoundary,
  buildDateToBoundary,
  mapReceiptItemRowToDto,
  mapReceiptRowToSummary,
  normalizeIntakeChannel,
  normalizePage,
  normalizePageSize,
  parseProcurementRollbackNote,
  sanitizeSearchTerm,
  sanitizeText,
} from './procurement.common';
import { ProcurementDomainError } from './procurement.domain-error';
import { PROCUREMENT_RECEIPT_SELECT } from './procurement.constants';
import {
  fetchProfileNamesByIds,
  resolveProcurementActorContext,
} from './procurement.actor-context';
import { fetchReceiptItems, getReceiptById } from './procurement.receipt-repo';
import type { ProcurementReceiptRow } from './procurement.internal-types';

export async function listProcurementReceiptsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: ProcurementListQuery;
  },
): Promise<ProcurementListResponse> {
  const context = await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  const page = normalizePage(options.query.page);
  const pageSize = normalizePageSize(options.query.pageSize);
  const search = sanitizeSearchTerm(options.query.search ?? null);
  const intakeChannel = normalizeIntakeChannel(
    options.query.intakeChannel ?? null,
  );
  const startDate = sanitizeText(options.query.startDate ?? null);
  const endDate = sanitizeText(options.query.endDate ?? null);

  assertDateRange(startDate, endDate);

  let query = supabase
    .from('procurement_receipts')
    .select(PROCUREMENT_RECEIPT_SELECT, { count: 'exact' })
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(
      `receipt_code.ilike.%${search}%,supplier_name.ilike.%${search}%`,
    );
  }

  if (intakeChannel) {
    query = query.eq('intake_channel', intakeChannel);
  }

  if (startDate) {
    query = query.gte('created_at', buildDateFromBoundary(startDate));
  }

  if (endDate) {
    query = query.lte('created_at', buildDateToBoundary(endDate));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .returns<ProcurementReceiptRow[]>();

  if (error) throw error;

  const rows = data ?? [];
  const creatorIds = Array.from(
    new Set(
      rows
        .map((row) => row.created_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const createdByNameMap = await fetchProfileNamesByIds(supabase, creatorIds);

  return {
    items: rows.map((row) => mapReceiptRowToSummary(row, createdByNameMap)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProcurementReceiptDetailForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
  },
): Promise<ProcurementReceiptDetailDto | null> {
  const row = await getReceiptById(supabase, options.receiptId);
  if (!row) return null;

  await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: row.branch_id,
  });

  const creatorMap = await fetchProfileNamesByIds(
    supabase,
    row.created_by ? [row.created_by] : [],
  );

  const items = await fetchReceiptItems(supabase, row.id);

  return {
    summary: mapReceiptRowToSummary(row, creatorMap),
    lines: items.map((entry) => mapReceiptItemRowToDto(entry)),
  };
}

export async function assertProcurementReceiptImmutableForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    receiptId: string;
  },
): Promise<never> {
  const receipt = await getReceiptById(supabase, options.receiptId);
  if (!receipt) {
    throw new ProcurementDomainError('RECEIPT_NOT_FOUND', {
      receiptId: options.receiptId,
    });
  }

  await resolveProcurementActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: receipt.branch_id,
  });

  const parsedRollbackNote = parseProcurementRollbackNote(receipt.note);
  if (parsedRollbackNote.rollbackMeta) {
    throw new ProcurementDomainError(
      'PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK',
      {
        receiptId: receipt.id,
        receiptCode: receipt.receipt_code,
        rolledBackAt: parsedRollbackNote.rollbackMeta.at,
      },
    );
  }

  throw new ProcurementDomainError('PROCUREMENT_RECEIPT_IMMUTABLE', {
    receiptId: receipt.id,
    receiptCode: receipt.receipt_code,
    immutableFields: [
      'quantity',
      'unit_cost_amount',
      'purchase_price',
      'sale_price',
      'rent_price_per_day',
    ],
    correctionFlow: 'ROLLBACK_AND_RECREATE',
  });
}
