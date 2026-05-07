import type {
  AuthAdminUserForProfileSync,
  ProfileUpsertPayload,
} from '../types/auth-data-access.type';
import {
  normalizeProfileLocale,
  normalizeProfileRole,
  sanitizeText,
} from '../utils/auth-data-access.utils';

export class AuthAdminUserForProfileSyncToProfileUpsertMapper {
  map(authUser: AuthAdminUserForProfileSync): ProfileUpsertPayload {
    const metadataRole =
      authUser.app_metadata?.role ?? authUser.user_metadata?.role;
    const metadataLocale = authUser.user_metadata?.locale;
    const metadataFullName =
      authUser.user_metadata?.full_name ?? authUser.user_metadata?.name;
    const metadataPhone = authUser.user_metadata?.phone;

    return {
      id: authUser.id,
      full_name: sanitizeText(
        typeof metadataFullName === 'string' ? metadataFullName : null,
      ),
      email: sanitizeText(authUser.email)?.toLowerCase() ?? null,
      phone:
        sanitizeText(authUser.phone) ??
        sanitizeText(typeof metadataPhone === 'string' ? metadataPhone : null),
      role: normalizeProfileRole(metadataRole),
      locale: normalizeProfileLocale(metadataLocale),
      is_active: true,
      disabled_at: null,
      disabled_by: null,
    };
  }

  maps(
    authUsers: ReadonlyArray<AuthAdminUserForProfileSync>,
  ): ProfileUpsertPayload[] {
    return authUsers.map((authUser) => this.map(authUser));
  }
}
