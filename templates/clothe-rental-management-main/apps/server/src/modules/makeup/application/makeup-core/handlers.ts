import type { Request } from 'express';
import { createServiceRoleClient } from '../../../../common/supabase/service-role-client.util';
import {
  checkMakeupEventConflicts,
  createMakeupEvent,
  createPublicMakeupEvent,
  createMakeupPackage,
  getMyMakeupStats,
  listMakeupArtists,
  listPublicMakeupArtists,
  listMakeupEvents,
  listMakeupPackages,
  updateMakeupEvent,
  updateMakeupPackage,
} from '../../infrastructure/makeup.data-access';
import { parseMakeupBookingInput } from '../makeup-parser';
import {
  getSearchParams,
  jsonResult,
  readJsonBody,
} from '../makeup-admin-shared.service';
import {
  getAuthedClient,
  mapDomainError,
  unauthorizedResponse,
} from './error-utils';
import {
  parseBoolean,
  parseCreateMakeupEventPayload,
  parseCreateMakeupPackagePayload,
  parseDateString,
  parseDateTimeString,
  parseMakeupBookingInputPayload,
  parseRecord,
  parseSessionSlot,
  parseString,
  parseUpdateMakeupEventPayload,
  parseUpdateMakeupPackagePayload,
} from './parsers';

export async function handleGetMakeupEvents(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const payload = await listMakeupEvents(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate: parseDateString(searchParams.get('startDate')),
        endDate: parseDateString(searchParams.get('endDate')),
        artistProfileId: parseString(searchParams.get('artistProfileId')),
        customerId: parseString(searchParams.get('customerId')),
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handlePostMakeupEvent(request: Request) {
  try {
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });

    const payload = parseCreateMakeupEventPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const requestAsPublic = parseBoolean(body.requestAsPublic) === true;
    if (requestAsPublic) {
      const response = await createPublicMakeupEvent(
        createServiceRoleClient(),
        { payload },
      );
      return jsonResult(response);
    }

    const { supabase, profileId } = await getAuthedClient(request);
    const response = await createMakeupEvent(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handlePatchMakeupEvent(
  request: Request,
  eventId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });

    const payload = parseUpdateMakeupEventPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const response = await updateMakeupEvent(supabase, {
      actorProfileId: profileId,
      eventId,
      payload,
    });

    return jsonResult(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetMakeupConflicts(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const eventDate = parseDateString(searchParams.get('eventDate'));
    const rawSessionSlot = searchParams.get('sessionSlot');
    const sessionSlot = parseSessionSlot(rawSessionSlot);
    const startAt = parseDateTimeString(searchParams.get('startAt'));
    const endAt = parseDateTimeString(searchParams.get('endAt'));
    const artistProfileId = parseString(searchParams.get('artistProfileId'));

    if (!eventDate || (rawSessionSlot !== null && !sessionSlot)) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const payload = await checkMakeupEventConflicts(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        eventDate,
        sessionSlot: sessionSlot ?? undefined,
        startAt,
        endAt,
        artistProfileId,
        customerId: parseString(searchParams.get('customerId')),
        customerPhone: parseString(searchParams.get('customerPhone')),
        excludeEventId: parseString(searchParams.get('excludeEventId')),
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetMakeupArtists(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const payload = await listMakeupArtists(supabase, {
      actorProfileId: profileId,
      branchId: parseString(getSearchParams(request).get('branchId')),
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetPublicMakeupArtists(request: Request) {
  try {
    const payload = await listPublicMakeupArtists(createServiceRoleClient(), {
      branchId: parseString(getSearchParams(request).get('branchId')),
    });

    return jsonResult(payload);
  } catch (error) {
    return mapDomainError(error);
  }
}

export async function handleGetMakeupArtistSchedule(
  request: Request,
  artistProfileId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const payload = await listMakeupEvents(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate: parseDateString(searchParams.get('startDate')),
        endDate: parseDateString(searchParams.get('endDate')),
        artistProfileId,
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetMakeupPackages(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const payload = await listMakeupPackages(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        activeOnly,
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handlePostMakeupPackage(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });

    const payload = parseCreateMakeupPackagePayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const response = await createMakeupPackage(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handlePatchMakeupPackage(
  request: Request,
  packageId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });

    const payload = parseUpdateMakeupPackagePayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const response = await updateMakeupPackage(supabase, {
      actorProfileId: profileId,
      packageId,
      payload,
    });

    return jsonResult(response);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetMyMakeupStats(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const payload = await getMyMakeupStats(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        startDate: parseDateString(searchParams.get('startDate')),
        endDate: parseDateString(searchParams.get('endDate')),
      },
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export function handlePostMakeupBookingParse(request: Request) {
  try {
    const body = parseRecord(readJsonBody(request));
    if (!body) return jsonResult({ error: 'Invalid payload' }, { status: 400 });

    const payload = parseMakeupBookingInputPayload(body);
    if (!payload) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const draft = parseMakeupBookingInput(payload);
    return jsonResult({ draft });
  } catch (error) {
    return mapDomainError(error);
  }
}
