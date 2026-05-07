import { Get } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { MiniAppExtensionsService } from './extention-service/mini-app-extensions.service';

@V1Controller('reports')
export class MiniAppReportsController {
  constructor(
    private readonly miniAppExtensionsService: MiniAppExtensionsService,
  ) {}

  @Get('dashboard/overview')
  async getDashboardOverview(@ApiRequest() request: Request): Promise<unknown> {
    return this.miniAppExtensionsService.getRentalDashboardOverview(request);
  }
}
