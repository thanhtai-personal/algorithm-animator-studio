import { BookOpen, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {uiText, t, type Lang} from "@/lib/i18n";
import { StatusTile } from "./SettingsFields";
import type { ElevenLabsConfigResponse, HealthResponse, PiperModel, RvcApplioConfigResponse, SupertonicConfigResponse, VieneuConfigResponse } from "./SettingsTypes";

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
};

export function SettingsHealthTab(props: SettingsHealthTabProps) {
  const systemFailed = Boolean(props.health && (!props.health.ok || !props.health.generatedDir));
  const piperFailed = Boolean(props.health && (!props.health.piperExists || props.availableModels < props.models.length));
  const applioFailed = Boolean(props.rvcApplio && (
    !props.rvcApplio.serverOk ||
    !props.rvcApplio.pythonExists ||
    !props.rvcApplio.bridgeExists ||
    !props.rvcApplio.gradioClientInstalled ||
    !props.rvcApplio.startCommandConfigured ||
    (!props.rvcApplio.argTemplateConfigured && !props.rvcApplio.ttsTemplateConfigured)
  ));
  const supertonicFailed = Boolean(props.supertonic && !props.supertonic.serverOk);
  const vieneuFailed = Boolean(props.vieneu && (!props.vieneu.sdkInstalled || !props.vieneu.pythonExists || !props.vieneu.bridgeExists));
  const elevenLabsFailed = Boolean(props.elevenLabs && !props.elevenLabs.hasApiKey);

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{t(props.lang, "settingsHealthCheckTab")}</CardTitle>
          <CardDescription>{t(props.lang, "settingsHealthDescription")}</CardDescription>
        </div>
        <Button variant="outline" onClick={props.onRefreshHealth} disabled={props.loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> {t(props.lang, "settingsCheckAgain")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <HealthSection title="System" failed={systemFailed} instruction={systemInstruction(props.health)}>
          <StatusTile lang={props.lang} label={uiText("Backend")} ok={Boolean(props.health?.ok)} value={props.health ? t(props.lang, "settingsConnected") : t(props.lang, "settingsNotChecked")} />
          <StatusTile lang={props.lang} label={t(props.lang, "settingsGeneratedData")} ok={Boolean(props.health?.generatedDir)} value={props.health?.generatedDir || "-"} />
        </HealthSection>

        <HealthSection title="Piper" failed={piperFailed} instruction={piperInstruction(props.health, props.models.length)}>
          <StatusTile lang={props.lang} label={uiText("Piper exe")} ok={Boolean(props.health?.piperExists)} value={props.health?.piperExe || "-"} />
          <StatusTile lang={props.lang} label={uiText("Models")} ok={props.availableModels > 0} value={`${props.availableModels}/${props.models.length} ${t(props.lang, "settingsModelsReady")}`} />
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
        </HealthSection>

        <HealthSection title="Applio" failed={applioFailed} instruction={applioInstruction(props.rvcApplio)}>
          <StatusTile lang={props.lang} label={uiText("Applio server")} ok={Boolean(props.rvcApplio?.serverOk)} value={props.rvcApplio?.serverOk ? props.rvcApplio.baseUrl : props.rvcApplio?.error || t(props.lang, "settingsServerNotRunning")} />
          <StatusTile lang={props.lang} label={uiText("Applio Python")} ok={Boolean(props.rvcApplio?.pythonExists && props.rvcApplio?.bridgeExists)} value={`${props.rvcApplio?.pythonExe || "-"} · bridge ${props.rvcApplio?.bridgeExists ? "OK" : t(props.lang, "settingsMissing")}`} />
          <StatusTile
            lang={props.lang}
            label={uiText("Applio gradio_client")}
            ok={Boolean(props.rvcApplio?.gradioClientInstalled)}
            value={props.rvcApplio?.gradioClientInstalled ? "OK" : props.rvcApplio?.gradioClientInstallCommand || props.rvcApplio?.gradioClientCheckError || "npm run applio:install"}
          />
          <StatusTile
            lang={props.lang}
            label={uiText("Applio API template")}
            ok={Boolean(props.rvcApplio?.argTemplateConfigured || props.rvcApplio?.ttsTemplateConfigured)}
            value={props.rvcApplio?.argTemplateConfigured || props.rvcApplio?.ttsTemplateConfigured
              ? `${props.rvcApplio.templates.length} convert · ${props.rvcApplio.ttsTemplates.length} TTS`
              : "server/data/config/rvc-applio-templates.json"}
          />
          <StatusTile lang={props.lang} label={uiText("Applio dev startup")} ok={Boolean(props.rvcApplio?.startCommandConfigured)} value={props.rvcApplio?.startCommandConfigured ? props.rvcApplio.startCommand : "RVC_APPLIO_START_COMMAND"} />
        </HealthSection>

        <HealthSection title="Supertonic" failed={supertonicFailed} instruction={supertonicInstruction(props.supertonic)}>
          <StatusTile lang={props.lang} label={uiText("Supertonic")} ok={Boolean(props.supertonic?.serverOk)} value={props.supertonic?.serverOk ? `${props.supertonic.voices.length} ${t(props.lang, "settingsVoiceTab")} · ${props.supertonic.model}` : props.supertonic?.error || t(props.lang, "settingsServerNotRunning")} />
        </HealthSection>

        <HealthSection title="VieNeu" failed={vieneuFailed} instruction={vieneuInstruction(props.vieneu)}>
          <StatusTile lang={props.lang} label={uiText("VieNeu SDK")} ok={Boolean(props.vieneu?.sdkInstalled)} value={props.vieneu?.sdkInstalled ? `${props.vieneu.mode} · ${props.vieneu.emotion} · ${props.vieneu.version || "SDK OK"}` : props.vieneu?.error || t(props.lang, "settingsMissing")} />
          <StatusTile lang={props.lang} label={uiText("VieNeu Python")} ok={Boolean(props.vieneu?.pythonExists && props.vieneu?.bridgeExists)} value={`${props.vieneu?.pythonExe || "-"} · bridge ${props.vieneu?.bridgeExists ? "OK" : t(props.lang, "settingsMissing")}`} />
        </HealthSection>

        <HealthSection title="ElevenLabs" failed={elevenLabsFailed} instruction={elevenLabsInstruction()}>
          <StatusTile lang={props.lang} label={uiText("ElevenLabs")} ok={Boolean(props.elevenLabs?.hasApiKey)} value={props.elevenLabs?.hasApiKey ? `${props.elevenLabs.voices.length} ${t(props.lang, "settingsVoicesConfigured")}` : t(props.lang, "settingsNoApiKey")} />
        </HealthSection>
      </CardContent>
    </Card>
  );
}

type HealthInstruction = {
  description: string;
  steps: string[];
  commands?: string[];
};

function HealthSection(props: { title: string; failed: boolean; instruction: HealthInstruction; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{props.title}</h3>
        <InstructionDialog title={props.title} failed={props.failed} instruction={props.instruction} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">{props.children}</div>
    </section>
  );
}

function InstructionDialog(props: { title: string; failed: boolean; instruction: HealthInstruction }) {
  const pulseClass = props.failed ? "animate-pulse border-amber-400 bg-amber-400/10 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.25)]" : "";
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" className={pulseClass}>
          <BookOpen className="h-4 w-4" /> Instruction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{props.title} setup instruction</DialogTitle>
          <DialogDescription>{props.instruction.description}</DialogDescription>
        </DialogHeader>
        <ol className="grid gap-2 text-sm text-muted-foreground">
          {props.instruction.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
        </ol>
        {props.instruction.commands?.length ? (
          <div className="grid gap-2">
            {props.instruction.commands.map((command) => (
              <code key={command} className="block rounded-md border bg-muted/50 p-3 text-xs text-foreground">{command}</code>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function systemInstruction(health: HealthResponse | null): HealthInstruction {
  return {
    description: "Backend và thư mục generated data là nền để các service voice ghi file audio/video.",
    steps: [
      "Chạy app bằng npm run dev hoặc mở bản desktop đã build.",
      "Kiểm tra server local còn chạy và tab Settings có thể gọi được /api/health.",
      `Đảm bảo thư mục generated data có quyền ghi: ${health?.generatedDir || "SERVER_DATA_DIR/generated"}.`,
    ],
    commands: ["npm run dev"],
  };
}

function piperInstruction(health: HealthResponse | null, modelCount: number): HealthInstruction {
  return {
    description: "Piper cần file piper.exe và cặp model .onnx/.json trong thư mục model local.",
    steps: [
      "Cấu hình PIPER_EXE trỏ tới piper.exe trong Settings -> Voice.",
      "Đặt các model .onnx và .onnx.json vào MODEL_DIR.",
      `Kiểm tra lại đủ ${modelCount} model đang khai báo trong app.`,
    ],
    commands: [health?.piperExe || "models/.venv/Scripts/piper.exe"],
  };
}

function applioInstruction(config: RvcApplioConfigResponse | null): HealthInstruction {
  return {
    description: "Applio cần server Gradio đang chạy, Python bridge có gradio_client, và template API trong JSON.",
    steps: [
      "Chạy Applio local rồi kiểm tra base URL mở được trên trình duyệt.",
      "Cài gradio_client vào đúng Python env đang cấu hình cho RVC_APPLIO_PYTHON.",
      "Vào Applio Use via API, copy argument order vào server/data/config/rvc-applio-templates.json.",
      "Cấu hình RVC_APPLIO_START_COMMAND nếu muốn app tự khởi động Applio khi dev.",
    ],
    commands: [
      config?.startCommand || "C:/TOOLS/ApplioV3.6.2/run-applio.bat",
      config?.gradioClientInstallCommand || "python -m pip install -U gradio_client",
    ],
  };
}

function supertonicInstruction(config: SupertonicConfigResponse | null): HealthInstruction {
  return {
    description: "Supertonic local cần server TTS chạy trước khi Kai Studio gọi tạo voice.",
    steps: [
      "Khởi động Supertonic local server.",
      "Kiểm tra SUPERTONIC_BASE_URL trỏ đúng host/port.",
      "Đảm bảo model và voice/style đã load trong Supertonic server.",
    ],
    commands: [config?.baseUrl || "http://127.0.0.1:6688"],
  };
}

function vieneuInstruction(config: VieneuConfigResponse | null): HealthInstruction {
  return {
    description: "VieNeu cần Python bridge, SDK/package VieNeu, và Python exe đúng môi trường.",
    steps: [
      "Cài SDK/package VieNeu vào Python env được cấu hình.",
      "Kiểm tra script bridge tồn tại trong repo.",
      "Nếu dùng clone giọng, cấu hình reference audio/text trong Settings -> Voice.",
    ],
    commands: [`${config?.pythonExe || "python"} -m pip install -U vieneu`],
  };
}

function elevenLabsInstruction(): HealthInstruction {
  return {
    description: "ElevenLabs cần API key để gọi cloud TTS.",
    steps: [
      "Tạo hoặc mở API key trong tài khoản ElevenLabs.",
      "Dán key vào Settings -> Voice -> ELEVENLABS_API_KEY.",
      "Cấu hình danh sách voice ID nếu muốn dùng voice riêng.",
    ],
  };
}
