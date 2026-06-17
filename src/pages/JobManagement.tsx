import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, ExternalLink, ListChecks, Play, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SystemLoader } from "@/components/ui/system-loader";
import {
  cancelAgentVideoJob,
  listAgentVideoJobs,
  runAgentVideoJobInBackground,
  type AgentVideoJob,
} from "@/lib/aiVideoAgentApi";
import { readSystemLang, text, type Lang } from "@/lib/i18n";
import {
  cancelPublishJob,
  getPublishJobs,
  retryPublishJob,
  runDuePublishJobs,
  runPublishJob,
  type PublishJob,
} from "@/lib/publishQueueApi";
import { cn } from "@/lib/utils";

type BusyAction = "agent-run-due" | "publish-run-due" | `agent-${string}` | `publish-${string}` | "";

const RUNNING_STATUSES = new Set(["queued", "running", "scheduled"]);

export default function JobManagement() {
  const [lang] = useState<Lang>(() => readSystemLang("en"));
  const [agentJobs, setAgentJobs] = useState<AgentVideoJob[]>([]);
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyAction>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextAgentJobs, nextPublishJobs] = await Promise.all([listAgentVideoJobs(), getPublishJobs()]);
      setAgentJobs(nextAgentJobs);
      setPublishJobs(nextPublishJobs);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Could not load jobs", "Không tải được job"));
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
    };
  }, [agentJobs, publishJobs]);

  async function withBusy(action: BusyAction, run: () => Promise<void>) {
    setBusy(action);
    try {
      await run();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text(lang, "Job action failed", "Thao tác job thất bại"));
    } finally {
      setBusy("");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black">
              <ListChecks className="h-6 w-6 text-primary" />
              {text(lang, "Job Manager", "Quản lý job")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {text(lang, "Track agent jobs and publish queue jobs.", "Theo dõi AI agent job và publish queue job.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={loading || Boolean(busy)}>
              {loading ? <SystemLoader className="h-4 w-4" /> : <RefreshCcw className="h-4 w-4" />}
              {text(lang, "Refresh", "Tải lại")}
            </Button>
            <Button onClick={() => void withBusy("publish-run-due", async () => { await runDuePublishJobs(); })} disabled={Boolean(busy)}>
              {busy === "publish-run-due" ? <SystemLoader className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {text(lang, "Run due publish jobs", "Chạy publish job tới lịch")}
            </Button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <MetricCard label={text(lang, "Total jobs", "Tổng job")} value={summary.total} />
          <MetricCard label={text(lang, "Active", "Đang chạy/chờ")} value={summary.active} />
          <MetricCard label={text(lang, "Failed", "Lỗi")} value={summary.failed} tone={summary.failed ? "danger" : "default"} />
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{text(lang, "AI agent jobs", "AI agent job")}</CardTitle>
              <CardDescription>{text(lang, "Video creation workflows.", "Luồng tạo video.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <LoadingRows /> : null}
              {!loading && !agentJobs.length ? <EmptyJobs lang={lang} /> : null}
              {agentJobs.map((job) => (
                <JobRow
                  key={job.id}
                  title={job.plan?.title || job.input.topic || "AI Video Agent"}
                  subtitle={`${job.input.kind} · ${formatDate(job.createdAtMs)}`}
                  status={job.status}
                  progress={job.progress}
                  message={job.currentStep || job.error}
                  busy={busy === `agent-${job.id}`}
                  actions={[
                    { label: text(lang, "Run", "Chạy"), icon: Play, disabled: job.status === "running", onClick: () => withBusy(`agent-${job.id}`, async () => { await runAgentVideoJobInBackground(job.id); }) },
                    { label: text(lang, "Cancel", "Hủy"), icon: XCircle, disabled: job.status !== "queued" && job.status !== "running", onClick: () => withBusy(`agent-${job.id}`, async () => { await cancelAgentVideoJob(job.id); }) },
                  ]}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{text(lang, "Publish queue", "Publish queue")}</CardTitle>
              <CardDescription>{text(lang, "Scheduled and manual publish jobs.", "Job đăng theo lịch và thao tác tay.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <LoadingRows /> : null}
              {!loading && !publishJobs.length ? <EmptyJobs lang={lang} /> : null}
              {publishJobs.map((job) => (
                <JobRow
                  key={job.id}
                  title={job.title}
                  subtitle={`${job.platform} · ${formatDate(job.createdAtMs)}`}
                  status={job.status}
                  progress={job.progress}
                  message={job.message}
                  resultUrl={job.resultUrl}
                  busy={busy === `publish-${job.id}`}
                  actions={[
                    { label: text(lang, "Run", "Chạy"), icon: Play, disabled: job.status === "running" || job.status === "success", onClick: () => withBusy(`publish-${job.id}`, async () => { await runPublishJob(job.id); }) },
                    { label: text(lang, "Retry", "Chạy lại"), icon: RotateCcw, disabled: job.status === "running", onClick: () => withBusy(`publish-${job.id}`, async () => { await retryPublishJob(job.id); }) },
                    { label: text(lang, "Cancel", "Hủy"), icon: XCircle, disabled: job.status === "running" || job.status === "success" || job.status === "cancelled", onClick: () => withBusy(`publish-${job.id}`, async () => { await cancelPublishJob(job.id); }) },
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
  icon: typeof Play;
  disabled?: boolean;
  onClick: () => Promise<void>;
};

function JobRow(props: {
  title: string;
  subtitle: string;
  status: string;
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
        <Badge variant={statusVariant(props.status)}>{props.status}</Badge>
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
        <p>{text(lang, "No jobs yet.", "Chưa có job.")}</p>
        <Button asChild className="mt-3" size="sm" variant="outline">
          <Link to="/videos/agentic">{text(lang, "Create agent job", "Tạo agent job")}</Link>
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
