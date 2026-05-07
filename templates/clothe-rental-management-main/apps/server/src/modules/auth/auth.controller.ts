import { Body, Delete, Get, Post } from '@nestjs/common';
import type { Request } from 'express';
import { V1Controller } from '../../common/decorators/v1-controller.decorator';
import { ApiRequest } from '../../common/decorators/api-request.decorator';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshDto } from './dto/refresh.dto';
import { SignUpDto } from './dto/sign-up.dto';

@V1Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  async signIn(@Body() body: SignInDto): Promise<unknown> {
    return this.authService.signIn(body);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto): Promise<unknown> {
    return this.authService.refresh(body);
  }

  @Post('sign-up')
  async signUp(
    @ApiRequest() request: Request,
    @Body() body: SignUpDto,
  ): Promise<unknown> {
    return this.authService.signUp(body, request);
  }

  @Post('sign-out')
  async signOut(@ApiRequest() request: Request): Promise<{ success: boolean }> {
    return this.authService.signOut(request);
  }

  @Get('user')
  async getUser(@ApiRequest() request: Request): Promise<unknown> {
    return this.authService.getUserContext(request);
  }

  @Delete('delete-account')
  async deleteAccount(
    @ApiRequest() request: Request,
  ): Promise<{ success: boolean }> {
    return this.authService.deleteAccount(request);
  }
}
