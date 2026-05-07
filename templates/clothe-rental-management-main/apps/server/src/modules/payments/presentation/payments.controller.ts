import { Body, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  PaymentsService,
  type PaymentsApiResult,
} from '../application/payments.service';

function writeApiResult(response: Response, result: PaymentsApiResult): void {
  if (result.headers) {
    for (const [name, value] of Object.entries(result.headers)) {
      response.setHeader(name, value);
    }
  }

  response.status(result.status);
  if (result.isRaw) {
    response.send(result.body as string | Buffer);
    return;
  }

  response.json(result.body);
}

@V1Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getPayments(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.getPayments(request);
    writeApiResult(response, result);
  }

  @Post()
  async postManualPayment(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.postManualPayment(request, body);
    writeApiResult(response, result);
  }

  @Post('receipt-upload')
  async postPaymentReceiptUpload(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.postPaymentReceiptUpload(
      request,
      body,
    );
    writeApiResult(response, result);
  }

  @Get('export')
  async exportPaymentsCsv(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.exportPaymentsCsv(request);
    writeApiResult(response, result);
  }

  @Get(':paymentId/attachments')
  async getPaymentAttachments(
    @ApiRequest() request: Request,
    @Param('paymentId') paymentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.getPaymentAttachments(
      request,
      paymentId,
    );
    writeApiResult(response, result);
  }

  @Patch(':paymentId/status')
  async patchPaymentStatus(
    @ApiRequest() request: Request,
    @Param('paymentId') paymentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.patchPaymentStatus(
      request,
      paymentId,
    );
    writeApiResult(response, result);
  }

  @Patch(':paymentId')
  async patchPayment(
    @ApiRequest() request: Request,
    @Param('paymentId') paymentId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.paymentsService.patchPayment(request, paymentId);
    writeApiResult(response, result);
  }
}
