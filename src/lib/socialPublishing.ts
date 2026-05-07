import { buildApiUrl, readAccessToken } from "@/lib/auth";

export type SocialPlatform = "facebook" | "youtube" | "tiktok";
export type SocialConfigStatus = "not_configured" | "configured" | "token_expired" | "upload_failed";

export type SocialPlatformDefinition = {
  id: SocialPlatform;
  label: string;
  description: string;
  fields: { key: string; label: string; secret?: boolean; placeholder?: string }[];
};

export type SocialPlatformConfig = {
  platform: SocialPlatform;
  status: SocialConfigStatus;
  updatedAt?: string | null;
  maskedFields?: Record<string, string>;
};

export type SocialPublishMetadata = {
  title: string;
  description: string;
  tags: string;
  privacy: "private" | "unlisted" | "public";
  scheduledAt: string;
  youtubeCategory: string;
  youtubeMadeForKids: boolean;
  tiktokAllowComments: boolean;
  tiktokAllowDuet: boolean;
  tiktokAllowStitch: boolean;
  facebookPageId: string;
};

export type SocialPublishHistoryItem = {
  id: string;
  platform: SocialPlatform;
  status: string;
  title: string;
  publishedUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

export const SOCIAL_PLATFORMS: SocialPlatformDefinition[] = [
  {
    id: "facebook",
    label: "Facebook",
    description: "Publish videos to a Facebook Page through Meta Graph/Video API.",
    fields: [
      { key: "pageId", label: "Page ID", placeholder: "1234567890" },
      { key: "pageAccessToken", label: "Page access token", secret: true, placeholder: "EAAB..." },
    ],
  },
  {
    id: "youtube",
    label: "YouTube",
    description: "Upload videos to the authorized YouTube channel with Data API videos.insert.",
    fields: [
      { key: "clientId", label: "OAuth client ID", placeholder: "apps.googleusercontent.com" },
      { key: "clientSecret", label: "OAuth client secret", secret: true },
      { key: "refreshToken", label: "Refresh token", secret: true },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Upload videos with TikTok Content Posting API after app approval.",
    fields: [
      { key: "clientKey", label: "Client key" },
      { key: "clientSecret", label: "Client secret", secret: true },
      { key: "accessToken", label: "Access token", secret: true },
      { key: "refreshToken", label: "Refresh token", secret: true },
    ],
  },
];

async function socialRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readAccessToken();
  if (!token) throw new Error("Admin login is required.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Social publishing request failed.");
  return payload as T;
}

export function getDefaultConfigs(): Record<SocialPlatform, SocialPlatformConfig> {
  return {
    facebook: { platform: "facebook", status: "not_configured" },
    youtube: { platform: "youtube", status: "not_configured" },
    tiktok: { platform: "tiktok", status: "not_configured" },
  };
}

export function listSocialConfigs() {
  return socialRequest<{ configs: SocialPlatformConfig[] }>("/api/v1/social-publishing/configs");
}

export function saveSocialConfig(platform: SocialPlatform, values: Record<string, string>) {
  return socialRequest<{ config: SocialPlatformConfig }>(`/api/v1/social-publishing/configs/${platform}`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}

export function deleteSocialConfig(platform: SocialPlatform) {
  return socialRequest<{ success: boolean }>(`/api/v1/social-publishing/configs/${platform}`, {
    method: "DELETE",
  });
}

export function testSocialConnection(platform: SocialPlatform) {
  return socialRequest<{ config: SocialPlatformConfig }>(`/api/v1/social-publishing/configs/${platform}/test`, {
    method: "POST",
  });
}

export function listPublishHistory() {
  return socialRequest<{ history: SocialPublishHistoryItem[] }>("/api/v1/social-publishing/history");
}

export function publishVideoToSocial(options: {
  file: File;
  platforms: SocialPlatform[];
  metadata: SocialPublishMetadata;
}) {
  const body = new FormData();
  body.set("video", options.file);
  body.set("platforms", JSON.stringify(options.platforms));
  body.set("metadata", JSON.stringify(options.metadata));
  return socialRequest<{ history: SocialPublishHistoryItem[] }>("/api/v1/social-publishing/publish", {
    method: "POST",
    body,
  });
}
