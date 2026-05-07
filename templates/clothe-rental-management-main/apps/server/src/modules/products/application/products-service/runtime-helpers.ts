import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Request } from 'express';
import { AppConfigService } from '../../../../common/config/app-config.service';
import { getAccessTokenFromRequest } from '../../../../common/supabase/request-token.util';
import { SupabaseService } from '../../../../common/supabase/supabase.service';
import { AuthService } from '../../../auth/auth.service';
import { fetchProfileRole } from '../../infrastructure/products.data-access';
import {
  mapConstraintError,
  mapProductItemsDomainError,
  mapSalesProductsDomainError,
} from './errors';
import { SENSITIVE_PRODUCT_OVERVIEW_ROLE_SET } from './helpers';

export async function getAuthenticatedClientForProducts(options: {
  request: Request;
  config: AppConfigService;
  authService: AuthService;
  supabaseService: SupabaseService;
}): Promise<{ userId: string; supabase: SupabaseClient }> {
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

  return {
    userId: authUser.userId,
    supabase: options.supabaseService.createClientWithToken(token),
  };
}

export async function canAccessSensitiveProductOverviewForUser(options: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<boolean> {
  const role = await fetchProfileRole(options.supabase, options.userId);
  const normalizedRole = role?.trim().toLowerCase() ?? null;
  return Boolean(
    normalizedRole && SENSITIVE_PRODUCT_OVERVIEW_ROLE_SET.has(normalizedRole),
  );
}

export function throwKnownProductsServiceError(error: unknown): never {
  if (error instanceof UnauthorizedException) throw error;
  if (error instanceof BadRequestException) throw error;
  if (error instanceof NotFoundException) throw error;
  if (error instanceof ForbiddenException) throw error;
  if (error instanceof ConflictException) throw error;
  if (error instanceof HttpException) throw error;

  const domainErrorResponse = mapSalesProductsDomainError(error);
  if (domainErrorResponse) {
    throw domainErrorResponse;
  }

  const itemErrorResponse = mapProductItemsDomainError(error);
  if (itemErrorResponse) {
    throw itemErrorResponse;
  }

  const constraintResponse = mapConstraintError(error);
  if (constraintResponse) {
    throw constraintResponse;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  throw new InternalServerErrorException({ error: message });
}

export function throwManualVariantMutationDisabled(code: string): never {
  throw new HttpException({ error: code }, 410);
}
