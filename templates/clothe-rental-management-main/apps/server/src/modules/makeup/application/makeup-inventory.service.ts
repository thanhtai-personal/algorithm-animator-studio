import type { Request } from 'express';
import {
  createMakeupInventoryItem,
  listMakeupInventoryItems,
  updateMakeupInventoryItem,
} from '../infrastructure/makeup.data-access';
import type {
  CreateMakeupInventoryItemPayload,
  UpdateMakeupInventoryItemPayload,
} from '../types/makeup-module.type';
import {
  getAuthedClient,
  getSearchParams,
  jsonResult,
  mapMakeupDomainError,
  parseBoolean,
  parseRecord,
  parseString,
  readJsonBody,
  unauthorizedResponse,
} from './makeup-admin-shared.service';

function parseCreateMakeupInventoryItemPayload(
  body: Record<string, unknown>,
): CreateMakeupInventoryItemPayload | null {
  const name = parseString(body.name);
  const packageId = parseString(body.packageId);
  const artistProfileId = parseString(body.artistProfileId);
  if (!name || !packageId || !artistProfileId) return null;

  return {
    branchId: parseString(body.branchId),
    name,
    category:
      body.category === undefined ? undefined : parseString(body.category),
    packageId,
    artistProfileId,
    shopeeUrl:
      body.shopeeUrl === undefined ? undefined : parseString(body.shopeeUrl),
    note: body.note === undefined ? undefined : parseString(body.note),
    isActive: parseBoolean(body.isActive),
  };
}

function parseUpdateMakeupInventoryItemPayload(
  body: Record<string, unknown>,
): UpdateMakeupInventoryItemPayload | null {
  const payload: UpdateMakeupInventoryItemPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'category')) {
    payload.category =
      body.category === null ? null : parseString(body.category);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'packageId')) {
    const packageId = parseString(body.packageId);
    if (!packageId) return null;
    payload.packageId = packageId;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'artistProfileId')) {
    const artistProfileId = parseString(body.artistProfileId);
    if (!artistProfileId) return null;
    payload.artistProfileId = artistProfileId;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'shopeeUrl')) {
    payload.shopeeUrl =
      body.shopeeUrl === null ? null : parseString(body.shopeeUrl);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    payload.note = body.note === null ? null : parseString(body.note);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

export async function handleGetMakeupInventory(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = getSearchParams(request);
    const payload = await listMakeupInventoryItems(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(query.get('branchId')),
        packageId: parseString(query.get('packageId')),
        artistProfileId: parseString(query.get('artistProfileId')),
        isActive:
          query.get('isActive') === null
            ? null
            : (parseBoolean(query.get('isActive') ?? undefined) ?? null),
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

export async function handlePostMakeupInventory(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseCreateMakeupInventoryItemPayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await createMakeupInventoryItem(supabase, {
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

export async function handlePatchMakeupInventory(
  request: Request,
  itemId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const payload = parseUpdateMakeupInventoryItemPayload(body);
    if (!payload)
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    const result = await updateMakeupInventoryItem(supabase, {
      actorProfileId: profileId,
      itemId,
      payload,
    });
    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED')
      return unauthorizedResponse();
    return mapMakeupDomainError(error);
  }
}
