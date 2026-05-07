import { Body, Get, Param, Patch, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import { CustomersService } from '../application/customers.service';

@V1Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('typeahead')
  async getCustomersTypeahead(
    @ApiRequest() request: Request,
  ): Promise<unknown> {
    return this.customersService.getCustomersTypeahead(request);
  }

  @Get()
  async getCustomers(@ApiRequest() request: Request): Promise<unknown> {
    return this.customersService.getCustomers(request);
  }

  @Post()
  async createCustomer(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.customersService.createCustomer(request, body);
  }

  @Get(':customerId')
  async getCustomerDetail(
    @ApiRequest() request: Request,
    @Param('customerId') customerId: string,
  ): Promise<unknown> {
    return this.customersService.getCustomerDetail(request, customerId);
  }

  @Patch(':customerId')
  async patchCustomer(
    @ApiRequest() request: Request,
    @Param('customerId') customerId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.customersService.patchCustomer(request, customerId, body);
  }
}
