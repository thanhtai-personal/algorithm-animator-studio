import type { SocialChannel, SocialChannelStatus, SocialChannelWorkspace, SocialPlatform } from "./types";

const SOCIAL_WORKSPACE_KEY = "kai-studio.socialChannels.workspace.v1";

const DEFAULTS: Record<SocialPlatform, Pick<SocialChannel, "contentRole" | "uploadCadence" | "defaultHashtags" | "notes">> = {
  facebook: {
    contentRole: "Đăng lại video ngắn, bài giới thiệu video dài và community post.",
    uploadCadence: "3-5 bài/tuần",
    defaultHashtags: "#coding #programming #visuallearning #kaistudio",
    notes: "Theo dõi page/group phù hợp để kéo traffic về YouTube.",
  },
  tiktok: {
    contentRole: "Kênh kéo reach bằng video ngắn 15-60 giây.",
    uploadCadence: "1-3 video/ngày",
    defaultHashtags: "#coding #learnprogramming #algorithm #visualcode",
    notes: "Ưu tiên hook mạnh, caption ngắn và CTA sang video dài.",
  },
  instagram: {
    contentRole: "Reels + carousel tóm tắt kiến thức lập trình.",
    uploadCadence: "3-5 reels/tuần",
    defaultHashtags: "#codinglife #programmingtips #algorithm #kaistudio",
    notes: "Dùng lại key visual từ Shorts và long video.",
  },
};

export function readSocialChannelWorkspace(): SocialChannelWorkspace {
  try {
    const raw = localStorage.getItem(SOCIAL_WORKSPACE_KEY);
    if (raw) return normalizeWorkspace(JSON.parse(raw));
  } catch {
    // Keep a usable empty workspace when localStorage content is invalid.
  }

  return createDefaultWorkspace();
}

export function writeSocialChannelWorkspace(workspace: SocialChannelWorkspace) {
  localStorage.setItem(SOCIAL_WORKSPACE_KEY, JSON.stringify(normalizeWorkspace(workspace)));
}

export function createSocialChannel(platform: SocialPlatform, index = 1): SocialChannel {
  const now = Date.now();
  return {
    id: createId(`${platform}-channel`),
    platform,
    name: `${platformName(platform)} ${index}`,
    handle: "",
    url: "",
    ownerName: "",
    status: "draft",
    ...DEFAULTS[platform],
    createdAtMs: now,
    updatedAtMs: now,
  };
}

function createDefaultWorkspace(): SocialChannelWorkspace {
  const channel = createSocialChannel("facebook", 1);
  const workspace = { activePlatform: "facebook" as const, activeChannelId: channel.id, channels: [channel] };
  writeSocialChannelWorkspace(workspace);
  return workspace;
}

function normalizeWorkspace(input: Partial<SocialChannelWorkspace>): SocialChannelWorkspace {
  const channels = Array.isArray(input.channels) ? input.channels.filter(Boolean).map(normalizeChannel) : [];
  const activePlatform = isPlatform(input.activePlatform) ? input.activePlatform : channels[0]?.platform || "facebook";
  const activeChannelId = channels.some((channel) => channel.id === input.activeChannelId)
    ? String(input.activeChannelId)
    : channels.find((channel) => channel.platform === activePlatform)?.id || channels[0]?.id || "";

  return { activePlatform, activeChannelId, channels };
}

function normalizeChannel(channel: Partial<SocialChannel>): SocialChannel {
  const platform = isPlatform(channel.platform) ? channel.platform : "facebook";
  const defaults = DEFAULTS[platform];
  const status: SocialChannelStatus = channel.status === "connected" || channel.status === "reviewing" ? channel.status : "draft";
  return {
    id: channel.id || createId(`${platform}-channel`),
    platform,
    name: channel.name || `${platformName(platform)} channel`,
    handle: channel.handle || "",
    url: channel.url || "",
    ownerName: channel.ownerName || "",
    status,
    contentRole: channel.contentRole || defaults.contentRole,
    uploadCadence: channel.uploadCadence || defaults.uploadCadence,
    defaultHashtags: channel.defaultHashtags || defaults.defaultHashtags,
    notes: channel.notes || defaults.notes,
    createdAtMs: channel.createdAtMs || Date.now(),
    updatedAtMs: channel.updatedAtMs || Date.now(),
  };
}

function isPlatform(value: unknown): value is SocialPlatform {
  return value === "facebook" || value === "tiktok" || value === "instagram";
}

function platformName(platform: SocialPlatform) {
  return platform === "facebook" ? "Facebook" : platform === "tiktok" ? "TikTok" : "Instagram";
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
