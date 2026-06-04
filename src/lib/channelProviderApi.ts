import { buildApiUrl, parseApiResponse } from "./runtimeApi";
import type { SocialPlatform } from "@/features/social-channel/types";

export type SocialProviderConfig = {
  configured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  redirectUri: string;
};

export type SocialProviderConfigStatus = {
  providers: Record<SocialPlatform, SocialProviderConfig>;
};

export type ConnectedSocialProviderChannel = {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  url: string;
  thumbnailUrl?: string;
};

export async function getSocialProviderConfig() {
  return parseApiResponse<SocialProviderConfigStatus>(await fetch(buildApiUrl("/api/channel/providers/config")));
}

export async function getSocialProviderAuthUrl(provider: SocialPlatform, redirectUri: string, state: string, codeChallenge?: string) {
  const params = new URLSearchParams({ redirectUri, state });
  if (codeChallenge) params.set("codeChallenge", codeChallenge);
  const data = await parseApiResponse<{ authUrl: string }>(await fetch(buildApiUrl(`/api/channel/providers/${provider}/auth-url?${params}`)));
  return data.authUrl;
}

export async function exchangeSocialProviderCode(provider: SocialPlatform, code: string, redirectUri: string, codeVerifier?: string) {
  return parseApiResponse<{ channel?: ConnectedSocialProviderChannel; channels?: ConnectedSocialProviderChannel[] }>(await fetch(buildApiUrl(`/api/channel/providers/${provider}/exchange-code`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri, codeVerifier }),
  }));
}
