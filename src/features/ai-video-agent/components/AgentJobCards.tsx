import { Play } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { text, type Lang } from "@/lib/i18n";
import type { AgentVideoJob } from "@/lib/aiVideoAgentApi";
import type { PublishJob } from "@/lib/publishQueueApi";

export function AgentReviewCard({ job, publishJobs, lang, busy, onRun }: { job?: AgentVideoJob; publishJobs: PublishJob[]; lang: Lang; busy: boolean; onRun: (job: AgentVideoJob) => void }) {
  if (!job) return <Empty lang={lang} />;
  const related = getRelatedPublishJobs(job, publishJobs);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-base">{text(lang, "Review result video", "Review video kết quả")}</CardTitle>
            <CardDescription>{job.plan?.title || job.input.topic}</CardDescription>
          </div>
          <Badge variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={job.progress} />
        <p className="text-sm text-muted-foreground">{job.currentStep || job.error || "Idle"}</p>
        {job.error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{job.error}</p> : null}
        {job.artifacts?.videoUrl ? (
          <video src={job.artifacts.videoUrl} controls className="max-h-[520px] w-full rounded-lg border bg-black" />
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {text(lang, "No rendered video yet. Run the agent and wait for the render stage to finish.", "Chưa có video render. Chạy agent và chờ stage render hoàn tất.")}
          </div>
        )}
        {job.artifacts?.metadata ? <MetadataBlock job={job} lang={lang} /> : null}
        {related.length ? <PublishSummary jobs={related} lang={lang} /> : null}
        <Button onClick={() => onRun(job)} disabled={busy || job.status === "running"}>
          {busy ? <SystemLoader className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {text(lang, "Run / rerun", "Chạy / chạy lại")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function JobCard({ job, lang, busy, onRun, compact }: { job?: AgentVideoJob; lang: Lang; busy: boolean; onRun: (job: AgentVideoJob) => void; compact?: boolean }) {
  if (!job) return <Empty lang={lang} />;
  return <Card><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{job.plan?.title || job.input.topic}</CardTitle><CardDescription>{new Date(job.createdAtMs).toLocaleString()} · {job.status}</CardDescription></div><Badge variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge></div></CardHeader><CardContent className="space-y-3"><Progress value={job.progress} /><p className="text-sm text-muted-foreground">{job.currentStep || job.error || "Idle"}</p>{job.error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{job.error}</p> : null}{job.artifacts?.videoUrl ? <video src={job.artifacts.videoUrl} controls className="max-h-[360px] w-full rounded-lg border bg-black" /> : null}{job.artifacts?.publishJobIds?.length ? <p className="text-xs text-muted-foreground">Publish jobs: {job.artifacts.publishJobIds.length}</p> : null}{!compact && <Button onClick={() => onRun(job)} disabled={busy || job.status === "running"}>{busy ? <SystemLoader className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{text(lang, "Run / rerun", "Chạy / chạy lại")}</Button>}</CardContent></Card>;
}

export function PublishJobsCard({ jobs, agentJob, lang }: { jobs: PublishJob[]; agentJob?: AgentVideoJob; lang: Lang }) {
  const related = getRelatedPublishJobs(agentJob, jobs);
  if (!related.length) return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No publish queue jobs yet. Render with publish channels selected to create queue jobs.", "Chưa có publish job. Hãy render với kênh đăng đã chọn để tạo job upload.")}</Card>;
  return <Card><CardContent className="space-y-3 pt-6">{related.map((job) => <div key={job.id} className="rounded-lg border p-3"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><p className="font-medium">{job.title}</p><p className="text-xs text-muted-foreground">{job.platform} · {job.channelTitle || job.channelId || text(lang, "No channel", "Chưa có kênh")} · {new Date(job.updatedAtMs).toLocaleString()}</p>{job.message ? <p className="mt-1 text-xs text-muted-foreground">{job.message}</p> : null}</div><Badge variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.status}</Badge></div><Progress value={job.progress || 0} className="mt-3" />{job.resultUrl ? <a className="mt-2 inline-block text-xs text-primary underline" href={job.resultUrl} target="_blank" rel="noreferrer">{text(lang, "Open published video", "Mở video đã đăng")}</a> : null}</div>)}</CardContent></Card>;
}

export function Empty({ lang }: { lang: Lang }) {
  return <Card className="border-dashed p-8 text-center text-sm text-muted-foreground">{text(lang, "No data yet.", "Chưa có dữ liệu.")}</Card>;
}

function MetadataBlock({ job, lang }: { job: AgentVideoJob; lang: Lang }) {
  const metadata = job.artifacts?.metadata;
  if (!metadata) return null;
  return <div className="rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">{metadata.title}</p><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{metadata.description}</p><p className="mt-2 text-xs text-muted-foreground">{text(lang, "Tags", "Tags")}: {metadata.tags}</p></div>;
}

function PublishSummary({ jobs, lang }: { jobs: PublishJob[]; lang: Lang }) {
  return <div className="rounded-lg border p-3"><p className="text-sm font-medium">{text(lang, "Publish queue", "Publish queue")}</p><div className="mt-2 flex flex-wrap gap-2">{jobs.map((job) => <Badge key={job.id} variant={job.status === "success" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>{job.platform}: {job.status}</Badge>)}</div></div>;
}

function getRelatedPublishJobs(agentJob: AgentVideoJob | undefined, jobs: PublishJob[]) {
  const ids = new Set(agentJob?.artifacts?.publishJobIds || []);
  return jobs.filter((job) => ids.has(job.id));
}
