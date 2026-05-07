import { Body, Get, Param, Patch, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import { MakeupService } from '../application/makeup.service';
import type { MakeupApiResult } from '../application/makeup-admin-shared.service';

function writeApiResult(response: Response, result: MakeupApiResult): void {
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

@V1Controller('makeup')
export class MakeupController {
  constructor(private readonly makeupService: MakeupService) {}

  @Get('events')
  async getMakeupEvents(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(response, await this.makeupService.getMakeupEvents(request));
  }

  @Post('events')
  async postMakeupEvent(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(response, await this.makeupService.postMakeupEvent(request));
  }

  @Patch('events/:eventId')
  async patchMakeupEvent(
    @ApiRequest() request: Request,
    @Param('eventId') eventId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.patchMakeupEvent(request, eventId),
    );
  }

  @Get('events/conflicts')
  async getMakeupConflicts(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupConflicts(request),
    );
  }

  @Post('events/parse')
  async postMakeupBookingParse(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.postMakeupBookingParse(request),
    );
  }

  @Get('artists/public')
  async getPublicMakeupArtists(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getPublicMakeupArtists(request),
    );
  }

  @Get('artists')
  async getMakeupArtists(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupArtists(request),
    );
  }

  @Get('artists/:artistProfileId/schedule')
  async getMakeupArtistSchedule(
    @ApiRequest() request: Request,
    @Param('artistProfileId') artistProfileId: string,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupArtistSchedule(
        request,
        artistProfileId,
      ),
    );
  }

  @Get('packages')
  async getMakeupPackages(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupPackages(request),
    );
  }

  @Post('packages')
  async postMakeupPackage(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.postMakeupPackage(request),
    );
  }

  @Patch('packages/:packageId')
  async patchMakeupPackage(
    @ApiRequest() request: Request,
    @Param('packageId') packageId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.patchMakeupPackage(request, packageId),
    );
  }

  @Get('stats/my')
  async getMyMakeupStats(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMyMakeupStats(request),
    );
  }

  @Get('inventory')
  async getMakeupInventory(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupInventory(request),
    );
  }

  @Post('inventory')
  async postMakeupInventory(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.postMakeupInventory(request),
    );
  }

  @Patch('inventory/:itemId')
  async patchMakeupInventory(
    @ApiRequest() request: Request,
    @Param('itemId') itemId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.patchMakeupInventory(request, itemId),
    );
  }

  @Get('orders')
  async getMakeupOrders(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(response, await this.makeupService.getMakeupOrders(request));
  }

  @Post('orders')
  async postMakeupOrder(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(response, await this.makeupService.postMakeupOrder(request));
  }

  @Patch('orders/:orderId')
  async patchMakeupOrder(
    @ApiRequest() request: Request,
    @Param('orderId') orderId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.patchMakeupOrder(request, orderId),
    );
  }

  @Get('purchase-invoices')
  async getMakeupPurchaseInvoices(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupPurchaseInvoices(request),
    );
  }

  @Post('purchase-invoices')
  async postMakeupPurchaseInvoice(
    @ApiRequest() request: Request,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.postMakeupPurchaseInvoice(request),
    );
  }

  @Patch('purchase-invoices/:invoiceId')
  async patchMakeupPurchaseInvoice(
    @ApiRequest() request: Request,
    @Param('invoiceId') invoiceId: string,
    @Body() _body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.patchMakeupPurchaseInvoice(request, invoiceId),
    );
  }

  @Get('admin/overview')
  async getMakeupAdminOverview(
    @ApiRequest() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    writeApiResult(
      response,
      await this.makeupService.getMakeupAdminOverview(request),
    );
  }
}
