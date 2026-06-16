import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, ExternalLink, Play, RefreshCcw, RotateCcw, Wand2, XCircle } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getGeneratedAssets, type GeneratedAsset } from "@/lib/generatedAssetsApi";
import type { Lang } from "@/lib/i18n";
import { cancelPublishJob, createPublishJob, getPublishAgentSuggestions, getPublishHistory, getPublishJobs, retryPublishJob, runDuePublishJobs, runPublishJob, type AgentWorkflowSuggestion, type PublishJob, type PublishPlatform, type PublishHistoryItem } from "@/lib/publishQueueApi";

type ActivePublishChannel = {
  provider: PublishPlatform;
  id: string;
  title: string;
  youtubeRefreshToken?: string;
  youtubePlaylistId?: string;
};

type Props = {
  activeChannel: ActivePublishChannel | null;
  lang: Lang;
};

const PLATFORM_LABEL: Record<PublishPlatform, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  running: "secondary",
  queued: "outline",
  scheduled: "outline",
  manual_required: "secondary",
  failed: "destructive",
  cancelled: "destructive",
};

export function PublishingOpsCard({ activeChannel, lang }: Props) {
  const vi = lang === "vi";
  const [videos, setVideos] = useState<GeneratedAsset[]>([]);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [history, setHistory] = useState<PublishHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<AgentWorkflowSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const selectedAsset = useMemo(() => videos.find((video) => video.relativePath === selectedVideo) || null, [selectedVideo, videos]);

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    if (!jobs.some((job) => job.status === "running" || job.status === "queued" || job.status === "scheduled")) return;
    const timer = window.setInterval(() => void refreshAll(false), 1200);
    return () => window.clearInterval(timer);
  }, [jobs]);

  useEffect(() => {
    if (!selectedAsset) return;
    const metadata = selectedAsset.youtubeMetadata;
    setTitle(metadata?.title || selectedAsset.fileName.replace(/\.[^.]+$/, ""));
    setDescription(metadata?.description || "");
    setTags(metadata?.tags || "");
  }, [selectedAsset]);

  async function refreshAll(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const [assets, nextJobs, nextHistory, nextSuggestions] = await Promise.all([
        getGeneratedAssets(),
        getPublishJobs(),
        getPublishHistory(),
        getPublishAgentSuggestions(),
      ]);
      setVideos(assets.video);
      setJobs(nextJobs);
      setHistory(nextHistory);
      setSuggestions(nextSuggestions);
      if (!selectedVideo && assets.video[0]) setSelectedVideo(assets.video[0].relativePath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tải được publishing ops.", "Could not load publishing ops."));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function queueJob() {
    if (!activeChannel) {
      toast.info(txt(vi, "Hãy chọn một kênh ở panel bên trái trước.", "Select a channel in the left panel first."));
      return;
    }
    if (!selectedAsset) {
      toast.info(txt(vi, "Chưa chọn video generated.", "No generated video selected."));
      return;
    }

    setLoading(true);
    try {
      await createPublishJob({
        platform: activeChannel.provider,
        source: "generated-video",
        videoRelativePath: selectedAsset.relativePath,
        title: title || selectedAsset.fileName,
        description,
        tags,
        scheduledAt,
        publishAt: scheduledAt,
        privacyStatus: activeChannel.provider === "youtube" ? "private" : activeChannel.provider === "tiktok" ? "SELF_ONLY" : "published",
        channelId: activeChannel.id,
        channelTitle: activeChannel.title,
        providerAccountId: activeChannel.provider === "youtube" ? "" : activeChannel.id,
        youtubeRefreshToken: activeChannel.youtubeRefreshToken,
        youtubePlaylistId: activeChannel.youtubePlaylistId,
        containsSyntheticMedia: true,
      });
      toast.success(scheduledAt ? txt(vi, "Đã lên lịch publish job.", "Publish job scheduled.") : txt(vi, "Đã đưa video vào upload queue.", "Video queued."));
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tạo được publish job.", "Could not create publish job."));
    } finally {
      setLoading(false);
    }
  }

  async function runDue() {
    setLoading(true);
    try {
      const result = await runDuePublishJobs();
      toast.success(txt(vi, `Đã xử lý ${result.processed} job.`, `${result.processed} job(s) processed.`));
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chạy được queue.", "Could not run queue."));
    } finally {
      setLoading(false);
    }
  }

  async function actionJob(action: "run" | "retry" | "cancel", job: PublishJob) {
    setLoading(true);
    try {
      if (action === "run") await runPublishJob(job.id);
      if (action === "retry") await retryPublishJob(job.id);
      if (action === "cancel") await cancelPublishJob(job.id);
      await refreshAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không cập nhật được job.", "Could not update job."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{txt(vi, "Publish Scheduler & Upload Queue", "Publish Scheduler & Upload Queue")}</h2>
            <p className="text-sm text-muted-foreground">{txt(vi, "Queue chạy ngay trên máy local. Không cần host cloud; app phải mở khi tới giờ đăng.", "The queue runs locally. No cloud host required; the app must be open when a schedule is due.")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{activeChannel ? `${PLATFORM_LABEL[activeChannel.provider]} · ${activeChannel.title}` : txt(vi, "Chưa chọn kênh", "No channel selected")}</Badge>
            <Button size="sm" variant="outline" onClick={() => void refreshAll()} disabled={loading}><RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại", "Refresh")}</Button>
            <Button size="sm" onClick={() => void runDue()} disabled={loading}><Play className="mr-2 h-4 w-4" />{txt(vi, "Chạy job tới giờ", "Run due")}</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <Field label={txt(vi, "Video generated", "Generated video")}>
              <Select value={selectedVideo} onValueChange={setSelectedVideo}>
                <SelectTrigger><SelectValue placeholder={txt(vi, "Chọn video", "Select video")} /></SelectTrigger>
                <SelectContent>
                  {videos.map((video) => <SelectItem key={video.relativePath} value={video.relativePath}>{video.fileName}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={txt(vi, "Tiêu đề", "Title")}><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
            <Field label={txt(vi, "Mô tả", "Description")}><Textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label={txt(vi, "Tags / hashtags", "Tags / hashtags")}><Input value={tags} onChange={(event) => setTags(event.target.value)} /></Field>
              <Field label={txt(vi, "Lịch chạy local", "Local schedule")}><Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></Field>
            </div>
            {!activeChannel ? <p className="rounded-md bg-yellow-500/10 p-2 text-xs text-yellow-300">{txt(vi, "Bước bắt buộc: chọn kênh ở panel bên trái trước khi tạo job đăng.", "Required step: select a channel in the left panel before creating a publish job.")}</p> : null}
            <Button className="w-full" onClick={() => void queueJob()} disabled={loading || !selectedAsset || !activeChannel}><CalendarClock className="mr-2 h-4 w-4" />{scheduledAt ? txt(vi, "Lên lịch publish", "Schedule publish") : txt(vi, "Đưa vào upload queue", "Add to queue")}</Button>
          </div>

          <Card className="space-y-3 border-dashed p-3">
            <div className="flex items-center gap-2 font-semibold"><Wand2 className="h-4 w-4" />{txt(vi, "Agent workflow", "Agent workflow")}</div>
            {suggestions.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
                <Badge variant={item.severity === "warning" ? "destructive" : item.severity === "success" ? "default" : "secondary"}>{item.actionLabel}</Badge>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </Card>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">{txt(vi, "Upload job queue", "Upload job queue")}</h2>
        {!jobs.length ? <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có job nào.", "No jobs yet.")}</p> : null}
        {jobs.slice(0, 30).map((job) => (
          <div key={job.id} className="rounded-lg border border-border p-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{job.title || job.sourceFileName}</p>
                <p className="text-xs text-muted-foreground">{PLATFORM_LABEL[job.platform]} · {job.channelTitle || job.channelId || txt(vi, "Chưa chọn kênh", "No channel")} · {job.scheduledAtMs ? new Date(job.scheduledAtMs).toLocaleString() : new Date(job.createdAtMs).toLocaleString()}</p>
                <p className="mt-1 text-xs text-muted-foreground">ID: {job.id.slice(0, 8)} · attempts {job.attempts}/{job.maxAttempts}</p>
                {job.message ? <p className="mt-1 text-xs text-yellow-300">{job.message}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[job.status] || "secondary"}>{job.status}</Badge>
                {job.status === "running" ? <SystemLoader className="h-4 w-4 text-primary" /> : null}
                {job.resultUrl ? <a className="inline-flex items-center gap-1 text-xs text-blue-300 underline" href={job.resultUrl} target="_blank" rel="noreferrer">Open <ExternalLink className="h-3 w-3" /></a> : null}
                <Button size="sm" variant="outline" onClick={() => void actionJob("run", job)} disabled={loading || job.status === "running"}><Play className="h-3.5 w-3.5" /></Button>
                {job.status === "failed" || job.status === "manual_required" ? <Button size="sm" variant="outline" onClick={() => void actionJob("retry", job)} disabled={loading}><RotateCcw className="h-3.5 w-3.5" /></Button> : null}
                {job.status === "queued" || job.status === "scheduled" ? <Button size="sm" variant="ghost" onClick={() => void actionJob("cancel", job)} disabled={loading}><XCircle className="h-3.5 w-3.5" /></Button> : null}
              </div>
            </div>
            <Progress value={job.progress || 0} className="mt-3" />
            <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
              <span>{txt(vi, "Tạo:", "Created:")} {new Date(job.createdAtMs).toLocaleTimeString()}</span>
              <span>{job.startedAtMs ? `${txt(vi, "Bắt đầu:", "Started:")} ${new Date(job.startedAtMs).toLocaleTimeString()}` : txt(vi, "Chưa bắt đầu", "Not started")}</span>
              <span>{job.completedAtMs ? `${txt(vi, "Xong:", "Done:")} ${new Date(job.completedAtMs).toLocaleTimeString()}` : txt(vi, "Chưa hoàn tất", "Not completed")}</span>
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">{txt(vi, "Publish history", "Publish history")}</h2>
        {!history.length ? <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có lịch sử publish.", "No publish history yet.")}</p> : null}
        {history.slice(0, 20).map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-3 text-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{item.title || item.sourceFileName}</p>
                <p className="text-xs text-muted-foreground">{PLATFORM_LABEL[item.platform]} · {new Date(item.attemptedAtMs).toLocaleString()} · {item.channelTitle || item.channelId || "No channel"}</p>
              </div>
              <Badge variant={item.status === "success" ? "default" : item.status === "manual_required" ? "secondary" : "destructive"}>{item.status}</Badge>
            </div>
            {item.message ? <p className="mt-1 text-xs text-muted-foreground">{item.message}</p> : null}
          </div>
        ))}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
