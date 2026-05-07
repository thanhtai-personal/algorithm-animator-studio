import {
  BadRequestException,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  ProcurementService,
  type ProcurementApiResult,
} from '../application/procurement.service';

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const XLSX_MIME_TYPE_SET = new Set<string>([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

interface UploadedImportFile {
  mimetype?: string;
  originalname?: string;
}

function isXlsxFile(file: UploadedImportFile): boolean {
  const mimetype = file.mimetype?.toLowerCase() ?? '';
  const fileName = file.originalname?.toLowerCase() ?? '';
  return XLSX_MIME_TYPE_SET.has(mimetype) || fileName.endsWith('.xlsx');
}

function validateImportFileType(
  _request: Request,
  file: UploadedImportFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!isXlsxFile(file)) {
    callback(new BadRequestException({ error: 'IMPORT_FILE_INVALID' }), false);
    return;
  }

  callback(null, true);
}

function writeApiResult(
  response: Response,
  result: ProcurementApiResult,
): void {
  if (result.headers) {
    for (const [name, value] of Object.entries(result.headers)) {
      response.setHeader(name, value);
    }
  }

  response.status(result.status);
  if (result.isRaw) {
    response.send(result.body as string | Buffer | Uint8Array | ArrayBuffer);
    return;
  }

  response.json(result.body);
}

@V1Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get()
  async getProcurementReceipts(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.getProcurementReceipts(request);
    writeApiResult(response, result);
  }

  @Post()
  async postProcurementReceipt(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.postProcurementReceipt(request);
    writeApiResult(response, result);
  }

  @Get('products')
  async getProcurementProducts(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.getProcurementProducts(request);
    writeApiResult(response, result);
  }

  @Get('categories')
  async getProcurementCategories(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.getProcurementCategories(request);
    writeApiResult(response, result);
  }

  @Get('template')
  async getProcurementTemplateXlsx(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.getProcurementTemplateXlsx(request);
    writeApiResult(response, result);
  }

  @Post('import/validate')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_FILE_BYTES },
      fileFilter: validateImportFileType,
    }),
  )
  async postProcurementImportValidate(
    @ApiRequest() request: Request,
    @UploadedFile() _file: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.postProcurementImportValidate(request);
    writeApiResult(response, result);
  }

  @Post('import/commit')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMPORT_FILE_BYTES },
      fileFilter: validateImportFileType,
    }),
  )
  async postProcurementImportCommit(
    @ApiRequest() request: Request,
    @UploadedFile() _file: unknown,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.postProcurementImportCommit(request);
    writeApiResult(response, result);
  }

  @Post('import/incomplete/export')
  async postProcurementImportIncompleteExport(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result =
      await this.procurementService.postProcurementImportIncompleteExport(
        request,
      );
    writeApiResult(response, result);
  }

  @Get(':receiptId')
  async getProcurementReceiptDetail(
    @ApiRequest() request: Request,
    @Param('receiptId') receiptId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.procurementService.getProcurementReceiptDetail(
      request,
      receiptId,
    );
    writeApiResult(response, result);
  }

  @Patch(':receiptId')
  async patchProcurementReceipt(
    @ApiRequest() request: Request,
    @Param('receiptId') receiptId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.procurementService.patchProcurementReceipt(
      request,
      receiptId,
    );
    writeApiResult(response, result);
  }

  @Post(':receiptId/products')
  async postProcurementReceiptProducts(
    @ApiRequest() request: Request,
    @Param('receiptId') receiptId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.procurementService.postProcurementReceiptProducts(
      request,
      receiptId,
    );
    writeApiResult(response, result);
  }

  @Delete(':receiptId')
  async deleteProcurementReceipt(
    @ApiRequest() request: Request,
    @Param('receiptId') receiptId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.procurementService.deleteProcurementReceipt(
      request,
      receiptId,
    );
    writeApiResult(response, result);
  }
}
