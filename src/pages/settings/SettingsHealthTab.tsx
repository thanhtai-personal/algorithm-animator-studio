import { BookOpen, Bot, CheckCircle2, ChevronsLeft, ChevronsRight, Cloud, Mic2, Radio, RefreshCw, Server, Waves, Youtube } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {text, uiText, t, type Lang} from "@/lib/i18n";
import { StatusTile } from "./SettingsFields";
import { applioInstruction, elevenLabsInstruction, piperInstruction, supertonicInstruction, systemInstruction, vieneuInstruction, type HealthInstruction } from "./SettingsHealthInstructions";
import { SettingsMarkdown } from "./SettingsMarkdown";
import { HealthAutoInstallDialog } from "./HealthAutoInstallDialog";
import type { ElevenLabsConfigResponse, HealthResponse, PiperModel, RvcApplioConfigResponse, SupertonicConfigResponse, VieneuConfigResponse, YoutubeToolsHealthResponse } from "./SettingsTypes";

type SettingsHealthTabProps = {
  availableModels: number;
  elevenLabs: ElevenLabsConfigResponse | null;
  health: HealthResponse | null;
  lang: Lang;
  loading: boolean;
  models: PiperModel[];
  onRefreshHealth: () => void;
  rvcApplio: RvcApplioConfigResponse | null;
  supertonic: SupertonicConfigResponse | null;
  vieneu: VieneuConfigResponse | null;
  youtubeTools: YoutubeToolsHealthResponse | null;
};

type HealthSectionId = "system" | "piper" | "applio" | "supertonic" | "vieneu" | "elevenlabs" | "youtubeTools";

const HEALTH_SECTIONS: { id: HealthSectionId; label: string; shortLabel: string; icon: typeof Server }[] = [
  { id: "system", label: "System", shortLabel: "S", icon: Server },
  { id: "piper", label: "Piper", shortLabel: "P", icon: Mic2 },
  { id: "applio", label: "Applio", shortLabel: "A", icon: Bot },
  { id: "supertonic", label: "Supertonic", shortLabel: "S", icon: Radio },
  { id: "vieneu", label: "VieNeu", shortLabel: "V", icon: Waves },
  { id: "elevenlabs", label: "ElevenLabs", shortLabel: "E", icon: Cloud },
  { id: "youtubeTools", label: "YouTube Tools", shortLabel: "Y", icon: Youtube },
];

