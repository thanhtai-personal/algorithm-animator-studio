import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppWebAuthContext, ZaloMiniAppWebAuthSession } from "@/lib/contracts";

const AUTH_STORAGE_KEY = "zalo-mini-app-web-auth";

type PersistedAuthState = {
  session: ZaloMiniAppWebAuthSession | null;
  authContext: ZaloMiniAppWebAuthContext | null;
};

function parsePersistedAuthState(rawValue: string): PersistedAuthState | null {
  try {
    const parsed = JSON.parse(rawValue) as PersistedAuthState;
    const accessToken = parsed.session?.accessToken;
    const refreshToken = parsed.session?.refreshToken;

    if (
      !parsed ||
      !parsed.session ||
      typeof accessToken !== "string" ||
      accessToken.trim().length === 0 ||
      typeof refreshToken !== "string" ||
      refreshToken.trim().length === 0
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

class ZaloMiniAppAuthStore {
  session: ZaloMiniAppWebAuthSession | null = null;
  authContext: ZaloMiniAppWebAuthContext | null = null;

  constructor() {
    makeAutoObservable(this);
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === "undefined") return;
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) return;

    const parsed = parsePersistedAuthState(rawValue);
    if (!parsed) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    this.session = parsed.session;
    this.authContext = parsed.authContext;
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    if (!this.session?.accessToken || !this.session.refreshToken) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    const payload: PersistedAuthState = {
      session: this.session,
      authContext: this.authContext,
    };

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }

  setSession(session: ZaloMiniAppWebAuthSession | null): void {
    this.session = session;
    if (!session) {
      this.authContext = null;
    }

    this.persist();
  }

  setAuthContext(authContext: ZaloMiniAppWebAuthContext | null): void {
    this.authContext = authContext;
    this.persist();
  }

  logout(): void {
    this.session = null;
    this.authContext = null;
    this.persist();
  }

  get accessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.session?.accessToken && this.session?.refreshToken);
  }
}

export const zaloMiniAppAuthStore = new ZaloMiniAppAuthStore();
