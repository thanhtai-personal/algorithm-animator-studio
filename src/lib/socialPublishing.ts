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

type StoredSocialConfig = SocialPlatformConfig & {
  values: Record<string, string>;
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

const CONFIG_STORAGE_KEY = "socialPublishing:configs";
const HISTORY_STORAGE_KEY = "socialPublishing:history";

export function getDefaultConfigs(): Record<SocialPlatform, SocialPlatformConfig> {
  return {
    facebook: { platform: "facebook", status: "not_configured" },
    youtube: { platform: "youtube", status: "not_configured" },
    tiktok: { platform: "tiktok", status: "not_configured" },
  };
}

export async function listSocialConfigs() {
  return { configs: Object.values(readStoredConfigs()).map(stripStoredValues) };
}

export async function saveSocialConfig(platform: SocialPlatform, values: Record<string, string>) {
  const storedConfigs = readStoredConfigs();
  const previousValues = storedConfigs[platform]?.values ?? {};
  const nextValues = removeEmptyValues({ ...previousValues, ...values });
  const config: StoredSocialConfig = {
    platform,
    status: Object.keys(nextValues).length > 0 ? "configured" : "not_configured",
    updatedAt: new Date().toISOString(),
    maskedFields: maskValues(nextValues),
    values: nextValues,
  };

  storedConfigs[platform] = config;
  writeStoredConfigs(storedConfigs);
  return { config: stripStoredValues(config) };
}

export async function deleteSocialConfig(platform: SocialPlatform) {
  const storedConfigs = readStoredConfigs();
  delete storedConfigs[platform];
  writeStoredConfigs(storedConfigs);
  return { success: true };
}

export async function testSocialConnection(platform: SocialPlatform) {
  const config = readStoredConfigs()[platform];
  if (!config || Object.keys(config.values).length === 0) {
    throw new Error("Missing local platform configuration.");
  }

  return { config: stripStoredValues({ ...config, status: "configured" }) };
}

export async function listPublishHistory() {
  return { history: readStoredHistory() };
}

export async function publishVideoToSocial(options: {
  file: File;
  platforms: SocialPlatform[];
  metadata: SocialPublishMetadata;
}) {
  const configs = readStoredConfigs();
  const missingPlatform = options.platforms.find((platform) => !configs[platform]?.values);
  if (missingPlatform) {
    throw new Error(`${platformLabel(missingPlatform)} is not configured locally.`);
  }

  const createdAt = new Date().toISOString();
  const title = options.metadata.title.trim() || options.file.name;
  const nextItems = options.platforms.map<SocialPublishHistoryItem>((platform) => ({
    id: `${platform}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    platform,
    status: "local_ready",
    title,
    createdAt,
    publishedUrl: null,
    errorMessage: "Stored locally. Connect a platform API worker to perform real upload.",
  }));
  const history = [...nextItems, ...readStoredHistory()].slice(0, 50);
  writeStoredHistory(history);

  return { history };
}

function readStoredConfigs(): Partial<Record<SocialPlatform, StoredSocialConfig>> {
  return readJson(CONFIG_STORAGE_KEY, {});
}

function writeStoredConfigs(configs: Partial<Record<SocialPlatform, StoredSocialConfig>>): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
}

function readStoredHistory(): SocialPublishHistoryItem[] {
  const history = readJson<SocialPublishHistoryItem[]>(HISTORY_STORAGE_KEY, []);
  return Array.isArray(history) ? history : [];
}

function writeStoredHistory(history: SocialPublishHistoryItem[]): void {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function stripStoredValues(config: StoredSocialConfig): SocialPlatformConfig {
  return {
    platform: config.platform,
    status: config.status,
    updatedAt: config.updatedAt,
    maskedFields: config.maskedFields,
  };
}

function removeEmptyValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim().length > 0));
}

function maskValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, maskValue(value)]));
}

function maskValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 6) return "*".repeat(trimmed.length);
  return `${trimmed.slice(0, 3)}...${trimmed.slice(-3)}`;
}

function platformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORMS.find((item) => item.id === platform)?.label ?? platform;
}
