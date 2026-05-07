import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BulkUpdateInventoryItemStatusPayload,
  InventoryBulkStatusFailedItemDto,
  InventoryBulkStatusUpdateResultDto,
  InventoryItemDetailDto,
  InventoryScanResultDto,
  UpdateInventoryItemStatusPayload,
} from '../../types/inventory-items.type';
import {
  ITEM_STATUS_SET,
  MANAGER_ONLY_TARGET_STATUS_SET,
  MANAGER_PLUS_ROLE_SET,
  normalizeItemStatus,
  sanitizeReasonNote,
  sanitizeSearchTerm,
  type ItemRow,
} from './shared-core';
import {
  assertTransitionAllowed,
  fetchActiveReservationItemIdSet,
  fetchProfileRole,
  hasActiveReservationOverlap,
  mapBulkStatusFailure,
} from './status-shared';
import { getInventoryItemDetailForAdmin } from './list-handlers';
export async function updateInventoryItemStatusForAdmin(
  supabase: SupabaseClient,
  profileId: string,
  itemId: string,
  payload: UpdateInventoryItemStatusPayload,
): Promise<InventoryItemDetailDto | null> {
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(
      'id, branch_id, product_id, item_code, size, qr_code, status, retired_at, retired_reason',
    )
    .eq('id', itemId)
    .eq('is_delete', false)
    .maybeSingle<ItemRow>();

  if (itemError) throw itemError;
  if (!item) return null;

  const fromStatus = normalizeItemStatus(item.status);
  const toStatus = payload.toStatus;

  if (!ITEM_STATUS_SET.has(toStatus)) {
    throw new Error('INVALID_TARGET_STATUS');
  }

  if (fromStatus === toStatus) {
    return getInventoryItemDetailForAdmin(supabase, itemId);
  }

  assertTransitionAllowed(fromStatus, toStatus);

  if (toStatus === 'READY') {
    const hasOverlap = await hasActiveReservationOverlap(supabase, itemId);
    if (hasOverlap) {
      throw new Error('READY_BLOCKED_BY_ACTIVE_RESERVATION');
    }
  }

  if (MANAGER_ONLY_TARGET_STATUS_SET.has(toStatus)) {
    const role = await fetchProfileRole(supabase, profileId);
    if (!role || !MANAGER_PLUS_ROLE_SET.has(role)) {
      throw new Error('FORBIDDEN_MANAGER_ONLY_STATUS');
    }
  }

  const reasonNote = sanitizeReasonNote(payload.reasonNote);

  const updatePayload: Record<string, unknown> = {
    status: toStatus,
    updated_by: profileId,
  };

  if (toStatus === 'RETIRED') {
    updatePayload.retired_at = new Date().toISOString();
    updatePayload.retired_reason = reasonNote;
  }

  const { error: updateError } = await supabase
    .from('items')
    .update(updatePayload)
    .eq('id', itemId)
    .eq('is_delete', false);

  if (updateError) throw updateError;

  const { error: logError } = await supabase.from('item_status_logs').insert({
    branch_id: item.branch_id,
    item_id: item.id,
    order_id: payload.orderId ?? null,
    from_status: fromStatus,
    to_status: toStatus,
    reason_code: payload.reasonCode ?? null,
    reason_note: reasonNote,
    actor_profile_id: profileId,
    happened_at: new Date().toISOString(),
  });

  if (logError) throw logError;

  return getInventoryItemDetailForAdmin(supabase, item.id);
}

