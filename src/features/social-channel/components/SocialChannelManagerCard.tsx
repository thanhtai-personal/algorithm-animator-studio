import type { ReactNode } from "react";
import { CheckCircle2, Plus, RadioTower, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Lang } from "@/lib/i18n";
import { useSocialChannelWorkspace } from "../hooks/useSocialChannelWorkspace";
import type { SocialChannel, SocialChannelStatus, SocialPlatform } from "../types";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORMS } from "../types";

const STATUS_LABELS: Record<SocialChannelStatus, Record<Lang, string>> = {
  draft: { en: "Manual management", vi: "Quản lý thủ công" },
  connected: { en: "Connected", vi: "Đã liên kết" },
  reviewing: { en: "Preparing", vi: "Đang chuẩn bị" },
};

type SocialManager = ReturnType<typeof useSocialChannelWorkspace>;

export function SocialChannelManagerCard({ lang, manager: providedManager, showSidebar = true }: { lang: Lang; manager?: SocialManager; showSidebar?: boolean }) {
  const ownManager = useSocialChannelWorkspace();
  const manager = providedManager ?? ownManager;
  const vi = lang === "vi";
  const platformCounts = SOCIAL_PLATFORMS.map((platform) => ({
    platform,
    count: manager.channels.filter((channel) => channel.platform === platform).length,
  }));

  if (!showSidebar) {
    return manager.activeChannel ? (
      <SocialChannelEditor
        channel={manager.activeChannel}
        lang={lang}
        updateChannel={(patch) => manager.updateChannel(manager.activeChannel!.id, patch)}
      />
    ) : (
      <Card className="flex min-h-[360px] items-center justify-center border-dashed p-6 text-center text-sm text-muted-foreground">
        {txt(vi, "Chọn một kênh đã kết nối ở panel bên trái để bắt đầu quản lý.", "Select a connected channel from the left panel to start managing.")}
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">{txt(vi, "Kênh mạng xã hội", "Social Channels")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{txt(vi, "Quản lý page, tài khoản và kế hoạch nội dung ngoài YouTube.", "Manage pages, accounts, and content plans outside YouTube.")}</p>
        </div>

        <div className="space-y-2 border-b border-border p-3">
          {platformCounts.map(({ platform, count }) => (
            <button
              key={platform}
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                manager.activePlatform === platform ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => manager.selectPlatform(platform)}
            >
              <span className="font-medium">{SOCIAL_PLATFORM_LABELS[platform]}</span>
              <Badge variant={manager.activePlatform === platform ? "secondary" : "outline"}>{count}</Badge>
            </button>
          ))}
        </div>

        <div className="space-y-3 p-3">
          <Button
            className="w-full cursor-not-allowed opacity-50"
            size="sm"
            variant="outline"
            disabled
            title={txt(vi, "Provider này chưa được cấu hình OAuth/backend.", "This provider has no OAuth/backend configuration yet.")}
          >
            <Plus className="mr-2 h-4 w-4" />{txt(vi, "Chưa cấu hình", "Not configured")} {SOCIAL_PLATFORM_LABELS[manager.activePlatform]}
          </Button>

          {manager.platformChannels.length ? (
            <div className="space-y-2">
              {manager.platformChannels.map((channel) => (
                <SocialChannelListItem
                  key={channel.id}
                  active={channel.id === manager.activeChannel?.id}
                  channel={channel}
                  lang={lang}
                  onRemove={() => manager.removeChannel(channel.id)}
                  onSelect={() => manager.selectChannel(channel.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              {txt(vi, "Chưa có kênh", "No")} {SOCIAL_PLATFORM_LABELS[manager.activePlatform]}.
            </div>
          )}
        </div>
      </Card>

      {manager.activeChannel ? (
        <SocialChannelEditor
          channel={manager.activeChannel}
          lang={lang}
          updateChannel={(patch) => manager.updateChannel(manager.activeChannel!.id, patch)}
        />
      ) : (
        <Card className="flex min-h-[360px] items-center justify-center border-dashed p-6 text-center text-sm text-muted-foreground">
          {txt(vi, "Chọn hoặc thêm một kênh để bắt đầu quản lý.", "Select or add a channel to start managing.")}
        </Card>
      )}
    </div>
  );
}

function SocialChannelListItem({ active, channel, lang, onRemove, onSelect }: { active: boolean; channel: SocialChannel; lang: Lang; onRemove: () => void; onSelect: () => void }) {
  const vi = lang === "vi";
  return (
    <div
      className={`group cursor-pointer rounded-xl border p-3 transition ${active ? "border-primary/70 bg-primary/10" : "border-border hover:border-primary/40"}`}
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <RadioTower className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{channel.name}</p>
            {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{channel.handle || channel.url || txt(vi, "Chưa có handle", "No handle")}</p>
          <Badge className="mt-2" variant={channel.status === "connected" ? "default" : "secondary"}>{STATUS_LABELS[channel.status][lang]}</Badge>
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

function SocialChannelEditor({ channel, lang, updateChannel }: { channel: SocialChannel; lang: Lang; updateChannel: (patch: Partial<SocialChannel>) => void }) {
  const vi = lang === "vi";
  return (
    <Card className="space-y-5 p-4">
      <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SOCIAL_PLATFORM_LABELS[channel.platform]}</p>
          <h2 className="mt-1 text-xl font-bold">{channel.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{txt(vi, "Lưu thông tin kênh, vai trò nội dung và nhịp đăng để điều phối đa nền tảng.", "Save channel details, content role, and posting cadence for cross-platform coordination.")}</p>
        </div>
        <Badge variant={channel.status === "connected" ? "default" : "secondary"}>{STATUS_LABELS[channel.status][lang]}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label={txt(vi, "Tên kênh / page", "Channel / page name")}>
          <Input value={channel.name} onChange={(event) => updateChannel({ name: event.target.value })} />
        </Field>
        <Field label="Handle / username">
          <Input placeholder="@kaistudio" value={channel.handle} onChange={(event) => updateChannel({ handle: event.target.value })} />
        </Field>
        <Field label={txt(vi, "URL kênh", "Channel URL")}>
          <Input placeholder="https://..." value={channel.url} onChange={(event) => updateChannel({ url: event.target.value })} />
        </Field>
        <Field label={txt(vi, "Người phụ trách", "Owner")}>
          <Input value={channel.ownerName} onChange={(event) => updateChannel({ ownerName: event.target.value })} />
        </Field>
        <Field label={txt(vi, "Trạng thái", "Status")}>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={channel.status}
            onChange={(event) => updateChannel({ status: event.target.value as SocialChannelStatus })}
          >
            <option value="draft">{STATUS_LABELS.draft[lang]}</option>
            <option value="reviewing">{STATUS_LABELS.reviewing[lang]}</option>
            <option value="connected">{STATUS_LABELS.connected[lang]}</option>
          </select>
        </Field>
        <Field label={txt(vi, "Nhịp đăng nội dung", "Posting cadence")}>
          <Input value={channel.uploadCadence} onChange={(event) => updateChannel({ uploadCadence: event.target.value })} />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label={txt(vi, "Vai trò nội dung", "Content role")}>
          <Textarea rows={5} value={channel.contentRole} onChange={(event) => updateChannel({ contentRole: event.target.value })} />
        </Field>
        <Field label={txt(vi, "Hashtag mặc định", "Default hashtags")}>
          <Textarea rows={5} value={channel.defaultHashtags} onChange={(event) => updateChannel({ defaultHashtags: event.target.value })} />
        </Field>
      </div>

      <Field label={txt(vi, "Ghi chú vận hành", "Operating notes")}>
        <Textarea rows={4} value={channel.notes} onChange={(event) => updateChannel({ notes: event.target.value })} />
      </Field>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
