import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../../common/decorators/api-request.decorator';
import { ProductsService } from '../application/products.service';

@V1Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@ApiRequest() request: Request): Promise<unknown> {
    return this.productsService.getProducts(request);
  }

  @Get('showroom')
  async getShowroomProducts(@ApiRequest() request: Request): Promise<unknown> {
    return this.productsService.getShowroomProducts(request);
  }

  @Get('showroom/:productId')
  async getShowroomProductDetail(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
  ): Promise<unknown> {
    return this.productsService.getShowroomProductDetail(request, productId);
  }

  @Post()
  async createProduct(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.productsService.createProduct(request, body);
  }

  @Get(':productId')
  async getProductDetail(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
  ): Promise<unknown> {
    return this.productsService.getProductDetail(request, productId);
  }

  @Patch(':productId')
  async patchProductOverview(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.productsService.updateProductOverview(request, productId, body);
  }

  @Delete(':productId')
  async deleteProduct(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
  ): Promise<unknown> {
    return this.productsService.deleteProduct(request, productId);
  }

  @Patch(':productId/pricing')
  async patchProductPricing(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.productsService.updateProductPricing(request, productId, body);
  }

  @Post(':productId/items')
  async postProductItems(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.productsService.addProductItems(request, productId, body);
  }

  @Patch(':productId/items/:itemId')
  async patchProductItem(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Param('itemId') itemId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.productsService.updateProductItem(
      request,
      productId,
      itemId,
      body,
    );
  }

  @Delete(':productId/items/:itemId')
  async deleteProductItem(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Param('itemId') itemId: string,
  ): Promise<unknown> {
    return this.productsService.deleteProductItem(request, productId, itemId);
  }

  @Post(':productId/variants')
  postProductVariant(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
  ): unknown {
    return this.productsService.createProductVariant(request, productId);
  }

  @Patch(':productId/variants/:variantId')
  patchProductVariant(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): unknown {
    return this.productsService.updateProductVariant(
      request,
      productId,
      variantId,
    );
  }

  @Delete(':productId/variants/:variantId')
  deleteProductVariant(
    @ApiRequest() request: Request,
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ): unknown {
    return this.productsService.deleteProductVariant(
      request,
      productId,
      variantId,
    );
  }
}
