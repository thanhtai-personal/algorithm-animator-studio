import { Body, Get, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { NullableQuery } from '../../common/decorators/nullable-query.decorator';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';

@V1Controller('payments')
export class MiniAppPaymentsController {
  constructor(
    private readonly miniAppExtensionsService: MiniAppExtensionsService,
  ) {}

  @Post('mini-app/create-order')
  async createMiniAppPaymentOrder(
    @ApiRequest() request: Request,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postCreatePaymentOrder(request, body);
  }

  @Get('mini-app/check-transaction')
  async getMiniAppPaymentTransaction(
    @ApiRequest() request: Request,
    @NullableQuery('externalOrderId') externalOrderId: string | null,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.getPaymentTransaction(
      request,
      externalOrderId,
    );
  }

  @Post('mini-app/callback')
  async postMiniAppPaymentCallback(
    @ApiRequest() request: Request,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postPaymentCallback(request, body);
  }
}
