import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { SharedChannelSidebar, channelKey, type ChannelProvider, type SharedChannelItem } from "@/features/channel-manager/SharedChannelSidebar";
import { buildProviderStates } from "@/features/channel-manager/channelProviderState";
import { useSharedChannelOrder } from "@/features/channel-manager/useSharedChannelOrder";
import { YoutubeChannelPlanCard } from "@/features/youtube-channel/components/YoutubeChannelPlanCard";
import { YoutubeChannelSwitcherCard } from "@/features/youtube-channel/components/YoutubeChannelSwitcherCard";
import { YoutubeUploadCard } from "@/features/youtube-channel/components/YoutubeUploadCard";
import { YoutubeUploadHistoryCard } from "@/features/youtube-channel/components/YoutubeUploadHistoryCard";
import { useYoutubeChannelManager } from "@/features/youtube-channel/useYoutubeChannelManager";
import type { YoutubeManagedChannel } from "@/features/youtube-channel/types";
import { exchangeSocialProviderCode, getSocialProviderAuthUrl, getSocialProviderConfig, type SocialProviderConfigStatus } from "@/lib/channelProviderApi";
import { isOAuthPopupWindow, notifyOAuthOpener, openOAuthPopup } from "@/lib/oauthPopup";
import { createPkcePair, savePkceVerifier, takePkceVerifier } from "@/lib/oauthPkce";
import { SocialChannelManagerCard } from "@/features/social-channel/components/SocialChannelManagerCard";
import { useSocialChannelWorkspace } from "@/features/social-channel/hooks/useSocialChannelWorkspace";
import type { SocialChannel, SocialPlatform } from "@/features/social-channel/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

type ChannelTab = "channels" | "plan" | "upload" | "history";

