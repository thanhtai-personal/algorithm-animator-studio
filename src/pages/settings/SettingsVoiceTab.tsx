import { useState } from "react";
import { Bot, ChevronsLeft, ChevronsRight, Mic2, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t, text, type Lang } from "@/lib/i18n";
import { PathInput, SecretInput, VoiceRowsTable, type VoiceRow } from "./SettingsFields";
import { SettingsApplioTemplateFields } from "./SettingsApplioTemplateFields";
import type { RvcApplioTemplateFileResponse, SettingsForm, SettingsFormKey } from "./SettingsTypes";

type ApplioTemplateField = keyof Pick<RvcApplioTemplateFileResponse, "convertTemplatesJson" | "ttsTemplatesJson">;

type SettingsVoiceTabProps = {
  form: SettingsForm;
  lang: Lang;
  applioTemplates: RvcApplioTemplateFileResponse;
  selecting: string | null;
  voiceRows: VoiceRow[];
  onAddVoiceRow: () => void;
  onOpenPath: (targetPath: string) => void;
  onRemoveVoiceRow: (index: number) => void;
  onSelectPath: (kind: "directory" | "file", target: SettingsFormKey, title: string) => void;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
  onUpdateApplioTemplate: (key: ApplioTemplateField, value: string) => void;
  onUpdateVoiceRow: (index: number, patch: Partial<VoiceRow>) => void;
};

type VoiceSection = "piper" | "elevenlabs" | "supertonic" | "vieneu" | "applio";

const VOICE_SECTIONS: { id: VoiceSection; label: string; shortLabel: string; icon: typeof Mic2 }[] = [
  { id: "piper", label: "Piper", shortLabel: "P", icon: Mic2 },
  { id: "elevenlabs", label: "ElevenLabs", shortLabel: "E", icon: Waves },
  { id: "supertonic", label: "Supertonic", shortLabel: "S", icon: Radio },
  { id: "vieneu", label: "VieNeu", shortLabel: "V", icon: Waves },
  { id: "applio", label: "Applio", shortLabel: "A", icon: Bot },
];

