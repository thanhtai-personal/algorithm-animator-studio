import { CheckCircle2, Link2, Plus, Trash2, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { Lang } from "@/lib/i18n";
import type { YoutubePlaylist } from "@/lib/youtubeApi";
import type { YoutubeManagedChannel } from "../types";

type Props = {
  activeChannel: YoutubeManagedChannel | null;
  channels: YoutubeManagedChannel[];
  addManualChannel: () => void;
  removeChannel: (localId: string) => void;
  selectChannel: (localId: string) => void;
  playlists?: YoutubePlaylist[];
  lang: Lang;
  showSidebar?: boolean;
};

export function YoutubeChannelSwitcherCard({ activeChannel, addManualChannel, channels, removeChannel, selectChannel, playlists = [], lang, showSidebar = true }: Props) {
  const vi = lang === "vi";

  if (!showSidebar) {
    return activeChannel ? (
      <ChannelDetails channel={activeChannel} playlists={playlists} lang={lang} />
    ) : (
      <Card className="flex min-h-[360px] items-center justify-center border-dashed p-6 text-center text-sm text-muted-foreground">
        {txt(vi, "Chọn hoặc thêm một kênh để bắt đầu quản lý.", "Select or add a channel to start managing.")}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{txt(vi, "Kênh YouTube", "YouTube Channels")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{txt(vi, "Chọn kênh để quản lý kế hoạch, upload và lịch sử.", "Select a channel to manage plans, uploads, and history.")}</p>
            </div>
            <Badge variant="secondary">{channels.length}</Badge>
          </div>
        </div>

        <div className="space-y-3 p-3">
          <Button size="sm" variant="outline" className="w-full" onClick={addManualChannel}>
            <Plus className="mr-2 h-4 w-4" />{txt(vi, "Thêm kênh", "Add channel")}
          </Button>

          {channels.length ? (
            <div className="space-y-2">
              {channels.map((channel) => (
                <ChannelItem
                  key={channel.localId}
                  active={channel.localId === activeChannel?.localId}
                  channel={channel}
                  onRemove={() => removeChannel(channel.localId)}
                  onSelect={() => selectChannel(channel.localId)}
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              {txt(vi, "Chưa có kênh YouTube. Hãy thêm kênh hoặc kết nối tài khoản.", "No YouTube channels yet. Add a channel or connect an account.")}
            </div>
          )}
        </div>
      </Card>

      {activeChannel ? (
        <ChannelDetails channel={activeChannel} playlists={playlists} lang={lang} />
      ) : (
        <Card className="flex min-h-[360px] items-center justify-center border-dashed p-6 text-center text-sm text-muted-foreground">
          {txt(vi, "Chọn hoặc thêm một kênh để bắt đầu quản lý.", "Select or add a channel to start managing.")}
        </Card>
      )}
    </div>
  );
}

function ChannelItem({ active, channel, lang, onRemove, onSelect }: { active: boolean; channel: YoutubeManagedChannel; lang: Lang; onRemove: () => void; onSelect: () => void }) {
  const vi = lang === "vi";
  return (
    <div
      className={`group cursor-pointer rounded-xl border p-3 text-left transition hover:border-red-400/60 ${active ? "border-red-400/70 bg-red-500/10" : "border-border bg-card"}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start gap-3">
        {channel.thumbnailUrl ? (
          <img src={channel.thumbnailUrl} alt="YouTube channel avatar" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300"><Youtube className="h-5 w-5" /></div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{channel.title}</p>
            {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{channel.channelUrl || txt(vi, "Chưa có URL kênh", "No channel URL")}</p>
          <Badge className="mt-2" variant={channel.refreshToken ? "default" : "secondary"}>{channel.refreshToken ? txt(vi, "Đã cấp quyền", "Authorized") : txt(vi, "Kế hoạch nháp", "Draft plan")}</Badge>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-destructive/15 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={txt(vi, "Xóa kênh", "Delete channel")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ChannelDetails({ channel, playlists, lang }: { channel: YoutubeManagedChannel; playlists: YoutubePlaylist[]; lang: Lang }) {
  const vi = lang === "vi";
  return (
    <Card className="space-y-5 p-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          {channel.thumbnailUrl ? (
            <img src={channel.thumbnailUrl} alt="YouTube channel avatar" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-300"><Youtube className="h-6 w-6" /></div>
          )}
          <div>
            <h2 className="text-xl font-bold">{channel.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{txt(vi, "Hồ sơ kênh dùng để điều phối upload, lịch sử và kế hoạch nội dung.", "Channel profile used to coordinate uploads, history, and content plans.")}</p>
            {channel.channelUrl ? (
              <a className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={channel.channelUrl} target="_blank" rel="noreferrer">
                <Link2 className="h-3.5 w-3.5" />{txt(vi, "Mở kênh", "Open channel")}
              </a>
            ) : null}
          </div>
        </div>
        <Badge variant={channel.refreshToken ? "default" : "secondary"}>{channel.refreshToken ? txt(vi, "Đã cấp quyền", "Authorized") : txt(vi, "Kênh nháp", "Draft channel")}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatBox label={txt(vi, "Người đăng ký", "Subscribers")} value={channel.subscriberCount || "—"} />
        <StatBox label={txt(vi, "Video", "Videos")} value={channel.videoCount || "—"} />
        <StatBox label="Views" value={channel.viewCount || "—"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{txt(vi, "Tên kênh YouTube thực tế", "Actual YouTube channel name")}</Label>
          <ReadOnlyValue value={channel.title} />
        </div>
        <div className="space-y-2">
          <Label>{txt(vi, "URL kênh YouTube thực tế", "Actual YouTube channel URL")}</Label>
          <ReadOnlyValue value={channel.channelUrl} />
        </div>
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
        ) : (
          <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có playlist hoặc chưa cấp quyền YouTube.", "No playlists yet or YouTube has not been authorized.")}</p>
        )}
      </div>
    </Card>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div className="min-h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
      <p className="break-all">{value || "—"}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
