import { ChevronDown, ChevronUp, ExternalLink, Loader2, Terminal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { openBackgroundJobsSocket, type BackgroundJobsSnapshot } from "@/lib/backgroundJobsRealtime";
import { listAgentVideoJobs, type AgentVideoJob } from "@/lib/aiVideoAgentApi";
import { listYoutubeToolsJobs, type YoutubeToolsJob } from "@/lib/youtubeToolsApi";

type BackgroundJob = {
  id: string;
  source: "ai-agent" | "youtube-tools";
  title: string;
  status: string;
  progress: number;
  routePath: string;
  updatedAtMs: number;
  log?: string;
};

const ACTIVE_STATUSES = new Set(["queued", "running"]);

export function BackgroundJobsNotifier() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const refreshInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: number | undefined;

    function applySnapshot(snapshot: BackgroundJobsSnapshot) {
      const next = [
        ...snapshot.youtubeJobs.map(fromYoutubeJob),
        ...snapshot.agentJobs.map(fromAgentJob),
      ]
        .filter((job) => ACTIVE_STATUSES.has(job.status))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      setJobs(next);
    }

    async function refresh() {
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      try {
        const [youtubeJobs, agentJobs] = await Promise.allSettled([
          listYoutubeToolsJobs(),
          listAgentVideoJobs(),
        ]);
        if (cancelled) return;
        applySnapshot({
          atMs: Date.now(),
          youtubeJobs: youtubeJobs.status === "fulfilled" ? youtubeJobs.value : [],
          agentJobs: agentJobs.status === "fulfilled" ? agentJobs.value : [],
        });
      } catch {
        if (!cancelled) setJobs([]);
      } finally {
        refreshInFlightRef.current = false;
      }
    }

    const closeSocket = openBackgroundJobsSocket(
      (snapshot) => {
        if (!cancelled) applySnapshot(snapshot);
      },
      () => {
        if (!cancelled && fallbackTimer === undefined) {
          void refresh();
          fallbackTimer = window.setInterval(refresh, 30000);
        }
      }
    );
    return () => {
      cancelled = true;
      closeSocket();
      if (fallbackTimer !== undefined) window.clearInterval(fallbackTimer);
    };
  }, []);

  const topJob = jobs[0];
  const averageProgress = useMemo(() => {
    if (!jobs.length) return 0;
    return Math.round(jobs.reduce((total, job) => total + job.progress, 0) / jobs.length);
  }, [jobs]);

  if (!jobs.length || !topJob) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(92vw,380px)]">
      <div className="overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/95 text-slate-50 shadow-2xl shadow-cyan-950/40 backdrop-blur">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/80"
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-200">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Đang chạy nền · {jobs.length} job</span>
            <span className="block truncate text-xs text-slate-300">{topJob.title}</span>
          </span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <div className="px-4 pb-3">
          <Progress value={averageProgress} className="h-1.5" />
        </div>
        {expanded ? (
          <div className="max-h-[420px] space-y-2 overflow-auto border-t border-slate-800 p-3">
            {jobs.map((job) => (
              <div key={`${job.source}-${job.id}`} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{job.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Terminal className="h-3.5 w-3.5" /> {job.source}
                    </p>
                  </div>
                  <Badge className="bg-cyan-400/15 text-cyan-100">{job.status}</Badge>
                </div>
                <Progress value={Math.round(job.progress)} className="mt-3 h-1.5" />
                {job.log ? <p className="mt-2 line-clamp-2 text-xs text-slate-300">{job.log}</p> : null}
                <Button size="sm" variant="secondary" className="mt-3 h-8" onClick={() => navigate(job.routePath)}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" /> Mở page
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function fromYoutubeJob(job: YoutubeToolsJob): BackgroundJob {
  const lastLog = job.logs[job.logs.length - 1];
  return {
    id: job.id,
    source: "youtube-tools",
    title: job.title,
    status: job.status,
    progress: job.progress,
    routePath: job.routePath,
    updatedAtMs: job.updatedAtMs,
    log: lastLog || job.error,
  };
}

function fromAgentJob(job: AgentVideoJob): BackgroundJob {
  const lastLog = job.logs[job.logs.length - 1];
  return {
    id: job.id,
    source: "ai-agent",
    title: job.plan?.title || job.input.topic || "AI Video Agent",
    status: job.status,
    progress: job.progress,
    routePath: "/ai-video-agent",
    updatedAtMs: job.updatedAtMs,
    log: lastLog?.message || job.currentStep,
  };
}
