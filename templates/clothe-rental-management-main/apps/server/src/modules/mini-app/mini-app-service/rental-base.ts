import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MiniAppCoreBase } from './core-base';
import {
  DEFAULT_BRANCH_TIMEZONE,
  DEFAULT_CURRENCY_CODE,
  type BranchAccessRow,
  type BranchRow,
  MiniAppDomainError,
  type MiniAppIdentityDto,
  type MiniAppIdentityRow,
  type MiniAppSessionRow,
  ORDER_ROLE_SET,
  REVENUE_ROLE_SET,
  RentalDomainError,
  type RentalAccessContext,
  type RentalScope,
  type ProfileRow,
} from './types';

export abstract class MiniAppRentalBase extends MiniAppCoreBase {
  protected readMiniAppSessionTokenFromRequest(
    request: Request,
  ): string | null {
    const headerToken =
      this.sanitizeText(
        request.headers['x-zalo-mini-app-session'] as string | undefined,
      ) ??
      this.sanitizeText(
        request.headers['x-mini-app-session'] as string | undefined,
      );
    if (headerToken) return headerToken;

    const authHeader = this.sanitizeText(request.headers.authorization);
    if (!authHeader) return null;
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      return this.sanitizeText(authHeader.slice(7));
    }
    return null;
  }

  protected async resolveMiniAppSession(
    supabase: SupabaseClient,
    sessionToken: string,
  ): Promise<{
    sessionId: string;
    identity: MiniAppIdentityDto;
    expiresAt: string;
  }> {
    const normalizedToken = this.sanitizeText(sessionToken);
    if (!normalizedToken) {
      throw new MiniAppDomainError('SESSION_NOT_FOUND', {
        reason: 'missing-session-token',
      });
    }

    const sessionTokenHash = this.hashToken(normalizedToken);
    const { data: sessionRow, error: sessionError } = await supabase
      .from('zalo_mini_app_sessions')
      .select('id, identity_id, expires_at, revoked_at')
      .eq('session_token_hash', sessionTokenHash)
      .eq('is_delete', false)
      .is('revoked_at', null)
      .maybeSingle<MiniAppSessionRow>();

    if (sessionError) throw sessionError;
    if (!sessionRow) {
      throw new MiniAppDomainError('SESSION_NOT_FOUND', {
        reason: 'session-missing',
      });
    }

    if (new Date(sessionRow.expires_at).getTime() <= Date.now()) {
      throw new MiniAppDomainError('SESSION_EXPIRED', {
        sessionId: sessionRow.id,
        expiresAt: sessionRow.expires_at,
      });
    }

    const { data: identityRow, error: identityError } = await supabase
      .from('zalo_mini_app_identities')
      .select(
        'id, zalo_user_id, profile_id, display_name, avatar_url, phone, consent_scopes, consent_revoked_at, last_login_at',
      )
      .eq('id', sessionRow.identity_id)
      .eq('is_delete', false)
      .maybeSingle<MiniAppIdentityRow>();

    if (identityError) throw identityError;
    if (!identityRow) {
      throw new MiniAppDomainError('SESSION_NOT_FOUND', {
        reason: 'identity-missing',
        sessionId: sessionRow.id,
      });
    }

    const linkedIdentityRow = await this.ensureIdentityProfileLink(
      supabase,
      identityRow,
    );
    const identity = this.mapIdentityRowToDto(linkedIdentityRow);
    if (identity.consentRevokedAt) {
      throw new MiniAppDomainError('IDENTITY_REVOKED', {
        identityId: identity.id,
        consentRevokedAt: identity.consentRevokedAt,
      });
    }

    return {
      sessionId: sessionRow.id,
      identity,
      expiresAt: sessionRow.expires_at,
    };
  }

  protected mapBranchRow(
    row: BranchRow,
  ): RentalAccessContext['branches'][number] {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      address: row.address,
      phone: row.phone,
      timezone: this.sanitizeText(row.timezone) ?? DEFAULT_BRANCH_TIMEZONE,
      currencyCode:
        this.sanitizeText(row.currency_code) ?? DEFAULT_CURRENCY_CODE,
      isActive: row.is_active,
    };
  }

  protected resolveAllowedRoleSet(scope: RentalScope): Set<string> {
    return scope === 'revenue' ? REVENUE_ROLE_SET : ORDER_ROLE_SET;
  }

  protected async fetchProfileById(
    supabase: SupabaseClient,
    profileId: string,
  ): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, default_branch_id')
      .eq('id', profileId)
      .eq('is_delete', false)
      .eq('is_active', true)
      .maybeSingle<ProfileRow>();

    if (error) throw error;
    return data ?? null;
  }

  protected async fetchAllowedBranchIds(
    supabase: SupabaseClient,
    profileId: string,
    defaultBranchId: string | null,
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('profile_branch_access')
      .select('branch_id')
      .eq('profile_id', profileId)
      .eq('is_delete', false)
      .returns<BranchAccessRow[]>();

    if (error) throw error;

    const ids = new Set<string>();
    for (const entry of data ?? []) {
      const branchId = this.sanitizeText(entry.branch_id);
      if (branchId) ids.add(branchId);
    }
    const normalizedDefault = this.sanitizeText(defaultBranchId);
    if (normalizedDefault) ids.add(normalizedDefault);

    return Array.from(ids);
  }

  protected async fetchBranchesByIds(
    supabase: SupabaseClient,
    branchIds: string[],
  ): Promise<RentalAccessContext['branches']> {
    if (branchIds.length === 0) return [];

    const { data, error } = await supabase
      .from('branches')
      .select(
        'id, code, name, address, phone, timezone, currency_code, is_active',
      )
      .in('id', branchIds)
      .eq('is_delete', false)
      .order('name', { ascending: true })
      .returns<BranchRow[]>();

    if (error) throw error;
    return (data ?? []).map((row) => this.mapBranchRow(row));
  }

  protected resolveBranchId(options: {
    role: string;
    requestedBranchId: string | null;
    defaultBranchId: string | null;
    allowedBranchIds: string[];
  }): string {
    const requestedBranchId = this.sanitizeText(options.requestedBranchId);
    const defaultBranchId = this.sanitizeText(options.defaultBranchId);
    const fallbackBranchId =
      defaultBranchId ?? options.allowedBranchIds[0] ?? null;

    if (options.role === 'staff') {
      if (!fallbackBranchId) {
        throw new RentalDomainError('MISSING_BRANCH_CONTEXT', {
          role: options.role,
          reason: 'staff-without-default-branch',
        });
      }

      if (requestedBranchId && requestedBranchId !== fallbackBranchId) {
        throw new RentalDomainError('FORBIDDEN_BRANCH_SCOPE', {
          requestedBranchId,
          role: options.role,
        });
      }

      return fallbackBranchId;
    }

    if (requestedBranchId) {
      if (!options.allowedBranchIds.includes(requestedBranchId)) {
        throw new RentalDomainError('FORBIDDEN_BRANCH_SCOPE', {
          requestedBranchId,
          role: options.role,
        });
      }
      return requestedBranchId;
    }

    if (!fallbackBranchId) {
      throw new RentalDomainError('MISSING_BRANCH_CONTEXT', {
        role: options.role,
        reason: 'missing-allowed-branch',
      });
    }
    return fallbackBranchId;
  }

  protected async resolveRentalAccessByProfileId(
    supabase: SupabaseClient,
    options: {
      profileId: string;
      scope: RentalScope;
      requestedBranchId?: string | null;
      displayName?: string | null;
    },
  ): Promise<RentalAccessContext> {
    const enabled = await this.fetchMiniAppEnabled(supabase);
    if (!enabled) {
      throw new MiniAppDomainError('MODULE_DISABLED');
    }

    const profileId = this.sanitizeText(options.profileId);
    if (!profileId) {
      throw new RentalDomainError('FORBIDDEN_ROLE', {
        reason: 'missing-actor-profile-id',
      });
    }

    const profile = await this.fetchProfileById(supabase, profileId);
    if (!profile) {
      throw new RentalDomainError('FORBIDDEN_ROLE', {
        reason: 'missing-actor-profile',
        profileId,
      });
    }

    const role = this.sanitizeText(profile.role);
    const allowedRoles = this.resolveAllowedRoleSet(options.scope);
    if (!role || !allowedRoles.has(role)) {
      throw new RentalDomainError('FORBIDDEN_ROLE', {
        role,
        scope: options.scope,
      });
    }

    const allowedBranchIds = await this.fetchAllowedBranchIds(
      supabase,
      profile.id,
      profile.default_branch_id,
    );
    const branchId = this.resolveBranchId({
      role,
      requestedBranchId: options.requestedBranchId ?? null,
      defaultBranchId: profile.default_branch_id,
      allowedBranchIds,
    });
    const branches = await this.fetchBranchesByIds(supabase, allowedBranchIds);

    return {
      profileId: profile.id,
      role,
      branchId,
      displayName:
        this.sanitizeText(profile.full_name) ??
        this.sanitizeText(options.displayName),
      branches,
    };
  }

  protected async resolveRentalContext(
    request: Request,
    scope: RentalScope,
    requestedBranchId?: string | null,
  ): Promise<RentalAccessContext> {
    const serviceRoleClient = this.supabaseService.createServiceRoleClient();

    const authUser = await this.authService.resolveAuthUserFromRequest(request);
    if (authUser?.userId) {
      return this.resolveRentalAccessByProfileId(serviceRoleClient, {
        profileId: authUser.userId,
        scope,
        requestedBranchId: requestedBranchId ?? null,
        displayName: authUser.fullName ?? authUser.email,
      });
    }

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
    return this.resolveRentalAccessByProfileId(serviceRoleClient, {
      profileId: resolved.identity.profileId ?? '',
      scope,
      requestedBranchId: requestedBranchId ?? null,
      displayName: resolved.identity.displayName,
    });
  }

  protected throwMiniAppError(error: unknown): never {
    if (error instanceof MiniAppDomainError) {
      const payload =
        Object.keys(error.context).length > 0
          ? { error: error.code, context: error.context }
          : { error: error.code };

      if (
        error.code === 'MODULE_DISABLED' ||
        error.code === 'SESSION_EXPIRED' ||
        error.code === 'IDENTITY_REVOKED'
      ) {
        throw new ConflictException(payload);
      }

      if (error.code === 'SESSION_NOT_FOUND') {
        throw new UnauthorizedException(payload);
      }

      if (error.code === 'INVALID_TOKEN' || error.code === 'INVALID_PAYLOAD') {
        throw new BadRequestException(payload);
      }
    }

    if (error instanceof Error) {
      throw new InternalServerErrorException({ error: error.message });
    }

    throw new InternalServerErrorException({ error: 'Unexpected error' });
  }

  protected throwRentalError(error: unknown): never {
    if (error instanceof RentalDomainError) {
      const payload =
        Object.keys(error.context).length > 0
          ? { error: error.code, context: error.context }
          : { error: error.code };
      if (error.code === 'MISSING_BRANCH_CONTEXT') {
        throw new UnprocessableEntityException(payload);
      }
      throw new ForbiddenException(payload);
    }

    return this.throwMiniAppError(error);
  }
}
