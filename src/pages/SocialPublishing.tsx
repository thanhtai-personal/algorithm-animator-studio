import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, RadioTower, Trash2, UploadCloud } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { getCurrentProfile, isSuperAdminProfile } from "@/lib/auth";
import { uiText } from "@/lib/i18n";
import {
  deleteSocialConfig,
  getDefaultConfigs,
  listPublishHistory,
  listSocialConfigs,
  publishVideoToSocial,
  saveSocialConfig,
  SOCIAL_PLATFORMS,
  SocialPlatform,
  SocialPlatformConfig,
  SocialPublishHistoryItem,
  SocialPublishMetadata,
  testSocialConnection,
} from "@/lib/socialPublishing";

type AuthStatus = "loading" | "allowed" | "denied";

const defaultMetadata: SocialPublishMetadata = {
  title: "",
  description: "",
  tags: "",
  privacy: "private",
  scheduledAt: "",
  youtubeCategory: "22",
  youtubeMadeForKids: false,
  tiktokAllowComments: true,
  tiktokAllowDuet: false,
  tiktokAllowStitch: false,
  facebookPageId: "",
};

const statusLabel: Record<string, string> = {
  not_configured: "Not configured",
  configured: "Configured",
  token_expired: "Token expired",
  upload_failed: "Upload failed",
};

