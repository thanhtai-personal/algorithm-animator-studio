import { makeAutoObservable } from "mobx";
import type { ZaloMiniAppSessionDto } from "@/lib/contracts";

const SESSION_STORAGE_KEY = "zalo-mini-app-session-token";

class ZaloMiniAppAuthStore {
  session: ZaloMiniAppSessionDto | null = null;

  constructor() {
    makeAutoObservable(this);
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) return;

    this.session = {
      sessionToken: token,
      expiresAt: "",
      identity: {
        id: "",
        zaloUserId: "",
        profileId: null,
        displayName: null,
        avatarUrl: null,
        phone: null,
        consentScopes: [],
        consentRevokedAt: null,
        lastLoginAt: "",
      },
    };
  }

  setSession(session: ZaloMiniAppSessionDto | null): void {
    this.session = session;

    if (typeof window === "undefined") return;
    if (!session?.sessionToken) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, session.sessionToken);
  }

  get sessionToken(): string | null {
    return this.session?.sessionToken ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.session?.sessionToken);
  }
}

export const zaloMiniAppAuthStore = new ZaloMiniAppAuthStore();
