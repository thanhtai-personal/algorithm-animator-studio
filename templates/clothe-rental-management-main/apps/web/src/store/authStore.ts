import { makeAutoObservable } from "mobx";
import storageAdapter from "@/lib/storageAdapter";
import type { UserSettings } from "@/types/userSettings";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";
import {
  EMPTY_AUTH_PERMISSIONS,
  type AuthPermissions,
  type AuthProfileContext,
  type AuthProfileLoadStatus,
  type ProfileBranchAccess,
  type ShowroomProfile,
} from "@/types/showroomAuth";

function getBranchSelectionStorageKey(userId: string): string {
  return `user:${userId}:currentBranchId`;
}

function normalizeCachedRole(value: unknown): ShowroomProfile["role"] {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "admin") return "owner_admin";
  if (
    normalized === "owner_admin" ||
    normalized === "manager" ||
    normalized === "staff" ||
    normalized === "accountant" ||
    normalized === "makeup_artist" ||
    normalized === "customer"
  ) {
    return normalized;
  }
  return null;
}

class AuthStore {
  private static _instance: AuthStore | null = null;

  private _userSettings: UserSettings | null = null;
  private _userId: string | null = null;
  private _anonId: string | null = null;
  private _isBootstrapped = false;
  private _profile: ShowroomProfile | null = null;
  private _branchAccess: ProfileBranchAccess[] = [];
  private _currentBranchId: string | null = null;
  private _permissions: AuthPermissions = { ...EMPTY_AUTH_PERMISSIONS };
  private _profileLoadStatus: AuthProfileLoadStatus = "idle";

  private constructor() {
    makeAutoObservable(this);
  }

  static getInstance(): AuthStore {
    if (!this._instance) {
      this._instance = new AuthStore();
    }
    return this._instance;
  }

  load() {
    this._userId = storageAdapter.getUserId() || null;
    this._anonId = storageAdapter.getAnonId() || null;
    if (this._userId || this._anonId) {
      const infoId = this._anonId || this._userId || "";
      this._userSettings = storageAdapter.getUserInfo(infoId);
    }
  }

  /* ===================== GETTERS ===================== */

  get userSettings(): UserSettings | null {
    return this._userSettings;
  }

  get userId(): string | null {
    return this._userId;
  }

  get anonId(): string | null {
    return this._anonId;
  }

  get isBootstrapped(): boolean {
    return this._isBootstrapped;
  }

  get profile(): ShowroomProfile | null {
    return this._profile;
  }

  get branchAccess(): ProfileBranchAccess[] {
    return this._branchAccess;
  }

  get currentBranchId(): string | null {
    return this._currentBranchId;
  }

  get permissions(): AuthPermissions {
    return this._permissions;
  }

  get profileLoadStatus(): AuthProfileLoadStatus {
    return this._profileLoadStatus;
  }

  get role(): ShowroomProfile["role"] {
    return this._profile?.role ?? normalizeCachedRole(this._userSettings?.role);
  }

  get hasCloudSession(): boolean {
    return Boolean(this._userId);
  }

  get hasGuestSession(): boolean {
    return !this._userId && Boolean(this._anonId);
  }

  /* ==================== SETTERS ===================== */
  set anonId(anonId: string | null) {
    this._anonId = anonId;
  }

  set userId(userId: string | null) {
    this._userId = userId;
  }

  set userSettings(settings: UserSettings | null) {
    this._userSettings = settings;
  }

  set isBootstrapped(value: boolean) {
    this._isBootstrapped = value;
  }

  set currentBranchId(branchId: string | null) {
    if (
      branchId &&
      this._branchAccess.length > 0 &&
      !this._branchAccess.some((entry) => entry.branchId === branchId)
    ) {
      return;
    }
    this._currentBranchId = branchId;
    if (this._userId) {
      if (branchId) {
        storageAdapter.setItem(getBranchSelectionStorageKey(this._userId), branchId);
      } else {
        storageAdapter.removeItem(getBranchSelectionStorageKey(this._userId));
      }
    }
  }

  set profileLoadStatus(status: AuthProfileLoadStatus) {
    this._profileLoadStatus = status;
  }

  /* ===================== MUTATIONS ===================== */
  initAnonymousSession(anonId: string, partial: Partial<UserSettings> = {}) {
    const settings: UserSettings = {
      currency: null,
      theme_mode: "light",
      theme: "light",
      theme_variant: DEFAULT_THEME_VARIANT,
      ...partial,
    };
    this._anonId = anonId;
    storageAdapter.setAnonId(anonId);
    this._userSettings = settings;
    storageAdapter.setUserInfo(anonId, settings);
  }

