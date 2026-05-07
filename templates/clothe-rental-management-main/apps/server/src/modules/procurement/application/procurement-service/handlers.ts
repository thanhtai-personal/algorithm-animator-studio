import type { Request } from 'express';
import { readJsonBody } from '../../../../common/http/request-body.util';
import {
  commitProcurementImportXlsxForActor,
  createProductsFromProcurementReceiptForActor,
  createProcurementReceiptForActor,
  exportProcurementIncompleteRowsXlsxBuffer,
  exportProcurementTemplateXlsxBuffer,
  getProcurementReceiptDetailForActor,
  listProcurementCategoriesForActor,
  listProcurementProductsForActor,
  listProcurementReceiptsForActor,
  rollbackProcurementReceiptForActor,
  updateProcurementReceiptForActor,
  validateProcurementImportXlsxForActor,
} from '../../infrastructure/procurement.data-access';
import type { ProcurementListQuery } from '../../types/procurement-module.type';
import {
  parseCreatePayload,
  parseImportFormData,
  parseIncompleteExportPayload,
  parseProcurementCategoriesQuery,
  parseProcurementListQuery,
  parseProcurementProductsQuery,
  parseRollbackPayload,
  parseString,
  parseUpdatePayload,
} from './parsers';
import {
  buildXlsxResponse,
  getAuthedClient,
  getSearchParams,
  jsonResult,
  mapDomainError,
  unauthorizedResponse,
} from './result-utils';

export async function handleGetProcurementReceipts(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    let query: ProcurementListQuery;
    try {
      query = parseProcurementListQuery(getSearchParams(request));
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_DATE_FORMAT') {
        return jsonResult(
          { error: 'startDate/endDate must use YYYY-MM-DD format' },
          { status: 400 },
        );
      }

      if (
        error instanceof Error &&
        error.message === 'INVALID_INTAKE_CHANNEL'
      ) {
        return jsonResult(
          { error: 'intakeChannel must be MANUAL or EXCEL' },
          { status: 400 },
        );
      }
      throw error;
    }

    const payload = await listProcurementReceiptsForActor(supabase, {
      actorProfileId: profileId,
      query,
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetProcurementReceiptDetail(
  request: Request,
  receiptId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const detail = await getProcurementReceiptDetailForActor(supabase, {
      actorProfileId: profileId,
      receiptId,
    });

    if (!detail) {
      return jsonResult({ error: 'RECEIPT_NOT_FOUND' }, { status: 404 });
    }

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePatchProcurementReceipt(
  request: Request,
  receiptId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBody(request);
    const payload = parseUpdatePayload(body);
    if (!payload) {
      return jsonResult(
        { error: 'Invalid procurement update payload' },
        { status: 400 },
      );
    }

    const detail = await updateProcurementReceiptForActor(supabase, {
      actorProfileId: profileId,
      receiptId,
      payload,
    });

    return jsonResult(detail);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleDeleteProcurementReceipt(
  request: Request,
  receiptId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBody(request);
    const payload = parseRollbackPayload(body);

    const result = await rollbackProcurementReceiptForActor(supabase, {
      actorProfileId: profileId,
      receiptId,
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

export async function handlePostProcurementReceiptProducts(
  request: Request,
  receiptId: string,
) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);

    const result = await createProductsFromProcurementReceiptForActor(
      supabase,
      {
        actorProfileId: profileId,
        receiptId,
      },
    );

    return jsonResult(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetProcurementProducts(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = parseProcurementProductsQuery(getSearchParams(request));

    const payload = await listProcurementProductsForActor(supabase, {
      actorProfileId: profileId,
      query,
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetProcurementCategories(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const query = parseProcurementCategoriesQuery(getSearchParams(request));

    const payload = await listProcurementCategoriesForActor(supabase, {
      actorProfileId: profileId,
      query,
    });

    return jsonResult(payload);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostProcurementReceipt(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const body = readJsonBody(request);

    const payload = parseCreatePayload(body);
    if (!payload) {
      return jsonResult(
        { error: 'Invalid procurement payload' },
        { status: 400 },
      );
    }

    const detail = await createProcurementReceiptForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostProcurementImportValidate(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const payload = parseImportFormData(request);

    if (!payload) {
      return jsonResult(
        { error: 'Invalid import validation payload' },
        { status: 400 },
      );
    }

    const validation = await validateProcurementImportXlsxForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(validation);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostProcurementImportCommit(request: Request) {
  try {
    const { supabase, profileId } = await getAuthedClient(request);
    const payload = parseImportFormData(request, {
      includeCommitFields: true,
    });

    if (!payload) {
      return jsonResult(
        { error: 'Invalid import commit payload' },
        { status: 400 },
      );
    }

    const detail = await commitProcurementImportXlsxForActor(supabase, {
      actorProfileId: profileId,
      payload,
    });

    return jsonResult(detail, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handleGetProcurementTemplateXlsx(request: Request) {
  try {
    await getAuthedClient(request);
    const locale = parseString(getSearchParams(request).get('locale'));
    const xlsx = await exportProcurementTemplateXlsxBuffer(locale);
    const suffix = new Date().toISOString().slice(0, 10);
    return buildXlsxResponse(xlsx, `procurement-template-${suffix}.xlsx`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}

export async function handlePostProcurementImportIncompleteExport(
  request: Request,
) {
  try {
    await getAuthedClient(request);
    const body = readJsonBody(request);
    const payload = parseIncompleteExportPayload(body);
    if (!payload) {
      return jsonResult(
        { error: 'Invalid incomplete rows payload' },
        { status: 400 },
      );
    }

    const xlsx = await exportProcurementIncompleteRowsXlsxBuffer(payload);
    const suffix = new Date().toISOString().slice(0, 10);
    return buildXlsxResponse(xlsx, `procurement-incomplete-${suffix}.xlsx`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return unauthorizedResponse();
    }

    return mapDomainError(error);
  }
}
