import { Navigate } from "react-router-dom";
import { YoutubeChannelPlanCard } from "@/features/youtube-channel/components/YoutubeChannelPlanCard";
import { YoutubeConnectionCard } from "@/features/youtube-channel/components/YoutubeConnectionCard";
import { YoutubeOverviewCard } from "@/features/youtube-channel/components/YoutubeOverviewCard";
import { YoutubeUploadCard } from "@/features/youtube-channel/components/YoutubeUploadCard";
import { YoutubeUploadHistoryCard } from "@/features/youtube-channel/components/YoutubeUploadHistoryCard";
import { useYoutubeChannelManager } from "@/features/youtube-channel/useYoutubeChannelManager";

export default function YoutubePublishing() {
  const manager = useYoutubeChannelManager();

  if (manager.authStatus === "loading") return <ScreenMessage text="Đang kiểm tra phiên đăng nhập..." />;
  if (manager.authStatus === "denied") return <Navigate replace to="/auth" state={{ from: "/youtube" }} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="grid gap-4 p-4 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <YoutubeConnectionCard
            channel={manager.channel}
            config={manager.config}
            connectYoutube={manager.connectYoutube}
            disconnect={manager.disconnect}
            loading={manager.loading}
            refreshChannelData={manager.refreshChannelData}
            refreshToken={manager.refreshToken}
          />
          <YoutubeOverviewCard channel={manager.channel} channelUrl={manager.plan.channelUrl} playlists={manager.playlists} />
        </div>

        <div className="space-y-4">
          <YoutubeChannelPlanCard plan={manager.plan} setPlan={manager.setPlan} />
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
          <YoutubeUploadHistoryCard history={manager.history} refreshHistory={manager.refreshHistory} />
        </div>
      </main>
    </div>
  );
}

function ScreenMessage({ text }: { text: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      {text}
    </main>
  );
}