export default function YoutubePublishing() {
  const manager = useYoutubeChannelManager();
  const socialManager = useSocialChannelWorkspace();
  const [activeTab, setActiveTab] = useState<ChannelTab>("channels");
  const [activeKey, setActiveKey] = useState("");
  const [channelMenuCollapsed, setChannelMenuCollapsed] = useState(false);
  const [socialProviderConfig, setSocialProviderConfig] = useState<SocialProviderConfigStatus | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const processedSocialCallbackRef = useRef(false);
  const vi = lang === "vi";
  const rawSharedChannels = useMemo(
    () => buildSharedChannels(manager.channels, socialManager.channels),
    [manager.channels, socialManager.channels]
  );
  const sharedOrder = useSharedChannelOrder(rawSharedChannels);
  const sharedChannels = sharedOrder.channels;
  const providerStates = useMemo(
    () => buildProviderStates(manager.config, socialProviderConfig, vi),
    [manager.config, socialProviderConfig, vi]
  );
  const activeSharedChannel = sharedChannels.find((channel) => channelKey(channel) === activeKey) || sharedChannels[0] || null;
  const activeIsYoutube = activeSharedChannel?.provider === "youtube";
  const channelGridStyle = {
    "--channel-panel-width": channelMenuCollapsed ? "88px" : "340px",
  } as CSSProperties;

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => {
    let cancelled = false;
    getSocialProviderConfig()
      .then((config) => {
        if (!cancelled) setSocialProviderConfig(config);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : txt(vi, "Không đọc được cấu hình provider.", "Could not read provider config."));
      });
    return () => {
      cancelled = true;
    };
  }, [vi]);
  useEffect(() => {
    if (processedSocialCallbackRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const provider = parseSocialOAuthState(params.get("state"));
    if (!code || !provider) return;

    processedSocialCallbackRef.current = true;
    const redirectUri = resolveProviderRedirectUri(socialProviderConfig?.providers[provider]?.redirectUri);
    const codeVerifier = takePkceVerifier(params.get("state") || "");

    exchangeSocialProviderCode(provider, code, redirectUri, codeVerifier)
      .then(({ channel, channels }) => {
        const connectedChannels = channels?.length ? channels : channel ? [channel] : [];
        socialManager.upsertConnectedChannels(connectedChannels);
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isOAuthPopupWindow()) {
          notifyOAuthOpener({ provider, status: "success", channelTitle: channelTitle(connectedChannels, provider), channel: connectedChannels[0], channels: connectedChannels });
          window.setTimeout(() => window.close(), 250);
          return;
        }
        toast.success(txt(vi, `Đã kết nối ${providerLabel(provider)}.`, `${providerLabel(provider)} connected.`));
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : txt(vi, "Kết nối provider thất bại.", "Provider connection failed.");
        if (isOAuthPopupWindow()) notifyOAuthOpener({ provider, status: "error", message });
        toast.error(message);
      });
  }, [socialManager, socialProviderConfig, vi]);
  useEffect(() => {
    if (!sharedChannels.length) {
      setActiveKey("");
      return;
    }
    if (!activeSharedChannel) setActiveKey(channelKey(sharedChannels[0]));
  }, [activeSharedChannel, sharedChannels]);

  if (manager.authStatus === "loading") return <ScreenMessage text={txt(vi, "Đang kiểm tra phiên đăng nhập...", "Checking signed-in session...")} />;
  if (manager.authStatus === "denied") return <Navigate replace to="/auth" state={{ from: "/channel" }} />;

  function selectSharedChannel(channel: SharedChannelItem) {
    setActiveKey(channelKey(channel));
    if (channel.provider === "youtube") manager.selectChannel(channel.id);
    else socialManager.selectChannel(channel.id);
  }

  function addProviderChannel(provider: ChannelProvider) {
    const state = providerStates[provider];
    if (!state?.configured) {
      toast.info(state?.disabledReason || txt(vi, "Provider này chưa được cấu hình.", "This provider is not configured yet."));
      return;
    }

    if (provider === "youtube") {
      void manager.connectYoutube();
      return;
    }

    void connectSocialProvider(provider);
  }

  async function connectSocialProvider(provider: SocialPlatform) {
    try {
      const redirectUri = resolveProviderRedirectUri(socialProviderConfig?.providers[provider]?.redirectUri);
      const state = createSocialOAuthState(provider);
      const pkce = await createPkcePair();
      savePkceVerifier(state, pkce.codeVerifier);
      const authUrl = await getSocialProviderAuthUrl(provider, redirectUri, state, pkce.codeChallenge);
      const result = await openOAuthPopup(authUrl, provider);

      if (result.status === "success") {
        const connectedChannels = result.channels?.length ? result.channels : result.channel ? [result.channel] : [];
        socialManager.upsertConnectedChannels(connectedChannels);
        toast.success(result.channelTitle ? `Đã kết nối ${result.channelTitle}.` : `Đã kết nối ${providerLabel(provider)}.`);
        return;
      }
      if (result.status === "blocked") {
        toast.error("Trình duyệt đã chặn popup OAuth. Hãy cho phép popup rồi thử lại.");
        return;
      }
      if (result.status === "closed") {
        toast.info(`Đã hủy kết nối ${providerLabel(provider)}. Chưa có kênh mới nào được tạo.`);
        return;
      }
      toast.error(result.message || `Kết nối ${providerLabel(provider)} thất bại.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Không tạo được link OAuth ${providerLabel(provider)}.`);
    }
  }

  function removeSharedChannel(channel: SharedChannelItem) {
    if (channel.provider === "youtube") manager.removeChannel(channel.id);
    else socialManager.removeChannel(channel.id);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="w-full space-y-4 px-3 py-4 sm:px-4 lg:px-6 2xl:px-8">
        <YoutubeManagerHeader
          activeChannelTitle={activeSharedChannel?.title}
          channelCount={sharedChannels.length}
          connected={Boolean(activeSharedChannel?.connected)}
          lang={lang}
        />

        <div
          className="grid gap-4 transition-[grid-template-columns] duration-300 ease-in-out xl:grid-cols-[var(--channel-panel-width)_minmax(0,1fr)]"
          style={channelGridStyle}
        >
          <SharedChannelSidebar
            activeKey={activeSharedChannel ? channelKey(activeSharedChannel) : ""}
            channels={sharedChannels}
            collapsed={channelMenuCollapsed}
            lang={lang}
            providerStates={providerStates}
            onAddProvider={addProviderChannel}
            onCollapsedChange={setChannelMenuCollapsed}
            onReorderCancel={sharedOrder.cancelReorder}
            onReorderCommit={sharedOrder.commitReorder}
            onReorderPreview={sharedOrder.previewReorder}
            onReorderStart={sharedOrder.startReorder}
            onRemove={removeSharedChannel}
            onSelect={selectSharedChannel}
          />

          <div className="min-w-0 space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChannelTab)}>
              <TabsList className="grid h-9 w-full grid-cols-4 gap-1 bg-muted/40 p-1">
                <TabsTrigger value="channels" className="h-7 px-2 text-xs sm:text-sm">{txt(vi, "Chung", "General")}</TabsTrigger>
                <TabsTrigger value="plan" className="h-7 px-2 text-xs sm:text-sm">{txt(vi, "Kế hoạch", "Plan")}</TabsTrigger>
                <TabsTrigger value="upload" className="h-7 px-2 text-xs sm:text-sm">{txt(vi, "Chọn video", "Select Video")}</TabsTrigger>
                <TabsTrigger value="history" className="h-7 px-2 text-xs sm:text-sm">{txt(vi, "Video", "Videos")}</TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "channels" ? (
              activeSharedChannel ? (
                activeIsYoutube ? (
                  <YoutubeChannelSwitcherCard
                    activeChannel={manager.activeChannel}
                    addManualChannel={manager.addManualChannel}
                    channels={manager.channels}
                    removeChannel={manager.removeChannel}
                    selectChannel={manager.selectChannel}
                    playlists={manager.playlists}
                    lang={lang}
                    showSidebar={false}
                  />
                ) : (
                  <SocialChannelManagerCard lang={lang} manager={socialManager} showSidebar={false} />
                )
              ) : (
                <EmptyChannelState lang={lang} />
              )
            ) : null}

            {activeTab === "plan" ? (
              activeIsYoutube && manager.plan ? <YoutubeChannelPlanCard plan={manager.plan} setPlan={manager.setPlan} lang={lang} /> : <ProviderNotice channel={activeSharedChannel} lang={lang} />
            ) : null}

            {activeTab === "upload" ? (
              activeIsYoutube ? (
                <YoutubeUploadCard
                  canUpload={manager.canUpload}
                  displayedDescription={manager.displayedDescription}
                  form={manager.form}
                  lastExported={manager.lastExported}
                  loading={manager.loading}
                  playlists={manager.playlists}
                  result={manager.result}
                  selectedFile={manager.selectedFile}
                  selectedMusicLicense={manager.selectedMusicLicense}
                  setForm={manager.setForm}
                  setVideoFile={manager.setVideoFile}
                  upload={manager.upload}
                  videoFile={manager.videoFile}
                  lang={lang}
                />
              ) : <ProviderNotice channel={activeSharedChannel} lang={lang} />
            ) : null}

            {activeTab === "history" ? (
              activeIsYoutube ? (
                <YoutubeUploadHistoryCard
                  history={manager.activeHistory}
                  refreshHistory={manager.refreshHistory}
                  refreshToken={manager.refreshToken}
                  title={txt(vi, "Video của kênh đang chọn", "Videos for the selected channel")}
                  subtitle={txt(vi, "Chỉ hiển thị lịch sử khớp với YouTube channel ID hiện tại; bản ghi cũ chưa có thông tin kênh vẫn được giữ lại.", "Only entries matching the current YouTube channel ID are filtered; older entries without channel data are still kept.")}
                  uploadsPlaylistId={manager.channel?.uploadsPlaylistId}
                  lang={lang}
                />
              ) : <ProviderNotice channel={activeSharedChannel} lang={lang} />
            ) : null}

          </div>
        </div>
      </main>
    </div>
  );
}

