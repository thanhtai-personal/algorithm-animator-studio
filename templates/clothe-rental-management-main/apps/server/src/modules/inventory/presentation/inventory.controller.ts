import { Body, Get, Param, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import { InventoryService } from '../application/inventory.service';

@V1Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('scan')
  async scanInventoryItem(@ApiRequest() request: Request): Promise<unknown> {
    return this.inventoryService.scanInventoryItem(request);
  }

  @Patch('bulk-status')
  async patchInventoryItemsBulkStatus(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.inventoryService.patchInventoryItemsBulkStatus(request, body);
  }

  @Get()
  async getInventoryItems(@ApiRequest() request: Request): Promise<unknown> {
    return this.inventoryService.getInventoryItems(request);
  }

  @Get(':itemId')
  async getInventoryItemDetail(
    @ApiRequest() request: Request,
    @Param('itemId') itemId: string,
  ): Promise<unknown> {
    return this.inventoryService.getInventoryItemDetail(request, itemId);
  }

  @Patch(':itemId/status')
  async patchInventoryItemStatus(
    @ApiRequest() request: Request,
    @Param('itemId') itemId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.inventoryService.patchInventoryItemStatus(
      request,
      itemId,
      body,
    );
  }
}
