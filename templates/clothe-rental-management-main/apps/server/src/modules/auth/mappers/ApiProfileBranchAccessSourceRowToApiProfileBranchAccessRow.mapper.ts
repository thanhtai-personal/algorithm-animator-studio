import type {
  ApiProfileBranchAccessRow,
  ApiProfileBranchAccessSourceRow,
} from '../types/auth-data-access.type';

type BranchAccessMapperInput = {
  row: ApiProfileBranchAccessSourceRow;
  branchMetaById: ReadonlyMap<
    string,
    {
      name: string | null;
      branchDomain: string | null;
      shopDomain: string | null;
    }
  >;
};

export class ApiProfileBranchAccessSourceRowToApiProfileBranchAccessRowMapper {
  map(input: BranchAccessMapperInput): ApiProfileBranchAccessRow {
    const branchMeta = input.branchMetaById.get(input.row.branch_id) ?? null;
    return {
      branch_id: input.row.branch_id,
      is_default: Boolean(input.row.is_default),
      branch_name: branchMeta?.name ?? null,
      branch_domain: branchMeta?.branchDomain ?? null,
      shop_domain: branchMeta?.shopDomain ?? null,
    };
  }

  maps(
    inputs: ReadonlyArray<BranchAccessMapperInput>,
  ): ApiProfileBranchAccessRow[] {
    return inputs.map((input) => this.map(input));
  }
}
