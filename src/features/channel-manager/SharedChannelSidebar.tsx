import { Facebook, Instagram, PanelLeftClose, PanelLeftOpen, Plus, RadioTower, Trash2, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import type { SocialPlatform } from "@/features/social-channel/types";

export type ChannelProvider = "youtube" | SocialPlatform;

export type SharedChannelItem = {
  id: string;
  provider: ChannelProvider;
  title: string;
  subtitle: string;
  thumbnailUrl?: string;
  connected: boolean;
};

type Props = {
  activeKey: string;
  channels: SharedChannelItem[];
  collapsed: boolean;
  lang: Lang;
  onAddProvider: (provider: ChannelProvider) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onRemove: (channel: SharedChannelItem) => void;
  onSelect: (channel: SharedChannelItem) => void;
};

const PROVIDERS: ChannelProvider[] = ["youtube", "tiktok", "facebook", "instagram"];

export function SharedChannelSidebar({ activeKey, channels, collapsed, lang, onAddProvider, onCollapsedChange, onRemove, onSelect }: Props) {
  const vi = lang === "vi";

  if (collapsed) {
    return (
      <Card className="h-fit overflow-hidden p-2">
        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => onCollapsedChange(false)}
            aria-label={txt(vi, "Mở rộng menu kênh", "Expand channel menu")}
            title={txt(vi, "Mở rộng menu kênh", "Expand channel menu")}
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="w-full justify-center">
            {channels.length}
          </Badge>

          <details className="w-full">
            <summary
              className="flex h-10 w-full cursor-pointer list-none items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={txt(vi, "Thêm kênh", "Add channel")}
              title={txt(vi, "Thêm kênh", "Add channel")}
            >
              <Plus className="h-4 w-4" />
            </summary>
            <div className="mt-2 grid gap-2">
              {PROVIDERS.map((provider) => (
                <Button
                  key={provider}
                  size="icon"
                  variant="outline"
                  onClick={() => onAddProvider(provider)}
                  aria-label={`${txt(vi, "Thêm", "Add")} ${providerLabel(provider)}`}
                  title={`${txt(vi, "Thêm", "Add")} ${providerLabel(provider)}`}
                >
                  {providerIcon(provider, "h-4 w-4")}
                </Button>
              ))}
            </div>
          </details>

          <div className="w-full space-y-2 pt-1">
            {channels.map((channel) => {
              const active = channelKey(channel) === activeKey;
              return (
                <button
                  key={channelKey(channel)}
                  type="button"
                  className={`flex h-12 w-full items-center justify-center rounded-xl border transition hover:border-primary/60 ${active ? "border-primary/70 bg-primary/10" : "border-border bg-card"}`}
                  onClick={() => onSelect(channel)}
                  aria-label={`${providerLabel(channel.provider)}: ${channel.title}`}
                  title={`${providerLabel(channel.provider)}: ${channel.title}`}
                >
                  <ChannelAvatar channel={channel} sizeClassName="h-9 w-9" iconClassName="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-fit overflow-hidden p-0">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{txt(vi, "Tất cả kênh", "All Channels")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {txt(vi, "Chọn kênh chung cho mọi tab trên màn hình.", "Select one shared channel for every tab on this screen.")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{channels.length}</Badge>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onCollapsedChange(true)}
              aria-label={txt(vi, "Thu gọn menu kênh", "Collapse channel menu")}
              title={txt(vi, "Thu gọn menu kênh", "Collapse channel menu")}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted">
            <Plus className="h-4 w-4" />
            {txt(vi, "Thêm kênh", "Add channel")}
          </summary>
          <div className="mt-2 grid gap-2">
            {PROVIDERS.map((provider) => (
              <Button key={provider} size="sm" variant="outline" onClick={() => onAddProvider(provider)}>
                {providerIcon(provider)}
                {providerLabel(provider)}
              </Button>
            ))}
          </div>
        </details>

        {channels.length ? (
          <div className="space-y-2">
            {channels.map((channel) => (
              <SharedChannelRow
                key={channelKey(channel)}
                active={channelKey(channel) === activeKey}
                channel={channel}
                lang={lang}
                onRemove={() => onRemove(channel)}
                onSelect={() => onSelect(channel)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            {txt(vi, "Chưa có kênh. Hãy thêm kênh để bắt đầu.", "No channels yet. Add a channel to get started.")}
          </div>
        )}
      </div>
    </Card>
  );
}

export function channelKey(channel: Pick<SharedChannelItem, "id" | "provider">) {
  return `${channel.provider}:${channel.id}`;
}

function SharedChannelRow({ active, channel, lang, onRemove, onSelect }: { active: boolean; channel: SharedChannelItem; lang: Lang; onRemove: () => void; onSelect: () => void }) {
  const vi = lang === "vi";

  return (
    <div
      className={`group cursor-pointer rounded-xl border p-3 text-left transition hover:border-primary/60 ${active ? "border-primary/70 bg-primary/10" : "border-border bg-card"}`}
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
        <ChannelAvatar channel={channel} sizeClassName="h-11 w-11" iconClassName="h-4 w-4" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{channel.title}</p>
            <Badge variant="outline">{providerLabel(channel.provider)}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{channel.subtitle || txt(vi, "Chưa có URL/handle", "No URL/handle")}</p>
          <Badge className="mt-2" variant={channel.connected ? "default" : "secondary"}>
            {channel.connected ? txt(vi, "Đã cấp quyền", "Authorized") : txt(vi, "Nháp", "Draft")}
          </Badge>
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

function ChannelAvatar({ channel, sizeClassName, iconClassName }: { channel: SharedChannelItem; sizeClassName: string; iconClassName: string }) {
  if (channel.thumbnailUrl) {
    return <img src={channel.thumbnailUrl} alt="" className={`${sizeClassName} shrink-0 rounded-full object-cover`} />;
  }

  return (
    <div className={`flex ${sizeClassName} shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground`}>
      {providerIcon(channel.provider, iconClassName)}
    </div>
  );
}

function providerIcon(provider: ChannelProvider, className = "mr-2 h-4 w-4") {
  if (provider === "youtube") return <Youtube className={className} />;
  if (provider === "facebook") return <Facebook className={className} />;
  if (provider === "instagram") return <Instagram className={className} />;
  return <RadioTower className={className} />;
}

function providerLabel(provider: ChannelProvider) {
  if (provider === "youtube") return "YouTube";
  if (provider === "facebook") return "Facebook";
  if (provider === "instagram") return "Instagram";
  return "TikTok";
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
