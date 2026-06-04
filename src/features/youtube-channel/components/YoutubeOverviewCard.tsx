import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import type { YoutubeChannelProfile, YoutubePlaylist } from "@/lib/youtubeApi";

type Props = {
  channel: YoutubeChannelProfile | null;
  playlists: YoutubePlaylist[];
  channelUrl: string;
  lang: Lang;
};

export function YoutubeOverviewCard({ channel, channelUrl, playlists, lang }: Props) {
  const url = channel?.customUrl ? `https://www.youtube.com/${channel.customUrl}` : channelUrl;
  const vi = lang === "vi";
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {channel?.thumbnailUrl ? <img src={channel.thumbnailUrl} alt="YouTube channel avatar" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-muted" />}
          <div>
            <h2 className="font-semibold">{txt(vi, "Tổng quan kênh", "Channel Overview")}</h2>
            <p className="text-sm text-muted-foreground">{channel?.title || txt(vi, "Chưa tải thông tin kênh", "Channel data not loaded")}</p>
          </div>
        </div>
        {url ? <a className="inline-flex items-center gap-2 text-sm text-red-400 underline" href={url} target="_blank" rel="noreferrer">{txt(vi, "Mở kênh", "Open channel")} <ExternalLink className="h-3.5 w-3.5" /></a> : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Stat label={txt(vi, "Người đăng ký", "Subscribers")} value={formatNumber(channel?.subscriberCount)} />
        <Stat label={txt(vi, "Video", "Videos")} value={formatNumber(channel?.videoCount)} />
        <Stat label="Views" value={formatNumber(channel?.viewCount)} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">{txt(vi, "Playlist đã tải", "Loaded playlists")}</h3>
          <Badge variant="secondary">{playlists.length}</Badge>
        </div>
        {playlists.length ? (
          <div className="flex flex-wrap gap-2">
            {playlists.slice(0, 12).map((playlist) => <Badge key={playlist.id} variant="outline">{playlist.title}</Badge>)}
          </div>
        ) : <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có playlist hoặc chưa cấp quyền YouTube.", "No playlists yet or YouTube has not been authorized.")}</p>}
      </div>
    </Card>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}

function formatNumber(value?: string) {
  if (!value) return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat("en").format(numeric) : value;
}
