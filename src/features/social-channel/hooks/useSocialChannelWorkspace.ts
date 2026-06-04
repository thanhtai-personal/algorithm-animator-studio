import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createSocialChannel, readSocialChannelWorkspace, writeSocialChannelWorkspace } from "../socialChannelStorage";
import type { SocialChannel, SocialChannelWorkspace, SocialPlatform } from "../types";

export function useSocialChannelWorkspace() {
  const [workspace, setWorkspaceState] = useState<SocialChannelWorkspace>(() => readSocialChannelWorkspace());

  const activePlatform = workspace.activePlatform;
  const platformChannels = useMemo(
    () => workspace.channels.filter((channel) => channel.platform === activePlatform),
    [activePlatform, workspace.channels]
  );
  const activeChannel = useMemo(
    () => workspace.channels.find((channel) => channel.id === workspace.activeChannelId) || platformChannels[0] || null,
    [platformChannels, workspace.activeChannelId, workspace.channels]
  );

  function setWorkspace(updater: (current: SocialChannelWorkspace) => SocialChannelWorkspace) {
    setWorkspaceState((current) => {
      const next = updater(current);
      writeSocialChannelWorkspace(next);
      return next;
    });
  }

  function selectPlatform(platform: SocialPlatform) {
    setWorkspace((current) => {
      const firstChannel = current.channels.find((channel) => channel.platform === platform);
      return { ...current, activePlatform: platform, activeChannelId: firstChannel?.id || "" };
    });
  }

  function selectChannel(channelId: string) {
    setWorkspace((current) => {
      const channel = current.channels.find((item) => item.id === channelId);
      if (!channel) return current;
      return { ...current, activePlatform: channel.platform, activeChannelId: channel.id };
    });
  }

  function addChannel(platform = activePlatform) {
    let createdId = "";
    setWorkspace((current) => {
      const count = current.channels.filter((channel) => channel.platform === platform).length + 1;
      const channel = createSocialChannel(platform, count);
      createdId = channel.id;
      return {
        activePlatform: platform,
        activeChannelId: channel.id,
        channels: [channel, ...current.channels],
      };
    });
    toast.success("Đã thêm kênh để quản lý.");
    return createdId;
  }

  function updateChannel(channelId: string, patch: Partial<SocialChannel>) {
    setWorkspace((current) => ({
      ...current,
      channels: current.channels.map((channel) =>
        channel.id === channelId ? { ...channel, ...patch, updatedAtMs: Date.now() } : channel
      ),
    }));
  }

  function removeChannel(channelId: string) {
    setWorkspace((current) => {
      const nextChannels = current.channels.filter((channel) => channel.id !== channelId);
      const nextActive = nextChannels.find((channel) => channel.platform === current.activePlatform) || nextChannels[0];
      return {
        activePlatform: nextActive?.platform || current.activePlatform,
        activeChannelId: nextActive?.id || "",
        channels: nextChannels,
      };
    });
    toast.info("Đã ngắt kết nối và xóa kênh khỏi workspace.");
  }

  return {
    activeChannel,
    activePlatform,
    channels: workspace.channels,
    platformChannels,
    addChannel,
    removeChannel,
    selectChannel,
    selectPlatform,
    updateChannel,
  };
}
