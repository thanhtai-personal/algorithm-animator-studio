import { Injectable } from '@nestjs/common';
import {
  createClient,
  type PostgrestError,
  type SupabaseClient,
} from '@supabase/supabase-js';
import { AppConfigService } from '../config/app-config.service';

type GenericSupabaseClient = SupabaseClient;

@Injectable()
export class SupabaseService {
  constructor(private readonly config: AppConfigService) {
    this.config.assertRequiredSupabaseEnv();
  }

  createAnonClient(): GenericSupabaseClient {
    return createClient(
      this.config.supabaseUrl!,
      this.config.supabaseAnonKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    ) as GenericSupabaseClient;
  }

  createServiceRoleClient(): GenericSupabaseClient {
    return createClient(
      this.config.supabaseUrl!,
      this.config.supabaseServiceRoleKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    ) as GenericSupabaseClient;
  }

  createClientWithToken(token: string): GenericSupabaseClient {
    return createClient(
      this.config.supabaseUrl!,
      this.config.supabaseAnonKey!,
      {
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
      },
    ) as GenericSupabaseClient;
  }

  isSkippableProfileQueryError(error: PostgrestError | null): boolean {
    if (!error) return false;
    const code = (error.code ?? '').toUpperCase();
    return code === '42P01' || code === '42703' || code.startsWith('PGRST2');
  }
}
