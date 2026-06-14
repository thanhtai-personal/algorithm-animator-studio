import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Circle, Clock3, Loader2, Play, RefreshCcw, Sparkles, Wand2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  getAgentPresets,
  listAgentVideoJobs,
  runAgentVideoJob,
  runDueAgentVideoJobs,
  type AgentPreset,
  type AgentVideoForm,
  type AgentVideoJob,
  type AgentVideoPlan,
  type AgentVideoPublishTarget,
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
  agentPreset: "algorithm-shorts",
  autoCreatePublishJobs: false,
  publishTargets: ["youtube"],
  publishPrivacyStatus: "private",
  publishScheduledAt: "",
};

export default function AiVideoAgent() {
  const lang = useSystemLang();
  const vi = lang === "vi";
  const [form, setForm] = useState<AgentVideoForm>(DEFAULT_FORM);
  const [plan, setPlan] = useState<AgentVideoPlan | null>(null);
  const [jobs, setJobs] = useState<AgentVideoJob[]>([]);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [presets, setPresets] = useState<AgentPreset[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [busyJobId, setBusyJobId] = useState("");
  const latestJob = jobs[0];
  const activeJob = jobs.find((job) => job.status === "running") || latestJob;
  const availableModels = useMemo(() => models.filter((model) => model.lang === form.language), [models, form.language]);

  useEffect(() => {
    refresh();
    getPiperModels().then(setModels).catch(() => undefined);
    getAgentPresets().then(setPresets).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!jobs.some((job) => job.status === "running" || job.status === "queued")) return;
    const timer = window.setInterval(refresh, 1200);
    return () => window.clearInterval(timer);
  }, [jobs]);

  async function refresh() {
    try { setJobs(await listAgentVideoJobs()); } catch { /* ignore polling noise */ }
  }

  async function handleCreatePlan() {
    setLoadingPlan(true);
    try {
      const nextPlan = await createAgentVideoPlan(form);
      setPlan(nextPlan);
      toast.success(text(lang, "Plan created", "Đã tạo plan"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not create plan", "Không tạo được plan"));
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    try {
      const job = await createAgentVideoJob({ ...form, plan: plan || undefined, runNow: true });
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      toast.success(text(lang, "Agent is running locally", "Agent đang chạy local"));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not run agent", "Không chạy được agent"));
    } finally {
      setRunning(false);
    }
  }

  async function handleSaveDraft() {
    try {
      const job = await createAgentVideoJob({ ...form, plan: plan || undefined });
      setJobs((current) => [job, ...current]);
      toast.success(text(lang, "Draft job saved", "Đã lưu job nháp"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not save job", "Không lưu được job"));
    }
  }

  async function handleRunDue() {
    setRunning(true);
    try {
      const result = await runDueAgentVideoJobs();
      toast.success(text(lang, `Ran ${result.ran} due jobs`, `Đã chạy ${result.ran} job tới lịch`));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not run due jobs", "Không chạy được job tới lịch"));
    } finally {
      setRunning(false);
    }
  }

  async function handleRunJob(job: AgentVideoJob) {
    setBusyJobId(job.id);
    try {
      const result = await runAgentVideoJob(job.id);
      setJobs((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not run job", "Không chạy được job"));
    } finally {
      setBusyJobId("");
    }
  }

  function applyPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    setForm((current) => preset ? { ...current, ...preset, agentPreset: preset.id } : { ...current, agentPreset: id });
  }

  function update<K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePublishTarget(target: AgentVideoPublishTarget, enabled: boolean) {
    const current = form.publishTargets || [];
    update("publishTargets", enabled ? Array.from(new Set([...current, target])) : current.filter((item) => item !== target));
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Bot className="h-3.5 w-3.5" />Local Agent</Badge>
            <Badge variant="outline">Create → Publish → Engage → Monetize</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{text(lang, "AI Video Agent Flow", "AI Video Agent Flow")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {text(lang, "AiToEarn-style workflow adapted for the local desktop app: research, script, voice, render, queue publish jobs and show the live pipeline.", "Workflow kiểu AiToEarn nhưng thích ứng local desktop: research, script, voice, render, đưa vào publish queue và visualize real-time luồng chạy.")}
          </p>
        </div>
        <Button variant="outline" onClick={handleRunDue} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{text(lang, "Run scheduled", "Chạy job tới lịch")}
        </Button>
      </div>

      <WorkflowVisualizer job={activeJob} lang={lang} />

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{text(lang, "Agent control", "Điều khiển Agent")}</CardTitle>
            <CardDescription>{text(lang, "Everything runs through the local backend; no cloud hosting is required.", "Tất cả chạy qua backend local, không cần nuôi host cloud.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label={text(lang, "Agent preset", "Agent preset")}>
              <Select value={form.agentPreset || "custom"} onValueChange={applyPreset}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.title}</SelectItem>)}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={text(lang, "Video topic", "Chủ đề video")}><Input value={form.topic} onChange={(event) => update("topic", event.target.value)} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={text(lang, "Content kind", "Loại nội dung")}>
                <Select value={form.kind} onValueChange={(value) => update("kind", value as AgentVideoForm["kind"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="algorithm">Algorithm</SelectItem><SelectItem value="football">Football/MU</SelectItem><SelectItem value="story">Story</SelectItem><SelectItem value="generic">Generic</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={text(lang, "Platform", "Nền tảng")}>
                <Select value={form.platform} onValueChange={(value) => update("platform", value as AgentVideoForm["platform"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="youtube-short">YouTube Short 9:16</SelectItem><SelectItem value="youtube-long">YouTube Long 16:9</SelectItem><SelectItem value="tiktok">TikTok 9:16</SelectItem><SelectItem value="facebook-reel">Facebook Reel 9:16</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={text(lang, "Language", "Ngôn ngữ")}>
                <Select value={form.language} onValueChange={(value) => update("language", value as AgentVideoForm["language"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vi">Tiếng Việt</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={text(lang, "Target seconds", "Thời lượng giây")}><Input type="number" min={15} max={600} value={form.targetDurationSec} onChange={(event) => update("targetDurationSec", Number(event.target.value))} /></Field>
            </div>
            <Field label="Piper voice model">
              <Select value={form.piperModelKey} onValueChange={(value) => update("piperModelKey", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(availableModels.length ? availableModels : models).map((model) => <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " (missing)"}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={text(lang, "Speech rate", "Tốc độ đọc")}><Input type="number" step="0.05" value={form.speechRate} onChange={(event) => update("speechRate", Number(event.target.value))} /></Field>
              <Field label={text(lang, "Sentence silence", "Nghỉ giữa câu")}><Input type="number" step="0.05" value={form.sentenceSilence} onChange={(event) => update("sentenceSilence", Number(event.target.value))} /></Field>
            </div>
            <Field label="Tone"><Input value={form.tone} onChange={(event) => update("tone", event.target.value)} /></Field>
            <Field label={text(lang, "Extra instruction", "Yêu cầu thêm")}><Textarea value={form.extraInstruction} onChange={(event) => update("extraInstruction", event.target.value)} rows={4} /></Field>
            <PublishOptions form={form} lang={lang} update={update} toggleTarget={togglePublishTarget} />
            <div className="grid gap-2 sm:grid-cols-3">
              <Button onClick={handleCreatePlan} disabled={loadingPlan || running} variant="outline">{loadingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}{text(lang, "Create plan", "Tạo plan")}</Button>
              <Button onClick={handleRunNow} disabled={running || loadingPlan} className="sm:col-span-2">{running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{text(lang, "Run full agent", "Chạy full agent")}</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleSaveDraft}>{text(lang, "Save draft job", "Lưu job nháp")}</Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="plan" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="plan">Plan</TabsTrigger><TabsTrigger value="latest">Live job</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          <TabsContent value="plan"><PlanCard plan={plan || latestJob?.plan || null} lang={lang} /></TabsContent>
          <TabsContent value="latest"><JobCard job={latestJob} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
          <TabsContent value="logs"><LogCard job={activeJob} lang={lang} /></TabsContent>
          <TabsContent value="history" className="space-y-3">{jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} lang={lang} busy={busyJobId === job.id} onRun={handleRunJob} compact />) : <Empty lang={lang} />}</TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function WorkflowVisualizer({ job, lang }: { job?: AgentVideoJob; lang: Lang }) {
  const vi = lang === "vi";
  const steps = job?.steps || [];
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4" />{text(lang, "Live workflow visualization", "Visualize luồng chạy real-time")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3"><Progress value={job?.progress || 0} className="h-2" /><span className="w-12 text-right text-xs text-muted-foreground">{Math.round(job?.progress || 0)}%</span></div>
        <div className="grid gap-2 md:grid-cols-5">
          {(steps.length ? steps : fallbackSteps()).map((step) => <div key={step.id} className="rounded-lg border bg-card p-3"><div className="flex items-center gap-2 text-sm font-medium"><StatusIcon status={step.status} />{step.label}</div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{step.message || text(lang, "Waiting", "Đang chờ")}</p></div>)}
        </div>
        {!job ? <p className="text-xs text-muted-foreground">{text(lang, "Create a job to see the pipeline move in real time.", "Tạo job để xem pipeline chạy real-time.")}</p> : <p className="text-xs text-muted-foreground">{vi ? "Job" : "Job"}: {job.id.slice(0, 8)} · {job.status} · {job.currentStep || "idle"}</p>}
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan, lang }: { plan: AgentVideoPlan | null; lang: Lang }) {
  if (!plan) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No plan yet.", "Chưa có plan.")}</Card>;
  return <Card><CardHeader><CardTitle className="flex flex-wrap items-center gap-2">{plan.title}{plan.warning ? <Badge variant="secondary">fallback</Badge> : <Badge>AI</Badge>}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="space-y-4"><InfoList title="Research" items={[plan.researchSummary || "", plan.audiencePersona || "", ...(plan.contentAngles || [])]} /><InfoList title="Scenes" items={plan.scenes.map((scene) => `${scene.title}: ${scene.narration}`)} /><InfoList title="Engage / Monetize" items={[...(plan.engagementPrompts || []), ...(plan.monetizationIdeas || []), ...(plan.repurposeIdeas || [])]} /><div className="flex flex-wrap gap-2">{plan.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div></CardContent></Card>;
}

function JobCard({ job, lang, busy, onRun, compact }: { job?: AgentVideoJob; lang: Lang; busy: boolean; onRun: (job: AgentVideoJob) => void; compact?: boolean }) {
  if (!job) return <Empty lang={lang} />;
  return <Card><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{job.plan?.title || job.input.topic}</CardTitle><CardDescription>{new Date(job.createdAtMs).toLocaleString()} · {job.status}</CardDescription></div><Badge variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge></div></CardHeader><CardContent className="space-y-3"><Progress value={job.progress} /><p className="text-sm text-muted-foreground">{job.currentStep || job.error || "Idle"}</p>{job.error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{job.error}</p> : null}{job.artifacts?.videoUrl ? <video src={job.artifacts.videoUrl} controls className="max-h-[360px] w-full rounded-lg border bg-black" /> : null}{job.artifacts?.publishJobIds?.length ? <p className="text-xs text-muted-foreground">Publish jobs: {job.artifacts.publishJobIds.length}</p> : null}{!compact && <Button onClick={() => onRun(job)} disabled={busy || job.status === "running"}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{text(lang, "Run / rerun", "Chạy / chạy lại")}</Button>}</CardContent></Card>;
}

function LogCard({ job, lang }: { job?: AgentVideoJob; lang: Lang }) {
  if (!job) return <Empty lang={lang} />;
  return <Card><CardContent className="space-y-2 pt-6">{(job.logs || []).length ? job.logs.map((log) => <div key={log.id} className="rounded-md border p-3 text-sm"><div className="flex items-center justify-between gap-3"><Badge variant={log.level === "error" ? "destructive" : "outline"}>{log.level}</Badge><span className="text-xs text-muted-foreground">{new Date(log.atMs).toLocaleTimeString()}</span></div><p className="mt-2 text-muted-foreground">{log.message}</p></div>) : <p className="text-sm text-muted-foreground">{text(lang, "No logs yet.", "Chưa có log.")}</p>}</CardContent></Card>;
}

function PublishOptions({ form, lang, update, toggleTarget }: { form: AgentVideoForm; lang: Lang; update: <K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) => void; toggleTarget: (target: AgentVideoPublishTarget, enabled: boolean) => void }) {
  const targets: AgentVideoPublishTarget[] = ["youtube", "facebook", "tiktok", "instagram"];
  return <div className="rounded-lg border p-3"><label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={Boolean(form.autoCreatePublishJobs)} onCheckedChange={(value) => update("autoCreatePublishJobs", Boolean(value))} />{text(lang, "Auto-create publish jobs after render", "Tự tạo publish job sau khi render")}</label><div className="mt-3 grid gap-2 sm:grid-cols-2">{targets.map((target) => <label key={target} className="flex items-center gap-2 text-sm"><Checkbox checked={(form.publishTargets || []).includes(target)} onCheckedChange={(value) => toggleTarget(target, Boolean(value))} />{target}</label>)}</div><div className="mt-3 grid gap-3 sm:grid-cols-2"><Input placeholder="Publish scheduled at" value={form.publishScheduledAt || ""} onChange={(event) => update("publishScheduledAt", event.target.value)} /><Input placeholder="YouTube privacy" value={form.publishPrivacyStatus || "private"} onChange={(event) => update("publishPrivacyStatus", event.target.value)} /></div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function InfoList({ title, items }: { title: string; items: string[] }) { const filtered = items.filter(Boolean); if (!filtered.length) return null; return <div><h3 className="mb-2 text-sm font-semibold">{title}</h3><div className="space-y-2">{filtered.map((item, index) => <p key={`${title}-${index}`} className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{item}</p>)}</div></div>; }
function Empty({ lang }: { lang: Lang }) { return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No data yet.", "Chưa có dữ liệu.")}</Card>; }
function StatusIcon({ status }: { status: string }) { if (status === "running") return <Loader2 className="h-4 w-4 animate-spin" />; if (status === "done") return <CheckCircle2 className="h-4 w-4" />; if (status === "failed") return <XCircle className="h-4 w-4" />; if (status === "skipped") return <Clock3 className="h-4 w-4" />; return <Circle className="h-4 w-4" />; }
function fallbackSteps() { return ["Research", "Strategy", "Script", "Visual", "Voice", "Render", "Metadata", "Publish", "Engage", "Monetize"].map((label, index) => ({ id: String(index), label, status: "pending", message: "" })); }
