import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Bot, PanelRightClose, PanelRightOpen, RefreshCcw, Terminal } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import { openBackgroundJobsSocket } from "@/lib/backgroundJobsRealtime";
import {
  createAgentVideoJob,
  createAgentVideoPlan,
  getAgentVideoJob,
  getAgentPresets,
  listAgentVideoJobs,
  runAgentVideoJobInBackground,
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
import { AgentReviewCard, Empty, JobCard, PublishJobsCard } from "@/features/ai-video-agent/components/AgentJobCards";
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

const TERMINAL_JOB_STATUSES = new Set(["success", "failed", "cancelled", "review_ready"]);

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
  const refreshInFlightRef = useRef(false);
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

  useEffect(() => openBackgroundJobsSocket((snapshot) => setJobs(snapshot.agentJobs)), []);
  useEffect(() => {
    const agentBusy = jobs.some((job) => job.status === "running" || job.status === "queued");
    const publishBusy = publishJobs.some((job) => job.status === "running" || job.status === "queued" || job.status === "scheduled");
    if (!agentBusy && !publishBusy) return;
    const timer = window.setInterval(agentBusy ? refresh : refreshPublishJobs, agentBusy ? 30000 : 15000);
    return () => window.clearInterval(timer);
  }, [jobs, publishJobs]);
  async function refresh() {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      const [nextJobs, nextPublishJobs] = await Promise.all([listAgentVideoJobs(), getPublishJobs()]);
      setJobs(nextJobs);
      setPublishJobs(nextPublishJobs);
    } catch { /* ignore polling noise */ } finally {
      refreshInFlightRef.current = false;
    }
  }
  async function refreshPublishJobs() {
    try {
      setPublishJobs(await getPublishJobs());
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
      runAgentVideoJobInBackground(jobId)
        .then((result) => setJobs((current) => [result, ...current.filter((item) => item.id !== result.id)]))
        .catch((error) => toast.error(error instanceof Error ? error.message : text(lang, "Could not run job", "Không chạy được job")))
        .finally(() => {
          void pollJobUntilDone(jobId).finally(onDone);
          refresh();
        });
    }, 0);
  }

  async function pollJobUntilDone(jobId: string) {
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const job = await getAgentVideoJob(jobId);
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
      if (TERMINAL_JOB_STATUSES.has(job.status)) {
        await refresh();
        return;
      }
      await sleep(2000);
    }
    await refresh();
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
          {fullAgentRunning ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{text(lang, "Run scheduled", "Chạy job tới lịch")}
        </Button>
      </div>

      <div className="grid gap-4 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] xl:grid-cols-[minmax(0,1fr)_var(--agent-panel-width)]" style={{ "--agent-panel-width": settingsOpen ? "420px" : "64px" } as CSSProperties}>
        <section className="min-w-0 space-y-4">
          <AgentFlowGraph job={fullAgentRunning ? activeJob : undefined} draftInput={form} lang={lang} selectedStageId={selectedStageId} onSelectStage={setSelectedStageId} />
          <Tabs defaultValue="review" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6"><TabsTrigger value="review">Review</TabsTrigger><TabsTrigger value="plan">Plan</TabsTrigger><TabsTrigger value="latest">Live job</TabsTrigger><TabsTrigger value="queue">Queue</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
          <TabsContent value="review"><AgentReviewCard job={latestJob} publishJobs={publishJobs} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
          <TabsContent value="plan"><PlanCard plan={plan || latestJob?.plan || null} lang={lang} /></TabsContent>
          <TabsContent value="latest"><JobCard job={latestJob} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
          <TabsContent value="queue"><PublishJobsCard jobs={publishJobs} agentJob={latestJob} lang={lang} /></TabsContent>
          <TabsContent value="logs"><LogCard job={activeJob} lang={lang} selectedStageId={selectedStageId} /></TabsContent>
          <TabsContent value="history" className="space-y-3">{jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} lang={lang} busy={busyJobId === job.id} onRun={handleRunJob} compact />) : <Empty lang={lang} />}</TabsContent>
          </Tabs>
          <AgentSelectedChannelVideos channels={selectedPublishChannels} lang={lang} />
        </section>

        <aside className="min-w-0">
          <Card className="sticky top-4 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3">
              <div className={settingsOpen ? "min-w-0 transition-all duration-300" : "pointer-events-none w-0 min-w-0 -translate-x-2 overflow-hidden opacity-0 transition-all duration-300"}><CardTitle className="text-base">{text(lang, "Agent settings", "Thiết lập Agent")}</CardTitle><CardDescription>{text(lang, "Local backend controls.", "Điều khiển backend local.")}</CardDescription></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen((open) => !open)} aria-label={text(lang, "Toggle settings panel", "Thu gọn/mở panel thiết lập")}>
                {settingsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div aria-hidden={!settingsOpen} className={settingsOpen ? "max-h-[calc(100vh-130px)] opacity-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : "pointer-events-none max-h-0 translate-x-3 overflow-hidden opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"}>
              <ScrollArea className="h-[calc(100vh-130px)]">
                <CardContent className="space-y-4 p-3 pt-0">
                  <AgentSettingsForm form={form} lang={lang} presets={presets} models={models} availableModels={availableModels} elevenConfig={elevenConfig} supertonicConfig={supertonicConfig} rvcApplioConfig={rvcApplioConfig} vieneuConfig={vieneuConfig} publishOptions={publishOptions} selectedPublishChannelKeys={selectedPublishChannelKeys} publishChannelWarning={publishChannelWarning} loadingPlan={loadingPlan} running={fullAgentRunning} applyPreset={applyPreset} applyContentKind={applyContentKind} update={update} togglePublishTarget={togglePublishTarget} togglePublishChannel={togglePublishChannel} refreshPublishChannels={refreshPublishChannels} handleCreatePlan={handleCreatePlan} handleRunNow={handleRunNow} handleSaveDraft={handleSaveDraft} />
                </CardContent>
              </ScrollArea>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function PlanCard({ plan, lang }: { plan: AgentVideoPlan | null; lang: Lang }) {
  if (!plan) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No plan yet.", "Chưa có plan.")}</Card>;
  return <Card><CardHeader><CardTitle className="flex flex-wrap items-center gap-2">{plan.title}{plan.warning ? <Badge variant="secondary">fallback</Badge> : <Badge>AI</Badge>}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent className="space-y-4"><InfoList title="Research" items={[plan.researchSummary || "", plan.audiencePersona || "", ...(plan.contentAngles || [])]} /><InfoList title="Scenes" items={plan.scenes.map((scene) => `${scene.title}: ${scene.narration}`)} /><InfoList title="Engage / Monetize" items={[...(plan.engagementPrompts || []), ...(plan.monetizationIdeas || []), ...(plan.repurposeIdeas || [])]} /><div className="flex flex-wrap gap-2">{plan.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div></CardContent></Card>;
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
function sleep(ms: number) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
