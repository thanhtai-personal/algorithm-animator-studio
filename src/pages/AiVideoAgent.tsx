import { useEffect, useMemo, useState } from "react";
import { Bot, Loader2, PanelRightClose, PanelRightOpen, Play, RefreshCcw, Terminal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  type AgentWorkflowStageId,
} from "@/lib/aiVideoAgentApi";
import { text, type Lang } from "@/lib/i18n";
import { getElevenLabsConfig, getPiperModels, getRvcApplioConfig, getSupertonicConfig, getVieneuConfig, type ElevenLabsConfig, type PiperModel, type RvcApplioConfig, type SupertonicConfig, type VieneuConfig } from "@/lib/voiceApi";
import { getPublishJobs, type PublishJob } from "@/lib/publishQueueApi";
import { AgentFlowGraph } from "@/features/ai-video-agent/components/AgentFlowGraph";
import { AgentSettingsForm } from "@/features/ai-video-agent/components/AgentSettingsForm";
import { AgentSelectedChannelVideos } from "@/features/ai-video-agent/components/AgentSelectedChannelVideos";
import { channelsFromKeys, getAgentPublishChannelOptions, getPreferredChannelKeys, type AgentPublishChannelOption } from "@/features/ai-video-agent/lib/publishChannelOptions";

const DEFAULT_FORM: AgentVideoForm = {
  topic: "Bubble Sort explained visually",
  kind: "algorithm",
  platform: "youtube-short",
  language: "vi",
  tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts",
  targetDurationSec: 45,
  extraInstruction: "Tập trung vào hình ảnh trực quan, tránh nói quá học thuật.",
  voiceProvider: "piper",
  piperModelKey: "vi_vais1000",
  elevenModelId: "eleven_flash_v2_5",
  elevenVoiceId: "",
  supertonicVoice: "M1",
  supertonicTotalSteps: 8,
  vieneuVoiceId: "",
  vieneuMode: "turbo",
  vieneuEmotion: "natural",
  applioTtsTemplateId: "",
  speechRate: 0.9,
  sentenceSilence: 0.25,
  agentPreset: "algorithm-shorts",
  autoCreatePublishJobs: false,
  publishTargets: ["youtube"],
  publishChannels: [],
  publishPrivacyStatus: "private",
  publishScheduledAt: "",
};

const KIND_DEFAULTS: Record<AgentVideoForm["kind"], Partial<AgentVideoForm>> = {
  algorithm: {
    agentPreset: "algorithm-shorts",
    topic: "Bubble Sort explained visually",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, nhịp nhanh, có hook mạnh, phù hợp Shorts",
    targetDurationSec: 45,
    extraInstruction: "Tập trung vào hình ảnh trực quan, tránh nói quá học thuật.",
  },
  football: {
    agentPreset: "mu-news",
    topic: "Tin mới Manchester United",
    platform: "youtube-short",
    language: "vi",
    tone: "Nhiệt, gãy gọn, hơi bình luận bóng đá, không giật tít quá đà.",
    targetDurationSec: 55,
    extraInstruction: "Không bịa số liệu chuyển nhượng. Nếu thiếu nguồn thì ghi cần kiểm chứng.",
  },
  story: {
    agentPreset: "story-video",
    topic: "Một câu chuyện ngắn có cao trào cuối",
    platform: "youtube-short",
    language: "vi",
    tone: "Kể chuyện lôi cuốn, giàu hình ảnh, có cao trào cuối.",
    targetDurationSec: 60,
    extraInstruction: "Tạo narration tự nhiên để đọc voice-over, tránh câu quá dài.",
  },
  generic: {
    agentPreset: "custom",
    topic: "Một video giải thích trực quan",
    platform: "youtube-short",
    language: "vi",
    tone: "Dễ hiểu, tự nhiên, nhịp vừa phải.",
    targetDurationSec: 45,
    extraInstruction: "",
  },
};

