import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateMakeupOrderPayload,
  MakeupOrdersQuery,
  MakeupOrdersResponse,
  UpdateMakeupOrderPayload,
} from '../types/makeup-module.type';
import {
  createMakeupEvent,
  listMakeupEvents,
  updateMakeupEvent,
} from './makeupEvents';
import {
  fetchMakeupModuleEnabled,
  MAKEUP_ADMIN_ROLE_SET,
  MakeupDomainError,
  resolveActorContext,
  sanitizeText,
} from './makeupShared';

async function assertOrdersAccess(
  supabase: SupabaseClient,
  options: { actorProfileId: string; branchId: string | null },
) {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.branchId,
  });
  if (!MAKEUP_ADMIN_ROLE_SET.has(context.role ?? '')) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }

  return context;
}

export async function listMakeupOrders(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupOrdersQuery;
  },
): Promise<MakeupOrdersResponse> {
  const context = await assertOrdersAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: sanitizeText(options.query.branchId ?? null),
  });

  const eventsPayload = await listMakeupEvents(supabase, {
    actorProfileId: options.actorProfileId,
    query: {
      branchId: context.branchId,
      startDate: options.query.startDate,
      endDate: options.query.endDate,
    },
  });

  const statusFilter = sanitizeText(
    options.query.status ?? null,
  )?.toUpperCase();
  const search = sanitizeText(options.query.search ?? null)?.toLowerCase();

  const items = eventsPayload.events.filter((event) => {
    if (statusFilter && event.status !== statusFilter) {
      return false;
    }
    if (!search) return true;
    const haystack =
      `${event.customerName ?? ''} ${event.customerPhone ?? ''} ${
        event.artistName ?? ''
      } ${event.packageName ?? ''} ${event.note ?? ''}`.toLowerCase();
    return haystack.includes(search);
  });

  return {
    branchId: context.branchId,
    timezone: context.timeZone,
    items,
  };
}

export async function createMakeupOrder(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupOrderPayload;
  },
) {
  const context = await assertOrdersAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: sanitizeText(options.payload.branchId ?? null),
  });

  return createMakeupEvent(supabase, {
    actorProfileId: options.actorProfileId,
    payload: {
      ...options.payload,
      branchId: context.branchId,
    },
  });
}

export async function updateMakeupOrder(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    orderId: string;
    payload: UpdateMakeupOrderPayload;
  },
) {
  await assertOrdersAccess(supabase, {
    actorProfileId: options.actorProfileId,
    branchId: null,
  });

  return updateMakeupEvent(supabase, {
    actorProfileId: options.actorProfileId,
    eventId: options.orderId,
    payload: options.payload,
  });
}
