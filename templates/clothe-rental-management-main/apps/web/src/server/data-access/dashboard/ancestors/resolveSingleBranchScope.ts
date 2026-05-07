import { isStaffRole } from "..";
import { DashboardDomainError } from "../DashboardDomainError";
import { ProfileActorRow } from "../interfaces";

export function resolveSingleBranchScope(options: {
  actor: ProfileActorRow;
  allowedBranchIds: string[];
  requestedBranchId: string | null;
}): string {
  const requestedBranchId = options.requestedBranchId;

  if (isStaffRole(options.actor.role)) {
    const staffBranchId =
      options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;
    if (!staffBranchId) {
      throw new DashboardDomainError("MISSING_BRANCH_CONTEXT", {
        reason: "staff-without-branch",
      });
    }

    if (requestedBranchId && requestedBranchId !== staffBranchId) {
      throw new DashboardDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return staffBranchId;
  }

  if (requestedBranchId) {
    if (!options.allowedBranchIds.includes(requestedBranchId)) {
      throw new DashboardDomainError("FORBIDDEN_BRANCH_SCOPE", {
        requestedBranchId,
        role: options.actor.role,
      });
    }

    return requestedBranchId;
  }

  const fallback =
    options.actor.default_branch_id ?? options.allowedBranchIds[0] ?? null;

  if (!fallback) {
    throw new DashboardDomainError("MISSING_BRANCH_CONTEXT", {
      role: options.actor.role,
    });
  }

  return fallback;
}