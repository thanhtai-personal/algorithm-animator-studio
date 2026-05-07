import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PosPasskeyPolicyDto,
  PosPasskeyUpdatePayload,
  PosPasskeyVerifyPayload,
  PosPasskeyVerifyResponse,
} from '../types/settings-module.type';
import { SettingsDomainError } from './settings.data-access.impl';

interface PosPasskeyProfileRow {
  id: string;
  role: string | null;
  is_active: boolean;
}

interface SystemSettingsPosPasskeyRow {
  id: string;
  pos_admin_passkey_lock_enabled: boolean | null;
  pos_admin_passkey_hash: string | null;
  pos_admin_passkey_version: number | string | null;
  pos_admin_passkey_updated_at: string | null;
}

const POS_PASSKEY_HASH_PREFIX = 'scrypt';
const MIN_POS_PASSKEY_LENGTH = 4;

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOwnerAdminRole(role: string | null | undefined): boolean {
  const normalizedRole = sanitizeText(role)?.toLowerCase() ?? null;
  return normalizedRole === 'owner_admin' || normalizedRole === 'admin';
}

function isMissingPosPasskeyColumnsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const row = error as {
    code?: unknown;
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  const code = typeof row.code === 'string' ? row.code : '';
  const message = typeof row.message === 'string' ? row.message : '';
  const details = typeof row.details === 'string' ? row.details : '';
  const hint = typeof row.hint === 'string' ? row.hint : '';
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  const mentionsPosPasskeyColumns =
    combined.includes('pos_admin_passkey_lock_enabled') ||
    combined.includes('pos_admin_passkey_hash') ||
    combined.includes('pos_admin_passkey_version') ||
    combined.includes('pos_admin_passkey_updated_at');

  if (!mentionsPosPasskeyColumns) return false;
  if (code === '42703' || code === 'PGRST204') return true;

  return (
    combined.includes('does not exist') ||
    combined.includes('schema cache') ||
    combined.includes('could not find')
  );
}

function buildPosPasskeyPolicy(
  row: SystemSettingsPosPasskeyRow | null,
): PosPasskeyPolicyDto {
  if (!row) {
    return {
      enabled: false,
      configured: false,
      version: 0,
      updatedAt: null,
    };
  }

  const configured = Boolean(sanitizeText(row.pos_admin_passkey_hash));
  const enabled = Boolean(row.pos_admin_passkey_lock_enabled) && configured;

  return {
    enabled,
    configured,
    version: Math.max(
      0,
      Math.trunc(parseNumeric(row.pos_admin_passkey_version)),
    ),
    updatedAt: row.pos_admin_passkey_updated_at,
  };
}

function hashPosPasskey(passkey: string): string {
  const salt = randomBytes(16).toString('hex');
  const digest = scryptSync(passkey, salt, 64).toString('hex');
  return `${POS_PASSKEY_HASH_PREFIX}$${salt}$${digest}`;
}

function verifyPosPasskey(passkey: string, encodedHash: string): boolean {
  const [prefix, salt, expectedHash] = encodedHash.split('$');
  if (prefix !== POS_PASSKEY_HASH_PREFIX || !salt || !expectedHash) {
    return false;
  }

  const candidateHash = scryptSync(passkey, salt, 64).toString('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const candidateBuffer = Buffer.from(candidateHash, 'hex');

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}

async function ensureActiveProfile(
  supabase: SupabaseClient,
  actorProfileId: string,
): Promise<PosPasskeyProfileRow> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', actorProfileId)
    .eq('is_delete', false)
    .maybeSingle<PosPasskeyProfileRow>();

  if (error) throw error;
  if (!data || !data.is_active) {
    throw new SettingsDomainError('FORBIDDEN_SETTINGS_ACCESS', {
      reason: 'missing-or-inactive-actor',
    });
  }

  return data;
}

