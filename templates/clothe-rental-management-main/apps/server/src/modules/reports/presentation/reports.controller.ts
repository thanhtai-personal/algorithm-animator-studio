import { Get, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  ReportsService,
  type ReportsApiResult,
} from '../application/reports.service';

function writeApiResult(response: Response, result: ReportsApiResult): void {
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

@V1Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  async getRevenueReport(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.getRevenueReport(request);
    writeApiResult(response, result);
  }

  @Get('revenue/export')
  async exportRevenueCsv(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.exportRevenueCsv(request);
    writeApiResult(response, result);
  }

  @Get('utilization')
  async getUtilizationReport(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.getUtilizationReport(request);
    writeApiResult(response, result);
  }

  @Get('utilization/export')
  async exportUtilizationCsv(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.exportUtilizationCsv(request);
    writeApiResult(response, result);
  }

  @Get('incidents')
  async getIncidentsReport(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.getIncidentsReport(request);
    writeApiResult(response, result);
  }

  @Get('incidents/export')
  async exportIncidentsCsv(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.reportsService.exportIncidentsCsv(request);
    writeApiResult(response, result);
  }
}
