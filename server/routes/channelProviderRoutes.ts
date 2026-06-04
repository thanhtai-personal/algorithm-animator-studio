import { Router } from "express";
import { readEnvValues } from "../services/EnvFileService";
import { readRuntimeEnvFromRequest } from "../services/RuntimeEnvService";

type SocialProvider = "tiktok" | "facebook" | "instagram";
type ConnectedChannel = {
  id: string;
  platform: SocialProvider;
  name: string;
  handle: string;
  url: string;
  thumbnailUrl?: string;
};

type ProviderConfigStatus = {
  configured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  redirectUri: string;
  scopes?: string;
};

const PROVIDER_ENV: Record<SocialProvider, { clientId: string; clientSecret: string; redirectUri: string }> = {
  tiktok: {
    clientId: "TIKTOK_CLIENT_KEY",
    clientSecret: "TIKTOK_CLIENT_SECRET",
    redirectUri: "TIKTOK_REDIRECT_URI",
  },
  facebook: {
    clientId: "FACEBOOK_APP_ID",
    clientSecret: "FACEBOOK_APP_SECRET",
    redirectUri: "FACEBOOK_REDIRECT_URI",
  },
  instagram: {
    clientId: "INSTAGRAM_APP_ID",
    clientSecret: "INSTAGRAM_APP_SECRET",
    redirectUri: "INSTAGRAM_REDIRECT_URI",
  },
};
const META_GRAPH_VERSION = "v19.0";

export function createChannelProviderRouter() {
  const router = Router();

  router.get("/channel/providers/config", (req, res) => {
    const env = readEnvValues(readRuntimeEnvFromRequest(req));
    res.json({
      providers: {
        tiktok: getProviderConfig(env, "tiktok"),
        facebook: getProviderConfig(env, "facebook"),
        instagram: getProviderConfig(env, "instagram"),
      },
    });
  });

  router.get("/channel/providers/:provider/auth-url", (req, res) => {
    try {
      const provider = parseProvider(req.params.provider);
      const env = readEnvValues(readRuntimeEnvFromRequest(req));
      const redirectUri = String(req.query.redirectUri || env[PROVIDER_ENV[provider].redirectUri] || "").trim();
      const state = String(req.query.state || "").trim();
      const codeChallenge = String(req.query.codeChallenge || "").trim();

      res.json({ authUrl: createProviderAuthUrl(provider, env, redirectUri, state, codeChallenge) });
    } catch (error) {
      sendError(res, error);
    }
  });

  router.post("/channel/providers/:provider/exchange-code", async (req, res) => {
    try {
      const provider = parseProvider(req.params.provider);
      const env = readEnvValues(readRuntimeEnvFromRequest(req));
      const code = String(req.body?.code || "").trim();
      const redirectUri = String(req.body?.redirectUri || env[PROVIDER_ENV[provider].redirectUri] || "").trim();
      const codeVerifier = String(req.body?.codeVerifier || "").trim();

      if (!code) throw new Error(`Thiếu mã cấp quyền ${providerLabel(provider)}.`);

      const channels = await exchangeProviderChannels(provider, code, redirectUri, codeVerifier, env);
      res.json({ channel: channels[0], channels });
    } catch (error) {
      sendError(res, error);
    }
  });

  return router;
}

function getProviderConfig(env: Record<string, string>, provider: SocialProvider): ProviderConfigStatus {
  const keys = PROVIDER_ENV[provider];
  const hasClientId = Boolean(env[keys.clientId]?.trim());
  const hasClientSecret = Boolean(env[keys.clientSecret]?.trim());

  return {
    configured: hasClientId && hasClientSecret,
    hasClientId,
    hasClientSecret,
    redirectUri: env[keys.redirectUri] || "http://localhost:3000/channel",
    scopes: providerScopes(provider, env),
  };
}

function createProviderAuthUrl(provider: SocialProvider, env: Record<string, string>, redirectUri: string, state: string, codeChallenge: string) {
  if (provider === "tiktok") return createTikTokAuthUrl(env, redirectUri, state, codeChallenge);
  return createMetaAuthUrl(provider, env, redirectUri, state);
}

function exchangeProviderChannels(provider: SocialProvider, code: string, redirectUri: string, codeVerifier: string, env: Record<string, string>) {
  if (provider === "tiktok") return exchangeTikTokChannels(code, redirectUri, codeVerifier, env);
  return exchangeMetaChannels(provider, code, redirectUri, env);
}

