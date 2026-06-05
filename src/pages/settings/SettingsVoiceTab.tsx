import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
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

export function SettingsVoiceTab(props: SettingsVoiceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsVoiceTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsVoiceDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
        <VoiceRowsTable rows={props.voiceRows} lang={props.lang} onAdd={props.onAddVoiceRow} onUpdate={props.onUpdateVoiceRow} onRemove={props.onRemoveVoiceRow} />
        <div className="grid gap-3 md:grid-cols-2">
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

        <div className="rounded-lg border border-border/70 p-3">
          <p className="mb-3 text-sm font-medium">RVC/Applio</p>
          <p className="mb-3 text-xs text-muted-foreground">{t(props.lang, "settingsRvcApplioVoiceDescription")}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <SecretInput
              id="rvc-applio-python"
              label={t(props.lang, "settingsRvcApplioPythonLabel")}
              description="python hoặc đường dẫn python.exe trong môi trường Applio."
              value={props.form.RVC_APPLIO_PYTHON}
              placeholder="python"
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_PYTHON", value)}
            />
            <SecretInput
              id="rvc-applio-source-piper"
              label={t(props.lang, "settingsRvcApplioSourcePiperLabel")}
              description="Model Piper dùng tạo audio nguồn trước khi convert."
              value={props.form.RVC_APPLIO_SOURCE_PIPER_MODEL}
              placeholder="vi_vais1000"
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_SOURCE_PIPER_MODEL", value)}
            />
            <SecretInput
              id="rvc-applio-model-name"
              label={t(props.lang, "settingsRvcApplioModelNameLabel")}
              description="Tên .pth/model đúng như endpoint Gradio yêu cầu."
              value={props.form.RVC_APPLIO_MODEL_NAME}
              placeholder="my_voice.pth"
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_MODEL_NAME", value)}
            />
            <PathInput
              id="rvc-applio-index-path"
              label={t(props.lang, "settingsRvcApplioIndexPathLabel")}
              description="File .index của model RVC, có thể để trống nếu model không dùng index."
              lang={props.lang}
              value={props.form.RVC_APPLIO_INDEX_PATH}
              placeholder="C:/Applio/logs/my_voice/added_...index"
              busy={props.selecting === "RVC_APPLIO_INDEX_PATH"}
              onChange={(value) => props.onUpdateField("RVC_APPLIO_INDEX_PATH", value)}
              onSelect={() => props.onSelectPath("file", "RVC_APPLIO_INDEX_PATH", "Select RVC index file")}
              onOpen={() => props.onOpenPath(props.form.RVC_APPLIO_INDEX_PATH)}
            />
            <SecretInput
              id="rvc-applio-pitch"
              label={t(props.lang, "settingsRvcApplioPitchLabel")}
              description="0 nếu cùng giới/tông; tăng/giảm theo semitone khi cần."
              value={props.form.RVC_APPLIO_PITCH}
              placeholder="0"
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_PITCH", value)}
            />
            <SecretInput
              id="rvc-applio-f0"
              label={t(props.lang, "settingsRvcApplioF0MethodLabel")}
              description="Thường dùng rmvpe cho speech."
              value={props.form.RVC_APPLIO_F0_METHOD}
              placeholder="rmvpe"
              type="text"
              onChange={(value) => props.onUpdateField("RVC_APPLIO_F0_METHOD", value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
