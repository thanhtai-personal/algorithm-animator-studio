import type { AgentVideoPublishChannel, AgentVideoPublishTarget } from "@/lib/aiVideoAgentApi";
import { readSocialChannelWorkspace } from "@/features/social-channel/socialChannelStorage";
import { readYoutubeChannelWorkspace } from "@/features/youtube-channel/channelPlanStorage";

export type AgentPublishChannelOption = AgentVideoPublishChannel & {
  key: string;
  subtitle: string;
  disabled?: boolean;
  disabledReason?: string;
};

export function getAgentPublishChannelOptions(): AgentPublishChannelOption[] {
  if (typeof window === "undefined") return [];
  return [...getYoutubeOptions(), ...getSocialOptions()];
}

export function getPreferredChannelKeys(options: AgentPublishChannelOption[], targets: AgentVideoPublishTarget[]) {
  const allowed = targets.length ? targets : ["youtube"];
  return options
    .filter((option) => !option.disabled && allowed.includes(option.platform))
    .slice(0, 1)
    .map((option) => option.key);
}

export function channelsFromKeys(options: AgentPublishChannelOption[], keys: string[]) {
  const keySet = new Set(keys);
  return options
    .filter((option) => keySet.has(option.key) && !option.disabled)
    .map(({ key: _key, subtitle: _subtitle, disabled: _disabled, disabledReason: _disabledReason, ...channel }) => channel);
}

function getYoutubeOptions(): AgentPublishChannelOption[] {
  try {
    const workspace = readYoutubeChannelWorkspace();
    return workspace.channels.map((channel) => {
      const remoteId = channel.youtubeChannelId || channel.localId;
      const connected = Boolean(channel.refreshToken && channel.youtubeChannelId);
      return {
        key: `youtube:${channel.localId}`,
        id: remoteId,
        platform: "youtube",
        title: channel.title || "YouTube channel",
        providerAccountId: channel.localId,
        youtubeRefreshToken: channel.refreshToken || "",
        youtubePlaylistId: channel.uploadsPlaylistId || "",
        subtitle: connected ? `YouTube · ${remoteId}` : "YouTube · chưa cấp refresh token",
        disabled: !connected,
        disabledReason: "Kênh YouTube này chưa kết nối OAuth hoặc thiếu refresh token.",
      } satisfies AgentPublishChannelOption;
    });
  } catch {
    return [];
  }
}

function getSocialOptions(): AgentPublishChannelOption[] {
  try {
    const workspace = readSocialChannelWorkspace();
    return workspace.channels.map((channel) => {
      const connected = channel.status === "connected" && Boolean(channel.providerAccountId || channel.remoteId);
      return {
        key: `${channel.platform}:${channel.id}`,
        id: channel.remoteId || channel.id,
        platform: channel.platform,
        title: channel.name || channel.handle || `${channel.platform} channel`,
        providerAccountId: channel.providerAccountId || channel.id,
        subtitle: `${channel.platform} · ${channel.handle || channel.url || channel.remoteId || channel.id}`,
        disabled: !connected,
        disabledReason: "Kênh này chưa kết nối provider OAuth nên chỉ có thể đăng thủ công.",
      } satisfies AgentPublishChannelOption;
    });
  } catch {
    return [];
  }
}
