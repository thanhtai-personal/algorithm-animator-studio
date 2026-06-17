import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ListChecks, PanelRightClose, PanelRightOpen, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
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
import { t, tf } from "@/lib/i18n";
import { getElevenLabsConfig, getPiperModels, getRvcApplioConfig, getSupertonicConfig, getVieneuConfig, type ElevenLabsConfig, type PiperModel, type RvcApplioConfig, type SupertonicConfig, type VieneuConfig } from "@/lib/voiceApi";
import { getPublishJobs, type PublishJob } from "@/lib/publishQueueApi";
import { AgentFlowGraph } from "@/features/ai-video-agent/components/AgentFlowGraph";
import { AgentReviewCard, Empty, JobCard, LogCard, PlanCard, PublishJobsCard } from "@/features/ai-video-agent/components/AgentJobCards";
import { AgentSettingsForm } from "@/features/ai-video-agent/components/AgentSettingsForm";
import { AgentSelectedChannelVideos } from "@/features/ai-video-agent/components/AgentSelectedChannelVideos";
import { DEFAULT_FORM, KIND_DEFAULTS, TERMINAL_JOB_STATUSES, getAgentPresetInitialDefaults, getAgentRenderDefaults } from "@/features/ai-video-agent/lib/agentFormDefaults";
import { channelsFromKeys, getAgentPublishChannelOptions, getPreferredChannelKeys, type AgentPublishChannelOption } from "@/features/ai-video-agent/lib/publishChannelOptions";

type AiVideoAgentPageText = { en: string; vi: string };

type AiVideoAgentProps = {
  lockedKind?: AgentVideoForm["kind"];
  initialPresetId?: string;
  lockedPresetId?: string;
  pageTitle?: AiVideoAgentPageText;
  pageDescription?: AiVideoAgentPageText;
  agentBadge?: string;
  autoPublishByDefault?: boolean;
};