function YoutubeManagerHeader({ activeChannelTitle, channelCount, connected, lang }: { activeChannelTitle?: string; channelCount: number; connected: boolean; lang: Lang }) {
  const vi = lang === "vi";
  return (
    <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-bold">Channel Manager</h1>
        <p className="text-sm text-muted-foreground">{txt(vi, "Quản lý YouTube, Facebook, TikTok và Instagram theo từng kênh riêng.", "Manage YouTube, Facebook, TikTok, and Instagram as separate channels.")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{channelCount} {txt(vi, "kênh", "channels")}</Badge>
        <Badge variant={connected ? "default" : "outline"}>{connected ? txt(vi, "Kênh đang chọn đã cấp quyền", "Selected channel authorized") : txt(vi, "Chưa cấp quyền kênh đang chọn", "Selected channel not authorized")}</Badge>
        {activeChannelTitle ? <Badge variant="outline">{activeChannelTitle}</Badge> : null}
      </div>
    </Card>
  );
}

function EmptyChannelState({ lang }: { lang: Lang }) {
  const vi = lang === "vi";
  return (
    <Card className="flex min-h-[360px] items-center justify-center border-dashed p-6 text-center text-sm text-muted-foreground">
      {txt(vi, "Chưa có kênh đã cấp quyền. Hãy chọn provider đã cấu hình trong panel bên trái để kết nối.", "No authorized channels yet. Choose a configured provider in the left panel to connect.")}
    </Card>
  );
}

function ProviderNotice({ channel, lang }: { channel: SharedChannelItem | null; lang: Lang }) {
  const vi = lang === "vi";
  const provider = channel?.provider ? providerLabel(channel.provider) : txt(vi, "kênh", "channel");
  return (
    <Card className="border-dashed p-6 text-center">
      <p className="font-medium">
        {txt(vi, `Tab này hiện chỉ hỗ trợ YouTube.`, "This tab currently supports YouTube only.")}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {txt(vi, `Đang chọn ${provider}. Hãy dùng tab Kênh để chỉnh thông tin hoặc chọn một kênh YouTube ở menu bên trái.`, `Selected provider: ${provider}. Use the Channels tab to edit details or select a YouTube channel from the left menu.`)}
      </p>
    </Card>
  );
}

function buildSharedChannels(youtubeChannels: YoutubeManagedChannel[], socialChannels: SocialChannel[]): SharedChannelItem[] {
  return [
    ...youtubeChannels.filter((channel) => Boolean(channel.refreshToken)).map((channel) => ({
      id: channel.localId,
      provider: "youtube" as const,
      title: channel.title,
      subtitle: channel.channelUrl,
      thumbnailUrl: channel.thumbnailUrl,
      connected: true,
    })),
    ...socialChannels.filter((channel) => channel.status === "connected").map((channel) => ({
      id: channel.id,
      provider: channel.platform,
      title: channel.name,
      subtitle: channel.handle || channel.url,
      connected: true,
    })),
  ];
}

function providerLabel(provider: ChannelProvider | SocialPlatform) {
  if (provider === "youtube") return "YouTube";
  if (provider === "facebook") return "Facebook";
  if (provider === "instagram") return "Instagram";
  return "TikTok";
}

function createSocialOAuthState(provider: SocialPlatform) {
  return `kai-studio:${provider}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function parseSocialOAuthState(state: string | null): SocialPlatform | null {
  if (!state?.startsWith("kai-studio:")) return null;
  const provider = state.split(":")[1];
  if (provider === "facebook" || provider === "tiktok" || provider === "instagram") return provider;
  return null;
}

function resolveProviderRedirectUri(configuredRedirectUri?: string) {
  const fallback = `${window.location.origin}/channel`;
  const configured = configuredRedirectUri?.trim();
  return configured || fallback;
}

function channelTitle(channels: Array<{ name: string }>, provider: SocialPlatform) {
  if (channels.length === 1) return channels[0].name;
  if (channels.length > 1) return `${channels.length} ${providerLabel(provider)} channels`;
  return providerLabel(provider);
}

function ScreenMessage({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      {text}
    </main>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
