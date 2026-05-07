import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  handleDeleteProcurementReceipt,
  handleGetProcurementCategories,
  handleGetProcurementProducts,
  handleGetProcurementReceiptDetail,
  handleGetProcurementReceipts,
  handleGetProcurementTemplateXlsx,
  handlePatchProcurementReceipt,
  handlePostProcurementImportCommit,
  handlePostProcurementImportIncompleteExport,
  handlePostProcurementImportValidate,
  handlePostProcurementReceipt,
  handlePostProcurementReceiptProducts,
} from './handlers';
import type { ProcurementApiResult } from './types';

@Injectable()
export class ProcurementService {
  getProcurementReceipts(request: Request): Promise<ProcurementApiResult> {
    return handleGetProcurementReceipts(request);
  }

  getProcurementReceiptDetail(
    request: Request,
    receiptId: string,
  ): Promise<ProcurementApiResult> {
    return handleGetProcurementReceiptDetail(request, receiptId);
  }

  patchProcurementReceipt(
    request: Request,
    receiptId: string,
  ): Promise<ProcurementApiResult> {
    return handlePatchProcurementReceipt(request, receiptId);
  }

  deleteProcurementReceipt(
    request: Request,
    receiptId: string,
  ): Promise<ProcurementApiResult> {
    return handleDeleteProcurementReceipt(request, receiptId);
  }

  postProcurementReceiptProducts(
    request: Request,
    receiptId: string,
  ): Promise<ProcurementApiResult> {
    return handlePostProcurementReceiptProducts(request, receiptId);
  }

  getProcurementProducts(request: Request): Promise<ProcurementApiResult> {
    return handleGetProcurementProducts(request);
  }

  getProcurementCategories(request: Request): Promise<ProcurementApiResult> {
    return handleGetProcurementCategories(request);
  }

  postProcurementReceipt(request: Request): Promise<ProcurementApiResult> {
    return handlePostProcurementReceipt(request);
  }

  postProcurementImportValidate(
    request: Request,
  ): Promise<ProcurementApiResult> {
    return handlePostProcurementImportValidate(request);
  }

  postProcurementImportCommit(request: Request): Promise<ProcurementApiResult> {
    return handlePostProcurementImportCommit(request);
  }

  getProcurementTemplateXlsx(request: Request): Promise<ProcurementApiResult> {
    return handleGetProcurementTemplateXlsx(request);
  }

  postProcurementImportIncompleteExport(
    request: Request,
  ): Promise<ProcurementApiResult> {
    return handlePostProcurementImportIncompleteExport(request);
  }
}
