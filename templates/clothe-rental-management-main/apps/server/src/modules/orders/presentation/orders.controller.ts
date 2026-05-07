import { Body, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import {
  OrdersService,
  type OrdersApiResult,
} from '../application/orders.service';

function writeApiResult(response: Response, result: OrdersApiResult): void {
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

@V1Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.getOrders(request);
    writeApiResult(response, result);
  }

  @Get('availability')
  async getOrderAvailability(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.getOrderAvailability(request);
    writeApiResult(response, result);
  }

  @Post()
  async createOrder(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.createOrder(request);
    writeApiResult(response, result);
  }

  @Get(':orderId')
  async getOrderDetail(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.getOrderDetail(request, orderId);
    writeApiResult(response, result);
  }

  @Patch(':orderId')
  async patchOrder(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.patchOrder(request, orderId);
    writeApiResult(response, result);
  }

  @Patch(':orderId/status')
  async patchOrderStatus(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.patchOrderStatus(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/pickup')
  async pickupOrder(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.pickupOrder(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/return')
  async processOrderReturn(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.processOrderReturn(
      request,
      orderId,
    );
    writeApiResult(response, result);
  }

  @Post(':orderId/complete')
  async completeOrder(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.completeOrder(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/settle-debt')
  async settleOrderDebt(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.settleOrderDebt(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/payments')
  async addOrderPayment(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.addOrderPayment(request, orderId);
    writeApiResult(response, result);
  }

  @Patch(':orderId/payments/:paymentId/status')
  async patchOrderPaymentStatus(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Param('paymentId') paymentId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.patchOrderPaymentStatus(
      request,
      orderId,
      paymentId,
    );
    writeApiResult(response, result);
  }

  @Post(':orderId/incidents')
  async addOrderIncident(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.addOrderIncident(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/cancel')
  async cancelOrder(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.cancelOrder(request, orderId);
    writeApiResult(response, result);
  }

  @Post(':orderId/items')
  async addOrderItem(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.addOrderItem(request, orderId);
    writeApiResult(response, result);
  }

  @Patch(':orderId/items/:orderItemId')
  async patchOrderItemPricing(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Param('orderItemId') orderItemId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.patchOrderItemPricing(
      request,
      orderId,
      orderItemId,
    );
    writeApiResult(response, result);
  }

  @Delete(':orderId/items/:orderItemId')
  async deleteOrderItem(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Param('orderItemId') orderItemId: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.ordersService.deleteOrderItem(
      request,
      orderId,
      orderItemId,
    );
    writeApiResult(response, result);
  }
}
