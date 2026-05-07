import type { Request } from 'express';
import {
  createMakeupOrder,
  createMakeupPurchaseInvoice,
  getMakeupAdminOverview,
  listMakeupOrders,
  listMakeupPurchaseInvoices,
  updateMakeupOrder,
  updateMakeupPurchaseInvoice,
} from '../infrastructure/makeup.data-access';
import type {
  CreateMakeupOrderPayload,
  CreateMakeupPurchaseInvoicePayload,
  MakeupPurchaseInvoiceStatus,
  MakeupSessionSlot,
  UpdateMakeupOrderPayload,
  UpdateMakeupPurchaseInvoicePayload,
} from '../types/makeup-module.type';
import {
  getAuthedClient,
  getSearchParams,
  jsonResult,
  mapMakeupDomainError,
  parseBoolean,
  parseDateString,
  parseDateTimeString,
  parseEventStatus,
  parseInputMode,
  parseNumber,
  parsePurchaseInvoiceStatus,
  parseRecord,
  parseSessionSlot,
  parseString,
  readJsonBody,
  unauthorizedResponse,
} from './makeup-admin-shared.service';

const OVERVIEW_GRANULARITY_SET = new Set(['day', 'month']);

function parseCreateMakeupOrderPayload(
  body: Record<string, unknown>,
): CreateMakeupOrderPayload | null {
  const eventDate = parseDateString(body.eventDate);
  if (!eventDate) return null;

  let artistProfileId: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'artistProfileId')) {
    artistProfileId =
      body.artistProfileId === null ? null : parseString(body.artistProfileId);
    if (artistProfileId === null && body.artistProfileId !== null) return null;
  }

  let sessionSlot: MakeupSessionSlot | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'sessionSlot')) {
    const parsed = parseSessionSlot(body.sessionSlot);
    if (!parsed) return null;
    sessionSlot = parsed;
  }

  let sourceInputMode;
  if (Object.prototype.hasOwnProperty.call(body, 'sourceInputMode')) {
    sourceInputMode =
      body.sourceInputMode === null
        ? null
        : parseInputMode(body.sourceInputMode);
    if (sourceInputMode === null && body.sourceInputMode !== null) return null;
  }

  const payload: CreateMakeupOrderPayload = {
    branchId: parseString(body.branchId),
    eventDate,
    sessionSlot,
    startAt:
      body.startAt === undefined
        ? undefined
        : parseDateTimeString(body.startAt),
    endAt:
      body.endAt === undefined ? undefined : parseDateTimeString(body.endAt),
    artistProfileId,
    customerId:
      body.customerId === undefined ? undefined : parseString(body.customerId),
    customerName:
      body.customerName === undefined
        ? undefined
        : parseString(body.customerName),
    customerPhone:
      body.customerPhone === undefined
        ? undefined
        : parseString(body.customerPhone),
    guestCount:
      body.guestCount === undefined ? undefined : parseNumber(body.guestCount),
    durationMinutes:
      body.durationMinutes === undefined
        ? undefined
        : parseNumber(body.durationMinutes),
    packageId:
      body.packageId === undefined ? undefined : parseString(body.packageId),
    note: body.note === undefined ? undefined : parseString(body.note),
    priceAmount:
      body.priceAmount === undefined
        ? undefined
        : parseNumber(body.priceAmount),
    surchargeAmount:
      body.surchargeAmount === undefined
        ? undefined
        : parseNumber(body.surchargeAmount),
    costAmount:
      body.costAmount === undefined ? undefined : parseNumber(body.costAmount),
    sourceInputMode,
    sourceInputText:
      body.sourceInputText === undefined
        ? undefined
        : parseString(body.sourceInputText),
    confirmConflictOverride: parseBoolean(body.confirmConflictOverride),
  };

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const status = parseEventStatus(body.status);
    if (!status) return null;
    payload.status = status;
  }

  return payload;
}

function parseUpdateMakeupOrderPayload(
  body: Record<string, unknown>,
): UpdateMakeupOrderPayload | null {
  const payload: UpdateMakeupOrderPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'eventDate')) {
    const eventDate = parseDateString(body.eventDate);
    if (!eventDate) return null;
    payload.eventDate = eventDate;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sessionSlot')) {
    const sessionSlot = parseSessionSlot(body.sessionSlot);
    if (!sessionSlot) return null;
    payload.sessionSlot = sessionSlot;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'startAt')) {
    payload.startAt =
      body.startAt === null ? null : parseDateTimeString(body.startAt);
    if (payload.startAt === null && body.startAt !== null) return null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'endAt')) {
    payload.endAt =
      body.endAt === null ? null : parseDateTimeString(body.endAt);
    if (payload.endAt === null && body.endAt !== null) return null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'artistProfileId')) {
    payload.artistProfileId =
      body.artistProfileId === null ? null : parseString(body.artistProfileId);
    if (payload.artistProfileId === null && body.artistProfileId !== null)
      return null;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'customerId')) {
    payload.customerId =
      body.customerId === null ? null : parseString(body.customerId);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'customerName')) {
    payload.customerName =
      body.customerName === null ? null : parseString(body.customerName);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'customerPhone')) {
    payload.customerPhone =
      body.customerPhone === null ? null : parseString(body.customerPhone);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'guestCount')) {
    const guestCount = parseNumber(body.guestCount);
    if (guestCount === undefined) return null;
    payload.guestCount = guestCount;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'durationMinutes')) {
    const durationMinutes = parseNumber(body.durationMinutes);
    if (durationMinutes === undefined) return null;
    payload.durationMinutes = durationMinutes;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'packageId')) {
    payload.packageId =
      body.packageId === null ? null : parseString(body.packageId);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const status = parseEventStatus(body.status);
    if (!status) return null;
    payload.status = status;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    payload.note = body.note === null ? null : parseString(body.note);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'priceAmount')) {
    const priceAmount = parseNumber(body.priceAmount);
    if (priceAmount === undefined) return null;
    payload.priceAmount = priceAmount;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'surchargeAmount')) {
    const surchargeAmount = parseNumber(body.surchargeAmount);
    if (surchargeAmount === undefined) return null;
    payload.surchargeAmount = surchargeAmount;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'costAmount')) {
    const costAmount = parseNumber(body.costAmount);
    if (costAmount === undefined) return null;
    payload.costAmount = costAmount;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'confirmConflictOverride')) {
    const confirmConflictOverride = parseBoolean(body.confirmConflictOverride);
    if (confirmConflictOverride === undefined) return null;
    payload.confirmConflictOverride = confirmConflictOverride;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

function parsePurchaseInvoicePayloadItems(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return null;

  const items: NonNullable<CreateMakeupPurchaseInvoicePayload['items']> = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
    const record = row as Record<string, unknown>;
    const itemName = parseString(record.itemName);
    const quantity = parseNumber(record.quantity);
    const unitCostAmount = parseNumber(record.unitCostAmount);
    if (!itemName || quantity === undefined || unitCostAmount === undefined)
      return null;
    items.push({
      inventoryItemId:
        record.inventoryItemId === undefined
          ? undefined
          : parseString(record.inventoryItemId),
      itemName,
      quantity,
      unitCostAmount,
      note: record.note === undefined ? undefined : parseString(record.note),
    });
  }
  return items;
}