async function fetchSystemPosPasskeyRow(
  supabase: SupabaseClient,
): Promise<SystemSettingsPosPasskeyRow | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select(
      'id, pos_admin_passkey_lock_enabled, pos_admin_passkey_hash, pos_admin_passkey_version, pos_admin_passkey_updated_at',
    )
    .eq('is_delete', false)
    .limit(1)
    .maybeSingle<SystemSettingsPosPasskeyRow>();

  if (error) {
    if (isMissingPosPasskeyColumnsError(error)) {
      throw new SettingsDomainError('POS_PASSKEY_COLUMNS_MISSING');
    }
    throw error;
  }

  return data ?? null;
}

export async function getPosPasskeyPolicyForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
  },
): Promise<PosPasskeyPolicyDto> {
  await ensureActiveProfile(supabase, options.actorProfileId);
  const row = await fetchSystemPosPasskeyRow(supabase);
  return buildPosPasskeyPolicy(row);
}

export async function verifyPosPasskeyForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: PosPasskeyVerifyPayload;
  },
): Promise<PosPasskeyVerifyResponse> {
  await ensureActiveProfile(supabase, options.actorProfileId);

  const passkey = sanitizeText(options.payload.passkey);
  if (!passkey) {
    throw new SettingsDomainError('INVALID_POS_PASSKEY');
  }

  const row = await fetchSystemPosPasskeyRow(supabase);
  const policy = buildPosPasskeyPolicy(row);
  if (!policy.enabled) {
    return {
      success: true,
      policy,
    };
  }

  const encodedHash = sanitizeText(row?.pos_admin_passkey_hash ?? null);
  if (!encodedHash || !verifyPosPasskey(passkey, encodedHash)) {
    throw new SettingsDomainError('INVALID_POS_PASSKEY');
  }

  return {
    success: true,
    policy,
  };
}

export async function updatePosPasskeyForAdmin(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: PosPasskeyUpdatePayload;
  },
): Promise<PosPasskeyPolicyDto> {
  const actor = await ensureActiveProfile(supabase, options.actorProfileId);
  if (!isOwnerAdminRole(actor.role)) {
    throw new SettingsDomainError('FORBIDDEN_SETTINGS_ACCESS', {
      role: actor.role,
      reason: 'pos-passkey-admin-only',
    });
  }

  const currentRow = await fetchSystemPosPasskeyRow(supabase);
  const currentPolicy = buildPosPasskeyPolicy(currentRow);

  const nextEnabled =
    options.payload.enabled === undefined
      ? currentPolicy.enabled
      : Boolean(options.payload.enabled);
  const nextPasskey = sanitizeText(options.payload.newPasskey);

  if (nextPasskey && nextPasskey.length < MIN_POS_PASSKEY_LENGTH) {
    throw new SettingsDomainError('POS_PASSKEY_TOO_SHORT', {
      minLength: MIN_POS_PASSKEY_LENGTH,
    });
  }

  const nextHash = nextPasskey
    ? hashPosPasskey(nextPasskey)
    : sanitizeText(currentRow?.pos_admin_passkey_hash ?? null);

  if (nextEnabled && !nextHash) {
    throw new SettingsDomainError('POS_PASSKEY_REQUIRED');
  }

  const nextVersion = nextPasskey
    ? currentPolicy.version + 1
    : currentPolicy.version;

  const payload = {
    pos_admin_passkey_lock_enabled: nextEnabled,
    pos_admin_passkey_hash: nextHash,
    pos_admin_passkey_version: nextVersion,
    pos_admin_passkey_updated_at: nextPasskey
      ? new Date().toISOString()
      : (currentRow?.pos_admin_passkey_updated_at ?? null),
    updated_by: options.actorProfileId,
  };

  if (currentRow) {
    const { error } = await supabase
      .from('system_settings')
      .update(payload)
      .eq('id', currentRow.id)
      .eq('is_delete', false);

    if (error) throw error;
  } else {
    const { error } = await supabase.from('system_settings').insert({
      default_locale: 'vi',
      default_currency_code: 'VND',
      late_fee_mode: 'fixed_per_day',
      late_fee_value: 0,
      laundry_tracking_enabled: true,
      ...payload,
    });

    if (error) throw error;
  }

  return {
    enabled: nextEnabled && Boolean(nextHash),
    configured: Boolean(nextHash),
    version: nextVersion,
    updatedAt: payload.pos_admin_passkey_updated_at,
  };
}