export default function AiVideoAgent() {
  const lang = useSystemLang();
  const [form, setForm] = useState<AgentVideoForm>(DEFAULT_FORM);
  const [plan, setPlan] = useState<AgentVideoPlan | null>(null);
  const [jobs, setJobs] = useState<AgentVideoJob[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [models, setModels] = useState<PiperModel[]>([]);
  const [elevenConfig, setElevenConfig] = useState<ElevenLabsConfig | null>(null);
  const [supertonicConfig, setSupertonicConfig] = useState<SupertonicConfig | null>(null);
  const [rvcApplioConfig, setRvcApplioConfig] = useState<RvcApplioConfig | null>(null);
  const [vieneuConfig, setVieneuConfig] = useState<VieneuConfig | null>(null);
  const [presets, setPresets] = useState<AgentPreset[]>([]);
  const [publishOptions, setPublishOptions] = useState<AgentPublishChannelOption[]>([]);
  const [selectedPublishChannelKeys, setSelectedPublishChannelKeys] = useState<string[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<AgentWorkflowStageId | "all">("all");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [running, setRunning] = useState(false);
  const [busyJobId, setBusyJobId] = useState("");
  const latestJob = jobs[0];
  const activeJob = jobs.find((job) => job.status === "running") || latestJob;
  const agentJobBusy = jobs.some((job) => job.status === "running" || job.status === "queued");
  const fullAgentRunning = running || agentJobBusy;
  const availableModels = useMemo(() => models.filter((model) => model.lang === form.language), [models, form.language]);
  const selectedPublishChannels = useMemo(() => {
    const targets = form.publishTargets || [];
    return channelsFromKeys(publishOptions, selectedPublishChannelKeys).filter((channel) => targets.includes(channel.platform));
  }, [publishOptions, selectedPublishChannelKeys, form.publishTargets]);
  const publishChannelWarning = form.autoCreatePublishJobs && !selectedPublishChannels.length
    ? text(lang, "Select at least one channel before queueing publish jobs.", "Hãy chọn ít nhất một kênh trước khi tạo publish job.")
    : "";

  useEffect(() => {
    refresh();
    getPiperModels().then(setModels).catch(() => undefined);
    getElevenLabsConfig().then((config) => {
      setElevenConfig(config);
      setForm((current) => ({ ...current, elevenModelId: current.elevenModelId || config.models[0]?.id || "", elevenVoiceId: current.elevenVoiceId || config.voices[0]?.id || "" }));
    }).catch(() => undefined);
    getSupertonicConfig().then((config) => {
      setSupertonicConfig(config);
      setForm((current) => ({ ...current, supertonicVoice: current.supertonicVoice || config.defaultVoice || config.voices[0]?.id || "M1", supertonicTotalSteps: current.supertonicTotalSteps || config.defaultTotalSteps || 8 }));
    }).catch(() => undefined);
    getRvcApplioConfig().then((config) => {
      setRvcApplioConfig(config);
      setForm((current) => ({ ...current, applioTtsTemplateId: current.applioTtsTemplateId || config.ttsTemplates[0]?.id || "" }));
    }).catch(() => undefined);
    getVieneuConfig().then((config) => {
      setVieneuConfig(config);
      setForm((current) => ({ ...current, vieneuVoiceId: current.vieneuVoiceId || config.defaultVoiceId || "", vieneuMode: current.vieneuMode || config.mode || "turbo", vieneuEmotion: current.vieneuEmotion || config.emotion || "natural" }));
    }).catch(() => undefined);
    getAgentPresets().then(setPresets).catch(() => undefined);
    const options = getAgentPublishChannelOptions();
    setPublishOptions(options);
    setSelectedPublishChannelKeys((current) => current.length ? current : getPreferredChannelKeys(options, form.publishTargets || ["youtube"]));
  }, []);

  useEffect(() => {
    const agentBusy = jobs.some((job) => job.status === "running" || job.status === "queued");
    const publishBusy = publishJobs.some((job) => job.status === "running" || job.status === "queued" || job.status === "scheduled");
    if (!agentBusy && !publishBusy) return;
    const timer = window.setInterval(refresh, agentBusy ? 600 : 1200);
    return () => window.clearInterval(timer);
  }, [jobs, publishJobs]);

  async function refresh() {
    try {
      const [nextJobs, nextPublishJobs] = await Promise.all([listAgentVideoJobs(), getPublishJobs()]);
      setJobs(nextJobs);
      setPublishJobs(nextPublishJobs);
    } catch { /* ignore polling noise */ }
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
    let started = false;
    try {
      if (publishChannelWarning) { toast.error(publishChannelWarning); return; }
      const job = await createAgentVideoJob({ ...form, publishChannels: form.autoCreatePublishJobs ? selectedPublishChannels : [], plan: plan || undefined });
      const runningJob = markJobStarting(job);
      setJobs((current) => [runningJob, ...current.filter((item) => item.id !== job.id)]);
      toast.success(text(lang, "Agent is running locally", "Agent đang chạy local"));
      started = true;
      startJobInBackground(job.id, () => setRunning(false));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not run agent", "Không chạy được agent"));
    } finally {
      if (!started) setRunning(false);
    }
  }

  async function handleSaveDraft() {
    try {
      if (publishChannelWarning) { toast.error(publishChannelWarning); return; }
      const job = await createAgentVideoJob({ ...form, publishChannels: form.autoCreatePublishJobs ? selectedPublishChannels : [], plan: plan || undefined });
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
      setJobs((current) => [markJobStarting(job), ...current.filter((item) => item.id !== job.id)]);
      startJobInBackground(job.id, () => setBusyJobId(""));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not run job", "Không chạy được job"));
      setBusyJobId("");
    }
  }

  function startJobInBackground(jobId: string, onDone?: () => void) {
    window.setTimeout(() => {
      runAgentVideoJob(jobId)
        .then((result) => setJobs((current) => [result, ...current.filter((item) => item.id !== result.id)]))
        .catch((error) => toast.error(error instanceof Error ? error.message : text(lang, "Could not run job", "Không chạy được job")))
        .finally(() => {
          onDone?.();
          refresh();
        });
    }, 0);
  }

  function markJobStarting(job: AgentVideoJob): AgentVideoJob {
    const now = Date.now();
    const firstPendingIndex = job.steps.findIndex((step) => step.status === "pending" || step.status === "running");
    const runningIndex = firstPendingIndex >= 0 ? firstPendingIndex : 0;
    return {
      ...job,
      status: "running",
      progress: Math.max(job.progress || 0, 3),
      currentStep: job.steps[runningIndex]?.label || "Research",
      updatedAtMs: now,
      steps: job.steps.map((step, index) => index === runningIndex ? {
        ...step,
        status: "running",
        progress: Math.max(step.progress || 0, 8),
        message: step.message || text(lang, "Starting...", "Đang bắt đầu..."),
        startedAtMs: step.startedAtMs || now,
        updatedAtMs: now,
      } : step),
    };
  }

  function applyPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    setForm((current) => preset ? { ...current, ...preset, agentPreset: preset.id } : { ...current, agentPreset: id });
  }

  function update<K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyContentKind(kind: AgentVideoForm["kind"]) {
    setForm((current) => ({ ...current, ...KIND_DEFAULTS[kind], kind }));
    setPlan(null);
  }

  function refreshPublishChannels() {
    const options = getAgentPublishChannelOptions();
    setPublishOptions(options);
    setSelectedPublishChannelKeys((current) => current.filter((key) => options.some((option) => option.key === key && !option.disabled)));
    toast.success(text(lang, "Channel list refreshed", "Đã tải lại danh sách kênh"));
  }

  function togglePublishChannel(key: string, enabled: boolean) {
    setSelectedPublishChannelKeys((current) => enabled ? Array.from(new Set([...current, key])) : current.filter((item) => item !== key));
  }

  function togglePublishTarget(target: AgentVideoPublishTarget, enabled: boolean) {
    const current = form.publishTargets || [];
    update("publishTargets", enabled ? Array.from(new Set([...current, target])) : current.filter((item) => item !== target));
    if (!enabled) setSelectedPublishChannelKeys((currentKeys) => currentKeys.filter((key) => publishOptions.find((option) => option.key === key)?.platform !== target));
  }

  return (
    <main className="w-full space-y-4 px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Bot className="h-3.5 w-3.5" />Local Agent</Badge>
            <Badge variant="outline">Create → Publish → Engage → Monetize</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{text(lang, "AI Video Agent Flow", "AI Video Agent Flow")}</h1>
        </div>
        <Button variant="outline" onClick={handleRunDue} disabled={fullAgentRunning}>
          {fullAgentRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{text(lang, "Run scheduled", "Chạy job tới lịch")}
        </Button>
      </div>

      <div className={settingsOpen ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_64px]"}>
        <section className="min-w-0 space-y-4">
          <AgentFlowGraph job={activeJob} lang={lang} selectedStageId={selectedStageId} onSelectStage={setSelectedStageId} />
          <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5"><TabsTrigger value="plan">Plan</TabsTrigger><TabsTrigger value="latest">Live job</TabsTrigger><TabsTrigger value="queue">Queue</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          <TabsContent value="plan"><PlanCard plan={plan || latestJob?.plan || null} lang={lang} /></TabsContent>
          <TabsContent value="latest"><JobCard job={latestJob} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
          <TabsContent value="queue"><PublishJobsCard jobs={publishJobs} agentJob={latestJob} lang={lang} /></TabsContent>
          <TabsContent value="logs"><LogCard job={activeJob} lang={lang} selectedStageId={selectedStageId} /></TabsContent>
          <TabsContent value="history" className="space-y-3">{jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} lang={lang} busy={busyJobId === job.id} onRun={handleRunJob} compact />) : <Empty lang={lang} />}</TabsContent>
          </Tabs>
          <AgentSelectedChannelVideos channels={selectedPublishChannels} lang={lang} />
        </section>

        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen} className="min-w-0">
          <Card className="sticky top-4 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3">
              {settingsOpen ? <div><CardTitle className="text-base">{text(lang, "Agent settings", "Thiết lập Agent")}</CardTitle><CardDescription>{text(lang, "Local backend controls.", "Điều khiển backend local.")}</CardDescription></div> : null}
              <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen((open) => !open)} aria-label={text(lang, "Toggle settings panel", "Thu gọn/mở panel thiết lập")}>
                {settingsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CollapsibleContent>
              <ScrollArea className="h-[calc(100vh-130px)]">
                <CardContent className="space-y-4 p-3 pt-0">
                  <AgentSettingsForm form={form} lang={lang} presets={presets} models={models} availableModels={availableModels} elevenConfig={elevenConfig} supertonicConfig={supertonicConfig} rvcApplioConfig={rvcApplioConfig} vieneuConfig={vieneuConfig} publishOptions={publishOptions} selectedPublishChannelKeys={selectedPublishChannelKeys} publishChannelWarning={publishChannelWarning} loadingPlan={loadingPlan} running={fullAgentRunning} applyPreset={applyPreset} applyContentKind={applyContentKind} update={update} togglePublishTarget={togglePublishTarget} togglePublishChannel={togglePublishChannel} refreshPublishChannels={refreshPublishChannels} handleCreatePlan={handleCreatePlan} handleRunNow={handleRunNow} handleSaveDraft={handleSaveDraft} />
                </CardContent>
              </ScrollArea>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </main>
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

function PublishJobsCard({ jobs, agentJob, lang }: { jobs: PublishJob[]; agentJob?: AgentVideoJob; lang: Lang }) {
  const ids = new Set(agentJob?.artifacts?.publishJobIds || []);
  const related = jobs.filter((job) => ids.has(job.id));
  if (!related.length) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No publish queue jobs yet. Render with publish channels selected to create queue jobs.", "Chưa có publish job. Hãy render với kênh đăng đã chọn để tạo job upload.")}</Card>;
  return <Card><CardContent className="space-y-3 pt-6">{related.map((job) => <div key={job.id} className="rounded-lg border p-3"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-medium">{job.title}</p><p className="text-xs text-muted-foreground">{job.platform} · {job.channelTitle || job.channelId || text(lang, "No channel", "Chưa có kênh")} · {new Date(job.updatedAtMs).toLocaleString()}</p>{job.message ? <p className="mt-1 text-xs text-muted-foreground">{job.message}</p> : null}</div><Badge variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge></div><Progress value={job.progress || 0} className="mt-3" />{job.resultUrl ? <a className="mt-2 inline-block text-xs text-primary underline" href={job.resultUrl} target="_blank" rel="noreferrer">{text(lang, "Open published video", "Mở video đã đăng")}</a> : null}</div>)}</CardContent></Card>;
}

function LogCard({ job, lang, selectedStageId }: { job?: AgentVideoJob; lang: Lang; selectedStageId: AgentWorkflowStageId | "all" }) {
  if (!job) return <Empty lang={lang} />;
  const logs = selectedStageId === "all" ? job.logs || [] : (job.logs || []).filter((log) => log.stageId === selectedStageId);
  return <Card className="overflow-hidden"><CardHeader className="border-b bg-muted/40 py-3"><CardTitle className="flex items-center gap-2 text-base"><Terminal className="h-4 w-4" />{selectedStageId === "all" ? text(lang, "All job commands", "Tất cả lệnh của job") : text(lang, "Stage commands", "Lệnh của bước")}</CardTitle></CardHeader><CardContent className="bg-zinc-950 p-0 text-zinc-100"><ScrollArea className="h-[280px] p-4 font-mono text-xs">{logs.length ? logs.map((log) => <div key={log.id} className="mb-3"><div className="flex flex-wrap items-center gap-2"><span className="text-zinc-500">{new Date(log.atMs).toLocaleTimeString()}</span><span className={log.level === "error" ? "text-red-400" : log.level === "success" ? "text-emerald-400" : log.level === "warning" ? "text-amber-300" : "text-sky-300"}>{log.level}</span><span className="text-zinc-400">$</span><span>{commandForLog(log.stageId, log.level)}</span></div><p className="mt-1 pl-4 text-zinc-400">status: {log.message}</p></div>) : <p className="text-zinc-500">{text(lang, "No commands yet.", "Chưa có lệnh.")}</p>}</ScrollArea></CardContent></Card>;
}

function commandForLog(stageId: AgentWorkflowStageId | undefined, level: string) {
  const stage = stageId || "agent";
  const verbs: Record<string, string> = { research: "research", strategy: "plan-strategy", script: "lock-script", visuals: "prepare-visuals", voice: "generate-voice", render: "render-video", metadata: "pack-metadata", publish: "queue-publish", engage: "prepare-engagement", monetize: "prepare-monetize", agent: "run" };
  const status = level === "success" ? "success" : level === "error" ? "failed" : level === "warning" ? "warning" : "running";
  return `kai-agent ${verbs[stage] || stage} --status ${status}`;
}

function InfoList({ title, items }: { title: string; items: string[] }) { const filtered = items.filter(Boolean); if (!filtered.length) return null; return <div><h3 className="mb-2 text-sm font-semibold">{title}</h3><div className="space-y-2">{filtered.map((item, index) => <p key={`${title}-${index}`} className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{item}</p>)}</div></div>; }
function Empty({ lang }: { lang: Lang }) { return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No data yet.", "Chưa có dữ liệu.")}</Card>; }
