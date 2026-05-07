import { Body, Get, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';

@V1Controller('orders')
export class MiniAppOrdersController {
  constructor(
    private readonly miniAppExtensionsService: MiniAppExtensionsService,
  ) {}

  @Get('drafts')
  async getOrderDraft(@ApiRequest() request: Request): Promise<unknown> {
    return this.miniAppExtensionsService.getOrderDraft(request);
  }

  @Post('drafts')
  async createOrderDraft(
    @ApiRequest() request: Request,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postOrderDraft(request, body);
  }

  @Post('mini-app/create')
  async createMiniAppOrder(
    @ApiRequest() request: Request,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postRentalOrderCreate(request, body);
  }
}
