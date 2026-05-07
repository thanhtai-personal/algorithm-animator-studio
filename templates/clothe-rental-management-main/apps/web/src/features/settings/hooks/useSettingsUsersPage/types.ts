import type { SettingLocale } from "@/types/settingsModule";
import type { ShowroomRole } from "@/types/showroomAuth";

export interface SettingsUsersCopy {
  title: string;
  subtitle: string;
  noPermission: string;
  branchFilterLabel: string;
  createTitle: string;
  emailLabel: string;
  passwordLabel: string;
  createPasswordPlaceholder: string;
  fullNameLabel: string;
  phoneLabel: string;
  roleLabel: string;
  localeLabel: string;
  defaultBranchLabel: string;
  branchAccessLabel: string;
  branchIdsFieldLabel: string;
  branchIdsFieldPlaceholder: string;
  createAction: string;
  listTitle: string;
  saveAction: string;
  resetPasswordInputLabel: string;
  resetPasswordInputPlaceholder: string;
  paginationShowingLabel: string;
  paginationPageLabel: string;
  paginationPerPageLabel: string;
  paginationPrevAction: string;
  paginationNextAction: string;
  retryAction: string;
  allBranchesOption: string;
  noneOption: string;
  activeLabel: string;
  loading: string;
  loadError: string;
  successCreate: string;
  successUpdate: string;
  successReset: string;
  expandAction: string;
  collapseAction: string;
  ownerAdminRoleLocked: string;
  ownerAdminSeedOnlyError: string;
  ownerAdminImmutableError: string;
  invalidRoleError: string;
  createPasswordInvalidError: string;
  resetPasswordInvalidError: string;
  emailSenderDisabledError: string;
}

export interface UserRowDraft {
  fullName: string;
  role: ShowroomRole;
  locale: SettingLocale;
  isActive: boolean;
  defaultBranchId: string | null;
  branchIds: string[];
}
