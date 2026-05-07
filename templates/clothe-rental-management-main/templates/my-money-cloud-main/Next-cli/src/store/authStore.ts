import { makeAutoObservable } from "mobx";
import storageAdapter from "@/lib/storageAdapter";
import type { UserSettings } from "@/types/userSettings";
import { DEFAULT_THEME_VARIANT } from "@/constants/themeVariant";

class AuthStore {
  private static _instance: AuthStore | null = null;

  private _userSettings: UserSettings | null = null;
  private _userId: string | null = null;
  private _anonId: string | null = null;

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

  /* ===================== MUTATIONS ===================== */
  initAnonymousSession(anonId: string, partial: Partial<UserSettings> = {}) {
    const settings: UserSettings = {
      currency: null,
      theme_variant: DEFAULT_THEME_VARIANT,
      ai_trial_used: false,
      ai_requests_remaining: 0,
      use_ai: true,
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
    this.updateUser({ ai_requests_remaining });
  }

  updateAITrialUsed(ai_trial_used: boolean) {
    this.updateUser({ ai_trial_used });
  }

  setUserSession(userId: string, settings: UserSettings | null) {
    this._userId = userId;
    storageAdapter.setUserId(userId);
    this._userSettings = settings;
    if (settings) {
      storageAdapter.setUserInfo(userId, settings);
    }
  }

  setPendingUserId(userId: string) {
    this._userId = userId;
    storageAdapter.setUserId(userId);
  }

  clearPendingUserId(): void {
    if (this._userId) {
      storageAdapter.removeItem(storageAdapter.StorageKeys.userId());
    }
    this._userId = null;
  }

  clearUserSession(): void {
    const userId = this._userId;
    if (userId) {
      storageAdapter.removeItem(storageAdapter.StorageKeys.userId());
      storageAdapter.setUserInfo(userId, null);
    }
    this._userId = null;
    this._userSettings = null;
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
}

export const authStore = AuthStore.getInstance();
