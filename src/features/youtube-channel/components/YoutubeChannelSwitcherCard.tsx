import { CheckCircle2, Plus, Trash2, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { YoutubeManagedChannel } from "../types";

type Props = {
  activeChannel: YoutubeManagedChannel | null;
  channels: YoutubeManagedChannel[];
  addManualChannel: () => void;
  removeChannel: (localId: string) => void;
  selectChannel: (localId: string) => void;
  updateActiveChannel: (patch: Partial<YoutubeManagedChannel>) => void;
};

export function YoutubeChannelSwitcherCard({ activeChannel, addManualChannel, channels, removeChannel, selectChannel, updateActiveChannel }: Props) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Danh sách kênh YouTube</h2>
            <p className="text-xs text-muted-foreground">Chọn kênh trước, sau đó quản lý kế hoạch, upload và lịch sử theo từng kênh.</p>
          </div>
          <Button size="sm" variant="outline" onClick={addManualChannel}>
            <Plus className="mr-2 h-4 w-4" />Thêm kênh nháp
          </Button>
        </div>

        {channels.length ? (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {channels.map((channel) => {
              const active = channel.localId === activeChannel?.localId;
              return (
                <ChannelItem
                  key={channel.localId}
                  active={active}
                  channel={channel}
                  onRemove={() => removeChannel(channel.localId)}
                  onSelect={() => selectChannel(channel.localId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center">
            <p className="font-medium">Chưa có kênh nào trong workspace.</p>
            <p className="mt-1 text-sm text-muted-foreground">Bấm “Login YouTube” ở tab Kết nối hoặc thêm kênh nháp để lập kế hoạch trước.</p>
          </div>
        )}
      </Card>

      {activeChannel ? (
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="font-semibold">Thông tin kênh đang chọn</h2>
            <p className="text-xs text-muted-foreground">Dùng cho kênh nháp, phân biệt nhiều kênh và gắn URL vào kế hoạch nội dung.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Tên hiển thị trong workspace</Label>
              <Input className="mt-2" value={activeChannel.title} onChange={(event) => updateActiveChannel({ title: event.target.value })} />
            </div>
            <div>
              <Label>Channel URL</Label>
              <Input className="mt-2" value={activeChannel.channelUrl} onChange={(event) => updateActiveChannel({ channelUrl: event.target.value })} />
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function ChannelItem({ active, channel, onRemove, onSelect }: { active: boolean; channel: YoutubeManagedChannel; onRemove: () => void; onSelect: () => void }) {
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
          <img src={channel.thumbnailUrl} alt="YouTube channel avatar" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-300"><Youtube className="h-5 w-5" /></div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{channel.title}</p>
            {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{channel.channelUrl || "Chưa có URL kênh"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={channel.refreshToken ? "default" : "secondary"}>{channel.refreshToken ? "Đã cấp quyền" : "Kế hoạch local"}</Badge>
            {channel.youtubeChannelId ? <Badge variant="outline">YouTube ID</Badge> : null}
          </div>
        </div>
        <span
          className="rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-destructive/15 hover:text-destructive"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }
          }}
          aria-label="Xóa kênh"
        >
          <Trash2 className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
