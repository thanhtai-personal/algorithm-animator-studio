import { Clipboard, Download, FileAudio, FileText, FileVideo, RefreshCcw, Settings2, Terminal, Youtube } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSystemLang } from "@/hooks/use-system-lang";
import { openBackgroundJobsSocket, type BackgroundJobsSnapshot } from "@/lib/backgroundJobsRealtime";
import { text, type Lang } from "@/lib/i18n";
import {
  getYoutubeToolsHealth,
  listYoutubeToolsJobs,
  startYoutubeDownloadJob,
  startYoutubeTranscriptJob,
  type YoutubeDownloadMode,
  type YoutubeDownloadResult,
  type YoutubeToolsJob,
  type YoutubeToolsHealth,
  type YoutubeTranscriptResult,
} from "@/lib/youtubeToolsApi";

type BusyAction = "" | "health" | "download-video" | "download-audio" | "transcript-url" | "transcript-file";

export default function YoutubeTools() {
  const lang = useSystemLang();
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("youtube-video");
  const [maxHeight, setMaxHeight] = useState("1080");
  const [model, setModel] = useState("base");
  const [language, setLanguage] = useState("auto");
  const [task, setTask] = useState<"transcribe" | "translate">("transcribe");
  const [busy, setBusy] = useState<BusyAction>("");
  const [health, setHealth] = useState<YoutubeToolsHealth | null>(null);
  const [jobs, setJobs] = useState<YoutubeToolsJob[]>([]);
  const [downloadResult, setDownloadResult] = useState<YoutubeDownloadResult | null>(null);
  const [transcriptResult, setTranscriptResult] = useState<YoutubeTranscriptResult | null>(null);
  const refreshJobsInFlightRef = useRef(false);
  const ready = Boolean(health?.ytDlp.ok && health?.whisper.ok && health?.ffmpeg.ok);

  useEffect(() => {
    void refreshHealth();
    void refreshJobs();
  }, []);

  useEffect(() => openBackgroundJobsSocket((snapshot) => {
    applyJobsSnapshot(snapshot);
  }), []);

  useEffect(() => {
    const hasActiveJob = jobs.some((job) => job.status === "queued" || job.status === "running");
    if (!hasActiveJob) return undefined;
    const timer = window.setInterval(() => { void refreshJobs(); }, 30000);
    return () => window.clearInterval(timer);
  }, [jobs]);

  const healthItems = useMemo(() => health ? [
    { label: "yt-dlp", status: health.ytDlp },
    { label: "Whisper", status: health.whisper },
    { label: "FFmpeg", status: health.ffmpeg },
    { label: "Python", status: health.python },
  ] : [], [health]);

  async function refreshHealth() {
    setBusy("health");
    try {
      setHealth(await getYoutubeToolsHealth());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not check YouTube tools.", "Không kiểm tra được YouTube tools."));
    } finally {
      setBusy("");
    }
  }

  async function refreshJobs() {
    if (refreshJobsInFlightRef.current) return;
    refreshJobsInFlightRef.current = true;
    try {
      const nextJobs = await listYoutubeToolsJobs();
      applyYoutubeJobs(nextJobs);
    } catch {
      // The global notifier will surface active-job failures; avoid noisy polling toasts here.
    } finally {
      refreshJobsInFlightRef.current = false;
    }
  }

  function applyJobsSnapshot(snapshot: BackgroundJobsSnapshot) {
    applyYoutubeJobs(snapshot.youtubeJobs);
  }

  function applyYoutubeJobs(nextJobs: YoutubeToolsJob[]) {
    setJobs(nextJobs);
    const latestDownload = nextJobs.find((job) => job.kind === "download" && job.status === "success" && job.result)?.result;
    const latestTranscript = nextJobs.find((job) => job.kind === "transcript" && job.status === "success" && job.result)?.result;
    if (latestDownload && "relativePath" in latestDownload) setDownloadResult(latestDownload);
    if (latestTranscript && "transcriptText" in latestTranscript) setTranscriptResult(latestTranscript);
  }

  async function handleDownload(mode: YoutubeDownloadMode) {
    const action: BusyAction = mode === "audio" ? "download-audio" : "download-video";
    setBusy(action);
    try {
      const job = await startYoutubeDownloadJob({ url: videoUrl, mode, maxHeight: Number(maxHeight), fileName });
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      toast.success(text(lang, "Download job is running in background.", "Job tải YouTube đang chạy nền."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Download failed.", "Tải thất bại."));
    } finally {
      setBusy("");
    }
  }

  async function handleTranscript(source: "url" | "file") {
    setBusy(source === "file" ? "transcript-file" : "transcript-url");
    try {
      const job = await startYoutubeTranscriptJob({
        ...(source === "file" && downloadResult ? { sourceRelativePath: downloadResult.relativePath } : { url: videoUrl }),
        model,
        language,
        task,
      });
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      toast.success(text(lang, "Transcript job is running in background.", "Job transcript đang chạy nền."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Transcript failed.", "Lấy transcript thất bại."));
    } finally {
      setBusy("");
    }
  }

  async function copyTranscript() {
    if (!transcriptResult?.transcriptText) return;
    await navigator.clipboard.writeText(transcriptResult.transcriptText);
    toast.success(text(lang, "Transcript copied.", "Đã copy transcript."));
  }

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <section className="mx-auto max-w-6xl space-y-4">
        <Card className="border-border/70 bg-card/95">
          <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Youtube className="h-6 w-6 text-red-400" /> YouTube Tools
              </CardTitle>
              <CardDescription>
                {text(lang, "Download YouTube video/audio and create transcripts with local Whisper.", "Tải video/audio YouTube và lấy transcript bằng Whisper local.")}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={refreshHealth} disabled={Boolean(busy)}>
              <RefreshCcw className="mr-2 h-4 w-4" /> {text(lang, "Check tools", "Kiểm tra tools")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-4">
              {healthItems.map((item) => <ToolStatus key={item.label} label={item.label} ok={item.status.ok} value={item.status.ok ? item.status.version || "OK" : item.status.detail || "Missing"} />)}
            </div>
            {health && !ready ? (
              <Alert className="border-amber-500/40 bg-amber-500/10">
                <Settings2 className="h-4 w-4" />
                <AlertTitle>{text(lang, "Missing background tools", "Thiếu công cụ nền")}</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{text(lang, "Install the missing tools, then click Check tools again.", "Cài công cụ còn thiếu rồi bấm Kiểm tra tools lại.")}</p>
                  <code className="block rounded bg-background/80 p-2 text-xs">python -m pip install -U yt-dlp openai-whisper</code>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>{text(lang, "Download from YouTube", "Tải từ YouTube")}</CardTitle>
              <CardDescription>{text(lang, "Paste a YouTube link, choose video/audio, then save to generated-videos.", "Dán link YouTube, chọn video/audio rồi lưu vào generated-videos.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input id="youtube-url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="youtube-file-name">{text(lang, "File name", "Tên file")}</Label>
                  <Input id="youtube-file-name" value={fileName} onChange={(event) => setFileName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Max video quality", "Chất lượng video tối đa")}</Label>
                  <Select value={maxHeight} onValueChange={setMaxHeight}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720">720p</SelectItem>
                      <SelectItem value="1080">1080p</SelectItem>
                      <SelectItem value="1440">1440p</SelectItem>
                      <SelectItem value="2160">2160p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Output", "Đầu ra")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleDownload("video")} disabled={Boolean(busy) || !videoUrl.trim()}>
                      <FileVideo className="mr-2 h-4 w-4" /> Video
                    </Button>
                    <Button variant="secondary" onClick={() => handleDownload("audio")} disabled={Boolean(busy) || !videoUrl.trim()}>
                      <FileAudio className="mr-2 h-4 w-4" /> MP3
                    </Button>
                  </div>
                </div>
              </div>
              {busy === "download-video" || busy === "download-audio" ? <p className="text-sm text-muted-foreground">{text(lang, "Starting background job...", "Đang tạo job chạy nền...")}</p> : null}
              {downloadResult ? <DownloadResultCard lang={lang} result={downloadResult} /> : null}
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>{text(lang, "Transcript", "Transcript")}</CardTitle>
              <CardDescription>{text(lang, "Use local Whisper to transcribe the YouTube link or the last downloaded video.", "Dùng Whisper local để lấy transcript từ link hoặc file vừa tải.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label>{text(lang, "Whisper model", "Model Whisper")}</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiny">tiny</SelectItem>
                      <SelectItem value="base">base</SelectItem>
                      <SelectItem value="small">small</SelectItem>
                      <SelectItem value="medium">medium</SelectItem>
                      <SelectItem value="large">large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Language", "Ngôn ngữ")}</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{text(lang, "Task", "Tác vụ")}</Label>
                  <Select value={task} onValueChange={(value) => setTask(value === "translate" ? "translate" : "transcribe")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transcribe">Transcribe</SelectItem>
                      <SelectItem value="translate">Translate to English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Button onClick={() => handleTranscript("url")} disabled={Boolean(busy) || !videoUrl.trim()}>
                  <FileText className="mr-2 h-4 w-4" /> {text(lang, "Transcript from URL", "Lấy transcript từ link")}
                </Button>
                <Button variant="outline" onClick={() => handleTranscript("file")} disabled={Boolean(busy) || !downloadResult?.relativePath}>
                  <FileText className="mr-2 h-4 w-4" /> {text(lang, "Transcript last downloaded file", "Lấy transcript file vừa tải")}
                </Button>
              </div>
              {busy === "transcript-url" || busy === "transcript-file" ? <p className="text-sm text-muted-foreground">{text(lang, "Starting background job...", "Đang tạo job chạy nền...")}</p> : null}
            </CardContent>
          </Card>
        </div>

        {jobs.length ? <YoutubeJobsCard jobs={jobs} /> : null}
        {transcriptResult ? <TranscriptCard lang={lang} result={transcriptResult} onCopy={copyTranscript} /> : null}
      </section>
    </main>
  );
}

function ToolStatus(props: { label: string; ok: boolean; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium">{props.label}</span>
        <Badge variant={props.ok ? "default" : "secondary"} className={props.ok ? "bg-emerald-600/20 text-emerald-200" : "bg-amber-500/15 text-amber-200"}>{props.ok ? "OK" : "Missing"}</Badge>
      </div>
      <p className="line-clamp-2 break-all text-xs text-muted-foreground">{props.value}</p>
    </div>
  );
}

function DownloadResultCard(props: { lang: Lang; result: YoutubeDownloadResult }) {
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">{props.result.fileName}</p>
          <p className="break-all text-xs text-muted-foreground">{props.result.savedTo}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(props.result.sizeBytes)}</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={props.result.url} download target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /> {text(props.lang, "Download", "Tải file")}</a>
        </Button>
      </div>
    </div>
  );
}

function TranscriptCard(props: { lang: Lang; result: YoutubeTranscriptResult; onCopy: () => void }) {
  const links = Object.entries(props.result.files).filter(([, url]) => Boolean(url));
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{text(props.lang, "Transcript result", "Kết quả transcript")}</CardTitle>
          <CardDescription>{props.result.sourceLabel}</CardDescription>
        </div>
        <Button variant="outline" onClick={props.onCopy}><Clipboard className="mr-2 h-4 w-4" /> {text(props.lang, "Copy text", "Copy text")}</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={props.result.transcriptText} readOnly className="min-h-[320px] font-mono text-sm" />
        <div className="flex flex-wrap gap-2">
          {links.map(([kind, url]) => (
            <Button key={kind} asChild variant="secondary" size="sm">
              <a href={url} target="_blank" rel="noreferrer">.{kind}</a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function YoutubeJobsCard(props: { jobs: YoutubeToolsJob[] }) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" /> Background jobs
        </CardTitle>
        <CardDescription>Tiến trình và log chạy nền vẫn được giữ khi chuyển page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.jobs.slice(0, 5).map((job) => (
          <div key={job.id} className="rounded-lg border border-border/70 bg-background/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="line-clamp-1 font-medium">{job.title}</p>
                <p className="text-xs text-muted-foreground">{job.kind} · {job.status}</p>
              </div>
              <Badge variant={job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
            </div>
            <Progress value={Math.round(job.progress)} className="mt-3 h-2" />
            <pre className="mt-3 max-h-32 overflow-auto rounded bg-black/80 p-3 text-xs text-slate-100">
              {(job.logs.length ? job.logs.slice(-8) : ["Đang chờ log..."]).join("\n")}
              {job.error ? `\n${job.error}` : ""}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
