import type { Request } from 'express';
import { readJsonBodyAsRecord } from '../../../../common/http/request-body.util';
import {
  cancelReturnOrderForAdmin,
  completeReturnOrderForAdmin,
  createReturnOrderForAdmin,
  getReturnOrderDetailForAdmin,
  listReturnOrderSourcesForAdmin,
  settleReturnOrderForAdmin,
  transitionReturnOrderStatusForAdmin,
} from '../../infrastructure/return-orders.data-access';
import type {
  CreateReturnOrderPayload,
  SettleReturnOrderPayload,
  TransitionReturnOrderStatusPayload,
} from '../../types/return-orders.type';
import {
  getAuthedClient,
  getSearchParams,
  jsonResult,
  mapDomainError,
  parseDateString,
  parseInteger,
  parseNumeric,
  parseOrderPaymentMethod,
  parseString,
  unauthorizedResponse,
  type ReturnsApiResult,
} from './shared';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 80;

export async function handleGetReturnOrderSources(
  request: Request,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const searchParams = getSearchParams(request);

    const page = parseInteger(searchParams.get('page'), 1);
    const pageSize = Math.min(
      parseInteger(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );

    const result = await listReturnOrderSourcesForAdmin(supabase, {
      actorProfileId: profileId,
      query: {
        branchId: parseString(searchParams.get('branchId')),
        search: parseString(searchParams.get('search')) ?? undefined,
        page,
        pageSize,
      },
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleCreateReturnOrder(
  request: Request,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const actualReturnDate = parseDateString(body.actualReturnDate);
    if (!actualReturnDate) {
      return jsonResult(
        { error: 'actualReturnDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const statusRaw = parseString(body.status);
    if (statusRaw && statusRaw !== 'DRAFT' && statusRaw !== 'CREATED') {
      return jsonResult(
        { error: 'status must be DRAFT or CREATED' },
        { status: 400 },
      );
    }

    const payload: CreateReturnOrderPayload = {
      sourceRentalOrderId: parseString(body.sourceRentalOrderId) ?? '',
      actualReturnDate,
      note: body.note === undefined ? undefined : parseString(body.note),
      internalNote:
        body.internalNote === undefined
          ? undefined
          : parseString(body.internalNote),
      status: (statusRaw as 'DRAFT' | 'CREATED' | null) ?? undefined,
    };

    const result = await createReturnOrderForAdmin(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleGetReturnOrderDetail(
  request: Request,
  returnOrderId: string,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    void profileId;

    const result = await getReturnOrderDetailForAdmin(supabase, {
      returnOrderId,
    });
    if (!result) {
      return jsonResult({ error: 'RETURN_ORDER_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handlePatchReturnOrderStatus(
  request: Request,
  returnOrderId: string,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const toStatus = parseString(body.toStatus);
    if (toStatus !== 'CREATED' && toStatus !== 'CANCELLED') {
      return jsonResult(
        { error: 'toStatus must be CREATED or CANCELLED' },
        { status: 400 },
      );
    }

    const payload: TransitionReturnOrderStatusPayload = {
      toStatus,
      reason: body.reason === undefined ? undefined : parseString(body.reason),
    };

    const result = await transitionReturnOrderStatusForAdmin(supabase, {
      actorProfileId: profileId,
      returnOrderId,
      payload,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleSettleReturnOrder(
  request: Request,
  returnOrderId: string,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const items = Array.isArray(body.items) ? body.items : null;
    if (!items) {
      return jsonResult({ error: 'Invalid payload' }, { status: 400 });
    }

    const actualReturnDateRaw =
      body.actualReturnDate === undefined
        ? undefined
        : parseDateString(body.actualReturnDate);
    if (body.actualReturnDate !== undefined && !actualReturnDateRaw) {
      return jsonResult(
        { error: 'actualReturnDate must use YYYY-MM-DD format' },
        { status: 400 },
      );
    }

    const customFeesAmountRaw = parseNumeric(body.customFeesAmount);
    if (
      body.customFeesAmount !== undefined &&
      body.customFeesAmount !== null &&
      customFeesAmountRaw === null
    ) {
      return jsonResult({ error: 'Invalid customFeesAmount' }, { status: 400 });
    }

    const additionalCollectedAmountRaw = parseNumeric(
      body.additionalCollectedAmount,
    );
    if (
      body.additionalCollectedAmount !== undefined &&
      body.additionalCollectedAmount !== null &&
      additionalCollectedAmountRaw === null
    ) {
      return jsonResult(
        { error: 'Invalid additionalCollectedAmount' },
        { status: 400 },
      );
    }

    const additionalCollectionMethod =
      body.additionalCollectionMethod === undefined
        ? undefined
        : body.additionalCollectionMethod === null ||
            body.additionalCollectionMethod === ''
          ? null
          : parseOrderPaymentMethod(body.additionalCollectionMethod);
    if (
      body.additionalCollectionMethod !== undefined &&
      body.additionalCollectionMethod !== null &&
      body.additionalCollectionMethod !== '' &&
      !additionalCollectionMethod
    ) {
      return jsonResult(
        { error: 'Invalid additionalCollectionMethod' },
        { status: 400 },
      );
    }

    const refundAmountRaw = parseNumeric(body.refundAmount);
    if (
      body.refundAmount !== undefined &&
      body.refundAmount !== null &&
      refundAmountRaw === null
    ) {
      return jsonResult({ error: 'Invalid refundAmount' }, { status: 400 });
    }

    const refundMethodRaw =
      body.refundMethod === undefined
        ? undefined
        : body.refundMethod === null || body.refundMethod === ''
          ? null
          : parseOrderPaymentMethod(body.refundMethod);
    if (
      body.refundMethod !== undefined &&
      body.refundMethod !== null &&
      body.refundMethod !== '' &&
      !refundMethodRaw
    ) {
      return jsonResult({ error: 'Invalid refundMethod' }, { status: 400 });
    }

    const payload: SettleReturnOrderPayload = {
      actualReturnDate: actualReturnDateRaw,
      items: items as SettleReturnOrderPayload['items'],
      customFeesAmount:
        body.customFeesAmount === undefined ? undefined : customFeesAmountRaw,
      additionalCollectedAmount:
        body.additionalCollectedAmount === undefined
          ? undefined
          : additionalCollectedAmountRaw,
      additionalCollectionMethod:
        additionalCollectionMethod === undefined
          ? undefined
          : additionalCollectionMethod,
      additionalCollectionNote:
        body.additionalCollectionNote === undefined
          ? undefined
          : parseString(body.additionalCollectionNote),
      refundAmount:
        body.refundAmount === undefined ? undefined : refundAmountRaw,
      refundMethod: refundMethodRaw === undefined ? undefined : refundMethodRaw,
      refundReason:
        body.refundReason === undefined
          ? undefined
          : parseString(body.refundReason),
      refundNote:
        body.refundNote === undefined
          ? undefined
          : parseString(body.refundNote),
    };

    const result = await settleReturnOrderForAdmin(supabase, {
      actorProfileId: profileId,
      returnOrderId,
      payload,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleCompleteReturnOrder(
  request: Request,
  returnOrderId: string,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const result = await completeReturnOrderForAdmin(supabase, {
      actorProfileId: profileId,
      returnOrderId,
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}

export async function handleCancelReturnOrder(
  request: Request,
  returnOrderId: string,
): Promise<ReturnsApiResult> {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBodyAsRecord(request);

    const result = await cancelReturnOrderForAdmin(supabase, {
      actorProfileId: profileId,
      returnOrderId,
      reason: parseString(body.reason),
    });

    return jsonResult(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }
    return mapDomainError(error);
  }
}
