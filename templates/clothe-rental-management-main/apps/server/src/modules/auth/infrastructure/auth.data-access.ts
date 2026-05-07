import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { fetchCurrentUserProfileContext } from './auth-profile-context.data-access';
import type {
  ApiAuthUserProfilePayload,
  ApiProfileBranchAccessRow,
  CustomerPhoneLookupRow,
  PhoneProfileCandidateRow,
} from '../types/auth-data-access.type';
import {
  buildPhoneCandidates,
  isActiveCustomerRole,
  sanitizeText,
  validatePhoneNumber,
} from '../utils/auth-data-access.utils';

@Injectable()
export class AuthDataAccess {
  constructor(private readonly supabaseService: SupabaseService) {}

  signInWithPassword(email: string, password: string) {
    const supabase = this.supabaseService.createAnonClient();
    return supabase.auth.signInWithPassword({ email, password });
  }

  signUpWithPassword(email: string, password: string, redirectTo?: string) {
    const supabase = this.supabaseService.createAnonClient();
    return supabase.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
  }

  refreshSession(refreshToken: string) {
    const supabase = this.supabaseService.createAnonClient();
    return supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
  }

  signOut(token: string) {
    const supabase = this.supabaseService.createClientWithToken(token);
    return supabase.auth.signOut();
  }

  getAuthUserByToken(token: string) {
    const supabase = this.supabaseService.createClientWithToken(token);
    return supabase.auth.getUser(token);
  }

  async deleteTransactionsByUserId(userId: string): Promise<void> {
    const adminClient = this.supabaseService.createServiceRoleClient();
    const { error } = await adminClient
      .from('transactions')
      .update({
        is_delete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_delete', false);

    if (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  async deleteCategoriesByUserId(userId: string): Promise<void> {
    const adminClient = this.supabaseService.createServiceRoleClient();
    const { error } = await adminClient
      .from('categories')
      .update({
        is_delete: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_delete', false);

    if (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  async deleteAuthUserById(userId: string): Promise<void> {
    const adminClient = this.supabaseService.createServiceRoleClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      throw new InternalServerErrorException({ error: error.message });
    }
  }

  async getUserContextByToken(token: string): Promise<{
    user: unknown;
    profile: ApiAuthUserProfilePayload | null;
    branchAccess: ApiProfileBranchAccessRow[];
    warning: string | null;
  }> {
    const supabase = this.supabaseService.createClientWithToken(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new Error('AUTH_UNAUTHORIZED');
    }

    const context = await fetchCurrentUserProfileContext({
      supabase,
      userId: data.user.id,
      supabaseService: this.supabaseService,
    });

    return {
      user: data.user,
      profile: context.profile,
      branchAccess: context.branchAccess,
      warning: context.warning,
    };
  }

  async resolveAuthUserFromToken(token: string): Promise<{
    userId: string;
    email: string | null;
    fullName: string | null;
  } | null> {
    const supabase = this.supabaseService.createClientWithToken(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    const fullName =
      typeof data.user.user_metadata?.full_name === 'string'
        ? data.user.user_metadata.full_name
        : null;

    return {
      userId: data.user.id,
      email: data.user.email ?? null,
      fullName: sanitizeText(fullName),
    };
  }

  async resolveEmailForPhoneSignIn(phone: string): Promise<string | null> {
    const phoneValidation = validatePhoneNumber(phone, {
      allowEmpty: false,
    });
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return null;
    }

    const serviceRoleClient = this.supabaseService.createServiceRoleClient();
    const normalizedPhone = phoneValidation.normalized;

    const { data: customerMatches, error: customerLookupError } =
      await serviceRoleClient
        .from('customers')
        .select('profile_id')
        .eq('phone_normalized', normalizedPhone)
        .eq('is_delete', false)
        .not('profile_id', 'is', null)
        .limit(3)
        .returns<CustomerPhoneLookupRow[]>();

    if (customerLookupError) {
      throw customerLookupError;
    }

    const matchedProfileIds = Array.from(
      new Set(
        (customerMatches ?? [])
          .map((row) => row.profile_id)
          .filter(
            (value): value is string =>
              typeof value === 'string' && value.length > 0,
          ),
      ),
    );

    if (matchedProfileIds.length > 1) {
      return null;
    }

    if (matchedProfileIds.length === 1) {
      const { data: profileMatch, error: profileLookupError } =
        await serviceRoleClient
          .from('profiles')
          .select('id, email, phone, role, is_active')
          .eq('id', matchedProfileIds[0])
          .eq('is_delete', false)
          .maybeSingle<PhoneProfileCandidateRow>();

      if (profileLookupError) {
        throw profileLookupError;
      }

      if (!isActiveCustomerRole(profileMatch)) {
        return null;
      }

      return sanitizeText(profileMatch.email)?.toLowerCase() ?? null;
    }

    const phoneCandidates = buildPhoneCandidates(normalizedPhone);
    const { data: profileCandidates, error: profileCandidatesError } =
      await serviceRoleClient
        .from('profiles')
        .select('id, email, phone, role, is_active')
        .eq('is_delete', false)
        .in('phone', phoneCandidates)
        .limit(3)
        .returns<PhoneProfileCandidateRow[]>();

    if (profileCandidatesError) {
      throw profileCandidatesError;
    }

    const customerProfiles = (profileCandidates ?? []).filter((row) =>
      isActiveCustomerRole(row),
    );
    if (customerProfiles.length !== 1) {
      return null;
    }

    return sanitizeText(customerProfiles[0].email)?.toLowerCase() ?? null;
  }
}
