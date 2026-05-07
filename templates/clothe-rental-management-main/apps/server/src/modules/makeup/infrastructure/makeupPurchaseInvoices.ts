import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateMakeupPurchaseInvoicePayload,
  MakeupPurchaseInvoiceDto,
  MakeupPurchaseInvoicesQuery,
  MakeupPurchaseInvoicesResponse,
  UpdateMakeupPurchaseInvoicePayload,
} from '../types/makeup-module.type';
import {
  assertIsoDate,
  fetchMakeupModuleEnabled,
  isMissingColumnOrTableError,
  MAKEUP_ADMIN_ROLE_SET,
  MakeupDomainError,
  resolveActorContext,
  sanitizeText,
} from './makeupShared';
import {
  buildInvoiceCode,
  INVOICE_ITEM_SELECT_FIELDS,
  INVOICE_SELECT_FIELDS,
  mapInvoiceItemRowToDto,
  mapInvoiceRowToDto,
  normalizeInvoiceItems,
  normalizePurchaseInvoiceStatus,
  type MakeupPurchaseInvoiceItemRow,
  type MakeupPurchaseInvoiceRow,
} from './makeupPurchaseInvoicesShared';

async function assertInvoiceAccess(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    requestedBranchId: string | null;
  },
) {
  const context = await resolveActorContext(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: options.requestedBranchId,
  });
  if (!MAKEUP_ADMIN_ROLE_SET.has(context.role ?? '')) {
    throw new MakeupDomainError('FORBIDDEN_ROLE', { role: context.role });
  }
  if (!(await fetchMakeupModuleEnabled(supabase))) {
    throw new MakeupDomainError('MODULE_DISABLED');
  }
  return context;
}

async function ensureInventoryItemsBelongToBranch(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    inventoryItemIds: string[];
  },
): Promise<void> {
  if (options.inventoryItemIds.length === 0) return;

  const { data, error } = await supabase
    .from('makeup_inventory_items')
    .select('id')
    .eq('branch_id', options.branchId)
    .in('id', options.inventoryItemIds)
    .eq('is_delete', false)
    .returns<Array<{ id: string }>>();

  if (error) throw error;
  const found = new Set((data ?? []).map((entry) => entry.id));
  const missing = options.inventoryItemIds.filter((entry) => !found.has(entry));
  if (missing.length > 0) {
    throw new MakeupDomainError('INVENTORY_ITEM_NOT_FOUND', {
      inventoryItemIds: missing,
    });
  }
}

async function fetchInvoiceById(
  supabase: SupabaseClient,
  options: { branchId: string; invoiceId: string },
): Promise<MakeupPurchaseInvoiceDto | null> {
  const { data: invoice, error: invoiceError } = await supabase
    .from('makeup_purchase_invoices')
    .select(INVOICE_SELECT_FIELDS)
    .eq('id', options.invoiceId)
    .eq('branch_id', options.branchId)
    .eq('is_delete', false)
    .maybeSingle<MakeupPurchaseInvoiceRow>();

  if (invoiceError) throw invoiceError;
  if (!invoice) return null;

  const { data: itemRows, error: itemError } = await supabase
    .from('makeup_purchase_invoice_items')
    .select(INVOICE_ITEM_SELECT_FIELDS)
    .eq('invoice_id', invoice.id)
    .eq('is_delete', false)
    .order('created_at', { ascending: true })
    .returns<MakeupPurchaseInvoiceItemRow[]>();
  if (itemError) throw itemError;

  return mapInvoiceRowToDto(
    invoice,
    (itemRows ?? []).map(mapInvoiceItemRowToDto),
  );
}

