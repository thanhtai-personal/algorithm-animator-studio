import { Body, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  ReturnsService,
  type ReturnsApiResult,
} from '../application/returns.service';

function writeApiResult(response: Response, result: ReturnsApiResult): void {
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

@V1Controller('return-orders')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async getReturnOrderSources(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.getReturnOrderSources(request);
    writeApiResult(response, result);
  }

  @Get('sources')
  async getReturnOrderSourcesAlias(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.getReturnOrderSources(request);
    writeApiResult(response, result);
  }

  @Post()
  async createReturnOrder(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.createReturnOrder(request);
    writeApiResult(response, result);
  }

  @Get(':returnOrderId')
  async getReturnOrderDetail(
    @ApiRequest() request: Request,
    @Param('returnOrderId') returnOrderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.getReturnOrderDetail(
      request,
      returnOrderId,
    );
    writeApiResult(response, result);
  }

  @Patch(':returnOrderId/status')
  async patchReturnOrderStatus(
    @ApiRequest() request: Request,
    @Param('returnOrderId') returnOrderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.patchReturnOrderStatus(
      request,
      returnOrderId,
    );
    writeApiResult(response, result);
  }

  @Post(':returnOrderId/settle')
  async settleReturnOrder(
    @ApiRequest() request: Request,
    @Param('returnOrderId') returnOrderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.settleReturnOrder(
      request,
      returnOrderId,
    );
    writeApiResult(response, result);
  }

  @Post(':returnOrderId/complete')
  async completeReturnOrder(
    @ApiRequest() request: Request,
    @Param('returnOrderId') returnOrderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.completeReturnOrder(
      request,
      returnOrderId,
    );
    writeApiResult(response, result);
  }

  @Post(':returnOrderId/cancel')
  async cancelReturnOrder(
    @ApiRequest() request: Request,
    @Param('returnOrderId') returnOrderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.returnsService.cancelReturnOrder(
      request,
      returnOrderId,
    );
    writeApiResult(response, result);
  }
}