export function SettingsHealthTab(props: SettingsHealthTabProps) {
  const [activeSection, setActiveSection] = useState<HealthSectionId>("system");
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const systemFailed = Boolean(props.health && (!props.health.ok || !props.health.generatedDir));
  const piperFailed = Boolean(props.health && (!props.health.piperExists || props.availableModels < props.models.length));
  const applioConfigured = Boolean(
    props.rvcApplio?.enabled ||
    props.rvcApplio?.startCommandConfigured ||
    props.rvcApplio?.argTemplateConfigured ||
    props.rvcApplio?.ttsTemplateConfigured ||
    props.rvcApplio?.serverOk
  );
  const applioFailed = Boolean(props.rvcApplio && applioConfigured && (
    !props.rvcApplio.serverOk ||
    !props.rvcApplio.pythonExists ||
    !props.rvcApplio.bridgeExists ||
    !props.rvcApplio.gradioClientInstalled ||
    !props.rvcApplio.endpointsOk ||
    (!props.rvcApplio.argTemplateConfigured && !props.rvcApplio.ttsTemplateConfigured)
  ));
  const supertonicFailed = Boolean(props.supertonic && !props.supertonic.serverOk);
  const vieneuFailed = Boolean(props.vieneu && (!props.vieneu.sdkInstalled || !props.vieneu.pythonExists || !props.vieneu.bridgeExists));
  const elevenLabsConfigured = Boolean(props.elevenLabs?.hasApiKey);
  const elevenLabsFailed = Boolean(props.elevenLabs && elevenLabsConfigured && !props.elevenLabs.endpointsOk);
  const youtubeToolsFailed = Boolean(props.youtubeTools && !props.youtubeTools.ok);
  const sectionState = {
    system: {
      passed: Boolean(props.health?.ok && props.health?.generatedDir),
      failed: systemFailed,
      instruction: systemInstruction(props.lang, props.health),
    },
    piper: {
      passed: Boolean(props.health?.piperExists && props.availableModels === props.models.length && props.models.length > 0),
      failed: piperFailed,
      instruction: piperInstruction(props.lang, props.health, props.models.length),
    },
    applio: {
      passed: Boolean(props.rvcApplio && applioConfigured && !applioFailed),
      failed: applioFailed,
      instruction: applioInstruction(props.lang, props.rvcApplio),
    },
    supertonic: {
      passed: Boolean(props.supertonic?.serverOk),
      failed: supertonicFailed,
      instruction: supertonicInstruction(props.lang, props.supertonic),
    },
    vieneu: {
      passed: Boolean(props.vieneu && !vieneuFailed),
      failed: vieneuFailed,
      instruction: vieneuInstruction(props.lang, props.vieneu),
    },
    elevenlabs: {
      passed: Boolean(props.elevenLabs?.hasApiKey && props.elevenLabs?.endpointsOk),
      failed: elevenLabsFailed,
      instruction: elevenLabsInstruction(props.lang),
    },
    youtubeTools: {
      passed: Boolean(props.youtubeTools?.ok),
      failed: youtubeToolsFailed,
      instruction: youtubeToolsInstruction(props.lang, props.youtubeTools),
    },
  } satisfies Record<HealthSectionId, { passed: boolean; failed: boolean; instruction: HealthInstruction }>;
  const activeMeta = HEALTH_SECTIONS.find((section) => section.id === activeSection) || HEALTH_SECTIONS[0];
  const activeState = sectionState[activeSection];

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{t(props.lang, "settingsHealthCheckTab")}</CardTitle>
          <CardDescription>{t(props.lang, "settingsHealthDescription")}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <HealthAutoInstallDialog lang={props.lang} onAfterTask={props.onRefreshHealth} />
          <Button variant="outline" onClick={props.onRefreshHealth} disabled={props.loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> {t(props.lang, "settingsCheckAgain")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <aside className={`rounded-lg border border-border bg-muted/30 p-2 transition-[width] duration-200 ${menuCollapsed ? "w-[68px]" : "w-full lg:w-56"}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              {!menuCollapsed ? <span className="px-2 text-xs font-semibold text-muted-foreground">{text(props.lang, "Health groups", "Nhóm health")}</span> : null}
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMenuCollapsed((value) => !value)}>
                {menuCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            </div>
            <nav className="grid gap-1" aria-label={text(props.lang, "Health check groups", "Nhóm kiểm tra health")}>
              {HEALTH_SECTIONS.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                const passed = sectionState[section.id].passed;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={[
                      "flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                      selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                      menuCollapsed ? "justify-center" : "justify-between",
                    ].join(" ")}
                    title={section.label}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className={`flex items-center gap-2 ${menuCollapsed ? "justify-center" : "min-w-0"}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {menuCollapsed ? <span className="sr-only">{section.label}</span> : <span className="truncate">{section.label}</span>}
                    </span>
                    {passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label={t(props.lang, "settingsReady")} /> : null}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 space-y-3 rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{activeMeta.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeState.passed ? t(props.lang, "settingsReady") : activeState.failed ? t(props.lang, "settingsMissing") : t(props.lang, "settingsNotChecked")}
                </p>
              </div>
              <InstructionDialog lang={props.lang} title={activeMeta.label} failed={activeState.failed} instruction={activeState.instruction} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {renderHealthSection(activeSection, props)}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

function renderHealthSection(section: HealthSectionId, props: SettingsHealthTabProps) {
  if (section === "system") {
    return (
      <>
        <StatusTile lang={props.lang} label={uiText("Backend")} ok={Boolean(props.health?.ok)} value={props.health ? t(props.lang, "settingsConnected") : t(props.lang, "settingsNotChecked")} />
        <StatusTile lang={props.lang} label={t(props.lang, "settingsGeneratedData")} ok={Boolean(props.health?.generatedDir)} value={props.health?.generatedDir || "-"} />
      </>
    );
  }

  if (section === "piper") {
    return (
      <>
        <StatusTile lang={props.lang} label={uiText("Piper exe")} ok={Boolean(props.health?.piperExists)} value={props.health?.piperExe || "-"} />
        <StatusTile lang={props.lang} label={uiText("Models")} ok={props.availableModels === props.models.length && props.models.length > 0} value={`${props.availableModels}/${props.models.length} ${t(props.lang, "settingsModelsReady")}`} />
        <div className="grid gap-3 md:col-span-3 md:grid-cols-2">
          {props.models.map((model) => (
            <div key={model.key} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{model.label}</p>
                  <p className="text-xs text-muted-foreground">{model.lang.toUpperCase()} · {model.key}</p>
                </div>
                <Badge
                  className={model.available ? "bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-300" : "bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"}
                  variant="default"
                >
                  {model.available ? t(props.lang, "settingsReady") : t(props.lang, "settingsMissing")}
                </Badge>
              </div>
              <p className="break-all text-xs text-muted-foreground">ONNX: {model.modelPath}</p>
              <p className="break-all text-xs text-muted-foreground">JSON: {model.jsonPath}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (section === "applio") {
    return (
      <>
        <StatusTile lang={props.lang} label={uiText("Applio server")} ok={Boolean(props.rvcApplio?.serverOk)} value={props.rvcApplio?.serverOk ? props.rvcApplio.baseUrl : props.rvcApplio?.error || t(props.lang, "settingsServerNotRunning")} />
        <StatusTile lang={props.lang} label={uiText("Applio Python")} ok={Boolean(props.rvcApplio?.pythonExists && props.rvcApplio?.bridgeExists)} value={`${props.rvcApplio?.pythonExe || "-"} · bridge ${props.rvcApplio?.bridgeExists ? "OK" : t(props.lang, "settingsMissing")}`} />
        <StatusTile lang={props.lang} label={uiText("Applio gradio_client")} ok={Boolean(props.rvcApplio?.gradioClientInstalled)} value={props.rvcApplio?.gradioClientInstalled ? "OK" : props.rvcApplio?.gradioClientInstallCommand || props.rvcApplio?.gradioClientCheckError || "npm run applio:install"} />
        <StatusTile
          lang={props.lang}
          label={uiText("Applio API template")}
          ok={Boolean((props.rvcApplio?.argTemplateConfigured || props.rvcApplio?.ttsTemplateConfigured) && props.rvcApplio?.endpointsOk)}
          value={props.rvcApplio?.argTemplateConfigured || props.rvcApplio?.ttsTemplateConfigured
            ? `${props.rvcApplio.templates.length} convert · ${props.rvcApplio.ttsTemplates.length} TTS`
            : "server/data/config/rvc-applio-templates.json"}
        />
        <StatusTile lang={props.lang} label={uiText("Applio dev startup")} ok={Boolean(props.rvcApplio?.startCommandConfigured)} value={props.rvcApplio?.startCommandConfigured ? props.rvcApplio.startCommand : "RVC_APPLIO_START_COMMAND"} />
        {renderEndpointChecks(props.lang, props.rvcApplio?.endpointChecks)}
      </>
    );
  }

  if (section === "supertonic") {
    return (
      <>
        <StatusTile
          lang={props.lang}
          label={uiText("Supertonic")}
          ok={Boolean(props.supertonic?.serverOk)}
          value={props.supertonic?.serverOk
            ? `${props.supertonic.voices.length} ${t(props.lang, "settingsVoiceTab")} · ${props.supertonic.model}${props.supertonic.endpointsOk ? "" : " · endpoint styles cần kiểm tra"}`
            : props.supertonic?.error || t(props.lang, "settingsServerNotRunning")}
        />
        {renderEndpointChecks(props.lang, props.supertonic?.endpointChecks)}
      </>
    );
  }

  if (section === "vieneu") {
    return (
      <>
        <StatusTile lang={props.lang} label={uiText("VieNeu SDK")} ok={Boolean(props.vieneu?.sdkInstalled)} value={props.vieneu?.sdkInstalled ? `${props.vieneu.mode} · ${props.vieneu.emotion} · ${props.vieneu.version || "SDK OK"}` : props.vieneu?.error || t(props.lang, "settingsMissing")} />
        <StatusTile lang={props.lang} label={uiText("VieNeu Python")} ok={Boolean(props.vieneu?.pythonExists && props.vieneu?.bridgeExists)} value={`${props.vieneu?.pythonExe || "-"} · bridge ${props.vieneu?.bridgeExists ? "OK" : t(props.lang, "settingsMissing")}`} />
      </>
    );
  }

  if (section === "youtubeTools") {
    return (
      <>
        <StatusTile lang={props.lang} label={uiText("yt-dlp")} ok={Boolean(props.youtubeTools?.ytDlp.ok)} value={formatToolStatus(props.youtubeTools?.ytDlp)} />
        <StatusTile lang={props.lang} label={uiText("Whisper")} ok={Boolean(props.youtubeTools?.whisper.ok)} value={formatToolStatus(props.youtubeTools?.whisper)} />
        <StatusTile lang={props.lang} label={uiText("FFmpeg")} ok={Boolean(props.youtubeTools?.ffmpeg.ok)} value={formatToolStatus(props.youtubeTools?.ffmpeg)} />
        <StatusTile lang={props.lang} label={uiText("FFprobe")} ok={Boolean(props.youtubeTools?.ffprobe.ok)} value={formatToolStatus(props.youtubeTools?.ffprobe)} />
        <StatusTile lang={props.lang} label={uiText("Python")} ok={Boolean(props.youtubeTools?.python.ok)} value={formatToolStatus(props.youtubeTools?.python)} />
        <StatusTile lang={props.lang} label={text(props.lang, "Output folder", "Thư mục xuất")} ok={Boolean(props.youtubeTools?.outputDir)} value={props.youtubeTools?.outputDir || "-"} />
      </>
    );
  }

  return (
    <>
      <StatusTile lang={props.lang} label={uiText("ElevenLabs")} ok={Boolean(props.elevenLabs?.hasApiKey && props.elevenLabs?.endpointsOk)} value={props.elevenLabs?.hasApiKey ? `${props.elevenLabs.voices.length} ${t(props.lang, "settingsVoicesConfigured")}` : t(props.lang, "settingsNoApiKey")} />
      {renderEndpointChecks(props.lang, props.elevenLabs?.endpointChecks)}
    </>
  );
}

function renderEndpointChecks(lang: Lang, checks?: { label: string; method: string; url: string; ok: boolean; detail?: string; apiName?: string }[]) {
  if (!checks?.length) return null;
  return checks.map((check) => (
    <StatusTile
      key={`${check.method}:${check.label}:${check.apiName || check.url}`}
      lang={lang}
      label={uiText(`${check.method} ${check.label}`)}
      ok={check.ok}
      value={formatEndpointValue(check)}
    />
  ));
}

function formatEndpointValue(check: { url: string; ok: boolean; detail?: string; apiName?: string }) {
  const target = check.apiName || check.url;
  if (check.ok) return target;
  return check.detail ? `${target} · ${check.detail}` : target;
}

function formatToolStatus(status?: { ok: boolean; command: string; version?: string; detail?: string }) {
  if (!status) return "-";
  return status.ok ? `${status.command} · ${status.version || "OK"}` : `${status.command} · ${status.detail || "Missing"}`;
}

function youtubeToolsInstruction(lang: Lang, health: YoutubeToolsHealthResponse | null): HealthInstruction {
  const commands = health?.installHint?.length ? health.installHint : [
    "python -m pip install -U yt-dlp openai-whisper",
    "ffmpeg -version",
  ];
  return {
    description: text(lang, "Install yt-dlp, Whisper and FFmpeg for YouTube download/transcript tools.", "Cài yt-dlp, Whisper và FFmpeg để dùng công cụ tải video/lấy transcript YouTube."),
    markdown: [
      "## YouTube Tools",
      "",
      text(lang, "Required background tools:", "Các công cụ nền cần có:"),
      "",
      "- yt-dlp",
      "- Whisper / openai-whisper",
      "- FFmpeg",
      "- Python",
      "",
      "```bash",
      ...commands,
      "```",
      "",
      text(lang, "Optional .env overrides:", "Có thể override trong .env:"),
      "",
      "```env",
      "YOUTUBE_TOOLS_PYTHON=python",
      "YOUTUBE_DLP_EXE=yt-dlp",
      "WHISPER_EXE=whisper",
      "YOUTUBE_COOKIES_FROM_BROWSER=chrome",
      "YOUTUBE_COOKIES_FILE=C:/path/to/youtube-cookies.txt",
      "YOUTUBE_JS_RUNTIME=node",
      "YOUTUBE_TRANSCRIPT_MODEL=base",
      "YOUTUBE_TRANSCRIPT_LANGUAGE=auto",
      "```",
    ].join("\n"),
  };
}

function InstructionDialog(props: { lang: Lang; title: string; failed: boolean; instruction: HealthInstruction }) {
  const pulseClass = props.failed ? "animate-pulse border-amber-400 bg-amber-400/10 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)]" : "";
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="outline" className={pulseClass}>
          <BookOpen className="h-4 w-4" /> {t(props.lang, "settingsInstructionButton")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92vw] overflow-y-auto sm:max-w-none md:w-[75vw]">
        <SheetHeader>
          <SheetTitle>{props.title} · {t(props.lang, "settingsSetupInstructionTitle")}</SheetTitle>
          <SheetDescription>{props.instruction.description}</SheetDescription>
        </SheetHeader>
        <div className="mt-5">
          <SettingsMarkdown markdown={props.instruction.markdown} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
