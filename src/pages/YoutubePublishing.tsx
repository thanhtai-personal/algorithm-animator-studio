import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { SharedChannelSidebar, channelKey, type ChannelProvider, type ProviderConnectionState, type SharedChannelItem } from "@/features/channel-manager/SharedChannelSidebar";
import { YoutubeChannelPlanCard } from "@/features/youtube-channel/components/YoutubeChannelPlanCard";
import { YoutubeChannelSwitcherCard } from "@/features/youtube-channel/components/YoutubeChannelSwitcherCard";
import { YoutubeOverviewCard } from "@/features/youtube-channel/components/YoutubeOverviewCard";
import { YoutubeUploadCard } from "@/features/youtube-channel/components/YoutubeUploadCard";
import { YoutubeUploadHistoryCard } from "@/features/youtube-channel/components/YoutubeUploadHistoryCard";
import { useYoutubeChannelManager } from "@/features/youtube-channel/useYoutubeChannelManager";
import type { YoutubeManagedChannel } from "@/features/youtube-channel/types";
import type { YoutubeConfigStatus } from "@/lib/youtubeApi";
import { SocialChannelManagerCard } from "@/features/social-channel/components/SocialChannelManagerCard";
import { useSocialChannelWorkspace } from "@/features/social-channel/hooks/useSocialChannelWorkspace";
import type { SocialChannel, SocialPlatform } from "@/features/social-channel/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

type ChannelTab = "channels" | "overview" | "plan" | "upload" | "history";

export default function YoutubePublishing() {
  const manager = useYoutubeChannelManager();
  const socialManager = useSocialChannelWorkspace();
  const [activeTab, setActiveTab] = useState<ChannelTab>("channels");
  const [activeKey, setActiveKey] = useState("");
  const [channelMenuCollapsed, setChannelMenuCollapsed] = useState(false);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const vi = lang === "vi";
  const sharedChannels = useMemo(
    () => buildSharedChannels(manager.channels, socialManager.channels),
    [manager.channels, socialManager.channels]
  );
  const providerStates = useMemo(
    () => buildProviderStates(manager.config, vi),
    [manager.config, vi]
  );
  const activeSharedChannel = sharedChannels.find((channel) => channelKey(channel) === activeKey) || sharedChannels[0] || null;
  const activeIsYoutube = activeSharedChannel?.provider === "youtube";
  const channelGridStyle = {
    "--channel-panel-width": channelMenuCollapsed ? "88px" : "340px",
  } as CSSProperties;

  useEffect(() => subscribeSystemLang(setLang), []);
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

    toast.error(
      txt(
        vi,
        `Chưa có OAuth ${providerLabel(provider)}. Kênh chỉ được thêm sau khi connect thành công.`,
        `${providerLabel(provider)} OAuth is not implemented yet. A channel is added only after a successful connection.`
      )
    );
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChannelTab)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1 md:grid-cols-3 xl:grid-cols-5">
            <TabsTrigger value="channels">{txt(vi, "Kênh", "Channels")}</TabsTrigger>
            <TabsTrigger value="overview">{txt(vi, "Tổng quan", "Overview")}</TabsTrigger>
            <TabsTrigger value="plan">{txt(vi, "Kế hoạch", "Plan")}</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="history">{txt(vi, "Lịch sử", "History")}</TabsTrigger>
          </TabsList>
        </Tabs>

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
            onRemove={removeSharedChannel}
            onSelect={selectSharedChannel}
          />

          <div className="min-w-0">
            {activeTab === "channels" ? (
              activeSharedChannel ? (
                activeIsYoutube ? (
                  <YoutubeChannelSwitcherCard
                    activeChannel={manager.activeChannel}
                    addManualChannel={manager.addManualChannel}
                    channels={manager.channels}
                    removeChannel={manager.removeChannel}
                    selectChannel={manager.selectChannel}
                    updateActiveChannel={manager.updateActiveChannel}
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

            {activeTab === "overview" ? (
              activeIsYoutube ? (
                <YoutubeOverviewCard channel={manager.channel} channelUrl={manager.plan?.channelUrl || manager.activeChannel?.channelUrl || ""} playlists={manager.playlists} lang={lang} />
              ) : <ProviderNotice channel={activeSharedChannel} lang={lang} />
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
                  useLatestExport={manager.useLatestExport}
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
                  title={txt(vi, "Lịch sử upload của kênh đang chọn", "Upload history for the selected channel")}
                  subtitle={txt(vi, "Chỉ hiển thị lịch sử khớp với YouTube channel ID hiện tại; bản ghi cũ chưa có thông tin kênh vẫn được giữ lại.", "Only entries matching the current YouTube channel ID are filtered; older entries without channel data are still kept.")}
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

function buildProviderStates(config: YoutubeConfigStatus | null, vi: boolean): Record<ChannelProvider, ProviderConnectionState> {
  const youtubeReady = Boolean(config?.hasClientId && config?.hasClientSecret);
  const socialReason = txt(
    vi,
    "Provider này chưa được cấu hình OAuth/backend nên chưa thể kết nối.",
    "This provider has no OAuth/backend configuration yet, so it cannot connect."
  );

  return {
    youtube: {
      configured: youtubeReady,
      disabledReason: youtubeReady
        ? undefined
        : txt(vi, "YouTube chưa có Client ID/Client Secret.", "YouTube Client ID/Client Secret is not configured."),
    },
    facebook: { configured: false, disabledReason: socialReason },
    tiktok: { configured: false, disabledReason: socialReason },
    instagram: { configured: false, disabledReason: socialReason },
  };
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
