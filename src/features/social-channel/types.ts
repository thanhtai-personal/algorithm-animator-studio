export type SocialPlatform = "facebook" | "tiktok" | "instagram";

export type SocialChannelStatus = "draft" | "connected" | "reviewing";

export type SocialChannel = {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  url: string;
  providerAccountId?: string;
  remoteId?: string;
  ownerName: string;
  status: SocialChannelStatus;
  contentRole: string;
  uploadCadence: string;
  defaultHashtags: string;
  notes: string;
  createdAtMs: number;
  updatedAtMs: number;
};

export type SocialChannelWorkspace = {
  activePlatform: SocialPlatform;
  activeChannelId: string;
  channels: SocialChannel[];
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["facebook", "tiktok", "instagram"];
