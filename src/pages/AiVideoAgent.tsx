import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bot, CalendarClock, CheckCircle2, Loader2, Play, RefreshCcw, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSystemLang } from "@/hooks/use-system-lang";
import {
  createAgentVideoJob,
  createAgentVideoPlan,
  listAgentVideoJobs,
  runAgentVideoJob,
  runDueAgentVideoJobs,
  type AgentVideoForm,
  type AgentVideoJob,
  type AgentVideoPlan,
} from "@/lib/aiVideoAgentApi";
import { text, type Lang } from "@/lib/i18n";
import { getPiperModels, type PiperModel } from "@/lib/voiceApi";

const DEFAULT_FORM: AgentVideoForm = {
  topic: "Bubble Sort explained visually",
  kind: "algorithm",
  platform: "youtube-short",
  language: "vi",
  tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts",
  targetDurationSec: 45,
  extraInstruction: "Tập trung vào hình ảnh trực quan, tránh nói quá học thuật.",
  piperModelKey: "vi_vais1000",
  speechRate: 0.9,
  sentenceSilence: 0.25,
};

export default function AiVideoAgent() {
  const lang = useSystemLang();
  const vi = lang === "vi";
  const [form, setForm] = useState<AgentVideoForm>(DEFAULT_FORM);
  const [plan, setPlan] = useState<AgentVideoPlan | null>(null);
  const [jobs, setJobs] = useState<AgentVideoJob[]>([]);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [busyJobId, setBusyJobId] = useState("");
  const latestJob = jobs[0] || null;
  const availableModels = useMemo(() => models.filter((model) => model.available), [models]);

  useEffect(() => {
    void refreshJobs();
    getPiperModels().then(setModels).catch(() => setModels([]));
  }, []);

  async function refreshJobs() {
    try {
      setJobs(await listAgentVideoJobs());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tải được lịch sử agent.", "Could not load agent jobs."));
    }
  }

  async function handleCreatePlan() {
    setLoadingPlan(true);
    try {
      const nextPlan = await createAgentVideoPlan(form);
      setPlan(nextPlan);
      toast.success(txt(vi, "Đã tạo plan AI.", "AI plan created."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tạo được plan AI.", "Could not create AI plan."));
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    try {
      const job = await createAgentVideoJob({ ...form, plan: plan || undefined, runNow: true });
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      setPlan(job.plan || plan);
      if (job.status === "success") toast.success(txt(vi, "Agent đã tạo video xong.", "Agent video created."));
      if (job.status === "failed") toast.error(job.error || txt(vi, "Agent thất bại.", "Agent failed."));
      await refreshJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chạy được agent.", "Could not run agent."));
    } finally {
      setRunning(false);
    }
  }

  async function handleQueue() {
    try {
      const job = await createAgentVideoJob({ ...form, plan: plan || undefined });
      setJobs((current) => [job, ...current]);
      toast.success(txt(vi, "Đã lưu job nháp. Có thể chạy lại sau.", "Draft job saved. You can run it later."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không lưu được job.", "Could not save job."));
    }
  }

  async function handleRunJob(job: AgentVideoJob) {
    setBusyJobId(job.id);
    try {
      const nextJob = await runAgentVideoJob(job.id);
      setJobs((current) => current.map((item) => item.id === nextJob.id ? nextJob : item));
      if (nextJob.status === "success") toast.success(txt(vi, "Job đã render xong.", "Job rendered."));
      if (nextJob.status === "failed") toast.error(nextJob.error || txt(vi, "Job lỗi.", "Job failed."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chạy được job.", "Could not run job."));
    } finally {
      setBusyJobId("");
    }
  }

  async function handleRunDue() {
    setBusyJobId("due");
    try {
      const result = await runDueAgentVideoJobs();
      toast.success(txt(vi, `Đã chạy ${result.ran} job đến lịch.`, `Ran ${result.ran} due job(s).`));
      await refreshJobs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : txt(vi, "Không chạy được lịch.", "Could not run due jobs."));
    } finally {
      setBusyJobId("");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-6 text-foreground 2xl:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Bot className="h-6 w-6" /> AI Video Agent</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {txt(vi, "Agent flow local: AI lập kế hoạch → tạo script → tạo voice Piper → render MP4 bằng FFmpeg → lưu vào thư viện video. Không cần cloud host.", "Local agent flow: AI plans → writes script → creates Piper voice → renders MP4 with FFmpeg → saves to the video library. No cloud host required.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshJobs}><RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại", "Refresh")}</Button>
          <Button variant="outline" onClick={handleRunDue} disabled={busyJobId === "due"}><CalendarClock className="mr-2 h-4 w-4" />{txt(vi, "Chạy job đến lịch", "Run due")}</Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-fit border-border/70">
          <CardHeader>
            <CardTitle>{txt(vi, "1. Cấu hình agent", "1. Agent setup")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={txt(vi, "Chủ đề video", "Video topic")}>
              <Input value={form.topic} onChange={(event) => update("topic", event.target.value)} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={txt(vi, "Loại nội dung", "Content kind")}>
                <Select value={form.kind} onValueChange={(value) => update("kind", value as AgentVideoForm["kind"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="algorithm">Algorithm</SelectItem>
                    <SelectItem value="football">Football/MU</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="generic">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={txt(vi, "Nền tảng", "Platform")}>
                <Select value={form.platform} onValueChange={(value) => update("platform", value as AgentVideoForm["platform"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube-short">YouTube Short 9:16</SelectItem>
                    <SelectItem value="youtube-long">YouTube Long 16:9</SelectItem>
                    <SelectItem value="tiktok">TikTok 9:16</SelectItem>
                    <SelectItem value="facebook-reel">Facebook Reel 9:16</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={txt(vi, "Ngôn ngữ", "Language")}>
                <Select value={form.language} onValueChange={(value) => update("language", value as AgentVideoForm["language"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vi">Tiếng Việt</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={txt(vi, "Thời lượng mục tiêu", "Target duration")}>
                <Input type="number" min={15} max={600} value={form.targetDurationSec} onChange={(event) => update("targetDurationSec", Number(event.target.value))} />
              </Field>
            </div>
            <Field label="Piper voice model">
              <Select value={form.piperModelKey} onValueChange={(value) => update("piperModelKey", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(availableModels.length ? availableModels : models).map((model) => (
                    <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " (missing)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={txt(vi, "Tốc độ đọc", "Speech rate")}>
                <Input type="number" step="0.05" value={form.speechRate} onChange={(event) => update("speechRate", Number(event.target.value))} />
              </Field>
              <Field label={txt(vi, "Nghỉ giữa câu", "Sentence silence")}>
                <Input type="number" step="0.05" value={form.sentenceSilence} onChange={(event) => update("sentenceSilence", Number(event.target.value))} />
              </Field>
            </div>
            <Field label={txt(vi, "Tone", "Tone")}>
              <Input value={form.tone} onChange={(event) => update("tone", event.target.value)} />
            </Field>
            <Field label={txt(vi, "Yêu cầu thêm", "Extra instruction")}>
              <Textarea value={form.extraInstruction} onChange={(event) => update("extraInstruction", event.target.value)} rows={4} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button onClick={handleCreatePlan} disabled={loadingPlan || running} variant="outline">
                {loadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{txt(vi, "Tạo plan", "Create plan")}
              </Button>
              <Button onClick={handleRunNow} disabled={running || loadingPlan} className="sm:col-span-2">
                {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{txt(vi, "Tạo video ngay", "Create video now")}
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleQueue}>{txt(vi, "Lưu job nháp", "Save draft job")}</Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="plan" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:w-[520px]">
            <TabsTrigger value="plan">{txt(vi, "Plan", "Plan")}</TabsTrigger>
            <TabsTrigger value="latest">{txt(vi, "Job mới nhất", "Latest job")}</TabsTrigger>
            <TabsTrigger value="history">{txt(vi, "Lịch sử", "History")}</TabsTrigger>
          </TabsList>
          <TabsContent value="plan"><PlanCard plan={plan} lang={lang} /></TabsContent>
          <TabsContent value="latest"><JobCard job={latestJob} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
          <TabsContent value="history" className="space-y-3">
            {jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} lang={lang} busy={busyJobId === job.id} onRun={handleRunJob} compact />) : <Empty lang={lang} />}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );

  function update<K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function PlanCard({ plan, lang }: { plan: AgentVideoPlan | null; lang: Lang }) {
  const vi = lang === "vi";
  if (!plan) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{txt(vi, "Chưa có plan. Nhấn Tạo plan hoặc Tạo video ngay.", "No plan yet. Click Create plan or Create video now.")}</Card>;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">{plan.title}{plan.warning ? <Badge variant="secondary">fallback</Badge> : <Badge>AI</Badge>}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        <div className="flex flex-wrap gap-2">{plan.tags.map((tag) => <Badge key={tag} variant="outline">#{tag}</Badge>)}</div>
        <div className="grid gap-3">
          {plan.scenes.map((scene, index) => (
            <article key={scene.id} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-medium">{index + 1}. {scene.title}</h3><Badge variant="secondary">{scene.durationSec}s</Badge></div>
              <p className="text-sm">{scene.narration}</p>
              <p className="mt-2 text-xs text-muted-foreground">{scene.visualPrompt}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function JobCard({ job, lang, busy, onRun, compact }: { job: AgentVideoJob | null; lang: Lang; busy: boolean; compact?: boolean; onRun: (job: AgentVideoJob) => void }) {
  const vi = lang === "vi";
  if (!job) return <Empty lang={lang} />;
  return (
    <Card className="border-border/70">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{job.plan?.title || job.input.topic}</h3><StatusBadge status={job.status} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(job.updatedAtMs)} · {job.currentStep || job.status}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onRun(job)} disabled={busy || job.status === "running" || job.status === "success"}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{txt(vi, "Chạy", "Run")}
          </Button>
        </div>
        <Progress value={job.progress} />
        {job.error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{job.error}</p> : null}
        {!compact ? <StepList job={job} /> : null}
        {job.artifacts?.videoUrl ? (
          <div className="space-y-2">
            <video controls className="aspect-video max-h-[520px] w-full rounded-xl bg-black object-contain" src={job.artifacts.videoUrl} />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><a href={job.artifacts.videoUrl} target="_blank" rel="noreferrer">{txt(vi, "Mở video", "Open video")}</a></Button>
              <Badge variant="outline">{job.artifacts.videoRelativePath}</Badge>
            </div>
          </div>
        ) : null}
        {job.artifacts?.metadata ? <MetadataBlock metadata={job.artifacts.metadata} /> : null}
      </CardContent>
    </Card>
  );
}

function StepList({ job }: { job: AgentVideoJob }) {
  return <div className="grid gap-2 md:grid-cols-5">{job.steps.map((step) => <div key={step.id} className="rounded-lg border p-2 text-xs"><div className="flex items-center gap-1 font-medium"><CheckCircle2 className={step.status === "done" ? "h-3.5 w-3.5 text-emerald-400" : "h-3.5 w-3.5 text-muted-foreground"} />{step.label}</div><p className="mt-1 text-muted-foreground">{step.message || step.status}</p></div>)}</div>;
}

function MetadataBlock({ metadata }: { metadata: { title: string; description: string; tags: string } }) {
  return <div className="rounded-xl border bg-muted/20 p-3 text-sm"><p className="font-medium">{metadata.title}</p><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{metadata.description}</p><p className="mt-2 text-xs text-muted-foreground">{metadata.tags}</p></div>;
}

function StatusBadge({ status }: { status: AgentVideoJob["status"] }) {
  const variant: "default" | "destructive" | "secondary" = status === "success" ? "default" : status === "failed" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Empty({ lang }: { lang: Lang }) {
  return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No agent jobs yet.", "Chưa có agent job nào.")}</Card>;
}

function formatDate(value: number) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
