import type {
  ApiAuthUserProfilePayload,
  ApiProfileRow,
} from '../types/auth-data-access.type';

type ProfilePayloadMapperInput = {
  userId: string;
  profileRow: ApiProfileRow;
};

export class ApiProfileRowToApiAuthUserProfilePayloadMapper {
  map(input: ProfilePayloadMapperInput): ApiAuthUserProfilePayload {
    const defaultBranchId = input.profileRow.default_branch_id ?? null;
    return {
      id: input.profileRow.id,
      auth_user_id: input.userId,
      full_name: input.profileRow.full_name ?? null,
      email: input.profileRow.email ?? null,
      phone: input.profileRow.phone ?? null,
      role: input.profileRow.role ?? null,
      branch_id: defaultBranchId,
      default_branch_id: defaultBranchId,
      locale: input.profileRow.locale ?? null,
      active: input.profileRow.is_active ?? true,
    };
  }

  maps(
    inputs: ReadonlyArray<ProfilePayloadMapperInput>,
  ): ApiAuthUserProfilePayload[] {
    return inputs.map((input) => this.map(input));
  }
}
