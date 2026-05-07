import type { Request } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getAccessTokenFromRequest } from './request-token.util';

function sanitizeEnvValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveSupabaseUrl(): string | null {
  return sanitizeEnvValue(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  );
}

function resolveSupabaseAnonKey(): string | null {
  return sanitizeEnvValue(
    process.env.SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      null,
  );
}

export interface AuthenticatedSupabaseClientContext {
  supabase: SupabaseClient;
  userId: string;
}

export function createSupabaseClientWithToken(token: string): SupabaseClient {
  const supabaseUrl = resolveSupabaseUrl();
  const supabaseAnonKey = resolveSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_CONFIG_MISSING');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function getAuthenticatedSupabaseClient(
  request: Request,
): Promise<AuthenticatedSupabaseClientContext> {
  const token = getAccessTokenFromRequest(request, resolveSupabaseUrl());
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  const supabase = createSupabaseClientWithToken(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error('UNAUTHORIZED');
  }

  return {
    supabase,
    userId: data.user.id,
  };
}