function createTikTokAuthUrl(env: Record<string, string>, redirectUri: string, state: string, codeChallenge: string) {
  if (!env.TIKTOK_CLIENT_KEY?.trim() || !env.TIKTOK_CLIENT_SECRET?.trim()) {
    throw new Error("TikTok chưa có Client Key/Client Secret.");
  }
  if (!redirectUri) throw new Error("Thiếu TikTok redirect URI.");
  if (!state) throw new Error("Thiếu OAuth state.");
  if (!codeChallenge) throw new Error("Thiếu TikTok code challenge.");

  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    response_type: "code",
    scope: env.TIKTOK_SCOPES || "user.info.basic",
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

async function exchangeTikTokChannels(code: string, redirectUri: string, codeVerifier: string, env: Record<string, string>): Promise<ConnectedChannel[]> {
  if (!codeVerifier) throw new Error("Thiếu TikTok code verifier.");
  const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const tokenPayload = await tokenResponse.json() as TikTokTokenResponse;
  if (!tokenResponse.ok || tokenPayload.error) {
    throw new Error(tokenPayload.error_description || tokenPayload.message || tokenPayload.error || "TikTok token exchange thất bại.");
  }

  const accessToken = tokenPayload.access_token || tokenPayload.data?.access_token;
  if (!accessToken) throw new Error("TikTok không trả access token.");

  const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,profile_deep_link,username", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profilePayload = await profileResponse.json() as TikTokProfileResponse;
  if (!profileResponse.ok || profilePayload.error?.code && profilePayload.error.code !== "ok") {
    throw new Error(profilePayload.error?.message || "Không lấy được TikTok profile.");
  }

  const user = profilePayload.data?.user || profilePayload.data;
  const id = user?.open_id || user?.union_id;
  if (!id) throw new Error("TikTok profile không có open_id.");

  return [{
    id,
    platform: "tiktok",
    name: user?.display_name || user?.username || "TikTok channel",
    handle: user?.username ? `@${user.username}` : "",
    url: user?.profile_deep_link || "",
    thumbnailUrl: user?.avatar_url || "",
  }];
}

function createMetaAuthUrl(provider: "facebook" | "instagram", env: Record<string, string>, redirectUri: string, state: string) {
  const keys = PROVIDER_ENV[provider];
  const appId = env[keys.clientId]?.trim();
  if (!appId || !env[keys.clientSecret]?.trim()) throw new Error(`${providerLabel(provider)} chưa có App ID/App Secret.`);
  if (!redirectUri) throw new Error(`Thiếu ${providerLabel(provider)} redirect URI.`);
  if (!state) throw new Error("Thiếu OAuth state.");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: providerScopes(provider, env),
    state,
  });

  return `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?${params}`;
}

async function exchangeMetaChannels(provider: "facebook" | "instagram", code: string, redirectUri: string, env: Record<string, string>): Promise<ConnectedChannel[]> {
  const keys = PROVIDER_ENV[provider];
  const tokenParams = new URLSearchParams({
    client_id: env[keys.clientId],
    client_secret: env[keys.clientSecret],
    redirect_uri: redirectUri,
    code,
  });
  const tokenPayload = await graphGet<MetaTokenResponse>(`/oauth/access_token?${tokenParams}`);
  if (!tokenPayload.access_token) throw new Error(`${providerLabel(provider)} không trả access token.`);

  return provider === "facebook"
    ? getFacebookPageChannels(tokenPayload.access_token)
    : getInstagramAccountChannels(tokenPayload.access_token);
}

async function getFacebookPageChannels(accessToken: string): Promise<ConnectedChannel[]> {
  const fields = "id,name,link,picture{url}";
  const payload = await graphGet<MetaPagesResponse>(`/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`);
  const channels = (payload.data || []).map((page) => ({
    id: page.id,
    platform: "facebook" as const,
    name: page.name || "Facebook Page",
    handle: "",
    url: page.link || `https://www.facebook.com/${page.id}`,
    thumbnailUrl: page.picture?.data?.url || "",
  }));
  if (!channels.length) throw new Error("Không tìm thấy Facebook Page nào có quyền quản lý.");
  return channels;
}

async function getInstagramAccountChannels(accessToken: string): Promise<ConnectedChannel[]> {
  const fields = "id,name,instagram_business_account{id,username,name,profile_picture_url}";
  const payload = await graphGet<MetaPagesResponse>(`/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`);
  const channels = (payload.data || [])
    .map((page) => page.instagram_business_account)
    .filter(Boolean)
    .map((account) => ({
      id: account!.id,
      platform: "instagram" as const,
      name: account!.name || account!.username || "Instagram account",
      handle: account!.username ? `@${account!.username}` : "",
      url: account!.username ? `https://www.instagram.com/${account!.username}/` : "",
      thumbnailUrl: account!.profile_picture_url || "",
    }));
  if (!channels.length) throw new Error("Không tìm thấy Instagram Business/Creator account nào gắn với Page.");
  return channels;
}

async function graphGet<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `https://graph.facebook.com/${META_GRAPH_VERSION}${path}`;
  const response = await fetch(url);
  const payload = await response.json() as T & { error?: { message?: string } };
  if (!response.ok || payload.error) throw new Error(payload.error?.message || "Meta Graph API thất bại.");
  return payload;
}

function providerScopes(provider: SocialProvider, env: Record<string, string>) {
  if (provider === "tiktok") return env.TIKTOK_SCOPES || "user.info.basic";
  if (provider === "facebook") return env.FACEBOOK_SCOPES || "pages_show_list,pages_read_engagement";
  return env.INSTAGRAM_SCOPES || "instagram_basic,pages_show_list,pages_read_engagement";
}

function parseProvider(value: string): SocialProvider {
  if (value === "tiktok" || value === "facebook" || value === "instagram") return value;
  throw new Error("Provider không hợp lệ.");
}

function providerLabel(provider: SocialProvider) {
  if (provider === "facebook") return "Facebook";
  if (provider === "instagram") return "Instagram";
  return "TikTok";
}

function sendError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown) {
  res.status(500).json({ error: error instanceof Error ? error.message : "Yêu cầu provider thất bại." });
}

type TikTokTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  message?: string;
  data?: { access_token?: string };
};

type TikTokProfileResponse = {
  data?: {
    user?: TikTokUser;
    open_id?: string;
    union_id?: string;
    avatar_url?: string;
    display_name?: string;
    profile_deep_link?: string;
    username?: string;
  };
  error?: { code?: string; message?: string };
};

type MetaTokenResponse = { access_token?: string };
type MetaPagesResponse = {
  data?: Array<{
    id: string;
    name?: string;
    link?: string;
    picture?: { data?: { url?: string } };
    instagram_business_account?: {
      id: string;
      username?: string;
      name?: string;
      profile_picture_url?: string;
    };
  }>;
};

type TikTokUser = {
  open_id?: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  profile_deep_link?: string;
  username?: string;
};