export default function SocialPublishing() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [configs, setConfigs] = useState(getDefaultConfigs);
  const [drafts, setDrafts] = useState<Record<SocialPlatform, Record<string, string>>>({
    facebook: {},
    youtube: {},
    tiktok: {},
  });
  const [selected, setSelected] = useState<Record<SocialPlatform, boolean>>({
    facebook: true,
    youtube: false,
    tiktok: false,
  });
  const [metadata, setMetadata] = useState<SocialPublishMetadata>(defaultMetadata);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [history, setHistory] = useState<SocialPublishHistoryItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const selectedPlatforms = useMemo(
    () => SOCIAL_PLATFORMS.map((item) => item.id).filter((id) => selected[id]),
    [selected],
  );

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((profile) => {
        if (cancelled) return;
        if (!isSuperAdminProfile(profile)) {
          setAuthStatus("denied");
          return;
        }
        setAuthStatus("allowed");
        void refreshData();
      })
      .catch(() => {
        if (!cancelled) setAuthStatus("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshData() {
    await Promise.all([loadConfigs(), loadHistory()]);
  }

  async function loadConfigs() {
    try {
      const payload = await listSocialConfigs();
      setConfigs(() => {
        const next = getDefaultConfigs();
        payload.configs.forEach((config) => {
          next[config.platform] = config;
        });
        return next;
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function loadHistory() {
    try {
      const payload = await listPublishHistory();
      setHistory(payload.history ?? []);
    } catch {
      setHistory([]);
    }
  }

  async function handleSave(platform: SocialPlatform) {
    setBusy(`${platform}:save`);
    try {
      const payload = await saveSocialConfig(platform, drafts[platform] ?? {});
      setConfigs((prev) => ({ ...prev, [platform]: payload.config }));
      setDrafts((prev) => ({ ...prev, [platform]: {} }));
      toast.success("Configuration saved.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleTest(platform: SocialPlatform) {
    setBusy(`${platform}:test`);
    try {
      const payload = await testSocialConnection(platform);
      setConfigs((prev) => ({ ...prev, [platform]: payload.config }));
      toast.success("Connection test completed.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(platform: SocialPlatform) {
    setBusy(`${platform}:delete`);
    try {
      await deleteSocialConfig(platform);
      setConfigs((prev) => ({ ...prev, [platform]: { platform, status: "not_configured" } }));
      toast.success("Configuration deleted.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!videoFile) {
      toast.error("Choose a video file first.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }
    setBusy("publish");
    try {
      const payload = await publishVideoToSocial({ file: videoFile, platforms: selectedPlatforms, metadata });
      setHistory(payload.history ?? []);
      toast.success("Publish job submitted.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  if (authStatus === "loading") {
    return <ScreenMessage />;
  }

  if (authStatus === "denied") {
    return <Navigate replace to="/auth" state={{ from: "/social-publishing" }} />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border/40 px-6 py-5">
        <Button size="icon" variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{uiText("Social Publishing")}</h1>
          <p className="text-sm text-muted-foreground">{uiText("Configure admin-only publishing data locally for Facebook, YouTube, and TikTok.")}</p>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          {SOCIAL_PLATFORMS.map((platform) => (
            <PlatformConfigCard
              key={platform.id}
              busy={busy}
              config={configs[platform.id]}
              drafts={drafts[platform.id] ?? {}}
              onDelete={() => handleDelete(platform.id)}
              onDraftChange={(key, value) => setDrafts((prev) => ({ ...prev, [platform.id]: { ...prev[platform.id], [key]: value } }))}
              onSave={() => handleSave(platform.id)}
              onTest={() => handleTest(platform.id)}
              platform={platform}
            />
          ))}
        </section>

        <aside className="space-y-4">
          <PublishCard
            busy={busy === "publish"}
            metadata={metadata}
            selected={selected}
            videoFile={videoFile}
            onFileChange={(file) => setVideoFile(file)}
            onMetadataChange={(patch) => setMetadata((prev) => ({ ...prev, ...patch }))}
            onSelectedChange={(platform, checked) => setSelected((prev) => ({ ...prev, [platform]: checked }))}
            onSubmit={handlePublish}
          />
          <HistoryCard history={history} />
        </aside>
      </div>
    </main>
  );
}

function PlatformConfigCard(props: {
  platform: (typeof SOCIAL_PLATFORMS)[number];
  config: SocialPlatformConfig;
  drafts: Record<string, string>;
  busy: string | null;
  onDraftChange: (key: string, value: string) => void;
  onSave: () => void;
  onTest: () => void;
  onDelete: () => void;
}) {
  const { platform, config, drafts, busy } = props;
  const platformBusy = busy?.startsWith(`${platform.id}:`) ?? false;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <RadioTower className="mt-1 h-5 w-5 text-emerald-400" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{platform.label}</h2>
            <StatusBadge status={config.status} />
          </div>
          <p className="text-sm text-muted-foreground">{platform.description}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {platform.fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`${platform.id}-${field.key}`}>{field.label}</Label>
            <Input
              id={`${platform.id}-${field.key}`}
              autoComplete="off"
              placeholder={config.maskedFields?.[field.key] ?? field.placeholder}
              type={field.secret ? "password" : "text"}
              value={drafts[field.key] ?? ""}
              onChange={(event) => props.onDraftChange(field.key, event.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled={platformBusy} onClick={props.onSave}>
          {platformBusy ? <SystemLoader className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          Save config
        </Button>
        <Button disabled={platformBusy || config.status === "not_configured"} variant="outline" onClick={props.onTest}>
          Test connection
        </Button>
        <Button disabled={platformBusy || config.status === "not_configured"} variant="destructive" onClick={props.onDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function PublishCard(props: {
  busy: boolean;
  metadata: SocialPublishMetadata;
  selected: Record<SocialPlatform, boolean>;
  videoFile: File | null;
  onFileChange: (file: File | null) => void;
  onMetadataChange: (patch: Partial<SocialPublishMetadata>) => void;
  onSelectedChange: (platform: SocialPlatform, checked: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">{uiText("Publish video")}</h2>
      <p className="text-xs text-muted-foreground">
        Jobs are saved locally. Auth still uses the API, but social publishing data is stored in this browser.
      </p>
      <form className="space-y-3" onSubmit={props.onSubmit}>
        <Input accept="video/*" type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => props.onFileChange(event.target.files?.[0] ?? null)} />
        {props.videoFile ? <p className="text-xs text-muted-foreground">{props.videoFile.name}</p> : null}
        <Input placeholder={uiText("Title")} value={props.metadata.title} onChange={(event) => props.onMetadataChange({ title: event.target.value })} />
        <Textarea placeholder={uiText("Description or caption")} value={props.metadata.description} onChange={(event) => props.onMetadataChange({ description: event.target.value })} />
        <Input placeholder={uiText("#tags, comma separated")} value={props.metadata.tags} onChange={(event) => props.onMetadataChange({ tags: event.target.value })} />
        <Select value={props.metadata.privacy} onValueChange={(value) => props.onMetadataChange({ privacy: value as SocialPublishMetadata["privacy"] })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="private">{uiText("Private")}</SelectItem>
            <SelectItem value="unlisted">{uiText("Unlisted")}</SelectItem>
            <SelectItem value="public">{uiText("Public")}</SelectItem>
          </SelectContent>
        </Select>
        <Input type="datetime-local" value={props.metadata.scheduledAt} onChange={(event) => props.onMetadataChange({ scheduledAt: event.target.value })} />
        <Input placeholder={uiText("YouTube category ID")} value={props.metadata.youtubeCategory} onChange={(event) => props.onMetadataChange({ youtubeCategory: event.target.value })} />
        <Input placeholder={uiText("Facebook Page ID override")} value={props.metadata.facebookPageId} onChange={(event) => props.onMetadataChange({ facebookPageId: event.target.value })} />
        <ToggleRow label={uiText("YouTube made for kids")} checked={props.metadata.youtubeMadeForKids} onChange={(checked) => props.onMetadataChange({ youtubeMadeForKids: checked })} />
        <ToggleRow label={uiText("TikTok comments")} checked={props.metadata.tiktokAllowComments} onChange={(checked) => props.onMetadataChange({ tiktokAllowComments: checked })} />
        <ToggleRow label={uiText("TikTok duet")} checked={props.metadata.tiktokAllowDuet} onChange={(checked) => props.onMetadataChange({ tiktokAllowDuet: checked })} />
        <ToggleRow label={uiText("TikTok stitch")} checked={props.metadata.tiktokAllowStitch} onChange={(checked) => props.onMetadataChange({ tiktokAllowStitch: checked })} />
        <div className="space-y-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <label key={platform.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={props.selected[platform.id]} onCheckedChange={(checked) => props.onSelectedChange(platform.id, checked === true)} />
              {platform.label}
            </label>
          ))}
        </div>
        <Button className="w-full" disabled={props.busy} type="submit">
          {props.busy ? <SystemLoader className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
          Submit publish job
        </Button>
      </form>
    </Card>
  );
}

function HistoryCard({ history }: { history: SocialPublishHistoryItem[] }) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">{uiText("History")}</h2>
      {history.length === 0 ? <p className="text-sm text-muted-foreground">{uiText("No publish jobs yet.")}</p> : null}
      {history.slice(0, 8).map((item) => (
        <div key={item.id} className="rounded-md border border-border p-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="font-medium">{item.platform}</span>
            <Badge variant="outline">{item.status}</Badge>
          </div>
          <p className="mt-1 truncate text-muted-foreground">{item.title}</p>
          {item.publishedUrl ? <a className="text-emerald-400 underline" href={item.publishedUrl}>{uiText("Open post")}</a> : null}
          {item.errorMessage ? <p className="text-destructive">{item.errorMessage}</p> : null}
        </div>
      ))}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "configured" ? "default" : status === "not_configured" ? "secondary" : "destructive";
  return <Badge variant={variant}>{statusLabel[status] ?? status}</Badge>;
}

function ToggleRow(props: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
      {props.label}
      <Switch checked={props.checked} onCheckedChange={props.onChange} />
    </label>
  );
}

function ScreenMessage() {
  return <div className="flex min-h-screen items-center justify-center bg-background"><SystemLoader className="h-40 w-80" title="Loading" /></div>;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected social publishing error.";
}
