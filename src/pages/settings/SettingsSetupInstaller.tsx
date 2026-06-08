import { AlertTriangle, CheckCircle2, Loader2, Play, RefreshCw, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type SettingsSetupInstallerProps = {
  lang: Lang;
  onAfterTask: () => void | Promise<void>;
};

export function SettingsSetupInstaller({ lang, onAfterTask }: SettingsSetupInstallerProps) {
  const [status, setStatus] = useState<SetupWizardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const readyCount = useMemo(() => status?.tasks.filter((task) => task.ready).length || 0, [status]);
  const taskCount = status?.tasks.length || 0;
  const progress = taskCount ? Math.round((readyCount / taskCount) * 100) : 0;
  const autoDisabled = Boolean(runningTask || loading || !status);

  useEffect(() => {
    void refreshStatus(false);
  }, []);

  async function refreshStatus(refreshHealth = true) {
    setLoading(true);
    try {
      setStatus(await getSetupWizardStatus());
      if (refreshHealth) await onAfterTask();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được trạng thái cài đặt.");
    } finally {
      setLoading(false);
    }
  }

  async function runTask(taskId: SetupTaskId) {
    setRunningTask(taskId);
    try {
      appendLog(`▶ ${labelOf(taskId)}...`);
      const result = await runSetupWizardTask(taskId);
      setStatus(result.status);
      appendLog(`✓ ${result.message}${result.output ? `\n${result.output}` : ""}`);
      toast.success(result.message);
      await onAfterTask();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cài đặt task thất bại.";
      appendLog(`✗ ${labelOf(taskId)}: ${message}`);
      toast.error(message);
    } finally {
      setRunningTask("");
    }
  }

  async function runAutoSetup() {
    const current = status || await getSetupWizardStatus();
    for (const task of current.tasks) {
      if (!AUTO_TASKS.includes(task.id as SetupTaskId) || task.ready || !task.canAutoFix) continue;
      await runTask(task.id as SetupTaskId);
    }
    await refreshStatus();
  }

  function appendLog(message: string) {
    setLog((items) => [...items.slice(-10), message]);
  }

  return (
    <Card className="border-dashed bg-muted/10">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" /> {text(lang, "Local service installer", "Trình cài đặt service local")}
          </CardTitle>
          <CardDescription>
            {text(
              lang,
              "Install or start missing runtime pieces directly from Health Check.",
              "Cài hoặc khởi động các thành phần còn thiếu ngay trong Health Check.",
            )}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void refreshStatus()} disabled={loading || Boolean(runningTask)}>
            <RefreshCw className="mr-2 h-4 w-4" /> {text(lang, "Refresh", "Kiểm tra lại")}
          </Button>
          <Button onClick={() => void runAutoSetup()} disabled={autoDisabled}>
            {runningTask ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {text(lang, "Auto install", "Tự cài đặt")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{readyCount}/{taskCount} {text(lang, "tasks ready", "mục sẵn sàng")}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(status?.tasks || []).map((task) => (
            <SetupTaskMiniCard
              key={task.id}
              lang={lang}
              running={runningTask === task.id}
              task={task}
              onRun={task.id !== "elevenlabs" ? () => void runTask(task.id as SetupTaskId) : undefined}
            />
          ))}
        </div>

        <Separator />
        <pre className="max-h-48 overflow-auto rounded-lg bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
          {log.length ? log.join("\n\n") : text(lang, "No install task has run yet.", "Chưa chạy task cài đặt nào.")}
        </pre>
      </CardContent>
    </Card>
  );
}

function SetupTaskMiniCard(props: { lang: Lang; task: SetupTaskStatus; running: boolean; onRun?: () => void }) {
  const { lang, task } = props;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{task.label}</h3>
            <Badge variant={task.optional ? "outline" : "default"}>{task.optional ? text(lang, "Optional", "Tùy chọn") : text(lang, "Required", "Bắt buộc")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{task.description}</p>
        </div>
        {task.ready ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />}
      </div>
      <p className="mt-3 min-h-8 break-words text-xs text-muted-foreground">{task.detail}</p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant={task.ready ? "outline" : "default"} disabled={!props.onRun || !task.canAutoFix || props.running} onClick={props.onRun}>
          {props.running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
          {task.ready ? text(lang, "Run again", "Chạy lại") : text(lang, "Fix", "Sửa")}
        </Button>
      </div>
    </div>
  );
}

function labelOf(taskId: SetupTaskId) {
  return taskId.replace(/-/g, " ");
}
