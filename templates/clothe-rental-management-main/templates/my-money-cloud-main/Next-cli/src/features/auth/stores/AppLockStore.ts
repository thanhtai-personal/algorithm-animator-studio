import { makeAutoObservable } from "mobx";
import { getAppLockConfig, verifyAppLockPin } from "@/lib/appLock";
import { APP_LOCK_PIN_LENGTH } from "@/features/auth/utils/constants";

class AppLockStore {
  // Runtime-only state (not persisted, not in user settings)
  locked: boolean = false;
  pinDigits: string[] = Array(APP_LOCK_PIN_LENGTH).fill("");
  error: string | null = null;
  attempting: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.locked = this.getInitialLockState();
  }

  private getInitialLockState() {
    const { enabled, method, pinHash } = getAppLockConfig();
    return Boolean(enabled && method === "pin" && pinHash);
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  setPinDigits(digits: string[]) {
    this.pinDigits = digits;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setAttempting(attempting: boolean) {
    this.attempting = attempting;
  }

  // Verify pin using the hash stored in user settings (passed from hook)
  async verifyPin(userId: string, pin: string, pinHash: string | null | undefined): Promise<boolean> {
    if (!pinHash) return false;
    return verifyAppLockPin(userId, pin);
  }

  resetPinInput() {
    this.pinDigits = Array(APP_LOCK_PIN_LENGTH).fill("");
    this.error = null;
    this.attempting = false;
  }

  reset() {
    this.locked = false;
    this.resetPinInput();
  }
}

export const appLockStore = new AppLockStore();
