import { createHash, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AppConfigService } from '../../../common/config/app-config.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { AuthService } from '../../auth/auth.service';
import {
  type MiniAppIdentityDto,
  MiniAppDomainError,
  type MiniAppIdentityRow,
  type MiniAppSessionDto,
  type MiniAppSessionRow,
} from './types';

export abstract class MiniAppCoreBase {
  constructor(
    protected readonly config: AppConfigService,
    protected readonly supabaseService: SupabaseService,
    protected readonly authService: AuthService,
  ) {}
  protected sanitizeText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  protected parseNumeric(value: number | string | null | undefined): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  protected isMissingColumnOrTableError(error: {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  }): boolean {
    const code = (error.code ?? '').toUpperCase();
    if (code === '42703' || code === '42P01' || code === 'PGRST204')
      return true;

    const message =
      `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase();
    return (
      message.includes('does not exist') || message.includes('schema cache')
    );
  }

  protected resolveSupabaseHostForLog(): string | null {
    if (!this.config.supabaseUrl) return null;
    try {
      return new URL(this.config.supabaseUrl).host;
    } catch {
      return null;
    }
  }

  protected async fetchMiniAppEnabled(
    supabase: SupabaseClient,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('is_zalo_mini_app_enabled')
      .eq('is_delete', false)
      .limit(1)
      .maybeSingle<{ is_zalo_mini_app_enabled: boolean | null }>();

    if (error) {
      if (this.isMissingColumnOrTableError(error)) {
        if (this.config.miniAppDebug) {
          console.warn(
            '[mini-app-config][data-access] missing table/column, fallback disabled',
            {
              code: error.code,
              message: error.message,
            },
          );
        }
        return false;
      }
      if (this.config.miniAppDebug) {
        console.error('[mini-app-config][data-access] query failed', {
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }

    const enabled = Boolean(data?.is_zalo_mini_app_enabled);
    if (this.config.miniAppDebug) {
      console.info(
        '[mini-app-config][data-access] fetched system_settings flag',
        {
          raw: data?.is_zalo_mini_app_enabled ?? null,
          enabled,
        },
      );
    }
    return enabled;
  }

  protected validatePhoneNumber(
    rawValue: string,
    options?: { allowEmpty?: boolean },
  ): { isValid: boolean; normalized: string | null } {
    const normalized = rawValue.replace(/[^0-9+]/g, '').trim();
    if (!normalized)
      return { isValid: Boolean(options?.allowEmpty), normalized: null };
    if (/^0\d{9}$/.test(normalized)) {
      return { isValid: true, normalized: `+84${normalized.slice(1)}` };
    }
    if (/^84\d{9}$/.test(normalized)) {
      return { isValid: true, normalized: `+${normalized}` };
    }
    if (/^\+84\d{9}$/.test(normalized)) {
      return { isValid: true, normalized };
    }
    return { isValid: false, normalized: null };
  }

  protected hashToken(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  protected mapIdentityRowToDto(row: MiniAppIdentityRow): MiniAppIdentityDto {
    return {
      id: row.id,
      zaloUserId: row.zalo_user_id,
      profileId: this.sanitizeText(row.profile_id),
      displayName: this.sanitizeText(row.display_name),
      avatarUrl: this.sanitizeText(row.avatar_url),
      phone: this.sanitizeText(row.phone),
      consentScopes: Array.isArray(row.consent_scopes)
        ? row.consent_scopes
            .map((entry) => this.sanitizeText(entry))
            .filter((entry): entry is string => Boolean(entry))
        : [],
      consentRevokedAt: this.sanitizeText(row.consent_revoked_at),
      lastLoginAt: row.last_login_at,
    };
  }

  protected async fetchActiveProfileIdById(
    supabase: SupabaseClient,
    profileId: string,
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .eq('is_delete', false)
      .eq('is_active', true)
      .maybeSingle<{ id: string }>();

    if (error) throw error;
    return this.sanitizeText(data?.id) ?? null;
  }

  protected async resolveLinkedProfileId(
    supabase: SupabaseClient,
    options: {
      currentProfileId: string | null;
      phone: string | null;
    },
  ): Promise<string | null> {
    const currentProfileId = this.sanitizeText(options.currentProfileId);
    if (currentProfileId) return currentProfileId;

    if (!this.config.isProduction && this.config.miniAppDevProfileId) {
      return this.fetchActiveProfileIdById(
        supabase,
        this.config.miniAppDevProfileId,
      );
    }

    const normalizedPhone = this.sanitizeText(options.phone)
      ? this.validatePhoneNumber(options.phone as string, { allowEmpty: true })
          .normalized
      : null;
    if (!normalizedPhone) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('is_delete', false)
      .eq('is_active', true)
      .not('phone', 'is', null)
      .returns<Array<{ id: string; phone: string | null }>>();

    if (error) throw error;

    const matched = (data ?? []).filter((row) => {
      const phone = this.sanitizeText(row.phone);
      if (!phone) return false;
      return (
        this.validatePhoneNumber(phone, { allowEmpty: true }).normalized ===
        normalizedPhone
      );
    });

    return matched.length === 1 ? (matched[0]?.id ?? null) : null;
  }

  protected async ensureIdentityProfileLink(
    supabase: SupabaseClient,
    row: MiniAppIdentityRow,
  ): Promise<MiniAppIdentityRow> {
    const linkedProfileId = await this.resolveLinkedProfileId(supabase, {
      currentProfileId: row.profile_id,
      phone: row.phone,
    });

    if (!linkedProfileId || linkedProfileId === row.profile_id) {
      return row;
    }

    const { data, error } = await supabase
      .from('zalo_mini_app_identities')
      .update({ profile_id: linkedProfileId })
      .eq('id', row.id)
      .eq('is_delete', false)
      .select(
        'id, zalo_user_id, profile_id, display_name, avatar_url, phone, consent_scopes, consent_revoked_at, last_login_at',
      )
      .maybeSingle<MiniAppIdentityRow>();

    if (error) throw error;
    return data ?? { ...row, profile_id: linkedProfileId };
  }

  protected async upsertIdentity(
    supabase: SupabaseClient,
    options: {
      zaloUserId: string;
      displayName: string | null;
      avatarUrl: string | null;
      phone: string | null;
      consentScopes: string[];
    },
  ): Promise<MiniAppIdentityDto> {
    const nowIso = new Date().toISOString();
    const payload = {
      zalo_user_id: options.zaloUserId,
      display_name: options.displayName,
      avatar_url: options.avatarUrl,
      phone: options.phone,
      consent_scopes: options.consentScopes,
      consent_revoked_at: null,
      last_login_at: nowIso,
      is_delete: false,
    };

    const { data, error } = await supabase
      .from('zalo_mini_app_identities')
      .upsert(payload, { onConflict: 'zalo_user_id' })
      .select(
        'id, zalo_user_id, profile_id, display_name, avatar_url, phone, consent_scopes, consent_revoked_at, last_login_at',
      )
      .maybeSingle<MiniAppIdentityRow>();

    if (error) throw error;
    if (!data) {
      throw new MiniAppDomainError('INVALID_TOKEN', {
        reason: 'identity-upsert-empty',
      });
    }

    const linkedIdentity = await this.ensureIdentityProfileLink(supabase, data);
    return this.mapIdentityRowToDto(linkedIdentity);
  }

  protected async createSession(
    supabase: SupabaseClient,
    options: {
      identityId: string;
      accessToken: string | null;
      sessionTtlHours?: number;
    },
  ): Promise<MiniAppSessionDto> {
    const rawSessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(rawSessionToken);
    const accessTokenHash = this.sanitizeText(options.accessToken)
      ? this.hashToken(options.accessToken as string)
      : null;

    const ttlHours = Math.max(
      1,
      this.parseNumeric(options.sessionTtlHours ?? 24 * 7),
    );
    const expiresAt = new Date(
      Date.now() + ttlHours * 60 * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from('zalo_mini_app_sessions')
      .insert({
        identity_id: options.identityId,
        session_token_hash: sessionTokenHash,
        access_token_hash: accessTokenHash,
        expires_at: expiresAt,
        revoked_at: null,
        is_delete: false,
      })
      .select('id, identity_id, expires_at, revoked_at')
      .maybeSingle<MiniAppSessionRow>();

    if (error) throw error;
    if (!data) {
      throw new MiniAppDomainError('INVALID_TOKEN', {
        reason: 'session-create-empty',
      });
    }

    const { data: identityRow, error: identityError } = await supabase
      .from('zalo_mini_app_identities')
      .select(
        'id, zalo_user_id, profile_id, display_name, avatar_url, phone, consent_scopes, consent_revoked_at, last_login_at',
      )
      .eq('id', data.identity_id)
      .eq('is_delete', false)
      .maybeSingle<MiniAppIdentityRow>();

    if (identityError) throw identityError;
    if (!identityRow) {
      throw new MiniAppDomainError('SESSION_NOT_FOUND', {
        reason: 'identity-missing',
        sessionId: data.id,
      });
    }

    return {
      sessionToken: rawSessionToken,
      expiresAt,
      identity: this.mapIdentityRowToDto(identityRow),
    };
  }
}
