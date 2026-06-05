import { useState, type DragEvent } from "react";
import { ChevronDown, Facebook, GripVertical, Instagram, PanelLeftClose, PanelLeftOpen, Plus, RadioTower, Trash2, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SocialPlatform } from "@/features/social-channel/types";

export type ChannelProvider = "youtube" | SocialPlatform;

export type ProviderConnectionState = {
  configured: boolean;
  disabledReason?: string;
};

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
  providerStates?: Partial<Record<ChannelProvider, ProviderConnectionState>>;
  onAddProvider: (provider: ChannelProvider) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  onRemove: (channel: SharedChannelItem) => void;
  onReorderCancel?: () => void;
  onReorderCommit?: () => void;
  onReorderPreview?: (draggedKey: string, targetKey: string) => void;
  onReorderStart?: () => void;
  onSelect: (channel: SharedChannelItem) => void;
};

const PROVIDERS: ChannelProvider[] = ["youtube", "tiktok", "facebook", "instagram"];

export function SharedChannelSidebar({
  activeKey,
  channels,
  collapsed,
  lang,
  providerStates,
  onAddProvider,
  onCollapsedChange,
  onRemove,
  onReorderCancel,
  onReorderCommit,
  onReorderPreview,
  onReorderStart,
  onSelect,
}: Props) {
  const vi = lang === "vi";
  const [draggingKey, setDraggingKey] = useState("");

  function getProviderState(provider: ChannelProvider): ProviderConnectionState {
    return providerStates?.[provider] ?? { configured: true };
  }

  function renderProviderMenuItem(provider: ChannelProvider) {
    const state = getProviderState(provider);
    const label = `${txt(vi, "Thêm", "Add")} ${providerLabel(provider)}`;
    const disabledTitle = state.disabledReason || txt(vi, "Provider này chưa được cấu hình OAuth.", "This provider is not configured yet.");

    return (
      <DropdownMenuItem
        key={provider}
        disabled={!state.configured}
        onClick={() => onAddProvider(provider)}
        aria-label={state.configured ? label : `${label}. ${disabledTitle}`}
        title={state.configured ? label : disabledTitle}
        className="gap-2"
      >
        {providerIcon(provider, "h-4 w-4")}
        <span>{providerLabel(provider)}</span>
      </DropdownMenuItem>
    );
  }

  function handleDragStart(channel: SharedChannelItem, event: DragEvent) {
    const key = channelKey(channel);
    onReorderStart?.();
    setDraggingKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(channel: SharedChannelItem, event: DragEvent) {
    event.preventDefault();
    const targetKey = channelKey(channel);
    const sourceKey = event.dataTransfer.getData("text/plain") || draggingKey;
    if (sourceKey && sourceKey !== targetKey) onReorderPreview?.(sourceKey, targetKey);
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    onReorderCommit?.();
    clearDragState();
  }

  function handleDragEnd() {
    onReorderCancel?.();
    clearDragState();
  }

  function clearDragState() {
    setDraggingKey("");
  }

  function AddChannelDropdown({ iconOnly = false }: { iconOnly?: boolean }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size={iconOnly ? "icon" : "sm"}
            variant="outline"
            className={cn(!iconOnly && "w-full justify-center gap-2")}
            aria-label={txt(vi, "Thêm kênh", "Add channel")}
            title={txt(vi, "Thêm kênh", "Add channel")}
          >
            <Plus className="h-4 w-4" />
            {iconOnly ? null : <span>{txt(vi, "Thêm kênh", "Add channel")}</span>}
            {iconOnly ? null : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={iconOnly ? "center" : "start"} className="min-w-44">
          {PROVIDERS.map((provider) => renderProviderMenuItem(provider))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (collapsed) {
    return (
      <Card className="h-fit overflow-hidden p-2 transition-[width,transform,opacity] duration-300 ease-in-out">
        <div className="flex flex-col items-center gap-2 transition-opacity duration-200">
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

          <AddChannelDropdown iconOnly />

          <div className="w-full max-h-[70vh] space-y-2 overflow-y-auto pr-1 pt-1">
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
    <Card className="h-fit overflow-hidden p-0 transition-[width,transform,opacity] duration-300 ease-in-out">
      <div className="border-b border-border p-4 transition-opacity duration-200">
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

      <div className="space-y-3 p-3 transition-opacity duration-200">
        <AddChannelDropdown />

        {channels.length ? (
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {channels.map((channel) => (
              <SharedChannelRow
                key={channelKey(channel)}
                active={channelKey(channel) === activeKey}
                channel={channel}
                dragging={channelKey(channel) === draggingKey}
                lang={lang}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => handleDragOver(channel, event)}
                onDragStart={(event) => handleDragStart(channel, event)}
                onDrop={handleDrop}
                onRemove={() => onRemove(channel)}
                onSelect={() => onSelect(channel)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            {txt(vi, "Chưa có kênh. Hãy kết nối provider đã cấu hình để bắt đầu.", "No channels yet. Connect a configured provider to get started.")}
          </div>
        )}
      </div>
    </Card>
  );
}

export function channelKey(channel: Pick<SharedChannelItem, "id" | "provider">) {
  return `${channel.provider}:${channel.id}`;
}

function SharedChannelRow({
  active,
  channel,
  dragging,
  lang,
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onRemove,
  onSelect,
}: {
  active: boolean;
  channel: SharedChannelItem;
  dragging: boolean;
  lang: Lang;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragStart: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const vi = lang === "vi";

  return (
    <div
      draggable
      className={cn(
        "group cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:border-primary/60",
        active ? "border-primary/70 bg-primary/10" : "border-border bg-card",
        dragging && "scale-[0.98] opacity-50 shadow-lg"
      )}
      role="button"
      tabIndex={0}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-3 cursor-grab rounded-md p-1 text-muted-foreground opacity-70 transition hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-hidden="true"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <ChannelAvatar channel={channel} sizeClassName="h-11 w-11" iconClassName="h-4 w-4" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{channel.title}</p>
            <Badge variant="outline">{providerLabel(channel.provider)}</Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{channel.subtitle || txt(vi, "Chưa có URL/handle", "No URL/handle")}</p>
          <Badge className="mt-2" variant={channel.connected ? "default" : "secondary"}>
            {channel.connected ? txt(vi, "Đã cấp quyền", "Authorized") : txt(vi, "Chưa cấp quyền", "Not authorized")}
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