export async function listMakeupPurchaseInvoices(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: MakeupPurchaseInvoicesQuery;
  },
): Promise<MakeupPurchaseInvoicesResponse> {
  const context = await assertInvoiceAccess(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.query.branchId ?? null),
  });

  let query = supabase
    .from('makeup_purchase_invoices')
    .select(INVOICE_SELECT_FIELDS)
    .eq('branch_id', context.branchId)
    .eq('is_delete', false)
    .eq('is_active', true)
    .order('invoice_date', { ascending: false })
    .order('created_at', { ascending: false });

  const startDate = options.query.startDate
    ? assertIsoDate(options.query.startDate)
    : null;
  const endDate = options.query.endDate
    ? assertIsoDate(options.query.endDate)
    : null;
  if (startDate) query = query.gte('invoice_date', startDate);
  if (endDate) query = query.lte('invoice_date', endDate);
  if (options.query.status) {
    query = query.eq(
      'status',
      normalizePurchaseInvoiceStatus(options.query.status),
    );
  }

  const { data, error } = await query.returns<MakeupPurchaseInvoiceRow[]>();
  if (error) {
    if (isMissingColumnOrTableError(error)) {
      return { branchId: context.branchId, items: [] };
    }
    throw error;
  }

  const invoices = data ?? [];
  const search = sanitizeText(options.query.search ?? null)?.toLowerCase();
  const filtered =
    search && search.length > 0
      ? invoices.filter((entry) => {
          const haystack =
            `${entry.invoice_code} ${entry.supplier_name ?? ''} ${
              entry.supplier_phone ?? ''
            } ${entry.note ?? ''}`.toLowerCase();
          return haystack.includes(search);
        })
      : invoices;

  const invoiceIds = filtered.map((entry) => entry.id);
  const itemMap = new Map<
    string,
    ReturnType<typeof mapInvoiceItemRowToDto>[]
  >();

  if (invoiceIds.length > 0) {
    const { data: itemRows, error: itemError } = await supabase
      .from('makeup_purchase_invoice_items')
      .select(INVOICE_ITEM_SELECT_FIELDS)
      .in('invoice_id', invoiceIds)
      .eq('is_delete', false)
      .order('created_at', { ascending: true })
      .returns<MakeupPurchaseInvoiceItemRow[]>();
    if (itemError) throw itemError;

    for (const row of itemRows ?? []) {
      const bucket = itemMap.get(row.invoice_id) ?? [];
      bucket.push(mapInvoiceItemRowToDto(row));
      itemMap.set(row.invoice_id, bucket);
    }
  }

  return {
    branchId: context.branchId,
    items: filtered.map((row) =>
      mapInvoiceRowToDto(row, itemMap.get(row.id) ?? []),
    ),
  };
}

export async function createMakeupPurchaseInvoice(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CreateMakeupPurchaseInvoicePayload;
  },
): Promise<MakeupPurchaseInvoiceDto> {
  const context = await assertInvoiceAccess(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: sanitizeText(options.payload.branchId ?? null),
  });

  const invoiceDate = assertIsoDate(options.payload.invoiceDate);
  const status = normalizePurchaseInvoiceStatus(
    options.payload.status ?? 'DRAFT',
  );
  const items = normalizeInvoiceItems(options.payload.items);

  await ensureInventoryItemsBelongToBranch(supabase, {
    branchId: context.branchId,
    inventoryItemIds: items
      .map((entry) => entry.inventoryItemId)
      .filter((entry): entry is string => Boolean(entry)),
  });

  const invoiceCode = buildInvoiceCode(invoiceDate);
  const { data: createdInvoice, error: createError } = await supabase
    .from('makeup_purchase_invoices')
    .insert({
      branch_id: context.branchId,
      invoice_code: invoiceCode,
      invoice_date: invoiceDate,
      status,
      supplier_name: sanitizeText(options.payload.supplierName ?? null),
      supplier_phone: sanitizeText(options.payload.supplierPhone ?? null),
      note: sanitizeText(options.payload.note ?? null),
      is_active: options.payload.isActive ?? true,
      is_delete: false,
      created_by: options.actorProfileId,
      updated_by: options.actorProfileId,
    })
    .select('id')
    .maybeSingle<{ id: string }>();

  if (createError) {
    const code = String((createError as { code?: string }).code ?? '');
    if (code === '23505') {
      throw new MakeupDomainError('PURCHASE_INVOICE_CODE_DUPLICATE', {
        invoiceCode,
      });
    }
    throw createError;
  }
  if (!createdInvoice?.id) {
    throw new MakeupDomainError('PURCHASE_INVOICE_NOT_FOUND', {
      reason: 'insert-empty-result',
    });
  }

  if (items.length > 0) {
    const { error: itemInsertError } = await supabase
      .from('makeup_purchase_invoice_items')
      .insert(
        items.map((entry) => ({
          invoice_id: createdInvoice.id,
          inventory_item_id: entry.inventoryItemId,
          item_name: entry.itemName,
          quantity: entry.quantity,
          unit_cost_amount: entry.unitCostAmount,
          note: entry.note,
          is_delete: false,
        })),
      );
    if (itemInsertError) throw itemInsertError;
  }

  const detail = await fetchInvoiceById(supabase, {
    branchId: context.branchId,
    invoiceId: createdInvoice.id,
  });
  if (!detail) {
    throw new MakeupDomainError('PURCHASE_INVOICE_NOT_FOUND', {
      invoiceId: createdInvoice.id,
    });
  }
  return detail;
}

