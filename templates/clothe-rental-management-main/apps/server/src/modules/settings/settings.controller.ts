import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { SettingsService } from './settings.service';

@V1Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('general')
  async getGeneral(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsGeneral(request);
  }

  @Patch('general')
  async patchGeneral(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsGeneral(request, body);
  }

  @Get('pos-passkey-policy')
  async getPosPasskeyPolicy(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getPosPasskeyPolicy(request);
  }

  @Post('pos-passkey/verify')
  async postPosPasskeyVerify(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postPosPasskeyVerify(request, body);
  }

  @Patch('pos-passkey')
  async patchPosPasskey(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchPosPasskey(request, body);
  }

  @Get('showroom-pages')
  async getShowroomPages(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsShowroomPages(request);
  }

  @Get('public/showroom-config')
  async getPublicShowroomConfig(
    @ApiRequest() request: Request,
  ): Promise<unknown> {
    return this.settingsService.getPublicShowroomConfig(request);
  }

  @Get('public/branch-context')
  async getPublicBranchContext(
    @ApiRequest() request: Request,
  ): Promise<unknown> {
    return this.settingsService.getPublicBranchContext(request);
  }

  @Get('public/branch-map')
  async getPublicBranchMap(): Promise<unknown> {
    return this.settingsService.getPublicBranchMap();
  }

  @Get('public/site-branding')
  async getPublicSiteBranding(): Promise<unknown> {
    return this.settingsService.getPublicSiteBranding();
  }

  @Patch('showroom-pages')
  async patchShowroomPages(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsShowroomPages(request, body);
  }

  @Get('users')
  async getUsers(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsUsers(request);
  }

  @Post('users')
  async postUser(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postSettingsUser(request, body);
  }

  @Patch('users/:userId')
  async patchUser(
    @ApiRequest() request: Request,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsUser(request, userId, body);
  }

  @Post('users/:userId/reset-password')
  async postUserResetPassword(
    @ApiRequest() request: Request,
    @Param('userId') userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postSettingsUserResetPassword(
      request,
      userId,
      body,
    );
  }

  @Get('branches')
  async getBranches(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsBranches(request);
  }

  @Get('branches/check-shop-domain')
  async getBranchShopDomainCheck(
    @ApiRequest() request: Request,
  ): Promise<unknown> {
    return this.settingsService.getSettingsBranchShopDomainCheck(request);
  }

  @Post('branches')
  async postBranch(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postSettingsBranch(request, body);
  }

  @Patch('branches/:branchId')
  async patchBranch(
    @ApiRequest() request: Request,
    @Param('branchId') branchId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsBranch(request, branchId, body);
  }

  @Get('product-categories')
  async getProductCategories(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsProductCategories(request);
  }

  @Post('product-categories')
  async postProductCategory(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postSettingsProductCategory(request, body);
  }

  @Patch('product-categories/:categoryId')
  async patchProductCategory(
    @ApiRequest() request: Request,
    @Param('categoryId') categoryId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsProductCategory(
      request,
      categoryId,
      body,
    );
  }

  @Delete('product-categories/:categoryId')
  async deleteProductCategory(
    @ApiRequest() request: Request,
    @Param('categoryId') categoryId: string,
  ): Promise<unknown> {
    return this.settingsService.deleteSettingsProductCategory(
      request,
      categoryId,
    );
  }

  @Get('showrooms')
  async getShowrooms(@ApiRequest() request: Request): Promise<unknown> {
    return this.settingsService.getSettingsShowrooms(request);
  }

  @Post('showrooms')
  async postShowroom(
    @ApiRequest() request: Request,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.postSettingsShowroom(request, body);
  }

  @Patch('showrooms/:showroomId')
  async patchShowroom(
    @ApiRequest() request: Request,
    @Param('showroomId') showroomId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    return this.settingsService.patchSettingsShowroom(
      request,
      showroomId,
      body,
    );
  }

  @Delete('showrooms/:showroomId')
  async deleteShowroom(
    @ApiRequest() request: Request,
    @Param('showroomId') showroomId: string,
  ): Promise<unknown> {
    return this.settingsService.deleteSettingsShowroom(request, showroomId);
  }
}