export function SettingsVoiceTab(props: SettingsVoiceTabProps) {
  const [activeSection, setActiveSection] = useState<VoiceSection>("piper");
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsVoiceTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsVoiceDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <aside className={`rounded-lg border border-border bg-muted/30 p-2 transition-[width] duration-200 ${menuCollapsed ? "w-[68px]" : "w-full lg:w-56"}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              {!menuCollapsed ? <span className="px-2 text-xs font-semibold text-muted-foreground">{text(props.lang, "Voice providers", "Provider voice")}</span> : null}
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMenuCollapsed((value) => !value)}>
                {menuCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            </div>
            <nav className="grid gap-1" aria-label={text(props.lang, "Voice provider settings", "Cài đặt provider voice")}>
              {VOICE_SECTIONS.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={[
                      "flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                      selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                      menuCollapsed ? "justify-center" : "justify-start",
                    ].join(" ")}
                    title={section.label}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {menuCollapsed ? <span className="sr-only">{section.label}</span> : <span>{section.label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {activeSection === "piper" ? (
            <div className="space-y-5">
            <PathInput
              id="model-dir"
              label={t(props.lang, "settingsModelDirLabel")}
              description={t(props.lang, "settingsModelDirDescription")}
              lang={props.lang}
              value={props.form.MODEL_DIR}
              placeholder="models"
              busy={props.selecting === "MODEL_DIR"}
              onChange={(value) => props.onUpdateField("MODEL_DIR", value)}
              onSelect={() => props.onSelectPath("directory", "MODEL_DIR", t(props.lang, "settingsSelectPiperModelsFolder"))}
              onOpen={() => props.onOpenPath(props.form.MODEL_DIR)}
            />
            <PathInput
              id="piper-exe"
              label={t(props.lang, "settingsPiperExeLabel")}
              description={t(props.lang, "settingsPiperExeDescription")}
              lang={props.lang}
              value={props.form.PIPER_EXE}
              placeholder="models/.venv/Scripts/piper.exe"
              busy={props.selecting === "PIPER_EXE"}
              onChange={(value) => props.onUpdateField("PIPER_EXE", value)}
              onSelect={() => props.onSelectPath("file", "PIPER_EXE", t(props.lang, "settingsSelectPiperExe"))}
              onOpen={() => props.onOpenPath(props.form.PIPER_EXE)}
            />
            </div>
            ) : null}

            {activeSection === "elevenlabs" ? (
            <div className="space-y-5">
            <SecretInput
              id="elevenlabs-api-key-voice"
              label={t(props.lang, "settingsElevenLabsApiKeyLabel")}
              description={t(props.lang, "settingsElevenLabsApiKeyDescription")}
              value={props.form.ELEVENLABS_API_KEY}
              placeholder="sk_..."
              onChange={(value) => props.onUpdateField("ELEVENLABS_API_KEY", value)}
            />
            <VoiceRowsTable rows={props.voiceRows} lang={props.lang} onAdd={props.onAddVoiceRow} onUpdate={props.onUpdateVoiceRow} onRemove={props.onRemoveVoiceRow} />
            </div>
            ) : null}

            {activeSection === "supertonic" ? (
            <div className="space-y-5">
            <SecretInput
              id="supertonic-base-url-voice"
              label={t(props.lang, "settingsSupertonicBaseUrlLabel")}
              description={t(props.lang, "settingsSupertonicBaseUrlDescription")}
              value={props.form.SUPERTONIC_BASE_URL}
              placeholder="http://127.0.0.1:6688"
              type="text"
              onChange={(value) => props.onUpdateField("SUPERTONIC_BASE_URL", value)}
            />
            <SecretInput
              id="supertonic-model-voice"
              label={t(props.lang, "settingsSupertonicModelLabel")}
              description={t(props.lang, "settingsSupertonicModelDescription")}
              value={props.form.SUPERTONIC_MODEL}
              placeholder="supertonic-3"
              type="text"
              onChange={(value) => props.onUpdateField("SUPERTONIC_MODEL", value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SecretInput
                id="supertonic-health-endpoint"
                label={text(props.lang, "Health endpoint", "Endpoint health")}
                description={text(props.lang, "GET endpoint used by health check.", "Endpoint GET dùng cho health check.")}
                value={props.form.SUPERTONIC_HEALTH_ENDPOINT}
                placeholder="/v1/health"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_HEALTH_ENDPOINT", value)}
              />
              <SecretInput
                id="supertonic-styles-endpoint"
                label={text(props.lang, "Styles endpoint", "Endpoint styles")}
                description={text(props.lang, "GET endpoint used to list Supertonic voices/styles.", "Endpoint GET dùng để lấy danh sách voice/style Supertonic.")}
                value={props.form.SUPERTONIC_STYLES_ENDPOINT}
                placeholder="/v1/styles"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_STYLES_ENDPOINT", value)}
              />
              <SecretInput
                id="supertonic-import-style-endpoint"
                label={text(props.lang, "Import style endpoint", "Endpoint import style")}
                description={text(props.lang, "POST endpoint used when importing a voice/style JSON.", "Endpoint POST dùng khi import voice/style JSON.")}
                value={props.form.SUPERTONIC_IMPORT_STYLE_ENDPOINT}
                placeholder="/v1/styles/import"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_IMPORT_STYLE_ENDPOINT", value)}
              />
              <SecretInput
                id="supertonic-tts-endpoint"
                label={text(props.lang, "TTS endpoint", "Endpoint TTS")}
                description={text(props.lang, "POST endpoint used to generate Supertonic audio.", "Endpoint POST dùng để tạo audio Supertonic.")}
                value={props.form.SUPERTONIC_TTS_ENDPOINT}
                placeholder="/v1/tts"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_TTS_ENDPOINT", value)}
              />
            </div>
            </div>
            ) : null}

            {activeSection === "vieneu" ? (
            <div className="space-y-5">
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
              {text(props.lang, "VieNeu-TTS is a local Vietnamese TTS SDK provider. It runs through Python, so health check must show Python, bridge and SDK as OK.", "VieNeu-TTS là provider TTS tiếng Việt local chạy qua Python SDK. Health check cần báo Python, bridge và SDK đều OK.")}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <PathInput
                id="vieneu-python"
                label={text(props.lang, "VieNeu Python", "Python chạy VieNeu")}
                description={text(props.lang, "python/python.exe inside the environment where package vieneu is installed.", "python/python.exe trong môi trường đã cài package vieneu.")}
                lang={props.lang}
                value={props.form.VIENEU_PYTHON}
                placeholder="python"
                busy={props.selecting === "VIENEU_PYTHON"}
                onChange={(value) => props.onUpdateField("VIENEU_PYTHON", value)}
                onSelect={() => props.onSelectPath("file", "VIENEU_PYTHON", "Select VieNeu Python")}
                onOpen={() => props.onOpenPath(props.form.VIENEU_PYTHON)}
              />
              <SecretInput
                id="vieneu-mode"
                label="VieNeu mode"
                description={text(props.lang, "Use turbo for CPU tests, standard for higher quality, remote for a VieNeu server.", "Dùng turbo để test CPU, standard cho chất lượng cao hơn, remote khi có VieNeu server.")}
                value={props.form.VIENEU_MODE}
                placeholder="turbo"
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_MODE", value)}
              />
              <SecretInput
                id="vieneu-emotion"
                label="VieNeu emotion"
                description={text(props.lang, "Common values: natural or storytelling.", "Giá trị thường dùng: natural hoặc storytelling.")}
                value={props.form.VIENEU_EMOTION}
                placeholder="natural"
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_EMOTION", value)}
              />
              <SecretInput
                id="vieneu-default-voice-id"
                label={text(props.lang, "Preset voice ID", "ID giọng preset")}
                description={text(props.lang, "Optional. Leave empty to use VieNeu default voice.", "Không bắt buộc. Để trống để dùng giọng mặc định của VieNeu.")}
                value={props.form.VIENEU_DEFAULT_VOICE_ID}
                placeholder=""
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_DEFAULT_VOICE_ID", value)}
              />
              <PathInput
                id="vieneu-reference-audio"
                label={text(props.lang, "Reference audio", "Audio mẫu clone giọng")}
                description={text(props.lang, "Optional WAV/MP3 reference audio for zero-shot voice cloning.", "Không bắt buộc. WAV/MP3 mẫu để clone giọng zero-shot.")}
                lang={props.lang}
                value={props.form.VIENEU_REFERENCE_AUDIO}
                placeholder="C:/voices/my-voice.wav"
                busy={props.selecting === "VIENEU_REFERENCE_AUDIO"}
                onChange={(value) => props.onUpdateField("VIENEU_REFERENCE_AUDIO", value)}
                onSelect={() => props.onSelectPath("file", "VIENEU_REFERENCE_AUDIO", "Select VieNeu reference audio")}
                onOpen={() => props.onOpenPath(props.form.VIENEU_REFERENCE_AUDIO)}
              />
              <SecretInput
                id="vieneu-timeout"
                label="VieNeu timeout ms"
                description={text(props.lang, "First run may download/load models, so keep this high.", "Lần đầu có thể tải/load model nên để timeout cao.")}
                value={props.form.VIENEU_TIMEOUT_MS}
                placeholder="1200000"
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_TIMEOUT_MS", value)}
              />
            </div>
            <div>
              <Label htmlFor="vieneu-reference-text">{text(props.lang, "Reference text", "Text khớp với audio mẫu")}</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {text(props.lang, "Optional but recommended for standard mode cloning. Type the exact sentence spoken in the reference audio.", "Không bắt buộc nhưng nên có khi clone giọng ở standard mode. Gõ đúng câu được nói trong audio mẫu.")}
              </p>
              <Textarea
                id="vieneu-reference-text"
                className="mt-2 min-h-[90px]"
                value={props.form.VIENEU_REFERENCE_TEXT}
                placeholder="Tôi đang thu một đoạn âm thanh mẫu để clone giọng."
                onChange={(event) => props.onUpdateField("VIENEU_REFERENCE_TEXT", event.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <SecretInput
                id="vieneu-remote-api"
                label="Remote API base"
                description={text(props.lang, "Only used when VIENEU_MODE=remote.", "Chỉ dùng khi VIENEU_MODE=remote.")}
                value={props.form.VIENEU_REMOTE_API_BASE}
                placeholder="http://127.0.0.1:23333/v1"
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_REMOTE_API_BASE", value)}
              />
              <SecretInput
                id="vieneu-remote-model"
                label="Remote model"
                description={text(props.lang, "Model name for remote VieNeu server.", "Tên model cho VieNeu server remote.")}
                value={props.form.VIENEU_REMOTE_MODEL}
                placeholder="pnnbao-ump/VieNeu-TTS-v2"
                type="text"
                onChange={(value) => props.onUpdateField("VIENEU_REMOTE_MODEL", value)}
              />
            </div>
            </div>
            ) : null}

            {activeSection === "applio" ? (
            <div className="space-y-5">
            <p className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm text-yellow-100">
              {text(props.lang, "Applio/RVC converts generated audio from Piper, ElevenLabs, Supertonic, or VieNeu into a trained custom voice.", "Applio/RVC chuyển audio đã tạo từ Piper, ElevenLabs, Supertonic hoặc VieNeu sang custom voice đã train.")}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <SecretInput
                id="rvc-applio-base-url"
                label={t(props.lang, "settingsRvcApplioBaseUrlLabel")}
                description={t(props.lang, "settingsRvcApplioBaseUrlDescription")}
                value={props.form.RVC_APPLIO_BASE_URL}
                placeholder="http://127.0.0.1:6969"
                type="text"
                onChange={(value) => props.onUpdateField("RVC_APPLIO_BASE_URL", value)}
              />
              <SecretInput
                id="rvc-applio-start-command"
                label={text(props.lang, "Applio start command", "Lệnh chạy Applio")}
                description={text(props.lang, "Command run by npm run dev, for example C:/Applio/run-applio.bat.", "Lệnh được chạy cùng npm run dev, ví dụ C:/Applio/run-applio.bat.")}
                value={props.form.RVC_APPLIO_START_COMMAND}
                placeholder="C:/Applio/run-applio.bat"
                type="text"
                onChange={(value) => props.onUpdateField("RVC_APPLIO_START_COMMAND", value)}
              />
              <SecretInput
                id="rvc-applio-api-name"
                label={t(props.lang, "settingsRvcApplioApiNameLabel")}
                description={t(props.lang, "settingsRvcApplioApiNameDescription")}
                value={props.form.RVC_APPLIO_API_NAME}
                placeholder="/enforce_terms"
                type="text"
                onChange={(value) => props.onUpdateField("RVC_APPLIO_API_NAME", value)}
              />
              <PathInput
                id="rvc-applio-python"
                label={t(props.lang, "settingsRvcApplioPythonLabel")}
                description={text(props.lang, "python or python.exe inside the Applio environment.", "python hoặc python.exe trong môi trường Applio.")}
                lang={props.lang}
                value={props.form.RVC_APPLIO_PYTHON}
                placeholder="python"
                busy={props.selecting === "RVC_APPLIO_PYTHON"}
                onChange={(value) => props.onUpdateField("RVC_APPLIO_PYTHON", value)}
                onSelect={() => props.onSelectPath("file", "RVC_APPLIO_PYTHON", "Select RVC bridge Python")}
                onOpen={() => props.onOpenPath(props.form.RVC_APPLIO_PYTHON)}
              />
            </div>
            <SettingsApplioTemplateFields lang={props.lang} templates={props.applioTemplates} onUpdate={props.onUpdateApplioTemplate} />
            </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
