import type { YoutubeChannelProfile } from "@/lib/youtubeApi";
import type { ChannelIdea, YoutubeChannelPlan, YoutubeChannelWorkspace, YoutubeManagedChannel } from "./types";

const WORKSPACE_KEY = "kai-studio.youtube.workspace.v2";
const PLAN_KEY = "kai-studio.youtube.channelPlan.v1";
const TOKEN_KEY = "kai-studio.youtube.refreshToken";
const LEGACY_TOKEN_KEY = "algoshorts.youtube.refreshToken";

export const DEFAULT_CHANNEL_PLAN: YoutubeChannelPlan = createDefaultYoutubeChannelPlan();

export function createDefaultYoutubeChannelPlan(profile?: Partial<YoutubeChannelProfile>): YoutubeChannelPlan {
  return {
    channelUrl: resolveChannelUrl(profile),
    targetAudience: "Beginner developers, students, coding interview learners",
    contentPillars: "Algorithm visualized\nData structures visualized\nBig O explained\nCoding interview patterns\nJavaScript / React concepts",
    uploadCadence: "1 long video/week + 5 Shorts/week",
    defaultTags: "algorithm, programming, coding, computer science, visual learning, kai studio",
    pinnedComment: "Which algorithm should KAI STUDIO visualize next?",
    ideas: [
      createIdea("Bubble Sort Explained Visually", "long"),
      createIdea("Quick Sort in 30 Seconds", "short"),
      createIdea("Big O Explained With Animation", "long"),
    ],
  };
}

export function readYoutubeChannelWorkspace(): YoutubeChannelWorkspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (raw) return normalizeWorkspace(JSON.parse(raw));
  } catch {
    // Fall through to legacy migration.
  }

  return migrateLegacyWorkspace();
}

export function writeYoutubeChannelWorkspace(workspace: YoutubeChannelWorkspace) {
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(normalizeWorkspace(workspace)));
}

export function upsertManagedChannel(
  workspace: YoutubeChannelWorkspace,
  profile: YoutubeChannelProfile,
  refreshToken: string
): YoutubeChannelWorkspace {
  const channelUrl = resolveChannelUrl(profile);
  const localId = profile.id || createId("yt-channel");
  const existing = workspace.channels.find(
    (channel) => channel.youtubeChannelId === profile.id || channel.localId === localId || channel.refreshToken === refreshToken
  );
  const nextChannel: YoutubeManagedChannel = {
    ...existing,
    localId: existing?.localId || localId,
    youtubeChannelId: profile.id || existing?.youtubeChannelId,
    title: profile.title || existing?.title || "YouTube channel",
    channelUrl: channelUrl || existing?.channelUrl || "",
    description: profile.description,
    customUrl: profile.customUrl,
    thumbnailUrl: profile.thumbnailUrl,
    subscriberCount: profile.subscriberCount,
    videoCount: profile.videoCount,
    viewCount: profile.viewCount,
    uploadsPlaylistId: profile.uploadsPlaylistId,
    refreshToken,
    connectedAtMs: existing?.connectedAtMs || Date.now(),
    lastSyncedAtMs: Date.now(),
    plan: existing?.plan || createDefaultYoutubeChannelPlan(profile),
  };

  const channels = existing
    ? workspace.channels.map((channel) => channel.localId === existing.localId ? nextChannel : channel)
    : [nextChannel, ...workspace.channels];

  return normalizeWorkspace({ activeChannelLocalId: nextChannel.localId, channels });
}

export function createManualManagedChannel(title = "New YouTube channel"): YoutubeManagedChannel {
  return {
    localId: createId("manual-channel"),
    title,
    channelUrl: "",
    connectedAtMs: Date.now(),
    plan: createDefaultYoutubeChannelPlan({}),
  };
}

export function readYoutubeChannelPlan(): YoutubeChannelPlan {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return DEFAULT_CHANNEL_PLAN;
    return { ...DEFAULT_CHANNEL_PLAN, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHANNEL_PLAN;
  }
}

export function writeYoutubeChannelPlan(plan: YoutubeChannelPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function createIdea(title = "New video idea", format: ChannelIdea["format"] = "short"): ChannelIdea {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? createId("idea"),
    title,
    format,
    status: "idea",
  };
}

function migrateLegacyWorkspace(): YoutubeChannelWorkspace {
  const refreshToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || "";
  if (!refreshToken) return { activeChannelLocalId: "", channels: [] };

  const channel: YoutubeManagedChannel = {
    localId: "legacy-primary-channel",
    title: "Primary YouTube channel",
    channelUrl: readYoutubeChannelPlan().channelUrl,
    refreshToken,
    connectedAtMs: Date.now(),
    plan: readYoutubeChannelPlan(),
  };
  const workspace = normalizeWorkspace({ activeChannelLocalId: channel.localId, channels: [channel] });
  writeYoutubeChannelWorkspace(workspace);
  return workspace;
}

function normalizeWorkspace(input: Partial<YoutubeChannelWorkspace>): YoutubeChannelWorkspace {
  const channels = Array.isArray(input.channels) ? input.channels.filter(Boolean).map(normalizeChannel) : [];
  const firstId = channels[0]?.localId || "";
  const activeChannelLocalId = channels.some((channel) => channel.localId === input.activeChannelLocalId)
    ? String(input.activeChannelLocalId)
    : firstId;

  return { activeChannelLocalId, channels };
}

function normalizeChannel(channel: Partial<YoutubeManagedChannel>): YoutubeManagedChannel {
  return {
    localId: channel.localId || channel.youtubeChannelId || createId("channel"),
    youtubeChannelId: channel.youtubeChannelId,
    title: channel.title || "YouTube channel",
    channelUrl: channel.channelUrl || "",
    description: channel.description,
    customUrl: channel.customUrl,
    thumbnailUrl: channel.thumbnailUrl,
    subscriberCount: channel.subscriberCount,
    videoCount: channel.videoCount,
    viewCount: channel.viewCount,
    uploadsPlaylistId: channel.uploadsPlaylistId,
    refreshToken: channel.refreshToken,
    connectedAtMs: channel.connectedAtMs,
    lastSyncedAtMs: channel.lastSyncedAtMs,
    plan: { ...createDefaultYoutubeChannelPlan(), ...channel.plan },
  };
}

function resolveChannelUrl(profile?: Partial<YoutubeChannelProfile>) {
  if (!profile) return "https://www.youtube.com/channel/UCpKqiKf3QmCHGQNBlg8ngKA/";
  if (profile.customUrl) return `https://www.youtube.com/${profile.customUrl}`;
  if (profile.id) return `https://www.youtube.com/channel/${profile.id}`;
  return "";
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
