import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ExternalLink, ListChecks, Lock, Play, RefreshCcw, RotateCcw, Search, Trash2, Unlock, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SystemLoader } from "@/components/ui/system-loader";
import {
  cancelAgentVideoJob,
  deleteAgentVideoJob,
  listAgentVideoJobs,
  runAgentVideoJobInBackground,
  setAgentVideoJobLocked,
  type AgentVideoJob,
} from "@/lib/aiVideoAgentApi";
import { t, tf, readSystemLang, type Lang  } from "@/lib/i18n";
import {
  cancelPublishJob,
  deletePublishJob,
  deleteUnlockedJobs,
  getPublishJobs,
  retryPublishJob,
  runDuePublishJobs,
  runPublishJob,
  setPublishJobLocked,
  type PublishJob,
} from "@/lib/publishQueueApi";
import { cn } from "@/lib/utils";

type BusyAction = "agent-run-due" | "publish-run-due" | "delete-all" | `agent-${string}` | `publish-${string}` | "";
type JobTypeFilter = "all" | "agent" | "publish";
type LockFilter = "all" | "locked" | "unlocked";

const RUNNING_STATUSES = new Set(["queued", "running", "scheduled"]);
const ALL_STATUS = "all";

export default function JobManagement() {
  const [lang] = useState<Lang>(() => readSystemLang("en"));
  const [agentJobs, setAgentJobs] = useState<AgentVideoJob[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyAction>("");
  const [query, setQuery] = useState("");
  const [jobType, setJobType] = useState<JobTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [lockFilter, setLockFilter] = useState<LockFilter>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextAgentJobs, nextPublishJobs] = await Promise.all([listAgentVideoJobs(), getPublishJobs()]);
      setAgentJobs(nextAgentJobs);
      setPublishJobs(nextPublishJobs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotLoadJobs"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    const allJobs = [...agentJobs, ...publishJobs];
    return {
      total: allJobs.length,
      active: allJobs.filter((job) => RUNNING_STATUSES.has(job.status)).length,
      failed: allJobs.filter((job) => job.status === "failed").length,
      locked: allJobs.filter((job) => job.locked).length,
    };
  }, [agentJobs, publishJobs]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set([...agentJobs, ...publishJobs].map((job) => job.status))).sort();
  }, [agentJobs, publishJobs]);

  const filteredAgentJobs = useMemo(() => {
    if (jobType === "publish") return [];
    return agentJobs.filter((job) => matchesJob({ title: job.plan?.title || job.input.topic, subtitle: job.input.kind, status: job.status, locked: job.locked }, query, statusFilter, lockFilter));
  }, [agentJobs, jobType, lockFilter, query, statusFilter]);

  const filteredPublishJobs = useMemo(() => {
    if (jobType === "agent") return [];
    return publishJobs.filter((job) => matchesJob({ title: job.title, subtitle: job.platform, status: job.status, locked: job.locked }, query, statusFilter, lockFilter));
  }, [jobType, lockFilter, publishJobs, query, statusFilter]);

  async function withBusy(action: BusyAction, run: () => Promise<void>) {
    setBusy(action);
    try {
      await run();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiJobActionFailed"));
    } finally {
      setBusy("");
    }
  }

  async function handleDeleteAll() {
    if (!window.confirm(t(lang, "uiDeleteAllUnlockedJobsConfirm"))) return;
    await withBusy("delete-all", async () => {
      const result = await deleteUnlockedJobs();
      toast.success(tf(lang, "uiDeletedUnlockedJobsSummary", { count: result.deleted, kept: result.keptLocked }));
    });
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black">
              <ListChecks className="h-6 w-6 text-primary" />
              {t(lang, "uiJobManager2")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(lang, "uiTrackAgentJobsAndPublishQueueJobs")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={loading || Boolean(busy)}>
              {loading ? <SystemLoader className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
              {t(lang, "uiRefresh")}
            </Button>
            <Button onClick={() => void withBusy("publish-run-due", async () => { await runDuePublishJobs(); })} disabled={Boolean(busy)}>
              {busy === "publish-run-due" ? <SystemLoader className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {t(lang, "uiRunDuePublishJobs")}
            </Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <MetricCard label={t(lang, "uiTotalJobs")} value={summary.total} />
          <MetricCard label={t(lang, "uiActive")} value={summary.active} />
          <MetricCard label={t(lang, "uiFailed")} value={summary.failed} tone={summary.failed ? "danger" : "default"} />
        </section>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(lang, "uiSearchJobs")} className="pl-9" />
            </div>
            <FilterSelect value={jobType} onChange={(value) => setJobType(value as JobTypeFilter)} label={t(lang, "uiJobType")} options={[
              [ALL_STATUS, t(lang, "uiAllJobs")],
              ["agent", t(lang, "uiAiAgentJobs")],
              ["publish", t(lang, "uiPublishQueue")],
            ]} />
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label={t(lang, "uiStatus")} options={[[ALL_STATUS, t(lang, "uiAllStatuses")], ...statusOptions.map((status) => [status, status] as [string, string])]} />
            <FilterSelect value={lockFilter} onChange={(value) => setLockFilter(value as LockFilter)} label={t(lang, "uiLockState")} options={[
              ["all", t(lang, "uiAllLockStates")],
              ["locked", t(lang, "uiLocked")],
              ["unlocked", t(lang, "uiUnlocked")],
            ]} />
            <Button variant="destructive" onClick={() => void handleDeleteAll()} disabled={loading || Boolean(busy) || summary.total === summary.locked}>
              {busy === "delete-all" ? <SystemLoader className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              {t(lang, "uiDeleteAllJobs")}
            </Button>
          </CardContent>
        </Card>

        <section className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t(lang, "uiAiAgentJobs")}</CardTitle>
              <CardDescription>{t(lang, "uiVideoCreationWorkflows")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <LoadingRows /> : null}
              {!loading && !filteredAgentJobs.length ? <EmptyJobs lang={lang} /> : null}
              {filteredAgentJobs.map((job) => (
                <JobRow
                  key={job.id}
                  lang={lang}
                  title={job.plan?.title || job.input.topic || "AI Video Agent"}
                  subtitle={`${job.input.kind} · ${formatDate(job.createdAtMs)}`}
                  status={job.status}
                  locked={Boolean(job.locked)}
                  progress={job.progress}
                  message={job.currentStep || job.error}
                  busy={busy === `agent-${job.id}`}
                  actions={[
                    { label: t(lang, "uiRun"), icon: Play, disabled: job.status === "running", onClick: () => withBusy(`agent-${job.id}`, async () => { await runAgentVideoJobInBackground(job.id); }) },
                    { label: t(lang, "uiCancel"), icon: XCircle, disabled: job.status !== "queued" && job.status !== "running", onClick: () => withBusy(`agent-${job.id}`, async () => { await cancelAgentVideoJob(job.id); }) },
                    { label: job.locked ? t(lang, "uiUnlock") : t(lang, "uiLock"), icon: job.locked ? Unlock : Lock, onClick: () => withBusy(`agent-${job.id}`, async () => { await setAgentVideoJobLocked(job.id, !job.locked); }) },
                    { label: t(lang, "uiDelete"), icon: Trash2, disabled: job.locked || job.status === "running", onClick: () => withBusy(`agent-${job.id}`, async () => { await deleteAgentVideoJob(job.id); }) },
                  ]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t(lang, "uiPublishQueue")}</CardTitle>
              <CardDescription>{t(lang, "uiScheduledAndManualPublishJobs")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <LoadingRows /> : null}
              {!loading && !filteredPublishJobs.length ? <EmptyJobs lang={lang} /> : null}
              {filteredPublishJobs.map((job) => (
                <JobRow
                  key={job.id}
                  lang={lang}
                  title={job.title}
                  subtitle={`${job.platform} · ${formatDate(job.createdAtMs)}`}
                  status={job.status}
                  locked={Boolean(job.locked)}
                  progress={job.progress}
                  message={job.message}
                  resultUrl={job.resultUrl}
                  busy={busy === `publish-${job.id}`}
                  actions={[
                    { label: t(lang, "uiRun"), icon: Play, disabled: job.status === "running" || job.status === "success", onClick: () => withBusy(`publish-${job.id}`, async () => { await runPublishJob(job.id); }) },
                    { label: t(lang, "uiRetry"), icon: RotateCcw, disabled: job.status === "running", onClick: () => withBusy(`publish-${job.id}`, async () => { await retryPublishJob(job.id); }) },
                    { label: t(lang, "uiCancel"), icon: XCircle, disabled: job.status === "running" || job.status === "success" || job.status === "cancelled", onClick: () => withBusy(`publish-${job.id}`, async () => { await cancelPublishJob(job.id); }) },
                    { label: job.locked ? t(lang, "uiUnlock") : t(lang, "uiLock"), icon: job.locked ? Unlock : Lock, onClick: () => withBusy(`publish-${job.id}`, async () => { await setPublishJobLocked(job.id, !job.locked); }) },
                    { label: t(lang, "uiDelete"), icon: Trash2, disabled: job.locked || job.status === "running", onClick: () => withBusy(`publish-${job.id}`, async () => { await deletePublishJob(job.id); }) },
                  ]}
                />
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function FilterSelect(props: { label: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground">
      {props.label}
      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={props.value} onChange={(event) => props.onChange(event.target.value)}>
        {props.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}

function MetricCard({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "danger" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-2xl font-black", tone === "danger" && "text-destructive")}>{value}</p>
      </CardContent>
    </Card>
  );
}

type JobRowAction = {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => Promise<void>;
};

function JobRow(props: {
  lang: Lang;
  title: string;
  subtitle: string;
  status: string;
  locked: boolean;
  progress: number;
  message?: string;
  resultUrl?: string;
  busy: boolean;
  actions: JobRowAction[];
}) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold">{props.title}</p>
          <p className="text-xs text-muted-foreground">{props.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {props.locked ? <Badge variant="secondary"><Lock className="mr-1 h-3 w-3" />{t(props.lang, "uiLocked")}</Badge> : null}
          <Badge variant={statusVariant(props.status)}>{props.status}</Badge>
        </div>
      </div>
      <Progress className="mt-3 h-1.5" value={Math.max(0, Math.min(100, props.progress || 0))} />
      {props.message ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{props.message}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {props.actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.label} size="sm" variant="outline" disabled={props.busy || action.disabled} onClick={() => void action.onClick()}>
              {props.busy ? <SystemLoader className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              {action.label}
            </Button>
          );
        })}
        {props.resultUrl ? (
          <Button asChild size="sm" variant="ghost">
            <a href={props.resultUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Result
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function matchesJob(job: { title?: string; subtitle?: string; status: string; locked?: boolean }, query: string, status: string, lock: LockFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = !normalizedQuery || [job.title, job.subtitle, job.status].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
  const matchesStatus = status === ALL_STATUS || job.status === status;
  const matchesLock = lock === "all" || (lock === "locked" ? job.locked : !job.locked);
  return matchesQuery && matchesStatus && matchesLock;
}

function LoadingRows() {
  return (
    <div className="grid min-h-32 place-items-center text-primary">
      <SystemLoader className="h-8 w-8" />
    </div>
  );
}

function EmptyJobs({ lang }: { lang: Lang }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
      <div>
        <Bot className="mx-auto mb-2 h-5 w-5" />
        <p>{t(lang, "uiNoJobsYet")}</p>
        <Button asChild className="mt-3" size="sm" variant="outline">
          <Link to="/videos/agentic">{t(lang, "uiCreateAgentJob")}</Link>
        </Button>
      </div>
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "failed") return "destructive";
  if (status === "success") return "default";
  return "secondary";
}

function formatDate(value: number) {
  return new Date(value).toLocaleString();
}
