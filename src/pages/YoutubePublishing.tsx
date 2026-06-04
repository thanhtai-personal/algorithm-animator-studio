import { useState } from "react";
import { Navigate } from "react-router-dom";
import { YoutubeChannelPlanCard } from "@/features/youtube-channel/components/YoutubeChannelPlanCard";
import { YoutubeChannelSwitcherCard } from "@/features/youtube-channel/components/YoutubeChannelSwitcherCard";
import { YoutubeConnectionCard } from "@/features/youtube-channel/components/YoutubeConnectionCard";
import { YoutubeOverviewCard } from "@/features/youtube-channel/components/YoutubeOverviewCard";
import { YoutubeUploadCard } from "@/features/youtube-channel/components/YoutubeUploadCard";
import { YoutubeUploadHistoryCard } from "@/features/youtube-channel/components/YoutubeUploadHistoryCard";
import { useYoutubeChannelManager } from "@/features/youtube-channel/useYoutubeChannelManager";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type YoutubeTab = "channels" | "overview" | "plan" | "upload" | "history" | "connection";

export default function YoutubePublishing() {
  const manager = useYoutubeChannelManager();
  const [activeTab, setActiveTab] = useState<YoutubeTab>("channels");

  if (manager.authStatus === "loading") return <ScreenMessage text="Đang kiểm tra phiên đăng nhập..." />;
  if (manager.authStatus === "denied") return <Navigate replace to="/auth" state={{ from: "/youtube" }} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl space-y-4 p-4">
        <YoutubeManagerHeader
          activeChannelTitle={manager.activeChannel?.title}
          channelCount={manager.channels.length}
          connected={Boolean(manager.refreshToken)}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as YoutubeTab)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1 md:grid-cols-3 xl:grid-cols-6">
            <TabsTrigger value="channels">Kênh</TabsTrigger>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="plan">Kế hoạch</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="history">Lịch sử</TabsTrigger>
            <TabsTrigger value="connection">Kết nối</TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "channels" ? (
          <YoutubeChannelSwitcherCard
            activeChannel={manager.activeChannel}
            addManualChannel={manager.addManualChannel}
            channels={manager.channels}
            removeChannel={manager.removeChannel}
            selectChannel={manager.selectChannel}
            updateActiveChannel={manager.updateActiveChannel}
          />
        ) : null}

        {activeTab === "overview" ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <YoutubeOverviewCard channel={manager.channel} channelUrl={manager.plan?.channelUrl || manager.activeChannel?.channelUrl || ""} playlists={manager.playlists} />
            <YoutubeConnectionCard
              channel={manager.channel}
              config={manager.config}
              connectYoutube={manager.connectYoutube}
              disconnect={manager.disconnect}
              loading={manager.loading}
              oauthRedirectUri={manager.oauthRedirectUri}
              refreshChannelData={manager.refreshChannelData}
              refreshToken={manager.refreshToken}
            />
          </div>
        ) : null}

        {activeTab === "plan" ? (
          manager.plan ? <YoutubeChannelPlanCard plan={manager.plan} setPlan={manager.setPlan} /> : <EmptyChannelState />
        ) : null}

        {activeTab === "upload" ? (
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
          />
        ) : null}

        {activeTab === "history" ? (
          <YoutubeUploadHistoryCard
            history={manager.activeHistory}
            refreshHistory={manager.refreshHistory}
            title="Lịch sử upload của kênh đang chọn"
            subtitle="Chỉ hiển thị lịch sử khớp với YouTube channel ID hiện tại; bản ghi cũ chưa có channel ID vẫn được giữ lại."
          />
        ) : null}

        {activeTab === "connection" ? (
          <YoutubeConnectionCard
            channel={manager.channel}
            config={manager.config}
            connectYoutube={manager.connectYoutube}
            disconnect={manager.disconnect}
            loading={manager.loading}
            oauthRedirectUri={manager.oauthRedirectUri}
            refreshChannelData={manager.refreshChannelData}
            refreshToken={manager.refreshToken}
          />
        ) : null}
      </main>
    </div>
  );
}

function YoutubeManagerHeader({ activeChannelTitle, channelCount, connected }: { activeChannelTitle?: string; channelCount: number; connected: boolean }) {
  return (
    <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-bold">YouTube Manager</h1>
        <p className="text-sm text-muted-foreground">Quản lý đa kênh theo workspace: chọn kênh, lập kế hoạch, upload và xem lịch sử trên từng tab riêng.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{channelCount} kênh</Badge>
        <Badge variant={connected ? "default" : "outline"}>{connected ? "Kênh đang chọn đã cấp quyền" : "Chưa cấp quyền kênh đang chọn"}</Badge>
        {activeChannelTitle ? <Badge variant="outline">{activeChannelTitle}</Badge> : null}
      </div>
    </Card>
  );
}

function EmptyChannelState() {
  return (
    <Card className="border-dashed p-6 text-center">
      <p className="font-medium">Chưa chọn kênh để lập kế hoạch.</p>
      <p className="mt-1 text-sm text-muted-foreground">Thêm kênh nháp hoặc login YouTube để tạo workspace quản lý kênh.</p>
    </Card>
  );
}

function ScreenMessage({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      {text}
    </main>
  );
}