  updateUser(partial: Partial<UserSettings>) {
    if (!this._userSettings) return;
    this._userSettings = { ...this._userSettings, ...partial };
    this.write(this._userSettings);
  }

  write(settings: UserSettings): void {
    const userId = this._userId || this._anonId;
    if (!userId) return;
    this._userSettings = settings;
    storageAdapter.setUserInfo(userId, settings);
  }

  upsert(partial: Partial<UserSettings>): void {
    const userId = this._userId || this._anonId;
    if (!userId) return;
    this._userSettings = { ...this._userSettings, ...partial } as UserSettings;
    storageAdapter.setUserInfo(userId, this._userSettings);
  }

  updateAIRequests(ai_requests_remaining: number) {
    // Legacy finance compatibility while old AI settings callers still exist.
    this.updateUser({ ai_requests_remaining });
  }

  updateAITrialUsed(ai_trial_used: boolean) {
    // Legacy finance compatibility while old AI settings callers still exist.
    this.updateUser({ ai_trial_used });
  }

  setUserSession(userId: string, settings: UserSettings | null) {
    const userChanged = this._userId !== userId;
    this._userId = userId;
    storageAdapter.setUserId(userId);
    this._userSettings = settings;
    if (settings) {
      storageAdapter.setUserInfo(userId, settings);
    }
    if (userChanged) {
      this.clearProfileContext();
      this._profileLoadStatus = "idle";
    }
  }

  setPendingUserId(userId: string) {
    if (this._userId !== userId) {
      this.clearProfileContext();
      this._profileLoadStatus = "idle";
    }
    this._userId = userId;
    storageAdapter.setUserId(userId);
  }

  clearPendingUserId(): void {
    if (this._userId) {
      storageAdapter.removeItem(storageAdapter.StorageKeys.userId());
      storageAdapter.removeItem(getBranchSelectionStorageKey(this._userId));
    }
    this._userId = null;
    this.clearProfileContext();
  }

  clearUserSession(): void {
    const userId = this._userId;
    if (userId) {
      storageAdapter.removeItem(storageAdapter.StorageKeys.userId());
      storageAdapter.removeItem(getBranchSelectionStorageKey(userId));
      storageAdapter.setUserInfo(userId, null);
    }
    this._userId = null;
    this._userSettings = null;
    this.clearProfileContext();
  }

  clearAnonymousSession(): void {
    const anonId = this._anonId;
    if (anonId) {
      storageAdapter.removeItem(storageAdapter.StorageKeys.anonId());
      storageAdapter.setUserInfo(anonId, null);
    }
    this._anonId = null;
  }

  signOut(): void {
    this.clearUserSession();
  }

  clear() {
    const userId = this._userId || this._anonId;
    if (!userId) return;
    this._userSettings = null;
    storageAdapter.setUserInfo(userId, null);
  }

  setProfileContext(context: AuthProfileContext, permissions: AuthPermissions): void {
    this._profile = context.profile;
    this._branchAccess = context.branchAccess;
    this._permissions = permissions;
    this._profileLoadStatus = "ready";

    const activeBranchIds = new Set(context.branchAccess.map((entry) => entry.branchId));
    const preferredPersisted =
      this._userId ? storageAdapter.getItem(getBranchSelectionStorageKey(this._userId)) : null;
    const fallbackBranchId =
      preferredPersisted && activeBranchIds.has(preferredPersisted)
        ? preferredPersisted
        : context.branchAccess.find((entry) => entry.isDefault)?.branchId ??
          context.profile?.defaultBranchId ??
          context.branchAccess[0]?.branchId ??
          null;

    this.currentBranchId = fallbackBranchId;
  }

  clearProfileContext(): void {
    this._profile = null;
    this._branchAccess = [];
    this._currentBranchId = null;
    this._permissions = { ...EMPTY_AUTH_PERMISSIONS };
    this._profileLoadStatus = "idle";
  }

  markProfileLoading(): void {
    this._profileLoadStatus = "loading";
  }

  markProfileLoadError(): void {
    this._profileLoadStatus = "error";
    this._profile = null;
    this._branchAccess = [];
    this._currentBranchId = null;
    this._permissions = { ...EMPTY_AUTH_PERMISSIONS };
  }
}

export const authStore = AuthStore.getInstance();
