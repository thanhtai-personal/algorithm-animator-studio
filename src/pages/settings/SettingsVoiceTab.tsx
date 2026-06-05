import { useState } from "react";
import { Bot, ChevronsLeft, ChevronsRight, Mic2, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t, text, type Lang } from "@/lib/i18n";
import { PathInput, SecretInput, VoiceRowsTable, type VoiceRow } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsVoiceTabProps = {
  form: SettingsForm;
  lang: Lang;
  selecting: string | null;
  voiceRows: VoiceRow[];
  onAddVoiceRow: () => void;
  onOpenPath: (targetPath: string) => void;
  onRemoveVoiceRow: (index: number) => void;
  onSelectPath: (kind: "directory" | "file", target: SettingsFormKey, title: string) => void;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
  onUpdateVoiceRow: (index: number, patch: Partial<VoiceRow>) => void;
};

type VoiceSection = "piper" | "elevenlabs" | "supertonic" | "applio";

const VOICE_SECTIONS: { id: VoiceSection; label: string; shortLabel: string; icon: typeof Mic2 }[] = [
  { id: "piper", label: "Piper", shortLabel: "P", icon: Mic2 },
  { id: "elevenlabs", label: "ElevenLabs", shortLabel: "E", icon: Waves },
  { id: "supertonic", label: "Supertonic", shortLabel: "S", icon: Radio },
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
            <div className="grid gap-3 md:grid-cols-3">
              <SecretInput
                id="supertonic-model-voice"
                label={t(props.lang, "settingsSupertonicModelLabel")}
                description={t(props.lang, "settingsSupertonicModelDescription")}
                value={props.form.SUPERTONIC_MODEL}
                placeholder="supertonic-3"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_MODEL", value)}
              />
              <SecretInput
                id="supertonic-default-voice"
                label={t(props.lang, "settingsSupertonicDefaultVoiceLabel")}
                description={t(props.lang, "settingsDefaultVoiceDescription")}
                value={props.form.SUPERTONIC_DEFAULT_VOICE}
                placeholder="M1"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_DEFAULT_VOICE", value)}
              />
              <SecretInput
                id="supertonic-total-steps"
                label={t(props.lang, "settingsSupertonicTotalStepsLabel")}
                description={t(props.lang, "settingsTotalStepsDescription")}
                value={props.form.SUPERTONIC_TOTAL_STEPS}
                placeholder="8"
                type="text"
                onChange={(value) => props.onUpdateField("SUPERTONIC_TOTAL_STEPS", value)}
              />
            </div>
            </div>
            ) : null}

            {activeSection === "applio" ? (
            <div className="space-y-5">
            <p className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm text-yellow-100">
              {text(props.lang, "Applio/RVC converts generated audio from Piper, ElevenLabs, or Supertonic into a trained custom voice.", "Applio/RVC chuyển audio đã tạo từ Piper, ElevenLabs hoặc Supertonic sang custom voice đã train.")}
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
                placeholder="/infer_convert"
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
            <SecretInput
              id="rvc-applio-arg-template"
              label={t(props.lang, "settingsRvcApplioArgTemplateLabel")}
              description={t(props.lang, "settingsRvcApplioArgTemplateDescription")}
              value={props.form.RVC_APPLIO_ARG_TEMPLATE_JSON}
              placeholder='[0,"${input}","${model}","${index}","${f0_method}","${index_rate}","${filter_radius}",0,0.25,"${protect}","wav"]'
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_ARG_TEMPLATE_JSON", value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <SecretInput
                id="rvc-applio-model-name"
                label={t(props.lang, "settingsRvcApplioModelNameLabel")}
                description={text(props.lang, "Target .pth/model name expected by the Gradio endpoint.", "Tên .pth/model đích đúng với endpoint Gradio.")}
                value={props.form.RVC_APPLIO_MODEL_NAME}
                placeholder="my_voice.pth"
                type="text"
                onChange={(value) => props.onUpdateField("RVC_APPLIO_MODEL_NAME", value)}
              />
              <PathInput
                id="rvc-applio-index-path"
                label={t(props.lang, "settingsRvcApplioIndexPathLabel")}
                description={text(props.lang, "Optional .index file for the RVC model.", "File .index tùy chọn của model RVC.")}
                lang={props.lang}
                value={props.form.RVC_APPLIO_INDEX_PATH}
                placeholder="C:/Applio/logs/my_voice/added_...index"
                busy={props.selecting === "RVC_APPLIO_INDEX_PATH"}
                onChange={(value) => props.onUpdateField("RVC_APPLIO_INDEX_PATH", value)}
                onSelect={() => props.onSelectPath("file", "RVC_APPLIO_INDEX_PATH", "Select RVC index file")}
                onOpen={() => props.onOpenPath(props.form.RVC_APPLIO_INDEX_PATH)}
              />
              <SecretInput id="rvc-applio-pitch" label={t(props.lang, "settingsRvcApplioPitchLabel")} description="Semitone pitch shift." value={props.form.RVC_APPLIO_PITCH} placeholder="0" type="text" onChange={(value) => props.onUpdateField("RVC_APPLIO_PITCH", value)} />
              <SecretInput id="rvc-applio-f0" label={t(props.lang, "settingsRvcApplioF0MethodLabel")} description="rmvpe is usually best for speech." value={props.form.RVC_APPLIO_F0_METHOD} placeholder="rmvpe" type="text" onChange={(value) => props.onUpdateField("RVC_APPLIO_F0_METHOD", value)} />
              <SecretInput id="rvc-applio-index-rate" label="RVC index rate" description="0.5-0.8 is a practical range for speech." value={props.form.RVC_APPLIO_INDEX_RATE} placeholder="0.75" type="text" onChange={(value) => props.onUpdateField("RVC_APPLIO_INDEX_RATE", value)} />
              <SecretInput id="rvc-applio-protect" label="RVC protect" description="Higher values preserve consonants and reduce artifacts." value={props.form.RVC_APPLIO_PROTECT} placeholder="0.33" type="text" onChange={(value) => props.onUpdateField("RVC_APPLIO_PROTECT", value)} />
              <SecretInput id="rvc-applio-filter-radius" label="RVC filter radius" description="F0 smoothing radius, default 3." value={props.form.RVC_APPLIO_FILTER_RADIUS} placeholder="3" type="text" onChange={(value) => props.onUpdateField("RVC_APPLIO_FILTER_RADIUS", value)} />
            </div>
            </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