function parseCreateMakeupPurchaseInvoicePayload(
  body: Record<string, unknown>,
): CreateMakeupPurchaseInvoicePayload | null {
  const invoiceDate = parseDateString(body.invoiceDate);
  if (!invoiceDate) return null;
  let status: MakeupPurchaseInvoiceStatus | undefined;
  if (body.status !== undefined) {
    const parsedStatus = parsePurchaseInvoiceStatus(body.status);
    if (!parsedStatus) return null;
    status = parsedStatus;
  }
  const items = parsePurchaseInvoicePayloadItems(body.items);
  if (items === null) return null;

  return {
    branchId: parseString(body.branchId),
    invoiceDate,
    status,
    supplierName:
      body.supplierName === undefined
        ? undefined
        : parseString(body.supplierName),
    supplierPhone:
      body.supplierPhone === undefined
        ? undefined
        : parseString(body.supplierPhone),
    note: body.note === undefined ? undefined : parseString(body.note),
    isActive: parseBoolean(body.isActive),
    items,
  };
}

function parseUpdateMakeupPurchaseInvoicePayload(
  body: Record<string, unknown>,
): UpdateMakeupPurchaseInvoicePayload | null {
  const payload: UpdateMakeupPurchaseInvoicePayload = {};
  if (Object.prototype.hasOwnProperty.call(body, 'invoiceDate')) {
    const invoiceDate = parseDateString(body.invoiceDate);
    if (!invoiceDate) return null;
    payload.invoiceDate = invoiceDate;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const status = parsePurchaseInvoiceStatus(body.status);
    if (!status) return null;
    payload.status = status;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'supplierName')) {
    payload.supplierName =
      body.supplierName === null ? null : parseString(body.supplierName);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'supplierPhone')) {
    payload.supplierPhone =
      body.supplierPhone === null ? null : parseString(body.supplierPhone);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    payload.note = body.note === null ? null : parseString(body.note);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'items')) {
    const items = parsePurchaseInvoicePayloadItems(body.items);
    if (items === null) return null;
    payload.items = items;
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

export async function handleGetMakeupOrders(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = getSearchParams(request);
    const payload = await listMakeupOrders(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(query.get('branchId')),
        startDate: parseDateString(query.get('startDate')),
        endDate: parseDateString(query.get('endDate')),
        status: parseEventStatus(query.get('status')),
        search: parseString(query.get('search')),
      },
    });
    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handlePostMakeupOrder(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseCreateMakeupOrderPayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await createMakeupOrder(supabase, {
      actorProfileId: profileId,
      payload,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handlePatchMakeupOrder(
  request: Request,
  orderId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseUpdateMakeupOrderPayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await updateMakeupOrder(supabase, {
      actorProfileId: profileId,
      orderId,
      payload,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handleGetMakeupPurchaseInvoices(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = getSearchParams(request);
    const payload = await listMakeupPurchaseInvoices(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(query.get('branchId')),
        startDate: parseDateString(query.get('startDate')),
        endDate: parseDateString(query.get('endDate')),
        status: parsePurchaseInvoiceStatus(query.get('status')),
        search: parseString(query.get('search')),
      },
    });
    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handlePostMakeupPurchaseInvoice(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseCreateMakeupPurchaseInvoicePayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await createMakeupPurchaseInvoice(supabase, {
      actorProfileId: profileId,
      payload,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handlePatchMakeupPurchaseInvoice(
  request: Request,
  invoiceId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseUpdateMakeupPurchaseInvoicePayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await updateMakeupPurchaseInvoice(supabase, {
      actorProfileId: profileId,
      invoiceId,
      payload,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}

export async function handleGetMakeupAdminOverview(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = getSearchParams(request);
    const granularityRaw =
      parseString(query.get('granularity'))?.toLowerCase() ?? 'day';
    const granularity = OVERVIEW_GRANULARITY_SET.has(granularityRaw)
      ? (granularityRaw as 'day' | 'month')
      : 'day';
    const payload = await getMakeupAdminOverview(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(query.get('branchId')),
        startDate: parseDateString(query.get('startDate')),
        endDate: parseDateString(query.get('endDate')),
        granularity,
      },
    });
    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}
