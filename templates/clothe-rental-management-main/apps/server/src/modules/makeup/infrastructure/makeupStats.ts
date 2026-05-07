import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  MakeupModuleMetricDto,
  MakeupMyStatsQuery,
  MakeupMyStatsResponse,
} from '../types/makeup-module.type';
import {
  assertIsoDate,
  fetchMakeupModuleEnabled,
  isMissingColumnOrTableError,
  MakeupDomainError,
  type MakeupEventRow,
  normalizeEventStatus,
  parseNumeric,
  resolveActorContext,
  roundMoney,
  sanitizeText,
} from './makeupShared';

export async function getMyMakeupStats(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupMyStatsQuery;
  },
): Promise<MakeupMyStatsResponse> {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  if (context.role !== 'makeup_artist') {
    throw new MakeupDomainError('FORBIDDEN_ROLE', {
      role: context.role,
    });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  const endDate = options.query.endDate
    ? assertIsoDate(options.query.endDate)
    : new Date().toISOString().slice(0, 10);
  const startDate = options.query.startDate
    ? assertIsoDate(options.query.startDate)
    : new Date(new Date(`${endDate}T00:00:00Z`).getTime() - 29 * 86_400_000)
        .toISOString()
        .slice(0, 10);

  if (startDate > endDate) {
    throw new MakeupDomainError('INVALID_DATE_RANGE', {
      startDate,
      endDate,
    });
  }

  type StatsRow = Pick<
    MakeupEventRow,
    | 'status'
    | 'price_amount'
    | 'surcharge_amount'
    | 'cost_amount'
    | 'is_conflict_warning'
  >;

  const result = await supabase
    .from('makeup_events')
    .select(
      'status, price_amount, surcharge_amount, cost_amount, is_conflict_warning',
    )
    .eq('branch_id', context.branchId)
    .eq('artist_profile_id', context.actor.id)
    .eq('is_delete', false)
    .gte('event_date', startDate)
    .lte('event_date', endDate)
    .returns<StatsRow[]>();

  let rows: StatsRow[] = [];
  if (result.error) {
    if (!isMissingColumnOrTableError(result.error)) throw result.error;

    const { data: legacyRows, error: legacyError } = await supabase
      .from('makeup_events')
      .select('status, price_amount, cost_amount, is_conflict_warning')
      .eq('branch_id', context.branchId)
      .eq('artist_profile_id', context.actor.id)
      .eq('is_delete', false)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .returns<
        Array<
          Pick<
            MakeupEventRow,
            'status' | 'price_amount' | 'cost_amount' | 'is_conflict_warning'
          >
        >
      >();

    if (legacyError) throw legacyError;
    rows = (legacyRows ?? []).map((row) => ({
      ...row,
      surcharge_amount: 0,
    }));
  } else {
    rows = result.data ?? [];
  }

  let revenue = 0;
  let cost = 0;
  let completed = 0;
  let cancelled = 0;
  let conflictCount = 0;

  for (const row of rows) {
    const status = normalizeEventStatus(row.status);

    if (status === 'CANCELLED') {
      cancelled += 1;
    } else {
      revenue = roundMoney(
        revenue +
          Math.max(0, parseNumeric(row.price_amount)) +
          Math.max(0, parseNumeric(row.surcharge_amount)),
      );
      cost = roundMoney(cost + Math.max(0, parseNumeric(row.cost_amount)));
      if (status === 'COMPLETED') {
        completed += 1;
      }
    }

    if (row.is_conflict_warning) {
      conflictCount += 1;
    }
  }

  return {
    branchId: context.branchId,
    timezone: context.timeZone,
    artistProfileId: context.actor.id,
    startDate,
    endDate,
    revenue,
    cost,
    profit: roundMoney(revenue - cost),
    eventCount: rows.length,
    completedEventCount: completed,
    cancelledEventCount: cancelled,
    conflictEventCount: conflictCount,
  };
}

export async function getMakeupModuleMetricsByBranchAndDay(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    day: string;
  },
): Promise<MakeupModuleMetricDto> {
  type MetricRow = Pick<
    MakeupEventRow,
    'status' | 'price_amount' | 'surcharge_amount' | 'cost_amount'
  >;

  const result = await supabase
    .from('makeup_events')
    .select('status, price_amount, surcharge_amount, cost_amount')
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .eq('event_date', options.day)
    .returns<MetricRow[]>();

  let rows: MetricRow[] = [];
  if (result.error) {
    if (!isMissingColumnOrTableError(result.error)) {
      throw result.error;
    }

    const { data: legacyRows, error: legacyError } = await supabase
      .from('makeup_events')
      .select('status, price_amount, cost_amount')
      .eq('branch_id', options.branchId)
      .eq('is_delete', false)
      .eq('event_date', options.day)
      .returns<
        Array<Pick<MakeupEventRow, 'status' | 'price_amount' | 'cost_amount'>>
      >();

    if (legacyError) {
      const code = String(
        (legacyError as { code?: string }).code ?? '',
      ).toUpperCase();
      if (code === '42P01') {
        return {
          revenue: 0,
          profit: 0,
          orderCount: 0,
        };
      }
      throw legacyError;
    }

    rows = (legacyRows ?? []).map((row) => ({
      ...row,
      surcharge_amount: 0,
    }));
  } else {
    rows = result.data ?? [];
  }

  let revenue = 0;
  let cost = 0;
  let orderCount = 0;

  for (const row of rows) {
    const status = normalizeEventStatus(row.status);
    if (status === 'CANCELLED') continue;

    orderCount += 1;
    revenue = roundMoney(
      revenue +
        Math.max(0, parseNumeric(row.price_amount)) +
        Math.max(0, parseNumeric(row.surcharge_amount)),
    );
    cost = roundMoney(cost + Math.max(0, parseNumeric(row.cost_amount)));
  }

  return {
    revenue,
    profit: roundMoney(revenue - cost),
    orderCount,
  };
}
