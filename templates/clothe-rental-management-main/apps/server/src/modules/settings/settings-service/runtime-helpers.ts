import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { AppConfigService } from '../../../common/config/app-config.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { getAccessTokenFromRequest } from '../../../common/supabase/request-token.util';
import { AuthService } from '../../auth/auth.service';
import { SettingsDomainError } from '../infrastructure/settings.data-access';

export function throwKnownSettingsHttpError(error: unknown): never {
  if (
    error instanceof BadRequestException ||
    error instanceof UnauthorizedException ||
    error instanceof ForbiddenException ||
    error instanceof NotFoundException ||
    error instanceof ConflictException ||
    error instanceof ServiceUnavailableException ||
    error instanceof InternalServerErrorException
  ) {
    throw error;
  }

  if (error instanceof SettingsDomainError) {
    const payload =
      Object.keys(error.context ?? {}).length > 0
        ? { error: error.code, context: error.context }
        : { error: error.code };

    if (
      error.code === 'FORBIDDEN_SETTINGS_ACCESS' ||
      error.code === 'FORBIDDEN_BRANCH_SCOPE' ||
      error.code === 'INVALID_POS_PASSKEY'
    ) {
      throw new ForbiddenException(payload);
    }

    if (
      error.code === 'BRANCH_NOT_FOUND' ||
      error.code === 'USER_NOT_FOUND' ||
      error.code === 'TEMPLATE_NOT_FOUND' ||
      error.code === 'SHOWROOM_NOT_FOUND' ||
      error.code === 'PRODUCT_CATEGORY_NOT_FOUND'
    ) {
      throw new NotFoundException(payload);
    }

    if (error.code === 'EMAIL_SENDER_DISABLED') {
      throw new ServiceUnavailableException(payload);
    }

    if (
      error.code === 'MISSING_BRANCH_CONTEXT' ||
      error.code === 'CANNOT_DISABLE_SELF' ||
      error.code === 'OWNER_ADMIN_ROLE_IS_SEED_ONLY' ||
      error.code === 'OWNER_ADMIN_ROLE_IMMUTABLE' ||
      error.code === 'TEMPLATE_INACTIVE' ||
      error.code === 'PROFILE_EMAIL_MISSING' ||
      error.code === 'SHOWROOM_DEFAULT_IMMUTABLE' ||
      error.code === 'SHOWROOM_IN_USE' ||
      error.code === 'SHOWROOM_SLUG_DUPLICATE' ||
      error.code === 'BRANCH_SHOP_DOMAIN_DUPLICATE' ||
      error.code === 'PRODUCT_CATEGORY_CODE_DUPLICATE' ||
      error.code === 'PRODUCT_CATEGORY_IN_USE' ||
      error.code === 'POS_PASSKEY_REQUIRED' ||
      error.code === 'POS_PASSKEY_COLUMNS_MISSING'
    ) {
      throw new ConflictException(payload);
    }

    throw new BadRequestException(payload);
  }

  const errorRecord =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : null;
  const rawMessage =
    errorRecord && typeof errorRecord.message === 'string'
      ? errorRecord.message
      : null;
  const rawCode =
    errorRecord && typeof errorRecord.code === 'string'
      ? errorRecord.code
      : null;

  const message = rawMessage ?? (error instanceof Error ? error.message : null);
  if (message) {
    throw new InternalServerErrorException({
      error: rawCode ? `${message} (${rawCode})` : message,
    });
  }

  throw new InternalServerErrorException({ error: 'Unexpected error' });
}

export async function getAuthedProfileIdForSettings(options: {
  request: Request;
  config: AppConfigService;
  authService: AuthService;
}): Promise<string> {
  const token = getAccessTokenFromRequest(
    options.request,
    options.config.supabaseUrl,
  );
  if (!token) {
    throw new UnauthorizedException({ error: 'Unauthorized' });
  }

  const authUser = await options.authService.resolveAuthUserFromRequest(
    options.request,
  );
  if (!authUser) {
    throw new UnauthorizedException({ error: 'Unauthorized' });
  }

  return authUser.userId;
}

export async function getAuthedClientForSettings(options: {
  request: Request;
  config: AppConfigService;
  authService: AuthService;
  supabaseService: SupabaseService;
}): Promise<{ supabase: SupabaseClient; profileId: string }> {
  const profileId = await getAuthedProfileIdForSettings(options);
  const token = getAccessTokenFromRequest(
    options.request,
    options.config.supabaseUrl,
  );
  if (!token) {
    throw new UnauthorizedException({ error: 'Unauthorized' });
  }

  return {
    supabase: options.supabaseService.createClientWithToken(token),
    profileId,
  };
}
