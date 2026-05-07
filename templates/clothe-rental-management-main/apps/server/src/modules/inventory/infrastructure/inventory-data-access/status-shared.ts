import type { SupabaseClient } from '@supabase/supabase-js';
import { ITEM_STATUS_TRANSITIONS } from '../../../shared/domain/domain-primitives.constants';
import type { ItemStatus } from '../../../shared/domain/types/domain-primitives.type';
import {
  type ProfileRoleRow,
  type ReservationWindowItemRow,
  type ReservationWindowRow,
} from './shared-core';
export async function fetchProfileRole(
  supabase: SupabaseClient,
  profileId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', profileId)
    .eq('is_delete', false)
    .maybeSingle<ProfileRoleRow>();

  if (error) throw error;
  return data?.role?.trim().toLowerCase() ?? null;
}

export async function hasActiveReservationOverlap(
  supabase: SupabaseClient,
  itemId: string,
): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('reservation_windows')
    .select('id')
    .eq('item_id', itemId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .gt('end_date', today)
    .limit(1)
    .returns<ReservationWindowRow[]>();

  if (error) throw error;
  return (data ?? []).length > 0;
}

export async function fetchActiveReservationItemIdSet(
  supabase: SupabaseClient,
  itemIds: string[],
): Promise<Set<string>> {
  const blockedItemIdSet = new Set<string>();
  if (itemIds.length === 0) return blockedItemIdSet;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('reservation_windows')
    .select('item_id')
    .in('item_id', itemIds)
    .eq('is_delete', false)
    .eq('is_active', true)
    .gt('end_date', today)
    .returns<ReservationWindowItemRow[]>();

  if (error) throw error;

  for (const row of data ?? []) {
    blockedItemIdSet.add(row.item_id);
  }

  return blockedItemIdSet;
}

export function assertTransitionAllowed(
  fromStatus: ItemStatus,
  toStatus: ItemStatus,
): void {
  const allowedTargets = ITEM_STATUS_TRANSITIONS[fromStatus] ?? [];
  if (!allowedTargets.includes(toStatus)) {
    throw new Error('INVALID_STATUS_TRANSITION');
  }
}

export function mapBulkStatusFailure(error: unknown): {
  reasonCode: string;
  reasonMessage: string;
} {
  if (!(error instanceof Error)) {
    return {
      reasonCode: 'UNEXPECTED_ERROR',
      reasonMessage: 'Unexpected error while updating item status',
    };
  }

  if (error.message === 'INVALID_STATUS_TRANSITION') {
    return {
      reasonCode: 'INVALID_STATUS_TRANSITION',
      reasonMessage: 'Invalid item status transition',
    };
  }

  if (error.message === 'READY_BLOCKED_BY_ACTIVE_RESERVATION') {
    return {
      reasonCode: 'READY_BLOCKED_BY_ACTIVE_RESERVATION',
      reasonMessage:
        'Item cannot be marked READY while active reservation windows exist',
    };
  }

  if (error.message === 'FORBIDDEN_MANAGER_ONLY_STATUS') {
    return {
      reasonCode: 'FORBIDDEN_MANAGER_ONLY_STATUS',
      reasonMessage: 'Only manager or admin can set this status',
    };
  }

  if (error.message === 'INVALID_TARGET_STATUS') {
    return {
      reasonCode: 'INVALID_TARGET_STATUS',
      reasonMessage: 'Invalid target status',
    };
  }

  return {
    reasonCode: 'UNEXPECTED_ERROR',
    reasonMessage:
      error.message || 'Unexpected error while updating item status',
  };
}
