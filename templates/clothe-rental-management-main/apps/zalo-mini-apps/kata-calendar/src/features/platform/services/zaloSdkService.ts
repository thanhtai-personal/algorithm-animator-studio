import type { ZaloSdkAuthResult, ZaloSdkUserInfo } from "@/features/platform/types/platform";

interface ZaloAuthorizePayload {
  scopes?: string[];
}

interface GlobalZaloSdk {
  authorize?: (payload?: Record<string, unknown>) => Promise<unknown>;
  getAccessToken?: () => Promise<unknown>;
  getUserInfo?: (payload?: Record<string, unknown>) => Promise<unknown>;
}

function getGlobalZaloSdk(): GlobalZaloSdk | null {
  const candidate = (globalThis as { zmp?: unknown }).zmp;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as GlobalZaloSdk;
}

function parseUserInfo(value: unknown): ZaloSdkUserInfo | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : typeof row.userId === "string" ? row.userId : null;
  if (!id) return null;

  return {
    id,
    name: typeof row.name === "string" ? row.name : undefined,
    avatar: typeof row.avatar === "string" ? row.avatar : undefined,
    idByOA: typeof row.idByOA === "string" ? row.idByOA : undefined,
  };
}

function parseAccessToken(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  if (typeof row.accessToken === "string") return row.accessToken;
  if (typeof row.token === "string") return row.token;
  return null;
}

export const zaloSdkService = {
  isSupported(): boolean {
    return Boolean(getGlobalZaloSdk());
  },

  async authorize(options: ZaloAuthorizePayload = {}): Promise<ZaloSdkAuthResult> {
    const sdk = getGlobalZaloSdk();

    if (!sdk?.authorize || !sdk?.getAccessToken) {
      return {
        accessToken: "mock-access-token",
        scopes: options.scopes ?? ["scope.userInfo"],
      };
    }

    await sdk.authorize({
      scopes: options.scopes ?? ["scope.userInfo"],
    });

    const token = parseAccessToken(await sdk.getAccessToken());
    if (!token) {
      throw new Error("Không lấy được access token từ Zalo SDK.");
    }

    return {
      accessToken: token,
      scopes: options.scopes ?? ["scope.userInfo"],
    };
  },

  async getUserInfo(): Promise<ZaloSdkUserInfo | null> {
    const sdk = getGlobalZaloSdk();

    if (!sdk?.getUserInfo) {
      return {
        id: "mock-zalo-user",
        name: "Mini App Test User",
      };
    }

    const raw = await sdk.getUserInfo({ avatarType: "normal" });
    if (!raw || typeof raw !== "object") return null;

    const asRecord = raw as Record<string, unknown>;
    if (asRecord.userInfo && typeof asRecord.userInfo === "object") {
      return parseUserInfo(asRecord.userInfo);
    }

    return parseUserInfo(raw);
  },
};
