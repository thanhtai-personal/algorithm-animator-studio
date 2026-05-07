import { Body, Get, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { NullableQuery } from '../../common/decorators/nullable-query.decorator';
import { CreateMiniAppSessionDto } from './dto/create-mini-app-session.dto';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';
import { MiniAppService } from './mini-app.service';

@V1Controller('auth')
export class MiniAppAuthController {
  constructor(
    private readonly miniAppService: MiniAppService,
    private readonly miniAppExtensionsService: MiniAppExtensionsService,
  ) {}

  @Post('mini-app/session')
  async createMiniAppSession(
    @Body() body: CreateMiniAppSessionDto,
  ): Promise<unknown> {
    return this.miniAppService.createAuthSession(body);
  }

  @Get('rental-access')
  async getRentalAccess(
    @ApiRequest() request: Request,
    @NullableQuery('app') app: string | null,
    @NullableQuery('branchId') branchId: string | null,
  ): Promise<unknown> {
    return this.miniAppService.getRentalAccess(request, app, branchId);
  }

  @Post('mini-app/webhooks')
  async postMiniAppWebhook(
    @ApiRequest() request: Request,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.miniAppExtensionsService.postWebhook(request, body);
  }
}
