import { AlertTriangle, ArrowRight, CheckCircle2, Play, RefreshCw, Settings, ShieldCheck, Wrench } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { markRuntimeSetupGateSkipped, markRuntimeSetupGateVisited } from "@/components/RuntimeSetupGate";
import { getSetupWizardStatus, runSetupWizardTask, type SetupTaskId, type SetupTaskStatus, type SetupWizardStatus } from "@/lib/setupWizardApi";
import { readSystemLang, t, type Lang  } from "@/lib/i18n";

const AUTO_TASKS: SetupTaskId[] = [
  "generated-data",
  "piper-runtime",
  "piper-models",
  "supertonic",
  "applio-client",
  "applio-start",
  "vieneu",
];

type LocationState = { from?: { pathname?: string } } | null;

export default function RuntimeSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang] = useState<Lang>(() => readSystemLang("vi"));
  const [status, setStatus] = useState<SetupWizardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningTask, setRunningTask] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const readyCount = useMemo(() => status?.tasks.filter((task) => task.ready).length || 0, [status]);
  const taskCount = status?.tasks.length || 0;
  const progress = taskCount ? Math.round((readyCount / taskCount) * 100) : 0;
  const from = ((location.state as LocationState)?.from?.pathname || "/").startsWith("/setup")
    ? "/"
    : (location.state as LocationState)?.from?.pathname || "/";

  useEffect(() => {
    markRuntimeSetupGateVisited();
    void refreshStatus();
  }, []);

  async function refreshStatus() {
    setLoading(true);
    try {
      setStatus(await getSetupWizardStatus({ force: true }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không kiểm tra được setup status.");
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Setup task thất bại.";
      appendLog(`✗ ${labelOf(taskId)}: ${message}`);
      toast.error(message);
    } finally {
      setRunningTask("");
    }
  }

  async function runAutoSetup() {
    if (!status) await refreshStatus();
    const current = status || await getSetupWizardStatus({ force: true });
    for (const task of current.tasks) {
      if (!AUTO_TASKS.includes(task.id as SetupTaskId) || task.ready || !task.canAutoFix) continue;
      await runTask(task.id as SetupTaskId);
    }
    await refreshStatus();
  }

  function enterStudio(skipGate = false) {
    markRuntimeSetupGateVisited();
    if (skipGate) markRuntimeSetupGateSkipped();
    navigate(from || "/", { replace: true });
  }

  function appendLog(message: string) {
    setLog((items) => [...items.slice(-10), message]);
  }

  const coreReady = Boolean(status?.coreReady);
  const autoDisabled = Boolean(runningTask || loading || !status);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 text-foreground">
      <section className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant={coreReady ? "default" : "secondary"}>
            {coreReady ? <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> : <Wrench className="mr-1 h-3.5 w-3.5" />}
            {coreReady ? t(lang, "uiCoreRuntimeReady") : t(lang, "uiFirstRunSetup")}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t(lang, "uiSetupLocalServices")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t(lang, "uiKaiStudioWillTryToPrepareGeneratedData")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void refreshStatus()} disabled={loading || Boolean(runningTask)}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t(lang, "settingsCheckAgain")}
          </Button>
          <Button onClick={() => void runAutoSetup()} disabled={autoDisabled}>
            {runningTask ? <SystemLoader className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {t(lang, "uiAutoInstall")}
          </Button>
          <Button variant={coreReady ? "default" : "secondary"} onClick={() => enterStudio(!coreReady)}>
            <ArrowRight className="mr-2 h-4 w-4" />
            {coreReady ? t(lang, "uiEnterStudio") : t(lang, "uiSkipForNow")}
          </Button>
        </div>
      </section>

      {!coreReady ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t(lang, "uiStudioIsNotReadyYet")}</AlertTitle>
          <AlertDescription>
            {t(lang, "uiCoreChecksRequireBackendDataPiperExeAnd")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Health readiness</CardTitle>
          <CardDescription>
            {readyCount}/{taskCount} {t(lang, "uiChecksReady")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} />
          <div className="grid gap-3 md:grid-cols-2">
            {(status?.tasks || []).map((task) => (
              <SetupTaskCard
                key={task.id}
                lang={lang}
                running={runningTask === task.id}
                task={task}
                onRun={task.id !== "elevenlabs" ? () => void runTask(task.id as SetupTaskId) : undefined}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{t(lang, "uiSetupLog")}</CardTitle>
            <CardDescription>{t(lang, "uiLatestInstallStartAttempts")}</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate("/settings")}> <Settings className="mr-2 h-4 w-4" /> Settings</Button>
        </CardHeader>
        <CardContent>
          <pre className="max-h-72 overflow-auto rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
            {log.length ? log.join("\n\n") : t(lang, "uiNoSetupTaskHasRunYet")}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}

function SetupTaskCard(props: { lang: Lang; task: SetupTaskStatus; running: boolean; onRun?: () => void }) {
  const { lang, task } = props;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{task.label}</h3>
            {task.optional ? <Badge variant="outline">{t(lang, "uiOptional")}</Badge> : <Badge>{t(lang, "uiRequired")}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
        </div>
        {task.ready ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />}
      </div>
      <Separator className="my-3" />
      <p className="min-h-10 break-words text-xs text-muted-foreground">{task.detail}</p>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant={task.ready ? "outline" : "default"} disabled={!props.onRun || !task.canAutoFix || props.running} onClick={props.onRun}>
          {props.running ? <SystemLoader className="mr-2 h-4 w-4" /> : <Wrench className="mr-2 h-4 w-4" />}
          {task.ready ? t(lang, "uiRunAgain") : t(lang, "uiFix")}
        </Button>
      </div>
    </div>
  );
}

function labelOf(taskId: SetupTaskId) {
  return taskId.replace(/-/g, " ");
}
