import { makeAutoObservable } from "mobx";
import type { MiniAppAuthSession } from "@/features/auth/services/zaloMiniAppAuthApiService";

const SESSION_STORAGE_KEY = "kata-rental-order-auth-session";

class ZaloMiniAppAuthStore {
  session: MiniAppAuthSession | null = null;
  errorMessage: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<MiniAppAuthSession>;
      if (
        typeof parsed.accessToken !== "string" ||
        parsed.accessToken.length === 0 ||
        typeof parsed.refreshToken !== "string" ||
        parsed.refreshToken.length === 0
      ) {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      this.session = {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        expiresAt: typeof parsed.expiresAt === "string" ? parsed.expiresAt : null,
      };
    } catch {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  setSession(session: MiniAppAuthSession | null): void {
    this.session = session;

    if (typeof window === "undefined") return;
    if (!session?.accessToken || !session.refreshToken) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  setErrorMessage(message: string | null): void {
    this.errorMessage = message;
  }

  clearError(): void {
    this.errorMessage = null;
  }

  get accessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.session?.refreshToken ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.session?.accessToken && this.session.refreshToken);
  }
}

export const zaloMiniAppAuthStore = new ZaloMiniAppAuthStore();