export async function bulkUpdateInventoryItemStatusForAdmin(
  supabase: SupabaseClient,
  profileId: string,
  payload: BulkUpdateInventoryItemStatusPayload,
): Promise<InventoryBulkStatusUpdateResultDto> {
  const uniqueItemIds = Array.from(
    new Set(
      payload.itemIds
        .map((itemId) => itemId.trim())
        .filter((itemId) => itemId.length > 0),
    ),
  );
  const toStatus = payload.toStatus;

  if (!ITEM_STATUS_SET.has(toStatus)) {
    throw new Error('INVALID_TARGET_STATUS');
  }

  if (uniqueItemIds.length === 0) {
    return {
      summary: {
        total: 0,
        success: 0,
        failed: 0,
      },
      failedItems: [],
      succeededItemIds: [],
    };
  }

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select(
      'id, branch_id, product_id, item_code, size, qr_code, status, retired_at, retired_reason',
    )
    .in('id', uniqueItemIds)
    .eq('is_delete', false)
    .returns<ItemRow[]>();
  if (itemsError) throw itemsError;

  const itemById = new Map((items ?? []).map((item) => [item.id, item]));
  const reasonNote = sanitizeReasonNote(payload.reasonNote);
  const actorRole = MANAGER_ONLY_TARGET_STATUS_SET.has(toStatus)
    ? await fetchProfileRole(supabase, profileId)
    : null;
  const blockedReadyItemIdSet =
    toStatus === 'READY'
      ? await fetchActiveReservationItemIdSet(supabase, uniqueItemIds)
      : new Set<string>();

  const failedItems: InventoryBulkStatusFailedItemDto[] = [];
  const succeededItemIds: string[] = [];

  for (const itemId of uniqueItemIds) {
    const item = itemById.get(itemId);
    if (!item) {
      failedItems.push({
        itemId,
        itemCode: null,
        reasonCode: 'ITEM_NOT_FOUND',
        reasonMessage: 'Item not found',
      });
      continue;
    }

    const fromStatus = normalizeItemStatus(item.status);
    if (fromStatus === toStatus) {
      succeededItemIds.push(item.id);
      continue;
    }

    try {
      assertTransitionAllowed(fromStatus, toStatus);

      if (toStatus === 'READY' && blockedReadyItemIdSet.has(item.id)) {
        throw new Error('READY_BLOCKED_BY_ACTIVE_RESERVATION');
      }

      if (MANAGER_ONLY_TARGET_STATUS_SET.has(toStatus)) {
        if (!actorRole || !MANAGER_PLUS_ROLE_SET.has(actorRole)) {
          throw new Error('FORBIDDEN_MANAGER_ONLY_STATUS');
        }
      }

      const updatePayload: Record<string, unknown> = {
        status: toStatus,
        updated_by: profileId,
      };

      if (toStatus === 'RETIRED') {
        updatePayload.retired_at = new Date().toISOString();
        updatePayload.retired_reason = reasonNote;
      }

      const { error: updateError } = await supabase
        .from('items')
        .update(updatePayload)
        .eq('id', item.id)
        .eq('is_delete', false);
      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('item_status_logs')
        .insert({
          branch_id: item.branch_id,
          item_id: item.id,
          order_id: payload.orderId ?? null,
          from_status: fromStatus,
          to_status: toStatus,
          reason_code: payload.reasonCode ?? null,
          reason_note: reasonNote,
          actor_profile_id: profileId,
          happened_at: new Date().toISOString(),
        });
      if (logError) throw logError;

      succeededItemIds.push(item.id);
    } catch (error) {
      const mapped = mapBulkStatusFailure(error);
      failedItems.push({
        itemId: item.id,
        itemCode: item.item_code,
        reasonCode: mapped.reasonCode,
        reasonMessage: mapped.reasonMessage,
      });
    }
  }

  return {
    summary: {
      total: uniqueItemIds.length,
      success: succeededItemIds.length,
      failed: failedItems.length,
    },
    failedItems,
    succeededItemIds,
  };
}

export async function findInventoryItemByCode(
  supabase: SupabaseClient,
  options: {
    code: string;
    branchId: string | null;
  },
): Promise<InventoryScanResultDto | null> {
  const search = sanitizeSearchTerm(options.code);
  if (!search) return null;

  const query = supabase
    .from('items')
    .select('id, item_code, qr_code, status, branch_id')
    .eq('is_delete', false)
    .or(`item_code.ilike.%${search}%,qr_code.ilike.%${search}%`);

  if (options.branchId) {
    query.eq('branch_id', options.branchId);
  }

  const { data, error } = await query.limit(25).returns<
    Array<{
      id: string;
      item_code: string;
      qr_code: string | null;
      status: string;
      branch_id: string;
    }>
  >();
  if (error) throw error;

  const rows = data ?? [];
  const exact = rows.find((row) => {
    const normalizedCode = search.toLowerCase();
    return (
      row.item_code.toLowerCase() === normalizedCode ||
      (row.qr_code ? row.qr_code.toLowerCase() === normalizedCode : false)
    );
  });

  const picked = exact ?? rows[0] ?? null;
  if (!picked) return null;

  return {
    itemId: picked.id,
    itemCode: picked.item_code,
    qrCode: picked.qr_code,
    status: normalizeItemStatus(picked.status),
  };
}
