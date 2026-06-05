import type { SocialPlatform } from "@/features/social-channel/types";
import type { YoutubeConfigStatus } from "@/lib/youtubeApi";
import type { SocialProviderConfigStatus } from "@/lib/channelProviderApi";
import type { ChannelProvider, ProviderConnectionState } from "./SharedChannelSidebar";

export function buildProviderStates(
  config: YoutubeConfigStatus | null,
  socialConfig: SocialProviderConfigStatus | null,
  vi: boolean
): Record<ChannelProvider, ProviderConnectionState> {
  const youtubeReady = Boolean(config?.hasClientId && config?.hasClientSecret);
  const socialReason = text(
    vi,
    "Provider này chưa có đủ Client ID/Secret trong cấu hình.",
    "This provider does not have enough Client ID/Secret configuration."
  );
  const providerState = (provider: SocialPlatform) => ({
    configured: Boolean(socialConfig?.providers[provider]?.configured),
    disabledReason: socialConfig?.providers[provider]?.configured ? undefined : socialReason,
  });

  return {
    youtube: {
      configured: youtubeReady,
      disabledReason: youtubeReady
        ? undefined
        : text(vi, "YouTube chưa có Client ID/Client Secret.", "YouTube Client ID/Client Secret is not configured."),
    },
    facebook: providerState("facebook"),
    tiktok: providerState("tiktok"),
    instagram: providerState("instagram"),
  };
}

function text(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
