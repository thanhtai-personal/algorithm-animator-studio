import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../../common/config/app-config.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuthService } from '../../auth/auth.service';
import { CreateMiniAppSessionDto } from '../dto/create-mini-app-session.dto';
import { MiniAppRentalBase } from './rental-base';
import { MiniAppDomainError } from './types';
import type {
  MiniAppIdentityDto,
  MiniAppSessionDto,
  RentalAccessContext,
  RentalScope,
} from './types';

@Injectable()
export class MiniAppService extends MiniAppRentalBase {
  constructor(
    config: AppConfigService,
    supabaseService: SupabaseService,
    authService: AuthService,
  ) {
    super(config, supabaseService, authService);
  }
  async getConfig(): Promise<{ enabled: boolean }> {
    const supabase = this.supabaseService.createServiceRoleClient();
    const enabled = await this.fetchMiniAppEnabled(supabase);

    if (this.config.miniAppDebug) {
      console.info('[mini-app-config][service]', {
        enabled,
        supabaseHost: this.resolveSupabaseHostForLog(),
      });
    }

    return {
      enabled,
    };
  }

  async createAuthSession(
    payload: CreateMiniAppSessionDto,
  ): Promise<MiniAppSessionDto> {
    try {
      const zaloUserId = this.sanitizeText(payload.zaloUserId);
      if (!zaloUserId) {
        throw new MiniAppDomainError('INVALID_PAYLOAD');
      }

      const accessToken = this.sanitizeText(payload.zaloAccessToken);
      if (!accessToken || accessToken.length < 8) {
        throw new MiniAppDomainError('INVALID_TOKEN', {
          reason: 'access-token-missing-or-short',
        });
      }

      const supabase = this.supabaseService.createServiceRoleClient();
      const enabled = await this.fetchMiniAppEnabled(supabase);
      if (!enabled) {
        throw new MiniAppDomainError('MODULE_DISABLED');
      }

      const identity = await this.upsertIdentity(supabase, {
        zaloUserId,
        displayName: this.sanitizeText(payload.displayName),
        avatarUrl: this.sanitizeText(payload.avatarUrl),
        phone: this.sanitizeText(payload.phone),
        consentScopes: Array.isArray(payload.consentScopes)
          ? payload.consentScopes
              .map((entry) => this.sanitizeText(entry))
              .filter((entry): entry is string => Boolean(entry))
          : [],
      });

      return this.createSession(supabase, {
        identityId: identity.id,
        accessToken,
        sessionTtlHours: 24 * 7,
      });
    } catch (error) {
      this.throwMiniAppError(error);
    }
  }

  async getRentalAccess(
    request: Request,
    appQueryValue: string | null | undefined,
    requestedBranchId: string | null | undefined,
  ): Promise<{ access: RentalAccessContext }> {
    try {
      const scope: RentalScope =
        appQueryValue === 'revenue' ? 'revenue' : 'order';
      const access = await this.resolveRentalContext(
        request,
        scope,
        requestedBranchId,
      );
      return { access };
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async resolveMiniAppSessionIdentityFromRequest(
    request: Request,
  ): Promise<MiniAppIdentityDto> {
    try {
      const serviceRoleClient = this.supabaseService.createServiceRoleClient();
      const sessionToken = this.readMiniAppSessionTokenFromRequest(request);
      if (!sessionToken) {
        throw new MiniAppDomainError('SESSION_NOT_FOUND', {
          reason: 'missing-session-header',
        });
      }

      const resolved = await this.resolveMiniAppSession(
        serviceRoleClient,
        sessionToken,
      );
      return resolved.identity;
    } catch (error) {
      this.throwMiniAppError(error);
    }
  }

  async resolveRentalAccessContext(
    request: Request,
    scope: RentalScope,
    requestedBranchId?: string | null,
  ): Promise<RentalAccessContext> {
    try {
      return await this.resolveRentalContext(request, scope, requestedBranchId);
    } catch (error) {
      this.throwRentalError(error);
    }
  }

  async assertMiniAppEnabledForClient(supabase: SupabaseClient): Promise<void> {
    try {
      const enabled = await this.fetchMiniAppEnabled(supabase);
      if (!enabled) {
        throw new MiniAppDomainError('MODULE_DISABLED');
      }
    } catch (error) {
      this.throwMiniAppError(error);
    }
  }

  rethrowMiniAppError(error: unknown): never {
    this.throwMiniAppError(error);
  }

  rethrowRentalError(error: unknown): never {
    this.throwRentalError(error);
  }
}
