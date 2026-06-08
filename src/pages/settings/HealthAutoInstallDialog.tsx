import { AlertTriangle, CheckCircle2, Loader2, Play, RefreshCw, Terminal, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getSetupWizardStatus, runSetupWizardTask, type SetupTaskId, type SetupTaskStatus, type SetupWizardStatus } from "@/lib/setupWizardApi";
import { text, type Lang } from "@/lib/i18n";

const AUTO_TASKS: SetupTaskId[] = [
  "generated-data",
  "piper-runtime",
  "piper-models",
  "supertonic",
  "applio-client",
  "applio-start",
  "vieneu",
];

type InstallResultStatus = "pending" | "running" | "success" | "failed" | "skipped";

type InstallResult = {
  taskId: string;
  label: string;
  command?: string;
  status: InstallResultStatus;
  message: string;
  output?: string;
};

type HealthAutoInstallDialogProps = {
  lang: Lang;
  onAfterTask: () => void | Promise<void>;
};

export function HealthAutoInstallDialog({ lang, onAfterTask }: HealthAutoInstallDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SetupWizardStatus | null>(null);
  const [results, setResults] = useState<InstallResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string>("");
  const [done, setDone] = useState(false);

  const runnableTasks = useMemo(
    () => (status?.tasks || []).filter((task) => AUTO_TASKS.includes(task.id as SetupTaskId) && task.canAutoFix),
    [status],
  );
  const completedCount = results.filter((item) => ["success", "failed", "skipped"].includes(item.status)).length;
  const totalCount = Math.max(results.length, runnableTasks.length);
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const successCount = results.filter((item) => item.status === "success").length;
  const failedCount = results.filter((item) => item.status === "failed").length;
  const skippedCount = results.filter((item) => item.status === "skipped").length;
  const running = Boolean(runningTaskId || loading);

  useEffect(() => {
    if (!open) return;
    void refreshStatus(false);
  }, [open]);

  async function refreshStatus(refreshHealth = true) {
    setLoading(true);
    try {
      const nextStatus = await getSetupWizardStatus();
      setStatus(nextStatus);
      if (refreshHealth) await onAfterTask();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được trạng thái cài đặt.");
    } finally {
      setLoading(false);
    }
  }

  async function runAutoInstall() {
    setOpen(true);
    setDone(false);
    setResults([]);
    const initialStatus = status || await getSetupWizardStatus();
    setStatus(initialStatus);

    const planned = initialStatus.tasks
      .filter((task) => AUTO_TASKS.includes(task.id as SetupTaskId))
      .map((task) => toInitialResult(task));
    setResults(planned);

    for (const task of initialStatus.tasks) {
      if (!AUTO_TASKS.includes(task.id as SetupTaskId)) continue;

      if (task.ready || !task.canAutoFix) {
        updateResult(task.id, {
          status: "skipped",
          message: task.ready
            ? text(lang, "Already ready, skipped.", "Đã sẵn sàng, bỏ qua.")
            : text(lang, "No auto-fix command configured, skipped.", "Chưa có lệnh tự sửa, bỏ qua."),
        });
        continue;
      }

      setRunningTaskId(task.id);
      updateResult(task.id, {
        status: "running",
        message: text(lang, "Running command...", "Đang chạy lệnh..."),
      });

      try {
        const result = await runSetupWizardTask(task.id as SetupTaskId);
        setStatus(result.status);
        updateResult(task.id, {
          command: result.command || task.command,
          status: "success",
          message: result.message,
          output: result.output,
        });
        await onAfterTask();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Task cài đặt thất bại.";
        updateResult(task.id, { status: "failed", message });
      } finally {
        setRunningTaskId("");
      }
    }

    setDone(true);
    await refreshStatus(true);
  }

  function updateResult(taskId: string, patch: Partial<InstallResult>) {
    setResults((items) => items.map((item) => item.taskId === taskId ? { ...item, ...patch } : item));
  }

  return (
    <>
      <Button onClick={() => void runAutoInstall()} disabled={running}>
        {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
        {text(lang, "Auto install", "Tự cài đặt")}
      </Button>

      <Dialog open={open} onOpenChange={(nextOpen) => { if (!running) setOpen(nextOpen); }}>
        <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> {text(lang, "Local services auto install", "Tự cài đặt service local")}
            </DialogTitle>
            <DialogDescription>
              {text(
                lang,
                "The app runs each required command one by one and keeps going even if one task fails.",
                "App chạy từng lệnh theo thứ tự và vẫn chạy tiếp task sau dù một task bị lỗi.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">
                  {completedCount}/{totalCount || 0} {text(lang, "tasks completed", "task đã xử lý")}
                </span>
                <div className="flex flex-wrap gap-2">
                  <ResultBadge label="Success" count={successCount} variant="success" />
                  <ResultBadge label="Failed" count={failedCount} variant="failed" />
                  <ResultBadge label="Skipped" count={skippedCount} variant="skipped" />
                </div>
              </div>
              <Progress value={progress} />
              {runningTaskId ? (
                <p className="text-xs text-muted-foreground">
                  {text(lang, "Running", "Đang chạy")}: <span className="font-medium text-foreground">{labelOf(runningTaskId)}</span>
                </p>
              ) : done ? (
                <p className="text-xs text-muted-foreground">{text(lang, "Auto install finished.", "Đã chạy xong tự cài đặt.")}</p>
              ) : null}
            </div>

            <div className="grid gap-3">
              {results.length ? results.map((result) => (
                <InstallResultCard key={result.taskId} lang={lang} result={result} />
              )) : (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  {text(lang, "Click Auto install to start checking and installing local tools.", "Bấm Tự cài đặt để bắt đầu kiểm tra và cài các tool local.")}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => void refreshStatus()} disabled={running}>
              <RefreshCw className="mr-2 h-4 w-4" /> {text(lang, "Refresh", "Kiểm tra lại")}
            </Button>
            <Button onClick={() => void runAutoInstall()} disabled={running}>
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {done ? text(lang, "Run again", "Chạy lại") : text(lang, "Start", "Bắt đầu")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InstallResultCard({ lang, result }: { lang: Lang; result: InstallResult }) {
  const running = result.status === "running";
  const failed = result.status === "failed";
  const success = result.status === "success";
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{result.label}</h3>
            <StatusBadge status={result.status} />
          </div>
          <p className="text-xs text-muted-foreground">{result.message}</p>
        </div>
        {running ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" /> : success ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : failed ? <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" /> : null}
      </div>

      {result.command ? (
        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" /> {text(lang, "Command", "Lệnh đang chạy")}
          </div>
          <code className="block break-all text-xs text-foreground">{result.command}</code>
        </div>
      ) : null}

      {result.output ? (
        <>
          <Separator className="my-3" />
          <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-lg bg-background/70 p-3 text-xs leading-5 text-muted-foreground">{result.output}</pre>
        </>
      ) : null}
    </div>
  );
}

function ResultBadge({ label, count, variant }: { label: string; count: number; variant: "success" | "failed" | "skipped" }) {
  const className = variant === "success"
    ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
    : variant === "failed"
      ? "bg-red-600/15 text-red-700 dark:text-red-300"
      : "bg-muted text-muted-foreground";
  return <Badge className={className} variant="default">{label}: {count}</Badge>;
}

function StatusBadge({ status }: { status: InstallResultStatus }) {
  const labels: Record<InstallResultStatus, string> = {
    pending: "Pending",
    running: "Running",
    success: "Success",
    failed: "Failed",
    skipped: "Skipped",
  };
  const className = status === "success"
    ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300"
    : status === "failed"
      ? "bg-red-600/15 text-red-700 dark:text-red-300"
      : status === "running"
        ? "bg-blue-600/15 text-blue-700 dark:text-blue-300"
        : "bg-muted text-muted-foreground";
  return <Badge className={className} variant="default">{labels[status]}</Badge>;
}

function toInitialResult(task: SetupTaskStatus): InstallResult {
  return {
    taskId: task.id,
    label: task.label,
    command: task.command,
    status: "pending",
    message: task.ready ? "Đã sẵn sàng." : task.detail,
  };
}

function labelOf(taskId: string) {
  return taskId.replace(/-/g, " ");
}
