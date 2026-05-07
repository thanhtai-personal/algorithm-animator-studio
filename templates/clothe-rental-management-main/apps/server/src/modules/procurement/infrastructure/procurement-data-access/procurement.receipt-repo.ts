import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PROCUREMENT_RECEIPT_ITEMS_SELECT,
  PROCUREMENT_RECEIPT_SELECT,
} from './procurement.constants';
import type {
  ProcurementReceiptItemRow,
  ProcurementReceiptRow,
} from './procurement.internal-types';

export async function getReceiptById(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<ProcurementReceiptRow | null> {
  const { data, error } = await supabase
    .from('procurement_receipts')
    .select(PROCUREMENT_RECEIPT_SELECT)
    .eq('id', receiptId)
    .eq('is_delete', false)
    .maybeSingle<ProcurementReceiptRow>();

  if (error) throw error;
  return data ?? null;
}

export async function fetchReceiptItems(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<ProcurementReceiptItemRow[]> {
  const { data, error } = await supabase
    .from('procurement_receipt_items')
    .select(PROCUREMENT_RECEIPT_ITEMS_SELECT)
    .eq('receipt_id', receiptId)
    .eq('is_delete', false)
    .order('created_at', { ascending: true })
    .returns<ProcurementReceiptItemRow[]>();

  if (error) throw error;
  return data ?? [];
}