export async function updateMakeupPurchaseInvoice(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    invoiceId: string;
    payload: UpdateMakeupPurchaseInvoicePayload;
  },
): Promise<MakeupPurchaseInvoiceDto> {
  const context = await assertInvoiceAccess(supabase, {
    actorProfileId: options.actorProfileId,
    requestedBranchId: null,
  });

  const current = await fetchInvoiceById(supabase, {
    branchId: context.branchId,
    invoiceId: options.invoiceId,
  });
  if (!current) {
    throw new MakeupDomainError('PURCHASE_INVOICE_NOT_FOUND', {
      invoiceId: options.invoiceId,
    });
  }

  const patch: Record<string, unknown> = { updated_by: options.actorProfileId };
  if (Object.prototype.hasOwnProperty.call(options.payload, 'invoiceDate')) {
    patch.invoice_date = assertIsoDate(options.payload.invoiceDate ?? '');
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, 'status')) {
    patch.status = normalizePurchaseInvoiceStatus(
      options.payload.status ?? null,
    );
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, 'supplierName')) {
    patch.supplier_name = sanitizeText(options.payload.supplierName ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, 'supplierPhone')) {
    patch.supplier_phone = sanitizeText(options.payload.supplierPhone ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, 'note')) {
    patch.note = sanitizeText(options.payload.note ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(options.payload, 'isActive')) {
    patch.is_active = options.payload.isActive;
  }

  const { error: updateError } = await supabase
    .from('makeup_purchase_invoices')
    .update(patch)
    .eq('id', current.id)
    .eq('is_delete', false)
    .eq('branch_id', context.branchId);
  if (updateError) throw updateError;

  if (Object.prototype.hasOwnProperty.call(options.payload, 'items')) {
    const items = normalizeInvoiceItems(options.payload.items);
    await ensureInventoryItemsBelongToBranch(supabase, {
      branchId: context.branchId,
      inventoryItemIds: items
        .map((entry) => entry.inventoryItemId)
        .filter((entry): entry is string => Boolean(entry)),
    });

    const { error: deleteItemsError } = await supabase
      .from('makeup_purchase_invoice_items')
      .update({
        is_delete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('invoice_id', current.id)
      .eq('is_delete', false);
    if (deleteItemsError) throw deleteItemsError;

    if (items.length > 0) {
      const { error: insertItemsError } = await supabase
        .from('makeup_purchase_invoice_items')
        .insert(
          items.map((entry) => ({
            invoice_id: current.id,
            inventory_item_id: entry.inventoryItemId,
            item_name: entry.itemName,
            quantity: entry.quantity,
            unit_cost_amount: entry.unitCostAmount,
            note: entry.note,
            is_delete: false,
          })),
        );
      if (insertItemsError) throw insertItemsError;
    }
  }

  const detail = await fetchInvoiceById(supabase, {
    branchId: context.branchId,
    invoiceId: current.id,
  });
  if (!detail) {
    throw new MakeupDomainError('PURCHASE_INVOICE_NOT_FOUND', {
      invoiceId: options.invoiceId,
    });
  }
  return detail;
}
