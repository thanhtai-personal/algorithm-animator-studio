import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { YoutubeUploadHistoryCard } from "@/features/youtube-channel/components/YoutubeUploadHistoryCard";
import type { AgentVideoPublishChannel } from "@/lib/aiVideoAgentApi";
import { text, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  channels: AgentVideoPublishChannel[];
  lang: Lang;
};

export function AgentSelectedChannelVideos({ channels, lang }: Props) {
  const vi = lang === "vi";
  const youtubeChannels = useMemo(() => channels.filter((channel) => channel.platform === "youtube" && channel.youtubeRefreshToken), [channels]);
  const [activeId, setActiveId] = useState("");
  const activeChannel = youtubeChannels.find((channel) => channel.id === activeId || channel.providerAccountId === activeId) || youtubeChannels[0];

  useEffect(() => {
    if (!youtubeChannels.length) {
      setActiveId("");
      return;
    }
    if (!activeChannel) setActiveId(youtubeChannels[0].id);
  }, [activeChannel, youtubeChannels]);

  if (!channels.length) {
    return (
      <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
        {text(lang, "Select publish channels to preview their videos here.", "Chọn kênh sẽ đăng để xem video của kênh tại đây.")}
      </Card>
    );
  }

  if (!youtubeChannels.length) {
    return (
      <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
        {text(lang, "Channel video preview currently supports selected YouTube channels only.", "Phần xem video hiện chỉ hỗ trợ các kênh YouTube đã chọn.")}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">{text(lang, "Selected channel videos", "Video của kênh sẽ đăng")}</h2>
            <p className="text-xs text-muted-foreground">
              {text(lang, "Left: selected publish channels. Right: videos from the active channel.", "Bên trái là kênh sẽ đăng đã chọn. Bên phải là danh sách video của kênh đang chọn.")}
            </p>
          </div>
          <Badge variant="secondary">{youtubeChannels.length} {text(lang, "YouTube channels", "kênh YouTube")}</Badge>
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b bg-muted/20 p-3 lg:border-b-0 lg:border-r">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {text(lang, "Selected channels", "Kênh đã chọn")}
          </p>
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {youtubeChannels.map((channel) => {
              const key = channel.id || channel.providerAccountId || channel.title;
              const active = activeChannel && (activeChannel.id === channel.id || activeChannel.providerAccountId === channel.providerAccountId);
              return (
                <button
                  key={key}
                  type="button"
                  className={cn("w-full rounded-lg border bg-background p-3 text-left transition hover:bg-muted", active && "border-primary bg-primary/5 ring-1 ring-primary/20")}
                  onClick={() => setActiveId(channel.id || channel.providerAccountId || "")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{channel.title}</p>
                      <p className="truncate text-xs text-muted-foreground">YouTube · {channel.id}</p>
                    </div>
                    {active ? <Badge className="shrink-0">{text(lang, "Active", "Đang xem")}</Badge> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
        <section className="min-w-0 p-3">
          {activeChannel ? (
            <YoutubeUploadHistoryCard
              history={[]}
              lang={lang}
              pageSize={6}
              refreshHistory={async () => undefined}
              refreshToken={activeChannel.youtubeRefreshToken}
              showUploadHistory={false}
              subtitle={text(lang, "Videos loaded from the selected YouTube channel.", "Video được tải từ kênh YouTube đang chọn.")}
              title={vi ? `Video của ${activeChannel.title}` : `${activeChannel.title} videos`}
              uploadsPlaylistId={activeChannel.youtubePlaylistId}
            />
          ) : null}
        </section>
      </div>
    </Card>
  );
}
