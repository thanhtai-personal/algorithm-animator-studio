import { BookOpen, Bot, CheckCircle2, ChevronsLeft, ChevronsRight, Cloud, Mic2, Radio, RefreshCw, Server, Waves } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {text, uiText, t, type Lang} from "@/lib/i18n";
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

type HealthSectionId = "system" | "piper" | "applio" | "supertonic" | "vieneu" | "elevenlabs";

const HEALTH_SECTIONS: { id: HealthSectionId; label: string; shortLabel: string; icon: typeof Server }[] = [
  { id: "system", label: "System", shortLabel: "S", icon: Server },
  { id: "piper", label: "Piper", shortLabel: "P", icon: Mic2 },
  { id: "applio", label: "Applio", shortLabel: "A", icon: Bot },
  { id: "supertonic", label: "Supertonic", shortLabel: "S", icon: Radio },
  { id: "vieneu", label: "VieNeu", shortLabel: "V", icon: Waves },
  { id: "elevenlabs", label: "ElevenLabs", shortLabel: "E", icon: Cloud },
];

export function SettingsHealthTab(props: SettingsHealthTabProps) {
  const [activeSection, setActiveSection] = useState<HealthSectionId>("system");
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const systemFailed = Boolean(props.health && (!props.health.ok || !props.health.generatedDir));
  const piperFailed = Boolean(props.health && (!props.health.piperExists || props.availableModels < props.models.length));
  const applioFailed = Boolean(props.rvcApplio && (
    !props.rvcApplio.serverOk ||
    !props.rvcApplio.pythonExists ||
    !props.rvcApplio.bridgeExists ||
    !props.rvcApplio.gradioClientInstalled ||
    !props.rvcApplio.startCommandConfigured ||
    !props.rvcApplio.endpointsOk ||
    (!props.rvcApplio.argTemplateConfigured && !props.rvcApplio.ttsTemplateConfigured)
  ));
  const supertonicFailed = Boolean(props.supertonic && (!props.supertonic.serverOk || !props.supertonic.endpointsOk));
  const vieneuFailed = Boolean(props.vieneu && (!props.vieneu.sdkInstalled || !props.vieneu.pythonExists || !props.vieneu.bridgeExists));
  const elevenLabsFailed = Boolean(props.elevenLabs && (!props.elevenLabs.hasApiKey || !props.elevenLabs.endpointsOk));
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
      passed: Boolean(props.rvcApplio && !applioFailed),
      failed: applioFailed,
      instruction: applioInstruction(props.lang, props.rvcApplio),
    },
    supertonic: {
      passed: Boolean(props.supertonic?.serverOk && props.supertonic?.endpointsOk),
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
        <Button variant="outline" onClick={props.onRefreshHealth} disabled={props.loading}>
          <RefreshCw className="mr-2 h-4 w-4" /> {t(props.lang, "settingsCheckAgain")}
        </Button>
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
        <StatusTile lang={props.lang} label={uiText("Supertonic")} ok={Boolean(props.supertonic?.serverOk && props.supertonic?.endpointsOk)} value={props.supertonic?.serverOk ? `${props.supertonic.voices.length} ${t(props.lang, "settingsVoiceTab")} · ${props.supertonic.model}` : props.supertonic?.error || t(props.lang, "settingsServerNotRunning")} />
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

type HealthInstruction = {
  description: string;
  steps: string[];
  commands?: string[];
};

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
        <div className="mt-5 grid gap-5">
          <ol className="grid gap-3 text-sm text-muted-foreground">
            {props.instruction.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
          </ol>
          {props.instruction.commands?.length ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium">{t(props.lang, "settingsInstructionCommandsLabel")}</p>
              {props.instruction.commands.map((command) => (
                <code key={command} className="block break-all rounded-md border bg-muted/50 p-3 text-xs text-foreground">{command}</code>
              ))}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function systemInstruction(lang: Lang, health: HealthResponse | null): HealthInstruction {
  return {
    description: text(lang, "After installing the desktop app, this checks whether Kai Studio can run its bundled local backend and write generated files.", "Sau khi cài app bằng file .exe, mục này kiểm tra Kai Studio có chạy được backend local đi kèm và ghi được file generated hay không."),
    steps: [
      text(lang, "Close Kai Studio and open it again from the installed desktop shortcut.", "Đóng Kai Studio và mở lại từ shortcut desktop đã cài."),
      text(lang, "If Windows Firewall asks for permission, allow the app to run on localhost/private network.", "Nếu Windows Firewall hỏi quyền, cho phép app chạy trên localhost/private network."),
      text(lang, "Open Settings -> Data and choose a generated data folder that your Windows user can write to.", "Mở Settings -> Data và chọn thư mục generated data mà user Windows của bạn có quyền ghi."),
      text(lang, `Avoid protected folders such as Program Files. Current folder: ${health?.generatedDir || "SERVER_DATA_DIR/generated"}.`, `Tránh các thư mục bị bảo vệ như Program Files. Thư mục hiện tại: ${health?.generatedDir || "SERVER_DATA_DIR/generated"}.`),
      text(lang, "Click Save settings, restart the app, then click Check again.", "Bấm Lưu settings, khởi động lại app, rồi bấm Kiểm tra lại."),
    ],
  };
}

function piperInstruction(lang: Lang, health: HealthResponse | null, modelCount: number): HealthInstruction {
  return {
    description: text(lang, "The desktop app does not install Piper voices for you. Install Piper and its voice models, then point Kai Studio to those files.", "App desktop không tự cài Piper voices. Bạn cần cài Piper và tải voice models, rồi trỏ Kai Studio tới các file đó."),
    steps: [
      text(lang, "Download or install Piper for Windows. You need a real piper.exe on the machine.", "Tải hoặc cài Piper cho Windows. Máy cần có tệp piper.exe thật."),
      text(lang, "Create a normal writable folder for voice models, for example C:\\KAI-STUDIO\\models.", "Tạo thư mục thường có quyền ghi để chứa voice models, ví dụ C:\\KAI-STUDIO\\models."),
      text(lang, "Download each required Piper voice as a pair of files: .onnx and .onnx.json.", "Tải mỗi voice Piper cần dùng thành đủ một cặp file: .onnx và .onnx.json."),
      text(lang, "In Kai Studio, open Settings -> Voice and set Piper executable to piper.exe.", "Trong Kai Studio, mở Settings -> Voice và chọn Piper executable là piper.exe."),
      text(lang, "Open Settings -> Data/Voice and set Model directory to the folder that contains the model files.", "Mở Settings -> Data/Voice và cấu hình Model directory tới thư mục chứa model files."),
      text(lang, "Save settings, then click Check again. The Models tile should show all required models ready.", "Lưu settings rồi bấm Kiểm tra lại. Tile Models cần báo đủ model sẵn sàng."),
      text(lang, `Verify all ${modelCount} declared models are ready.`, `Kiểm tra đủ ${modelCount} model đang khai báo trong app.`),
    ],
    commands: [health?.piperExe || "models/.venv/Scripts/piper.exe"],
  };
}

function applioInstruction(lang: Lang, config: RvcApplioConfigResponse | null): HealthInstruction {
  const failedApis = config?.endpointChecks?.filter((check) => !check.ok).map((check) => check.apiName || check.url).join(", ") || "";
  return {
    description: text(lang, "Applio/RVC is an external local tool. Install and run Applio separately, then connect Kai Studio to its Gradio API.", "Applio/RVC là tool local bên ngoài. Bạn cần cài và chạy Applio riêng, rồi kết nối Kai Studio tới Gradio API của nó."),
    steps: [
      text(lang, "Install Applio on Windows in a stable folder, for example C:\\TOOLS\\Applio.", "Cài Applio trên Windows vào một thư mục ổn định, ví dụ C:\\TOOLS\\Applio."),
      text(lang, "Run Applio and keep the Gradio web UI open. Confirm it opens in the browser.", "Chạy Applio và giữ Gradio web UI đang mở. Xác nhận mở được trên trình duyệt."),
      text(lang, "In Kai Studio Settings -> Voice, set RVC/Applio base URL to the Applio URL, usually http://127.0.0.1:6969.", "Trong Kai Studio Settings -> Voice, cấu hình RVC/Applio base URL tới URL Applio, thường là http://127.0.0.1:6969."),
      text(lang, "Set RVC bridge Python to the Python executable inside the Applio environment, not a random system Python.", "Cấu hình RVC bridge Python tới Python executable nằm trong environment của Applio, không dùng Python hệ thống bất kỳ."),
      text(lang, "Install gradio_client into that same Python environment.", "Cài gradio_client vào đúng Python environment đó."),
      failedApis ? text(lang, `Failed Gradio endpoints: ${failedApis}. In Applio open the matching tab, click Use via API, copy the real api_name, then update RVC_APPLIO_API_NAME for voice-to-voice or server/data/config/rvc-applio-templates.json for TTS templates. If Applio does not expose that API, disable/remove that template.`, `Endpoint Gradio đang lỗi: ${failedApis}. Trong Applio mở đúng tab, bấm Use via API, copy api_name thật, rồi cập nhật RVC_APPLIO_API_NAME cho voice-to-voice hoặc server/data/config/rvc-applio-templates.json cho TTS templates. Nếu Applio không expose API đó thì tắt/xoá template tương ứng.`) : text(lang, "In Applio, choose your TTS voice/model or RVC model, open Use via API, then copy the argument order into server/data/config/rvc-applio-templates.json.", "Trong Applio, chọn TTS voice/model hoặc RVC model, mở Use via API, rồi copy đúng thứ tự argument vào server/data/config/rvc-applio-templates.json."),
      text(lang, "Optionally set RVC_APPLIO_START_COMMAND to the .bat file that starts Applio, so Kai Studio can show/run the same startup command.", "Tuỳ chọn cấu hình RVC_APPLIO_START_COMMAND tới file .bat khởi động Applio, để Kai Studio hiển thị/chạy đúng lệnh startup."),
      text(lang, "Save settings, restart Kai Studio if needed, then click Check again.", "Lưu settings, restart Kai Studio nếu cần, rồi bấm Kiểm tra lại."),
    ],
    commands: [
      config?.startCommand || "C:/TOOLS/ApplioV3.6.2/run-applio.bat",
      config?.gradioClientInstallCommand || "python -m pip install -U gradio_client",
    ],
  };
}

function supertonicInstruction(lang: Lang, config: SupertonicConfigResponse | null): HealthInstruction {
  return {
    description: text(lang, "Supertonic is an external local TTS server. Install and start it before generating voice from Kai Studio.", "Supertonic là TTS server local bên ngoài. Bạn cần cài và chạy nó trước khi tạo voice từ Kai Studio."),
    steps: [
      text(lang, "Install the Supertonic local package/server on this machine.", "Cài package/server Supertonic local lên máy này."),
      text(lang, "Start Supertonic and wait until the selected model is fully loaded.", "Khởi động Supertonic và đợi model được load xong."),
      text(lang, "Open its base URL in a browser to confirm the server is alive.", "Mở base URL của nó trên trình duyệt để xác nhận server đang chạy."),
      text(lang, "In Kai Studio Settings -> Voice, set SUPERTONIC_BASE_URL to the running server URL, usually http://127.0.0.1:6688.", "Trong Kai Studio Settings -> Voice, cấu hình SUPERTONIC_BASE_URL tới server đang chạy, thường là http://127.0.0.1:6688."),
      text(lang, "Import or select the voice/style in Kai Studio, save settings, then click Check again.", "Import hoặc chọn voice/style trong Kai Studio, lưu settings, rồi bấm Kiểm tra lại."),
    ],
    commands: [config?.baseUrl || "http://127.0.0.1:6688"],
  };
}

function vieneuInstruction(lang: Lang, config: VieneuConfigResponse | null): HealthInstruction {
  return {
    description: text(lang, "VieNeu is installed as a Python-based local TTS tool. Kai Studio can call it only after the correct Python environment is configured.", "VieNeu là tool TTS local chạy bằng Python. Kai Studio chỉ gọi được sau khi cấu hình đúng Python environment."),
    steps: [
      text(lang, "Install Python if the machine does not already have the version required by VieNeu.", "Cài Python nếu máy chưa có đúng version mà VieNeu yêu cầu."),
      text(lang, "Create a dedicated Python environment for VieNeu to avoid mixing packages with other tools.", "Tạo Python environment riêng cho VieNeu để tránh lẫn package với tool khác."),
      text(lang, "Install VieNeu SDK/package and its model dependencies into that environment.", "Cài VieNeu SDK/package và các dependency model vào environment đó."),
      text(lang, "In Kai Studio Settings -> Voice, set VIENEU_PYTHON to the python.exe inside that environment.", "Trong Kai Studio Settings -> Voice, cấu hình VIENEU_PYTHON tới python.exe nằm trong environment đó."),
      text(lang, "If using voice clone, select reference audio and fill reference text in Settings -> Voice.", "Nếu dùng clone giọng, chọn reference audio và nhập reference text trong Settings -> Voice."),
      text(lang, "Save settings, then click Check again. The VieNeu SDK tile should become ready.", "Lưu settings rồi bấm Kiểm tra lại. Tile VieNeu SDK cần chuyển sang sẵn sàng."),
    ],
    commands: [`${config?.pythonExe || "python"} -m pip install -U vieneu`],
  };
}

function elevenLabsInstruction(lang: Lang): HealthInstruction {
  return {
    description: text(lang, "ElevenLabs is not installed locally, but the desktop app needs your ElevenLabs API key to call the cloud TTS service.", "ElevenLabs không cài local, nhưng app desktop cần API key của bạn để gọi cloud TTS service."),
    steps: [
      text(lang, "Create or open your API key from the ElevenLabs dashboard.", "Tạo hoặc mở API key trong dashboard ElevenLabs."),
      text(lang, "In Kai Studio, open Settings -> API Key or Settings -> Voice.", "Trong Kai Studio, mở Settings -> API Key hoặc Settings -> Voice."),
      text(lang, "Paste the key into ELEVENLABS_API_KEY. This key stays on your machine/runtime settings.", "Dán key vào ELEVENLABS_API_KEY. Key này nằm trên máy/runtime settings của bạn."),
      text(lang, "Add one or more ElevenLabs voice IDs if you want specific voices in the dropdown.", "Thêm một hoặc nhiều ElevenLabs voice ID nếu muốn voice cụ thể xuất hiện trong dropdown."),
      text(lang, "Save settings, then click Check again before generating voice.", "Lưu settings, rồi bấm Kiểm tra lại trước khi tạo voice."),
    ],
  };
}