export default function AiVideoAgent({ lockedKind, initialPresetId, lockedPresetId, pageTitle, pageDescription, agentBadge, autoPublishByDefault = false }: AiVideoAgentProps) {
  const lang = useSystemLang();
  const [form, setForm] = useState<AgentVideoForm>(() => createInitialForm(lockedKind, initialPresetId, autoPublishByDefault));
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
  const [pipelineTab, setPipelineTab] = useState("flow");
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
    ? t(lang, "uiSelectAtLeastOneChannelBeforeQueueingPublish")
    : "";
  const lockedForm = useMemo(() => enforceLockedForm(form, lockedKind, lockedPresetId), [form, lockedKind, lockedPresetId]);

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
      const nextPlan = await createAgentVideoPlan(lockedForm);
      setPlan(nextPlan);
      toast.success(t(lang, "uiPlanCreated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotCreatePlan"));
    } finally {
      setLoadingPlan(false);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    let started = false;
    try {
      if (publishChannelWarning) { toast.error(publishChannelWarning); return; }
      const job = await createAgentVideoJob({ ...lockedForm, publishChannels: lockedForm.autoCreatePublishJobs ? selectedPublishChannels : [], plan: plan || undefined });
      const runningJob = markJobStarting(job);
      setJobs((current) => [runningJob, ...current.filter((item) => item.id !== job.id)]);
      setPipelineTab("flow");
      started = true;
      startJobInBackground(job.id, () => setRunning(false));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotRunAgent"));
    } finally {
      if (!started) setRunning(false);
    }
  }

  async function handleSaveDraft() {
    try {
      if (publishChannelWarning) { toast.error(publishChannelWarning); return; }
      const job = await createAgentVideoJob({ ...lockedForm, publishChannels: lockedForm.autoCreatePublishJobs ? selectedPublishChannels : [], plan: plan || undefined });
      setJobs((current) => [job, ...current]);
      toast.success(t(lang, "uiDraftJobSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotSaveJob"));
    }
  }

  async function handleRunDue() {
    setRunning(true);
    try {
      const result = await runDueAgentVideoJobs();
      toast.success(tf(lang, "uiRanDueJobs", { count: result.ran }));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotRunDueJobs"));
    } finally {
      setRunning(false);
    }
  }

  async function handleRunJob(job: AgentVideoJob) {
    setBusyJobId(job.id);
    try {
      setJobs((current) => [markJobStarting(job), ...current.filter((item) => item.id !== job.id)]);
      setPipelineTab("flow");
      startJobInBackground(job.id, () => setBusyJobId(""));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotRunJob"));
      setBusyJobId("");
    }
  }

  function startJobInBackground(jobId: string, onDone?: () => void) {
    window.setTimeout(() => {
      runAgentVideoJobInBackground(jobId)
        .then((result) => setJobs((current) => [result, ...current.filter((item) => item.id !== result.id)]))
        .catch((error) => toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotRunJob")))
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
        setPipelineTab("result");
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
        message: step.message || t(lang, "uiStarting"),
        startedAtMs: step.startedAtMs || now,
        updatedAtMs: now,
      } : step),
    };
  }

  function applyPreset(id: string) {
    if (lockedKind === "generic") {
      setForm((current) => enforceLockedForm({ ...current, agentPreset: "custom", ...getAgentRenderDefaults({ kind: "generic", agentPreset: "custom", platform: current.platform }) }, lockedKind, lockedPresetId));
      return;
    }
    if (lockedPresetId) {
      setForm((current) => enforceLockedForm({ ...current, agentPreset: lockedPresetId, ...getAgentRenderDefaults({ kind: lockedKind || current.kind, agentPreset: lockedPresetId, platform: current.platform }) }, lockedKind, lockedPresetId));
      return;
    }
    const preset = presets.find((item) => item.id === id);
    if (lockedKind && preset && preset.kind !== lockedKind) return;
    setForm((current) => {
      const currentKind = lockedKind || current.kind;
      if (!preset) return enforceLockedForm({ ...current, kind: currentKind, agentPreset: id, ...getAgentRenderDefaults({ kind: currentKind, agentPreset: id, platform: current.platform }) }, lockedKind, lockedPresetId);
      return enforceLockedForm({ ...current, ...preset, agentPreset: preset.id, ...getAgentRenderDefaults({ kind: preset.kind, agentPreset: preset.id, platform: preset.platform }) }, lockedKind, lockedPresetId);
    });
  }

  function update<K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) {
    setForm((current) => {
      if (key === "platform") return { ...current, [key]: value, renderAspectRatio: "auto" };
      return { ...current, [key]: value };
    });
  }

  function applyContentKind(kind: AgentVideoForm["kind"]) {
    if (lockedKind) return;
    setForm((current) => ({ ...current, ...KIND_DEFAULTS[kind], kind }));
    setPlan(null);
  }

  function refreshPublishChannels() {
    const options = getAgentPublishChannelOptions();
    setPublishOptions(options);
    setSelectedPublishChannelKeys((current) => current.filter((key) => options.some((option) => option.key === key && !option.disabled)));
    toast.success(t(lang, "uiChannelListRefreshed"));
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
            <Badge variant="secondary" className="gap-1"><Bot className="h-3.5 w-3.5" />{agentBadge || "Local Agent"}</Badge>
            <Badge variant="outline">Create → Publish → Engage → Monetize</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{pageTitle ? pageTitle[lang] : t(lang, "uiAiVideoAgentFlow")}</h1>
          {pageDescription ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{pageDescription[lang]}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/jobs"><ListChecks className="mr-2 h-4 w-4" />{t(lang, "uiJobManager")}</Link>
          </Button>
          <Button variant="outline" onClick={handleRunDue} disabled={fullAgentRunning}>
            {fullAgentRunning ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCcw className="mr-2 h-4 w-4" />}{t(lang, "uiRunScheduled")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] xl:grid-cols-[minmax(0,1fr)_var(--agent-panel-width)]" style={{ "--agent-panel-width": settingsOpen ? "420px" : "64px" } as CSSProperties}>
        <section className="min-w-0 space-y-4">
          <Tabs value={pipelineTab} onValueChange={setPipelineTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="flow">Flow</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>
            <TabsContent value="flow" className="mt-0">
              <AgentFlowGraph job={fullAgentRunning ? activeJob : undefined} draftInput={lockedForm} lang={lang} selectedStageId={selectedStageId} onSelectStage={setSelectedStageId} />
            </TabsContent>
            <TabsContent value="result" className="mt-0">
              <AgentReviewCard job={latestJob} publishJobs={publishJobs} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} />
            </TabsContent>
            <TabsContent value="logs" className="mt-0">
              <LogCard job={activeJob} lang={lang} selectedStageId={selectedStageId} />
            </TabsContent>
            <TabsContent value="videos" className="mt-0">
              <AgentSelectedChannelVideos channels={selectedPublishChannels} lang={lang} />
            </TabsContent>
          </Tabs>
          <Tabs defaultValue="plan" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="plan">Plan</TabsTrigger><TabsTrigger value="latest">Live job</TabsTrigger><TabsTrigger value="queue">Queue</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
            <TabsContent value="plan"><PlanCard plan={plan || latestJob?.plan || null} lang={lang} /></TabsContent>
            <TabsContent value="latest"><JobCard job={latestJob} lang={lang} busy={busyJobId === latestJob?.id} onRun={handleRunJob} /></TabsContent>
            <TabsContent value="queue"><PublishJobsCard jobs={publishJobs} agentJob={latestJob} lang={lang} /></TabsContent>
            <TabsContent value="history" className="space-y-3">{jobs.length ? jobs.map((job) => <JobCard key={job.id} job={job} lang={lang} busy={busyJobId === job.id} onRun={handleRunJob} compact />) : <Empty lang={lang} />}</TabsContent>
          </Tabs>
        </section>

        <aside className="min-w-0">
          <Card className="sticky top-4 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3">
              <div className={settingsOpen ? "min-w-0 transition-all duration-300" : "pointer-events-none w-0 min-w-0 -translate-x-2 overflow-hidden opacity-0 transition-all duration-300"}><CardTitle className="text-base">{t(lang, "uiAgentSettings")}</CardTitle><CardDescription>{t(lang, "uiLocalBackendControls")}</CardDescription></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen((open) => !open)} aria-label={t(lang, "uiToggleSettingsPanel")}>
                {settingsOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <div aria-hidden={!settingsOpen} className={settingsOpen ? "max-h-[calc(100vh-130px)] opacity-100 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" : "pointer-events-none max-h-0 translate-x-3 overflow-hidden opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"}>
              <ScrollArea className="h-[calc(100vh-130px)]">
                <CardContent className="space-y-4 p-3 pt-0">
                  <AgentSettingsForm form={lockedForm} lang={lang} presets={presets} models={models} availableModels={availableModels} elevenConfig={elevenConfig} supertonicConfig={supertonicConfig} rvcApplioConfig={rvcApplioConfig} vieneuConfig={vieneuConfig} publishOptions={publishOptions} selectedPublishChannelKeys={selectedPublishChannelKeys} publishChannelWarning={publishChannelWarning} loadingPlan={loadingPlan} running={fullAgentRunning} lockedKind={lockedKind} lockedPresetId={lockedPresetId} applyPreset={applyPreset} applyContentKind={applyContentKind} update={update} togglePublishTarget={togglePublishTarget} togglePublishChannel={togglePublishChannel} refreshPublishChannels={refreshPublishChannels} handleCreatePlan={handleCreatePlan} handleRunNow={handleRunNow} handleSaveDraft={handleSaveDraft} />
                </CardContent>
              </ScrollArea>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function createInitialForm(lockedKind?: AgentVideoForm["kind"], initialPresetId?: string, autoPublishByDefault = false): AgentVideoForm {
  const publishDefaults = autoPublishByDefault ? { autoCreatePublishJobs: true, autoRunPublishJobs: true } : {};
  if (!lockedKind) return { ...DEFAULT_FORM, ...publishDefaults };
  const base = { ...DEFAULT_FORM, ...KIND_DEFAULTS[lockedKind], ...publishDefaults, kind: lockedKind };
  const presetDefaults = initialPresetId ? getAgentPresetInitialDefaults(initialPresetId, lockedKind) : null;
  if (presetDefaults) return enforceLockedForm({ ...base, ...presetDefaults }, lockedKind, initialPresetId);
  if (initialPresetId) {
    return enforceLockedForm({
      ...base,
      agentPreset: initialPresetId,
      ...getAgentRenderDefaults({ kind: lockedKind, agentPreset: initialPresetId, platform: base.platform }),
    }, lockedKind, initialPresetId);
  }
  return enforceLockedForm(base, lockedKind);
}

function enforceLockedForm(form: AgentVideoForm, lockedKind?: AgentVideoForm["kind"], lockedPresetId?: string): AgentVideoForm {
  const withKind = lockedKind ? { ...form, kind: lockedKind } : form;
  if (lockedKind === "generic") {
    return { ...withKind, kind: "generic", agentPreset: "custom" };
  }
  if (lockedPresetId) {
    return { ...withKind, agentPreset: lockedPresetId };
  }
  return withKind;
}

function sleep(ms: number) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
